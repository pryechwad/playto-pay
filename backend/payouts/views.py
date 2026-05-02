import uuid
from datetime import timedelta

from django.db import transaction, IntegrityError
from django.db.models import Sum, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from ledger.models import LedgerEntry
from merchants.models import BankAccount, Merchant
from payouts.models import IdempotencyKey, Payout
from payouts.tasks import process_payout

IDEMPOTENCY_KEY_TTL_HOURS = 24


class PayoutCreateView(APIView):
    def post(self, request, merchant_id):
        idempotency_key = request.headers.get('Idempotency-Key', '').strip()
        if not idempotency_key:
            return Response({'error': 'Idempotency-Key header required'}, status=400)

        try:
            merchant = Merchant.objects.get(id=merchant_id)
        except Merchant.DoesNotExist:
            return Response({'error': 'Merchant not found'}, status=404)

        # Check for existing non-expired idempotency key BEFORE acquiring any lock
        expiry = timezone.now() - timedelta(hours=IDEMPOTENCY_KEY_TTL_HOURS)
        existing = IdempotencyKey.objects.filter(
            merchant=merchant,
            key=idempotency_key,
            created_at__gte=expiry,
        ).select_related('payout').first()

        if existing:
            return Response(existing.response_body, status=existing.response_status)

        amount_paise = request.data.get('amount_paise')
        bank_account_id = request.data.get('bank_account_id')

        if not amount_paise or not bank_account_id:
            return Response({'error': 'amount_paise and bank_account_id are required'}, status=400)

        try:
            amount_paise = int(amount_paise)
        except (TypeError, ValueError):
            return Response({'error': 'amount_paise must be an integer'}, status=400)

        if amount_paise <= 0:
            return Response({'error': 'amount_paise must be positive'}, status=400)

        try:
            bank_account = BankAccount.objects.get(id=bank_account_id, merchant=merchant)
        except BankAccount.DoesNotExist:
            return Response({'error': 'Bank account not found'}, status=404)

        try:
            payout, response_body, response_status_code = _create_payout_atomic(
                merchant, bank_account, amount_paise, idempotency_key
            )
        except _InsufficientFunds:
            resp_body = {'error': 'Insufficient balance'}
            resp_status = 422
            _store_idempotency_key(merchant, idempotency_key, resp_status, resp_body, payout=None)
            return Response(resp_body, status=resp_status)
        except IntegrityError:
            # Race on idempotency key unique constraint — another request with same key just won
            existing = IdempotencyKey.objects.filter(merchant=merchant, key=idempotency_key).first()
            if existing:
                return Response(existing.response_body, status=existing.response_status)
            return Response({'error': 'Conflict'}, status=409)

        try:
            process_payout.delay(str(payout.id))
        except Exception:
            pass  # No Redis on free tier — payout stays pending, lifecycle works locally
        return Response(response_body, status=response_status_code)


class _InsufficientFunds(Exception):
    pass


def _create_payout_atomic(merchant, bank_account, amount_paise, idempotency_key):
    """
    Uses a savepoint (atomic() nested inside the caller's implicit transaction)
    so that raising _InsufficientFunds rolls back only this savepoint, leaving
    the outer connection usable for the idempotency key write in the caller.
    """
    with transaction.atomic():  # creates a savepoint if already in a transaction
        locked_merchant = Merchant.objects.select_for_update().get(id=merchant.id)

        available = _get_available_balance(locked_merchant)

        if available < amount_paise:
            raise _InsufficientFunds()

        payout = Payout.objects.create(
            merchant=locked_merchant,
            bank_account=bank_account,
            amount_paise=amount_paise,
            status=Payout.PENDING,
        )

        LedgerEntry.objects.create(
            merchant=locked_merchant,
            entry_type=LedgerEntry.DEBIT,
            amount_paise=amount_paise,
            description=f"Hold for payout {payout.id}",
            payout_id=payout.id,
        )

        response_body = _payout_to_dict(payout)
        response_status_code = status.HTTP_201_CREATED

        _store_idempotency_key(locked_merchant, idempotency_key, response_status_code, response_body, payout)

    return payout, response_body, response_status_code


def _get_available_balance(merchant):
    """
    Database-level aggregation — never fetches rows into Python for arithmetic.
    Returns credits - debits in paise.
    """
    result = LedgerEntry.objects.filter(merchant=merchant).aggregate(
        total_credits=Sum('amount_paise', filter=Q(entry_type=LedgerEntry.CREDIT)),
        total_debits=Sum('amount_paise', filter=Q(entry_type=LedgerEntry.DEBIT)),
    )
    credits = result['total_credits'] or 0
    debits = result['total_debits'] or 0
    return credits - debits


def _store_idempotency_key(merchant, key, resp_status, resp_body, payout):
    IdempotencyKey.objects.get_or_create(
        merchant=merchant,
        key=key,
        defaults={
            'response_status': resp_status,
            'response_body': resp_body,
            'payout': payout,
        }
    )


def _payout_to_dict(payout):
    return {
        'id': str(payout.id),
        'merchant_id': str(payout.merchant_id),
        'bank_account_id': str(payout.bank_account_id),
        'amount_paise': payout.amount_paise,
        'status': payout.status,
        'attempt_count': payout.attempt_count,
        'created_at': payout.created_at.isoformat(),
        'updated_at': payout.updated_at.isoformat(),
        'processing_started_at': payout.processing_started_at.isoformat() if payout.processing_started_at else None,
    }


class PayoutListView(APIView):
    def get(self, request, merchant_id):
        try:
            merchant = Merchant.objects.get(id=merchant_id)
        except Merchant.DoesNotExist:
            return Response({'error': 'Merchant not found'}, status=404)

        payouts = Payout.objects.filter(merchant=merchant).order_by('-created_at')[:50]
        return Response([_payout_to_dict(p) for p in payouts])

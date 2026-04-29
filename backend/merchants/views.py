from django.db.models import Sum, Q
from rest_framework.response import Response
from rest_framework.views import APIView

from ledger.models import LedgerEntry
from merchants.models import Merchant, BankAccount
from payouts.models import Payout


class MerchantListView(APIView):
    def get(self, request):
        merchants = Merchant.objects.all().order_by('name')
        return Response([
            {'id': str(m.id), 'name': m.name, 'email': m.email}
            for m in merchants
        ])


class MerchantBalanceView(APIView):
    def get(self, request, merchant_id):
        try:
            merchant = Merchant.objects.get(id=merchant_id)
        except Merchant.DoesNotExist:
            return Response({'error': 'Merchant not found'}, status=404)

        result = LedgerEntry.objects.filter(merchant=merchant).aggregate(
            total_credits=Sum('amount_paise', filter=Q(entry_type=LedgerEntry.CREDIT)),
            total_debits=Sum('amount_paise', filter=Q(entry_type=LedgerEntry.DEBIT)),
        )
        credits = result['total_credits'] or 0
        debits = result['total_debits'] or 0
        available = credits - debits

        # Held = sum of pending/processing payout amounts
        held = Payout.objects.filter(
            merchant=merchant,
            status__in=[Payout.PENDING, Payout.PROCESSING],
        ).aggregate(total=Sum('amount_paise'))['total'] or 0

        return Response({
            'merchant_id': str(merchant.id),
            'merchant_name': merchant.name,
            'available_paise': available,
            'held_paise': held,
            'total_credits_paise': credits,
            'total_debits_paise': debits,
        })


class MerchantLedgerView(APIView):
    def get(self, request, merchant_id):
        try:
            merchant = Merchant.objects.get(id=merchant_id)
        except Merchant.DoesNotExist:
            return Response({'error': 'Merchant not found'}, status=404)

        entries = LedgerEntry.objects.filter(merchant=merchant).order_by('-created_at')[:50]
        return Response([
            {
                'id': str(e.id),
                'entry_type': e.entry_type,
                'amount_paise': e.amount_paise,
                'description': e.description,
                'payout_id': str(e.payout_id) if e.payout_id else None,
                'created_at': e.created_at.isoformat(),
            }
            for e in entries
        ])


class MerchantBankAccountsView(APIView):
    def get(self, request, merchant_id):
        try:
            merchant = Merchant.objects.get(id=merchant_id)
        except Merchant.DoesNotExist:
            return Response({'error': 'Merchant not found'}, status=404)

        accounts = BankAccount.objects.filter(merchant=merchant)
        return Response([
            {
                'id': str(a.id),
                'account_number': a.account_number,
                'ifsc_code': a.ifsc_code,
                'account_holder_name': a.account_holder_name,
                'is_primary': a.is_primary,
            }
            for a in accounts
        ])

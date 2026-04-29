import threading
import uuid
from django.test import TestCase, TransactionTestCase
from django.test import Client

from merchants.models import Merchant, BankAccount
from ledger.models import LedgerEntry
from payouts.models import Payout, IdempotencyKey


def _create_merchant_with_balance(balance_paise):
    merchant = Merchant.objects.create(
        name='Test Merchant',
        email=f'test-{uuid.uuid4()}@example.com',
    )
    bank = BankAccount.objects.create(
        merchant=merchant,
        account_number='1234567890',
        ifsc_code='HDFC0001234',
        account_holder_name='Test Merchant',
        is_primary=True,
    )
    LedgerEntry.objects.create(
        merchant=merchant,
        entry_type=LedgerEntry.CREDIT,
        amount_paise=balance_paise,
        description='Initial credit',
    )
    return merchant, bank


class ConcurrencyTest(TransactionTestCase):
    """
    Two simultaneous 60-rupee payout requests against a 100-rupee balance.
    Exactly one must succeed; the other must be rejected with 422.
    Uses TransactionTestCase so each thread sees committed data.
    """

    def test_concurrent_overdraw_rejected(self):
        merchant, bank = _create_merchant_with_balance(10000)  # 100 rupees = 10000 paise

        client = Client()
        results = []
        barrier = threading.Barrier(2)

        def make_request(idempotency_key):
            barrier.wait()  # both threads hit the endpoint simultaneously
            response = client.post(
                f'/api/v1/merchants/{merchant.id}/payouts/',
                data={'amount_paise': 6000, 'bank_account_id': str(bank.id)},
                content_type='application/json',
                headers={'Idempotency-Key': idempotency_key},
            )
            results.append(response.status_code)

        t1 = threading.Thread(target=make_request, args=(str(uuid.uuid4()),))
        t2 = threading.Thread(target=make_request, args=(str(uuid.uuid4()),))
        t1.start()
        t2.start()
        t1.join()
        t2.join()

        successes = results.count(201)
        rejections = results.count(422)

        self.assertEqual(successes, 1, f"Expected 1 success, got {successes}. Results: {results}")
        self.assertEqual(rejections, 1, f"Expected 1 rejection, got {rejections}. Results: {results}")

        # Ledger invariant: balance must never go negative
        from django.db.models import Sum, Q
        agg = LedgerEntry.objects.filter(merchant=merchant).aggregate(
            credits=Sum('amount_paise', filter=Q(entry_type=LedgerEntry.CREDIT)),
            debits=Sum('amount_paise', filter=Q(entry_type=LedgerEntry.DEBIT)),
        )
        balance = (agg['credits'] or 0) - (agg['debits'] or 0)
        self.assertGreaterEqual(balance, 0, "Balance went negative — overdraw occurred")


class IdempotencyTest(TestCase):
    """
    Two requests with the same Idempotency-Key must return identical responses
    and create exactly one payout.
    """

    def test_same_key_returns_same_response(self):
        merchant, bank = _create_merchant_with_balance(100000)
        client = Client()
        key = str(uuid.uuid4())

        payload = {'amount_paise': 5000, 'bank_account_id': str(bank.id)}
        headers = {'Idempotency-Key': key}

        r1 = client.post(
            f'/api/v1/merchants/{merchant.id}/payouts/',
            data=payload,
            content_type='application/json',
            headers=headers,
        )
        r2 = client.post(
            f'/api/v1/merchants/{merchant.id}/payouts/',
            data=payload,
            content_type='application/json',
            headers=headers,
        )

        self.assertEqual(r1.status_code, 201)
        self.assertEqual(r2.status_code, 201)
        self.assertEqual(r1.json(), r2.json(), "Idempotent responses must be identical")

        payout_count = Payout.objects.filter(merchant=merchant).count()
        self.assertEqual(payout_count, 1, "Duplicate payout was created")

    def test_different_keys_create_separate_payouts(self):
        merchant, bank = _create_merchant_with_balance(100000)
        client = Client()

        payload = {'amount_paise': 5000, 'bank_account_id': str(bank.id)}

        r1 = client.post(
            f'/api/v1/merchants/{merchant.id}/payouts/',
            data=payload,
            content_type='application/json',
            headers={'Idempotency-Key': str(uuid.uuid4())},
        )
        r2 = client.post(
            f'/api/v1/merchants/{merchant.id}/payouts/',
            data=payload,
            content_type='application/json',
            headers={'Idempotency-Key': str(uuid.uuid4())},
        )

        self.assertEqual(r1.status_code, 201)
        self.assertEqual(r2.status_code, 201)
        self.assertNotEqual(r1.json()['id'], r2.json()['id'])
        self.assertEqual(Payout.objects.filter(merchant=merchant).count(), 2)


class StateMachineTest(TestCase):
    def test_illegal_transitions_raise(self):
        merchant, bank = _create_merchant_with_balance(100000)
        payout = Payout.objects.create(
            merchant=merchant,
            bank_account=bank,
            amount_paise=5000,
            status=Payout.COMPLETED,
        )
        with self.assertRaises(ValueError):
            payout.transition_to(Payout.PENDING)

        payout.status = Payout.FAILED
        with self.assertRaises(ValueError):
            payout.transition_to(Payout.COMPLETED)

    def test_legal_transitions_succeed(self):
        merchant, bank = _create_merchant_with_balance(100000)
        payout = Payout.objects.create(
            merchant=merchant,
            bank_account=bank,
            amount_paise=5000,
            status=Payout.PENDING,
        )
        payout.transition_to(Payout.PROCESSING)
        self.assertEqual(payout.status, Payout.PROCESSING)
        payout.transition_to(Payout.COMPLETED)
        self.assertEqual(payout.status, Payout.COMPLETED)

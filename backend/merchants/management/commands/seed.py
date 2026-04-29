from django.core.management.base import BaseCommand
from django.db import transaction
from merchants.models import Merchant, BankAccount
from ledger.models import LedgerEntry


SEED_DATA = [
    {
        'id': 'a1000000-0000-0000-0000-000000000001',
        'name': 'Arjun Sharma Design',
        'email': 'arjun@example.com',
        'bank': {
            'account_number': '1234567890',
            'ifsc_code': 'HDFC0001234',
            'account_holder_name': 'Arjun Sharma',
        },
        'credits': [
            (500000, 'Payment from Acme Corp - Invoice #101'),
            (300000, 'Payment from Beta LLC - Invoice #102'),
            (200000, 'Payment from Gamma Inc - Invoice #103'),
        ],
    },
    {
        'id': 'b2000000-0000-0000-0000-000000000002',
        'name': 'Priya Freelance Studio',
        'email': 'priya@example.com',
        'bank': {
            'account_number': '9876543210',
            'ifsc_code': 'ICIC0005678',
            'account_holder_name': 'Priya Patel',
        },
        'credits': [
            (750000, 'Payment from Delta Corp - Invoice #201'),
            (250000, 'Payment from Epsilon Ltd - Invoice #202'),
        ],
    },
    {
        'id': 'c3000000-0000-0000-0000-000000000003',
        'name': 'Ravi Tech Agency',
        'email': 'ravi@example.com',
        'bank': {
            'account_number': '1122334455',
            'ifsc_code': 'SBIN0009012',
            'account_holder_name': 'Ravi Kumar',
        },
        'credits': [
            (1000000, 'Payment from Zeta Corp - Invoice #301'),
            (500000, 'Payment from Eta Inc - Invoice #302'),
            (250000, 'Payment from Theta LLC - Invoice #303'),
        ],
    },
]


class Command(BaseCommand):
    help = 'Seed merchants with bank accounts and credit history'

    def handle(self, *args, **options):
        with transaction.atomic():
            for data in SEED_DATA:
                merchant, created = Merchant.objects.get_or_create(
                    id=data['id'],
                    defaults={'name': data['name'], 'email': data['email']},
                )
                if not created:
                    self.stdout.write(f"Merchant already exists: {merchant.name}")
                    continue

                self.stdout.write(f"Created merchant: {merchant.name}")

                bank = BankAccount.objects.create(
                    merchant=merchant,
                    is_primary=True,
                    **data['bank'],
                )

                for amount, description in data['credits']:
                    LedgerEntry.objects.create(
                        merchant=merchant,
                        entry_type=LedgerEntry.CREDIT,
                        amount_paise=amount,
                        description=description,
                    )

                self.stdout.write(
                    f"  Bank: {bank.account_number} | "
                    f"Total credits: {sum(c[0] for c in data['credits'])} paise"
                )

        self.stdout.write(self.style.SUCCESS('Seed complete.'))

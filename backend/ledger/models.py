import uuid
from django.db import models
from merchants.models import Merchant


class LedgerEntry(models.Model):
    CREDIT = 'credit'
    DEBIT = 'debit'
    ENTRY_TYPES = [(CREDIT, 'Credit'), (DEBIT, 'Debit')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey(Merchant, on_delete=models.PROTECT, related_name='ledger_entries')
    entry_type = models.CharField(max_length=6, choices=ENTRY_TYPES)
    amount_paise = models.BigIntegerField()  # always positive
    description = models.CharField(max_length=255)
    # Links a debit back to the payout that caused it (nullable for credits)
    payout_id = models.UUIDField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.entry_type} {self.amount_paise} paise for {self.merchant}"

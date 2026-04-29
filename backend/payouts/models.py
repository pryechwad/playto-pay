import uuid
from django.db import models
from merchants.models import Merchant, BankAccount


class Payout(models.Model):
    PENDING = 'pending'
    PROCESSING = 'processing'
    COMPLETED = 'completed'
    FAILED = 'failed'

    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (PROCESSING, 'Processing'),
        (COMPLETED, 'Completed'),
        (FAILED, 'Failed'),
    ]

    # Legal forward transitions only
    VALID_TRANSITIONS = {
        PENDING: {PROCESSING},
        PROCESSING: {COMPLETED, FAILED},
        COMPLETED: set(),
        FAILED: set(),
    }

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey(Merchant, on_delete=models.PROTECT, related_name='payouts')
    bank_account = models.ForeignKey(BankAccount, on_delete=models.PROTECT)
    amount_paise = models.BigIntegerField()
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default=PENDING, db_index=True)
    attempt_count = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processing_started_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def transition_to(self, new_status):
        if new_status not in self.VALID_TRANSITIONS[self.status]:
            raise ValueError(
                f"Illegal transition: {self.status} → {new_status}"
            )
        self.status = new_status

    def __str__(self):
        return f"Payout {self.id} [{self.status}] {self.amount_paise} paise"


class IdempotencyKey(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE)
    key = models.CharField(max_length=64)
    # Store the full response so we can replay it exactly
    response_status = models.PositiveSmallIntegerField()
    response_body = models.JSONField()
    payout = models.OneToOneField(Payout, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('merchant', 'key')]
        indexes = [models.Index(fields=['merchant', 'key'])]

    def __str__(self):
        return f"IdempotencyKey {self.key} for {self.merchant}"

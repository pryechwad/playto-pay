import random
import logging
from datetime import timedelta

from celery import shared_task
from django.db import transaction
from django.utils import timezone

from payouts.models import Payout
from ledger.models import LedgerEntry

logger = logging.getLogger(__name__)

MAX_ATTEMPTS = 3
PROCESSING_TIMEOUT_SECONDS = 10


@shared_task(bind=True, max_retries=0)
def process_payout(self, payout_id: str):
    """
    Pick up a PENDING payout, move it to PROCESSING, simulate bank settlement.
    70% success, 20% failure, 10% hang (timeout handled by requeue_stuck_payouts).
    On failure: atomically return funds and mark failed.
    """
    with transaction.atomic():
        try:
            payout = Payout.objects.select_for_update().get(id=payout_id)
        except Payout.DoesNotExist:
            logger.error("Payout %s not found", payout_id)
            return

        if payout.status != Payout.PENDING:
            logger.info("Payout %s already in status %s, skipping", payout_id, payout.status)
            return

        payout.transition_to(Payout.PROCESSING)
        payout.attempt_count += 1
        payout.processing_started_at = timezone.now()
        payout.save(update_fields=['status', 'attempt_count', 'processing_started_at', 'updated_at'])

    # Simulate bank call outside the lock — the payout is now in PROCESSING
    outcome = _simulate_bank_outcome()
    logger.info("Payout %s bank outcome: %s", payout_id, outcome)

    if outcome == 'hang':
        # Leave in PROCESSING; requeue_stuck_payouts will handle it
        return

    with transaction.atomic():
        payout = Payout.objects.select_for_update().get(id=payout_id)

        if payout.status != Payout.PROCESSING:
            # Another worker already resolved this (shouldn't happen, but guard it)
            return

        if outcome == 'success':
            payout.transition_to(Payout.COMPLETED)
            payout.save(update_fields=['status', 'updated_at'])
        else:
            # Atomically mark failed AND return funds in the same transaction
            payout.transition_to(Payout.FAILED)
            payout.save(update_fields=['status', 'updated_at'])
            LedgerEntry.objects.create(
                merchant=payout.merchant,
                entry_type=LedgerEntry.CREDIT,
                amount_paise=payout.amount_paise,
                description=f"Refund for failed payout {payout.id}",
                payout_id=payout.id,
            )


@shared_task
def requeue_stuck_payouts():
    """
    Finds payouts stuck in PROCESSING beyond the timeout.
    Retries up to MAX_ATTEMPTS, then fails them and returns funds.
    """
    cutoff = timezone.now() - timedelta(seconds=PROCESSING_TIMEOUT_SECONDS)
    stuck = Payout.objects.filter(
        status=Payout.PROCESSING,
        processing_started_at__lt=cutoff,
    ).values_list('id', flat=True)

    for payout_id in stuck:
        _retry_or_fail_payout(str(payout_id))


def _retry_or_fail_payout(payout_id: str):
    with transaction.atomic():
        try:
            payout = Payout.objects.select_for_update().get(id=payout_id)
        except Payout.DoesNotExist:
            return

        if payout.status != Payout.PROCESSING:
            return

        if payout.attempt_count < MAX_ATTEMPTS:
            # Reset to PENDING so process_payout can pick it up again
            # Exponential backoff: schedule with countdown
            backoff = 2 ** payout.attempt_count  # 2s, 4s, 8s
            payout.status = Payout.PENDING
            payout.processing_started_at = None
            payout.save(update_fields=['status', 'processing_started_at', 'updated_at'])
            process_payout.apply_async(args=[payout_id], countdown=backoff)
        else:
            payout.transition_to(Payout.FAILED)
            payout.save(update_fields=['status', 'updated_at'])
            LedgerEntry.objects.create(
                merchant=payout.merchant,
                entry_type=LedgerEntry.CREDIT,
                amount_paise=payout.amount_paise,
                description=f"Refund for timed-out payout {payout.id}",
                payout_id=payout.id,
            )


def _simulate_bank_outcome():
    r = random.random()
    if r < 0.80:
        return 'success'
    else:
        return 'failure'

# EXPLAINER.md

---

## 1. The Ledger

**Paste your balance calculation query.**

```python
# merchants/views.py — MerchantBalanceView
result = LedgerEntry.objects.filter(merchant=merchant).aggregate(
    total_credits=Sum('amount_paise', filter=Q(entry_type=LedgerEntry.CREDIT)),
    total_debits=Sum('amount_paise', filter=Q(entry_type=LedgerEntry.DEBIT)),
)
credits = result['total_credits'] or 0
debits  = result['total_debits']  or 0
available = credits - debits
```

This is a single SQL round-trip:

```sql
SELECT
  SUM(amount_paise) FILTER (WHERE entry_type = 'credit') AS total_credits,
  SUM(amount_paise) FILTER (WHERE entry_type = 'debit')  AS total_debits
FROM ledger_ledgerentry
WHERE merchant_id = %s;
```

The same query runs inside `_create_payout_atomic` while holding a row-level lock, so the balance read and the debit write are atomic.

**Why model credits and debits this way?**

I chose an append-only ledger over a mutable balance column for three concrete reasons:

**Auditability.** Every rupee that ever moved has a row. You can reconstruct the full history at any point in time. A mutable `balance` column tells you the current number but nothing about how you got there.

**Correctness invariant.** At any moment: `SUM(credits) - SUM(debits) = displayed_balance`. This is checkable. If it ever fails, something is broken. With a mutable column you lose this check — the column can drift from reality and you'd never know.

**Concurrency safety.** There is no `UPDATE merchant SET balance = balance - X`. That pattern has a classic TOCTOU race. With an immutable ledger, the balance is always derived from the sum of committed rows, and the lock lives on the merchant row, not on a balance column that multiple writers are trying to update simultaneously.

`amount_paise` is always a positive `BigIntegerField`. The sign is encoded in `entry_type`. No floats, no decimals anywhere in the money path.

---

## 2. The Lock

**Paste the exact code that prevents two concurrent payouts from overdrawing a balance.**

```python
# payouts/views.py — _create_payout_atomic()

def _create_payout_atomic(merchant, bank_account, amount_paise, idempotency_key):
    with transaction.atomic():
        # Row-level exclusive lock on this merchant row
        locked_merchant = Merchant.objects.select_for_update().get(id=merchant.id)

        # Balance aggregation runs WHILE holding the lock
        available = _get_available_balance(locked_merchant)

        if available < amount_paise:
            raise _InsufficientFunds()

        payout = Payout.objects.create(
            merchant=locked_merchant,
            bank_account=bank_account,
            amount_paise=amount_paise,
            status=Payout.PENDING,
        )

        # Debit written in the same transaction as the lock
        LedgerEntry.objects.create(
            merchant=locked_merchant,
            entry_type=LedgerEntry.DEBIT,
            amount_paise=amount_paise,
            description=f"Hold for payout {payout.id}",
            payout_id=payout.id,
        )
        ...
```

**The database primitive: `SELECT FOR UPDATE`**

`select_for_update()` issues `SELECT ... FOR UPDATE` on the merchant row. PostgreSQL acquires a row-level exclusive lock. The second concurrent request blocks at that line until the first transaction commits or rolls back.

When the second request unblocks, it re-reads the balance — which now includes the debit written by the first request — and correctly sees insufficient funds. The check-then-deduct is atomic at the database level, not at the Python level.

**Why not `threading.Lock` or `asyncio.Lock`?**

Python-level locks only protect within a single OS process. With 4 gunicorn workers, you have 4 independent lock objects. Two requests hitting different workers have no shared lock to contend on. The race condition survives. The database is the only shared state across all workers, so the lock must live there.

---

## 3. The Idempotency

**How does your system know it has seen a key before?**

```python
# payouts/views.py — PayoutCreateView.post()

expiry = timezone.now() - timedelta(hours=24)
existing = IdempotencyKey.objects.filter(
    merchant=merchant,
    key=idempotency_key,
    created_at__gte=expiry,
).first()

if existing:
    return Response(existing.response_body, status=existing.response_status)
```

The `IdempotencyKey` table has a `unique_together = [('merchant', 'key')]` constraint. When a request succeeds, the full HTTP response body (as JSON) and status code are stored in that row. A replay returns the exact same bytes — same payout ID, same status, same amount. Not a re-execution, a replay.

Keys are scoped per merchant. The same UUID from two different merchants creates two independent rows. Keys expire after 24 hours — the TTL filter in the query above.

**What happens if the first request is in-flight when the second arrives?**

The first request hasn't committed yet, so the second request's pre-check finds nothing in the table. Both proceed into `_create_payout_atomic`. Inside that function, both try to write to `IdempotencyKey` via `get_or_create`. The database unique constraint means only one INSERT wins. The other raises `IntegrityError`.

The view catches `IntegrityError`, re-fetches the now-committed key, and returns its stored response:

```python
except IntegrityError:
    existing = IdempotencyKey.objects.filter(
        merchant=merchant, key=idempotency_key
    ).first()
    if existing:
        return Response(existing.response_body, status=existing.response_status)
    return Response({'error': 'Conflict'}, status=409)
```

No duplicate payout is created. The second request gets the same response as the first.

---

## 4. The State Machine

**Where in the code is failed-to-completed blocked?**

```python
# payouts/models.py — Payout

VALID_TRANSITIONS = {
    PENDING:    {PROCESSING},
    PROCESSING: {COMPLETED, FAILED},
    COMPLETED:  set(),   # terminal — no exits
    FAILED:     set(),   # terminal — no exits
}

def transition_to(self, new_status):
    if new_status not in self.VALID_TRANSITIONS[self.status]:
        raise ValueError(
            f"Illegal transition: {self.status} → {new_status}"
        )
    self.status = new_status
```

`COMPLETED` and `FAILED` both map to empty sets. Any call to `transition_to` from either state raises `ValueError` before touching the database. Every status change in the codebase goes through `transition_to` — there is no direct `payout.status = X` assignment anywhere in the task or view code.

**The fund-return on failure is atomic with the state transition:**

```python
# payouts/tasks.py

with transaction.atomic():
    payout = Payout.objects.select_for_update().get(id=payout_id)

    if payout.status != Payout.PROCESSING:
        return  # guard against double-processing

    payout.transition_to(Payout.FAILED)          # raises if illegal
    payout.save(update_fields=['status', 'updated_at'])
    LedgerEntry.objects.create(                   # credit back in same txn
        merchant=payout.merchant,
        entry_type=LedgerEntry.CREDIT,
        amount_paise=payout.amount_paise,
        description=f"Refund for failed payout {payout.id}",
        payout_id=payout.id,
    )
```

If the `LedgerEntry` insert fails for any reason, the `save()` rolls back too. The funds are never silently lost.

---

## 5. The AI Audit

**One specific example where AI wrote subtly wrong code.**

When I asked for the balance check and payout creation, the AI generated this:

```python
# What AI gave me — WRONG

@transaction.atomic
def create_payout(merchant_id, amount_paise, bank_account_id):
    merchant = Merchant.objects.get(id=merchant_id)

    # Compute balance in Python from fetched rows
    credits = sum(e.amount_paise for e in merchant.ledger_entries.filter(entry_type='credit'))
    debits  = sum(e.amount_paise for e in merchant.ledger_entries.filter(entry_type='debit'))
    balance = credits - debits

    if balance < amount_paise:
        raise InsufficientFunds()

    merchant.balance_paise -= amount_paise  # mutable column
    merchant.save()
    return Payout.objects.create(...)
```

**What's wrong with it — two separate bugs:**

**Bug 1 — No lock, classic TOCTOU race.** The `Merchant.objects.get()` reads the row without locking it. Between that read and the `merchant.save()`, another concurrent request can read the same balance. Both see ₹100, both subtract ₹60, both save ₹40. The merchant ends up with ₹40 but two ₹60 payouts have been created — a ₹20 overdraw. The `@transaction.atomic` decorator does not help here because it only ensures atomicity of the writes, not exclusivity of the read.

**Bug 2 — Python-level aggregation.** Fetching all ledger rows into Python and summing them is wrong for two reasons: it's slow at scale, and it reads rows that may not yet be committed by concurrent transactions. The balance must be computed by the database inside the same transaction that holds the lock.

**What I replaced it with:**

```python
# What I actually shipped

with transaction.atomic():
    # Lock the merchant row first — all other requests block here
    locked_merchant = Merchant.objects.select_for_update().get(id=merchant.id)

    # Aggregation runs in the database, inside the lock
    result = LedgerEntry.objects.filter(merchant=locked_merchant).aggregate(
        total_credits=Sum('amount_paise', filter=Q(entry_type='credit')),
        total_debits=Sum('amount_paise', filter=Q(entry_type='debit')),
    )
    available = (result['total_credits'] or 0) - (result['total_debits'] or 0)

    if available < amount_paise:
        raise _InsufficientFunds()

    payout = Payout.objects.create(...)
    LedgerEntry.objects.create(entry_type='debit', ...)  # debit in same txn
```

No mutable balance column. No Python-level sum. The lock, the balance check, and the debit write are a single atomic unit at the database level.

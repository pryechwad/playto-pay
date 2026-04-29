# EXPLAINER.md

## 1. The Ledger

**Balance calculation query:**

```python
result = LedgerEntry.objects.filter(merchant=merchant).aggregate(
    total_credits=Sum('amount_paise', filter=Q(entry_type=LedgerEntry.CREDIT)),
    total_debits=Sum('amount_paise', filter=Q(entry_type=LedgerEntry.DEBIT)),
)
available = (result['total_credits'] or 0) - (result['total_debits'] or 0)
```

This translates to a single SQL query:
```sql
SELECT
  SUM(amount_paise) FILTER (WHERE entry_type = 'credit') AS total_credits,
  SUM(amount_paise) FILTER (WHERE entry_type = 'debit')  AS total_debits
FROM ledger_ledgerentry
WHERE merchant_id = %s;
```

**Why credits and debits as separate rows, not a signed balance column?**

An append-only ledger is the standard model for financial systems for three reasons:

1. **Immutability**: You never update a ledger row. Every financial event is a new record. This gives you a full audit trail by design.
2. **Correctness under concurrency**: There is no "update balance = balance - X" that can race. The balance is always derived from the sum of immutable rows.
3. **Invariant verification**: At any point you can verify `SUM(credits) - SUM(debits) == displayed_balance`. If it doesn't match, something is wrong. With a mutable balance column you lose this check.

`amount_paise` is always a positive `BigIntegerField`. The sign is encoded in `entry_type`. No floats, no decimals — paise are integers.

---

## 2. The Lock

**Exact code that prevents concurrent overdraw:**

```python
# payouts/views.py — _create_payout_atomic()

with transaction.atomic():
    locked_merchant = Merchant.objects.select_for_update().get(id=merchant.id)

    available = _get_available_balance(locked_merchant)

    if available < amount_paise:
        raise _InsufficientFunds()

    payout = Payout.objects.create(...)
    LedgerEntry.objects.create(entry_type=LedgerEntry.DEBIT, ...)
```

**The database primitive: `SELECT FOR UPDATE`**

`select_for_update()` issues `SELECT ... FOR UPDATE` on the merchant row. PostgreSQL acquires a row-level exclusive lock. The second concurrent request blocks at this line until the first transaction commits or rolls back.

When the second request unblocks, it re-reads the balance — which now includes the debit written by the first request — and correctly sees insufficient funds.

**Why not Python-level locking (threading.Lock)?**

Python locks don't survive across multiple gunicorn workers or Celery processes. A `threading.Lock` only protects within a single process. With 4 gunicorn workers, you'd have 4 independent locks and the race condition would still exist. The database is the only shared state, so the lock must live there.

---

## 3. The Idempotency

**How the system recognises a seen key:**

```python
existing = IdempotencyKey.objects.filter(
    merchant=merchant,
    key=idempotency_key,
    created_at__gte=expiry,   # 24-hour TTL
).select_related('payout').first()

if existing:
    return Response(existing.response_body, status=existing.response_status)
```

The `IdempotencyKey` table has a `unique_together` constraint on `(merchant, key)`. The full response body and HTTP status code are stored as JSON at the time of the first request. Replays return the exact same bytes.

**What happens if the first request is in-flight when the second arrives?**

The first request hasn't committed yet, so the second request's pre-check finds nothing. Both proceed to `_create_payout_atomic`. Inside that function, both try to `INSERT` into `IdempotencyKey` via `get_or_create`. The database unique constraint means only one INSERT wins; the other raises `IntegrityError`. The view catches `IntegrityError`, re-fetches the now-committed key, and returns its stored response. No duplicate payout is created.

Keys are scoped per merchant: the same UUID from two different merchants creates two independent keys.

---

## 4. The State Machine

**Where illegal transitions are blocked:**

```python
# payouts/models.py — Payout.transition_to()

VALID_TRANSITIONS = {
    PENDING:    {PROCESSING},
    PROCESSING: {COMPLETED, FAILED},
    COMPLETED:  set(),
    FAILED:     set(),
}

def transition_to(self, new_status):
    if new_status not in self.VALID_TRANSITIONS[self.status]:
        raise ValueError(
            f"Illegal transition: {self.status} → {new_status}"
        )
    self.status = new_status
```

`COMPLETED` and `FAILED` both map to empty sets. Any call to `transition_to` from those states raises `ValueError` immediately, before any database write. The task code always calls `transition_to` before `save`, so an illegal transition never reaches the database.

The fund-return on failure is atomic with the state transition:

```python
# payouts/tasks.py
with transaction.atomic():
    payout.transition_to(Payout.FAILED)   # raises if illegal
    payout.save(update_fields=['status', 'updated_at'])
    LedgerEntry.objects.create(           # credit back in same transaction
        entry_type=LedgerEntry.CREDIT,
        amount_paise=payout.amount_paise,
        ...
    )
```

If the credit insert fails for any reason, the status update rolls back too. The funds are never lost.

---

## 5. The AI Audit

**What AI gave me (wrong):**

When I asked for the balance check + payout creation, the AI generated this pattern:

```python
# AI's version — WRONG
merchant = Merchant.objects.get(id=merchant_id)
balance = merchant.balance  # a stored integer column updated in place

if balance >= amount_paise:
    merchant.balance -= amount_paise
    merchant.save()
    Payout.objects.create(...)
```

**What's wrong with it:**

Two problems:

1. **Race condition**: Between `merchant = Merchant.objects.get(...)` and `merchant.save()`, another request can read the same balance. Both see 10000 paise, both subtract 6000, both save 4000. The merchant ends up with 4000 paise but two 6000-paise payouts have been created — a 2000-paise overdraw.

2. **Mutable balance column**: Storing balance as a column you update in place loses the audit trail. You can't reconstruct what happened. If there's a bug, you can't verify correctness.

**What I replaced it with:**

- Append-only `LedgerEntry` table. Balance is always derived, never stored.
- `SELECT FOR UPDATE` on the merchant row inside a transaction. The balance aggregation runs while holding the lock, so the check-then-deduct is atomic at the database level.
- The debit ledger entry is written in the same transaction as the payout creation. Either both commit or neither does.

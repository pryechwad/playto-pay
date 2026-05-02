# Playto Pay

Cross-border payout infrastructure for Indian merchants. Merchants accumulate balance from international payments and withdraw to Indian bank accounts via a secure, idempotent, concurrency-safe payout engine.

---

## Live Demo

https://playto-pay-vert.vercel.app

---

## Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Django 4.2 + Django REST Framework |
| Database | PostgreSQL 15 |
| Background jobs | Celery 5 + Redis 7 |
| Retry scheduler | Celery Beat + django-celery-beat |
| Frontend | React 19 + Vite + Tailwind CSS |
| Container | Docker + docker-compose |

---

## Quick Start (Docker — recommended)

```bash
git clone <repo-url>
cd playto-pay
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend dashboard | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Django Admin | http://localhost:8000/admin |

The `backend` container automatically runs `migrate` and `seed` on startup. Three merchants are seeded with credit history and bank accounts.

---

## Local Development (without Docker)

### Prerequisites

- Python 3.11+
- PostgreSQL 15 running locally
- Redis running locally
- Node.js 20+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

export POSTGRES_DB=playto
export POSTGRES_USER=playto_user
export POSTGRES_PASSWORD=password
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export REDIS_URL=redis://localhost:6379/0

python manage.py migrate
python manage.py seed
python manage.py runserver
```

### Celery Worker (required for payout processing)

```bash
# In a separate terminal, from backend/
celery -A core worker -l info -c 4
```

### Celery Beat (required for stuck-payout retry)

```bash
# In a separate terminal, from backend/
celery -A core beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Features

### Payout Lifecycle

A payout moves through a strict state machine: `pending -> processing -> completed` or `pending -> processing -> failed`.

- On creation, a `DEBIT` ledger entry is written atomically with the payout record. The merchant's available balance is reduced immediately.
- A Celery task picks up the payout, transitions it to `processing`, and simulates a bank settlement call (80% success, 20% failure).
- On success, the payout is marked `completed`.
- On failure, the payout is marked `failed` and a `CREDIT` ledger entry is written atomically, returning the funds to the merchant's balance.
- Payouts stuck in `processing` beyond a timeout are retried up to 3 times with exponential backoff by a Celery Beat scheduled task. After 3 failed attempts, the payout is marked `failed` and funds are refunded.

### Concurrency Safety

Concurrent payout requests from the same merchant are serialised using `SELECT FOR UPDATE` on the merchant row at the database level. This prevents overdraw even when multiple gunicorn workers or Celery processes handle requests simultaneously. Python-level locks would not work across processes.

### Idempotency

Every payout request requires an `Idempotency-Key` header. The key is stored with the full response body. Replaying the same key returns the identical response without creating a duplicate payout. Concurrent requests with the same key are handled via `IntegrityError` catch on the unique constraint. Keys expire after 24 hours.

### Money Integrity

- All amounts are stored as `BigIntegerField` in paise. No floating-point arithmetic anywhere.
- Balance is never stored as a column. It is always derived as `SUM(credits) - SUM(debits)` from the ledger.
- Every debit and every credit is an immutable `LedgerEntry` row. The full audit trail is always available.
- The invariant `SUM(credits) - SUM(debits) == available_balance` is verifiable at any point in time.

---

## API Reference

### Merchants

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/merchants/` | List all merchants |
| `GET` | `/api/v1/merchants/{id}/balance/` | Balance breakdown (available, held, credits, debits) |
| `GET` | `/api/v1/merchants/{id}/ledger/` | Last 50 ledger entries |
| `GET` | `/api/v1/merchants/{id}/bank-accounts/` | Bank accounts |

### Payouts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/merchants/{id}/payouts/` | Create payout — requires `Idempotency-Key` header |
| `GET` | `/api/v1/merchants/{id}/payouts/list/` | Last 50 payouts |

### Create Payout

```http
POST /api/v1/merchants/{merchant_id}/payouts/
Idempotency-Key: <uuid>
Content-Type: application/json

{
  "amount_paise": 50000,
  "bank_account_id": "<uuid>"
}
```

**Response codes:**

| Code | Meaning |
|------|---------|
| `201` | Payout created, processing queued |
| `200` | Idempotent replay — same key seen before, same response returned |
| `400` | Missing fields or invalid amount |
| `404` | Merchant or bank account not found |
| `422` | Insufficient balance |

---

## Architecture

### Payout Flow

```
POST /payouts/
    |
    |-- Idempotency check (pre-lock, fast path)
    |
    |-- SELECT FOR UPDATE on merchant row
    |
    |-- Aggregate balance from ledger (inside lock)
    |
    |-- Insufficient? -> store idempotency key, return 422
    |
    |-- Create Payout (PENDING) + LedgerEntry (DEBIT) in same transaction
    |
    |-- Store idempotency key with response body
    |
    +-- process_payout.delay(payout_id) -> Celery queue
           |
           |-- PENDING -> PROCESSING (with SELECT FOR UPDATE)
           |
           |-- Simulate bank: 80% success / 20% failure
           |
           |-- success -> COMPLETED
           |
           |-- failure -> FAILED + LedgerEntry (CREDIT refund, atomic)
           |
           +-- hang -> left in PROCESSING
                      |
                      +-- requeue_stuck_payouts (Celery Beat, every 60s)
                             |
                             |-- attempt_count < 3 -> retry with exponential backoff
                             +-- attempt_count >= 3 -> FAILED + refund
```

### State Machine

```
PENDING -> PROCESSING -> COMPLETED
                      -> FAILED
```

Illegal transitions (e.g. `completed -> pending`) raise `ValueError`. The state machine is enforced at the model level.

---

## Running Tests

```bash
cd backend
python manage.py test payouts
```

| Test | What it verifies |
|------|-----------------|
| `ConcurrencyTest.test_concurrent_overdraw_rejected` | Two simultaneous 60-rupee requests against a 100-rupee balance — exactly one succeeds, one gets 422. Uses `threading.Barrier` to synchronise requests. Uses `TransactionTestCase` so each thread sees committed data. |
| `IdempotencyTest.test_same_key_returns_same_response` | Same `Idempotency-Key` twice returns identical response body and status. Exactly one payout created. |
| `IdempotencyTest.test_different_keys_create_separate_payouts` | Two different keys create two independent payouts. |
| `StateMachineTest.test_illegal_transitions_raise` | `completed -> pending` and `failed -> completed` both raise `ValueError`. |
| `StateMachineTest.test_legal_transitions_succeed` | `pending -> processing -> completed` succeeds. |

> The concurrency test requires a real PostgreSQL instance. SQLite does not support `SELECT FOR UPDATE` and will produce a false pass.

---

## Seeded Test Data

| Merchant | Credits | Starting Balance |
|----------|---------|-----------------|
| Arjun Sharma Design | 3 invoices from Acme, Beta, Gamma | Rs. 10,000 |
| Priya Freelance Studio | 2 invoices from Delta, Epsilon | Rs. 10,000 |
| Ravi Tech Agency | 3 invoices from Zeta, Eta, Theta | Rs. 17,500 |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `playto` | Database name |
| `POSTGRES_USER` | `playto_user` | Database user |
| `POSTGRES_PASSWORD` | `password` | Database password |
| `POSTGRES_HOST` | `db` | Database host |
| `POSTGRES_PORT` | `5432` | Database port |
| `REDIS_URL` | `redis://redis:6379/0` | Redis connection URL |
| `SECRET_KEY` | dev key | Django secret key |
| `DEBUG` | `True` | Django debug mode |
| `ALLOWED_HOSTS` | `*` | Comma-separated allowed hosts |
| `CORS_ALLOWED_ORIGINS` | (unset, allows all) | Comma-separated allowed CORS origins |
| `CELERY_TASK_ALWAYS_EAGER` | `False` | Run Celery tasks synchronously (useful for environments without a worker) |

---

## Deployment Notes

The live demo runs on Render's free tier with `CELERY_TASK_ALWAYS_EAGER=True`. This setting runs the Celery task synchronously within the same web process instead of dispatching to a background worker. The full `pending -> processing -> completed/failed` lifecycle executes on every payout request, and the status will reflect `completed` or `failed` in the UI immediately.

When running locally with Docker, the lifecycle runs through a real Celery worker and Redis queue as intended. The concurrency, idempotency, and balance integrity guarantees are identical in both environments.

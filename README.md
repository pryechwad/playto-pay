# Playto Pay — Payout Engine

Cross-border payout infrastructure for Indian merchants. Merchants accumulate balance from international payments and withdraw to Indian bank accounts.

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

# Environment variables
export POSTGRES_DB=playto
export POSTGRES_USER=playto_user
export POSTGRES_PASSWORD=password
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export REDIS_URL=redis://localhost:6379/0

# Database setup
python manage.py migrate
python manage.py seed

# Run server
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

## Running Tests

```bash
cd backend
python manage.py test payouts
```

**Test suite covers:**

| Test | What it verifies |
|------|-----------------|
| `ConcurrencyTest.test_concurrent_overdraw_rejected` | Two simultaneous 60-rupee requests against a 100-rupee balance — exactly one succeeds, one gets 422. Uses `threading.Barrier` to synchronise requests. Uses `TransactionTestCase` so each thread sees committed data. |
| `IdempotencyTest.test_same_key_returns_same_response` | Same `Idempotency-Key` twice returns identical response body and status. Exactly one payout created. |
| `IdempotencyTest.test_different_keys_create_separate_payouts` | Two different keys create two independent payouts. |
| `StateMachineTest.test_illegal_transitions_raise` | `completed → pending` and `failed → completed` both raise `ValueError`. |
| `StateMachineTest.test_legal_transitions_succeed` | `pending → processing → completed` succeeds. |

> The concurrency test requires a real PostgreSQL instance. SQLite does not support `SELECT FOR UPDATE` and will give a false pass.

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

## Seeded Test Data

| Merchant | Credits | Starting Balance |
|----------|---------|-----------------|
| Arjun Sharma Design | 3 invoices from Acme, Beta, Gamma | ₹10,000 |
| Priya Freelance Studio | 2 invoices from Delta, Epsilon | ₹10,000 |
| Ravi Tech Agency | 3 invoices from Zeta, Eta, Theta | ₹17,500 |

---

## Architecture

### Payout Lifecycle

```
POST /payouts/
    │
    ├─ Idempotency check (pre-lock, fast path)
    │
    ├─ SELECT FOR UPDATE on merchant row
    │
    ├─ Aggregate balance from ledger (inside lock)
    │
    ├─ Insufficient? → raise, store idempotency key, return 422
    │
    ├─ Create Payout (PENDING) + LedgerEntry (DEBIT) in same transaction
    │
    └─ process_payout.delay(payout_id) → Celery queue
           │
           ├─ PENDING → PROCESSING (with lock)
           │
           ├─ Simulate bank: 70% success / 20% fail / 10% hang
           │
           ├─ success → COMPLETED
           │
           ├─ fail → FAILED + LedgerEntry(CREDIT) refund (atomic)
           │
           └─ hang → left in PROCESSING
                      │
                      └─ requeue_stuck_payouts (Celery Beat, every 60s)
                             │
                             ├─ attempt_count < 3 → retry with backoff
                             └─ attempt_count >= 3 → FAILED + refund
```

### Money Integrity Guarantees

- All amounts stored as `BigIntegerField` in paise. No `FloatField`, no `DecimalField`.
- Balance is always derived: `SUM(credits) - SUM(debits)`. Never stored as a column.
- Every debit (payout hold) and every credit (refund) is an immutable `LedgerEntry` row.
- The invariant `SUM(credits) - SUM(debits) == available_balance` is verifiable at any time.

### Concurrency

- `SELECT FOR UPDATE` on the merchant row serialises concurrent payout requests at the database level.
- Works correctly across multiple gunicorn workers and Celery processes — Python-level locks would not.

### Idempotency

- `IdempotencyKey` table with `unique_together = [('merchant', 'key')]`.
- Full response body stored as JSON. Replays return exact same bytes.
- In-flight race handled via `IntegrityError` catch on the unique constraint.
- Keys expire after 24 hours.

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

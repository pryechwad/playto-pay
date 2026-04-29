# Playto Pay — Payout Engine

Cross-border payout infrastructure for Indian merchants. Merchants accumulate balance from international payments and withdraw to Indian bank accounts.

## Stack

- **Backend**: Django 4.2 + DRF, PostgreSQL, Celery + Redis
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Background jobs**: Celery worker + Celery Beat (periodic retry task)

---

## Quick Start (Docker)

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Django Admin: http://localhost:8000/admin

The `backend` container runs `migrate` + `seed` automatically on startup.

---

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set env vars (or create a .env and load it)
export POSTGRES_DB=playto POSTGRES_USER=playto_user POSTGRES_PASSWORD=password POSTGRES_HOST=localhost
export REDIS_URL=redis://localhost:6379/0

python manage.py migrate
python manage.py seed
python manage.py runserver
```

### Celery Worker

```bash
celery -A core worker -l info
```

### Celery Beat (retry scheduler)

```bash
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

Tests require a running PostgreSQL instance (uses `TransactionTestCase` for the concurrency test).

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/merchants/` | List all merchants |
| GET | `/api/v1/merchants/{id}/balance/` | Balance breakdown |
| GET | `/api/v1/merchants/{id}/ledger/` | Recent ledger entries |
| GET | `/api/v1/merchants/{id}/bank-accounts/` | Bank accounts |
| POST | `/api/v1/merchants/{id}/payouts/` | Create payout (requires `Idempotency-Key` header) |
| GET | `/api/v1/merchants/{id}/payouts/list/` | Payout history |

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

---

## Seeded Test Data

| Merchant | Balance |
|----------|---------|
| Arjun Sharma Design | ₹10,000 |
| Priya Freelance Studio | ₹10,000 |
| Ravi Tech Agency | ₹17,500 |

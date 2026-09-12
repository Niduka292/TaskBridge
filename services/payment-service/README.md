# payment-service

Owns the escrow lifecycle and the PayHere payment integration. Never called directly by other services — it reacts to domain events and exposes REST endpoints only to the frontend through the gateway.

---

## Responsibility

- Create and manage escrow records (`escrow_transactions` table)
- Integrate with PayHere hosted checkout for LKR-native payments
- Validate PayHere webhook signatures before any state change
- Publish escrow state change events so task-service and user-service can react
- Consume `BID_ACCEPTED` to create a PENDING escrow record ahead of payment
- Consume `DISPUTE_RESOLVED` to execute the admin-decided release or refund

---

## Stack

| Property | Value |
|---|---|
| Framework | Spring Boot 3 |
| Language | Java 21 |
| Database | Supabase PostgreSQL — `escrow_transactions` table |
| Port | `8083` |
| Deployment | Railway |

---

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/payments/initiate` | Required | Poster calls this after a bid is accepted. Looks up the PENDING escrow record for the task and returns signed PayHere checkout parameters. Frontend uses these to redirect the user to PayHere's hosted checkout page. |
| `POST` | `/api/v1/payments/webhook` | **None** | Called directly by PayHere — not by the frontend. No JWT. Validates MD5 signature. On `status_code = 2` transitions escrow `PENDING → HELD` and publishes `ESCROW_HELD`. PayHere expects an HTTP `200` response. |
| `GET` | `/api/v1/escrow/{escrowId}` | Required | Get escrow transaction by ID. Only the payer (poster) or payee (freelancer) can retrieve it — returns `403` for anyone else. |
| `POST` | `/api/v1/escrow/{escrowId}/release` | Required | Poster only. Transitions escrow `HELD → RELEASED`. Publishes `ESCROW_RELEASED` with `amountLKR` and `payeeId` in the payload. |

> `/api/v1/payments/webhook` must be excluded from the JWT filter in `SecurityConfig.java`. PayHere does not send an `Authorization` header.

---

## Escrow State Machine

```
(consumes BID_ACCEPTED event)
            │
            ▼
        [ PENDING ]  ← escrow record created, waiting for payment
            │
  POST /payments/webhook
  PayHere status_code = 2
  MD5 signature valid
  publishes ESCROW_HELD
            │
            ▼
         [ HELD ]  ← funds locked, work can begin
            │
            ├─── POST /escrow/{id}/release (poster approves delivery)
            │    publishes ESCROW_RELEASED
            │              │
            │              ▼
            │         [ RELEASED ]  ← freelancer paid
            │
            └─── consumes DISPUTE_RESOLVED (escrowAction = REFUND)
                 publishes ESCROW_REFUNDED
                           │
                           ▼
                      [ REFUNDED ]  ← funds returned to poster
```

> Refunds are never triggered by a direct REST call. They happen only when `DISPUTE_RESOLVED` is consumed with `escrowAction = REFUND`. This prevents any client from directly triggering a refund.

---

## Domain Events

| Direction | Event | Payload | Trigger |
|---|---|---|---|
| **Publishes** | `ESCROW_HELD` | `taskId, payerId, payeeId, amountLKR` | PayHere webhook confirms payment |
| **Publishes** | `ESCROW_RELEASED` | `taskId, payeeId, amountLKR` | Poster calls `/escrow/{id}/release` |
| **Publishes** | `ESCROW_REFUNDED` | `taskId, payerId, amountLKR` | DISPUTE_RESOLVED consumed with REFUND action |
| **Consumes** | `BID_ACCEPTED` | `taskId, posterId, freelancerId, amountLKR` | Creates PENDING escrow record |
| **Consumes** | `DISPUTE_RESOLVED` | `taskId, escrowAction (RELEASE\|REFUND)` | Executes release or refund accordingly |

---

## Database Table

### `escrow_transactions`

```sql
id           uuid  primary key  default gen_random_uuid()
task_id      uuid  not null  unique  references tasks(id)
payer_id     uuid  not null  references auth.users(id)   -- poster
payee_id     uuid  not null  references auth.users(id)   -- freelancer
amount_lkr   numeric(12,2)  not null
status       escrow_status  not null  default 'PENDING'
gateway_ref  text  (nullable)  -- PayHere payment_id, set when status → HELD
created_at   timestamptz  default now()
updated_at   timestamptz  default now()
```

```sql
create type escrow_status as enum ('PENDING', 'HELD', 'RELEASED', 'REFUNDED');
```

> `task_id` is `unique` — one escrow record per task, enforced at the DB level. A task can never have two concurrent escrow records.

---

## PayHere Integration

### Flow

```
1. BID_ACCEPTED event received
   → payment-service creates escrow record (status = PENDING)

2. Poster clicks "Proceed to Payment" on the frontend
   → frontend calls POST /payments/initiate
   → payment-service returns signed checkout params
   → frontend redirects user to PayHere hosted checkout URL

3. User completes payment on PayHere
   → PayHere posts to POST /payments/webhook (form-encoded, no JWT)
   → payment-service validates MD5 signature
   → on status_code = 2: escrow PENDING → HELD, publishes ESCROW_HELD

4. ESCROW_HELD consumed by task-service
   → task transitions OPEN → IN_PROGRESS
```

### MD5 Signature Validation

PayHere sends an `md5sig` field in the webhook. You must validate it before touching the escrow record. The formula is:

```
md5sig = MD5(
  merchant_id +
  order_id +
  payhere_amount +
  payhere_currency +
  MD5(merchant_secret).toUpperCase()
).toUpperCase()
```

```java
// PayHereService.java
public boolean validateSignature(Map<String, String> params) {
  String merchantMd5 = md5(merchantSecret).toUpperCase();
  String expected = md5(
    params.get("merchant_id") +
    params.get("order_id") +
    params.get("payhere_amount") +
    params.get("payhere_currency") +
    merchantMd5
  ).toUpperCase();
  return expected.equals(params.get("md5sig"));
}
```

If the signature is invalid, return HTTP `400` immediately and do **not** update the escrow record.

### PayHere `status_code` values

| Code | Meaning | Action |
|---|---|---|
| `2` | Payment success | Validate MD5 → escrow `HELD` |
| `0` | Pending | Log only, no state change |
| `-1` | Cancelled | Log only, no state change |
| `-2` | Failed | Log only, no state change |
| `-3` | Charged back | Log, flag for admin review |

### Checkout Parameters (returned by `/payments/initiate`)

```json
{
  "merchantId": "1234567",
  "orderId": "<task UUID>",
  "items": "Escrow: <task title>",
  "amountLKR": 4200.00,
  "currency": "LKR",
  "hash": "<MD5 signature>",
  "returnUrl": "https://taskmarket.vercel.app/payments/return",
  "cancelUrl": "https://taskmarket.vercel.app/tasks/<taskId>",
  "notifyUrl": "https://taskmarket-api.up.railway.app/api/v1/payments/webhook"
}
```

> `notifyUrl` must point to the production Railway gateway URL in production. For local testing, use an ngrok tunnel: `ngrok http 3000` and update `notifyUrl` to the ngrok URL.

---

## Project Structure

```
payment-service/
├── src/
│   └── main/
│       ├── java/com/taskbridge/paymentservice/
│       │   ├── config/
│       │   │   └── SecurityConfig.java           # JWT filter — excludes /payments/webhook route
│       │   ├── controller/
│       │   │   ├── PaymentController.java         # POST /payments/initiate, POST /payments/webhook
│       │   │   └── EscrowController.java          # GET /escrow/{id}, POST /escrow/{id}/release
│       │   ├── service/
│       │   │   ├── PayHereService.java            # Builds checkout params, validates MD5 signature
│       │   │   ├── EscrowService.java             # markHeld(), release(), refund() — each publishes event
│       │   │   ├── EventPublisher.java            # Publishes ESCROW_HELD, ESCROW_RELEASED, ESCROW_REFUNDED
│       │   │   └── EventConsumer.java             # Consumes BID_ACCEPTED, DISPUTE_RESOLVED
│       │   ├── model/
│       │   │   └── EscrowTransaction.java         # JPA entity → escrow_transactions table
│       │   ├── repository/
│       │   │   └── EscrowRepository.java          # findByTaskId(), findByIdAndPayerIdOrPayeeId()
│       │   ├── dto/
│       │   │   ├── PaymentInitiateRequest.java    # { taskId }
│       │   │   ├── PaymentInitiateResponse.java   # PayHere checkout params
│       │   │   └── EscrowResponse.java            # Escrow record response shape
│       │   └── PaymentServiceApplication.java     # @SpringBootApplication entry point
│       └── resources/
│           └── application.yml                    # Port 8083, DATABASE_URL, PayHere credentials
└── src/test/
    └── java/com/taskbridge/paymentservice/
        └── PaymentServiceTest.java                # Signature validation, state transitions, release/refund
```

---

## Security Config — Webhook Route

The webhook route must be excluded from JWT validation. PayHere does not send an `Authorization` header.

```java
// SecurityConfig.java
http.authorizeHttpRequests(auth -> auth
  .requestMatchers("/api/v1/payments/webhook").permitAll()
  .requestMatchers("/actuator/health").permitAll()
  .anyRequest().authenticated()
);
```

All other routes still require a valid Supabase JWT.

---

## Environment Variables

```env
DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
PAYHERE_MERCHANT_ID=1234567
PAYHERE_MERCHANT_SECRET=your-payhere-merchant-secret
PAYHERE_BASE_URL=https://sandbox.payhere.lk/pay/checkout   # sandbox
# PAYHERE_BASE_URL=https://www.payhere.lk/pay/checkout     # production
PORT=8083
```

> Use sandbox credentials during development. Switch to live credentials only for the production deploy in Week 8. The `notifyUrl` in checkout params must also be updated to the production Railway URL at that point.

---

## Running Locally

```bash
# from monorepo root
docker compose up payment-service

# standalone
cd services/payment-service
mvn spring-boot:run
```

Service available at `http://localhost:8083`.  
Through the gateway: `http://localhost:3000/api/v1/payments/...`

**Testing PayHere webhook locally:**

```bash
# expose the gateway port via ngrok
ngrok http 3000

# use the ngrok URL as notifyUrl in PayHere sandbox settings
# e.g. https://abc123.ngrok.io/api/v1/payments/webhook

# or simulate a webhook call directly with curl
curl -X POST http://localhost:3000/api/v1/payments/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "merchant_id=1234567&order_id=<taskId>&payhere_amount=4200.00&payhere_currency=LKR&status_code=2&md5sig=<computed_hash>"
```

---

## Running Tests

```bash
cd services/payment-service
mvn test
```

Tests cover:
- Valid MD5 signature accepted → escrow transitions to `HELD`
- Invalid MD5 signature rejected → escrow unchanged, returns `400`
- `release()` transitions `HELD → RELEASED` and publishes `ESCROW_RELEASED`
- `refund()` transitions `HELD → REFUNDED` and publishes `ESCROW_REFUNDED`
- Release on a non-`HELD` escrow returns `409`
- Only payer or payee can retrieve escrow — others get `403`

---

## Key Rules

- **Never release or refund without validating the MD5 signature first.** No exceptions.
- **Never trigger a refund from a REST endpoint.** Refunds happen only by consuming `DISPUTE_RESOLVED` with `escrowAction = REFUND`.
- **Never call task-service or user-service via REST.** Publish events — they react.
- **`task_id` is unique in `escrow_transactions`.** One task can never have two active escrow records.
- **Use sandbox credentials locally.** Never commit live PayHere credentials to the repository.
- **`notifyUrl` must be publicly reachable by PayHere.** Use ngrok locally, use the Railway gateway URL in production.

---

*Part of the TASKBRIDGE microservices monorepo — see `/docs/architecture.md` for the full system overview.*
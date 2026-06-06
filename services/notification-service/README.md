# notification-service

A pure event consumer. Listens to every domain event from all other services and writes a notification row to the database. No other service ever calls this service directly.

---

## Responsibility

- Subscribe to all 9 domain events from task-service, payment-service, and user-service
- Write a `notifications` row for the right user(s) on each event
- Serve notification reads and mark-as-read actions via REST
- Send transactional email via SendGrid for `BID_ACCEPTED` and `ESCROW_HELD` only
- Supabase Realtime delivers new rows to the user's browser automatically — no extra push logic needed here

---

## Stack

| Property | Value |
|---|---|
| Framework | Node.js + Express |
| Language | JavaScript (Node 20) |
| Database | Supabase PostgreSQL — `notifications` table |
| Port | `8084` |
| Deployment | Railway |

---

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/notifications` | Required | Get notifications for the authenticated user. Paginated, newest-first. Supports `?unreadOnly=true`. Response includes `unreadCount`. |
| `PUT` | `/api/v1/notifications/read` | Required | Mark all notifications as read for the authenticated user. |
| `PUT` | `/api/v1/notifications/{id}/read` | Required | Mark a single notification as read. |

> These endpoints are for **initial page load and pagination only**. Live delivery to the browser happens via Supabase Realtime — the client subscribes to the `notifications` table filtered by `user_id` and the bell badge updates instantly without polling.

---

## Events Consumed

| Event | Who gets notified | Message |
|---|---|---|
| `BID_RECEIVED` | Poster | "You have a new bid from {bidderName} for LKR {amount}" |
| `BID_ACCEPTED` | Winning freelancer + rejected bidders | "Your bid was accepted" / "Your bid was not selected" |
| `ESCROW_HELD` | Poster + freelancer | "Payment confirmed — work can now begin" |
| `WORK_SUBMITTED` | Poster | "The freelancer has submitted their work. Please review." |
| `ESCROW_RELEASED` | Freelancer | "LKR {amount} has been released to your wallet" |
| `ESCROW_REFUNDED` | Poster | "LKR {amount} has been refunded to your account" |
| `TASK_COMPLETED` | Poster + freelancer | "Task complete — please leave a review" |
| `DISPUTE_RAISED` | Poster + freelancer | "A dispute has been raised on this task" |
| `REVIEW_POSTED` | Reviewee | "You received a new review" (only after both reviews are revealed) |
| `DEADLINE_APPROACHING` | Poster + freelancer | "Your task deadline is approaching" |

> `BID_ACCEPTED` and `ESCROW_HELD` also trigger a **SendGrid email** in addition to the in-app notification.

---

## Database Table

### `notifications`

```sql
id         uuid  primary key  default gen_random_uuid()
user_id    uuid  not null  references auth.users(id) on delete cascade
type       text  not null   -- matches event name e.g. 'BID_RECEIVED'
payload    jsonb not null  default '{}'  -- context data for the message
is_read    boolean  not null  default false
created_at timestamptz  default now()
```

```sql
-- index for fast unread queries per user
create index idx_notif_user_unread
  on notifications(user_id, is_read, created_at desc);
```

---

## Project Structure

```
notification-service/
├── src/
│   ├── index.js                      # Express app, mounts router, calls mountConsumers(), starts server
│   ├── consumers/
│   │   ├── index.js                  # mountConsumers() — registers all 10 handlers with the event bus
│   │   ├── bidReceived.js            # → notify poster
│   │   ├── bidAccepted.js            # → notify winner + rejected bidders + send email
│   │   ├── escrowHeld.js             # → notify both parties + send email
│   │   ├── workSubmitted.js          # → notify poster
│   │   ├── escrowReleased.js         # → notify freelancer
│   │   ├── escrowRefunded.js         # → notify poster
│   │   ├── taskCompleted.js          # → notify both parties
│   │   ├── disputeRaised.js          # → notify both parties
│   │   ├── reviewPosted.js           # → notify reviewee (only when revealed = true)
│   │   └── deadlineApproaching.js    # → notify both parties
│   ├── routes/
│   │   └── notifications.js          # GET /, PUT /read, PUT /:id/read
│   ├── middleware/
│   │   └── auth.js                   # Validates Supabase JWT, attaches req.user
│   ├── email.js                      # SendGrid wrapper — sendEmail(to, subject, body)
│   └── db.js                         # Supabase client — insert, query, markRead helpers
├── package.json
└── Dockerfile
```

---

## Environment Variables

```env
DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
SENDGRID_API_KEY=SG.xxxxxx
SENDGRID_FROM_EMAIL=no-reply@taskmarket.ac.lk
PORT=8084
```

---

## Running Locally

```bash
# from monorepo root
docker compose up notification-service

# standalone
cd services/notification-service
npm install
npm run dev
```

Service available at `http://localhost:8084`.  
Through the gateway: `http://localhost:3000/api/v1/notifications/...`

---

## Running Tests

```bash
cd services/notification-service
npm test
```

Tests cover: each consumer inserts the correct notification row, `BID_ACCEPTED` triggers a SendGrid call, `reviewPosted` only notifies when `revealed = true`, mark-as-read updates `is_read` correctly.

---

## Key Rules

- **This service never publishes any events.** It is a pure consumer — read-only from the event perspective.
- **No other service ever calls this service's REST endpoints directly.** Only the frontend calls it, through the gateway.
- **Removing or restarting this service has zero impact on task creation, bidding, or payments.** It is fully decoupled.
- **Supabase Realtime handles live delivery** — this service only writes rows. No WebSocket code lives here.
- **Only send email for `BID_ACCEPTED` and `ESCROW_HELD`** — emailing on every event will get the account flagged as spam.

---

*Part of the TASKBRIDGE microservices monorepo — see `/docs/architecture.md` for the full system overview.*
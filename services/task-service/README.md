# task-service

Owns the full task lifecycle and the bid system. The primary domain event publisher in the entire system. Never calls any other service directly — all cross-service coordination happens through published events.

---

## Responsibility

- Create, update, delete, and serve tasks (`tasks` table)
- Manage the bid system — submit, accept, retract (`bids` table)
- Enforce the task state machine — every valid and invalid transition is controlled here
- Publish domain events when task or bid state changes
- Consume events from payment-service to drive task status forward
- Run a scheduled job every 30 minutes to detect overdue tasks and publish `DEADLINE_APPROACHING`

---

## Stack

| Property | Value |
|---|---|
| Framework | Spring Boot 3 |
| Language | Java 21 |
| Database | Supabase PostgreSQL — `tasks`, `bids` tables |
| Port | `8082` |
| Deployment | Railway |

---

## Endpoints

### Tasks

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/tasks` | Required | List tasks. Supports filters: `status`, `category`, `budgetMin`, `budgetMax`, `skillTags`, `posterId`, `assignedTo`, `search`, `sort`. Paginated. |
| `POST` | `/api/v1/tasks` | Required | Create a task with status `OPEN`. `poster_id` is taken from the JWT — never from the request body. |
| `GET` | `/api/v1/tasks/{taskId}` | Required | Get a single task by ID. |
| `PUT` | `/api/v1/tasks/{taskId}` | Required | Update task fields. Poster only. Task must be `OPEN` — returns `409` if status has moved past `OPEN`. |
| `DELETE` | `/api/v1/tasks/{taskId}` | Required | Delete a task. Poster only. Only allowed when status is `OPEN` and `bidCount` is 0. |
| `POST` | `/api/v1/tasks/{taskId}/submit` | Required | Assigned freelancer submits completed work. Transitions `IN_PROGRESS → PENDING_REVIEW`. Publishes `WORK_SUBMITTED`. |
| `POST` | `/api/v1/tasks/{taskId}/dispute` | Required | Either task participant raises a dispute. Transitions to `DISPUTED`. Publishes `DISPUTE_RAISED`. Only allowed from `IN_PROGRESS` or `PENDING_REVIEW`. |
| `POST` | `/api/v1/tasks/{taskId}/resolve` | Admin only | Resolve a disputed task. Transitions `DISPUTED → COMPLETED`. Publishes `DISPUTE_RESOLVED` with `escrowAction` (`RELEASE` or `REFUND`) in the payload. |

### Bids

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/tasks/{taskId}/bids` | Required | Get all bids on a task. Task poster sees full bidder details. Any other caller sees redacted bidder info. |
| `POST` | `/api/v1/tasks/{taskId}/bids` | Required | Submit a bid. Returns `403` if the caller is the task poster. Returns `409` if the task is not `OPEN` or the caller already has a `PENDING` bid on this task. Publishes `BID_RECEIVED`. |
| `PUT` | `/api/v1/bids/{bidId}/accept` | Required | Poster accepts a bid. Atomic operation: sets this bid to `ACCEPTED`, bulk-sets all other bids on the task to `REJECTED`, sets `tasks.assigned_to`. Publishes `BID_ACCEPTED`. |
| `DELETE` | `/api/v1/bids/{bidId}` | Required | Bidder retracts their own bid. Only allowed when bid status is `PENDING`. |

---

## Task State Machine

```
              POST /tasks
                  │
                  ▼
               [ OPEN ]
                  │
        PUT /bids/{id}/accept
        publishes BID_ACCEPTED
                  │
                  ▼
        (waiting for payment)
                  │
        consumes ESCROW_HELD
                  │
                  ▼
           [ IN_PROGRESS ]
                  │
     POST /tasks/{id}/submit        POST /tasks/{id}/dispute
     publishes WORK_SUBMITTED       publishes DISPUTE_RAISED
                  │                          │
                  ▼                          ▼
        [ PENDING_REVIEW ]            [ DISPUTED ]
                  │                          │
   consumes ESCROW_RELEASED      POST /tasks/{id}/resolve (admin)
   publishes TASK_COMPLETED      publishes DISPUTE_RESOLVED
                  │                          │
                  ▼                          ▼
            [ COMPLETED ]            [ COMPLETED ]
```

> **Critical rule:** `task-service` never directly calls `payment-service`. It publishes `BID_ACCEPTED` and waits. The transition from `OPEN` to `IN_PROGRESS` only happens when `payment-service` publishes `ESCROW_HELD` back.

All invalid transitions (e.g. `OPEN → COMPLETED`, `COMPLETED → DISPUTED`) throw a `409 Conflict`. The state machine is the single gatekeeper — no controller can bypass it.

---

## Domain Events

| Direction | Event | Payload | Trigger |
|---|---|---|---|
| **Publishes** | `BID_RECEIVED` | `taskId, taskTitle, posterId, bidderId, bidderName, amountLKR` | New bid submitted |
| **Publishes** | `BID_ACCEPTED` | `taskId, bidId, posterId, freelancerId, amountLKR` | Bid accepted by poster |
| **Publishes** | `WORK_SUBMITTED` | `taskId, posterId, freelancerId` | Freelancer submits work |
| **Publishes** | `TASK_COMPLETED` | `taskId, posterId, freelancerId` | Task transitions to COMPLETED |
| **Publishes** | `DISPUTE_RAISED` | `taskId, posterId, freelancerId, reason` | Either party raises a dispute |
| **Publishes** | `DISPUTE_RESOLVED` | `taskId, escrowAction (RELEASE\|REFUND)` | Admin resolves dispute |
| **Consumes** | `ESCROW_HELD` | `taskId` | Transition task `OPEN → IN_PROGRESS` |
| **Consumes** | `ESCROW_RELEASED` | `taskId` | Transition task `PENDING_REVIEW → COMPLETED`, publish `TASK_COMPLETED` |
| **Consumes** | `ESCROW_REFUNDED` | `taskId` | Transition task `DISPUTED → COMPLETED`, publish `TASK_COMPLETED` |

---

## Database Tables

### `tasks`

```sql
id              uuid  primary key  default gen_random_uuid()
poster_id       uuid  not null  references auth.users(id)
assigned_to     uuid  (nullable)  references auth.users(id)
poster_name     text  -- cached from JWT at creation time
poster_avatar   text  -- cached from JWT at creation time
title           text  not null
description     text  not null
budget_lkr      numeric(12,2)  not null  check (budget_lkr >= 100)
status          task_status  not null  default 'OPEN'
deadline        timestamptz  not null
category        text  not null
skill_tags      text[]  default '{}'
bid_count       int  default 0
dispute_reason  text  (nullable)  -- set when status = DISPUTED
created_at      timestamptz  default now()
updated_at      timestamptz  default now()
```

> `poster_name` and `poster_avatar` are cached from the JWT claims at task creation time so task list responses never need to call user-service at read time.

### `bids`

```sql
id             uuid  primary key  default gen_random_uuid()
task_id        uuid  not null  references tasks(id) on delete cascade
bidder_id      uuid  not null  references auth.users(id)
bidder_name    text  -- cached from JWT at bid creation time
bidder_avatar  text  -- cached from JWT at bid creation time
amount_lkr     numeric(12,2)  not null  check (amount_lkr >= 100)
proposal       text  not null
delivery_days  int  not null  check (delivery_days >= 1)
status         bid_status  not null  default 'PENDING'
created_at     timestamptz  default now()

constraint no_self_bid check (
  bidder_id != (select poster_id from tasks where id = task_id)
)
```

> The `no_self_bid` constraint is enforced at both the service layer (returns `403`) and the DB level (this `CHECK` constraint). Two layers of protection.

---

## Project Structure

```
task-service/
├── src/
│   └── main/
│       ├── java/com/taskbridge/taskservice/
│       │   ├── config/
│       │   │   └── SecurityConfig.java          # JWT filter chain — same pattern as user-service
│       │   ├── controller/
│       │   │   ├── TaskController.java           # All /tasks endpoints
│       │   │   └── BidController.java            # All /bids endpoints
│       │   ├── service/
│       │   │   ├── TaskStateMachine.java         # Enforces all valid state transitions — throws 409 on invalid
│       │   │   ├── TaskService.java              # Task CRUD, dynamic filtering via JPA Specification
│       │   │   ├── BidService.java               # Bid CRUD, atomic accept logic
│       │   │   ├── EventPublisher.java           # Publishes all domain events to the event bus
│       │   │   ├── EventConsumer.java            # Consumes ESCROW_HELD, ESCROW_RELEASED, ESCROW_REFUNDED
│       │   │   └── DeadlineScheduler.java        # @Scheduled — runs every 30 min, finds overdue tasks
│       │   ├── model/
│       │   │   ├── Task.java                     # JPA entity → tasks table
│       │   │   └── Bid.java                      # JPA entity → bids table
│       │   ├── repository/
│       │   │   ├── TaskRepository.java           # Extends JpaRepository + JpaSpecificationExecutor
│       │   │   └── BidRepository.java            # bulkRejectExcept(), existsByBidderIdAndTaskId()
│       │   ├── specification/
│       │   │   └── TaskSpecification.java        # Builds dynamic JPA Predicate from filter params
│       │   ├── dto/
│       │   │   ├── TaskRequest.java              # Validated create/update DTO
│       │   │   ├── TaskResponse.java             # Response shape with embedded poster info
│       │   │   ├── BidRequest.java               # Validated bid DTO
│       │   │   └── BidResponse.java              # Response shape — bidder info redacted for non-posters
│       │   └── TaskServiceApplication.java       # @SpringBootApplication + @EnableScheduling
│       └── resources/
│           └── application.yml                   # Port 8082, DATABASE_URL, JWT secret
└── src/test/
    └── java/com/taskbridge/taskservice/
        └── TaskServiceIntegrationTest.java       # Full lifecycle, bid-on-own-task 403, invalid transitions 409
```

---

## Key Implementation Notes

**Dynamic filtering on `GET /tasks`**

Use `JpaSpecificationExecutor<Task>` and a `TaskSpecification` class that builds a `Predicate` chain from whichever query params are present. This avoids writing a separate query method for every filter combination.

```java
// TaskSpecification.java (sketch)
public static Specification<Task> withFilters(TaskFilter f) {
  return (root, query, cb) -> {
    List<Predicate> p = new ArrayList<>();
    if (f.status()    != null) p.add(cb.equal(root.get("status"), f.status()));
    if (f.category()  != null) p.add(cb.equal(root.get("category"), f.category()));
    if (f.budgetMin() != null) p.add(cb.ge(root.get("budgetLkr"), f.budgetMin()));
    if (f.budgetMax() != null) p.add(cb.le(root.get("budgetLkr"), f.budgetMax()));
    if (f.posterId()  != null) p.add(cb.equal(root.get("posterId"), f.posterId()));
    if (f.search()    != null) {
      String like = "%" + f.search().toLowerCase() + "%";
      p.add(cb.or(
        cb.like(cb.lower(root.get("title")), like),
        cb.like(cb.lower(root.get("description")), like)
      ));
    }
    return cb.and(p.toArray(new Predicate[0]));
  };
}
```

**Atomic bid acceptance**

`BidService.accept()` must run inside a single `@Transactional` block. Steps in order:
1. Set winning bid status to `ACCEPTED`
2. Bulk-update all other bids on the same task to `REJECTED`
3. Set `tasks.assigned_to = bidderId`
4. Publish `BID_ACCEPTED` event **after** the transaction commits

If any step fails, the whole operation rolls back — no partial state.

**Caching poster/bidder info from JWT**

When a task is created, extract `fullName` and `avatarUrl` from the JWT claims and store them in `poster_name` and `poster_avatar` on the task row. Do the same for `bidder_name` and `bidder_avatar` when a bid is created. This means `GET /tasks` and `GET /tasks/{id}/bids` never need to call user-service to build a response.

**Deadline scheduler**

```java
// DeadlineScheduler.java
@Scheduled(fixedDelay = 1_800_000) // every 30 minutes
public void checkDeadlines() {
  List<Task> overdue = taskRepo.findByStatusAndDeadlineBefore(IN_PROGRESS, Instant.now());
  overdue.forEach(t -> eventPublisher.publish(new DeadlineApproachingEvent(
    t.getId(), t.getPosterId(), t.getAssignedTo(), t.getDeadline()
  )));
}
```

Enable scheduling by adding `@EnableScheduling` to `TaskServiceApplication.java`.

---

## Environment Variables

```env
DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
PORT=8082
```

---

## Running Locally

```bash
# from monorepo root — starts all services including Redis for event bus
docker compose up task-service

# standalone
cd services/task-service
mvn spring-boot:run
```

Service available at `http://localhost:8082`.  
Through the gateway: `http://localhost:3000/api/v1/tasks/...`

---

## Running Tests

```bash
cd services/task-service
mvn test
```

Tests cover: full task lifecycle, bid-on-own-task returns `403`, `no_self_bid` constraint, atomic bid acceptance rejects all other bids, every invalid state transition returns `409`.

---

## Key Rules

- **Never call user-service, payment-service, or notification-service via REST.** Publish events and let them react.
- **All state transitions go through `TaskStateMachine.java`** — no controller is allowed to set `task.status` directly.
- **`poster_id` always comes from the JWT**, never from the request body. A client cannot impersonate another poster.
- **Bid acceptance is all-or-nothing** — wrap the full accept operation in `@Transactional`.
- **Disputes are a task state, not a separate entity.** The `dispute_reason` is a column on the `tasks` table. There is no separate disputes service or table in task-service.
- **Add DB indexes** on `tasks(status)`, `tasks(poster_id)`, `tasks(deadline)`, `tasks(category)` before going to production.

---

*Part of the TASKBRIDGE microservices monorepo — see `/docs/architecture.md` for the full system overview.*
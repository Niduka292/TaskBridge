# user-service

Owns all user identity data — profiles and the review system. Supabase Auth handles login and JWT issuance; this service only manages what happens after authentication.

---

## Responsibility

- Store and serve user profile data (`profiles` table)
- Handle the review system with blind-reveal logic (`reviews` table)
- Keep `balance` and `completedTaskCount` up to date by consuming the `ESCROW_RELEASED` event from payment-service — no direct REST call to payment-service ever

---

## Stack

| Property | Value |
|---|---|
| Framework | Spring Boot 3 |
| Language | Java 21 |
| Database | Supabase PostgreSQL — `profiles`, `reviews` tables |
| Port | `8081` |
| Deployment | Railway |

---

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/users/{userId}` | Required | Get profile. Caller's own profile additionally includes `balance` and `recentReviews` (latest 3 embedded). |
| `PUT` | `/api/v1/users/{userId}` | Required | Update own profile (fullName, bio, skills, avatarUrl). Returns `403` if caller ≠ userId. |
| `GET` | `/api/v1/users/{userId}/reviews` | Required | Paginated reviews for a user. Filter with `?context=AS_POSTER` or `?context=AS_FREELANCER`. Only revealed reviews returned. |
| `POST` | `/api/v1/users/{userId}/reviews` | Required | Submit a review after task completion. Blind until both parties submit — neither sees the other's rating until both have posted. Publishes `REVIEW_POSTED` event on success. |

---

## Domain Events

| Direction | Event | What to do |
|---|---|---|
| **Publishes** | `REVIEW_POSTED` | Fired after both parties submit a review and ratings are revealed |
| **Consumes** | `ESCROW_RELEASED` | Increment `profiles.balance` by `amountLKR` and `completedTaskCount` by 1 for the payee |

---

## Database Tables

### `profiles`

```sql
id                       uuid  -- maps to Supabase auth.users(id)
full_name                text
avatar_url               text  (nullable)
bio                      text  (nullable)
skills                   text[]
avg_rating_as_poster     float8  default 0
avg_rating_as_freelancer float8  default 0
balance                  numeric(12,2)  default 0
completed_task_count     int  default 0
is_admin                 boolean  default false
created_at               timestamptz
```

> A Postgres trigger auto-creates a `profiles` row whenever a new user registers via Supabase Auth. You do not create profiles manually.

### `reviews`

```sql
id           uuid
task_id      uuid
reviewer_id  uuid
reviewee_id  uuid
context      text  -- 'AS_POSTER' or 'AS_FREELANCER'
rating       int   -- 1 to 5
comment      text  (nullable)
revealed     boolean  default false
created_at   timestamptz
```

> `revealed` is set to `true` only when both the reviewer and reviewee have each submitted a review for the same task. Until then, neither party can see the other's rating.

---

## Project Structure

```
user-service/
├── src/
│   └── main/
│       ├── java/com/taskbridge/userservice/
│       │   ├── config/
│       │   │   ├── SecurityConfig.java       # JWT filter chain, stateless session
│       │   │   └── JwtAuthFilter.java        # Validates Supabase JWT, sets SecurityContext
│       │   ├── controller/
│       │   │   ├── UserController.java       # GET /users/{id}, PUT /users/{id}
│       │   │   └── ReviewController.java     # GET + POST /users/{id}/reviews
│       │   ├── service/
│       │   │   ├── UserService.java          # Profile retrieval and update logic
│       │   │   ├── ReviewService.java        # Blind review logic, rating recalculation
│       │   │   └── EventConsumer.java        # Handles ESCROW_RELEASED event
│       │   ├── model/
│       │   │   ├── Profile.java              # JPA entity → profiles table
│       │   │   └── Review.java               # JPA entity → reviews table
│       │   ├── repository/
│       │   │   ├── ProfileRepository.java    # incrementBalance(), incrementCompletedCount()
│       │   │   └── ReviewRepository.java     # findCounterpart(), existsByReviewerIdAndTaskId()
│       │   ├── dto/
│       │   │   ├── ProfileResponse.java      # Response shape (balance only if own profile)
│       │   │   └── ReviewRequest.java        # Validated review submission DTO
│       │   └── UserServiceApplication.java   # @SpringBootApplication entry point
│       └── resources/
│           └── application.yml               # Port 8081, DATABASE_URL, JWT secret
└── src/test/
    └── java/com/taskbridge/userservice/
        └── UserServiceTest.java              # Profile retrieval, 403 ownership, blind review logic
```

---

## Environment Variables

```env
DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
PORT=8081
```

Set these in Railway under the service's **Variables** tab. For local dev, add them to the root `.env` file — Docker Compose picks them up automatically.

---

## Running Locally

```bash
# from the monorepo root — starts all services
docker compose up user-service

# or run just this service standalone
cd services/user-service
mvn spring-boot:run
```

Service will be available at `http://localhost:8081`.  
Through the gateway: `http://localhost:3000/api/v1/users/...`

---

## Running Tests

```bash
cd services/user-service
mvn test
```

Tests cover: profile retrieval, ownership enforcement (403 on wrong user), balance increment on `ESCROW_RELEASED`, and blind review reveal logic.

---

## Key Rules

- **Never issue JWT tokens** — that is Supabase Auth's job. This service only validates them via `NimbusJwtDecoder`.
- **Never call payment-service directly** — update `balance` only by consuming the `ESCROW_RELEASED` event.
- **Never expose `balance` to anyone other than the profile owner** — check `callerId.equals(userId)` before including it in the response.
- **The `revealed` flag on reviews is set by the service layer**, not by the client. A client cannot force a review to be revealed early.

---

*Part of the TASKBRIDGE microservices monorepo — see `/docs/architecture.md` for the full system overview.*
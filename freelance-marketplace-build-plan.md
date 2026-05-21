# Freelance Task Marketplace — 8-Week Build Plan

> **Team:** 3 developers · **Stack:** Next.js 14 + Spring Boot 3 + Supabase (PostgreSQL) · **Target:** Sri Lanka student marketplace (LKR-native, university-verified)

---

## Tech Stack

| Layer | Technology | Owner | Rationale |
|---|---|---|---|
| Frontend | Next.js 14 (React, App Router) | You | SSR for task listings, your strongest skill |
| Backend | Spring Boot 3 | Teammates | Team's Java experience, clean REST layer |
| Database | Supabase (PostgreSQL) | Teammate 1 | Managed Postgres, built-in auth, storage, real-time, free tier |
| Auth | Supabase Auth + Spring Security | Teammate 2 | Supabase handles email verification & sessions; Spring Security guards API routes |
| File storage | Supabase Storage | You | Profile avatars, task attachments — same platform, no extra account |
| Payments | PayHere (LKR-native) | Teammate 1 | No FX conversion, webhook-based escrow |
| Real-time | Supabase Realtime | Teammate 2 | Postgres change subscriptions replace Spring WebSocket boilerplate |
| DevOps | Docker + Railway/Render + Vercel | Teammate 2 | Vercel for Next.js, Railway for Spring Boot, Supabase is already hosted |
| API contract | OpenAPI / Swagger UI | All | Frontend mocks from spec while backend builds |

> **Why Supabase over raw MySQL?** Supabase gives you a managed PostgreSQL database, built-in auth with email verification, file storage, and real-time subscriptions — all on a generous free tier. This replaces Cloudinary, Spring WebSocket, and the hand-rolled email verification you would have needed with MySQL. Your teammates still write standard Spring Data JPA against PostgreSQL, so the learning curve is minimal.

> **Why not Node.js for the backend?** Your teammates know Java well. Mixing two backend languages in a 2-month deadline adds coordination overhead. Clear seams beat familiarity overlap.

---

## Role Model Change — Everyone Can Post & Bid

Users no longer have a fixed `POSTER` or `FREELANCER` role. Every user can both post tasks and bid on tasks. The `role` column is replaced with an `is_admin` flag. Role context is determined by the relationship to a task — if you created it, you are the poster on that task; if you bid on it, you are the freelancer on that task.

This simplifies the auth model significantly: no role selection at signup, no role-switching UX, and no Spring Security role guards on task/bid endpoints (only ownership checks).

---

## Team Responsibilities

### You — Frontend Lead (Next.js)
- All Next.js pages and React components
- Tailwind UI, responsive design, loading states
- Supabase JS client for auth (sign up, sign in, session management)
- Supabase Storage integration for avatar and file uploads
- Supabase Realtime subscriptions (bid notifications, chat)
- PayHere checkout redirect and confirmation page
- OpenAPI contract definition (day 1 priority)
- Admin panel UI

### Teammate 1 — Backend: Data & Business Logic
- Supabase project setup, PostgreSQL schema, migrations via Supabase SQL editor
- Spring Data JPA with PostgreSQL dialect — entities and repositories
- Task, bid, and escrow service layer
- REST controller layer
- PayHere webhook handler
- JUnit 5 integration tests for core flows

### Teammate 2 — Backend: Infrastructure & Real-time
- Supabase Auth integration with Spring Security (validate Supabase JWT in Spring)
- Row-level security (RLS) policies on Supabase tables as a safety net
- Supabase Realtime channel config for bid and chat events
- Spring `@Scheduled` deadline escalation jobs
- Dispute and admin endpoints
- Vercel + Railway production deploy, ENV secrets management

**Sync cadence:** 15-minute standup every Mon/Wed/Fri on Discord. GitHub Projects board: `To Do → In Progress → Review → Done`.

---

## Database Schema

All tables live in Supabase (PostgreSQL). PKs are UUID defaulting to `gen_random_uuid()`. Every table has `created_at TIMESTAMPTZ DEFAULT now()` and `updated_at TIMESTAMPTZ DEFAULT now()`.

### `profiles`
Extends Supabase Auth's built-in `auth.users` table. Created automatically via a Postgres trigger on user signup.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | References `auth.users(id)` |
| full_name | TEXT | |
| avatar_url | TEXT | Supabase Storage URL |
| bio | TEXT | |
| skills | TEXT[] | PostgreSQL array of skill tags |
| avg_rating_as_poster | NUMERIC(3,2) | Recalculated on each new review |
| avg_rating_as_freelancer | NUMERIC(3,2) | Recalculated on each new review |
| balance | NUMERIC(12,2) DEFAULT 0 | Freelancer wallet balance |
| is_admin | BOOLEAN DEFAULT false | |
| is_verified | BOOLEAN DEFAULT false | Set true after Supabase email confirmation |

> No `role` column — every user can post and bid. Context is determined by task ownership.

### `tasks`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| poster_id | UUID FK → profiles | User who created the task |
| assigned_to | UUID FK → profiles NULL | Set on bid acceptance |
| title | TEXT | |
| description | TEXT | |
| budget | NUMERIC(12,2) | |
| status | TEXT | See state machine below |
| deadline | TIMESTAMPTZ | |
| category | TEXT | |
| skill_tags | TEXT[] | PostgreSQL array |

**Task status state machine:** `OPEN → IN_PROGRESS → PENDING_REVIEW → COMPLETED / DISPUTED`

### `bids`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| task_id | UUID FK → tasks | |
| bidder_id | UUID FK → profiles | The user placing the bid |
| amount | NUMERIC(12,2) | |
| proposal | TEXT | |
| status | TEXT | `PENDING`, `ACCEPTED`, `REJECTED` |
| delivery_days | INT | |

> **Constraint:** A user cannot bid on their own task. Enforced at the API layer and as a Postgres check constraint.

### `escrow_transactions`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| task_id | UUID FK → tasks | |
| payer_id | UUID FK → profiles | Poster who funded escrow |
| payee_id | UUID FK → profiles | Freelancer to receive funds |
| amount | NUMERIC(12,2) | |
| status | TEXT | `HELD`, `RELEASED`, `REFUNDED` |
| gateway_ref | TEXT | PayHere transaction ID |

### `messages`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| task_id | UUID FK → tasks | One thread per task |
| sender_id | UUID FK → profiles | |
| content | TEXT | |
| is_read | BOOLEAN DEFAULT false | |

### `reviews`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| task_id | UUID FK → tasks | |
| reviewer_id | UUID FK → profiles | |
| reviewee_id | UUID FK → profiles | |
| context | TEXT | `AS_POSTER` or `AS_FREELANCER` — which hat the reviewee wore |
| rating | SMALLINT | 1–5 |
| comment | TEXT | |

### `disputes`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| task_id | UUID FK → tasks | |
| raised_by | UUID FK → profiles | |
| reason | TEXT | |
| status | TEXT | `OPEN`, `UNDER_REVIEW`, `RESOLVED` |
| resolution | TEXT NULL | Admin decision |

### `notifications`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → profiles | |
| type | TEXT | `BID_RECEIVED`, `BID_ACCEPTED`, `PAYMENT_HELD`, etc. |
| payload | JSONB | Contextual data |
| is_read | BOOLEAN DEFAULT false | |

---

## API Modules

| Module | Key Endpoints | Priority | Week |
|---|---|---|---|
| Auth | Handled by Supabase Auth SDK (sign up, sign in, verify email, refresh) | P1 | 1 |
| Profiles | `GET /profiles/:id` · `PUT /profiles/:id` · `GET /profiles/:id/reviews` · `GET /profiles/:id/portfolio` | P1 | 2 |
| Tasks | `POST /tasks` · `GET /tasks` · `GET /tasks/:id` · `PUT /tasks/:id` · `DELETE /tasks/:id` | P1 | 3 |
| Bids | `POST /tasks/:id/bids` · `GET /tasks/:id/bids` · `PUT /bids/:id/accept` · `DELETE /bids/:id` | P1 | 4 |
| Escrow / Payments | `POST /payments/initiate` · `POST /payments/webhook` · `POST /escrow/:id/release` · `POST /escrow/:id/refund` | P1 | 5 |
| Messages | `GET /tasks/:id/messages` · Supabase Realtime subscription for live chat | P2 | 6 |
| Reviews | `POST /tasks/:id/review` · `GET /profiles/:id/reviews` | P2 | 6 |
| Disputes | `POST /disputes` · `GET /disputes/:id` · `PUT /disputes/:id/resolve` (admin only) | P2 | 6 |
| Notifications | `GET /notifications` · `PUT /notifications/read` · Supabase Realtime for live push | P2 | 7 |
| Admin | `GET /admin/users` · `PUT /admin/users/:id/ban` · `GET /admin/disputes` | P3 | 8 |

---

## 8-Week Timeline

### Phase 1 — Foundation (Weeks 1–2)

#### Week 1 · Project setup & contracts
- **All:** GitHub repo, branching strategy (`main` / `dev` / feature branches)
- **All:** Define OpenAPI spec — agree on all endpoint request/response shapes before coding begins
- **You:** Next.js scaffold, Tailwind config, folder structure, Supabase JS client setup
- **You:** Auth pages (sign up, sign in, email confirmation landing) using Supabase Auth UI or custom forms
- **Teammate 1:** Supabase project creation, PostgreSQL schema (profiles, tasks, bids), Spring Boot project init with PostgreSQL + JPA
- **Teammate 2:** Spring Security filter to validate Supabase-issued JWTs on every API request, basic RLS policies

#### Week 2 · Auth + user profiles
- **You:** Full auth flow — register, Supabase email verification, login, session persistence in Next.js
- **You:** Profile page — view/edit, avatar upload to Supabase Storage
- **Teammate 1:** Profile CRUD endpoints, Postgres trigger to auto-create `profiles` row on `auth.users` insert
- **Teammate 2:** Ownership middleware — extract user ID from Supabase JWT and attach to Spring request context

---

### Phase 2 — Core Marketplace (Weeks 3–5)

#### Week 3 · Task posting & browsing
- **You:** Post-a-task form (title, description, budget, deadline, skill tags, category)
- **You:** Task listing page with filters (category, budget range, status, skill tags)
- **Teammate 1:** Task CRUD endpoints, pagination, filter/search with JPA Specification or JPQL
- **Teammate 2:** Skill tags and category taxonomy, task status state machine service with guard checks

#### Week 4 · Bidding system
- **You:** Task detail page — bid list, submit-bid form, compare-bids UI
- **You:** User profile card (ratings as poster and as freelancer, completed task count, skill tags)
- **Teammate 1:** Bid CRUD endpoints, accept-bid logic (sets `assigned_to`, rejects other bids)
- **Teammate 2:** Supabase Realtime — subscribe to `bids` table inserts, push notification to task poster
- **All:** Enforce "cannot bid on your own task" at API layer

#### Week 5 · Escrow & payments ⚠️ highest risk week
- **You:** Payment flow UI — PayHere checkout redirect, escrow status indicator on task page
- **You:** Task workspace page — poster approves delivery, triggers escrow release
- **Teammate 1:** Escrow table, PayHere webhook handler, hold / release / refund logic
- **Teammate 2:** Freelancer wallet balance update on release, withdrawal request model

> **Risk note:** If Week 5 slips, cut the real-time chat and ship email-only communication for the demo. Escrow and bidding are the non-negotiables.

---

### Phase 3 — Trust & Communication (Weeks 6–7)

#### Week 6 · Messaging, ratings & disputes
- **You:** In-task chat UI using Supabase Realtime subscription on `messages` table
- **You:** Review and rating form — post-completion, both parties rate each other with context (`AS_POSTER` / `AS_FREELANCER`)
- **Teammate 1:** Message persistence endpoint, rating aggregate recalculation for both `avg_rating_as_poster` and `avg_rating_as_freelancer`
- **Teammate 2:** Dispute table and admin dispute resolution endpoints

#### Week 7 · Notifications, portfolio & dashboard
- **You:** Notification bell using Supabase Realtime on `notifications` table, notification list with mark-as-read
- **You:** User portfolio page — tasks completed as freelancer, tasks posted, both rating dimensions
- **You:** Unified dashboard — "My Posted Tasks" tab and "My Bids & Jobs" tab on the same page
- **Teammate 1:** Notification insert logic triggered from service layer, email notification via Supabase Edge Functions or SendGrid
- **Teammate 2:** Deadline escalation scheduler (`@Scheduled`), automated reminder emails

---

### Phase 4 — Polish & Launch (Week 8)

#### Week 8 · Testing, admin panel & deploy
- **You:** Admin panel (user management, task moderation, dispute list)
- **You:** Responsive polish, loading skeletons, error states, empty states
- **Teammate 1:** JUnit 5 integration tests for core flows (full task lifecycle, escrow state transitions)
- **Teammate 2:** Vercel deploy for Next.js, Railway deploy for Spring Boot, Supabase prod environment, ENV secrets
- **All:** End-to-end UAT — run a full task lifecycle (post → bid → escrow → deliver → review), fix blockers

---

## Key Technical Decisions

### Supabase Auth + Spring Security integration
Supabase issues JWTs signed with your project's JWT secret. In Spring Security, configure a `JwtDecoder` bean pointed at your Supabase JWT secret to validate tokens on every API request. The user's UUID from the JWT `sub` claim becomes the identity in your service layer — no separate user table management needed.

```java
// Spring Security JWT config (Week 1, Teammate 2)
@Bean
public JwtDecoder jwtDecoder() {
    return NimbusJwtDecoder.withSecretKey(
        new SecretKeySpec(supabaseJwtSecret.getBytes(), "HmacSHA256")
    ).build();
}
```

### Supabase Realtime replaces Spring WebSocket
Instead of configuring a STOMP broker, subscribe to Postgres table changes directly in the Next.js frontend. Simpler setup, no Spring WebSocket infra needed.

```js
// Next.js — subscribe to new bids on a task (Week 4, You)
supabase
  .channel('bids-on-task-' + taskId)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids', filter: `task_id=eq.${taskId}` }, handleNewBid)
  .subscribe()
```

### No fixed roles — ownership checks instead
Because every user can post and bid, Spring Security guards shift from role-based (`hasRole('POSTER')`) to ownership-based. The service layer extracts the user UUID from the JWT and checks it against `task.poster_id` or `bid.bidder_id` as appropriate.

### OpenAPI contract on day 1
Define all request/response shapes in Swagger before writing a single controller or page component. The frontend mocks backend responses locally while the real endpoints are being built, allowing fully parallel development with a clean merge.

### PayHere webhook setup
PayHere sends an HTTP POST to your server when payment confirms. This must hit the Spring Boot backend — not Next.js. Use `ngrok` locally for webhook testing during development. Always validate the PayHere signature hash before releasing escrow funds.

### Task state machine is the spine
Every feature reacts to task status transitions. Implement this as a dedicated service with guard checks — not raw status updates scattered across controllers. This prevents invalid transitions (e.g. releasing escrow on an `OPEN` task).

---

## GitHub Structure Recommendation

### Use a GitHub Organization with a Monorepo

**Recommended: 1 GitHub Organization + 1 monorepo**

```
github.com/your-org/
└── taskmarket/          ← single monorepo
    ├── frontend/        ← Next.js app
    ├── backend/         ← Spring Boot app
    ├── supabase/        ← migrations, RLS policies, seed data
    │   └── migrations/
    ├── docs/            ← OpenAPI spec, architecture notes
    └── docker-compose.yml
```

**Why a monorepo over separate repos:**
- One pull request can touch frontend + backend + migration together — atomic changes, no cross-repo PR linking
- Shared issue tracker and GitHub Projects board — one place to see all work
- Easier for a 3-person team to stay in sync; no juggling multiple repo notifications
- Supabase migrations stay version-controlled alongside the code that depends on them

**Why a GitHub Organization over a personal repo:**
- All three of you have equal ownership — no single person is the bottleneck for repo settings
- Cleaner URL and professional presentation if you demo or deploy publicly
- Free for public repos; free private org repos for up to 3 members on GitHub Free

**Branch strategy inside the monorepo:**
```
main         ← protected, production-ready only
dev          ← integration branch, all features merge here first
feat/xxx     ← short-lived feature branches off dev
```
Require at least 1 PR review before merging to `dev`, and 2 reviews before merging `dev → main`.

---

## Hosting Plan

| Service | Platform | Cost | Notes |
|---|---|---|---|
| Next.js frontend | Vercel | Free | Auto-deploys on `main` push, edge CDN, perfect Next.js support |
| Spring Boot API | Railway | Free → $5/mo | Free tier has 500 hours/month; upgrade if you go live |
| Database + Auth + Storage + Realtime | Supabase | Free | 500MB DB, 1GB storage, 2GB bandwidth — enough to launch |
| Domain | Namecheap / Google Domains | ~$10/yr | Optional; all platforms give free subdomains |
| PayHere | PayHere | % per transaction | No monthly fee; only pay when money moves |

**Total cost to launch: ~$0–$10/month** depending on whether you buy a custom domain.

### Deploy flow
1. **Supabase** — create a project at supabase.com, run migrations from `supabase/migrations/`, set RLS policies
2. **Railway** — connect GitHub org repo, point at `/backend`, set ENV vars (`SUPABASE_JWT_SECRET`, `PAYHERE_SECRET`, `DATABASE_URL` from Supabase)
3. **Vercel** — connect GitHub org repo, point at `/frontend`, set ENV vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `BACKEND_URL`)
4. Push to `main` → Vercel and Railway auto-deploy

---

## What to Cut If Time Runs Short

| Feature | Cut decision |
|---|---|
| Real-time chat | Replace with email thread — still functional, ship Realtime in v2 |
| Withdrawal/payout flow | Mock with admin-triggered manual transfer for demo |
| Admin panel | Ship a read-only view; full ban/resolve in v2 |
| Portfolio shareable URL | Just use the profile page URL |
| Deadline escalation emails | Log the escalation in DB, skip the email for demo |

---

*Generated for a 3-person team, 2-month timeline, Sri Lanka student freelance marketplace.*

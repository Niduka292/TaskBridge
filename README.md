# TaskBridge — Freelance Task Marketplace

A full-stack, LKR-native freelance marketplace in Sri Lanka. This platform bridges the gap between clients (posters) and freelancers, utilizing university-verified email matching and secure webhook-based escrow payments.

## Tech Stack

| Layer | Technology | Key Details |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) | SSR for public listings, Tailwind UI, Supabase JS Client |
| **Gateway** | Nginx / Kong | Single entry point, JWT validation, rate limiting |
| **Services** | Spring Boot 3 + Node.js | Microservices: user, task, payment, notification |
| **Database** | Supabase (PostgreSQL) | Managed DB, native arrays, automated profile creation via triggers |
| **Auth** | Supabase Auth + Spring Security | JWT generation via Supabase; token decoding/validation via Spring |
| **Payments** | PayHere (LKR-Native) | Direct payment gateway integration with secure hash-validated escrows |
| **Hosting** | Vercel + Railway | Next.js on Vercel; services on Railway |

## Repository Structure

```text
TaskBridge/
├── gateway/                 # API gateway (Nginx + Kong config)
│   ├── kong.yml
│   ├── nginx.conf
│   └── Dockerfile
├── services/                # Microservices
│   ├── user-service/        # Auth & profiles (Spring Boot — port 8001)
│   ├── task-service/        # Tasks & bids (Spring Boot — port 8002)
│   ├── payment-service/     # PayHere & escrow (Spring Boot — port 8003)
│   └── notification-service/# WhatsApp & alerts (Node.js — port 8004)
├── frontend/                # Next.js 14 client app
├── supabase/                # Database migrations & seed data
│   ├── migrations/
│   └── seed.sql
├── docs/                    # Architecture & API contract
│   ├── architecture.md
│   ├── build-plan.md
│   └── openapi.yaml
├── docker-compose.yml
├── Makefile
├── .env
└── README.md
```

## Quick Start

```bash
# Copy and fill in environment variables
cp .env .env.local   # edit with your Supabase / PayHere keys

# Start infrastructure + gateway + services
make up

# Run frontend locally
make frontend

# Run a single service
make user
```

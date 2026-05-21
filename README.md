# 🐝 TaskMarket — Freelance Task Marketplace

A full-stack, LKR-native freelance marketplace in Sri Lanka. This platform bridges the gap between  clients (posters) and freelancers, utilizing university-verified email matching and secure web-hook based escrow payments.

## 🚀 Tech Stack & Core Infra

| Layer | Technology | Key Details |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) | SSR for public listings, Tailwind UI, Supabase JS Client |
| **Backend** | Spring Boot 3 (Java 17) | Clean REST layer, Spring Data JPA, Spring Security |
| **Database** | Supabase (PostgreSQL) | Managed DB, native Arrays, automated profile creation via triggers |
| **Auth** | Supabase Auth + Spring Security | JWT generation via Supabase; token decoding/validation via Spring |
| **Real-time** | Supabase Realtime | Postgres change replication (`bids`, `messages`, `notifications`) |
| **Payments** | PayHere (LKR-Native) | Direct payment gateway Integration with secure hash-validated escrows |
| **Hosting** | Vercel + Railway | Next.js on Vercel; Spring Boot API on Railway |

---

## 📂 Repository Architecture

This repository is organized as a unified **monorepo** to allow atomic pull requests across the frontend, backend, and database migrations.

```text
taskmarket/
├── backend/                 # Spring Boot 3 Java API
│   ├── src/main/java/com/taskmarket/backend/
│   │   ├── config/          # Spring Security JWT Filters
│   │   ├── controller/      # REST API Controllers
│   │   ├── model/           # JPA Entities mapped to PostgreSQL
│   │   └── service/         # Task State Machine & Escrow Logic
│   └── pom.xml
├── frontend/                # Next.js 14 Client App
│   ├── src/app/             # Pages, layouts, and route groups
│   ├── src/components/      # Reusable Tailwind UI components
│   └── src/lib/             # Supabase Client client configuration
├── supabase/                # Database configurations & migrations
│   ├── migrations/          # Managed SQL migration scripts
│   └── seed.sql             # Mock data for local environments
└── docs/
    └── openapi.yaml         # Single-source-of-truth API contract
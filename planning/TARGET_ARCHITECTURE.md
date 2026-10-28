# TARGET_ARCHITECTURE.md — Proposed Target Architecture (PROPOSAL)

All content marked **[proposed]**. Nothing here is final until Phase-3 review approval.

## 1. Evaluation: modular monolith vs microservices

**[proposed] Modular monolith** (NestJS), single deployable NestJS app + Next.js frontend + PostgreSQL.

Justification:
- Legacy is a single API + SPA + DB; no distributed load demands evidenced.
- Phase-1 scope is 3 modules sharing 90% of master data — service boundaries between them would force distributed joins/masters sync for zero current benefit.
- Operational footprint today: no CI/CD, no containerization history — minimize ops change.
- Growth path: enforce module boundaries + wants events later; NestJS modules can be extracted later if needed (documented criteria in DECISIONS).

## 2. System context

```
┌───────────────┐        HTTPS/REST        ┌─────────────────┐        SQL        ┌────────────┐
│  Next.js SPA  │  ─────────────────────► │  NestJS API     │ ────────────────► │ PostgreSQL │
│  (frontend)   │   JSON + JWT/session     │  (Express)      │    Prisma         │            │
└───────────────┘                          └───────┬─────────┘                   └────────────┘
                                                   │
                                       ┌───────────┼─────────────┐
                                       │ documents │ Cron (Nest) │  ← expiry alert job (was HRMS.Service arg 3)
                                       │ storage   │ Scheduler   │
                                       └───────────┴─────────────┘
```

## 3. Module boundaries (NestJS)

| Module | Scope | Public API prefix |
|---|---|---|
| `auth` | login, logout, refresh, forgot/reset/change password, account lockout | `/api/v1/auth/*` |
| `users` | site-user CRUD, user↔employee link, site-user list | `/api/v1/users/*` |
| `rbac` | user types, roles, menus, menu↔user-type assignment, permission checks | `/api/v1/rbac/*` |
| `masters` | metadata definitions + standard masters (department, site/branch, designation, grade, employee type, parameters, shifts, weekly-off, holidays) | `/api/v1/masters/*` |
| `employees` | employee profile master (in-scope fields), dependants | `/api/v1/employees/*` |
| `documents` | document CRUD, file upload/download/replace/delete, expiry tracking, reports, weekly alert job | `/api/v1/documents/*` |
| shared | `prisma`, `config`, `common` (Guards, Pipes, Filters, Message-catalog) | — |

Ownership rules only as in AGENTS.md §6; a task belongs to exactly one module; cross-module access via exported Nest services (same process).

## 4. Data architecture highlights

- PostgreSQL database `hrms` (dev: `hrms_dev`) — **[proposed]** schemas per domain: `hrms.identity` etc.? Keep simple: single schema `public` with explicit `@map` names, statuses/params in lookup tables.
- **Prisma models** in `prisma/schema.prisma` use camelCase with snake_case mapping. The Phase-2 draft has been validated against the discovered schema and proc behavior; it remains a design draft until the API/data-model review.
- Keep the *definitions-driven* flexibility of the legacy metadata engine for master forms and document types, but re-implemented safely: the draft uses `FormEntity`/`FormField` (with field type catalog, validation metadata, and JSONB config), while business records remain typed models — **approved for Phase 2 by D-003**. No metadata value may generate SQL identifiers or SQL fragments.
- Message codes preserved via `error_catalog` table mapping legacy `MessageId` → new code + text (keeps UI messages identical across cutover).
- Timezone: persist UTC `timestamptz`; use deployment `APP_TIMEZONE` for display and local-date calculations (D-018).

## 5. API conventions (summary — full spec in future API_SPECIFICATION.md)

- REST, versioned `/api/v1`; GET for reads (legacy POST-only intentionally redesigned).
- JSON: camelCase; envelopes `{ "data": ..., "message": { "code": "...", "text": "..." }, "pagination": { … } }`.
- Auth: `Authorization: Bearer <access-token>`; refresh via httpOnly cookie or header (D-007 approved for design; transport choice still requires implementation review).
- Validation failures → 400 with field-level errors; forbidden → 403; unauthenticated → 401; not-found → 404.
- OpenAPI via `@nestjs/swagger`; UI at `/docs` (disabled in prod or secured).

## 6. Frontend architecture (Next.js)

- App router, TypeScript strict; **no jQuery**; UI framework decision pending (stakeholder visual acceptance — new UI expected, but keep information architecture/labels of legacy) — [proposed] Tailwind + minimal headless components.
- Auth via short-lived access token plus server-side refresh session; Next middleware redirects (replaces per-component localStorage checks).
- Pages in scope: login, forgot/reset, site users, menu setup (admin), master setup screens (department/branch/role/etc.), employee list/form, shift master, weekly-off/holiday config, admin documents, my documents, document reports.
- Preserve core UX flows (e.g., metadata-form-driven master screens) while replacing dead legacy flows with the approved forgot/change-password flows (D-013).

## 7. Background jobs

- In-process `@nestjs/schedule` cron initially: daily (future leave features) and weekly document expiry (alert emails with attachments) — [proposed]; if scale demands later: BullMQ with Redis (separate DECISION before adopting).

## 8. Environments & deployment (proposal)

| Env | Hosting | DB | Notes |
|---|---|---|---|
| dev | local | local PG (`hrms_dev`) | seed synthetic data only |
| test/staging | TBD | staging PG restored from UAT (by humans) | full test env for cutover rehearsal |
| prod | TBD (IIS replaced; likely Linux box/container) | prod PG | cutover from SQL Server via migration plan |

## 9. Observability

- pino structured logs + request correlation IDs; App-Insights equivalent TBD (hosting decision); health endpoints (`/healthz`, `/readyz`).

## 10. Testing (summary — TEST_STRATEGY.md)

- Jest unit + Supertest e2e + Prisma test DB; rule-based regression matrix from BUSINESS_RULES.md; contract tests comparing legacy response shapes during parity phase (optional).

## 11. Explicitly out of scope (phase 1)

Leave/payroll/muster/reports engine internals, Excel DataInput pipeline (may need phase-2), PMS push integration (flagged as needed later), e-movers attendance sync.

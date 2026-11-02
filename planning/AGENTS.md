# AGENTS.md — Project Instructions for AI Coding Agents

**Read this file completely before doing any work in this repository or any HRMS-related task.**

## 1. Project overview

We are migrating a business-critical HRMS (Human Resource Management System) from a legacy
.NET + Angular + SQL Server stack to a modern stack:

- **Backend:** Node.js with NestJS (Express adapter), TypeScript
- **Frontend:** Next.js with TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **API:** REST with versioned routes (`/api/v1/...`), OpenAPI/Swagger documentation

Phase-1 scope is limited to three modules:

1. **User Management** — login/logout, forgot/reset/change password, sessions, roles, rights, menus, user↔employee mapping.
2. **Setup / Master Data** — department, designation, branch, grade, employee masters, sites, weekly-off, shifts/roster, parameters, other reference data.
3. **Document Management** — passport, visa, Emirates ID, driving licence and other employee documents; upload/download, expiry tracking, alerts.

Everything else (leave, payroll, muster, reports, Excel import) is out of scope until those
modules are approved.

## 1.5 Cross-stack review rule

**Before writing or changing any feature, review both the legacy backend source and the legacy frontend source for that feature, then review the current new backend and frontend.**

- Read the relevant legacy controller/service/DTO/manager (e.g. `*.cs`) and the matching legacy UI/template (e.g. `*.html`, `*.js`).
- Read the current NestJS DTO/service/controller and the current Next.js page/components/API client.
- Only then make changes. This prevents mismatched fields, missing dropdowns, and orphaned UI controls.
- Summarize the mapping (legacy field → new field, legacy dropdown → new lookup/parameter) in the task notes or `planning/DATABASE_DISCOVERY.md`/`BUSINESS_RULES.md` when the gap is non-trivial.

## 2. Mandatory read-only restrictions

### 2.1 Legacy repository (`D:\.net\hrms`)

The legacy repository is the **single source of truth for current behavior**. It must never change.

- **Prohibited:** editing, creating, deleting, renaming, reformatting, or "cleaning up" any file under `D:\.net\hrms` — including `.suo`, `.user`, `bin/`, `obj/`, logs, and generated files.
- **Prohibited:** running any package manager, `dotnet build`, `npm install`, build, lint, or migration command against it.
- **Prohibited:** committing, reverting, or otherwise changing its git state (its current `git status` has pre-existing human modifications that belong to the user — leave them exactly as they are and never commit them).
- **Allowed read-only operations:** reading source, searching (`grep`/`glob`), listing directories, and git commands that do not mutate state (`git log`, `git show`, `git diff`).

All analysis conclusions, mappings, and planning documents belong in THIS repository (`D:\NodeJs\Swan\Hrms`) under `planning/`.

### 2.2 UAT SQL Server database (`HRMSEmoveUAT`)

Access is granted only after verification that the connection is genuinely read-only. Until that
verification is recorded in `planning/PROGRESS.md`, **no database connection at all may be opened.**

Once a verified read-only connection exists, the following are the ONLY permitted operations:

- SELECT against existing tables and views.
- Catalog/metadata reads: `sys.tables`, `sys.columns`, `sys.types`, `sys.foreign_keys`, `sys.indexes`, `sys.key_constraints`, `sys.check_constraints`, `sys.default_constraints`, `sys.triggers`, `OBJECT_DEFINITION()` for stored procedures/functions/views, `sys.parameters`, `sys.schemas`.
- `sp_help`-style metadata reads only if they are verified to execute no writes.

Absolutely prohibited (no exceptions, even if a request seems to justify it):

- `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `TRUNCATE`, `BULK INSERT`, `SELECT ... INTO`, `OPENROWSET` writes.
- **Executing any stored procedure, scalar/table function, or unknown script.** Even procedures that appear read-only (they can audit, cache, or write). Read their source text instead.
- Any DDL: `CREATE/ALTER/DROP` (tables, views, procs, indexes, schemas, logins, users, roles).
- Enabling/disabling triggers, constraints, jobs, change tracking, CDC, Service Broker.
- Modifying users, permissions, collations, or database configuration (`ALTER DATABASE ...`).
- Running schema-push or migration tooling against UAT (`prisma migrate`, `prisma db push`, `prisma db seed`, `npx prisma-db-*`, SSMS "design"/save changes, Flyway, etc.).
- Extracting bulk sensitive data. Prefer row counts, schema metadata, aggregates, and synthetic examples. Never extract passwords, tokens, full personal identifiers, salary data, or employee documents into reports.
- Connecting a Prisma/NestJS application (or any application code) to the UAT database. Agents may use only an ad hoc read-only SQL client (e.g., `mssql` npm package via a one-off script, or `sqlcmd -q "SELECT ..."`) for discovery.

Verify before use:

1. Confirm the connection string points at the **UAT** database (server + `Database=HRMSEmoveUAT`), **not** `HRMSEmove` (production) or `HRMSEmove_Sep3`.
2. Run `SELECT SUSER_NAME(), HAS_DBACCESS(DB_NAME()), DB_NAME()` and inspect the login's effective permissions via `sys.fn_my_permissions(NULL,'DATABASE')`; confirm no `WITH GRANT` write permission exists (no `INSERT/UPDATE/DELETE/ALTER/CONTROL/OWNERSHIP`).
3. Record the verification result in `planning/PROGRESS.md` before any inspection.
4. If read-only status cannot be verified, **stop database work** and log a blocker in `OPEN_QUESTIONS.md`.

### 2.3 This repository (the new project)

- You may create/edit files here freely, **except** `planning/PROGRESS.md`, `planning/TASKS.md`, and `planning/DECISIONS.md`, which you must update (not overwrite wholesale) as you work — append/modify status fields, do not delete others' entries.
- Before committing changes, verify no file from the legacy repo appears in a diff.

## 3. Approved and prohibited commands (summary)

| Category | Approved | Prohibited |
|---|---|---|
| Legacy repo | `Get-Content`, `Select-String`, `grep`, read tools, `git log/status/diff/show` (no writes) | Any editor save, formatter, `dotnet`, `npm`, `git add/commit/checkout` against legacy repo |
| UAT DB (after verification) | `SELECT`, metadata catalog queries, `sqlcmd -q` (query-only), `mssql` npm package for ad hoc reads | `sqlcmd -Q` (execute-then-quit), executing procs, `prisma migrate/db push/db seed` pointed at UAT, SSMS design changes |
| New project | `npm/pnpm install` inside `D:\NodeJs\Swan\Hrms`, `npx prisma migrate` against **local dev PostgreSQL only**, `npm test`, `git init/add/commit` | Any `prisma` command with a UAT or production URL in `DATABASE_URL` |

`DATABASE_URL` for local development must point at a local PostgreSQL instance (database names such as `hrms_dev`). Guard rails: a `.env.example` with `DATABASE_URL` placeholder; never commit `.env`.

## 4. Architecture principles

1. **Modular monolith first.** NestJS modules for `auth`, `users`, `masters`, `documents`, shared `prisma`, `config`, `logger`. No microservices, no message brokers unless a documented justification exists in `DECISIONS.md`.
2. **Layering:** controller (HTTP) → service (business rules) → Prisma (persistence). Controllers must be thin; validation via DTO classes with `class-validator`/`zod`; never read raw `req.body` in business logic.
3. **Versioned REST API.** Prefer `POST`-free semantics: GET for reads, POST/PUT/PATCH/DELETE for writes. (Legacy used POST for everything; the new API intentionally improves this, but must preserve *behavioral* compatibility where it matters, e.g., filter shapes.)
4. **No dynamic-SQL strings from user input** (the legacy `MasterSetup` engine concatenates strings — do not replicate; use Prisma models or parameterized queries).
5. **Centralized error handling** with problem-detail-style error codes mapped to stable message codes (legacy used numeric `MessageId` codes — keep a mapping table in `BUSINESS_RULES.md` when building).
6. **Auth:** bcrypt (or argon2id) password hashing, short-lived access tokens (JWT) + server-side revocable session/refresh tokens, RBAC + fine-grained permissions, CSRF strategy for the Next.js frontend, secure cookie flags.
7. **Observability:** structured logging (pino), request IDs, audit log table for sensitive operations (login, password change, document download/delete, master changes).
8. **Secrets:** `.env` (never committed), a `.env.example` with placeholders, secret keys documented in key names only. Nothing resembling the legacy plaintext-credentials-in-config pattern.

## 5. Coding conventions (NestJS / Next.js / Prisma / PostgreSQL)

- TypeScript strict mode: `"strict": true`. No `any` unless justified in a comment.
- NestJS: feature-module per domain; DTOs with validators; `@UseGuards` for auth; decorators

  over ad hoc header parsing; camelCase JSON responses.

- File naming: `kebab-case` (e.g., `document.service.ts`, `update-document.dto.ts`).
- Next.js: app-router structure; server components where possible; API client calls only through a typed client; environment variables via `NEXT_PUBLIC_*` only for non-sensitive values.
- Prisma: schema-first, camelCase model names mapping via `@map` to explicit snake_case table/column names for the **new** schema; new schema names should be domain-clearing (`user_account`, `employee_profile`, `employee_document`, …) rather than copies of legacy names — maintain a mapping table `legacy table → new table` in `DATABASE_DISCOVERY.md`.
- PostgreSQL: use `timestamptz` for dates with time, `date` for calendar dates, `numeric` for money, unique constraints explicitly named; avoid triggers unless documented in `DECISIONS.md`.
- SQL Server → PostgreSQL specifics: no IDENTITY — use `GENERATED ALWAYS AS IDENTITY` or Prisma autoincrement; be careful with case-insensitive/collation semantics (use `citext` or explicit `lower()` unique indexes where legacy relied on case-insensitive matching); `GETUTCDATE()` == `now()`/`CURRENT_TIMESTAMP`.
- Tests colocated or in `test/`; every bug fix rule obtained from discovery requires a regression test referencing the rule ID (`BR-UM-xx` etc. from `BUSINESS_RULES.md`).

## 6. Module boundaries

| Module | NestJS module | Owns |
|---|---|---|
| Auth | `auth` | Login, tokens, sessions, password reset/change, account lockout |
| Users | `users` | Site users, user↔employee profile mapping, site-user list |
| RBAC/Menus | `rbac` | Roles, user types, menus, menu↔user-type assignment |
| Masters | `masters` | Department, designation, branch, grade, site, employee type, parameters, shifts, weekly-off, holidays, and the master-definition engine |
| Employee Profile | `employees` | Employee master records and identity fields (in-scope part only) |
| Documents | `documents` | Document types, employee documents, files, expiry tracking |
| Shared | `prisma`, `config`, `common` | DB client, settings, guards, pipes, filters |

Cross-module integrity: `documents` and `masters` both reference `employees`; `workers`/cron jobs (expiry alerts) belong in `documents` module initially.

## 7. Security requirements

- Minimum: bcrypt ≥ cost 12; account lockout after failed attempts (legacy counter: see `BUSINESS_RULES.md`); token expiry actually enforced (legacy never expired tokens); short-lived refresh; HTTPS only; strict CORS allow-list (legacy was `AllowAllOrigins` — do not replicate).
- Document storage: private bucket/directory (legacy served `/Documents` **unauthenticated via static files** — do not replicate), UUID file names, supported extensions `jpg/jpeg/png/pdf` max 10 MB for documents, `jpg/jpeg/png` max 10 MB for profile photos, `xls/xlsx/xlsm/csv` for Excel import.
- PII (passport, visa, Emirates ID, licence numbers, documents) encrypted at rest or access-controlled; every access audited.
- Never log secrets or full document numbers.

## 8. Testing requirements

- Unit tests (Jest) for every service, minimum for all rules with IDs in `BUSINESS_RULES.md`.
- Supertest/E2E for every controller route (auth failure cases included).
- Prisma seed **only against local dev DB**.
- CI: `npm run lint`, `npm run test`, `npx prisma validate`, `npx tsc --noEmit` must pass before merge. (CI config does not exist yet — create with approval.)

## 9. Database migration safety

- Schema migrations in this repo via `prisma migrate dev` against **local/dev PostgreSQL only**.
- Production/UAT SQL Server is never a target of any tool.
- Data migration (SQL Server → PostgreSQL) will be a separate, reviewed ETL step executed by humans; agents only prepare scripts/mappings in `planning/DATA_MIGRATION_PLAN.md`. Never execute data migration against any real database.

## 10. Documentation requirements

- Every discovery conclusion must cite legacy evidence (file path, class/method name, or procedure name where relevant).
- Keep `PROGRESS.md`, `TASKS.md`, `DECISIONS.md`, and `OPEN_QUESTIONS.md` current. Update status fields; do not silently delete content.
- New architecture claims should land in `TARGET_ARCHITECTURE.md` or `DECISIONS.md`, not chat.
- Label proposal vs. confirmed in one of three registers: **(current)** = legacy behavior, **(proposed)** = target design, **(open)** = unresolved.

## 11. Handling unknown business logic

- Never invent tables, endpoints, fields, validation messages, sequence numbers, or edge-case behavior.
- Unknowns go to `OPEN_QUESTIONS.md` with the evidence gap named (e.g., "stored proc `AddUpdateProfile` body not yet inspected — UAT read-only access pending").
- Implementation code must not be written to "fill gaps" with assumptions. Ask, document, wait.

## 12. No completion without evidence

- Never report a task as complete unless: the `TASKS.md` status field is updated, an artifact (file path / query output / test run) exists, and the artifact is referenced in the task's **Evidence** field.
- "Implemented" requires the code to exist in this repo, compile (`tsc --noEmit` clean), and have tests where required. "Tested" requires recorded test results. "Validated" requires demonstrated behavior against real evidence (legacy source, DB read, or test output).
- Ticket-level honesty: if a downstream reviewer cannot reproduce a claim from cited evidence, the task is **not** done.

## 13. Phase discipline

Current phase: **Phase 1 — Discovery** (initial). Do not begin implementation (Phase 4) until the
review of architecture, module scope, security approach, migration strategy, and open business
questions in `planning/` is complete and the user has approved it in writing.

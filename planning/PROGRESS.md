# PROGRESS.md — HRMS Modernization Status

**Last updated:** 2026-10-28
**Current phase:** Phase 3 — Development scaffold complete; implementation starting with auth vertical slice

## Overall completion

| Workstream | Status |
|---|---|
| Phase 0 — Safety setup & workspace | **Approved/Done** |
| Legacy repository inventory | **Reviewed** (source-level inventory; detail tracing pending) |
| Angular frontend discovery | **Reviewed** (see MODULE_INVENTORY.md) |
| .NET backend discovery | **Reviewed** (see SYSTEM_OVERVIEW.md) |
| Auxiliary projects (services, CI/CD, docs) | **Reviewed** |
| UAT database schema discovery | **Done** (2026-10-28 — live SELECT-only inspection under D-012; see DATABASE_DISCOVERY.md) |
| Business rule extraction | **Done for phase-1 scope** (source + proc bodies + data evidence; see BUSINESS_RULES.md) |
| Target architecture | **In progress** (scaffolded; modules wired; build passes) |
| Prisma target schema | **Done (draft/validated)** (`prisma/schema.prisma`, 37 models) |
| API specification | **Done (draft)** (`planning/API_SPECIFICATION.md`) |
| Data migration plan | **In progress** (D-014/D-016 incorporated; reconciliation and storage decisions remain) |
| Security review | **Reviewed** (source + DB-level findings SEC-L-15..19; see SECURITY_REVIEW.md) |
| Test strategy | **In progress** (draft proposal) |
| Implementation (Phase 4) | **Not started** — blocked until Phase 3 review approval |

Status vocabulary: Not started / In progress / Reviewed / Validated / Approved / Implemented / Tested.
"Reviewed" = source surveyed with citations but not executed/verified against a running system or DB.

## Evidence basis for this round of discovery

Three read-only exploration passes over `D:\.net\hrms` (no files modified):

1. Angular frontend inventory — `HRMS.App` (routing, auth, modules, services, endpoints, hardcoded rules).
2. .NET backend inventory — `src\HRMS.API`, `src\HRMS.BLL`, `src\HRMS.DAL`, `src\HRMS.Entity`, `src\EmqubeLibrary` (stack, auth, controllers, procs, EDMX, file storage, schedulers).
3. Auxiliary inventory — `HRMS.Service`, `packages/`, `src\ConsoleApp1`, docs/logs, CI/CD artifacts.

Plus a **live DB discovery pass (2026-10-28)** over `HRMSEmove_Sep3` (server `emovedb`) under the
D-012 SELECT-only exception: schema/row-count inventory, column metadata, FK/unique-constraint graph,
proc inventory (200) + 38 module-relevant proc definitions, metadata engine extracts
(`MetaData` 42 / `MetaDataDetail` 241 / `Parameter` / `Configuration` / `Message`), view list, CLR
assembly check, aggregates-only data census. Raw evidence: `planning/discovery/**`.

**Legacy repo integrity note:** at inspection time the legacy repo contained pre-existing user
modifications (`.vs/HRMS.API/v14/.suo`, `HRMS.App/src/app/muster/musterlist.component.ts`,
`src/HRMS.API/HRMS.API.xproj.user`, untracked `UpgradeLog.htm`). None were touched by us and all
future agents must leave them untouched (see AGENTS.md §2.1).

## Documents created

- `README.md`, `planning/AGENTS.md`, `planning/PROGRESS.md`, `planning/TASKS.md`
- `planning/SYSTEM_OVERVIEW.md`, `planning/MODULE_INVENTORY.md`, `planning/BUSINESS_RULES.md`
- `planning/DATABASE_DISCOVERY.md`, `planning/TARGET_ARCHITECTURE.md`, `planning/DATA_MIGRATION_PLAN.md` (draft)
- `planning/SECURITY_REVIEW.md`, `planning/TEST_STRATEGY.md`, `planning/DECISIONS.md`, `planning/OPEN_QUESTIONS.md`

Deferred (will be created in Phase 2 with DB evidence): `API_SPECIFICATION.md`.

## Confirmed technical findings (headline)

Architecture: Angular 7.1 SPA + custom .NET API; SQL Server 2019; EF6 database-first (2 EDMX models,
**145 stored-procedure function imports**); almost all writes are single stored procedures. Live DB:
5 schemas / 107 tables / 46 views / 200 procs / 0 triggers (`dbo` also holds 14 Excel-import junk tables).

- **Auth:** custom opaque GUID token in `system.Token`; HTTP header **`AuthToken`**; all 85 token
  rows have `ExpiresOn = IssuedOn` (never expire); `ValidateToken` only checks existence; **login
  returns the existing token (reuse confirmed in proc)**. Global `ActionFilter` whitelists
  `/api/values` + `/api/common/getlogin`. Evidence: `TokenService.cs`, `ActionFilter.cs`,
  `discovery/procs/GetLogin.sql`, `discovery/aggregates.csv`.
- **Passwords are reversibly encrypted (DES-CBC, hardcoded key+IV), not hashed** — and the DB has its
  own CLR copy (`dbo.Encrypt/Decrypt`, assembly `SMISQLDataApp`, `clr enabled=1`). **`GetSiteUserDataList`
  decrypts passwords in SQL and ships them to the client.** Evidence: `ELHelperManager.cs`,
  `discovery/fn_search2.csv`, `discovery/procs/GetSiteUserDataList.sql` (SEC-L-15/16).
- **Lockout confirmed**: `AddUpdateSiteUserActivity` locks at 5 failed attempts (success resets) —
  but data shows it inert (0 locked, max_failed=0). Only "Login" events are logged (33,508 rows).
- **Link-login consumes a one-time `HRMS.Token` row** (delete-on-use, 4 rows live); 427 profiles have
  `LinkId` (PMS population).
- **Session timeout (180 min) is enforced client-side only** (localStorage `setupTime` sliding
  check). Evidence: `http.service.ts`, `Constants.ts`.
- **Change password & forgot password flows are commented out** at both server and client side
  (dead UA routes: `/changePassword` link has no route). Active: admin `ResetPassword` = plain UPDATE.
- **Masters CRUD and Document Management run on a metadata-driven engine** — confirmed live:
  `system.MetaData` (42 entities) / `MetaDataDetail` (241 fields) / DataType catalog
  (14=string…31=Text) + dynamic SQL by string concatenation (`AddUpdateDocument` via `sp_executesql`).
- **Menus/roles are user-type based** (4 UserTypes: Executive 468 / Manager 29 / System Admin 2 /
  HR Admin 11 users); base = `MenuUserType` + per-profile `MenuSpecialUserAccess` include/exclude
  overrides (MERGE save); `MenuRole` path broken (`GetMenuList` assigns `@RoleId = @ProfileId`).
- **All HTTP calls from Angular are POST** with `AuthToken` + `TimeZone` headers; base URL
  hardcoded in `http.service.ts` (env files empty).
- **Documents:** `HRMS.Document.ExpiryDate` is 100% NULL (dead column) — real expiry lives in
  `master.AdditinalDocumentValue` keyed by `MetaDataDetailId` (3,125 date values, 0 unparsable);
  `DeleteDocument` orphans physical files; `AddUpdateFileDoc` hardcodes `FileDocTypeId=1`
  (9,656 of 11,063 rows); scheduler windows: prev-month→yesterday / 7d / 1m / 3m.
- **Document files stored** under `{API ContentRoot}\Documents\` (flat, name = first 15 chars +
  unix epoch + ext), `UploadFiles\{GUID}.ext` for photos, and **served unauthenticated** by the
  static-files middleware at `/Documents`. Preview via Google Docs public viewer.
- **No DB-level uniqueness** on UserName (3 duplicates live) / EmployeeCode; unique constraints only
  on DepartmentName, DocumentName, LanguageName (+PayrollHeader composite).
- **Scheduled jobs** = console exe `HRMS.Service` invoked with arg 1/2/3 by (presumably) Task
  Scheduler: leave/airfare/payslip/scheduler emails; arg 3 weekly = document expiry emails
  (0 / 1 / 3-month horizons) to HR mailbox. Evidence: `HRMS.Service\Program.cs`,
  `ProfileManager.DocumentExpiredUsersScheduler` etc.
- **No tests, no CI/CD** (manual FileSystem publish profiles to local dirs); exception logs
  (2019–2020) committed into repo.
- **Plaintext/secrets committed** in app.config/Config.xml (conn strings incl. `HRMSEmoveUAT`
  naming, SMTP password DES-encrypted, Google key, GemBox key) — redacted in all reports. DB config
  row `PayrollPassword` (Config 13) is an encrypted secret — value redacted everywhere.
- **Destructive maintenance procs exist in production** (`CleanupUser` wipes DB keeping ProfileId
  126; `CleanupInActiveUser` deletes inactive + hardcoded FileDocIds 227–231).

## Module progress

| Module | Inventory | Workflow trace | Rules | DB mapping |
|---|---|---|---|---|
| 1. User Management | Reviewed | **Done** (incl. proc bodies + data checks) | **Done for phase-1 scope** | **Done** (DATABASE_DISCOVERY §2/§9) |
| 2. Setup / Master Data | Reviewed | **Done** (metadata engine contents decoded) | **Done for phase-1 scope** | **Done** (§3/§9) |
| 3. Document Management | Reviewed | **Done** (save/delete/scheduler procs decoded) | **Done for phase-1 scope** | **Done** (§4/§9) |

## Decisions made (see DECISIONS.md for detail)

- D-001: planning documents live in the NEW repo `D:\NodeJs\Swan\Hrms\planning`, legacy repo untouched.
- D-002: modular monolith (NestJS) rather than microservices for phase 1.
- D-003: keep metadata-driven master engine concept in target (definitions tables + JSONB, not dynamic SQL) — **approved for the Phase-2 draft**.
- D-004: superseded by D-012 — DB inspection performed under owner-authorized SELECT-only discipline (no read-only account available).

## Open questions / risks / blockers

Top items (full list in OPEN_QUESTIONS.md):

- ~~BLOCKER-1: UAT read-only credentials~~ → resolved via D-012 exception; still recommend a dedicated `hrms_ro` login for future sessions (OQ-1).
- R-1: Password migration strategy is resolved by D-014: backward-compatible first login, mandatory password change, then bcrypt/argon2; legacy ciphertext removed after the migration window.
- R-2: Metadata-driven dynamic SQL core = behavior fully embedded in DB procs & metadata rows (now extracted — seed data available).
- R-3: Auth/session design resolved by D-007: short-lived JWT + revocable refresh sessions; legacy token reuse intentionally not reproduced.
- R-4: ~~Business rule discovery depends on proc bodies~~ → done for phase-1 scope; ~160 out-of-scope procs remain for later phases.
- R-5: External integration: PMS push, e-movers sync (`emoveapi`) — out of phase-1 scope but flagged for profile-save API extensibility.
- R-6: Forgot/change password resolved by D-013; link-login deferred by OQ-4.
- R-7: Data hygiene resolution approved by D-016; reconciliation report before ETL.
- R-8: Improvements allowed at cutover approved by D-020 (fix broken/dangerous items without functional regression).
- R-9: Hosting/deployment deferred by D-021; scaffold uses env-driven config.

## Next recommended actions (priority order)

1. **Implement the auth vertical slice**: real password verification (bcrypt + legacy DES fallback D-014), session/refresh rotation, logout revocation, account lockout, audit logging.
2. Implement seed scripts for lookup tables (UserType, Role, Parameter, DocumentType, Message, Configuration, FormEntity/FormField).
3. Implement users, RBAC, masters, employees, and documents module-by-module against `API_SPECIFICATION.md`.
4. Create dedicated `hrms_ro` SQL login for remaining/future DB reads; rotate exposed credentials (SEC-L-08/19).
5. Produce the MIG-04 reconciliation report before any ETL or migration work.

# PROGRESS.md — HRMS Modernization Status

**Last updated:** 2026-10-28
**Current phase:** Phase 1 — Discovery (initial inventory complete; deep workflow tracing and DB schema discovery pending)

## Overall completion

| Workstream | Status |
|---|---|
| Phase 0 — Safety setup & workspace | **Approved/Done** |
| Legacy repository inventory | **Reviewed** (source-level inventory; detail tracing pending) |
| Angular frontend discovery | **Reviewed** (see MODULE_INVENTORY.md) |
| .NET backend discovery | **Reviewed** (see SYSTEM_OVERVIEW.md) |
| Auxiliary projects (services, CI/CD, docs) | **Reviewed** |
| UAT database schema discovery | **Not started** (blocked: no verified read-only connection yet) |
| Business rule extraction | **In progress** (rules from source recorded; proc bodies pending) |
| Target architecture | **In progress** (initial proposal in TARGET_ARCHITECTURE.md) |
| Data migration plan | **In progress** (draft; DB-dependent items open) |
| Security review | **Reviewed** (source-level; see SECURITY_REVIEW.md) |
| Test strategy | **In progress** (draft proposal) |
| Implementation (Phase 4) | **Not started** — blocked until Phase 3 review approval |

Status vocabulary: Not started / In progress / Reviewed / Validated / Approved / Implemented / Tested.
"Reviewed" = source surveyed with citations but not executed/verified against a running system or DB.

## Evidence basis for this round of discovery

Three read-only exploration passes over `D:\.net\hrms` (no files modified):

1. Angular frontend inventory — `HRMS.App` (routing, auth, modules, services, endpoints, hardcoded rules).
2. .NET backend inventory — `src\HRMS.API`, `src\HRMS.BLL`, `src\HRMS.DAL`, `src\HRMS.Entity`, `src\EmqubeLibrary` (stack, auth, controllers, procs, EDMX, file storage, schedulers).
3. Auxiliary inventory — `HRMS.Service`, `packages/`, `src\ConsoleApp1`, docs/logs, CI/CD artifacts.

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

Architecture: Angular 7.1 SPA + custom .NET API; SQL Server; EF6 database-first (2 EDMX models,
**145 stored-procedure function imports**); almost all writes are single stored procedures.

- **Auth:** custom opaque GUID token in a `Token` table; HTTP header **`AuthToken`**; tokens set
  `ExpiresOn = IssuedOn` (never expire); `ValidateToken` only checks existence. Global
  `ActionFilter` whitelists `/api/values` + `/api/common/getlogin`. Evidence:
  `src\EmqubeLibrary\BLL\TokenService.cs`, `src\HRMS.API\Filter\ActionFilter.cs`.
- **Passwords are reversibly encrypted (DES-CBC, hardcoded key+IV), not hashed.** Login calls
  stored proc `GetLogin` with DES-encrypted username/password. Evidence:
  `src\EmqubeLibrary\BLL\ELHelperManager.cs` (Encrypt/Decrypt), `ELCommonManager.cs`.
- **Session timeout (180 min) is enforced client-side only** (localStorage `setupTime` sliding
  check). Evidence: `HRMS.App\src\app\services\http.service.ts`, `common\Constants.ts`.
- **Change password & forgot password flows are commented out** at both server and client side
  (dead UA routes: `/changePassword` link has no route). Active: admin `ResetPassword`.
- **Masters CRUD and Document Management run on a metadata-driven engine** (`system.MetaData`,
  `system.MetaDataDetail`, `system.Parameter` metadata tables + dynamic SQL built by string
  concatenation — SQL injection surface). Evidence: `src\EmqubeLibrary\BLL\MasterSetup.cs`.
- **Menus/roles are user-type based** (ArrayList of approved menus returned by
  `GetSiteUserMenuItem`, `GetMenuItemList`); numeric menu IDs hardcoded in frontend
  (`Constants.ts` menuItem map). Menu visibility IS the permission UI model.
- **All HTTP calls from Angular are POST** with `AuthToken` + `TimeZone` headers; base URL
  hardcoded in `http.service.ts` (env files empty).
- **Document files stored** under `{API ContentRoot}\Documents\` (flat, name = first 15 chars +
  unix epoch + ext), `UploadFiles\{GUID}.ext` for photos, and **served unauthenticated** by the
  static-files middleware at `/Documents`. Preview via Google Docs public viewer.
- **Scheduled jobs** = console exe `HRMS.Service` invoked with arg 1/2/3 by (presumably) Task
  Scheduler: leave/airfare/payslip/scheduler emails; arg 3 weekly = document expiry emails
  (0 / 1 / 3-month horizons) to HR mailbox. Evidence: `HRMS.Service\Program.cs`,
  `ProfileManager.DocumentExpiredUsersScheduler` etc.
- **No tests, no CI/CD** (manual FileSystem publish profiles to local dirs); exception logs
  (2019–2020) committed into repo.
- **Plaintext/secrets committed** in app.config/Config.xml (conn strings incl. `HRMSEmoveUAT`
  naming, SMTP password DES-encrypted, Google key, GemBox key) — redacted in all reports.

## Module progress

| Module | Inventory | Workflow trace | Rules | DB mapping |
|---|---|---|---|---|
| 1. User Management | Reviewed | In progress | In progress | Not started |
| 2. Setup / Master Data | Reviewed | In progress | In progress | Not started |
| 3. Document Management | Reviewed | In progress | In progress | Not started |

## Decisions made (see DECISIONS.md for detail)

- D-001: planning documents live in the NEW repo `D:\NodeJs\Swan\Hrms\planning`, legacy repo untouched.
- D-002: modular monolith (NestJS) rather than microservices for phase 1.
- D-003: keep metadata-driven master engine concept in target (as a definitions table + typed endpoints), not per-master hardcode — final call after DB inspection.
- D-004: no DB inspection until verified read-only UAT access exists (no connection opened yet).

## Open questions / risks / blockers

Top items (full list in OPEN_QUESTIONS.md):

- **BLOCKER-1:** UAT read-only credentials not yet provided/verified → DB discovery can't start.
- R-1: Password migration strategy (DES-encrypted values cannot be verified/hashed offline).
- R-2: Metadata-driven dynamic SQL core = behavior fully embedded in DB procs & metadata rows.
- R-3: AuthToken `ExpiresOn` never set; client-only timeout; no refresh — security redesign affects UX (2 live tokens behavior: login SP may return existing token).
- R-4: Business rule discovery depends on reading ~145 stored proc definitions (DB access).
- R-5: External integration: PMS push, e-movers sync (`emoveapi`) — out of phase-1 scope but blocks clean API design of profile save.
- R-6: Inactive/legacy code paths (commented Change/ForgotPassword) — clarify intent with users.

## Next recommended actions (priority order)

1. Provide verified read-only UAT SQL account → complete DB schema discovery (TASKS: DB-*) — highest value, unblocks rule extraction from proc bodies.
2. Read stored procedure definitions for module procs (`GetLogin`, `AddUpdateProfile`, `AddUpdateDocument`, `GetEmployeeDocumentList`, scheduler procs, metadata tables) — via metadata only.
3. Complete business-rule extraction for masters metadata rows (`system.MetaData` content for Department/Site/Role/Document) via SELECT.
4. Confirm with stakeholders: desired behavior of forgot/change password in target; password migration approach (reset-all vs. lazy rehash); whether links-based auto-login (`?id=`) must survive.
5. Finalize target architecture on approval (TARGET_ARCHITECTURE.md → DECISIONS).
6. Draft API_SPECIFICATION.md endpoints for the three modules.

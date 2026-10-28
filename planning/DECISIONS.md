# DECISIONS.md — Architecture & Planning Decision Log

Append-only. Each entry: ID, date, decision, rationale, status (proposed/approved/superseded).

## D-001 — Planning workspace location
- Date: 2026-10-28 · Status: **Approved** (per user instruction)
- Decision: All planning documents and future code live in `D:\NodeJs\Swan\Hrms`; legacy repo `D:\.net\hrms` untouched read-only.
- Rationale: keeps new work clearly separated; honors AGENTS.md §2.1.

## D-002 — Architecture shape: modular monolith
- Date: 2026-10-28 · Status: **Proposed**
- Decision: Single NestJS application with bounded modules (auth/users/rbac/masters/employees/documents) + Next.js frontend; no microservices/messaging initially.
- Rationale: legacy is a single API+SPA; phase-1 modules share masters heavily; ops minimalism. Extraction possible later if scale warrants.

## D-003 — Master/document metadata engine design
- Date: 2026-10-28 · Status: **Approved for Phase 2 draft**
- Decision: reproduce the *capability* (definitions-driven forms) safely as normalized definition tables + JSONB field config + typed value storage, rather than one per-master hardcoded endpoint OR replicating legacy dynamic SQL.
- Rationale: department/site/role/employee/document UIs are all metadata-driven today; a safe engine preserves flexibility without string-concat SQL.

## D-004 — No UAT access until verified read-only
- Date: 2026-10-28 · Status: **Approved safety rule; discovery exception recorded in D-012**
- Decision: zero DB connections until a SELECT-and-metadata-only account's effective permissions are verified; all DB discovery steps gated on TASKS DB-01.
- Rationale: mandatory safety rule; DB contains real employee PII.

## D-005 — Password migration strategy
- Date: 2026-10-28 · Status: **Superseded by D-014**
- Options: (a) force reset-all; (b) lazy rehash on first login (requires temporary legacy decrypt path); related: keep legacy regex policy BR-UM-10? Adopt modern policy?
- Rationale: legacy DES-encrypted passwords cannot be verified offline; the approved backward-compatible forced-change flow is defined in D-014.

## D-006 — Time/date semantics in target schema
- Date: 2026-10-28 · Status: **Superseded by D-018**
- Decision: persist instants as UTC `timestamptz`; use deployment `APP_TIMEZONE` for display and local-date calculations.

## D-007 — Token/session mechanism for Next.js + NestJS
- Date: 2026-10-28 · Status: **Approved for Phase 2 design**
- Decision: short-lived JWT access token (15 min) + server-side revocable refresh session with enforced expiry & rotation; idle timeout ≤ legacy 180 min; logout revokes. Cookie vs header transport to be pinned in implementation phase (CSRF implications documented in SECURITY_REVIEW.md §2).

## D-008 — Replace static file serving with authenticated downloads
- Date: 2026-10-28 · Status: **Approved by D-017**
- Decision: private storage + signed short-lived URLs / streaming through authorized endpoint; no public preview via Google Docs viewer.
- Rationale: SEC-L-04; also fixes preview-on-intranet breakage observed in legacy.

## D-009 — Scheduled jobs in-process (NestJS cron) initially
- Date: 2026-10-28 · Status: **Proposed**
- Decision: replicate weekly document-expiry alert job inside the API (with dedup), not a separate Windows service; revisit message-queue job infra only if justified.

## D-010 — Error/message code preservation
- Date: 2026-10-28 · Status: **Proposed**
- Decision: new `error_catalog` seeded from `MessageView` semantics; UI messages keep legacy wording at cutover; numeric MessageIds mapped to stable string codes. Pending full MessageView content (DB-03).

## D-011 — Response/transport redesign
- Date: 2026-10-28 · Status: **Proposed**
- Decision: RESTful verbs (GET reads), JSON camelCase, envelopes with `message` compat mapping; pagination response shape adapted to feature (`Pages/TotalRecords`) for parity while internally normalized.

## D-012 — DB discovery authorized under SELECT-only discipline (privileged account)
- Date: 2026-10-28 · Status: **Approved (owner authorization via chat)**
- Decision: after read-only verification failed (supplied login is sysadmin/db_owner on `HRMSEmove_Sep3`), the owner explicitly authorized proceeding with discovery **restricted to SELECT + catalog/metadata reads only** — no EXEC, no dynamic SQL, no writes, no procedure execution, credentials never committed.
- Rationale: owner accepted residual risk for speed; compensating discipline: every statement is a pure SELECT over catalog views/tables; all outputs are schema metadata, aggregates, or config (no bulk PII).
- Risk note: this is an exception to the preferred dedicated-read-only-account approach; revisit for future sessions (recommend creating `hrms_ro` login per OQ-1).

## D-013 — Forgot/change password flows are in scope (OQ-2 answered)
- Date: 2026-10-28 · Status: **Approved (owner via chat)**
- Decision: the new system implements both flows in Phase 1 scope: forgot-password (email token flow) and change-password (self-service, current-password verification).
- Rationale: legacy had both commented out (dead code); owner confirms intent that they should exist.

## D-014 — Password migration: backward-compatible lazy upgrade with forced change (OQ-3 answered, resolves D-005)
- Date: 2026-10-28 · Status: **Approved (owner via chat)**
- Decision: allow **backward compatibility** with legacy DES-encrypted credentials at cutover:
  1. Migrate each user's legacy encrypted password value into a `legacy_password` column (kept only during the migration window, then dropped).
  2. On first login: legacy value is decrypted **server-side only** and verified; if it matches, the user is authenticated but flagged `must_change_password = true` and **prompted to set a new password** before using the app.
  3. On successful password set: bcrypt hash stored, `legacy_password` nulled. An admin reset or the forgot-password flow also clears the legacy value.
  4. Users who never log in within the migration window are force-reset (their legacy value is dropped after the window).
- Rationale: owner wants no hard lockout at cutover; note DB evidence (SEC-L-15/16) shows decrypted passwords were routinely exposed, so the legacy values are treated as compromised and the forced-change prompt is mandatory.

## D-015 — Encrypt PII identity numbers at rest (OQ-16 answered: Yes)
- Date: 2026-10-28 · Status: **Approved (owner via chat)**
- Decision: `PassportNo / EmiratesId / MOLNo / VisaNo` (and any future PII identity fields) are stored **encrypted at rest** (AES-256-GCM, application-level envelope encryption, keys from env/KMS — not in DB). A deterministic keyed HMAC (`*_hash`) column accompanies each encrypted field for equality search/lookups (encrypted values cannot be searched directly). List views return masked values; full values only in authorized detail views with audit.
- Rationale: legacy stores these plaintext on `usr.Profile` (SEC-L-17).

## D-016 — Resolve duplicate/dirty data before cutover (OQ-14 answered: Yes)
- Date: 2026-10-28 · Status: **Approved (owner via chat)**
- Decision: before/during migration the following are resolved and the target schema enforces the resulting invariants:
  1. 3 duplicate `SiteUser.UserName` values → renamed/deduped (target: unique index).
  2. Duplicate `Role` name "Admin" (RoleId 1 & 7) → merged/renamed (target: unique name).
  3. 9,656 `FileDoc` rows miscategorized as `FileDocTypeId=1` → re-derived from `FileDocMapping → Document → DocumentTypeId`.
  4. `EmployeeCode` uniqueness enforced (legacy had none at DB level).
  5. Stringly-typed dates in `AdditinalDocumentValue` parsed to real `date` columns during ETL.
- Mechanism: reconciliation report generated first (MIG-04) for business sign-off, then ETL applies the fixes.

## D-017 — Private folder document storage (OQ-6 answered)
- Date: 2026-10-28 · Status: **Approved (owner via chat)**
- Decision: store document files in a server folder outside the public web root. The application owns upload/download authorization; files are never served as static public assets. The target stores a generated private `storageKey`, original filename, MIME type, size, and checksum.
- Rationale: preserves the operational simplicity of folder storage while fixing legacy unauthenticated `/Documents` exposure (SEC-L-04). The folder path is deployment configuration, not database data.

## D-018 — Configured timezone with UTC persistence (OQ-8 answered)
- Date: 2026-10-28 · Status: **Approved for target design (owner via chat)**
- Decision: persist instants as UTC `timestamptz`; configure the business timezone using an environment variable such as `APP_TIMEZONE=Asia/Dubai`. The API converts UTC to that timezone for display and local-date calculations. Changing servers does not change stored time; only the deployment environment setting changes presentation/calculation behavior.
- Rationale: avoids host-OS timezone drift while allowing the server/business timezone to be changed through deployment configuration. Date-only fields remain PostgreSQL `date` where no instant is intended.

## D-019 — Phase-1 master-data scope (OQ-9 answered)
- Date: 2026-10-28 · Status: **Approved (owner via chat)**
- Decision: Phase 1 includes the masters required by User Management, Setup/Master Data, Employees, and Documents: Department, Site/Branch, Role, Language, UserType, generic Parameters/catalogs, DocumentType, EmployeeType, ContractType, Designation, Nationality/Country, VisaType, PassportType, MaritalStatus, Gender, BloodGroup, RelationType, SourceOfHire, Location, Shift, timezone configuration, Weekly-off, Holiday, metadata definitions/configuration, and their supporting form catalogs.
- Modeling rule: use typed target models for real entities that need independent lifecycle/relations; use the definitions/Parameter catalogs for parameter-backed dropdowns. Missing/empty legacy catalogs are not invented.
- Scope rule: nothing is deleted from legacy. Leave, payroll, attendance/muster, airfare/comp-off, Excel payroll/import pipelines, PMS/e-movers integrations, and their supporting domains are deferred to later phases.
- Rationale: preserves all three requested modules and the employee/document workflows without expanding Phase 1 into the legacy leave/payroll platform.

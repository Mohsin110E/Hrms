# TASKS.md — HRMS Modernization Task Backlog

Statuses: `Not started | In progress | Reviewed | Approved | Implemented | Tested | Done | Blocked`
Priority: `P1 (critical) | P2 (high) | P3 (medium) | P4 (low)`

## DISC — Repository & application discovery

### DISC-01 — Legacy repo inventory & technology stack
- Module: All · Priority: P1 · Status: **Done**
- Description: Inventory solution structure, projects, packages, frontend app, configs, tools, CI/CD, tests, docs.
- Dependencies: none
- Acceptance criteria: documented overview with evidence paths; legacy repo unmodified.
- Evidence: `planning/SYSTEM_OVERVIEW.md`; findings from `HRMS.API.sln`, `project.json`, package.json, pubxml files.

### DISC-02 — Angular frontend inventory (modules 1–3 focus)
- Module: UM/MD/DOC · Priority: P1 · Status: **Done**
- Description: Routes, guards/interceptors (none found), auth storage keys, service endpoints, module components/forms.
- Evidence: `planning/MODULE_INVENTORY.md`.

### DISC-03 — .NET backend inventory (controllers → procs)
- Module: All · Priority: P1 · Status: **Done**
- Description: Controller routes, auth filter, BLL/DAL, EDMX function imports (145 procs), file storage, schedulers.
- Evidence: `planning/SYSTEM_OVERVIEW.md` §4–7.

### DISC-04 — Auxiliary projects: HRMS.Service, publish, logs
- Module: All · Priority: P2 · Status: **Done**
- Evidence: `planning/SYSTEM_OVERVIEW.md` §6, §8.

### DISC-05 — End-to-end workflow trace: User Management
- Priority: P1 · Status: **Done** (2026-10-28)
- Trace login, logout, ResetPassword, menus, site users end-to-end (Angular → API → proc → tables).
- Completed with proc bodies: `GetLogin` (token reuse + one-time link token + IsSiteAccess), `AddUpdateSiteUserActivity` (5-attempt lockout), `GetSiteUserMenuItem`/`AddUpdateMenuUserType` (MenuUserType + SpecialUserAccess MERGE), `ResetPassword` (plain UPDATE), `GetSiteUserDataList` (CLR-decrypted passwords).
- Evidence: `discovery/procs/*.sql`; rules in BUSINESS_RULES.md §UM.

### DISC-06 — End-to-end workflow trace: Master Data
- Priority: P1 · Status: **Done** (2026-10-28)
- Trace metadata engine (`GetMetaData`, `GetMetaDataList`, `AddUpdateMetaData`), shift master, weekly-off/holiday, employee master.
- Completed with DB metadata: `system.MetaData` 42 rows / `MetaDataDetail` 241 rows / DataType catalog dumped; `AddUpdateProfile` (74 params) fully decoded incl. ProfileDepartment single-value quirk; shift/weekly-off/holiday procs read.
- Evidence: `discovery/system_MetaData*.csv`, `discovery/procs/*.sql`; rules §MD.

### DISC-07 — End-to-end workflow trace: Document Management
- Priority: P1 · Status: **Done** (2026-10-28)
- Trace list/detail/upload/save/zip/download/mail/delete + expiry schedulers.
- Completed: `AddUpdateDocument` (dynamic SQL, TVPs), `DeleteDocument` (orphans files), `AddUpdateFileDoc` (FileDocTypeId=1 hardcoded), `GetEmployeeDocumentList`/`GetDocumentExpiry`/`GetDocumentsListScheduler` (expiry from AdditinalDocumentValue, windows prev-month/7d/1m/3m), reporting views captured.
- Evidence: `discovery/procs/*.sql`, `discovery/view_*.sql`; rules §DOC.

### DISC-08 — Identify behavior gaps (commented-out / dead code)
- Priority: P2 · Status: **Done** ·
- Items recorded: ChangePassword/ForgotPassword were commented out (now target scope via D-013), `/changePassword` dead link, `GetMenuAccessList` unused, `RememberMe` disabled.
- Evidence/output → `OPEN_QUESTIONS.md`, `DECISIONS.md` D-013.

## DB — Read-only database schema analysis (done 2026-10-28 under D-012 SELECT-only exception)

### DB-01 — Verify read-only UAT access
- Priority: P1 · Status: **Done (with exception)** · 
- Result: login `mohsinsa` on `HRMSEmove_Sep3` @ `emovedb` verified **sysadmin/db_owner — NOT read-only**. Owner explicitly authorized proceeding under SELECT/metadata-only discipline (**D-012**). Recommend dedicated `hrms_ro` login for future sessions (OQ-1).
- Evidence: verification query output in session log; DECISIONS.md D-012.

### DB-02 — Schema inventory: tables/columns/keys for modules 1–3
- Priority: P1 · Status: **Done** (2026-10-28)
- Output: `DATABASE_DISCOVERY.md` rewritten from live schema; `discovery/tables_rows.csv` (107 tables / 5 schemas), `columns_modules.csv`, `columns_usr_employee.csv`, `constraints.csv` (FK/UQ graph).
- Headlines: no unique on SiteUser.UserName; FileDocTypeId→DocumentType FK naming trap; dual Token tables; 0 triggers.

### DB-03 — Metadata tables content (system.MetaData, MetaDataDetail, Parameter)
- Priority: P1 · Status: **Done** (2026-10-28)
- Extracts: `system_MetaData.csv` (42), `system_MetaDataDetail.csv` (241), `system_parameters.csv`, `datatype_map.csv` (14=string … 31=Text), `config_tables.csv`, `messageview.csv`.
- Confirms D-003 definitions-driven engine feasibility; document expiry fields identified per document type.

### DB-04 — Stored procedure source text for module procs (read, never execute)
- Priority: P1 · Status: **Done** (2026-10-28)
- 38 module-relevant proc definitions dumped via `OBJECT_DEFINITION` → `discovery/procs/*.sql`; all read & rule-extracted (see DATABASE_DISCOVERY.md §5, BUSINESS_RULES.md).
- Remaining ~160 procs (leave/payroll/attendance) out of phase-1 scope; dump on demand in Phase 2.

### DB-05 — Views, triggers, indexes, unique constraints of relevance
- Priority: P2 · Status: **Done** (2026-10-28)
- 46 views listed (`views.csv`); 0 triggers; unique constraints sparse (constraints.csv); 3 document-report view definitions captured.

### DB-06 — Row counts + data type audit (aggregates only)
- Priority: P3 · Status: **Done** (2026-10-28)
- Aggregates-only (no bulk PII): `aggregates.csv`, `aggregates2.csv` — token expiry stats, SiteUser dup counts, document-type distribution, expiry-value counts (3,125, 0 unparsable), profile status split, activity-log type census.

### DB-07 — SQL Server → PostgreSQL mapping (drafted, validate against DB-02..05)
- Priority: P2 · Status: **Validated** (2026-10-28)
- Mapping table in DATABASE_DISCOVERY.md §9 updated against real data types; TVP/CLR/dynamic-SQL conversion notes recorded; mixed-format date strings flagged for ETL.

## UM — User Management

### UM-01 — Feature inventory (login, session, menus, users)
- Priority: P1 · Status: **Reviewed** (source-level) ·
- Evidence: MODULE_INVENTORY.md §Module 1.

### UM-02 — Authentication redesign (bcrypt, JWT+refresh, expiry, lockout)
- Priority: P1 · Status: **In progress** (design fixed by D-014 legacy-compat flow + D-007 sessions; implemented in schema draft)
- Password migration decided: **D-014** — legacy DES value verified server-side on first login → `mustChangePassword` prompt → bcrypt thereafter; `legacyPasswordEnc` dropped after window.

### UM-03 — Menu/rights model design
- Priority: P1 · Status: **In progress** (MenuUserType base + MenuUserOverride modeled in schema; parity with GetSiteUserMenuItem logic)

### UM-04 — Forgot/change password flows (currently missing/commented)
- Priority: P2 · Status: **Unblocked** (D-013: both flows are IN scope) — email token flow (forgot) + current-password-verified self change.

## MD — Setup / Master Data

### MD-01 — Feature inventory (metadata engine, employees, shift, weekly-off)
- Priority: P1 · Status: **Reviewed** · Evidence: MODULE_INVENTORY.md §Module 2.

### MD-02 — New master-data model design (definition-driven vs typed endpoints)
- Priority: P1 · Status: **Done (draft)** · Depends: DB-03 (metadata rows), ARCH-02.
- `FormEntity`/`FormField` is the safe definitions layer; typed business models remain the write targets. Final API behavior is covered by ARCH-03/04.

### MD-03 — Determine phase-1 master set vs deferred
- Priority: P2 · Status: **Done (D-019)** ·
- Approved scope includes employee/document-supporting catalogs; leave/payroll/attendance/muster, airfare/comp-off, Excel import/payroll pipelines, and PMS/e-movers integrations are deferred, not deleted.

## DOC — Document Management

### DOC-01 — Feature inventory (documents, files, expiry, mail)
- Priority: P1 · Status: **Reviewed** · Evidence: MODULE_INVENTORY.md §Module 3

### DOC-02 — File storage design (private storage, upload/download API, virus-scan option)
- Priority: P1 · Status: **Not started** · Depends: SEC-03

### DOC-03 — Expiry scheduler design (cron, mail templates, recipients)
- Priority: P2 · Status: **Not started** · Depends: DB-04 (scheduler procs)

### DOC-04 — Document data model (Document, FileDoc, FileDocMapping, type tables)
- Priority: P1 · Status: **Done (draft)** · DB-02/DB-04 complete — target model is in `prisma/schema.prisma`; private storage and authorization details remain SEC-03/DOC-02.

## ARCH — Target architecture

### ARCH-01 — Modular monolith skeleton (proposal)
- Priority: P1 · Status: **In progress** · Evidence: TARGET_ARCHITECTURE.md

### ARCH-02 — Prisma schema draft for models in scope
- Priority: P1 · Status: **Done (draft, validated)** · 2026-10-28
- Output: `prisma/schema.prisma` — 37 models across the 3 modules, validated with `prisma format` and `prisma validate` (P1012 clean).
- Conventions: `legacy:` comments map to legacy tables (IDs preserved), `NEW:` comments on additions with decision refs (D-003/D-007/D-014/D-015/D-016), `FIX:` on deliberate defect corrections.
- Pending: owner review of NEW decisions embedded in the draft (UTC timestamp semantics, Session lockout window, token retention/expiry, and target constraint enforcement); Prisma version bump when the project moves to a supported Node LTS.

### ARCH-03 — API conventions & error model (incl. MessageId mapping)
- Priority: P2 · Status: **Done** · Conventions embedded in `planning/API_SPECIFICATION.md` §1.

### ARCH-04 — API_SPECIFICATION.md for the 3 modules
- Priority: P2 · Status: **Done** · Output: `planning/API_SPECIFICATION.md` — endpoints for auth/users/rbac, masters/employees, and documents.

## MIG — Data migration planning

### MIG-01 — Draft migration plan (type map, sequence, cutover, rollback)
- Priority: P2 · Status: **In progress** · Evidence: DATA_MIGRATION_PLAN.md (draft)

### MIG-02 — Password migration strategy decision record
- Priority: P1 · Status: **Done (D-014)** — backward-compatible legacy verification with mandatory password change, then bcrypt/argon2; legacy ciphertext removed after migration window.

### MIG-03 — File-storage migration (path conventions, GUID/timestamp names → new store)
- Priority: P2 · Status: **Not started**

### MIG-04 — Reconciliation & validation queries (read-only probes)
- Priority: P2 · Status: **In progress** · Depends: DB-06
- Scope fixed by D-016: duplicate usernames, duplicate Admin role, FileDoc type repair, EmployeeCode uniqueness, and document date conversion report before ETL.

## SEC — Security review

### SEC-01 — Legacy security findings (auth, crypto, CORS, static files, secrets)
- Priority: P1 · Status: **Done** · Evidence: SECURITY_REVIEW.md

### SEC-02 — Target security design (authN/Z, file access, PII, audit)
- Priority: P1 · Status: **In progress** · Evidence: SECURITY_REVIEW.md §Target

### SEC-03 — Document access authorization model
- Priority: P2 · Status: **Not started** · Depends: ARCH-02

## TEST — Testing strategy

### TEST-01 — Test strategy draft
- Priority: P2 · Status: **In progress** · Evidence: TEST_STRATEGY.md

### TEST-02 — Rule-based regression test matrix (BR-UM/MD/DOC ids)
- Priority: P2 · Status: **Not started** · Depends: BUSINESS_RULES completion

## DEV — Future implementation (Phase 4 — NOT TO START before approval)

### DEV-01..n — placeholder; ownership/priority assigned post-approval. Status: Not started (locked).

## QA — Validation & release

### QA-01 — UAT parity checklist for the 3 modules
- Priority: P3 · Status: **Not started**

### QA-02 — Cutover rehearsal plan
- Priority: P3 · Status: **Not started** · Depends: MIG-01

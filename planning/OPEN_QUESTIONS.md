# OPEN_QUESTIONS.md — Questions Requiring Business/Technical Clarification

Each item: ID, question, why it matters, evidence gap, impact if unanswered.

## OQ-1 — Read-only UAT credentials (RESOLVED via exception; safe account still recommended)
- Update 2026-10-28 (final): credentials for `HRMSEmove_Sep3` @ `emovedb` verified **sysadmin/db_owner — NOT read-only**. Owner explicitly authorized SELECT/metadata-only discovery with this account (**D-012**). All DB-01..06 tasks completed under that discipline (no EXEC, no writes, credentials never committed).
- **Remaining ask:** create a dedicated read-only login (`hrms_ro`, SELECT + VIEW DEFINITION only) for all future sessions — this account should not be reused, and should be rotated (it is also committed in legacy repo configs, see SEC-L-08).
- Note: `HRMSEmoveUAT` (from commented configs) was never used; `HRMSEmove_Sep3` is the active DB in all legacy app configs and was used as the discovery source (newest token 2026-10-22 → actively used copy).

## OQ-2 — Forgot password / change password intent — **RESOLVED (D-013)**
- Answer 2026-10-28: **Yes** — both flows will be implemented in the new system (legacy had them commented out/dead).

## OQ-3 — Password migration strategy (D-005) — **RESOLVED (D-014)**
- Answer 2026-10-28: **Backward compatibility with a forced password change**: legacy DES value verified server-side on first login, user prompted to set a new password; bcrypt thereafter; legacy column dropped after the migration window.

## OQ-4 — Link-based auto-login (`?id=`, LinkId from PMS)
- Question: is auto-login link parity required in phase 1 (PMS integration) or can it be deferred with standard login only?
- Impact: PMS integration scope + security posture (SEC-L-10).

## OQ-5 — Improvements allowed at cutover
- Question: may the new app change UX for *actively broken/dangerous* legacy items (e.g., password display, apostrophe-stripping, POST-for-GET, permission model hardened beyond menu-visibility)? Suggest yes with no functional/regression.
- Impact: scope discipline & parity test matrix.

## OQ-6 — Document file storage target (D-008 dependency)
- Question: on-prem directory vs cloud object storage (e.g., S3/Azure Blob)? Access pattern (in-app stream vs signed URLs)? Any on-prem constraint?
- Impact: upload/download implementation, backup plan, migration WS-5.

## OQ-7 — PII / retention / compliance needs
- Question: any UAE-specific retention requirements for employee documents/images/audit logs? Backup expectations? Who may view which document types (role matrix)?
- Impact: document design + audit logging.

## OQ-8 — Timezone semantics (D-006)
- Question: legacy passes `TimeZone` header — confirm intended server behavior (proc bodies pending) and pick wall-clock vs UTC normalization for target schema.
- Impact: schema types + all date calculations (reports, expiry alerts).

## OQ-9 — Phase-1 master list confirmation
- Question: confirm which masters are release-1 (proposed: Department, Site/Branch, Role, Language, Employee/Contract type, Parameters, Shift master, Weekly-off, Holiday lists/config, Document types) vs deferred (e.g., Designation/Grade/Table-based configs if they exist only in metadata engine).
- Impact: MD-03 scope and ETL workloads.

## OQ-10 — External integrations timeline
- Question: PMS user push & e-movers attendance sync are out of phase-1; will employees created in the new system need PMS accounts immediately? Any interim bridge needed?
- Impact: employee-save API design &-auto login mapping.

## OQ-11 — Hosting/deployment targets for new stack
- Question: where will staging/prod run (Linux server, Docker, cloud)? equals secrets management expectations?
- Impact: ARCH-01 finalization & DATA_MIGRATION cutover design.

## OQ-12 — Legacy "Token reuse" behavior — **RESOLVED for target (D-007)**
- Question: `GetLogin` may return an existing AuthToken — intended multi-device behavior or accident? Confirm expected multi-session behavior in the new system.
- Update 2026-10-28: **proc body confirms reuse is real** (existing `system.Token` row returned when present). Question stands for the target design.
- Target decision: **new sessions are created per login**; token reuse is not reproduced. Refresh sessions are revocable and rotated (D-007; represented by `Session` in the Prisma draft).

## OQ-13 — Document no. uniqueness & per-type numbering
- Question: any uniqueness requirements for DocumentNo per type/employee/country. Emirates ID `PersonIDNumber≥14` exists in profile meta; document-level numbering undecided.
- Update 2026-10-28: `HRMS.Document` has **no document-number field and no unique constraints** beyond PK; `IdentityNo`/`DocumentTitle` are free-text. Business to confirm if numbering is needed in target.

## OQ-14 — Duplicate data resolution before cutover — **RESOLVED (D-016)**
- Answer 2026-10-28: **Yes** — duplicates (usernames, "Admin" role) resolved and FileDoc types re-derived during migration; reconciliation report for sign-off first; target schema enforces the invariants.

## OQ-15 — `dbo` junk tables & destructive procs (still open)
- Question: confirm the 14 Excel-import tables (`'Dec 2021$'`, `OT$`, `Sheet2$`, `temp`, …) and maintenance procs (`CleanupUser`, `CleanupInActiveUser`) are safe to leave behind (not migrated, never re-run). Any process still using them?
- Impact: migration scope; legacy hardening.

## OQ-16 — Plaintext PII protection in target — **RESOLVED (D-015)**
- Answer 2026-10-28: **Yes** — AES-256-GCM app-level encryption at rest for identity numbers + keyed-HMAC search columns; masked lists; audited detail views.

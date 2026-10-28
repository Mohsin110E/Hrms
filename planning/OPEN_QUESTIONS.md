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

## OQ-4 — Link-based auto-login (`?id=`, LinkId from PMS) — **RESOLVED: skip for now**
- Answer 2026-10-28: **Defer link-based auto-login**. The target uses standard authentication only for now; PMS link-login can be reconsidered with the future PMS integration.
- Impact: removes the insecure legacy passwordless URL flow from Phase 1 (SEC-L-10). Legacy `LinkId` data may be retained in migration staging but is not exposed by the target auth API.

## OQ-5 — Improvements allowed at cutover — **RESOLVED: yes with no functional regression**
- Answer 2026-10-28: **Yes** — the new app may fix actively broken/dangerous legacy items (password display, apostrophe-stripping, POST-for-GET, hardened permission model beyond menu-visibility, etc.) as long as the business function is preserved and no regression is introduced.
- Impact: parity test matrix tests business outcome, not pixel-for-pixel or verb-for-verb legacy reproduction.

## OQ-6 — Document file storage target (D-008 dependency) — **RESOLVED: private folder**
- Answer 2026-10-28: store files in a private server folder outside the public web root; access through authenticated application endpoints. Folder location is environment configuration.
- Impact: upload/download implementation and backup plan; no public static serving or Google Docs preview.

## OQ-7 — PII / retention / compliance needs
- Question: any UAE-specific retention requirements for employee documents/images/audit logs? Backup expectations? Who may view which document types (role matrix)?
- Impact: document design + audit logging.

## OQ-8 — Timezone semantics (D-006) — **RESOLVED for target design (D-018)**
- Answer 2026-10-28: persist timestamps in UTC and set the business timezone through an environment variable (`APP_TIMEZONE`, initially expected to be `Asia/Dubai`). Convert for display and date-boundary calculations; do not depend on the host server timezone.
- Impact: Prisma draft uses `timestamptz`; date-only business fields remain `date`.

## OQ-9 — Phase-1 master list confirmation — **RESOLVED (D-019)**
- Answer 2026-10-28: approve the recommended list: Department, Site/Branch, Role, Language, UserType, Parameter catalogs, DocumentType, EmployeeType, ContractType, Designation, Nationality/Country, VisaType, PassportType, MaritalStatus, Gender, BloodGroup, RelationType, SourceOfHire, Location, Shift, timezone configuration, Weekly-off, Holiday, and metadata definitions/configuration.
- Clarification: this is a scope decision, **not deletion**. Leave/payroll/attendance/muster, airfare/comp-off, Excel payroll/import pipelines, and PMS/e-movers integrations are deferred, not removed from the legacy system.
- Impact: MD-03 and ETL scope are now fixed for Phase 2 design.

## OQ-10 — External integrations timeline
- Question: PMS user push & e-movers attendance sync are out of phase-1; will employees created in the new system need PMS accounts immediately? Any interim bridge needed?
- Impact: employee-save API design &-auto login mapping.

## OQ-11 — Hosting/deployment targets for new stack — **DEFERRED**
- Answer 2026-10-28: **Deferred**. Development proceeds locally; deployment/hosting decision will be made later.
- Impact: local dev scaffold uses environment-driven config so the hosting choice can be plugged in later without code changes.

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

# OPEN_QUESTIONS.md — Questions Requiring Business/Technical Clarification

Each item: ID, question, why it matters, evidence gap, impact if unanswered.

## OQ-1 — Confirmed read-only UAT credentials (BLOCKER)
- Question: provide a SQL Server account for **UAT only** with SELECT + metadata permissions; confirm intended discovery DB is `HRMSEmoveUAT` (not the `HRMSEmove_Sep3` referenced in current configs).
- Gap: no DB access yet. Impact: DB discovery (DB-02..06), proc bodies for all module rules, metadata content, and the migration mapping validation are all blocked.

## OQ-2 — Forgot password / change password intent
- Question: are these flows *planned but unfinished* (commented-out server code, dead UI route) — and do you want them in the new system Phase 1?
- Impact: core UM UX + security design (email flow, tokens).

## OQ-3 — Password migration strategy (D-005)
- Question: force reset-all at cutover vs lazy rehash (decrypt-once + bcrypt) — and which policy (keep legacy 8–15 4-class regex vs modern NIST-style)?
- Impact: cutover experience + code architecture for a temporary decrypt path.

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

## OQ-12 — Legacy "Token reuse" behavior
- Question: `GetLogin` may return an existing AuthToken — intended multi-device behavior or accident? Confirm expected multi-session behavior in the new system.

## OQ-13 — Document no. uniqueness & per-type numbering
- Question: any uniqueness requirements for DocumentNo per type/employee/country (proc bodies pending). Emirates ID `PersonIDNumber≥14` exists in profile meta; document-level numbering undecided.

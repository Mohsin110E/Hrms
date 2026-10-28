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
- Date: 2026-10-28 · Status: **Proposed (revisit after DB-03)**
- Decision: reproduce the *capability* (definitions-driven forms) safely as normalized definition tables + JSONB field config + typed value storage, rather than one per-master hardcoded endpoint OR replicating legacy dynamic SQL.
- Rationale: department/site/role/employee/document UIs are all metadata-driven today; a safe engine preserves flexibility without string-concat SQL.

## D-004 — No UAT access until verified read-only
- Date: 2026-10-28 · Status: **Approved/Active**
- Decision: zero DB connections until a SELECT-and-metadata-only account's effective permissions are verified; all DB discovery steps gated on TASKS DB-01.
- Rationale: mandatory safety rule; DB contains real employee PII.

## D-005 — Password migration strategy
- Date: 2026-10-28 · Status: **Open — needs business decision (OQ-3)**
- Options: (a) force reset-all; (b) lazy rehash on first login (requires temporary legacy decrypt path); related: keep legacy regex policy BR-UM-10? Adopt modern policy?
- Rationale: legacy DES-encrypted passwords cannot be verified offline; user experience at cutover differs materially.

## D-006 — Time/date semantics in target schema
- Date: 2026-10-28 · Status: **Open (OQ-8)**
- Question: keep wall-clock `timestamp` semantics (legacy) vs normalize to `timestamptz` w/ UTC.
- Note legacy already passes client `TimeZone` header — intended server usage unverified (proc bodies needed).

## D-007 — Token/session mechanism for Next.js + NestJS
- Date: 2026-10-28 · Status: **Proposed**
- Decision: short-lived JWT access token (15 min) + server-side revocable refresh session with enforced expiry & rotation; idle timeout ≤ legacy 180 min; logout revokes. Cookie vs header transport to be pinned in implementation phase (CSRF implications documented in SECURITY_REVIEW.md §2).

## D-008 — Replace static file serving with authenticated downloads
- Date: 2026-10-28 · Status: **Proposed**
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

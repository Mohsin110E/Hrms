# SECURITY_REVIEW.md — Legacy Security Findings & Target Security Design

Scope: source-level review of `D:\.net\hrms` (read-only) + live DB metadata inspection of `HRMSEmove_Sep3` under SELECT-only discipline (D-012, 2026-10-28). No exploitation performed; findings reported responsibly.
Severity: 🔴 high / 🟠 medium / 🟡 low / INFO.

## 1. Legacy findings

| # | Sev | Finding | Evidence | Impact |
|---|---|---|---|---|
| SEC-L-01 | 🔴 | **Passwords stored reversibly encrypted (DES-CBC, hardcoded 8-byte key + fixed IV in source)**; "hashing" absent; `Decrypt` available to any code path | `src\EmqubeLibrary\BLL\ELHelperManager.cs:26–76` | password disclosure possible; trivial brute-force of key from source |
| SEC-L-02 | 🔴 | **Auth tokens never expire** (`ExpiresOn = IssuedOn`), existence-only validation, stored as plain GUID in DB; leaked token = permanent access until manual Kill | `TokenService.cs` (115–122 expiry commented) | session hijack persistence |
| SEC-L-03 | 🔴 | **Metadata master/doc engine builds SQL by string concatenation** (user-controlled values interpolated; apostrophes stripped client-side as only defense) | `MasterSetup.cs` (GetMetaDataList/GetMetaData/AddUpdateMetaData/AddUpdateMetaDataDoc), `DataHelper.cs` | SQL injection risk |
| SEC-L-04 | 🔴 | **Static file middleware serves `Documents/` unauthenticated**; all employee payslips/docs/photos reachable by URL guessing/time epoch patterns; preview shared via public Google Docs viewer | `Startup.cs`, `popup.component.ts:63–119` | unauthorized document access (passport, visa, Emirates ID, licence, payslip PDFs) |
| SEC-L-05 | 🟠 | **CORS AllowAllOrigins** (any origin/method/header) with credentialess token & localStorage — CSRF lower, but enables script access; whitelisted unauthenticated endpoints include `/api/values` scaffold | `Startup.cs`, `CommonController` whitelist | misc exposure |
| SEC-L-06 | 🟠 | **Session timeout enforced only client-side** (180 min slide); server ignores token age | `Constants.ts:4`, `http.service.ts` | stale sessions |
| SEC-L-07 | 🟠 | **User list API returns Password field** (proc `GetSiteUserDataList`) to the Angular layer | `ProfileManager.GEtSiteUserList` | mass disclosure of encrypted passwords |
| SEC-L-08 | 🟠 | **Secrets committed in source control**: plaintext SQL credentials (multiple configs incl. SA-level), SMTP settings, Google API key, GemBox key, hardcoded DES key | `app.config`×3, `Config.xml`, `ELHelperManager.cs` | repo compromise = full DB/email access |
| SEC-L-09 | 🟠 | Password-generated reminder: `GenerateRandomPassword(6)` with `System.Random` (predictable, short) | `ELHelperManager.cs` | weak generated passwords |
| SEC-L-10 | 🟡 | Login accepts `?id=` link-based auto-login without password (LinkId in query string) — predictable grant if Links enumerable | `login.component.ts:38–42` | account access via leaked link |
| SEC-L-11 | 🟡 | Error handling returns 200 for missing auth header; generic 400 on exceptions; detailed stack traces in committed log files (some with identifiers) | `ActionFilter.cs`, `ExceptionLog\*.txt` | info leakage |
| SEC-L-12 | 🟡 | No audit trail for document view/download/upload beyond email logs; lockout threshold unknown (proc body needed) | review | compliance gap |
| SEC-L-13 | INFO | Response always POST; no security headers config found (HSTS, CSP) — unknown at IIS level | `web.config` | unknown |
| SEC-L-14 | INFO | Failed login count/lock: `AddUpdateSiteUserActivity` — **DB-confirmed: locks at 5 failed attempts; success resets; but 0 locked users / max_failed=0 in data (effectively inert)** | `discovery/procs/AddUpdateSiteUserActivity.sql`; `discovery/aggregates.csv` |
| SEC-L-15 | 🔴 | **SQL CLR crypto assembly `SMISQLDataApp` (SAFE_ACCESS) installed with `clr enabled=1`; `dbo.Encrypt`/`dbo.Decrypt` scalar functions** — the database itself can decrypt any credential | `discovery/fn_search2.csv`, `discovery/clr_assemblies.csv` |
| SEC-L-16 | 🔴 | **`GetSiteUserDataList` decrypts passwords inside SQL (CLR `DBO.decrypt`) and returns plaintext passwords to the client** — mass credential disclosure on every user-list view | `discovery/procs/GetSiteUserDataList.sql` |
| SEC-L-17 | 🟠 | **Plaintext PII on `usr.Profile`**: PassportNo, EmiratesId, MOLNo, VisaNo stored unencrypted while site credentials are DES — inconsistent protection; 852 profiles incl. 380 inactive retained | `discovery/columns_usr_employee.csv` |
| SEC-L-18 | 🟠 | **Destructive maintenance procs shipped to production**: `CleanupUser` (wipes all data keeping only ProfileId 126), `CleanupInActiveUser` (deletes inactive profiles + hardcoded FileDocIds 227–231) | `discovery/procs/CleanupUser.sql`, `CleanupInActiveUser.sql` |
| SEC-L-19 | 🟠 | **`system.Configuration` row 13 stores an encrypted secret (`PayrollPassword`) — value redacted from all committed docs**; treated as compromised, rotate at cutover. (Encrypted payroll config secret also implies payroll subsystem credentials in DB config) | `discovery/config_tables.csv` |

## 2. Target security design (proposal)

| Area | Proposal |
|---|---|
| Password storage | **[proposed]** bcrypt cost ≥ 12 (or argon2id); no reversible crypto; per-user salt from hash string |
| Password migration | **[approved: D-014]** Keep legacy DES ciphertext only during the migration window; verify it server-side on first login, force a password change, store bcrypt/argon2, then clear/drop the legacy value. The legacy decrypt path is never exposed to APIs and is removed after the window. SEC-L-15/16 mean the legacy values are treated as compromised. |
| Sessions | **[proposed]** short-lived JWT access (15 min) + opaque refresh token (server-side, revocable, `expires_at` enforced, sliding idle expiry ≤ legacy 180 min), revoke on logout, token rotation, reuse detection |
| AuthN flow | **[proposed]** strict whitelist for unauthenticated endpoints (`/auth/login`, `/auth/forgot-password`); account lockout with threshold from legacy proc evidence; rate limiting on login/forgot; failed-attempt audit preserved |
| Password policy | **[proposed]** adopt legacy regex (BR-UM-10) server-side: 8–15 with upper/lower/digit/special — revisit length-first NIST-style policy with stakeholders **[open]** |
| Authorization | **[proposed]** continue UserTypeId→menu model as data-driven RBAC; add resource checks (self vs. others for documents); menu IDs become stable DB-driven config preserved during migration |
| CSRF | **[proposed]** since frontend is Next.js: use SameSite=Lax cookies for refresh token + anti-CSRF token on state-changing calls, or Authorization header only with JWT in memory — document choice in DECISIONS before implementation |
| XSS | **[proposed]** React/Angular escaping; sanitize any rich text (email HTML preview) |
| SQL injection | **[proposed]** Prisma parameterization everywhere; NO dynamic string SQL anywhere; metadata engine rebuilt over definitions tables with typed columns/JSONB, no string-concat SQL |
| File security | **[proposed]** private storage (folder outside web root or object storage with signed URLs); download via authenticated endpoint that checks document ownership/permissions; UUIDs for file names; strip/full preserve original name in metadata only; extension+size checks server-side (jpg/jpeg/png/pdf ≤ 10 MB; photos jpg/jpeg/png ≤ 10 MB; import xls/xlsx/xlsm/csv) — from BR-MD-09/DOC-05; consider AV scan hook; **no public URL preview** — inline render via signed, short-lived URLs |
| PII (passport/visa/Emirates ID/licence) | **[proposed]** restrict fields to authorized roles; mask in list views (last 4); full number only in detail view with audit; never log. **DB evidence: legacy stores these plaintext on `usr.Profile` (SEC-L-17) — target adds encryption-at-rest or equivalent (OQ-16)** |
| Audit logging | **[proposed]** append-only audit table: logins, lockouts, password changes/resets, document view/download/upload/replace/delete, master data changes, with actor, IP, timestamp |
| Transport | **[proposed]** HTTPS-only, HSTS, secure cookies, prepared CSP, strict CORS allowlist |
| Secrets | **[proposed]** env-based config, `.env` git-ignored, `.env.example` placeholders; secrets manager in deployment; all legacy committed secrets treated as compromised → rotate at cutover |
| Error handling | **[proposed]** problem+json error model; no stack traces; structured logs without PII |
| DB access | **[proposed]** least-privilege app login: only DML on owned schema; separate migration role |

## 3. Compliance / retention flags (open)

- Retention obligations for UAE documents ( passport / visa / Emirates ID / licence scans + expiry data) — not visible in repo; ask business (OQ-7).
- Data residency: local file storage today; confirm acceptable cloud/on-prem for new system.
- Backup expectations (currently unknown) — file system + SQL backups unknown.

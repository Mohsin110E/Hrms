# DATABASE_DISCOVERY.md — Legacy DB Findings & SQL Server → PostgreSQL Mapping

## Status

✅ **Direct read-only inspection performed 2026-10-28** against `HRMSEmove_Sep3` (server `emovedb`,
`13.71.26.127,35398`, SQL Server 2019 / 15.0.4500.2). Access verified **NOT read-only** (login is
`sysadmin`/`db_owner`); owner authorized proceeding under **SELECT/metadata-only discipline**
(DECISIONS D-012): only catalog views + table SELECTs; **no EXEC, no writes, no Prisma against the
server**; credentials never committed to any file. Raw evidence: `planning/discovery/*.csv`,
`planning/discovery/procs/*.sql` (38 proc definitions dumped via `OBJECT_DEFINITION` — metadata read,
never executed).

## 1. Database & schema landscape

One database, **5 schemas, 107 tables, 46 views, 200 stored procedures, 0 triggers**.

| Schema | Role | Contents |
|---|---|---|
| `dbo` | App logic + junk | **all 200 stored procs live here**; also 14 Excel-import junk tables (`'Dec 2021$'`, `OT$`, `Sheet2$`, `temp` 7,271 rows, `'WPS Salary$'`, …) — do **not** migrate |
| `HRMS` | Transactional | Document, LeaveRequest (24,209), AttendanceLock (50,052), LeaveSummary, AirTicket*, Payroll*, EmailLog, **Token (4 rows — one-time link tokens)** |
| `master` | Reference data | FileDoc (11,063), AdditinalDocumentValue (4,417), DocumentType, FileDocMapping, Site, Department, Role, UserType, Shift, HolidayList, TimeZoneOffset, Payroll* |
| `system` | Framework | MetaData (42), MetaDataDetail (241), MetaDataConfig, Parameter/ParameterType, MenuItem/MenuUserType/MenuRole/MenuSpecialUserAccess, **Token (85 — session tokens)**, Configuration (25), Message, WeeklyOffConfig |
| `usr` | People | Profile (852), Employee, SiteUser (510), SiteUserActivity (123), SiteUserActivityLog (33,508), ProfileDepartment, Account, Dependant |

Evidence: `discovery/tables_rows.csv` (107 rows), `discovery/views.csv` (46), `discovery/procedures.csv` (200), `discovery/triggers_views.csv` (0 triggers).

### Naming hazard
- `master.FileDoc.FileDocTypeId` FK → **`master.DocumentType`** (not a "file type") — FK says `FK|master|FileDoc|FileDocTypeId|master|DocumentType` (`discovery/constraints.csv`). Two vocabularies for the same thing; normalize in target.
- Two distinct `Token` tables with different semantics (session vs. one-time link) — see §4.

## 2. Key tables — User Management (Module 1)

### `usr.SiteUser` — 510 rows
Columns (complete): `SiteUserId (PK), ProfileId→Profile, UserTypeId→UserType, UserName nvarchar(500), Password nvarchar(500)` — **nothing else** (`discovery/columns_modules.csv`). `IsSiteAccess` and `StatusId` live on `usr.Profile`, not SiteUser.
- **NO unique constraint on `UserName`** — 510 rows / 507 distinct usernames (**3 duplicates**) (`discovery/aggregates.csv`). Login (`GetLogin`) does `UserName=@UserName AND Password=@Password` without TOP 1 — duplicates are a live ambiguity risk.
- 510 distinct ProfileIds (1:1 with Profile), 0 empty passwords.

### `usr.SiteUserActivity` — 123 rows
`ProfileId, LastLogin, LastIPUsed, PasswordChanged, IsPasswordReset, FailedLoginAttemptCount, IsUserLocked, FailedLoginAttemptDate`.
- 0 locked users, max `FailedLoginAttemptCount` = 0 (lockout logic exists but counters are reset on success; 123 rows for 510 users — rows only created on first activity event).

### `usr.SiteUserActivityLog` — 33,508 rows
Only `LogTypeId = 6` ("Login") present — **no logout, no failed-attempt, no password-change events are logged** (`discovery/aggregates2.csv`). `system.Parameter` ParameterTypeId 3 has only Login (6).

### Tokens — two tables
| Table | Rows | Semantics |
|---|---|---|
| `system.Token` | 85 | Session tokens: `TokenId, SiteUserId→usr.SiteUser, AuthToken, IssuedOn, ExpiresOn`. **All 85 rows have `ExpiresOn = IssuedOn`** (never expire). Oldest 2021-03-01, newest **2026-10-22 → the system is in active use.** |
| `HRMS.Token` | 4 | One-time link-login tokens: `TokenId, AuthToken, CreatedDate, ProfileId`. Consumed (deleted) by `GetLogin` when `@LinkId` is used. |

### `master.UserType` — 4 rows
1=Executive, 2=Manager, 3=System Admin, 4=HR Admin. SiteUser distribution: Executive 468, Manager 29, HR Admin 11, System Admin 2 (`discovery/aggregates2.csv`).

### `master.Role` — 4 rows
1=Admin, 5=Manager, 6=Employee, 7=Admin (**duplicate name "Admin", different RoleId**) — role table exists but menus are driven by UserType, not Role (see §5).

### Menu framework
- `system.MenuItem` (PageUrl, MenuOrder, ParentId, icon, IsMainMenu…), `system.MenuUserType` (per-UserType menu rights incl. `PageUrl` override, IsCreate/IsEdit/IsDelete), `system.MenuSpecialUserAccess` (per-profile include/exclude overrides), `system.MenuRole` (vestigial).
- Evidence: `discovery/config_tables_grouped.txt` (full dumps), `discovery/procs/GetSiteUserMenuItem.sql`, `AddUpdateMenuUserType.sql` (MERGE), `GetMenuList.sql`.

## 3. Key tables — Setup / Master Data (Module 2)

### Metadata engine (the core of Module 2)
- `system.MetaData` — 42 rows mapping logical entities → tables: 1=Language, 2=Role, 3=Site, 4=Department, 5=Basic Profile (`usr.Profile`), 6=Work Employee (`usr.Employee`), 7=Bank (`usr.Account`), 8=Document (`HRMS.Document`), 10=Personal, 11=Profile, 12=Employee, 15=Exit Details, 27=User Credentials, 29=Other … (`discovery/system_MetaData.csv`).
- `system.MetaDataDetail` — 241 field definitions: `FieldName, DisplayName, DataType, IsMandatory, ValidationText, DocumentType, IsForiegnkey, DisplayOrder, IsGridVisible…` (`discovery/system_MetaDataDetail.csv`).
- `system.MetaDataConfig` — form sectioning: Basic(5), Employment(6), Personal(10), Bank(7), User Credentials(27), Other(29) (`discovery/aggregates2.csv`).
- **Field DataType catalog** (system.Parameter ParameterTypeId 6): **14=string, 15=password, 16=bit, 17=date, 19=byte, 20=int, 23=upload, 26=singleselect, 30=multiselect, 31=Text** (`discovery/datatype_map.csv`, `system_parameters.csv`).

### Reference masters (row counts + uniqueness)
| Master | Rows | Unique constraint | Notes |
|---|---|---|---|
| `master.Department` | 8 | **UQ on DepartmentName** | Sales/Operations/Stores/Finance/Admin/HR/IT/Safety & Procurement |
| `master.Site` | 4 | none | Dubai Head Office, Abudhabi, Nepal, India |
| `master.Role` | 4 | none | duplicate "Admin" name |
| `master.Language` | n/a | UQ LanguageName | |
| `master.DocumentType` | 11 | **UQ DocumentName** | 1=Passport, 2=Work Permit, 3=Emirates Id, 4=Health Insurance, 5=Trade License, 6=Driving License, 106=nol, 107=Visa, 108=Trafffic Fine, 109=Warning Letter, 110=Accident Document |
| `master.Shift` | n/a | none | ShiftName, StartTime/EndTime (`time`), LateMinutes, HalfDayMinutes, Alt times |
| `master.HolidayList` | 9 | none | |

### Employee & profile structure
- `usr.Profile` — 852 rows (472 Active / 380 Inactive; `StatusId` 4→ParameterValue 1 "Active", 5→2 "Inactive"). Holds identity numbers **in plaintext** (`PassportNo, EmiratesId, MOLNo, VisaNo` — see §8). **No DepartmentId column** — M2M via `usr.ProfileDepartment`, but `AddUpdateProfile` treats `@DepartmentIds` as a single value (integration bug/risk). `PhotoId → master.FileDoc` FK.
- `usr.Profile.LinkId` set on 427 rows (PMS link-login population).
- `usr.Employee` — PK `EmployeeId`; `EmployeeCode nvarchar(10)`; `ProfileId` link.
- **Column-id gap**: `usr.Profile` has a dropped-column gap at column_id 7 — evidence of schema drift; EF mappings must be re-validated (`discovery/columns_usr_employee.csv`, `columns_modules.csv`).
- `system.WeeklyOffList.SiteId` is **`varchar(200)` holding a CSV** of sites; weekly-off config per site/year via `system.WeeklyOffConfig` + `master.HolidayList`.

### Configuration (`system.Configuration` — 25 rows)
Business knobs: CompOff Leave Expiry 90d, CompOff Request Expiry 30d, PayrollMonth 6, HalfDay/FullDay hours, Attendance Sync Date, GratuityDate, RamadanDates, MaxNoOfFamilyMembers 4, Deduction Percentage 20 …
- ⚠ **Row 13 `PayrollPassword` holds an encrypted secret — value redacted from all reports** (`discovery/config_tables.csv` kept in planning evidence — consider scrubbing that CSV before any sharing).

## 4. Key tables — Document Management (Module 3)

### `HRMS.Document` — 3,279 rows (3,126 active)
Columns: `DocumentId, DocumentTypeId→DocumentType, IssueDate, ExpiryDate, Remarks, IsActive, ProfileId→Profile, CompanyId, IsSelf, IdentityNo, DocumentTitle` (`discovery/columns_modules.csv`).
- **`ExpiryDate` is 100% NULL on all 3,126 active rows** (`discovery/aggregates2.csv` DOC_EXPIRY_NULL). The column is dead — see below.

### Where expiry actually lives
`master.AdditinalDocumentValue` (4,417 rows) holds per-document extra fields keyed by `MetaDataDetailId` (FK→`system.MetaDataDetail`) + `DocumentId` (FK→`HRMS.Document`). Date-typed (`DataTypeId=17`) `ExpiryDate` rows, all parseable (`discovery/aggregates2.csv`):

| MetaDataDetailId | DocumentType | Documents w/ expiry |
|---|---|---|
| 28 | 1 Passport | 939 |
| 1150 | 3 Emirates Id | 835 |
| 1149 | 2 Work Permit | 755 |
| 1154 | 107 Visa | 555 |
| 1153 | 6 Driving Licence | 40 |
| 1151 | 4 Health Insurance | 1 |
| | **Total** | **3,125** (1 active doc has no expiry) |

Document counts by type (`discovery/aggregates.csv`): Passport 1,085 (1,059 active), Emirates Id 837/784, Work Permit 757/715, Visa 556/525, Driving License 40/39, Health Insurance 1, Warning Letter 3.

### Files
- `master.FileDoc` — 11,063 rows: `FileDocId, DocName, FolderPath, FileDocTypeId→DocumentType, CreatedBy→Profile, CreatedOn…`. **`AddUpdateFileDoc` hardcodes `FileDocTypeId = 1` ("Passport") on insert** — the type is corrected later only via `DocumentType`-specific flows; FileDoc distribution shows 9,656 rows sitting at type 1 (`discovery/aggregates.csv`).
- `master.FileDocMapping` — 3,269 rows: `FileDocId ↔ DocId (→HRMS.Document)` (+ MetaDataDetailId for extra-column files).
- Reporting views `dbo.VisaDocView` / `dbo.PassportDocView` / `dbo.WorkPermitDocView` join Document+AdditinalDocumentValue+MetaDataDetail (`md.FieldName='ExpiryDate' AND dc.DocumentTypeId = md.DocumentType AND md.DataTypeId=17`), filter `IsActive=1 AND IsSelf=1` (`discovery/view_visadoc.sql`, `view_passportdoc.sql`).

## 5. Stored-procedure behavior (bodies read — see `discovery/procs/`)

38 module-relevant proc definitions captured. Key confirmed behavior:

### Auth / session
- **`GetLogin`** (`procs/GetLogin.sql`): compares **`UserName=@UserName AND Password=@Password`** directly (both values arrive pre-DES-encrypted from C#) against `usr.SiteUser`; requires **`Profile.IsSiteAccess = 1`** (no status filter in SQL — archived-user check happens in C#); on success **returns the existing `system.Token` row (token reuse)** instead of always creating one; if `@LinkId` provided, resolves `HRMS.Token` by Authtoken → **deletes the row after use (one-time link login)** and matches `Profile.LinkId = <token's ProfileId>`; `InvalidUser` hardcoded 0; wrong password still returns the ProfileId (for activity logging). Also returns Department via `ProfileDepartment` left join (multi-department profiles would fan out rows).
- **`ResetPassword`**: plain `UPDATE usr.SiteUser SET Password=@Password, UserName=@UserName, UserTypeId=@UserType` — no history, no hashing (values pre-encrypted in C#).
- **`AddUpdateSiteUserActivity`**: upsert; **locks the user (`IsUserLocked=1`) when failed-attempt count reaches 5** (threshold confirmed in body); successful login resets counter. Combined with the data (0 locked, 0 max_failed), lockout is effectively inert in practice.
- **`GetSiteUserDataList`**: returns the user list **with passwords decrypted in SQL** via CLR function `DBO.decrypt` — decrypted credentials travel to the client (`procs/GetSiteUserDataList.sql`).

### Menus
- **`GetSiteUserMenuItem`**: base = `system.MenuUserType` rows for the user's UserTypeId (with PageUrl override) + `system.MenuSpecialUserAccess` per-profile include/exclude overrides.
- **`AddUpdateMenuUserType`**: **MERGE** (upsert) of the TVP into `MenuUserType`.
- **`GetMenuList` bug**: assigns `@RoleId = @ProfileId` — the vestigial `MenuRole` path is broken/unused.
- **`GetMenuItemList`**: per-page tab rights for a MenuItemId.

### Profile / employee
- **`AddUpdateProfile`** (74 params, single transaction): insert-or-update across `usr.Profile`, `usr.Employee`, `usr.Account`, dependants (real `Profile` rows), `ProfileDepartment` (single value despite M2M shape), SiteUser creation, weekly-off/holiday assignment; duplicate checks emit MessageId 6 (Email exists) / 7 (EmployeeCode exists); `AddUpdateProfilePhoto` links photo FileDoc; `AddUpdateProfileLinkId` sets PMS LinkId.

### Documents
- **`AddUpdateDocument`**: TVP-driven **dynamic SQL built with string concatenation and executed via `sp_executesql`**; dates converted `CONVERT(date, value, 103)` → stored `101` (US format) in `AdditinalDocumentValue.Value` (varchar). Injection surface + format hazard confirmed.
- **`DeleteDocument`**: deletes `AdditinalDocumentValue`, `FileDocMapping`, `Document` rows — **physical files on disk are left orphaned**.
- **`AddUpdateFileDoc`**: hardcodes `FileDocTypeId=1` (see §4).
- **`GetEmployeeDocumentList`**: expiry = `CASE WHEN ad.Value IS NULL THEN NULL ELSE CONVERT(datetime, ad.Value, 103) END` — re-derives expiry from the extra-value table (dd/mm).
- **`GetDocumentExpiry` / `GetDocumentsListScheduler`**: expiry filter is `ISNULL(d.ExpiryDate, CONVERT(date, ad.Value, 104))` with `StatusId=4` (active employees); scheduler windows: previous-month→yesterday (expired), +7 days, +1 month, +3 months.
- **`GetDocumentReport` / `GetExpiredDocumentReport` / `GetExpiringDocumentReport`**: generic report engine over metadata + views above.

### Maintenance / destructive procs (must never run again)
- **`CleanupUser`**: wipes virtually the whole DB, **keeping only ProfileId 126** (hardcoded admin).
- **`CleanupInActiveUser`**: deletes StatusId=5 (inactive) profiles and their FileDocs, with **hardcoded FileDocIds 227–231**.
These confirm data-loss-by-design paths in legacy ops; excluded from target; flagged in SECURITY_REVIEW.

## 6. Integrity & structure findings

- FK graph captured in `discovery/constraints.csv` (all `is_not_trusted=0`); notable FKs: `system.Token.SiteUserId→usr.SiteUser`, `usr.Profile.PhotoId→master.FileDoc`, `master.FileDocMapping.DocId→HRMS.Document`, `master.AdditinalDocumentValue.{MetaDataDetailId→system.MetaDataDetail, DocumentId→HRMS.Document}`, `usr.Employee/... →usr.Profile`.
- **Unique constraints are sparse**: UQ only on `Department.DepartmentName`, `DocumentType.DocumentName`, `Language.LanguageName`, `PayrollHeader(PayrollTypeId,…)`. **Nothing on `SiteUser.UserName`, `Employee.EmployeeCode`, `Profile` identity columns** — all "uniqueness" is proc-level checks (race-condition prone).
- **Zero triggers** — all logic is in procs + app.
- All 200 procs in `dbo`; 46 views (mostly reporting `*View`).

## 7. Data quality & migration quirks

1. `dbo` junk tables (Excel imports, `temp` with 7,271 rows) — exclude from migration; verify nothing references them (proc scan says only dedicated imports do).
2. Duplicate `SiteUser.UserName` ×3 — resolve before imposing uniqueness (target: `citext` unique).
3. `Role` duplicate name "Admin" (1 and 7) — needs dedupe decision.
4. Dates stored as **varchar with mixed formats** in `AdditinalDocumentValue` (103 on write, read as both 103/104) — target must use real `date` columns; write a conversion validator for the ETL.
5. `Document.ExpiryDate` dead column (100% NULL) — in target, expiry is a first-class column on Document (populated from `AdditinalDocumentValue` during migration).
6. `FileDoc.FileDocTypeId=1` hardcoded on insert — 9,656 rows misplaced; derive the real type from `FileDocMapping→Document→DocumentTypeId` during migration.
7. `WeeklyOffList.SiteId varchar(200)` CSV — normalize to a junction table.
8. `usr.Profile` dropped-column gap (column_id 7) — EF EDMX mapping may skip a column; re-validate all EF mappings against live schema (done here — see §2/§3).
9. Identity high-water marks to be recorded at cutover (all PKs are `bigint/smallint IDENTITY`).
10. Case-insensitivity: legacy relies on CI collation (duplicate ShiftName check, UserName compare) — target needs `citext`/`lower()` indexes. Datetime target convention is now UTC `timestamptz` with `APP_TIMEZONE` conversion (D-018).

## 8. DB-level security findings (new, from live inspection)

| # | Finding | Evidence |
|---|---|---|
| SEC-L-15 | **SQL CLR encryption assembly `SMISQLDataApp` (SAFE_ACCESS) installed; `dbo.Encrypt`/`dbo.Decrypt` CLR scalar functions; `clr enabled=1`** — DB itself can decrypt any credential | `discovery/fn_search2.csv`, `discovery/clr_assemblies.csv` |
| SEC-L-16 | **`GetSiteUserDataList` decrypts passwords in SQL and ships them to the client** — worse than the app-level issue SEC-L-07 | `discovery/procs/GetSiteUserDataList.sql` |
| SEC-L-17 | Plaintext PII on `usr.Profile` (PassportNo, EmiratesId, MOLNo, VisaNo) while site credentials are DES — inconsistent protection; PII columns need column-level protection in target | `discovery/columns_usr_employee.csv` |
| SEC-L-18 | Dangerous destructive procs shipped to production (`CleanupUser`, `CleanupInActiveUser` w/ hardcoded IDs) | `discovery/procs/CleanupUser.sql` |
| SEC-L-19 | `system.Configuration` row 13 stores an encrypted secret (`PayrollPassword`) — **value redacted from all committed docs**; rotate at cutover | `discovery/config_tables.csv` |

## 9. SQL Server → PostgreSQL type mapping (validated against real schema)

| SQL Server (as found) | PostgreSQL (Prisma) | Notes |
|---|---|---|
| `bigint IDENTITY` PK (Document, Token, FileDoc, AdditinalDocumentValue) | `bigint` + `GENERATED BY DEFAULT AS IDENTITY` (`@default(autoincrement())`) | preserve legacy IDs |
| `int IDENTITY` (Profile, SiteUser) | `integer` identity | |
| `smallint` (DocumentTypeId, StatusId, UserTypeId, MenuIds) | `smallint` (`@db.SmallInt`) | keep ranges |
| `nvarchar(500)` UserName/Password | `text` + **`citext`/unique lower() index on UserName (new)** | no length need; add uniqueness legacy lacks |
| `varchar(1000/2000/…)` remarks, addresses | `text` | |
| `varchar(200)` CSV (WeeklyOffList.SiteId) | junction table | normalize |
| `varchar(5000)` AdditinalDocumentValue.Value | **`date` (expiry) / `text` (others)** | typed columns replace stringly-typed values (D-003) |
| `bit` | `boolean` | |
| `date` (IssueDate, ExpiryDate) | `date` | |
| `datetime` (IssuedOn, LastLogin, CreatedOn) | `timestamptz(3)` after source-timezone conversion; `APP_TIMEZONE` controls display/boundaries (D-018) | |
| `time` (Shift StartTime/EndTime) | `time` | |
| `decimal/float` (payroll — out of scope) | `numeric` | flagged only |
| TVP params (`DocumentType`, `DocumentExtraColumnType`, `DependantType`, `MenuItemType`) | JSON body → batched `createMany`/`$transaction` | |
| CLR `Encrypt/Decrypt` | **dropped** — bcrypt/argon2; no reversible crypto in target | |

## 10. Migration implications (feeds DATA_MIGRATION_PLAN)

1. **Reversible-encryption + plaintext-password-in-UI** → D-014 is approved: keep legacy DES ciphertext only for a migration window, verify server-side on first login, force a password change, then clear/drop it. `GetSiteUserDataList` proves decrypted passwords were shipped to clients — treat all legacy values as compromised; never expose the decrypt path through the new API.
2. **Expiry data reshaping**: ETL must pivot `AdditinalDocumentValue` (DataTypeId 17) → `Document.ExpiryDate`, parsing dd/mm-yyyy strings (3,125 values, 0 unparsable today).
3. **Uniqueness enforcement** (UserName ×3 dups, EmployeeCode) must be resolved pre-cutover with a dedup report for the business.
4. **File↔type repair**: derive FileDocTypeId from mappings; orphaned files on disk after DeleteDocument → reconcile file store vs DB during migration (MIG-03).
5. **No triggers / no jobs in DB** → schedulers are app-side (HRMS.Service) — in-process cron proposal (D-009) stands.
6. `system.MetaData/Detail/Parameter/Configuration/Message` rows migrate as **seed data** for the definitions-driven master engine (D-003) — extracts already captured.

## 11. Open items (updated)

1. ~~Proc bodies~~ ✅ done (38/38 module-relevant dumped & read; full inventory in `discovery/procedures.csv` — remaining ~160 procs are leave/payroll/attendance, dump on demand per module in Phase 2).
2. Confirm dedup decisions for duplicate usernames / Admin roles (business input — OQ-14).
3. Datetime conversion — source is legacy local wall-clock + TimeZone header; target conversion convention is UTC `timestamptz` + `APP_TIMEZONE` (D-018). Validate source timezone during ETL rehearsal.
4. Scrub/protect `discovery/config_tables.csv` before any external sharing (contains encrypted PayrollPassword — value must stay redacted in docs).
5. Remaining metadata rows (42 MetaData entries) beyond module-1..3 scope to be transcribed in Phase 2.

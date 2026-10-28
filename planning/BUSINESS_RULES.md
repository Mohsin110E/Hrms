# BUSINESS_RULES.md — Confirmed Business Rules (Phase-1 Modules)

Registers: **[current]** = confirmed existing behavior (evidence cited). **[proposed]** = target design suggestion. **[open]** = unresolved.
Rule IDs are stable and referenced by `TEST_STRATEGY.md`; new rules must get an ID and an evidence path.

## UM — Authentication & sessions (Module 1)

| ID | Rule | Register | Evidence |
|---|---|---|---|
| BR-UM-01 | Login requires `UserName` + `Password`; server DES-encrypts lowercase username & password and compares against stored encrypted values via proc `GetLogin`. **Proc confirmed:** `WHERE su.UserName=@UserName AND su.Password=@Password` (both DES values) + `Profile.IsSiteAccess = 1` (flag is on Profile, not SiteUser); **no status filter in SQL** (archived check is C#-side); `InvalidUser` hardcoded 0; wrong password still returns ProfileId for logging | [current] **DB-confirmed** | `discovery/procs/GetLogin.sql`; `ELCommonManager.cs:19` |
| BR-UM-02 | Archived users (`StatusValue == 2`) cannot login | [current] (check in `GetLogin()` method; full logic in proc not yet inspected) | `CommonController.GetLogin` |
| BR-UM-03 | Locked users (`IsUserLocked` flag) cannot login; **proc confirmed: `AddUpdateSiteUserActivity` sets `IsUserLocked=1` when `FailedLoginAttemptCount` reaches 5**; success resets counter. Data shows lockout effectively inert (0 locked, max_failed=0 across 123 activity rows) | [current] **DB-confirmed** | `discovery/procs/AddUpdateSiteUserActivity.sql`; `discovery/aggregates.csv` |
| BR-UM-04 | On successful login a `Token` row is created with GUID `AuthToken`; **`ExpiresOn = IssuedOn` (never expires)** — confirmed in data: all 85 `system.Token` rows have ExpiresOn=IssuedOn; newest 2026-10-22 (system in active use); `ValidateToken` only checks existence | [current] **DB-confirmed** | `TokenService.cs`; `discovery/aggregates.csv` TOKEN_SYS |
| BR-UM-05 | Login **reuses** an existing `system.Token` row (returns existing token rather than creating a new one) — confirmed in proc body | [current] **DB-confirmed** | `discovery/procs/GetLogin.sql` |
| BR-UM-06 | All requests require header `AuthToken`; whitelist: `/api/values`, `/api/common/getlogin` (only) | [current] | `Filter\ActionFilter.cs` |
| BR-UM-07 | Client-side sliding session timeout of 180 min (`setupTime`); on expiry clears localStorage and routes to login; server never enforces | [current] | `Constants.ts:4`, `http.service.ts:63–91` |
| BR-UM-08 | Logout deletes the Token row (`Kill`) | [current] | `TokenService.Kill`; `http.service.ts:150–161` |
| BR-UM-09 | Password change/reset: admin reset via `ResetPassword` (password+username DES-encrypted then reset for a `SiteUserId`) | [current] | `ProfileManager.cs:3911` → proc `ResetPassword` |
| BR-UM-10 | Password complexity regex exists client-side: `^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,15})$` (8–15, upper/lower/digit/special), but **not locally enforced in forms** | [current] (dead/latent) | `Constants.ts:26–27` |
| BR-UM-11 | Random password generator length 6, `System.Random` (non-crypto) — used for generated federated emails/resets | [current] | `ELHelperManager.GenerateRandomPassword` |
| BR-UM-12 | Forgot password: client sends `{EmailId, IPAddress}`; server flow commented out — **current behavior unclear** | [open] | `login.component.ts:148–201`, `CommonController.cs:615–681` |
| BR-UM-13 | Change password: fully commented out server-side; UI route dead (`/changePassword` unimplemented) | [current = absent] | `CommonController.cs:341–397`, `Header.html:244` |
| BR-UM-14 | Link-based auto-login: URL `?id={LinkId}` auto-logs in without password; **proc confirmed: `GetLogin` resolves `HRMS.Token` by Authtoken → deletes the row (one-time) → matches `Profile.LinkId` to the token's ProfileId** (4 token rows live; 427 profiles carry LinkId) | [current] **DB-confirmed** | `discovery/procs/GetLogin.sql`; `discovery/aggregates2.csv` PROFILE_LINKID |
| BR-UM-15 | Successful/failed logins are logged: `AddUpdateSiteUserActivity`, `AddUpdateSiteUserLog`. **Data check: `SiteUserActivityLog` contains only LogTypeId=6 "Login" (33,508 rows)** — no logout/failed-attempt/password-change events | [current] **DB-confirmed (partial logging)** | `discovery/aggregates2.csv`; `discovery/procs/AddUpdateSiteUserActivityLog.sql` |
| BR-UM-16 | `RememberMe` checkbox UI exists but is non-functional (cookie code commented) | [current = absent] | `login.component.ts:49–54` |
| BR-UM-17 | Payroll menu access gated by password `ValidatePayrollUser` + `IsPasswordSet` flag (in-scope for UM model) | [current] | `fulllayout.component.ts:246–266` |

## UM — Roles, rights, menus (Module 1)

| ID | Rule | Register | Evidence |
|---|---|---|---|
| BR-UM-20 | Menu visibility is per **UserTypeId** (Executive=1, Manager=2, Admin=3, HR=4), not per user | [current] | `Constants.ts:194–199`; `menudetails.component.ts` |
| BR-UM-21 | Menu tree assignment: toggle children with parent; parents auto-toggled with children (`toggleChildByParentMenuRoleId` / `toggleParentByChildParentMenuRoleId`) | [current] | `menudetails.component.ts:200–232` |
| BR-UM-22 | Toolbar rights per menu row: `{MenuItemId, PageUrl, IsCreate:1, IsEdit:0, IsDelete:0}` TVP — current saves set IsCreate=1 only | [current] | `CommonManager.UpdateMenuUserTypeList` |
| BR-UM-23 | User receives menus via `GetSiteUserMenuItem` (role-wise), per-page tabs via `GetMenuItemList` | [current] | frontend + `ELCommonManager` |
| BR-UM-24 | Menu item identifiers are integers (Department=6, Site=7, MetaData=8, ShiftMaster=58, ConfigureWeeklyOff=41, Upload=52, …) — business data hardcoded in frontend Constants | [current] | `Constants.ts:93–138`; `master.component.ts:86–170` |
| BR-UM-25 | Site users list: filter `{UserTypeId csv, IsSiteAccess, Search, PageIndex, PageSize(+25 default), SortBy/SortOrder}` | [current] | `siteuser.component.ts:131–190` |
| BR-UM-26 | User list exposes Password field from backend proc — **DB-confirmed worse: `GetSiteUserDataList` decrypts passwords in SQL via CLR `DBO.decrypt` and ships plaintext to the client** | [current] **DB-confirmed** | `discovery/procs/GetSiteUserDataList.sql` |
| BR-UM-27 | User↔employee: `IsSiteAccess` on employee form governs whether site-user credentials are created (through `AddUpdateProfile`) | [current] | `profile.component.ts`, `AddUpdateProfile` params |
| BR-UM-28 | **No DB-level uniqueness on `SiteUser.UserName`** (no unique constraint; 510 rows / 507 distinct — 3 duplicate usernames). Uniqueness is only a proc-level check; races possible | [current] **DB-confirmed** | `discovery/constraints.csv`; `discovery/aggregates.csv` SITEUSER |
| BR-UM-29 | Users are typed only by `master.UserType` (1=Executive 468, 2=Manager 29, 3=System Admin 2, 4=HR Admin 11); `master.Role` (Admin/Manager/Employee/Admin-dup) is vestigial for menus | [current] **DB-confirmed** | `discovery/aggregates2.csv`; `discovery/config_tables_grouped.txt` |
| BR-UM-30 | Menu base assignment = `system.MenuUserType` per UserTypeId (with PageUrl override), **plus per-profile include/exclude overrides in `system.MenuSpecialUserAccess`**; save is a MERGE (`AddUpdateMenuUserType`); `GetMenuList`/`MenuRole` path broken (`@RoleId = @ProfileId` bug) | [current] **DB-confirmed** | `discovery/procs/GetSiteUserMenuItem.sql`, `AddUpdateMenuUserType.sql`, `GetMenuList.sql` |

## MD — Masters (Module 2)

| ID | Rule | Register | Evidence |
|---|---|---|---|
| BR-MD-01 | All simple masters (Department, Site/Branch, Role, Language, Parameter set) CRUD via generic metadata engine keyed by `MetaDataId` | [current] | `MasterSetup.cs`, `Constants.metaDataId` |
| BR-MD-02 | Master field definitions come from `system.MetaData/MetaDataDetail`: `{FieldName, DisplayName, DataType, IsMandatory/IsDisabled, ValidationText(regex), IsForiegnkey, OnParentSelect, DropDownList[]}` | [current] | `metadata.component.ts:143–273`, `MasterSetup.GetMetaData` |
| BR-MD-03 | Server returns field definitions incl. validation; **client enforces only `required`** (template validity + manual mandatory aggregation); server-side clusters: duplicate key → "Record Already Present in The List" | [current] | `metadata.component.ts:279–336`, `CommonController` translation |
| BR-MD-04 | Values are string-built into SQL: apostrophes escaped/stripped client-side only (`replace(/'/g," ")` in doc flows) — data-hygiene behavior exists | [current] | `mydocument.component.ts:1070–1075` |
| BR-MD-05 | Shift master: fields `{ShiftName, StartTime, EndTime, LateMinutes, HalfDayMinutes}`(+Alt times server-side); duplicate ShiftName check (case-insensitive) client-side; save via proc with MessageId out-param | [current] | `shiftmaster.component.ts:81–232`, `AddUpdateShiftMaster` |
| BR-MD-06 | Employee master is a metadata form (MetaDataId=5 "Basic Profile" + 6 "Work Employee", sections via `system.MetaDataConfig`: Basic/Employment/Personal/Bank/User Credentials/Other) with ~65 persisted attributes + dependants; save is atomic via single proc `AddUpdateProfile` (74 params, + DependantType TVP) | [current] **DB-confirmed** | `discovery/system_MetaData.csv`; `discovery/procs/AddUpdateProfile.sql` |
| BR-MD-07 | `PersonIDNumber` (Emirates-ID-like) must be ≥ 14 characters | [current] | `profile.component.ts:436–440` |
| BR-MD-08 | Permanent employee type ⇒ ContractType mandatory | [current] | `profile.component.ts:470–477` |
| BR-MD-09 | Employee photo: extensions `.jpg/.jpeg/.png`, max 10 MB (10,485,760 bytes) | [current] | `profile.component.ts:825–872` |
| BR-MD-10 | Photo stored as `Documents/UploadFiles/{GUID}.ext`; linked to profile via proc `AddUpdateProfilePhoto` | [current] | `CommonController.UploadDocs` |
| BR-MD-11 | Weekly-off assignment per employee/year: `WOFListId, WOFId, Year, PrevYear, ProfileId`; site-wide config allows SiteId csv | [current] | `profile.component.ts:1221–1330`, `holidayConfig` |
| BR-MD-12 | Holiday calendar: employment-year holidays assigned per profile (`HolidayId, HolidayListId, Date, PrevHolidayDate, Profileid`); holiday lists named per site list | [current] | `profile.component.ts` holiday section; `LeaveManager` |
| BR-MD-13 | Status/parameter lists are typed (ParameterTypeId): 2=status, 8=passport type, 14=employee type, 15=dependant relation, 18=date range | [current] | `Constants.ts:244–268` |
| BR-MD-14 | Employee list filter + export: `{userStatus csv, RoleId, DepartmentId csv, siteId, Search, PageIndex 25/50/100, SortBy EmpCode…}` | [current] | `profilelist.component.ts:166–618` |
| BR-MD-15 | Excel import restricts files to `.xls/.xlsx/.xlsm/.csv`; multi-step: upload → process (missing/error report) → status update → complete | [current] | `upload.component.ts:277–303` + DataInput procs |
| BR-MD-16 | **Field DataType catalog (system.Parameter, ParameterTypeId 6): 14=string, 15=password, 16=bit, 17=date, 19=byte, 20=int, 23=upload, 26=singleselect, 30=multiselect, 31=Text** — drives the whole master/document form engine | [current] **DB-confirmed** | `discovery/datatype_map.csv`; `discovery/system_parameters.csv` |
| BR-MD-17 | Department is M2M with Profile (`usr.ProfileDepartment` junction) but `AddUpdateProfile` treats `@DepartmentIds` as a **single value** — data model and write path disagree | [current] **DB-confirmed** | `discovery/columns_modules.csv`; `discovery/procs/AddUpdateProfile.sql` |
| BR-MD-18 | Weekly-off site assignment stores **CSV of SiteIds in `system.WeeklyOffList.SiteId varchar(200)`**; per-employee/year rows via WOFId/Year/PrevYear | [current] **DB-confirmed** | `discovery/columns_modules.csv` |
| BR-MD-19 | Duplicate-check messages confirmed in catalog: MsgId 6=Email exists, 7=EmployeeCode exists (profile), 10=holiday exists, 11/12=WOF-list/site-year exists, 28=shift exists; **no DB unique constraints back these checks** (UQ exists only on DepartmentName, DocumentName, LanguageName) | [current] **DB-confirmed** | `discovery/messageview.csv`; `discovery/constraints.csv` |
| BR-MD-20 | Profile status semantics: `Profile.StatusId` 4→`Parameter` ParameterValue 1 "Active" (472 profiles), 5→2 "Inactive" (380 of 852) | [current] **DB-confirmed** | `discovery/aggregates2.csv` PROFILE_STATUS |

## DOC — Documents (Module 3)

| ID | Rule | Register | Evidence |
|---|---|---|---|
| BR-DOC-01 | Employee documents modeled as metadata (MetaDataId=8 "Document") with per-type extra fields (`AdditinalDocumentValue`), not fixed columns | [current] | `MasterSetup.GetSelectSQLForDoc` |
| BR-DOC-02 | Core document fields: `DocumentTypeId, IssueDate, ExpiryDate, Remarks, IsActive, ProfileId, CompanyId, IsSelf, IdentityNo, DocumentTitle` — **DB-confirmed: `HRMS.Document.ExpiryDate` is 100% NULL on all 3,126 active rows (dead column); real expiry lives in `master.AdditinalDocumentValue` (DataTypeId 17 rows keyed by MetaDataDetailId: 28=Passport 939, 1150=EmiratesId 835, 1149=WorkPermit 755, 1154=Visa 555, 1153=Licence 40, 1151=HealthIns 1)** | [current] **DB-confirmed** | `discovery/aggregates2.csv`; `discovery/columns_modules.csv` |
| BR-DOC-03 | Issued date ≤ expiry; expiry computations server-side use `getutcdate() > Document.ExpiryDate`. **DB-confirmed: report views & scheduler re-derive expiry as `ISNULL(d.ExpiryDate, CONVERT(date, ad.Value, 103/104))` from the extra-value table** | [current] **DB-confirmed** | `discovery/view_visadoc.sql`; `discovery/procs/GetDocumentsListScheduler.sql` |
| BR-DOC-04 | Date inputs DD/MM/YYYY (jQuery datetimepicker; frontend moment parsing) | [current] | `mydocument.component.ts:1019–1037` |
| BR-DOC-05 | Upload files: ext `.jpg/.jpeg/.png/.pdf`, max 10 MB; at least one file must be attached ("No document attached.") | [current] | `mydocument.component.ts:1004–1013, 1262–1308` |
| BR-DOC-06 | Stored filenames: `{original[0..15]}{unixEpochTimesstamp}.{ext}` in flat `Documents\` folder; replace = delete-then-insert linkage | [current] | `MasterSetup.cs:582` |
| BR-DOC-07 | Download returns JSON `{url}` which is opened directly (zip built for selected docs) | [current] | `http.service.ts:308–310`, `ProfileManager.GenerateZipFile` |
| BR-DOC-08 | Documents emailed (HTML preview → send) to employee; SMTP config-driven; dev-redirect while `server != live` | [current] | `mydocument.component.ts:257–593`, `ELHelperManager.SendEmail` |
| BR-DOC-09 | Self-service "my documents" same flows but `ProfileId` = logged-in profile; admin flow allows any profile | [current] | `mydocument` vs `metadata/MetaDataDocument` components |
| BR-DOC-10 | Status filter default Active (`Constants.status.Active = 1`); list sort default `ExpiryDate`; archive screen for old docs | [current] | components |
| BR-DOC-11 | Expiry alerting: weekly job compiles 0/1-week/1-month/3-month expiry lists into Excel and emails HR (`ExpiredDocMail` configuration key), template `HRMSExpiredDocs` | [current] | `ProfileManager.cs:4889–5091`, `HRMS.Service` arg 3 |
| BR-DOC-12 | Document deletion removes metadata + file links via proc `DeleteDocument` — **DB-confirmed: deletes `AdditinalDocumentValue`/`FileDocMapping`/`Document` rows but leaves physical files orphaned on disk** | [current] **DB-confirmed** | `discovery/procs/DeleteDocument.sql` |
| BR-DOC-13 | Apostrophes stripped from all string field values before save | [current] | `mydocument.component.ts:1070–1075` |
| BR-DOC-14 | Reports: Expired (33) vs Expiring (32) document report endpoints via generic report engine `GetReportHeaders/GetReportList` with `metaDataId` | [current] | `export.component.ts:187–265`, `Constants.ts:160–171` |
| BR-DOC-15 | **`AddUpdateDocument` builds dynamic SQL with string concatenation executed via `sp_executesql`**; dates written to `AdditinalDocumentValue.Value` as `CONVERT(varchar, @d, 101)` after reading input as format 103 (dd/mm/yyyy) — stringly-typed storage + injection surface | [current] **DB-confirmed** | `discovery/procs/AddUpdateDocument.sql` |
| BR-DOC-16 | **`AddUpdateFileDoc` hardcodes `FileDocTypeId=1` ("Passport") on insert**; 9,656 of 11,063 FileDoc rows sit at type 1; real per-doc type only recoverable via `FileDocMapping→Document→DocumentTypeId` | [current] **DB-confirmed** | `discovery/procs/AddUpdateFileDoc.sql`; `discovery/aggregates.csv` FILEDOC |
| BR-DOC-17 | Document expiry alert windows (scheduler proc): expired = previous-month→yesterday, then +7 days, +1 month, +3 months; filtered to active employees (`StatusId=4`) | [current] **DB-confirmed** | `discovery/procs/GetDocumentsListScheduler.sql` |
| BR-DOC-18 | Reporting views (`dbo.VisaDocView`, `PassportDocView`, `WorkPermitDocView`) filter `IsActive=1 AND IsSelf=1` and match `MetaDataDetail.FieldName='ExpiryDate' AND DocumentTypeId=md.DocumentType AND DataTypeId=17` | [current] **DB-confirmed** | `discovery/view_visadoc.sql`; `discovery/view_passportdoc.sql` |

## Cross-cutting legacy behaviors

| ID | Rule | Register | Evidence |
|---|---|---|---|
| BR-X-01 | Every API payload/response pairs data with `Message` from `MessageView` table (MessageId codes) | [current] | controllers; `MessageView` LINQ |
| BR-X-02 | All HTTP requests POST (even reads); headers `AuthToken`, `TimeZone`; Content-Type JSON | [current] | `http.service.ts:94–132` |
| BR-X-03 | Timezone passed as header by client and presumably used for date calculations | [current] (proc usage unverified) | `http.service.ts` |
| BR-X-04 | paged Grid defaults: PageSize 25; options 25/50/100 | [current] | `http.service.ts:49`, `Constants.noOfRowsList` |
| BR-X-05 | All writes executed as stored procedures without client-managed transactions | [current] | SYSTEM_OVERVIEW §3 |
| BR-X-06 | **DB structure (live): 0 triggers, 200 procs (all `dbo`), 46 views, 5 schemas (`dbo` junk/`HRMS`/`master`/`system`/`usr`)**; all business logic lives in proc bodies + app code, none in DB constraints | [current] **DB-confirmed** | `discovery/triggers_views.csv`; `discovery/procedures.csv`; `discovery/tables_rows.csv` |
| BR-X-07 | Dangerous maintenance procs exist in production DB: `CleanupUser` (wipes all data keeping only ProfileId 126), `CleanupInActiveUser` (deletes inactive profiles + hardcoded FileDocIds 227–231) | [current] **DB-confirmed** | `discovery/procs/CleanupUser.sql`; `discovery/procs/CleanupInActiveUser.sql` |

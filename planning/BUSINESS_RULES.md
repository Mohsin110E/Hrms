# BUSINESS_RULES.md — Confirmed Business Rules (Phase-1 Modules)

Registers: **[current]** = confirmed existing behavior (evidence cited). **[proposed]** = target design suggestion. **[open]** = unresolved.
Rule IDs are stable and referenced by `TEST_STRATEGY.md`; new rules must get an ID and an evidence path.

## UM — Authentication & sessions (Module 1)

| ID | Rule | Register | Evidence |
|---|---|---|---|
| BR-UM-01 | Login requires `UserName` + `Password`; server DES-encrypts lowercase username & password and compares against stored encrypted values via proc `GetLogin` | [current] | `ELCommonManager.cs:19`, `ELHelperManager.Encrypt/Decrypt` |
| BR-UM-02 | Archived users (`StatusValue == 2`) cannot login | [current] (check in `GetLogin()` method; full logic in proc not yet inspected) | `CommonController.GetLogin` |
| BR-UM-03 | Locked users (`IsUserLocked` flag, driven by failed-attempt counter proc `AddUpdateSiteUserActivity`) cannot login | [current] detail threshold unknown | `CommonController.GetLogin`; EDMX `AddUpdateSiteUserActivity` |
| BR-UM-04 | On successful login a `Token` row is created with GUID `AuthToken`; **`ExpiresOn = IssuedOn` (never expires)**; `ValidateToken` only checks existence | [current] | `TokenService.cs` |
| BR-UM-05 | Login may reuse an existing AuthToken (proc may return existing token) | [current] | `GetLogin_Result` fields; proc body needed to confirm condition |
| BR-UM-06 | All requests require header `AuthToken`; whitelist: `/api/values`, `/api/common/getlogin` (only) | [current] | `Filter\ActionFilter.cs` |
| BR-UM-07 | Client-side sliding session timeout of 180 min (`setupTime`); on expiry clears localStorage and routes to login; server never enforces | [current] | `Constants.ts:4`, `http.service.ts:63–91` |
| BR-UM-08 | Logout deletes the Token row (`Kill`) | [current] | `TokenService.Kill`; `http.service.ts:150–161` |
| BR-UM-09 | Password change/reset: admin reset via `ResetPassword` (password+username DES-encrypted then reset for a `SiteUserId`) | [current] | `ProfileManager.cs:3911` → proc `ResetPassword` |
| BR-UM-10 | Password complexity regex exists client-side: `^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,15})$` (8–15, upper/lower/digit/special), but **not locally enforced in forms** | [current] (dead/latent) | `Constants.ts:26–27` |
| BR-UM-11 | Random password generator length 6, `System.Random` (non-crypto) — used for generated federated emails/resets | [current] | `ELHelperManager.GenerateRandomPassword` |
| BR-UM-12 | Forgot password: client sends `{EmailId, IPAddress}`; server flow commented out — **current behavior unclear** | [open] | `login.component.ts:148–201`, `CommonController.cs:615–681` |
| BR-UM-13 | Change password: fully commented out server-side; UI route dead (`/changePassword` unimplemented) | [current = absent] | `CommonController.cs:341–397`, `Header.html:244` |
| BR-UM-14 | Link-based auto-login: URL `?id={LinkId}` auto-logs in without password | [current] | `login.component.ts:38–42` |
| BR-UM-15 | Successful/failed logins are logged: `AddUpdateSiteUserActivity`, `AddUpdateSiteUserLog` | [current] | `GetLogin` controller flow |
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
| BR-UM-26 | User list exposes Password field from backend proc (legacy security defect) | [current] | proc `GetSiteUserDataList` result |
| BR-UM-27 | User↔employee: `IsSiteAccess` on employee form governs whether site-user credentials are created (through `AddUpdateProfile`) | [current] | `profile.component.ts`, `AddUpdateProfile` params |

## MD — Masters (Module 2)

| ID | Rule | Register | Evidence |
|---|---|---|---|
| BR-MD-01 | All simple masters (Department, Site/Branch, Role, Language, Parameter set) CRUD via generic metadata engine keyed by `MetaDataId` | [current] | `MasterSetup.cs`, `Constants.metaDataId` |
| BR-MD-02 | Master field definitions come from `system.MetaData/MetaDataDetail`: `{FieldName, DisplayName, DataType, IsMandatory/IsDisabled, ValidationText(regex), IsForiegnkey, OnParentSelect, DropDownList[]}` | [current] | `metadata.component.ts:143–273`, `MasterSetup.GetMetaData` |
| BR-MD-03 | Server returns field definitions incl. validation; **client enforces only `required`** (template validity + manual mandatory aggregation); server-side clusters: duplicate key → "Record Already Present in The List" | [current] | `metadata.component.ts:279–336`, `CommonController` translation |
| BR-MD-04 | Values are string-built into SQL: apostrophes escaped/stripped client-side only (`replace(/'/g," ")` in doc flows) — data-hygiene behavior exists | [current] | `mydocument.component.ts:1070–1075` |
| BR-MD-05 | Shift master: fields `{ShiftName, StartTime, EndTime, LateMinutes, HalfDayMinutes}`(+Alt times server-side); duplicate ShiftName check (case-insensitive) client-side; save via proc with MessageId out-param | [current] | `shiftmaster.component.ts:81–232`, `AddUpdateShiftMaster` |
| BR-MD-06 | Employee master is a metadata form (MetaDataId=1) with ~65 persisted attributes + dependants; save is atomic via single proc `AddUpdateProfile` (+ DependantType TVP) | [current] | `ProfileManager.cs:596/1530` |
| BR-MD-07 | `PersonIDNumber` (Emirates-ID-like) must be ≥ 14 characters | [current] | `profile.component.ts:436–440` |
| BR-MD-08 | Permanent employee type ⇒ ContractType mandatory | [current] | `profile.component.ts:470–477` |
| BR-MD-09 | Employee photo: extensions `.jpg/.jpeg/.png`, max 10 MB (10,485,760 bytes) | [current] | `profile.component.ts:825–872` |
| BR-MD-10 | Photo stored as `Documents/UploadFiles/{GUID}.ext`; linked to profile via proc `AddUpdateProfilePhoto` | [current] | `CommonController.UploadDocs` |
| BR-MD-11 | Weekly-off assignment per employee/year: `WOFListId, WOFId, Year, PrevYear, ProfileId`; site-wide config allows SiteId csv | [current] | `profile.component.ts:1221–1330`, `holidayConfig` |
| BR-MD-12 | Holiday calendar: employment-year holidays assigned per profile (`HolidayId, HolidayListId, Date, PrevHolidayDate, Profileid`); holiday lists named per site list | [current] | `profile.component.ts` holiday section; `LeaveManager` |
| BR-MD-13 | Status/parameter lists are typed (ParameterTypeId): 2=status, 8=passport type, 14=employee type, 15=dependant relation, 18=date range | [current] | `Constants.ts:244–268` |
| BR-MD-14 | Employee list filter + export: `{userStatus csv, RoleId, DepartmentId csv, siteId, Search, PageIndex 25/50/100, SortBy EmpCode…}` | [current] | `profilelist.component.ts:166–618` |
| BR-MD-15 | Excel import restricts files to `.xls/.xlsx/.xlsm/.csv`; multi-step: upload → process (missing/error report) → status update → complete | [current] | `upload.component.ts:277–303` + DataInput procs |

## DOC — Documents (Module 3)

| ID | Rule | Register | Evidence |
|---|---|---|---|
| BR-DOC-01 | Employee documents modeled as metadata (MetaDataId=8 "Document") with per-type extra fields (`AdditinalDocumentValue`), not fixed columns | [current] | `MasterSetup.GetSelectSQLForDoc` |
| BR-DOC-02 | Core document fields: `DocumentTypeId, DocumentNo, IssueDate, ExpiryDate` (+ per-type extras), files attached via FileDoc/FileDocMapping | [current] | `GetMetaDataForDoc`, `AddUpdateDocument` TVPs |
| BR-DOC-03 | Issued date ≤ expiry; expiry computations server-side use `getutcdate() > Document.ExpiryDate` | [current] | `MetaDataDocument.Component.ts:566–578`, `GetSelectSQLForDoc` |
| BR-DOC-04 | Date inputs DD/MM/YYYY (jQuery datetimepicker; frontend moment parsing) | [current] | `mydocument.component.ts:1019–1037` |
| BR-DOC-05 | Upload files: ext `.jpg/.jpeg/.png/.pdf`, max 10 MB; at least one file must be attached ("No document attached.") | [current] | `mydocument.component.ts:1004–1013, 1262–1308` |
| BR-DOC-06 | Stored filenames: `{original[0..15]}{unixEpochTimesstamp}.{ext}` in flat `Documents\` folder; replace = delete-then-insert linkage | [current] | `MasterSetup.cs:582` |
| BR-DOC-07 | Download returns JSON `{url}` which is opened directly (zip built for selected docs) | [current] | `http.service.ts:308–310`, `ProfileManager.GenerateZipFile` |
| BR-DOC-08 | Documents emailed (HTML preview → send) to employee; SMTP config-driven; dev-redirect while `server != live` | [current] | `mydocument.component.ts:257–593`, `ELHelperManager.SendEmail` |
| BR-DOC-09 | Self-service "my documents" same flows but `ProfileId` = logged-in profile; admin flow allows any profile | [current] | `mydocument` vs `metadata/MetaDataDocument` components |
| BR-DOC-10 | Status filter default Active (`Constants.status.Active = 1`); list sort default `ExpiryDate`; archive screen for old docs | [current] | components |
| BR-DOC-11 | Expiry alerting: weekly job compiles 0/1-week/1-month/3-month expiry lists into Excel and emails HR (`ExpiredDocMail` configuration key), template `HRMSExpiredDocs` | [current] | `ProfileManager.cs:4889–5091`, `HRMS.Service` arg 3 |
| BR-DOC-12 | Document deletion removes metadata + file links via proc `DeleteDocument` (physical file handling unknown — proc body needed) | [open detail] | `MasterSetup.DeleteDocument` |
| BR-DOC-13 | Apostrophes stripped from all string field values before save | [current] | `mydocument.component.ts:1070–1075` |
| BR-DOC-14 | Reports: Expired (33) vs Expiring (32) document report endpoints via generic report engine `GetReportHeaders/GetReportList` with `metaDataId` | [current] | `export.component.ts:187–265`, `Constants.ts:160–171` |

## Cross-cutting legacy behaviors

| ID | Rule | Register | Evidence |
|---|---|---|---|
| BR-X-01 | Every API payload/response pairs data with `Message` from `MessageView` table (MessageId codes) | [current] | controllers; `MessageView` LINQ |
| BR-X-02 | All HTTP requests POST (even reads); headers `AuthToken`, `TimeZone`; Content-Type JSON | [current] | `http.service.ts:94–132` |
| BR-X-03 | Timezone passed as header by client and presumably used for date calculations | [current] (proc usage unverified) | `http.service.ts` |
| BR-X-04 | paged Grid defaults: PageSize 25; options 25/50/100 | [current] | `http.service.ts:49`, `Constants.noOfRowsList` |
| BR-X-05 | All writes executed as stored procedures without client-managed transactions | [current] | SYSTEM_OVERVIEW §3 |

# MODULE_INVENTORY.md — Phase-1 Module Feature Inventory (Legacy System)

Evidence-keyed inventory of the **existing** system for Modules 1–3. Route/component names are legacy facts.
Status legend: ✔ = traced in source; ◐ = partially traced (needs DB evidence); ✖ = missing/dead in legacy.

## Module 1 — User Management

| Feature | Angular | API | Data layer | State |
|---|---|---|---|---|
| Login | `login.component.ts:72` → `POST api/Common/GetLogin` `{UserName, Password, LinkId?}` | `CommonController.GetLogin` | proc `GetLogin` (DES-encrypted username/password); may return *existing* `AuthToken` | ✔ proc body needed |
| Auto-login link | query `?id=` URI-decoded → `LinkId` passthrough | as above | same | ✔ |
| Logout | header menu → `POST api/Common/Logout` `{AuthToken}` (+ legacy `login/Logout {UserId}` in `sideMenu.component.ts`) | `CommonController.Logout` | `TokenService.Kill` deletes Token row | ✔ |
| Session timeout | client-only: localStorage `setupTime`, 180 min sliding (`Constants.ts:4`), reset on any request | — (no server enforce) | Token.ExpiresOn never set | ✔ (redesign needed) |
| Auth enforcement | header `AuthToken` on every call (`http.service.ts`) | `Filter\ActionFilter.cs` global filter; whitelist `/api/values`, `/api/common/getlogin` | proc? `ValidateToken` existence-only check | ✔ |
| Forgot password | modal `#forgetPopup` → `POST api/Common/ForgotPassword` `{EmailId, IPAddress}` | **endpoint commented out server-side** (CommonController 615–681) | old flow: proc `GetForgotPasswordDetails` + mail | ✖ server / ✔ client call (dead) |
| Reset password (admin) | `siteuser.component.ts:202–261`, `profile.component.ts:1166–1219` → `POST api/Profile/ResetPassword` `{SiteUserId, Password, UserType, UserName}` | `ProfileController.cs:1995` → `ProfileManager.cs:3911` | proc `ResetPassword`; password DES-encrypted in C# before call | ✔ |
| Change password | **no route/component** (`Header.html:244` links to dead `/changePassword`) | `Common/ChangePassword` commented out (341–397) | old flow proc `AddUpdatePassword` | ✖ both |
| Payroll password gate | `fulllayout.component.ts:246–266`, `dashboard` → `POST api/Profile/ValidatePayrollUser` `{Password}`; gated by `IsPasswordSet` | `ProfileController` | (out of payroll scope) | ✔ |
| Users list | `/siteuser` → `POST api/Profile/GEtSiteUserList` w/ filter `{UserTypeId csv, Search, PageIndex, PageSize, SortBy, SortOrder, IsSiteAccess, SiteId}` | `ProfileController` | proc `GetSiteUserDataList` (**returns Password field to client**) | ✔ security issue |
| Roles | `api/Profile/GetRoleList`; Role master via metadata engine (MetaDataId=2) | LINQ `Roles` + metadata engine | `Roles` table + metadata | ✔ |
| Rights/menus per user type | `/mastersetup` → `menudetails` component → `POST api/Common/GetMenuUserTypeList` / `UpdateMenuUserTypeList` `{UserTypeId, MenuUserTypeList}` | `CommonController.cs:717/1199` | procs `GetMenuUserTypeList`, `AddUpdateMenuUserType` (TVP `MenuItemType`: MenuItemId, PageUrl, IsCreate, IsEdit, IsDelete) | ✔ proc body needed |
| Menu visibility per user | `POST api/Common/GetRoleWiseMenuList` `{ProfileId, IsMainMenu, ProfileFunctionId?}` → `MenuList` cached to `localStorage.menuItems`; per-page tabs: `GetMenuItemList` | procs `GetSiteUserMenuItem`, `GetMenuItemList`, `GetMenuList` | menu tables in `master`/`system` schema | ◐ |
| In-UI role gating | `userDetails.UserTypeId` vs `Constants.userType {Executive:1, Manager:2, Admin:3, HR:4}` | — | — | ✔ |
| Menu → feature maps | hardcoded numeric menus in `Constants.ts:93–172` (e.g., Department=6, Site=7, ShiftMaster=58, configureWeeklyOff=41…) | — | — | ✔ frontend business data |
| Login activity/lockout | — | `AddUpdateSiteUserActivity` (failed-attempt counter + `IsUserLocked`) and `AddUpdateSiteUserLog` (Emqube EDMX) | procs | ◐ proc bodies needed |
| User↔employee mapping | `IsSiteAccess` field on employee form toggles credentials panel | `AddUpdatePersonalData` | inside proc `AddUpdateProfile` | ✔ |

Out-of-scope interplay: PushProfile to external PMS (`api/Profile/PushProfile` + proc `AddUpdateProfileLinkId`) — integration to flag in architecture.

## Module 2 — Setup / Master Data

The dominant pattern: a **metadata-driven generic master engine** (no dedicated per-master endpoints).

| Feature | Angular | API | Data layer | State |
|---|---|---|---|---|
| Master list | `metadata.component.ts` → `POST api/Common/GetMetaDataList` `{MetaDataId, SortBy, SortOrder, ParameterTypeId?}` | `CommonController` → `MasterSetup.GetMetaDataList` | reads `system.MetaData/MetaDataDetail`; builds dynamic SQL `SELECT col AS DisplayName FROM Table LEFT JOIN ...` | ◐ needs `system.MetaData` rows |
| Master form definition | `POST api/Common/GetMetaData` `{MetaDataId, PrimaryKey}` → field rows `{FieldName, DisplayName, FieldValue, DataType, IsDisabled(IsMandatory?), ValidationText, IsForiegnkey, OnParentSelect, DropDownList[], FileDocList…}` | `MasterSetup.GetMetaData` (MasterSetup.cs:233) | same metadata tables | ◐ |
| Master save | `AddUpdateMetaData` `{MetaDataId, Data, Data1}` | `MasterSetup.AddUpdateMetaData` (398) — builds INSERT/UPDATE strings incl. recursive second table; duplicate-key SQL error → message "Record Already Present in The List" | dynamic SQL | ◐ |
| Known masters (metadata ids) | Department=4, Site(=Branch)=3, Role=2, Language=1, Parameter=19 (ELHelperManager.MetaData enum; frontend both maps) | as above | as above | ✔ |
| Shift master | `/shiftmaster` → `api/Common/GetShiftMaster {ShiftId}` / `AddUpdateShiftMaster {ShiftName, StartTime, EndTime, LateMinutes, HalfDayMinutes, ShiftId?, CreatedBy}`; client duplicate-ShiftName check (case-insensitive) | `CommonController.cs:1293/1324` | procs `Get/AddUpdateShiftMaster` (MessageId out-param) | ✔ |
| Employee master list | `/profilelist` → `api/Profile/GetProfileList` `{userStatus csv, RoleId, DepartmentId csv, siteId, Search, paging, SortBy:"EmpCode"…}` | proc `GetProfileList` (paged via TotalRowCount out-param) | proc | ✔ |
| Employee detail form | metadata-driven `api/Profile/GetMetaDataForm {MetaDataId:1, PrimaryKey}`; field names incl. `IsSiteAccess, StatusId, SiteId, ReportingTo, EmployeeTypeId, ContractTypeId, PersonIDNumber, DateOfJoining` | `ProfileController` | metadata engine + procs | ◐ |
| Employee save | `api/Profile/AddUpdatePersonalData {LoggedInProfileId, MetaDataId:1, Data, Data1, Dependant[], IsNewUser}` | `ProfileManager.cs:596` (Exec `AddUpdateProfile` ~65 params + DependantType TVP; single proc = transaction) | proc `AddUpdateProfile` | ✔ |
| Employee dependants | sub-grid + metadata (ParameterTypeId 15 = relation) | as above `Data1`/Dependant TVP | `master.Dependants` table | ◐ |
| Employee photo | after save: XHR `api/Common/UploadDocs` FormData `file[], profileId, createdBy` | saves to `Documents/UploadFiles/{GUID}.ext`; proc `AddUpdateFileDoc` + `AddUpdateProfilePhoto` | FileDoc tables | ✔ |
| Filters/dropdowns | `GetDepartmentList`, `GetRoleList`, `GetParameterList {ParameterTypeId}` (2=status, 8=passport type, 14=employee type, 15=relation, 18=date range…), `GetSiteList` | LINQ | `Parameters`, `Sites`, `Departments` tables | ✔ |
| Weekly-off (employee) | tabs menu 88/89: `api/Leave/GetWeeklyOffList {Year:0, ProfileId}` → assign `AddUpdateWeeklyOffList {WeeklyOffListItem {WOFListId, WOFId, Year, PrevYear, ProfileId}}` | `LeaveController:210/277` → procs | `WeeklyOffConfig`, calendar tables | ✔ |
| Weekly-off (site config) | `holidayConfig.Component.ts` → `GetSiteList`, `AddUpdateWeeklyOffList {SiteId csv, WOFId, Year}` | same | same | ✔ |
| Holidays | `GetHolidayList`, `AddUpdateHoliday {HolidayId, HolidayListId, Date, PrevHolidayDate, Profileid}`, `AddUpdateHolidayList {HolidayListId, HolidayName}` | `LeaveController` → procs `Get/AddUpdateHoliday(List)` | `HolidayList`, `HolidayCalendar` | ✔ |
| Muster/roster | (out of scope; exists) `api/Muster/GetMusterList/AddUpdateMuster/SyncAttendanceDataFromSystem` | `MusterManager` | procs | noted |
| Excel import | `/upload` → `api/DataInput/*` pipeline; files `.xls/.xlsx/.xlsm/.csv` | `DataInputManager` | procs + temp tables | noted |

## Module 3 — Document Management

| Feature | Angular | API | Data layer | State |
|---|---|---|---|---|
| Admin doc screen | `/document` → `metadata/MetaDataDocument.Component.ts` | — | — | ✔ |
| My documents | `/mydocuments` → `mydocumnt/mydocument.component.ts` (self-service) | — | — | ✔ |
| Archive list | `/documentlist` → `archive/ArchiveDocumentlistComponent` | — | — | ✔ |
| List documents | `POST api/Profile/GetEmployeeDocumentList {ProfileId, Documenttype, DepartmentId, DateRangeId, RoleId, SiteId, StatusId, IsSelfStatus, SortBy:"ExpiryDate", SortOrder}` → rows `{DocumentId, DocumentName, DocumentTypeId, DocName, DocPath/FolderPath, Remarks}` | proc `GetEmployeeDocumentList` | `master.Document` + `FileDoc` | ✔ proc body needed |
| Grouped structured view | `POST api/Common/GetMasterSetupForDoc {MetaDataId:8, ProfileId, IsActive}` → JSON string w/ `documentTypeTable`, `FileTable`, per-type lists | `MasterSetup.GetSelectSQLForDoc` (MasterSetup.cs:823) — expiry computed in SQL via `getutcdate()` vs `ExpiryDate` | `master.Document`, `AdditinalDocumentValue`, `FileDoc`/`FileDocMapping` | ✔ |
| New/edit doc form | `POST api/Common/GetMetaDataForDoc {MetaDataId:8, Primarykey, DocumentType, DocumentNo}` → fields incl. `DocumentTypeId, DocumentNo, IssueDate, ExpiryDate` + upload field carrying `DocMetaDataId/PathField/IDField` | `MasterSetup.GetMetaData(...)` (992) | metadata + `AdditinalDocumentValue` | ✔ |
| Save document metadata | `POST api/Common/AddUpdateMetaDataDoc {MetaDataId, Data[], Primarykey, ProfileId}` → returns document Id | `MasterSetup.AddUpdateMetaDataDoc` (1228) → TVPs `InsertDocumentType`, `InsertExtraColumnType` → proc `AddUpdateDocument` | tables above | ✔ |
| Upload document files | XHR `POST api/Common/AddUpdateMetaDataFileList` FormData: `file[]`(repeated), `createdBy, profileId, metaDataId(=DocMetaDataId), filePath(=PathField), docId, fieldName(=IDField)` | `CommonController.cs:929`; files saved to `{ContentRoot}\Documents\{name[0..15]{epoch}.{ext}}`; delete-then-insert SQL | `master.FileDoc`, `FileDocMapping`, per-type file links | ✔ |
| Delete document | `POST api/Common/DeleteDocument {MetaDataId:<documentId>}` | `MasterSetup.DeleteDocument` (1327) → proc `DeleteDocument` | Document/FileDoc | ✔ |
| Download | `POST api/Profile/Download {ProfileId, DocPath}` → `{url}` → `window.open` | `ProfileManager.GenerateZipFile` (zip of files) | file system | ✔ |
| Preview | Google Docs viewer iframe (`common\popup.component.ts:63–119`) with public URL | — (static file URL) | — | ✔ security issue |
| Mail documents | `sentMail {ProfileId, loggedInProfileId, DocPath:[{ListName, Id, Remarks, FileList:…}]}` → preview `{EmailHtml, EmailSubject…}`; `sentMailFile` send | `ProfileManager.PreviewPDF`/`sendPDF` (1996/2040) | file system + SMTP | ✔ |
| Validation | `IssueDate ≤ ExpiryDate` (DD/MM/YYYY via moment); upload ext `.jpg/.jpeg/.png/.pdf`, max 10 MB; apostrophes stripped from values; "No document attached." | — | — | ✔ |
| Expiry tracking UI | default sort ExpiryDate; reports Expiring=33/Expired=32 Ids | procs `GetDocumentReport`, `Get/Expired/ExpiringDocumentReport`, `GetExpiredDocumentList`, `GetDocumentExpiry` | Document.ExpiryDate + IsActive | ✔ |
| Expiry alerts | weekly scheduled console job arg 3: `DocumentExpiredUsersScheduler` / `...1Month...` / `...3Month...` → GemBox Excel (tabs: "Expired Document", "Expiring in next 7 days", "Expiring in 1 Month", "Expiring in 3 month") → email `HRMSExpiredDocs` template to `ExpiredDocMail` | `ProfileManager.cs:4889/5008/5091`, procs `GetDocumentsListScheduler(+Expired/AboutToExpire variants)` | Document + Site/Email config | ✔ |
| Document types | `GET→POST api/Common/getDocumentType` | LINQ `DocumentTypes` table | DocumentType | ✔ |
| Document no. fields incl. passport/visa/Emirates ID/licence | handled per metadata definitions (backend data), only generic handling in frontend; `PersonIDNumber` (≥14 chars) validated for Emirates-ID-like field in profile form | procs `AddUpdateProfile` (writes passport/Emirates/MOL/visa numbers) | Document tables + Employee columns | ◐ |

## Notable shared dependencies

- `Message` response objects from `MessageView` (message codes via `MessageId`).
- `Token` table (Emqube side) — sessions.
- `Document`/`FileDoc` tables also referenced by profile photos (`UploadDocs` → `AddUpdateProfilePhoto`).
- Excel import (DataInput) creates employees/documents in bulk — feeds same procs.
- Email: templates stored in DB (`Templates`/`MessageViews` emqube) + `Config.xml` SMTP settings; **all emails redirected to dev mailboxes until `server` config = `live`**.

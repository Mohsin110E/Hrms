# SYSTEM_OVERVIEW.md — Legacy HRMS Architecture

All statements below are source-derived (**evidence** given as repo paths). Read-only inspection only.

## 1. Solution structure

`D:\.net\hrms` (`HRMS.API.sln`):

| Project | Purpose | Evidence |
|---|---|---|
| `src\HRMS.API` | REST API + static file host (xproj/project.json, ASP.NET Core 1.0-preview2 era, targets **net452**; also references ASP.NET MVC5/WebAPI 5.2.7 packages) | `src\HRMS.API\project.json`, `Startup.cs` |
| `src\HRMS.BLL` | Business layer (managers per domain: Common, ELCommon, Profile, Leave, Muster, DataInput, Report, Payroll) | `src\HRMS.BLL\*.cs` |
| `src\HRMS.DAL` | EF6 database-first model: `HRMSEntities.edmx` (+ T4 generated context) | `src\HRMS.DAL\HRMSEntities.edmx` |
| `src\HRMS.Entity` | Interface/Model classes | `src\HRMS.Entity` |
| `src\EmqubeLibrary` | Shared framework: second EDMX (`EmqubeEntites.edmx`), tokens, emails, metadata engine, helpers | `src\EmqubeLibrary` |
| `HRMS.Service` | Console scheduled jobs (args 1/2/3) | `HRMS.Service\Program.cs` |
| `HRMS.App` | Angular 7.1 SPA | `HRMS.App\package.json` |
| `src\ConsoleApp1` | Empty scratch scaffold | `src\ConsoleApp1\Program.cs` |

Key packages: EF **6.1.3**, BouncyCastle 1.8.9, ExcelDataReader 3.6.0, GemBox.Spreadsheet 47, NReco.PdfGenerator 1.1.12, RestSharp 106.6.10.

## 2. Runtime hosting & middleware

- `Startup.cs`: Kestrel/IIS (AspNetCoreModule via `web.config`), CORS `AllowAllOrigins` (any origin/method/header), App Insights telemetry, `UseStaticFiles` serving physical `Documents/` at `/Documents` (**no auth**), `app.UseMvc()`.
- Global action filter: `src\HRMS.API\Filter\ActionFilter.cs` — validates `AuthToken` header for all routes except whitelist (`/api/values`, `/api/common/getlogin`); writes unhandled exceptions to `ExceptionLog\ddMMyyyy.txt`; returns 200/400 inconsistently (missing header → 200 with error body).
- Controllers (thin): `CommonController`, `ProfileController`, `LeaveController`, `MusterController`, `PayrollController`, `ReportController`, `DataInputController`, `ValuesController`.

## 3. Data layer

- Two EF6 **database-first EDMX models**: `HRMSEntities` (HRMS domain) and `EmqubeEntites` (framework/common: Token, Menus, Messages, Templates, Configurations, MetaData system tables).
- **145 FunctionImport stored procedures** across the two models; most writes/executes are raw `Exec ProcName @param...` via `ExecuteSqlCommand` or mapped imports with `ObjectParameter` out-params. Schemas referenced in SQL: `master.*` (content tables), `system.*` (framework tables).
- **Metadata-driven master/document engine** in `src\EmqubeLibrary\BLL\MasterSetup.cs` reads definitions from `system.MetaData` / `system.MetaDataDetail` / `system.Parameter`, builds SELECT/INSERT/UPDATE **by string concatenation** (injection surface; no parameters) and runs them through `DataHelper` (plain ADO.NET via `appSettings ConnectionString`).
- LINQ-to-entities only for trivial lists (Roles, Sites, DocumentTypes, Parameters, Configurations, Tokens).
- No client-side transactions anywhere in `src` — atomicity is delegated to multi-statement stored procedures (TVPs are used, e.g. `MenuItemType`, `DependantType`, `InsertDocumentType`, `InsertExtraColumnType`).
- DB names visible in configs (values redacted; names only): active in configs = **`HRMSEmove_Sep3`**; catalog names: `HRMSEmove` (prod/live), `HRMSEmoveUAT` (UAT), `HRMSEmoveTest` / `HRMSEmoveLiveTest`, `HRMSEmqube` (older local). Connection strings contain plaintext credentials committed in-tree (redacted from all reports).

## 4. API surface (observed, module-relevant)

All calls POST; auth header `AuthToken`; responses wrap data in `Message` objects from `MessageView` table. (Pre-rename note: typos in routes are original — e.g. `GEtSiteUserList`.)

| Area | Endpoints (controller) | Data path |
|---|---|---|
| Auth | `api/Common/GetLogin`, `api/Common/Logout`, `api/Profile/ResetPassword` | procs `GetLogin`, `ResetPassword`; `TokenService` (Insert/Kill) |
| Menus | `api/Common/GetRoleWiseMenuList`, `GetMenuAccessList`, `GetMenuItemList`, `Get/UpdateMenuUserTypeList` | procs `GetSiteUserMenuItem`, `GetMenuAccessList`, `GetMenuItemList`, `GetMenuUserTypeList`, `AddUpdateMenuUserType` (TVP) |
| Users | `api/Profile/GEtSiteUserList` | proc `GetSiteUserDataList` (returns **Password** field to client) |
| Employee | `api/Profile/GetProfileList`, `GetDepartmentList`, `GetRoleList`, `GetReportingUserList`, `AddUpdatePersonalData`, `PushProfile`, `Download`, `GenerateZip`, `sentMail(File)` | procs `GetProfileList`, `AddUpdateProfile` (~65 params + Dependant TVP), `AddUpdateProfileLinkId`, `AddUpdateProfilePhoto` |
| Masters (generic) | `api/Common/GetMetaData(List)`, `AddUpdateMetaData` | `system.MetaData`-driven dynamic SQL (no procs) |
| Employee meta form | `api/Profile/GetMetaDataForm` | metadata engine (MetaDataId=1) |
| WeeklyOff/Holiday | `api/Leave/GetWeeklyOffList`, `AddUpdateWeeklyOffList`, `GetWeeklyOff(C)onfig`, `GetHoliday(List)`, `AddUpdateHoliday(List)` | procs `Get/AddUpdateWeeklyOffList`, `Get/AddUpdateHoliday(List)` |
| Shift | `api/Common/GetShiftMaster`, `AddUpdateShiftMaster` | procs `Get/AddUpdateShiftMaster` |
| Parameters | `api/Common/GetParameterList`, `GetConfigurationList` | LINQ (`Parameters`, `Configurations`) |
| Documents | `api/Common/GetMasterSetupForDoc`, `GetMetaDataForDoc`, `AddUpdateMetaDataDoc`, `AddUpdateMetaDataFileList`, `UploadDocs`, `DeleteDocument`, `getDocumentType`; `api/Profile/GetEmployeeDocumentList`, `GetDocumentExpiry`, `getExpiredDocumentsList` | metadata engine + procs `AddUpdateDocument`, `DeleteDocument`, `AddUpdateFileDoc`, `GetEmployeeDocumentList`, `GetDocumentExpiry`, `GetExpiredDocumentList` |
| Reports (doc) | `api/Report/GetReportHeaders`, `GetReportList` (metaDataId 32 expired / 33 expiring) | procs `GetDocumentReport`, `GetExpired/ExpiringDocumentReport` |
| Excel import | `api/DataInput/*` (upload, process, status) | `ExcelDataReader` + procs `GetDataInputFileUpload`, `AddUpdateUpload`, `ProcessDataInputData`, `ComplteDaInputProccess` |

## 5. Frontend architecture (summary — details in MODULE_INVENTORY.md)

Angular 7.1, single eager root module (~70 components), jQuery + Bootstrap modals by element id, **no guards/interceptors/lazy-loading**; auth by `AuthToken` header + localStorage `userDetail`; client-side 180-min sliding timeout; hardcoded menu-value & metadata-id maps in `Constants.ts`; base URL hardcoded `http://localhost:5000/`.

## 6. Background jobs & integrations

- `HRMS.Service\Program.cs` (console, arg-driven — operated via external scheduler, likely Task Scheduler):
  - `1` daily: `LeaveScheduler`, `AirfareScheduler`, `SendLeaveRequestListToAdmin` (leave module — out of phase-1 scope except for email/template reuse)
  - `2`: `SendPaySlip` (PDF via NReco + EmailLog)
  - `3` weekly: **document expiry** — `DocumentExpiredUsersScheduler`, `...1Month...`, `...3Month...` → GemBox Excel tabs + email to `Config.xml:ExpiredDocMail`, template `HRMSExpiredDocs`
  - Failure path mails hardcoded dev recipients; sleep 5s.
- Integrations: external **PMS API** (`Config.xml:pmsapi`, `PushProfile` → `Users/AddUpdateSiteUser`, stores LinkId), **e-movers attendance/leave sync** (`emoveapi` via procs `SyncEmoveData`, `SyncEmoveLeaveData`, `SyncPmsData`), SMTP Office365 email (test/live routing via `Config.xml` `server` key).

## 7. File storage

- Physical root `{API ContentRoot}\Documents\`:
  - employee documents: flat, `name[0..15]{unixEpoch}.{ext}` (`MasterSetup.cs` AddUpdateMetaDataFileList)
  - photos: `Documents\UploadFiles\{GUID}.ext`
  - payslips: `Documents\PaySlip\{profileId}\Payslip_*.pdf`
  - templates: `Documents\Templates\` (payslip HTML variants), `Documents\ExcelTemplate\`
- Served without authentication by static files middleware; document preview uses **Google Docs public viewer** (`popup.component.ts`) — requires publicly-reachable URL (current: intranet/localhost URLs; preview likely broken in prod — flagged).
- No per-user folders; no access control on directory; filename convention truncates original names.

## 8. Error handling & logging

- `ErrorLoging` class (`EmqubeLibrary\BLL\ErrorLogging.cs`): file-mode only used (`ErrorLogging\Error<dd-MMM-yy>.log`); DB/system-event modes are stubs.
- Per-try/catch in almost every controller method + global `OnException` → `ExceptionLog\ddMMyyyy.txt`.
- Repo contains committed exception logs 2019–2020 (documentary value only).
- `EmailLog` entity + `GetEmailLogs`/`AddUpdateEmailSend` procs for mail auditing.

## 9. Testing / CI/CD / docs (legacy)

- No automated tests (CLI boilerplate only in HRMS.App). No CI/CD; publish = FileSystem profiles (`hrms.pubxml` → `C:\Publish`; `HRMSApi.pubxml` → `D:\.net\build\EmoveHRMS\api`). No in-repo SQL scripts/bacpacs — schema knowledge exists only in EDMX files (proc bodies NOT in repo; requires DB access).

## 10. Significance for migration

1. **Strong DB coupling**: business logic lives in ~145 stored procs (source text not in repo) + metadata tables — DB discovery is the critical path.
2. Metadata engine is the deepest coupling point: master/document UI + validation are data-driven; migration must model `system.MetaData`-equivalent definitions in PostgreSQL.
3. Security redesign is mandatory (reversible passwords, non-expiring tokens, unauthenticated static files, AllowAll CORS, committed secrets).
4. Email templates + scheduled jobs must be reproduced or deferred consciously.

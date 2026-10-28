# DATABASE_DISCOVERY.md — Legacy DB Findings & SQL Server → PostgreSQL Mapping

## Status

⚠️ **Direct database inspection has NOT been performed yet** (no verified read-only UAT connection —
TASKS DB-01 blocked). Everything in this file derives from **repo-only evidence**: the two EDMX files,
generated contexts, and hardcoded table names in BLL code. Entity/column names below are as declared in
EDMX source; actual SQL Server schema (real table names — EF database-first maps via SSDL — indexes,
constraints, defaults, proc bodies) must be validated during DB-02..DB-05.

## 1. Databases (names only — credentials redacted)

| Name (from configs) | Role | Mention |
|---|---|---|
| `HRMSEmove_Sep3` | Active connection in all configs (likely dev/UAT copy) | `app.config` connection strings |
| `HRMSEmoveUAT` | UAT | commented alternate configs |
| `HRMSEmove` | Production/live | commented alternate configs |
| `HRMSEmoveTest` / `HRMSEmoveLiveTest` | Test copies | commented configs |
| `HRMSEmqube` | Older/internal DB | commented configs |

⚠ Legacy conventions prompt care: `HRMSEmove_Sep3` (currently referenced) is **not** necessarily UAT —
verify actual server/database before any inspection (AGENTS.md §2.2).

## 2. Two schema families (per EDMX evidence)

1. **HRMS domain** (`HRMSEntities.edmx`): business content.
2. **Emqube platform** (`EmqubeEntites.edmx`): framework tables (tokens, menus, messages, templates, configurations, meta system tables, parameters).

SQL referenced in code uses schemas `master.*` (content) and `system.*` (framework).

## 3. Known/likely tables (from EDMX entity sets + hardcoded SQL)

### Module 1 — identity & framework (Emqube mostly)
| Table (as referenced) | Known columns (from EDMX/result classes) | Source evidence |
|---|---|---|
| `Token` | TokenId, SiteUserId, AuthToken, IssuedOn, ExpiresOn | `EmqubeLibrary\Token.cs` |
| `Menu`, `MenuItem`, `MenuItemType`(-TVP), `MenuUserType` | MenuValue, MenuName, MenuParentValue, PageUrl, IsMainMenu; MenuItemType TWP {MenuItemId, PageUrl, IsCreate, IsEdit, IsDelete} | `CommonManager.cs`, `Constants.ts` |
| `UserType` | UserTypeId, Name | `Leave/GetUserType`, `Constants.userType` |
| `Roles` | RoleId, RoleName (+RoleLevel in login result) | `Role.cs`, Profile LINQ |
| `SiteUser` | SiteUserId, ProfileId, RoleId, UserName, Password, IsSiteAccess, IsUserLocked, Status | `GetSiteUserDataList` result fields |
| `SiteUserActivity / SiteUserLog` | failed attempts, lock flag, activity log | EDMX `AddUpdateSiteUserActivity(Log)` |
| `MessageView / Template` | MessageId, content | controllers' Message pattern |

### Module 2 — masters (HRMS domain + metadata)
| Table | Known columns | Evidence |
|---|---|---|
| `Department` | DepartmentId, DepartmentName (+ Site relation) | `HRMS.DAL\Department.cs`, `GetDepartmentList` |
| `Site` (=Branch) | SiteId, SiteName (+ config values) | `Site.cs`, `GetSiteList` |
| `Role` | as above | `Role.cs` |
| `ShiftMaster` | ShiftId, ShiftName, StartTime, EndTime, AltStartTime/EndTime, LateMinutes, HalfDayMinutes | `AddUpdateShiftMaster` call params |
| `WeeklyOffConfig` | WOFId, week days config | `WeeklyOffConfig.cs` |
| `WeeklyOffList` (per employee/year) | WOFListId, WOFId, Year, PrevYear, ProfileId | procs |
| `HolidayList` / `HolidayCalendar` | HolidayListId, HolidayName; HolidayId, Date, PrevHolidayDate, ProfileId | `HolidayList.cs`, `HolidayCalendar.cs` |
| `Employee` | EmployeeCode, EmployeeName(s), PersonIDNumber, links to Site/Department/Role, ReportingTo, EmployeeTypeId, ContractTypeId, Email/Contact, Image | `Employee.cs`, profile metadata fields |
| `Dependants` (master.Dependants) | DependantId, DependantProfileId, DependantRelationTypeId, EmployeeProfileId, Name | `DependantView` |
| `system.MetaData` / `system.MetaDataDetail` | MetaDataId, (table name), FieldName, DisplayName, DataType, IsMandatory, ValidationText, FK info, dropdown config | `MasterSetup.cs` SQL builder |
| `Parameter` (master/system) | ParameterTypeId grouping: 2=status, 8=passport type, 14=employee type, 15=relation, 18=date range | `Parameters.cs`, Constants |
| `Configuration / ConfigItemId` | config values | `Constants.Configuration`, `GetConfigurationList` |

### Module 3 — documents (master.*)
| Table | Known columns | Evidence |
|---|---|---|
| `Document` | DocumentId, ProfileId, DocumentTypeId, DocumentNo, IssueDate, ExpiryDate, IsActive, remarks | `GetSelectSQLForDoc` SQL, `GetDocumentExpiry` |
| `DocumentType` | DocumentTypeId, DocumentName | `DocumentType.cs` |
| `master.FileDoc` | FileDocId?, DocName, DocPath/FolderPath, FileDocTypeId | raw SQL in MasterSetup |
| `master.FileDocMapping` | mapping FileDoc ↔ owner rows (docId/fieldName contract) | `AddUpdateMetaDataFileList` |
| `master.AdditinalDocumentValue` | per-document extra column values | `GetMetaDataForDoc`, `InsertExtraColumnType` TVP |
| `master.Dependants` documents | dependant doc expiry (fields in dependants) | Module 3 note in MODULE_INVENTORY |
| `EmailLog` | email send audit | `EmailLog.cs`, `GetEmailLogs` |

## 4. Preliminary SQL Server → PostgreSQL type mapping

Draft mapping to be validated against real schema (DB-02). Prisma-native equivalents in parentheses.

| SQL Server | PostgreSQL | Notes |
|---|---|---|
| `int IDENTITY` | `integer GENERATED BY DEFAULT AS IDENTITY` (Prisma `@default(autoincrement())`) | preserve legacy IDs during migration; do not renumber |
| `bigint IDENTITY` | `bigint GENERATED ... AS IDENTITY` | |
| `nvarchar(n)` / `varchar(n)` | `varchar(n)` or `text` | prefer `text` + CHECKs where unconstrained; mind N (UTF-16) vs PG UTF-8; legacy is NVARCHAR (unicode) — PG default is utf8 |
| `char(n)` | `char(n)`/`text` | check trailing-space semantics (legacy ignores trailing spaces in `=` comparisons; PG `char(n)` pads — careful) |
| `bit` | `boolean` | EF maps bit→bool |
| `smalldatetime`/`datetime`/`datetime2` | `timestamp(3..7)` or `timestamptz` | legacy stores local-ish datetimes with client-passed `TimeZone` header — **decision needed (D-006 open)**: keep wall-clock semantics with `timestamp`, or normalize to UTC `timestamptz` |
| `date` | `date` | docs use date fields (IssueDate, ExpiryDate) |
| `money`/`decimal(p,s)` | `numeric(p,s)` | payroll columns (out of scope but flagged) |
| `float`/`real` | `double precision`/`real` | |
| `uniqueidentifier` | `uuid` | Token GUIDs |
| `varbinary(max)` | `bytea` (avoid; files stay on file/object store) | |
| `nvarchar(max)` | `text` | meta JSON strings (`JsonString` payloads) |
| `NVarChar TVP` | no direct equivalent | legacy TVP params (`MenuItemType`, `DependantType`, `InsertDocumentType`, `InsertExtraColumnType`) become JSONB body / arrays / batched inserts in Prisma |

## 5. Stored procedure conversion strategy (proposal, pending bodies)

- ~145 FunctionImports; phase-1 relevant list in TASKS DB-04. Approach [proposed]:
  1. Extract each CREATE PROCEDURE definition text via `OBJECT_DEFINITION()` (metadata-only).
  2. Classify: CRUD-wrapped → replaced by Prisma service logic; complex calculation → decompose into documented service functions + typed SQL; metadata-driven → re-modeled as definitions tables.
  3. Preserve out-param patterns (message codes) via service-level response envelopes; map `MessageId` codes to new error catalog (keep a rename mapping table).
- The `AddUpdate*` mega-procs (e.g., `AddUpdateProfile` ~65 params, `AddUpdateDocument` with TVPs) become transactional NestJS services (Prisma `$transaction`) — behavior parity table per param (pending proc bodies).

## 6. Migration to PostgreSQL — initial concerns (to validate with DB access)

- Collation/case sensitivity: legacy SS is case-insensitive by default; PG recommends `citext` or `lower(...)` unique functional indexes where the app relied on CI uniqueness (e.g., ShiftName duplicate check, UserName uniqueness).
- Identity seeds: record current identity high-water marks for all IDENTITY tables during cutover.
- Constraint & trigger discovery: FKs listed in EDMX SSDL, but triggers/jobs/indexes unknown until DB inspection.
- Verify: stored X/Y coordinates of `system.MetaData`-driven tables (dynamic SQL means some "tables" may not exist as expected; definitions may drive per-tenant columns).

## 7. Open items (all blocked on DB-01)

1. Actual table/index/FK/trigger definitions for everything above.
2. All phase-1 proc bodies (DB-04).
3. `system.MetaData`/`MetaDataDetail`/`Parameter` content extracts (DB-03) — these define the real master/document forms.
4. Row counts and null statistics (DB-06).
5. Confirm which DB is intended as discovery source (UAT vs HRMSEmove_Sep3 copy).

# API_SPECIFICATION.md — HRMS Modernization Phase-1 API Contract

**Status:** DRAFT for development. Covers the three Phase-1 modules: User Management, Setup/Master Data, Document Management.  
**Source of truth:** `BUSINESS_RULES.md` (BR-UM/MD/DOC), `DECISIONS.md` (D-007, D-010, D-011, D-013, D-014, D-015, D-017, D-018, D-019, D-020), `prisma/schema.prisma`.

---

## 1. Conventions

### 1.1 Base URL & versioning
- Base path: `/api/v1`
- All routes below are relative to this base.
- Version in URL; no `Accept` version negotiation.

### 1.2 HTTP verbs
| Verb | Use |
|---|---|
| `GET` | Reads, lists, searches |
| `POST` | Create, login, logout, actions (e.g. run scheduler) |
| `PATCH` | Partial update |
| `PUT` | Full replacement of a child collection (e.g. menu permissions) |
| `DELETE` | Soft-delete / deactivate where business requires history; hard-delete only for explicitly non-audited resources |

Legacy used `POST` for everything — target intentionally switches to REST verbs (D-011/D-020).

### 1.3 Authentication
- Access token: `Authorization: Bearer <jwt-access-token>`
- Refresh token: `X-Refresh-Token: <opaque-refresh-token>` header (httpOnly cookie preferred later, but header keeps local dev simple while OQ-11 is deferred).
- Public endpoints (no token required): `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /health`.
- All other endpoints require a valid access token.

### 1.4 Timezone
- Instants stored in UTC (`timestamptz`).
- Request/response date-time strings are ISO-8601 UTC.
- Local date boundaries and display conversion use `APP_TIMEZONE` from environment (D-018).

### 1.5 Response envelope
Every response body uses this shape:

```jsonc
{
  "data": { ... } | [ ... ] | null,
  "message": {
    "code": "OK",          // stable string code
    "text": "Data retrieved successfully"  // human text; may be legacy wording at cutover
  },
  "pagination": {          // present only for list endpoints
    "page": 1,
    "pageSize": 25,
    "totalPages": 5,
    "totalItems": 101
  }
}
```

### 1.6 Error model
HTTP status codes:
- `400` — validation error or bad request (body may include `errors` array)
- `401` — missing/invalid/expired access token
- `403` — authenticated but not authorized for this resource
- `404` — resource not found
- `409` — business conflict (duplicate, stale state)
- `422` — business rule violation
- `500` — unexpected server error

Error envelope:
```jsonc
{
  "data": null,
  "message": {
    "code": "EMAIL_EXISTS",
    "text": "EmailId already exists."
  },
  "errors": [
    { "field": "email", "message": "EmailId already exists." }
  ]
}
```

### 1.7 Message code mapping (D-010)
Legacy `MessageId` values are mapped to stable string codes. Examples:

| Legacy MsgId | Code | Text |
|---|---|---|
| 2 | `INVALID_CREDENTIALS` | Incorrect username and/or password. |
| 4 | `OK` | Data retrieved successfully |
| 5 | `UPDATED` | Data Updated Successfully |
| 6 | `EMAIL_EXISTS` | EmailId already exists |
| 7 | `EMPLOYEE_CODE_EXISTS` | Employee code already exists. |
| 10 | `HOLIDAY_EXISTS` | Holiday Detail Already Exist |
| 11 | `WEEKLY_OFF_EXISTS` | WOF List Already Exist |
| 12 | `SITE_YEAR_EXISTS` | Site Already Exist for this year |
| 19 | `FILE_UPLOADED` | File upload successfully |
| 28 | `SHIFT_EXISTS` | Shift name already exists |

New codes can be added; legacy numeric IDs are not returned to clients.

### 1.8 Pagination, search, sorting
List endpoints accept:
- `page` (default 1)
- `pageSize` (default 25, allowed 25/50/100)
- `search` (free text; semantics per endpoint)
- `sortBy` (camelCase field name)
- `sortOrder` (`asc` | `desc`)
- Filter params are endpoint-specific query strings (e.g. `statusId`, `departmentId`).

### 1.9 Idempotency & safety
- State-changing endpoints are logged to `AuditLog`.
- File uploads: multipart/form-data; max size enforced server-side (photos 10 MB, documents 10 MB).
- PII list views return masked values; full values only in detail endpoints for authorized roles (D-015).

---

## 2. Module 1 — User Management

### 2.1 Authentication

#### POST `/auth/login`
Request:
```json
{
  "username": "admin",
  "password": "CurrentPass1!"
}
```
Response:
```jsonc
{
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "opaque-refresh-token",
    "expiresIn": 900,
    "mustChangePassword": false,
    "user": { "id": 1, "username": "admin", "userTypeId": 3, "profileId": 126 }
  },
  "message": { "code": "OK", "text": "Login successful" }
}
```
Notes:
- If `mustChangePassword` is `true`, the client must redirect to the change-password screen before using other endpoints (D-014).
- Lockout is enforced after 5 failed attempts (BR-UM-03).

#### POST `/auth/logout`
Revokes the refresh token. Access token may remain valid until expiry.

#### POST `/auth/refresh`
Request header: `X-Refresh-Token: <token>`  
Response: new access token + rotated refresh token.

#### POST `/auth/forgot-password`
Request: `{ "email": "user@example.com" }`  
Response: `OK` regardless of whether the email exists (prevents enumeration).

#### POST `/auth/reset-password`
Request:
```json
{
  "token": " emailed-one-time-token ",
  "newPassword": "NewPass1!"
}
```

#### POST `/auth/change-password`
Authenticated. Request:
```json
{
  "currentPassword": "OldPass1!",
  "newPassword": "NewPass1!"
}
```

#### GET `/auth/me`
Returns current user + profile summary.

### 2.2 Site Users

| Method | Path | Description |
|---|---|---|
| GET | `/users` | List site users (admin/HR) |
| POST | `/users` | Create site user |
| GET | `/users/:id` | Get site user details |
| PATCH | `/users/:id` | Update site user (user type, active flag) |
| DELETE | `/users/:id` | Deactivate site user |
| POST | `/users/:id/reset-password` | Admin reset password (D-013) |

List params: `userTypeId`, `isActive`, `search`, `page`, `pageSize`, `sortBy`, `sortOrder`.

Notes:
- Passwords are **never returned** in list/detail (D-020 fixes legacy password disclosure).
- `username` is unique and case-insensitive (D-016).

### 2.3 RBAC / Menus

| Method | Path | Description |
|---|---|---|
| GET | `/rbac/user-types` | List user types |
| GET | `/rbac/roles` | List roles |
| GET | `/rbac/menu-items` | Flat list of menu items |
| GET | `/rbac/menu-items/tree` | Menu tree |
| GET | `/rbac/menu-permissions/:userTypeId` | Base rights for a user type |
| PUT | `/rbac/menu-permissions/:userTypeId` | Replace base rights (MERGE semantics) |
| GET | `/rbac/menu-overrides/:userId` | Per-user include/exclude overrides |
| PUT | `/rbac/menu-overrides/:userId` | Replace overrides |
| GET | `/rbac/my-menu` | Current user's effective menu tree |

Menu permission item:
```json
{
  "menuItemId": 6,
  "pageUrlOverride": null,
  "isCreate": true,
  "isEdit": true,
  "isDelete": false
}
```

Override item:
```json
{
  "menuItemId": 6,
  "isInclude": true,
  "pageUrlOverride": null
}
```

---

## 3. Module 2 — Setup / Master Data

### 3.1 Standard masters
For each of **Department, Site, Language, Role, UserType, Shift, DocumentType**:

| Method | Path | Description |
|---|---|---|
| GET | `/masters/departments` | List |
| POST | `/masters/departments` | Create |
| GET | `/masters/departments/:id` | Get |
| PATCH | `/masters/departments/:id` | Update |
| DELETE | `/masters/departments/:id` | Deactivate |

Similar patterns for `/masters/sites`, `/masters/languages`, `/masters/roles`, `/masters/user-types`, `/masters/shifts`, `/masters/document-types`.

Notes:
- Names are unique where legacy enforced it (Department, Language, DocumentType, Role after D-016 dedup).
- DocumentType IDs are preserved (1, 2, 3, 4, 5, 6, 106–110).

### 3.2 Parameter catalog
| Method | Path | Description |
|---|---|---|
| GET | `/masters/parameters` | List parameters; filter by `parameterTypeId` or `typeCode` |
| GET | `/masters/parameter-types` | List parameter types |

### 3.3 Metadata definitions (D-003)
| Method | Path | Description |
|---|---|---|
| GET | `/masters/form-definitions` | List form entities |
| GET | `/masters/form-definitions/:key` | Get one entity |
| GET | `/masters/form-definitions/:key/fields` | List fields |
| POST | `/masters/form-definitions/:key/fields` | Add field |
| PATCH | `/masters/form-definitions/:key/fields/:fieldId` | Update field |
| DELETE | `/masters/form-definitions/:key/fields/:fieldId` | Deactivate field |

### 3.4 Weekly-off & Holidays

| Method | Path | Description |
|---|---|---|
| GET/POST | `/masters/weekly-off-configs` | Weekly-off pattern per site/year |
| GET/PATCH/DELETE | `/masters/weekly-off-configs/:id` | |
| GET/POST | `/masters/weekly-off-assignments` | Per-employee/year assignment |
| GET/PATCH/DELETE | `/masters/weekly-off-assignments/:id` | |
| GET/POST | `/masters/holiday-lists` | Named holiday lists |
| GET/PATCH/DELETE | `/masters/holiday-lists/:id` | |
| GET/POST | `/masters/holiday-calendar-entries` | Per-profile holiday assignments |
| GET/PATCH/DELETE | `/masters/holiday-calendar-entries/:id` | |

### 3.5 Employees

| Method | Path | Description |
|---|---|---|
| GET | `/employees` | List employees |
| POST | `/employees` | Create employee + profile + site user if `isSiteAccess` |
| GET | `/employees/:id` | Get employee detail |
| PATCH | `/employees/:id` | Update employee/profile |
| DELETE | `/employees/:id` | Deactivate |
| GET | `/employees/:id/documents` | Employee's documents |
| GET | `/employees/:id/dependants` | Employee's dependants |
| POST | `/employees/:id/dependants` | Add dependant |
| GET | `/employees/:id/dependants/:dependantId` | |
| PATCH | `/employees/:id/dependants/:dependantId` | |
| DELETE | `/employees/:id/dependants/:dependantId` | |

Notes:
- `employeeCode` is unique (D-016).
- `PersonIDNumber` minimum length 14 (BR-MD-07).
- PII identity numbers encrypted at rest; detail endpoints return full values only for authorized roles (D-015).
- Profile photo upload handled via `POST /employees/:id/photo` returning a `StoredFile` reference.

---

## 4. Module 3 — Document Management

### 4.1 Admin / HR documents

| Method | Path | Description |
|---|---|---|
| GET | `/documents` | List documents; filter by `profileId`, `documentTypeId`, `isActive`, `expiringWithinDays`, `search` |
| POST | `/documents` | Create document + upload files |
| GET | `/documents/:id` | Document detail |
| PATCH | `/documents/:id` | Update document metadata |
| DELETE | `/documents/:id` | Deactivate document |
| POST | `/documents/:id/files` | Attach file(s) |
| GET | `/documents/:id/files/:fileId/download` | Authorized download stream |
| DELETE | `/documents/:id/files/:fileId` | Mark file as non-current |
| GET | `/documents/expiring` | Documents expiring soon |
| GET | `/documents/expired` | Already expired documents |
| GET | `/documents/reports/expiring` | Expiring report (Excel export) |
| GET | `/documents/reports/expired` | Expired report (Excel export) |
| POST | `/documents/scheduler/run` | Admin manual run of expiry alert job |

### 4.2 My documents (self-service)

| Method | Path | Description |
|---|---|---|
| GET | `/my/documents` | Current user's documents |
| POST | `/my/documents` | Upload own document |
| GET | `/my/documents/:id` | |
| PATCH | `/my/documents/:id` | |
| DELETE | `/my/documents/:id` | |
| GET | `/my/documents/:id/files/:fileId/download` | |

### 4.3 Document create/update body
```json
{
  "profileId": 126,
  "documentTypeId": 1,
  "issueDate": "2023-01-15",
  "expiryDate": "2028-01-15",
  "identityNo": "encrypted-or-plain-depending-on-type",
  "documentTitle": "Passport",
  "remarks": "",
  "isSelf": true,
  "isActive": true,
  "fieldValues": [
    { "fieldId": 28, "value": "2028-01-15" }
  ]
}
```
Notes:
- `expiryDate` is first-class; legacy `AdditinalDocumentValue` date strings are converted during ETL.
- Files are uploaded separately via multipart after document creation, or in the same multipart request if the client prefers.
- Physical files are stored in the private folder configured by `DOCUMENT_STORAGE_PATH` (D-017).

### 4.4 Expiry scheduler
- Weekly cron sends alert emails for windows: expired (prev-month→yesterday), +7 days, +1 month, +3 months (BR-DOC-17).
- `POST /documents/scheduler/run` allows admins to trigger manually.
- Each sent alert is recorded in `ExpiryAlertLog` for deduplication.

---

## 5. Cross-cutting endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness |
| GET | `/ready` | Readiness (DB connectivity) |
| GET | `/messages` | Message catalog (for frontend localization) |
| GET | `/system-configurations` | Config list |

---

## 6. Implementation notes

- All endpoints are implemented inside bounded NestJS modules (`auth`, `users`, `rbac`, `masters`, `employees`, `documents`) sharing a single `PrismaService`.
- Guards enforce authentication and authorization; RBAC checks use the effective menu/permission model.
- `AuditLog` writes are fire-and-forget via a service call inside request handlers.
- File endpoints stream from private storage; no public static URLs (D-008/D-017).
- Password flows use bcrypt/argon2; legacy DES verification lives only in the temporary login fallback path (D-014).

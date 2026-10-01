# GRAMAI — REST API Specification Document

> **API Standard**: RESTful JSON API  
> **Base Path**: `/api/v1`  
> **Authentication**: HTTP Header `Authorization: Bearer <JWT_TOKEN>`  
> **OpenAPI UI**: Available at `/swagger-ui.html` during local execution  

---

## 1. Global API Standards & Envelope Models

### 1.1 Standard Success Response Envelope
All non-paginated API responses return a uniform JSON wrapper:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2026-09-14T23:00:00Z"
}
```

### 1.2 Standard Paginated Response Envelope
Endpoints supporting pagination accept query parameters `page` (0-indexed, default `0`), `size` (default `20`), and `sort` (default `createdAt,desc`):

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "content": [ ... ],
    "page": 0,
    "size": 20,
    "totalElements": 142,
    "totalPages": 8,
    "last": false
  },
  "timestamp": "2026-09-14T23:00:00Z"
}
```

### 1.3 Standard Error Response Envelope
Global exceptions produce predictable HTTP status codes and detailed error descriptors:

```json
{
  "success": false,
  "errorCode": "VALIDATION_FAILED",
  "message": "Input validation failed for 2 fields",
  "errors": [
    { "field": "mobile", "message": "Mobile number must be exactly 10 digits" },
    { "field": "amount", "message": "Amount must be a positive number" }
  ],
  "timestamp": "2026-09-14T23:00:00Z"
}
```

---

## 2. API Endpoint Catalog

### 2.1 Authentication Module (`/api/v1/auth`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Authenticate user credentials & receive JWT token | Public |
| `GET` | `/api/v1/auth/me` | Fetch current logged-in user profile & role capabilities | Authenticated (`Bearer <token>`) |

#### POST `/api/v1/auth/login` Request Body:
```json
{
  "email": "secretary@gramai.in",
  "password": "Secretary@123"
}
```

#### POST `/api/v1/auth/login` Response Body (`200 OK`):
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "type": "Bearer",
  "user": {
    "id": 2,
    "fullName": "Rameshwar Sharma (Sachiv)",
    "email": "secretary@gramai.in",
    "mobile": "9876543211",
    "role": "SECRETARY",
    "panchayatId": 1,
    "active": true
  }
}
```

#### GET `/api/v1/auth/me` Response Body (`200 OK`):
```json
{
  "id": 2,
  "fullName": "Rameshwar Sharma (Sachiv)",
  "email": "secretary@gramai.in",
  "mobile": "9876543211",
  "role": "SECRETARY",
  "panchayatId": 1,
  "active": true
}
```

### 2.2 Security & RBAC Test Endpoints (`/api/v1/test`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/test/admin` | Verify ADMIN role authorization | `ROLE_ADMIN` |
| `GET` | `/api/v1/test/secretary` | Verify SECRETARY role authorization | `ROLE_SECRETARY` |
| `GET` | `/api/v1/test/citizen` | Verify CITIZEN role authorization | `ROLE_CITIZEN` |

---

### 2.2 Panchayat Management Module (`/api/v1/panchayats`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/panchayats` | Create a new Gram Panchayat administrative unit | `ADMIN` |
| `GET` | `/api/v1/panchayats` | List Panchayats (paginated & searchable) | `ADMIN` (all), Non-Admin (scoped to own) |
| `GET` | `/api/v1/panchayats/{id}` | Get Panchayat by ID (tenant-isolated) | `ADMIN`, Assigned Staff / Citizens |
| `PUT` | `/api/v1/panchayats/{id}` | Update Panchayat details | `ADMIN` |
| `DELETE` | `/api/v1/panchayats/{id}` | Safely deactivate Panchayat (soft delete) | `ADMIN` |

#### POST `/api/v1/panchayats` Request Body:
```json
{
  "name": "Rampur Gram Panchayat",
  "code": "RAMPUR01",
  "district": "Sehore",
  "block": "Ichhawar",
  "state": "Madhya Pradesh"
}
```

#### POST `/api/v1/panchayats` Response Body (`201 Created`):
```json
{
  "id": 1,
  "name": "Rampur Gram Panchayat",
  "code": "RAMPUR01",
  "district": "Sehore",
  "block": "Ichhawar",
  "state": "Madhya Pradesh",
  "active": true,
  "createdAt": "2026-09-24T00:00:00Z",
  "updatedAt": "2026-09-24T00:00:00Z"
}
```

---

### 2.3 User Management Module (`/api/v1/users`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/users` | Create user account with temporary password | `ADMIN`, `SECRETARY` (Panchayat-scoped) |
| `GET` | `/api/v1/users` | List users (paginated, searchable, tenant-isolated) | `ADMIN`, `SECRETARY` |
| `GET` | `/api/v1/users/{id}` | Get user by ID (tenant-isolated) | `ADMIN`, Staff in same Panchayat, Self |
| `PUT` | `/api/v1/users/{id}` | Update user details (role escalation prevented) | `ADMIN`, Staff in same Panchayat |
| `PATCH`| `/api/v1/users/{id}/status` | Activate or deactivate user account | `ADMIN`, `SECRETARY` (same Panchayat) |

#### POST `/api/v1/users` Request Body:
```json
{
  "fullName": "Sunil Verma",
  "email": "sunil.grs@gramai.in",
  "mobile": "9876543213",
  "password": "TempPassword@123",
  "role": "GRS",
  "panchayatId": 1
}
```

#### POST `/api/v1/users` Response Body (`201 Created`):
> **Security Guarantee**: `passwordHash` is NEVER returned.
```json
{
  "id": 4,
  "fullName": "Sunil Verma",
  "email": "sunil.grs@gramai.in",
  "mobile": "9876543213",
  "role": "GRS",
  "panchayatId": 1,
  "panchayatName": "Rampur Gram Panchayat",
  "active": true,
  "createdAt": "2026-09-24T00:00:00Z",
  "updatedAt": "2026-09-24T00:00:00Z"
}
```

#### PATCH `/api/v1/users/{id}/status` Request Body:
```json
{
  "active": false
}
```

---

### 2.3 Citizen Registry Module (`/api/v1/citizens`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/citizens` | Register a new citizen in the Panchayat directory | `ADMIN`, `SECRETARY` (scoped to own GP) |
| `GET` | `/api/v1/citizens` | List citizens (paginated, searchable, filtered, multi-tenant scoped) | `ADMIN` (all/filtered), `SECRETARY`, `SARPANCH`, `GRS`, `PANCH` (own GP) |
| `GET` | `/api/v1/citizens/{id}` | Get citizen profile by ID (tenant-isolated) | `ADMIN`, Staff in same Panchayat (`CITIZEN` rejected) |
| `PUT` | `/api/v1/citizens/{id}` | Update citizen demographic and contact details | `ADMIN`, `SECRETARY` (same Panchayat) |
| `PATCH`| `/api/v1/citizens/{id}/status` | Soft deactivate or archive a citizen (`ACTIVE` / `INACTIVE`) | `ADMIN`, `SECRETARY` (same Panchayat) |

> **Panchayat Isolation Enforcement**:
> - Non-ADMIN users requesting `/api/v1/citizens/{otherPanchayatCitizenId}` receive `403 Forbidden`.
> - Non-ADMIN users passing `?panchayatId={otherId}` query parameters receive `403 Forbidden`.
> - Non-ADMIN users cannot reassign or create citizens for a different Panchayat.
> - Role `CITIZEN` is rejected from viewing the citizen registry (`403 Forbidden`) to protect community privacy.
> - Whitelisted sort fields: `id`, `fullName`, `village`, `wardNumber`, `status`, `createdAt`, `updatedAt`. Default: `createdAt,desc`.

#### POST `/api/v1/citizens` Request Body:
```json
{
  "fullName": "कमला बाई (Kamla Bai)",
  "mobile": "9876543210",
  "village": "हर्राभाट (Harrabhat)",
  "wardNumber": 3,
  "address": "पटेल मोहल्ला, वार्ड ३",
  "panchayatId": 1
}
```

#### POST `/api/v1/citizens` Response Body (`201 Created`):
```json
{
  "id": 1,
  "panchayatId": 1,
  "panchayatName": "Rampur Gram Panchayat",
  "fullName": "कमला बाई (Kamla Bai)",
  "mobile": "9876543210",
  "village": "हर्राभाट (Harrabhat)",
  "wardNumber": 3,
  "address": "पटेल मोहल्ला, वार्ड ३",
  "status": "ACTIVE",
  "createdAt": "2026-09-25T18:00:00Z",
  "updatedAt": "2026-09-25T18:00:00Z"
}
```

#### GET `/api/v1/citizens?search=Harrabhat&village=Harrabhat&wardNumber=3&status=ACTIVE&page=0&size=20&sort=fullName,asc` Response Body (`200 OK`):
```json
{
  "content": [
    {
      "id": 1,
      "panchayatId": 1,
      "panchayatName": "Rampur Gram Panchayat",
      "fullName": "कमला बाई (Kamla Bai)",
      "mobile": "9876543210",
      "village": "हर्राभाट (Harrabhat)",
      "wardNumber": 3,
      "address": "पटेल मोहल्ला, वार्ड ३",
      "status": "ACTIVE",
      "createdAt": "2026-09-25T18:00:00Z",
      "updatedAt": "2026-09-25T18:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1,
  "last": true
}
```

#### GET `/api/v1/citizens/{id}` Response Body (`200 OK`):
```json
{
  "id": 1,
  "panchayatId": 1,
  "panchayatName": "Rampur Gram Panchayat",
  "fullName": "Example Citizen",
  "mobile": "9876543210",
  "village": "Harrabhat",
  "wardNumber": 3,
  "address": "Example Address",
  "status": "ACTIVE",
  "createdAt": "2026-09-25T18:00:00Z",
  "updatedAt": "2026-09-25T18:00:00Z"
}
```

#### PUT `/api/v1/citizens/{id}` Request Body:
```json
{
  "fullName": "Updated Citizen Name",
  "mobile": "9876543210",
  "village": "Harrabhat",
  "wardNumber": 3,
  "address": "Updated Address"
}
```

#### PATCH `/api/v1/citizens/{id}/status` Request Body:
```json
{
  "status": "INACTIVE"
}
```

---

### 2.4 Complaint Management Module (`/api/v1/complaints`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/complaints` | Paginated search & multi-filter complaints list | `ADMIN`, `SECRETARY`, `SARPANCH`, `GRS`, `PANCH`, `CITIZEN` |
| `GET` | `/api/v1/complaints/summary` | Aggregated counts by status, category, and priority | `ADMIN`, `SECRETARY`, `SARPANCH`, `GRS`, `PANCH` |
| `GET` | `/api/v1/complaints/{id}` | Detailed complaint profile with citizen & assignee | `ADMIN`, `SECRETARY`, `SARPANCH`, `GRS`, `PANCH`, `CITIZEN` (Own only) |
| `GET` | `/api/v1/complaints/{id}/history`| Activity timeline & event history | `ADMIN`, `SECRETARY`, `SARPANCH`, `GRS`, `PANCH`, `CITIZEN` (Own only) |
| `POST` | `/api/v1/complaints` | Register a new grievance (server derives number & GP) | `ADMIN`, `SECRETARY`, `GRS`, `CITIZEN` |
| `PUT` | `/api/v1/complaints/{id}` | Update title, description, category, or priority | `ADMIN`, `SECRETARY` |
| `PATCH`| `/api/v1/complaints/{id}/status` | Controlled state machine transition | `ADMIN`, `SECRETARY`, `GRS` |
| `PATCH`| `/api/v1/complaints/{id}/assign` | Assign/reassign complaint to authorized staff | `ADMIN`, `SECRETARY` |
| `PATCH`| `/api/v1/complaints/{id}/resolve`| Record resolution narrative and mark RESOLVED | `ADMIN`, `SECRETARY`, `GRS` |
| `PATCH`| `/api/v1/complaints/{id}/close` | Formally close a resolved complaint | `ADMIN`, `SECRETARY` |

#### Controlled State Machine Transitions:
- `OPEN` → `IN_PROGRESS` or `REJECTED`
- `IN_PROGRESS` → `WAITING` or `RESOLVED`
- `WAITING` → `IN_PROGRESS` or `RESOLVED`
- `RESOLVED` → `CLOSED` or `IN_PROGRESS` (reopened)
- `CLOSED` → Terminal (cannot transition)
- `REJECTED` → Terminal (cannot transition)

#### POST `/api/v1/complaints` Request Body:
```json
{
  "citizenId": 1,
  "category": "WATER",
  "title": "Water supply pipeline leakage",
  "description": "Main supply line broken near Ward 3 water tank.",
  "priority": "HIGH",
  "assignedTo": 4
}
```
*Note: `panchayatId` and `complaintNumber` cannot be provided by client; derived securely server-side.*

#### POST `/api/v1/complaints` Response Body (`201 Created`):
```json
{
  "id": 1,
  "complaintNumber": "CMP-2026-000001",
  "panchayatId": 1,
  "panchayatName": "Rampur Gram Panchayat",
  "citizenId": 1,
  "citizenName": "कमला बाई (Kamla Bai)",
  "citizenMobile": "9876543210",
  "citizenVillage": "हर्राभाट",
  "citizenWardNumber": 3,
  "category": "WATER",
  "categoryHindi": "पेयजल",
  "categoryEnglish": "Water Supply",
  "title": "Water supply pipeline leakage",
  "description": "Main supply line broken near Ward 3 water tank.",
  "priority": "HIGH",
  "priorityHindi": "उच्च",
  "priorityEnglish": "High",
  "status": "OPEN",
  "statusHindi": "खुली",
  "statusEnglish": "Open",
  "assignedTo": 4,
  "assignedToName": "Sunil Verma (GRS)",
  "assignedToRole": "GRS",
  "resolution": null,
  "createdAt": "2026-10-01T22:30:00Z",
  "updatedAt": "2026-10-01T22:30:00Z",
  "resolvedAt": null
}
```

#### GET `/api/v1/complaints/summary` Response Body (`200 OK`):
```json
{
  "total": 45,
  "open": 12,
  "inProgress": 18,
  "waiting": 3,
  "resolved": 8,
  "closed": 4,
  "rejected": 0,
  "byCategory": {
    "WATER": 15,
    "STREET_LIGHT": 10,
    "ROAD": 8,
    "SANITATION": 7,
    "HOUSING": 5
  },
  "byPriority": {
    "URGENT": 4,
    "HIGH": 16,
    "MEDIUM": 20,
    "LOW": 5
  }
}
```

#### PATCH `/api/v1/complaints/{id}/status` Request Body:
```json
{
  "status": "IN_PROGRESS",
  "remarks": "Staff deployed to inspect site"
}
```

#### PATCH `/api/v1/complaints/{id}/assign` Request Body:
```json
{
  "assignedTo": 4,
  "notes": "Assigned to GRS Sunil Verma for ground inspection"
}
```

#### PATCH `/api/v1/complaints/{id}/resolve` Request Body:
```json
{
  "resolution": "Water supply pipeline repaired by technician and water flow restored.",
  "notes": "Work completed at 4:30 PM with Ward Panch sign-off"
}
```

#### PATCH `/api/v1/complaints/{id}/close` Request Body:
```json
{
  "closingRemarks": "Verified with complainant citizen Kamla Bai. Issue resolved."
}
```

### 2.5 Document Management Module (`/api/v1/documents`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/documents` | List uploaded documents in Panchayat | `SECRETARY`, `SARPANCH` |
| `POST` | `/api/v1/documents/upload` | Upload & index document (Multipart Form Data) | `SECRETARY` |
| `GET` | `/api/v1/documents/{id}/download` | Stream/Download document resource | `SECRETARY`, Document Owner |

### 2.6 Cash Book Ledger Module (`/api/v1/cash-book`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/cash-book` | List financial ledger entries (Date/Category filtered) | `SECRETARY`, `SARPANCH` |
| `POST` | `/api/v1/cash-book` | Record new Receipt or Expense entry | `SECRETARY` |
| `GET` | `/api/v1/cash-book/summary` | Calculate total receipts, total expenses, net balance | `SECRETARY`, `SARPANCH` |

### 2.7 Reports & Analytics Module (`/api/v1/reports`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/reports/complaint-summary` | Complaints breakdown by category and resolution time | `SECRETARY`, `SARPANCH` |
| `GET` | `/api/v1/reports/citizen-stats` | Village demographics and ward distribution metrics | `SECRETARY`, `SARPANCH` |
| `GET` | `/api/v1/reports/cash-summary` | Monthly financial balance report | `SECRETARY`, `SARPANCH` |

---

## 3. Standard HTTP Error Status Codes

- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure or malformed JSON payload.
- `401 Unauthorized`: Invalid or expired JWT token.
- `403 Forbidden`: Insufficient RBAC permission or cross-tenant violation.
- `404 Not Found`: Target entity ID does not exist.
- `409 Conflict`: Duplicate key error (e.g. mobile/email already registered).
- `500 Internal Server Error`: Unhandled server exception (sanitized in response).

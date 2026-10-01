# GRAMAI — Security & Compliance Architecture

> **Document Version**: 1.0.0  
> **Security Policy**: Zero Trust Data Isolation & Strict RBAC  

---

## 1. Authentication Engine

GramAI enforces stateless **JSON Web Token (JWT)** authentication across all API endpoints (except `/api/v1/auth/login` and swagger documentation).

```
   Client                        Spring Security                       Database
     |                                  |                                 |
     |--- 1. POST /auth/login --------->|                                 |
     |   (email/mobile + password)      |--- 2. Verify User & Hash ------>|
     |                                  |<-- 3. Return Roles & Tenant ----|
     |<-- 4. Return JWT Access Token ---|                                 |
     |                                  |                                 |
     |--- 5. GET /citizens ------------>|                                 |
     |   (Header: Bearer <token>)       |--- 6. Extract Claims & Tenant ->|
     |                                  |--- 7. Query (WHERE panchayatId)-|
     |<-- 8. Return Tenant Data --------|<-- 9. Scoped Records -----------|
```

### 1.1 Token Configuration & Lifecycle
- **Algorithm**: HMAC-SHA512 (Cryptographic signing with $\ge 512$-bit key loaded from `JWT_SECRET`).
- **Access Token Expiry**: 24 hours (86,400 seconds) in development, configurable per environment.
- **Token Claims Payload**:
  ```json
  {
    "sub": "2",
    "email": "secretary@gramai.in",
    "role": "SECRETARY",
    "panchayatId": 1,
    "iat": 1789411200,
    "exp": 1789497600
  }
  ```

### 1.2 Credential Security & Password Hashing
- **Hashing Algorithm**: BCrypt (`BCryptPasswordEncoder`) with work factor (strength) **12**.
- **User Enumeration Prevention**: Authentication failures (user not found, wrong password, inactive account) return a uniform generic message: `"Bad credentials or account disabled"`.
- **Zero Sensitive Credential Leakage**: `passwordHash` is excluded from all DTO responses (`UserResponse`, `AuthResponse`) and omitted from logs.
- **Account State Verification**: Inactive users (`active = false`) are rejected at authentication time even with matching passwords.

---

## 2. Authorization & Role-Based Access Control (RBAC)

Spring Security `@PreAuthorize` annotations are applied at the controller and service levels to restrict action permissions:

```java
@PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY')")
@PostMapping("/citizens")
public ResponseEntity<ApiResponse<CitizenDto>> createCitizen(@Valid @RequestBody CitizenCreateDto request) {
    ...
}
```

### Role Matrix Summary
1. `ROLE_ADMIN`: Global system oversight, Panchayat onboarding, administrative user provisioning.
2. `ROLE_SECRETARY`: Complete operational control over Panchayat records, complaints, cash book, citizens, documents, meetings, and reports.
3. `ROLE_SARPANCH`: Read-only executive dashboard access, grievance oversight, Gram Sabha meeting approval.
4. `ROLE_GRS`: Employment & MGNREGA workflow management within assigned scope.
5. `ROLE_PANCH`: Ward-specific complaint and development view access.
6. `ROLE_CITIZEN`: Self-service complaint submission and personal status tracking.

---

## 3. Multi-Tenant Data Isolation Enforcement (Milestone 3 Core)

Multi-tenancy isolation is enforced authoritatively at the service, repository, and controller levels to ensure no user can access or manipulate another Panchayat's data:

1. **Server-Side Authoritative Scoping**:
   - `CustomUserPrincipal` extracted from the cryptographically verified JWT provides the authenticated user's `panchayatId` and `role`.
   - Client-provided role headers or frontend state are treated as completely untrusted.
2. **URL Manipulation Defense**:
   - Accessing `/api/v1/panchayats/{id}`: Non-`ADMIN` users are restricted so that `id == currentUser.panchayatId`. Accessing any other Panchayat ID immediately terminates with HTTP **`403 Forbidden`**.
   - Accessing `/api/v1/users/{id}`: Non-`ADMIN` users cannot view users whose `panchayatId` differs from their own (returning **`403 Forbidden`**).
3. **Query Parameter Tampering Defense**:
   - Querying `/api/v1/users?panchayatId={otherId}`: If a non-`ADMIN` user passes a `panchayatId` differing from their own, the request is authoritatively rejected with **`403 Forbidden`**.
4. **Role Escalation & Unauthorized Mutation Defense**:
   - `SECRETARY` users cannot create `ADMIN` users or another `SECRETARY` account (returns **`403 Forbidden`**).
   - `SECRETARY` can only create village-level roles (`SARPANCH`, `GRS`, `PANCH`, `CITIZEN`) assigned to their own `panchayatId`.
   - Users cannot change their own `panchayatId` (returns **`403 Forbidden`**).
   - Only `ADMIN` can update Panchayat metadata or reassign a user's Panchayat.
5. **Zero Credential Exposure**:
   - `passwordHash` is excluded from all incoming and outgoing DTOs (`CreateUserRequest`, `UserResponse`).
   - User creation accepts a temporary `password` string which is hashed via BCrypt before entity persistence.
6. **Safe Soft Deactivation**:
   - `DELETE /api/v1/panchayats/{id}` soft-deactivates the entity (`active = false`) rather than physically dropping records, preventing orphan foreign keys for users, future citizens, and audit trails.

### 3.1 Complaint Management Isolation & Security (Milestone 5)

The Complaint module enforces strict multi-tenant containment and state transition integrity:

1. **Panchayat Tenant Boundaries**:
   - All complaint queries are scoped strictly by `panchayat_id`. Non-`ADMIN` users cannot query or filter complaints belonging to another Panchayat.
   - Forged URL parameter attacks (e.g. `GET /api/v1/complaints/{otherGpComplaintId}`) are rejected with **`403 Forbidden`**.
   - Citizen callers (`CITIZEN` role) are strictly limited to their own grievances (`citizenId == principal.getCitizenId()`); any attempt to view or modify other citizens' complaints is blocked with **`403 Forbidden`**.
2. **Cross-Tenant Entity Reference Prevention**:
   - When registering a complaint (`POST /api/v1/complaints`), the provided `citizenId` is verified to belong to the caller's Panchayat. Cross-Panchayat citizen injection is rejected with **`400 Bad Request`**.
   - When assigning a complaint (`PATCH /api/v1/complaints/{id}/assign`), the target `assignedTo` user must belong to the caller's Panchayat (unless `ADMIN`). Arbitrary or cross-Panchayat user assignments are rejected with **`400 Bad Request`**.
3. **Controlled State Machine & Business Rules**:
   - Arbitrary status jumps (e.g. jumping from `CLOSED` back to `OPEN`, or `OPEN` directly to `CLOSED`) are blocked by the backend state machine, returning **`400 Bad Request`**.
   - Mandatory resolution rule: Marking a complaint as `RESOLVED` requires a non-empty `resolution` string. Marking a complaint as `CLOSED` requires verified prior resolution or closing resolution remarks.
4. **Safe Sorting & SQL Injection Defense**:
   - The `sort` parameter is validated against an explicit whitelist of permissible properties (`createdAt`, `updatedAt`, `priority`, `status`, `title`, `complaintNumber`). Any unexpected column input safely defaults to `createdAt,desc`, preventing SQL or property path injection.
5. **Server-Generated Unique Complaint Identifiers**:
   - Complaint numbers follow the human-readable pattern `CMP-YYYY-XXXXXX` and are generated authoritatively server-side inside transactional boundaries. Client-supplied complaint numbers are discarded.
6. **Activity Timeline & Tamper-Resistant Audit Trail**:
   - Every creation, status change, assignment, resolution, and closure automatically persists a `ComplaintHistory` entry recording timestamp, user ID, role, user name, and details.

---

## 4. Cryptography & Password Policies

- **Password Hashing**: BCrypt with logarithmic work factor **12**.
- **Plaintext Storage Prevention**: Passwords are hashed before database insertion. Plaintext passwords are never logged, printed, or returned in API responses.
- **Password Strength Rule**: Minimum 8 characters, requiring at least 1 uppercase, 1 numeric, and 1 special character.

---

## 5. Input Validation, XSS & SQL Injection Protection

1. **Input Validation**: All request DTOs leverage Jakarta Validation annotations (`@NotBlank`, `@Size`, `@Pattern`, `@PositiveOrZero`). Invalid requests are rejected at the controller boundary.
2. **SQL Injection Prevention**: Hibernate / Spring Data JPA uses parameterized PreparedStatements exclusively. Raw SQL string concatenation is strictly forbidden.
3. **XSS Protection**: HTML content in input fields is sanitized using OWASP HTML Sanitizer before persistence.
4. **CORS Security**: Cross-Origin Resource Sharing (CORS) is restricted to explicitly configured origin domains (`APP_CORS_ALLOWED_ORIGINS`).

---

## 6. Document Upload Security

To prevent remote code execution or file inclusion attacks:
- **Allowed Extension Whitelist**: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.doc`, `.docx`.
- **MIME Type Validation**: Checked via Apache Tika content inspection rather than relying solely on file extension.
- **Max File Size**: 10MB per document upload.
- **Filename Sanitization**: Uploaded files are stripped of special characters, paths, and renamed using unique UUID keys (`uuid_sanitizedname.ext`).

---

## 7. Audit Logging Policy

System activities (e.g. login attempts, citizen record creation, cash book edits, complaint status changes) produce immutable `AuditLog` records containing:
- `timestamp`: UTC execution time.
- `userId`: Actor user ID.
- `panchayatId`: Scope tenant.
- `action`: E.g. `CREATE_CITIZEN`, `UPDATE_COMPLAINT_STATUS`, `ADD_CASH_ENTRY`.
- `details`: Non-sensitive JSON payload summary of changes.

> 🔒 **Sensitive Data Rule**: Audit logs MUST NOT contain JWT tokens, passwords, full credit/bank account numbers, or raw secret keys.

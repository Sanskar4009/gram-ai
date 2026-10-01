# GRAMAI — System Architecture Specification

> **Document Version**: 1.0.0  
> **Architecture Pattern**: Modular Monolith  
> **Target Deployment**: Containerized (Docker / Docker Compose)  

---

## 1. High-Level Architectural Diagram

GramAI utilizes a **Modular Monolith** pattern. All business domains reside within a single, highly structured Spring Boot application deployed alongside a React SPA frontend and a PostgreSQL relational database.

```mermaid
graph TD
    Client["Browser / Mobile Client (React 18 SPA)"]
    Gateway["Spring Security Gateway & JWT Filter"]
    
    subgraph Modular Monolith Backend (Spring Boot 3)
        Gateway --> AuthMod["Auth Module"]
        Gateway --> UserMod["User & Role Module"]
        Gateway --> PanchMod["Panchayat Tenant Module"]
        Gateway --> CitMod["Citizen Registry Module"]
        Gateway --> CompMod["Complaint Lifecycle Module"]
        Gateway --> DocMod["Document Storage Module"]
        Gateway --> TaskMod["Task Management Module"]
        Gateway --> MeetMod["Gram Sabha & Meeting Module"]
        Gateway --> NotifMod["Notice & Announcement Module"]
        Gateway --> FinMod["Finance Cash Book Module"]
        Gateway --> RepMod["Reporting Engine Module"]
        Gateway --> AuditMod["Audit Log Module"]
        
        DocMod --> StorageAbs["StorageService Interface"]
        StorageAbs --> LocalStore["LocalStorageService (Dev/MVP)"]
        StorageAbs -.-> S3Store["S3StorageService (Future Cloud)"]
        
        NotifMod --> NotifAbs["NotificationProvider Interface"]
        NotifAbs --> MockNotif["LogNotificationProvider (Dev/MVP)"]
        NotifAbs -.-> SMSNotif["SMS / WhatsApp Provider (Future)"]
    end
    
    subgraph Data & Storage Layer
        AuthMod --> DB[("PostgreSQL 16 Database\n(Panchayat Tenant Scoped)")]
        CitMod --> DB
        CompMod --> DB
        DocMod --> DB
        TaskMod --> DB
        MeetMod --> DB
        NotifMod --> DB
        FinMod --> DB
        AuditMod --> DB
        LocalStore --> LocalDisk["Local Disk / uploads/"]
    end
```

---

## 2. Layered Component Architecture

Each backend module follows clean layered architecture principles:

```
┌─────────────────────────────────────────────────────────┐
│                    API / REST Layer                     │
│    Controllers, DTO Requests/Responses, OpenAPI Annot.  │
├─────────────────────────────────────────────────────────┤
│                   Service / Domain Layer                │
│    Business Logic, Transaction Management (@Transactional)│
│    Tenant Validation, Event Publishing                  │
├─────────────────────────────────────────────────────────┤
│                   Data Access Layer                     │
│    Spring Data JPA Repositories, Custom Criteria Queries│
├─────────────────────────────────────────────────────────┤
│                    Database Layer                       │
│    PostgreSQL 16 (Foreign Keys, Indexes, Constraints)   │
└─────────────────────────────────────────────────────────┘
```

### 2.1 Storage Abstraction Pattern
Document attachments (e.g., identity proofs, complaint photos, notice circulars) are managed through a unified abstraction:

```java
public interface StorageService {
    String store(MultipartFile file, String subDirectory);
    Resource loadAsResource(String fileReference);
    void delete(String fileReference);
}
```
- **Development implementation**: `LocalStorageService` writes sanitized files to a secure local folder inside the workspace/server disk.
- **Production/Cloud implementation**: `S3StorageService` streams files directly to an AWS S3 bucket using pre-signed URLs.

### 2.2 Notification Abstraction Pattern
Notice and announcement broadcasts utilize a pluggable notification interface:

```java
public interface NotificationProvider {
    void sendNotification(NotificationRequest request);
    NotificationType getType();
}
```
- **MVP Implementation**: `LogNotificationProvider` logs notification events to the audit table without triggering third-party SMS/WhatsApp billing APIs.

---

## 3. Multi-Tenant Data Isolation Strategy

GramAI uses **Discriminator-Based Multi-Tenancy** (Row-Level Security). Every database table owned by a Gram Panchayat contains a non-nullable `panchayat_id` foreign key.

```
       +--------------------------------------------------------+
       |                  Authenticated Request                 |
       |  JWT Token Payload: { userId: 42, panchayatId: 101 }   |
       +---------------------------+----------------------------+
                                   |
                                   v
       +--------------------------------------------------------+
       |              Spring Security Context                   |
       |     Injects TenantContext (panchayatId = 101)          |
       +---------------------------+----------------------------+
                                   |
                                   v
       +--------------------------------------------------------+
       |                 Spring Data JPA Query                  |
       |  SELECT c FROM Complaint c WHERE c.panchayatId = 101   |
       +--------------------------------------------------------+
```

### 3.1 Tenant Isolation Enforcement Rules
1. **Context Extraction**: The JWT Authentication Filter extracts `panchayatId` from the verified JWT payload and populates a thread-local `TenantContext`.
2. **Repository Guarding**: All Spring Data JPA custom queries and specifications automatically include `WHERE entity.panchayatId = :panchayatId`.
3. **Cross-Tenant Prevention**: If a user attempts to read or modify a record belonging to another `panchayatId`, the system throws a `TenantAccessDeniedException` and logs an audit security alert.

---

## 4. Backend Package Structure (`com.gramai.backend`)

```
com.gramai.backend/
├── auth/
│   ├── controller/          # AuthController.java (login, refresh, me)
│   ├── dto/                 # LoginRequest, JwtResponse, RefreshTokenRequest
│   └── service/             # AuthService.java, JwtTokenProvider.java
├── user/
│   ├── entity/              # User.java, Role.java (Enum)
│   ├── repository/          # UserRepository.java
│   └── service/             # UserService.java
├── panchayat/
│   ├── entity/              # Panchayat.java
│   ├── repository/          # PanchayatRepository.java
│   └── service/             # PanchayatService.java
├── citizen/
│   ├── entity/              # Citizen.java
│   ├── repository/          # CitizenRepository.java
│   └── service/             # CitizenService.java
├── complaint/
│   ├── entity/              # Complaint.java, ComplaintStatus.java, Category.java
│   ├── repository/          # ComplaintRepository.java
│   └── service/             # ComplaintService.java
├── document/
│   ├── entity/              # DocumentRecord.java
│   ├── repository/          # DocumentRepository.java
│   └── service/             # StorageService.java, LocalStorageService.java
├── task/
│   ├── entity/              # Task.java, TaskStatus.java, TaskPriority.java
│   └── repository/          # TaskRepository.java
├── meeting/
│   ├── entity/              # Meeting.java, MeetingType.java
│   └── repository/          # MeetingRepository.java
├── notice/
│   ├── entity/              # Notice.java, NoticeCategory.java
│   └── repository/          # NoticeRepository.java
├── finance/
│   ├── entity/              # CashBookEntry.java, EntryType.java
│   └── repository/          # CashBookRepository.java
├── report/
│   ├── dto/                 # ComplaintSummaryDto, CashBookSummaryDto
│   └── service/             # ReportService.java
├── audit/
│   ├── entity/              # AuditLog.java
│   └── service/             # AuditAspect.java, AuditService.java
├── common/
│   ├── exception/           # GlobalExceptionHandler.java, CustomExceptions
│   ├── dto/                 # ApiResponse.java, PageResponse.java
│   └── util/                # DateUtils.java, StringSanitizer.java
└── security/
    ├── JwtAuthenticationFilter.java
    ├── TenantContext.java
    └── WebSecurityConfig.java
```

---

## 5. Future AI Architecture (Post-MVP Preview)

> ⚠️ **Note**: AI components are non-MVP features planned for Milestone 14. They are documented here to ensure current data models support future integration without breaking changes.

```
       +--------------------------------------------------------+
       |               Future AI Assistant Engine               |
       +---------------------------+----------------------------+
                                   |
           +-----------------------+-----------------------+
           |                                               |
           v                                               v
+──────────────────────────┐                    ┌──────────────────────────┐
│        AIService         │                    │    DocumentAIService     │
│ (Conversational Query)   │                    │ (OCR & PDF Extraction)   │
└──────────┬───────────────┘                    └──────────┬───────────────┘
           │                                               │
           v                                               v
+──────────────────────────┐                    ┌──────────────────────────┐
│    RetrievalService      │                    │     EmbeddingService     │
│ (RAG Vector Search)      │                    │ (Amazon Titan / Bedrock) │
└──────────────────────────┘                    └──────────────────────────┘
```

- `AIService`: Interface for scheme inquiries and report summarization.
- `DocumentAIService`: Interface for OCR file parsing via Amazon Textract.
- `EmbeddingService` & `RetrievalService`: RAG over official government circulars and Panchayat record vector embeddings.

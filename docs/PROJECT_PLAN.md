# GRAMAI — Project Plan & Domain Requirements Document

> **Document Version**: 1.5.0  
> **Status**: Milestones 0–5 Approved & Completed  
> **Target Audience**: Engineering Lead, Full-Stack Developers, Product Architects  

---

## 1. Executive Summary & Project Vision

**GramAI** is a production-grade, unified digital work assistant and operating workspace built for Gram Panchayat staff in India. 

### 1.1 The Real Problem Statement
Digital governance initiatives in India (e-GramSwaraj, NREGA soft, PM Awas Portal, Samagra Portal) have brought online capabilities to rural administration. However, the operational reality inside Gram Panchayat offices remains fragmented and inefficient due to:

1. **Disconnected Government Portals**: Secretaries must log into 5–8 different state and central web portals daily, manually re-entering duplicate citizen data.
2. **Paper-Heavy & Spreadsheet Fragmentation**: Essential local records (cash registers, citizen requests, complaints, notices, meeting minutes) are kept across physical registers and unorganized Excel files.
3. **Severe Internet & Portal Downtime**: Government servers and rural connectivity frequently experience outages. Traditional web forms lose data if submitted during network drops.
4. **High Citizen Footfall & Staff Shortages**: A single Gram Panchayat Secretary typically handles 40–50 visiting citizens daily alongside field inspections and Janpad Panchayat reporting.
5. **Difficult Record Retrieval**: Retrieving past citizen records, old complaint statuses, or family details takes upwards of 20–30 minutes per request.

### 1.2 The GramAI Solution
GramAI acts as a **Unified Panchayat Operating System**. It provides a single, high-performance, offline-resilient workspace where staff manage daily administrative workflows, citizen inquiries, cash books, complaint resolution, notices, and Gram Sabha meetings.

---

## 2. In-Depth Domain Research & Field Insights

GramAI's design stems from authentic field observations of Indian Gram Panchayat operations:

### 2.1 Key Operational Roles & Hierarchy
- **Sarpanch**: Elected political head of the Gram Panchayat. Responsible for executive approval, reviewing village development works, public grievance overview, and presiding over Gram Sabha meetings.
- **Panch**: Ward member representing specific village wards. Manages local ward issues, reports drinking water or streetlight failures, and tracks ward development.
- **Secretary (Gram Panchayat Sachiv)**: Primary administrative officer appointed by the state government. Handles financial transactions, cash book maintenance, citizen certificates, official registers, reporting to Janpad Panchayat, and operational complaint resolution. **(Primary User of MVP)**.
- **GRS (Gram Rozgar Sahayak)**: Dedicated employment assistant managing MGNREGA job cards, daily worker attendance (Muster Roll), and work site coordination.
- **Met**: Field worker supervising NREGA labor groups at project sites.
- **Peon / Office Attendant**: Assists with physical file management, village notices, and office maintenance.

### 2.2 Typical Daily Footfall & Workflow Breakdown
- **Daily Citizen Footfall**: 40 to 50 citizens visit the Panchayat office daily.
- **Top Citizen Inquiries & Complaints**:
  - **Water Supply**: Pipeline leaks, handpump repairs, borewell motor failures.
  - **PM Awas Yojana**: Checking instalment status, document submissions for housing approval.
  - **MGNREGA**: Job card applications, delayed wage payment queries, work requests.
  - **Sanitation & Roads**: CC road repair requests, pond/well cleaning, drainage blockages, streetlight replacements.
  - **Ration & Certificates**: Ration slip distribution issues, birth/death registration updates, Samagra ID verification.
  - **Social Infrastructure**: Primary school building issues, Anganwadi food distribution complaints, health camp information.

---

## 3. Scope Definition

### 3.1 In-Scope (MVP - Milestones 0 to 11)
The MVP strictly delivers a production-grade, multi-tenant modular monolith consisting of:
1. **Authentication & RBAC**: JWT-based secure auth supporting 6 distinct user roles.
2. **Panchayat Management**: Multi-panchayat tenant setup and administration.
3. **User Management**: User creation, credential management, role assignment.
4. **Citizen Registry**: Unified master database for village citizens indexed by Ward and Mobile.
5. **Complaint Management**: Full lifecycle complaint recording, status tracking, auto-generated tracking numbers, and staff assignment.
6. **Document Management**: Document upload, metadata indexing, local file storage abstraction with validation.
7. **Task Management**: Internal work assignment, priority tracking, due date reminders.
8. **Gram Sabha / Meeting Management**: Meeting scheduling, agenda recording, attendee tracking, and meeting minutes generation.
9. **Notice Board System**: Village notice generation, audience targeting, and broadcast logs.
10. **Cash Book Ledger**: Single/double entry financial ledger for Receipts and Expenses using `BigDecimal` precision.
11. **Reports & Analytics**: Standardized summary reports for complaints, citizens, cash flow, and tasks.
12. **Secretary Dashboard**: Hindi-friendly, mobile-first responsive operational dashboard.
13. **Audit Logging**: Comprehensive system activity tracking for transparency and audit trails.

### 3.2 Explicit Exclusions (Non-MVP & Anti-Goals)
- ❌ **No Impersonation of Government Systems**: GramAI does NOT scrape, bypass, or impersonate official government portals (e-GramSwaraj, NREGA soft).
- ❌ **No Fake / Unofficial External APIs**: Integrations will only occur when official, authorized public APIs are released by government bodies.
- ❌ **No AI / LLM / RAG in MVP**: AI capabilities (document OCR, scheme assistant) are explicitly reserved for Milestone 14 after core operational stability.
- ❌ **No Microservices / Kubernetes**: The architecture remains a clean Modular Monolith to minimize deployment complexity and maintenance overhead.
- ❌ **No Unsecured Plaintext Data**: No hardcoded secrets, no unhashed passwords, and no raw sensitive citizen tokens in logs.

---

## 4. User Roles & RBAC Matrix

| Feature / Module | ADMIN | SECRETARY | SARPANCH | GRS | PANCH | CITIZEN |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| System Administration | **Full** | None | None | None | None | None |
| Panchayat Setup | **Full** | Read | Read | None | None | None |
| User Account Management | **Full** | Manage (Own GP) | None | None | None | None |
| Citizen Registry | **Full** | **Full** | Read | Read | Read | Self-View |
| Complaint Management | **Full** | **Full** | Read | Read (Assigned) | Ward Read | Submit/Track |
| Document Management | **Full** | **Full** | Read | Read | Read | Self-Docs |
| Task Management | **Full** | **Full** | Read | Manage NREGA | Ward Tasks | None |
| Gram Sabha / Meetings | **Full** | **Full** | **Full** | Read | Read | View Notices |
| Notice Board | **Full** | **Full** | **Full** | Read | Read | View Public |
| Cash Book Ledger | **Full** | **Full** | Read | None | None | None |
| Reports & Analytics | **Full** | **Full** | **Full** | NREGA Stats | Ward Stats | None |
| System Audit Logs | **Full** | Read (Own) | None | None | None | None |

---

## 5. Verification & Testing Strategy

To maintain production quality throughout development, GramAI enforces a strict automated testing regimen:

1. **Backend Testing**:
   - **Framework**: JUnit 5, Mockito, Spring Security Test.
   - **Coverage Focus**: Authentication workflows, RBAC permission checks, Panchayat tenant isolation filters, Cash Book `BigDecimal` mathematical calculations, and Complaint state machine transitions.
2. **Frontend Testing**:
   - **Framework**: Vitest, React Testing Library, MSW (Mock Service Worker).
   - **Coverage Focus**: Form validations, status badge rendering, React Query caching, localized Hindi UI elements, and offline status banner behavior.
3. **Integration Verification**:
   - Automated REST API testing via Spring `MockMvc`.
   - Database constraint verification using test containers or dedicated PostgreSQL test databases.

# GRAMAI — Smart Panchayat Digital Work Assistant
*(Smart Panchayat Operating System)*

[![Architecture: Modular Monolith](https://img.shields.io/badge/Architecture-Modular%20Monolith-blue.svg)](#architecture--key-modules)
[![Backend: Spring Boot 3.3](https://img.shields.io/badge/Backend-Spring%20Boot%203.3-green.svg)](#technology-stack)
[![Frontend: React + Vite](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript%20%7C%20Vite-61dafb.svg)](#technology-stack)
[![Database: PostgreSQL 16](https://img.shields.io/badge/Database-PostgreSQL%2016-336791.svg)](#technology-stack)
[![Milestone: 5 Complete](https://img.shields.io/badge/Milestone-5%20Complaint%20Management%20Complete-success.svg)](./docs/ROADMAP.md)

GramAI is a unified digital workspace designed for Panchayat administrative staff (specifically Panchayat Secretaries, Sarpanches, GRS, and Panchs) to digitize, streamline, and manage daily Gram Panchayat operational workflows efficiently.

---

## 📌 Project Vision & Problem Statement

### The Real Problem in Panchayat Governance
In rural governance across India, digitized government portals exist for specific national/state schemes (e.g., e-GramSwaraj, NREGA soft, Samagra, PM Awas Yojana). However, Panchayat staff—primarily the **Panchayat Secretary**—face significant operational bottlenecks:
- **Disconnected Systems & Redundant Data Entry**: Entering citizen details, complaint records, and register logs separately across multiple portals or physical registers.
- **Record Retrieval & Duplicate Registers**: Searching paper files or disconnected local Excel spreadsheets takes hours when citizens request updates or historical records.
- **Server Downtime & Intermittent Connectivity**: Official portals often suffer downtime or connectivity failures, halting daily public interactions.
- **High Footfall & Staff Constraints**: With 40–50 citizens visiting a Panchayat daily for varied services (ration cards, birth/death updates, water issues, MGNREGA wages), administrative backlogs grow rapidly.

### The GramAI Solution
GramAI acts as an internal **Smart Panchayat Operating System** that unifies all daily records (Citizen Registry, Complaints, Cash Book, Documents, Notices, Gram Sabha Meetings, and Tasks) into a single, secure, offline-ready workspace.

> **Disclaimer**: *GramAI is an independent, non-official software application designed for educational and internal administrative workspace demonstration. It does not impersonate any official government portal, nor does it scrape or bypass security controls of official government systems.*

---

## 🏗️ Architecture & Key Modules

GramAI follows a **Modular Monolith** architecture, balancing operational simplicity, high performance, strict multi-tenant security, and clean domain boundaries.

```
                  +-----------------------------------+
                  |       React 18 + TS Frontend      |
                  |     (Vite + Tailwind CSS + PWA)   |
                  +-----------------+-----------------+
                                    | REST API / JSON
                  +-----------------v-----------------+
                  |      Spring Boot 3 Backend        |
                  |        (Modular Monolith)         |
                  +-----------------+-----------------+
                                    | JPA / SQL
                  +-----------------v-----------------+
                  |     PostgreSQL 16 Database        |
                  |  (Multi-Tenant Panchayat Scoped)  |
                  +-----------------------------------+
```

---

## 💻 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript (Strict Mode), Vite 5, Tailwind CSS, React Router v6, TanStack Query v5, Lucide Icons |
| **Backend** | Java 21, Spring Boot 3.3.x, Spring Web, Spring Data JPA, Jakarta Validation, PostgreSQL JDBC Driver, Maven 3.9+ |
| **Database** | PostgreSQL 16 |
| **Testing** | Backend: JUnit 5, Spring WebMvcTest, AssertJ \| Frontend: Vitest, React Testing Library, jsdom |
| **DevOps** | Docker, Docker Compose, Multi-stage Dockerfiles, Nginx |

---

## 📂 Repository Structure

```
gramai/
│
├── frontend/                     # React 18 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── components/           # Reusable UI elements
│   │   ├── layouts/              # RootLayout, navigation, header & footer
│   │   ├── pages/                # DashboardPage, StatusPage, NotFoundPage
│   │   ├── routes/               # Declarative AppRoutes
│   │   ├── services/             # API client calls (healthService, etc.)
│   │   ├── hooks/                # TanStack Query custom hooks (useHealth, etc.)
│   │   ├── types/                # TypeScript interfaces (API envelopes, responses)
│   │   ├── lib/                  # apiClient & cn utilities
│   │   ├── test/                 # Vitest test suites
│   │   ├── App.tsx               # Root application component
│   │   ├── main.tsx              # Application entry point with React Query & Router
│   │   └── index.css             # Tailwind base and design utilities
│   ├── public/                   # Static assets (favicon, icons)
│   ├── nginx.conf                # Production SPA Nginx configuration
│   ├── Dockerfile                # Multi-stage production container build
│   ├── package.json              # Frontend dependencies and npm scripts
│   ├── tsconfig.json             # TypeScript configuration (strict mode)
│   ├── vite.config.ts            # Vite bundler & test runner settings
│   └── .env.example              # Frontend environment variables template
│
├── backend/                      # Java 21 / Spring Boot 3 Modular Monolith
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/gramai/
│   │   │   │   ├── GramAiApplication.java    # Spring Boot application entry point
│   │   │   │   ├── config/                   # WebMvc CORS & app configuration
│   │   │   │   ├── common/                   # Global envelopes, exceptions, and health
│   │   │   │   │   ├── dto/                  # ApiResponse, ErrorResponse, FieldErrorDto
│   │   │   │   │   ├── exception/            # GlobalExceptionHandler
│   │   │   │   │   └── health/               # HealthController & HealthResponse
│   │   │   │   ├── auth/                     # Milestone 2: Auth & JWT package
│   │   │   │   ├── user/                     # Milestone 3: User & Role package
│   │   │   │   ├── panchayat/                # Milestone 3: Panchayat tenant package
│   │   │   │   ├── citizen/                  # Milestone 4: Citizen registry package
│   │   │   │   ├── complaint/                # Milestone 5: Complaint lifecycle package
│   │   │   │   ├── document/                 # Milestone 6: Document storage package
│   │   │   │   ├── task/                     # Milestone 7: Task tracking package
│   │   │   │   ├── meeting/                  # Milestone 7: Gram Sabha & meeting package
│   │   │   │   ├── notice/                   # Milestone 8: Village notice package
│   │   │   │   ├── finance/                  # Milestone 9: Cash Book ledger package
│   │   │   │   ├── report/                   # Milestone 10: Reports & analytics package
│   │   │   │   └── audit/                    # Milestone 11: Audit logging package
│   │   │   └── resources/
│   │   │       └── application.yml           # Environment-based datasource & server config
│   │   └── test/
│   │       ├── java/com/gramai/              # JUnit 5 & MockMvc test suites
│   │       └── resources/                    # H2 in-memory test configuration
│   ├── Dockerfile                # Multi-stage container build (JRE 21)
│   └── pom.xml                   # Maven dependencies and build plugins
│
├── docs/                         # Technical Architecture & Planning Specs
│   ├── PROJECT_PLAN.md           # Domain Vision & Functional Requirements
│   ├── ARCHITECTURE.md           # Architecture Blueprint & Multi-tenant Isolation
│   ├── DATABASE.md               # PostgreSQL Schema, Indexing & Data Models
│   ├── API.md                    # REST API Specifications & OpenAPI Endpoints
│   ├── SECURITY.md               # Security Policies, JWT & RBAC Controls
│   ├── OFFLINE_STRATEGY.md       # Offline-First Architectural Blueprint
│   └── ROADMAP.md                # Detailed Milestone Breakdown (0 to 14)
│
├── docker-compose.yml            # Multi-container orchestration (postgres, backend, frontend)
├── .env.example                  # Root environment variables template
├── .gitignore                    # Git ignore definitions for Java, Node, IDEs, and OS
└── README.md                     # Project overview and developer instructions
```

---

## ⚙️ Environment Variables

Copy `.env.example` to create `.env` for your local environment:

```bash
cp .env.example .env
```

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DB_HOST` | `postgres` (or `localhost`) | PostgreSQL hostname |
| `DB_PORT` | `5432` | PostgreSQL listening port |
| `DB_NAME` | `gramai` | PostgreSQL database name |
| `DB_USERNAME` | `gramai` | PostgreSQL username |
| `DB_PASSWORD` | `change-me` | PostgreSQL user password |
| `SERVER_PORT` | `8080` | Spring Boot HTTP server port |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Allowed origins for CORS |
| `VITE_API_BASE_URL` | `http://localhost:8080/api/v1` | Base REST API URL used by frontend |
| `FRONTEND_PORT` | `5173` | Frontend container exposure port |

---

## 🚀 Getting Started & Local Development

### Prerequisites
- **Java**: JDK 21+
- **Maven**: 3.9+
- **Node.js**: v18+ or v20+ (with npm)
- **Docker & Docker Compose** (optional for local standalone, required for containerized run)

---

### Method A: Running with Docker Compose (Recommended)

To build and start all three containers (PostgreSQL, Spring Boot backend, React frontend):

```bash
# Start all services in the background
docker compose up -d --build

# Inspect running containers
docker compose ps

# View service logs
docker compose logs -f

# Stop services
docker compose down
```

- **Frontend Application**: `http://localhost:5173`
- **Backend Health Check**: `http://localhost:8080/api/v1/health`
- **PostgreSQL**: `localhost:5432`

---

### Method B: Running Services Directly on Host Machine

#### 1. Start PostgreSQL
If using Docker for just PostgreSQL:
```bash
docker compose up -d postgres
```
Or start your local PostgreSQL 16 service and ensure a database named `gramai` exists:
```sql
CREATE DATABASE gramai;
```

#### 2. Start the Backend
Navigate to the `backend/` directory:
```bash
cd backend

# Run automated tests
mvn clean test

# Package the application
mvn clean package

# Start the Spring Boot server
mvn spring-boot:run
# Alternatively run the packaged jar:
# java -jar target/gramai-backend-0.1.0-SNAPSHOT.jar
```
The backend starts up on `http://localhost:8080`.

Verify health endpoint:
```bash
curl http://localhost:8080/api/v1/health
```
Response:
```json
{
  "status": "UP",
  "service": "gramai-backend"
}
```

#### 3. Start the Frontend
Navigate to the `frontend/` directory in a new terminal:
```bash
cd frontend

# Install dependencies
npm install

# Run frontend tests
npm run test

# Build for production
npm run build

# Start local development server
npm run dev
```
Open `http://localhost:5173` in your browser:
- Navigate to **Backend Status** (`/status`) to view live health status from the backend.
- Navigate to **Dashboard** (`/`) to view the application shell.

---

## 🩺 Health Check Endpoint

GramAI provides a lightweight health verification endpoint at:

```
GET /api/v1/health
```

**Status Code**: `200 OK`  
**Content-Type**: `application/json`

**Payload**:
```json
{
  "status": "UP",
  "service": "gramai-backend"
}
```

---

## 🔑 Demo Development Credentials

The local environment comes seeded with default demo accounts across all system roles:

| Role | Name | Email | Password | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | System Administrator | `admin@gramai.in` | `Admin@123` | System-wide admin access |
| **SECRETARY** | Rameshwar Sharma (Sachiv) | `secretary@gramai.in` | `Secretary@123` | Panchayat operational lead |
| **SARPANCH** | Vikram Singh (Sarpanch) | `sarpanch@gramai.in` | `Sarpanch@123` | Executive dashboard & approval |
| **GRS** | Mohan Lal (GRS) | `grs@gramai.in` | `Grs@123` | Employment & field work |
| **PANCH** | Sunita Devi (Ward Panch) | `panch@gramai.in` | `Panch@123` | Ward-level oversight |
| **CITIZEN** | Rajesh Kumar (Citizen) | `citizen@gramai.in` | `Citizen@123` | Citizen grievance portal |
| **INACTIVE** | Inactive Staff | `inactive@gramai.in` | `Inactive@123` | Disabled account (`active=false`) |

---

## 🗺️ Milestone Roadmap & Current Progress

| Milestone | Title | Status |
| :--- | :--- | :---: |
| **Milestone 0** | Architecture & Detailed Planning | ✅ **COMPLETED** |
| **Milestone 1** | Project Foundation & Scaffolding | ✅ **COMPLETED** |
| **Milestone 2** | Authentication, JWT & RBAC Engine | ✅ **COMPLETED** |
| **Milestone 3** | Panchayat & User Management | ✅ **COMPLETED** |
| **Milestone 4** | Citizen Registry Module | ✅ **COMPLETED** |
| **Milestone 5** | Complaint Management Workflow | ✅ **COMPLETED** |
| **Milestone 6** | Document Storage Engine | ⏳ *Next Milestone* |
| **Milestone 7** | Tasks, Meetings & Gram Sabha | 📋 Planned |
| **Milestone 8** | Notice Board & Broadcast System | 📋 Planned |
| **Milestone 9** | Cash Book Financial Ledger | 📋 Planned |
| **Milestone 10** | Dashboard & Summary Reports | 📋 Planned |
| **Milestone 11** | Audit Logs & Hardening | 📋 Planned |
| **Milestone 12** | Offline-First Engine | 📋 Planned |
| **Milestone 13** | AWS Cloud Infrastructure | 📋 Planned |
| **Milestone 14** | Future AI, RAG & OCR | 📋 Planned |

See [docs/ROADMAP.md](./docs/ROADMAP.md) for the complete engineering schedule.

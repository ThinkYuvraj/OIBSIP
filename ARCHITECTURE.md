# Slice & Fire - Full-Stack Application Architecture

## 1. Executive Summary

This document describes the implemented **full-stack architecture** for the Slice & Fire artisan pizza delivery platform. The system implements a strict **separation of concerns** between:
1. **Frontend Client Tier (`/client`)**: High-performance React 19 Single Page Application (SPA) located in `/client`, powered by Vite and Tailwind CSS.
2. **Backend Server Tier (`/server`)**: Modular Express 5 Node.js REST API located in `/server` with dual-port role-based access control (Port 3000 for Customer APIs, Port 3001 for Admin Operations), Drizzle ORM persistence on PostgreSQL, automated cron inventory replenishment, and Razorpay integration. Root `server.ts` imports and invokes the server orchestrator.

---

## 2. System Architecture Overview

```mermaid
flowchart TB
    subgraph ClientTier ["FRONTEND CLIENT TIER (/client)"]
        Browser["User Browser\n(Mobile, Tablet, Desktop)"]
        ReactApp["React 19 SPA (Vite + Tailwind)\n• Pizza Builder & Visualizer\n• Live Order Tracker\n• Responsive Mobile Sidebar\n• Architecture Modal Inspector"]
        AuthContext["AuthContext & ThemeContext\n(/client/src/context)"]
        ApiClient["Typed API Client\n(/client/src/api/client.ts)"]
        ClientFirebase["Client Firebase SDK\n(Google Sign-In Popup)"]

        Browser --> ReactApp
        ReactApp --> AuthContext
        ReactApp --> ApiClient
        ReactApp --> ClientFirebase
    end

    subgraph BackendTier ["BACKEND SERVER TIER (/server)"]
        Gateway["Server Orchestrator (server/index.ts <- server.ts)"]
        Port3000["Customer API Service\n(Port 3000)\n• /api/pizzas\n• /api/orders\n• /api/payments\n• /api/auth"]
        Port3001["Admin Operations Service\n(Port 3001)\n• /api/admin/inventory\n• /api/admin/orders\n• /api/admin/rbac\n• /api/admin/restock"]

        AuthMiddleware["Server Auth & RBAC Middleware\n(/server/middleware)"]
        DrizzleLayer["Database & Drizzle ORM Layer\n(/server/db)\n• schema.ts & users.ts\n• PostgreSQL Connection Pool\n• Resilient Storage Fallback"]
        CronService["Background Cron Inventory Monitor\n(/server/inventory.ts)\n• Low-stock email alerts\n• Automated replenishment"]
        FirebaseAdmin["Firebase Admin SDK\n(/server/lib/firebaseAdmin.ts)"]

        Gateway --> Port3000
        Gateway --> Port3001
        Port3000 --> AuthMiddleware
        Port3001 --> AuthMiddleware
        AuthMiddleware --> FirebaseAdmin
        Port3000 --> DrizzleLayer
        Port3001 --> DrizzleLayer
        DrizzleLayer --> CronService
    end

    subgraph Infrastructure ["PERSISTENCE & EXTERNAL CLOUD"]
        Postgres[(Cloud SQL / PostgreSQL 5432)]
        RazorpayGateway["Razorpay Test Gateway\n(Order Creation & Signature Verification)"]
        FirebaseCloud["Firebase Cloud Auth\n(Identity & OAuth)"]

        DrizzleLayer --> Postgres
        Port3000 --> RazorpayGateway
        FirebaseAdmin --> FirebaseCloud
    end

    ApiClient -->|HTTP / REST (Port 3000)| Gateway
```

---

## 3. Directory Layout & Separation of Concerns

```text
Pizza_Delivery_Fullstack/
├── server/                           # BACKEND ARCHITECTURE (Node.js + Express 5)
│   ├── config/                       # Server ports & network configuration
│   │   └── ports.ts                  # Defines Port 3000 & Port 3001
│   ├── db/                           # Persistence & Data Access
│   │   ├── index.ts                  # PostgreSQL connection pool & health status
│   │   ├── schema.ts                 # Drizzle ORM relational schema
│   │   ├── users.ts                  # Server-side user queries & role sync
│   │   ├── seed.ts                   # Catalog & inventory seeders
│   │   └── memoryDb.ts               # Local in-memory repository with file sync
│   ├── lib/                          # Backend External SDKs
│   │   └── firebaseAdmin.ts          # Server Firebase Admin initialization
│   ├── middleware/                   # Express Middlewares
│   │   ├── authMiddleware.ts         # Firebase Admin & JWT token verification
│   │   └── rbacMiddleware.ts         # Dual-Port Role segregation enforcement
│   ├── routes/                       # Express Route Handlers
│   │   ├── authRoutes.ts             # Customer & admin authentication
│   │   ├── pizzaRoutes.ts            # Menu retrieval & stock checking
│   │   ├── orderRoutes.ts            # Order placement & status lifecycle
│   │   ├── paymentRoutes.ts          # Razorpay order generation & verification
│   │   ├── adminRoutes.ts            # Kitchen ops, inventory restock & logs
│   │   └── architectureRoutes.ts     # Live architectural status endpoint (/api/architecture)
│   ├── services/                     # Business Logic Services
│   │   ├── auth.ts                   # Password hashing & JWT signing
│   │   ├── inventory.ts              # Automated cron replenishment & email alerts
│   │   └── rbac.ts                   # Port enforcement matrix & audit logger
│   └── index.ts                      # Express app setup & port listener definitions
│
├── client/                           # FRONTEND ARCHITECTURE (React 19 SPA)
│   ├── src/                          # Client Source Code
│   │   ├── api/                      # Frontend HTTP Client
│   │   │   └── client.ts             # Typed fetch client communicating with /api/*
│   │   ├── components/               # UI View Components
│   │   │   ├── Navbar.tsx            # Navigation header with role badge & theme toggle
│   │   │   ├── MobileSidebar.tsx     # Responsive mobile slide-out drawer
│   │   │   ├── CustomPizzaBuilder.tsx# 4-stage interactive pizza visualizer
│   │   │   ├── OrderStatusTracker.tsx# 5-stage live order tracking workflow
│   │   │   ├── AdminPanel.tsx        # Operations & inventory replenishment console
│   │   │   ├── CartDrawer.tsx        # Slide-out checkout & pricing calculator
│   │   │   ├── AuthModal.tsx         # Customer & Admin authentication modal
│   │   │   └── ArchitectureModal.tsx # Full-Stack System Topology Inspector
│   │   ├── context/                  # Client Application State
│   │   │   ├── AuthContext.tsx       # Session management & user state
│   │   │   └── ThemeContext.tsx      # Light & dark theme synchronization
│   │   ├── lib/                          # Client Libraries
│   │   │   └── firebase.ts           # Client Firebase SDK for Google Auth
│   │   ├── types.ts                  # Shared domain contracts & interfaces
│   │   ├── App.tsx                   # Main layout shell & view router
│   │   ├── App.css                   # Layout CSS, responsive media queries
│   │   ├── main.tsx                  # React DOM root entry point
│   │   └── index.css                 # Tailwind CSS entry point
│   └── index.html                    # Client entry HTML
│
├── server.ts                         # Root entrypoint invoking server/index.ts
├── drizzle.config.ts                 # Drizzle kit configuration for PostgreSQL
├── index.html                        # Application entry point with theme guard
├── package.json                      # Fullstack dependency definitions
└── ARCHITECTURE.md                   # Comprehensive architectural specifications
```

---

## 4. Dual-Port Role-Based Access Control (RBAC)

The application enforces security at both the **network/port layer** and the **middleware layer**:

| Feature | Port 3000 (Customer Service) | Port 3001 (Admin Operations) |
|---|---|---|
| **Primary Audience** | Public customers, guests, visitors | Authorized Kitchen Staff & Managers |
| **Allowed Roles** | `GUEST`, `CUSTOMER`, `ADMIN` | `ADMIN` strictly |
| **Available Endpoints** | `/api/auth/*`, `/api/pizzas/*`, `/api/orders/*`, `/api/payments/*` | `/api/admin/*`, `/api/admin/inventory/*`, `/api/admin/orders/*`, `/api/admin/restock` |
| **Ingress Rule** | Served directly to browser client | Accessible locally or via secure internal forwarded gateway |
| **Enforcement** | Open customer access with JWT session verification | `enforcePortRole` blocks non-admins with `403 Forbidden` + audits violation |

---

## 5. Persistence Strategy

1. **Drizzle ORM & Cloud SQL (PostgreSQL)**:
   - Tables: `users`, `pizzas`, `pizza_sizes`, `toppings`, `orders`, `order_items`, `inventory`, `rbac_audit_logs`.
   - Managed connection pooling with SSL encryption.
2. **Resilient Local Storage Fallback**:
   - In offline or local development environments without an active PostgreSQL instance, the database layer automatically synchronizes with `./data/db_store.json`.
3. **Automated Inventory Cron**:
   - Background service checks ingredient levels every 10 seconds.
   - Triggers low-stock alerts and email simulations when items fall below safe thresholds.

---

## 6. Live Architecture Inspection

The application includes a built-in **Live Architecture Inspector**:
- Endpoint: `GET /api/architecture`
- Client UI: Accessed via the **"Architecture"** button on the desktop navigation bar, the responsive mobile sidebar drawer, or the footer.
- Displays:
  - Visual Topology Diagram
  - Interactive Project Directory Hierarchy Tree
  - Real-time Backend Diagnostic Specs (Ports, DB status, RBAC rules)

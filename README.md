# 🍕 Slice & Fire — Full-Stack Artisan Pizza & Kitchen Operations

A production-grade, full-stack Neapolitan pizza delivery platform and automated kitchen operations system. Built with **React 18 / Vite**, **Express.js**, **TypeScript**, and **Node-Cron**, featuring real-time interactive pizza customization, automatic recipe inventory deduction, automated email alerting via **Nodemailer**, and an admin operations console.

---

## 📋 Table of Contents

- [Key Features](#-key-features)
- [System Architecture & Workflows](#-system-architecture--workflows)
  - [1. Customer Ordering Workflow](#1-customer-ordering-workflow)
  - [2. Inventory & Recipe Deduction Engine](#2-inventory--recipe-deduction-engine)
  - [3. Background Cron & Low-Stock Alerting](#3-background-cron--low-stock-alerting)
  - [4. Kitchen & Admin Operations Portal](#4-kitchen--admin-operations-portal)
- [Full-Stack Engineering Considerations](#-full-stack-engineering-considerations)
- [Tech Stack](#-tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Environment Configuration](#-environment-configuration)
- [Getting Started & Local Development](#-getting-started--local-development)
- [API Reference](#-api-reference)
- [Production Deployment & Containerization](#-production-deployment--containerization)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## ✨ Key Features

### 🛒 Customer Storefront
- **Artisan Pizza Catalog**: High-resolution photography of handcrafted Neapolitan varieties with pricing, badges, ratings, and ingredient lists.
- **Dynamic Cart Drawer**: Real-time tax, delivery fee calculation, item customization tags, and checkout summaries.
- **Live Order Prep Pipeline**: Step-by-step preparation tracker (Order Placed → Hand-Stretching Dough → 900°F Wood-Fired Oven → Quality Box Inspection → Out for Delivery).

### 🎨 Interactive Custom Pizza Builder
- **Multi-Layer Ingredient Selection**: Select custom crusts (Neapolitan, Sourdough, Gluten-Free Cauliflower), artisanal sauces (San Marzano, Truffle Garlic, Pistachio Pesto), melted cheeses, and fresh vegetables.
- **Visual Pizza Canvas Rendering**: Real-time graphic layer stack showing dough, sauce spread, cheese melt, and scattered vegetable toppings.
- **Live Macro & Price Counter**: Dynamically computes calories, protein, carbs, fat, and total cost as ingredients are toggled.
- **Inventory-Gated Options**: Automatically disables out-of-stock ingredients in real time to prevent invalid orders.

### 📦 Kitchen Inventory Management Subsystem
- **BOM (Bill of Materials) Recipe Deduction**: Subdivides pizza orders into constituent stock items (crusts, ladles of sauce, portions of cheese, and cups of veggies) and updates quantities upon order confirmation.
- **Threshold-Driven Alerts**: Configurable stock thresholds per ingredient. Items falling below warning thresholds are flagged immediately.
- **Admin Inventory Controls**: One-click restock, manual stock level adjustments, unit cost updates, and on-demand threshold auditing.

### ⏱️ Background Automation & Email Dispatch
- **Automated Node-Cron Service**: Executes every 10 minutes (`*/10 * * * *`) and immediately following order deductions to scan all 25+ kitchen ingredients.
- **Email Delivery via Nodemailer**: Dispatches formatted HTML alert cards to operations staff (`ADMIN_ALERT_EMAIL`) detailing low-stock item counts and thresholds.
- **Audit Logging**: Persists every outgoing email alert to the database for administrative review.
- **Resilient Fallback Architecture**: Verifies SMTP connections at boot and degrades gracefully to an internal transport if credentials fail, ensuring store checkout is never blocked by external network issues.

---

## 🔄 System Architecture & Workflows

```
                                 ┌───────────────────────────────┐
                                 │      React Storefront UI      │
                                 │ (Vite + Tailwind + TypeScript)│
                                 └───────────────┬───────────────┘
                                                 │ HTTP /api/*
                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Express.js Application Layer                          │
│                                                                                 │
│  ┌────────────────────────┐  ┌─────────────────────────┐  ┌──────────────────┐  │
│  │   Storefront Routes    │  │  Custom Builder Routes  │  │   Admin Portal   │  │
│  │  (/api/pizzas, orders) │  │  (/api/custom-options)  │  │  (/api/admin/*)  │  │
│  └───────────┬────────────┘  └────────────┬────────────┘  └─────────┬────────┘  │
│              │                            │                         │           │
│              ▼                            ▼                         ▼           │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                     Inventory & Recipe Deduction Engine                   │  │
│  │      - Parse artisan pizza recipe IDs or custom pizza ingredient details  │  │
│  │      - Deduct base crusts, sauce ladles, cheese portions, and veggies     │  │
│  └─────────────────────────────────────┬─────────────────────────────────────┘  │
│                                        │                                        │
│                                        ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                        Kitchen Inventory Threshold Check                  │  │
│  │           - Triggered immediately on order deduction                      │  │
│  │           - Triggered automatically on 10-minute node-cron schedule       │  │
│  └─────────────────────────────────────┬─────────────────────────────────────┘  │
│                                        │                                        │
│                                        ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                     Nodemailer SMTP Notification Service                  │  │
│  │         - Verifies Google App Password / SMTP credentials                 │  │
│  │         - Dispatches HTML alert cards to ops team                         │  │
│  │         - Records timestamped alert to admin audit log                    │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1. Customer Ordering Workflow
1. User browses artisan recipes or builds a personalized custom pizza.
2. The client checks `/api/custom-options` and `/api/pizzas`; items with zero stock display out-of-stock badges and disable add buttons.
3. User adds items to the Cart Drawer, reviews delivery fees and taxes, and submits checkout.
4. Express receives `POST /api/orders`, validates inputs, generates a tracking ID, and saves the order.
5. Client transitions into the live preparation pipeline tracker.

### 2. Inventory & Recipe Deduction Engine
1. In `server/inventory.ts`, the order processor examines each item in the order payload.
2. **For Custom Pizzas**: Deducts 1 unit from the selected dough base, 1 from sauce, 1 from cheese, and 1 from each chosen vegetable topping.
3. **For Artisan Varieties**: Looks up the predefined recipe definition (e.g. `Margherita DOC` → Neapolitan Dough + San Marzano Sauce + Fior di Latte Mozzarella + Fresh Basil) and decrements corresponding inventory records.
4. Database stock values are updated atomically in `data/store.json`.

### 3. Background Cron & Low-Stock Alerting
1. `startInventoryCron()` sets up a scheduled job via `node-cron` running every 10 minutes (`*/10 * * * *`).
2. Immediate scans are also dispatched right after any order deduction or admin manual trigger (`POST /api/admin/inventory/check-now`).
3. If an ingredient's `stock <= threshold`:
   - Formats a prioritized alert detailing item name, remaining balance, and safe threshold.
   - Nodemailer delivers the email to `ADMIN_ALERT_EMAIL` or `ADMIN_EMAIL`.
   - Records an entry in `emailLogs` with an alert ID, timestamp, and metadata.

### 4. Kitchen & Admin Operations Portal
1. Protected by administrator credential authorization.
2. Provides real-time dashboard cards for active stock items, low-stock warnings, and historical email delivery records.
3. Enables kitchen managers to:
   - Restock individual ingredients or trigger a global pantry restock.
   - Adjust threshold parameters dynamically as kitchen volume changes.
   - Trigger on-demand threshold audits.

---

## 🛡️ Full-Stack Engineering Considerations

When developing, maintaining, and deploying a production full-stack application, keep these architectural principles in mind:

### 1. API Key & Credential Hygiene
- **Never expose secrets to the client**: Third-party API keys, JWT secrets, and SMTP passwords must live exclusively on the backend (`process.env`).
- **Client variables must be prefixed**: Only non-sensitive variables intended for browser exposure should be prefixed with `VITE_` (e.g., `import.meta.env.VITE_APP_TITLE`).
- **Document all variables in `.env.example`**: Keep `.env.example` up to date with empty placeholders so team members and CI/CD pipelines know exactly what is required.

### 2. SMTP & Third-Party Authentication Quirks
- **Google App Passwords vs. Personal Passwords**: Gmail disables standard account passwords for third-party SMTP clients. Nodemailer connections require a **16-character Google App Password** generated under *Google Account Security → 2-Step Verification → App Passwords*.
- **Username vs. Display Name**: The SMTP login username must be an actual email address (`thinkyuvraj2@gmail.com`). Passing a human name (e.g., `"Yuvraj Singh"`) as the login username will fail with `535-5.7.8 Username and Password not accepted`.
- **Defensive Transporter Fallbacks**: External services can fail, rate limit, or experience network drops. Always test connections with `.verify()` and provide a fallback (such as JSON mock transport) so that an email outage does not crash the user's checkout flow.

### 3. Unified Port Architecture
- In modern containerized hosting (e.g., Cloud Run, Docker, PaaS), **a single external port (Port 3000)** is typically exposed.
- During development, Vite is integrated directly into Express via `vite.createServer({ server: { middlewareMode: true } })`.
- During production, Express serves pre-built static assets from `/dist` and provides single-page application (SPA) fallback routing:
  ```ts
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  ```

### 4. Data Consistency & Atomic Updates
- Inventory deduction occurs synchronously on the server when orders are created, preventing race conditions or double-allocations.
- Client state updates optimistically or re-fetches inventory to ensure users cannot order depleted supplies.

### 5. Type Safety Across the Wire
- Shared data contracts (e.g., `Pizza`, `InventoryItem`, `Order`, `CartItem`) are defined in `src/types.ts` and shared across server endpoints and client React components, preventing schema drift.

---

## 🛠️ Tech Stack

| Domain | Technology / Library | Description |
| :--- | :--- | :--- |
| **Frontend UI** | **React 18 / 19** | Component-driven UI with state hooks and responsive layouts |
| **Styling & Icons** | **Tailwind CSS + Lucide React** | Utility-first styling with accessible icons |
| **Server & API** | **Express.js (v5)** | High-performance HTTP server handling REST endpoints |
| **Language** | **TypeScript** | Strict end-to-end type safety |
| **Dev Execution** | **tsx + Vite** | Instant TypeScript execution and hot-reloading dev middleware |
| **Scheduling** | **node-cron** | Periodic background jobs for inventory scanning |
| **Email Transport** | **Nodemailer** | SMTP alert dispatching with HTML templating |
| **Production Build** | **esbuild + Vite** | High-speed server bundling into CommonJS + optimized frontend assets |

---

## 📁 Project Directory Structure

```
.
├── server.ts                    # Express backend entry point & Vite middleware setup
├── server/
│   ├── db.ts                    # Database abstraction layer, seed data, & JSON storage
│   ├── inventory.ts             # Recipe deduction engine, node-cron, & Nodemailer service
│   └── routes/
│       ├── adminRoutes.ts       # Admin inventory controls, audits, & restock endpoints
│       ├── authRoutes.ts        # Admin authentication & session management
│       └── orderRoutes.ts       # Storefront pizza menu & checkout endpoints
├── src/
│   ├── App.tsx                  # Main client application shell & page routing
│   ├── types.ts                 # Shared TypeScript interfaces & types
│   ├── components/
│   │   ├── Navbar.tsx           # Navigation header, cart counter, & admin access
│   │   ├── CustomPizzaBuilder.tsx # Interactive canvas pizza maker & macro calculator
│   │   ├── PizzaCatalog.tsx     # Menu grid with category filtering & photo cards
│   │   ├── CartDrawer.tsx       # Slide-out cart & checkout drawer
│   │   ├── OrderStatusTracker.tsx # 5-stage live preparation tracker
│   │   └── AdminDashboard.tsx   # Kitchen ops panel, stock adjustments, & email audit log
├── data/
│   └── store.json               # Persistent JSON file storage for orders, inventory, & logs
├── public/
│   └── images/                  # High-resolution artisan pizza photography
├── .env.example                 # Template for required environment variables
├── package.json                 # Project dependencies and build scripts
└── vite.config.ts               # Vite bundler configuration
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the project root based on `.env.example`:

```env
# Server Ingress Port (Default: 3000)
PORT=3000

# Inventory Alert Notifications
ADMIN_ALERT_EMAIL=thinkyuvraj2@gmail.com
ADMIN_EMAIL=admin@sliceandfire.com

# Email / SMTP Credentials
# For Gmail, use your full Gmail address and a 16-character Google App Password:
SMTP_USER=thinkyuvraj2@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Sender display name (Optional human name):
EMAIL_USER=Yuvraj Singh

# Security & Secrets
JWT_SECRET=your_jwt_secret_key_here
```

> **Note on Gmail SMTP**: Never enter your standard Google login password. Enable 2-Step Verification on your Google Account and generate an **App Password** from [Google App Passwords](https://myaccount.google.com/apppasswords).

---

## 🚀 Getting Started & Local Development

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-username/slice-and-fire.git
cd slice-and-fire
npm install
```

### 3. Run in Development Mode
Start the unified Express + Vite development server:
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

### 4. Code Quality & Linting
Run ESLint across the codebase:
```bash
npm run lint
```

---

## 📡 API Reference

### Public Storefront Endpoints
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status check |
| `GET` | `/api/pizzas` | List all artisan pizzas with recipes and stock status |
| `GET` | `/api/custom-options` | Fetch available doughs, sauces, cheeses, and veggies |
| `POST` | `/api/orders` | Create an order, deduct inventory, and trigger threshold check |
| `GET` | `/api/orders/:id` | Fetch order status and delivery tracking info |

### Admin & Operations Endpoints
| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/admin-login` | Authenticate admin console access |
| `GET` | `/api/admin/inventory` | Retrieve full inventory table with thresholds and stock |
| `PATCH` | `/api/admin/inventory/:id` | Adjust stock count, threshold, or unit price |
| `POST` | `/api/admin/inventory/check-now` | Manually run threshold scan and dispatch alert emails |
| `POST` | `/api/admin/inventory/restock` | Reset all inventory items to full capacity |
| `GET` | `/api/admin/email-logs` | View historical record of dispatched stock alert emails |

---

## 📦 Production Deployment & Containerization

### Production Build
The project builds both the client SPA and a bundled Node server:
```bash
npm run build
```
This runs:
1. `vite build`: Compiles the React client into optimized static assets in `/dist`.
2. `esbuild server.ts`: Bundles the Express server into a single CommonJS file at `dist/server.cjs`.

### Production Launch
```bash
npm start
```
Starts `node dist/server.cjs` listening on `0.0.0.0:3000`.

### Dockerfile (Sample for Cloud Run or Docker Host)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```

---

## ❓ Troubleshooting & FAQs

#### Q: Getting `535-5.7.8 Username and Password not accepted` from Gmail?
- Make sure `SMTP_USER` is your full Gmail address (e.g., `user@gmail.com`), not just your name.
- Ensure `SMTP_PASS` is a 16-character **Google App Password**, not your regular personal account password.
- If you change credentials, restart the dev server to verify the new connection.

#### Q: How does the app handle email failure if SMTP is unreachable?
- In `server/inventory.ts`, `getTransporter()` verifies SMTP credentials on startup. If verification fails, it logs a clear warning and switches to an internal mock transport. Orders and checkout will **continue to process smoothly** without throwing unhandled exceptions.

#### Q: Can custom pizzas be configured with zero-stock ingredients?
- No. The Custom Pizza Builder actively checks the stock of every dough, sauce, cheese, and veggie item. Any item with 0 stock is marked with an "Out of Stock" badge and disabled from selection.

---

## 📄 License
This project is licensed under the MIT License.

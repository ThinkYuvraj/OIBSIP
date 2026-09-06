import React, { useState, useEffect } from 'react';
import {
  Layers,
  Server,
  Monitor,
  Database,
  ShieldCheck,
  CheckCircle2,
  X,
  Radio,
  Cpu,
  RefreshCw,
  FolderTree,
  Network,
} from 'lucide-react';
import { api } from '../api/client.js';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'topology' | 'tree' | 'live'>('topology');
  const [archData, setArchData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadArchitecture();
    }
  }, [isOpen]);

  const loadArchitecture = async () => {
    setLoading(true);
    try {
      const data = await api.getArchitecture();
      setArchData(data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="architecture-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="architecture-modal-card"
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#1c1815] text-[#f5f3f0] border border-[#3e352f] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#352d27] bg-[#241f1b]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#c92722]/20 border border-[#c92722]/40 flex items-center justify-center text-[#ff6459]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Full-Stack Architecture</h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Separation of Concerns
                </span>
              </div>
              <p className="text-xs text-[#a8a09a]">Modular Frontend (`/src`) & Backend (`/server`) Architecture</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="refresh-arch-btn"
              onClick={loadArchitecture}
              className="p-2 rounded-lg text-[#a8a09a] hover:text-white hover:bg-[#322a24] transition-colors"
              title="Refresh Architecture Diagnostics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              id="close-arch-modal-btn"
              onClick={onClose}
              className="p-2 rounded-lg text-[#a8a09a] hover:text-white hover:bg-[#322a24] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-[#352d27] bg-[#1e1916]">
          <button
            id="tab-arch-topology"
            onClick={() => setActiveTab('topology')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'topology'
                ? 'bg-[#c92722] text-white shadow-sm'
                : 'text-[#a8a09a] hover:text-white hover:bg-[#2c241e]'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            Visual Topology
          </button>
          <button
            id="tab-arch-tree"
            onClick={() => setActiveTab('tree')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'tree'
                ? 'bg-[#c92722] text-white shadow-sm'
                : 'text-[#a8a09a] hover:text-white hover:bg-[#2c241e]'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            Project Directory Hierarchy
          </button>
          <button
            id="tab-arch-live"
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'live'
                ? 'bg-[#c92722] text-white shadow-sm'
                : 'text-[#a8a09a] hover:text-white hover:bg-[#2c241e]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Live Backend Diagnostics
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'topology' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Architecture Highlights Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Frontend Card */}
                <div className="p-4 rounded-xl bg-[#251f1a] border border-[#40352d] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                      <Monitor className="w-4 h-4" />
                      <h3>FRONTEND TIER (`/client`)</h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                      Client SPA (`/client/src`)
                    </span>
                  </div>
                  <p className="text-xs text-[#b8b0a8] leading-relaxed">
                    Built with <strong>React 19</strong>, <strong>TypeScript</strong>, <strong>Vite</strong>, and{' '}
                    <strong>Tailwind CSS</strong>. All client-side components, state context, and UI views live in <code>/client</code>.
                  </p>
                  <ul className="text-xs space-y-1.5 text-[#ded7ce]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span><strong>Components:</strong> Modular pizza customizer, live status tracker, cart drawer</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span><strong>API Client:</strong> Typed client in <code>/client/src/api/client.ts</code></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span><strong>Context:</strong> User session & theme synchronization in <code>/client/src/context</code></span>
                    </li>
                  </ul>
                </div>

                {/* Backend Card */}
                <div className="p-4 rounded-xl bg-[#251f1a] border border-[#40352d] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                      <Server className="w-4 h-4" />
                      <h3>BACKEND TIER (`/server`)</h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      Express 5 REST API
                    </span>
                  </div>
                  <p className="text-xs text-[#b8b0a8] leading-relaxed">
                    Powered by <strong>Node.js</strong> and <strong>Express</strong> with dual-port role segregation,
                    PostgreSQL persistence via <strong>Drizzle ORM</strong>, automated inventory cron replenishment, and Razorpay.
                  </p>
                  <ul className="text-xs space-y-1.5 text-[#ded7ce]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span><strong>Dual-Port RBAC:</strong> Customer (Port 3000) & Admin (Port 3001)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span><strong>Database:</strong> Drizzle ORM + Cloud SQL / PostgreSQL with resilient fallback</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span><strong>Services:</strong> Inventory cron alerts & server-side payment verification</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Visual Flow Topology */}
              <div className="p-5 rounded-xl bg-[#221c18] border border-[#382f28] space-y-4">
                <h4 className="text-xs font-bold tracking-wider uppercase text-[#a8a09a] flex items-center gap-2">
                  <Network className="w-4 h-4 text-[#ff6459]" />
                  System Topology & Communication Flow
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
                  {/* Step 1 */}
                  <div className="p-3.5 rounded-lg bg-[#2c241e] border border-[#44382f] flex flex-col items-center justify-center space-y-2">
                    <Monitor className="w-5 h-5 text-sky-400" />
                    <div className="text-xs font-bold text-white">1. Browser Client</div>
                    <p className="text-[11px] text-[#a8a09a]">React 19 SPA on Port 3000 (Vite SSR / Assets)</p>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3.5 rounded-lg bg-[#2c241e] border border-[#44382f] flex flex-col items-center justify-center space-y-2">
                    <Radio className="w-5 h-5 text-amber-400" />
                    <div className="text-xs font-bold text-white">2. API Gateway</div>
                    <p className="text-[11px] text-[#a8a09a]">Routes <code>/api/*</code> to Express services</p>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3.5 rounded-lg bg-[#2c241e] border border-[#44382f] flex flex-col items-center justify-center space-y-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <div className="text-xs font-bold text-white">3. Dual-Port RBAC</div>
                    <p className="text-[11px] text-[#a8a09a]">Admin Ops: Port 3001 | Customer: Port 3000</p>
                  </div>

                  {/* Step 4 */}
                  <div className="p-3.5 rounded-lg bg-[#2c241e] border border-[#44382f] flex flex-col items-center justify-center space-y-2">
                    <Database className="w-5 h-5 text-purple-400" />
                    <div className="text-xs font-bold text-white">4. Persistence & Cloud</div>
                    <p className="text-[11px] text-[#a8a09a]">PostgreSQL (Drizzle) + Razorpay + Firebase</p>
                  </div>
                </div>
              </div>

              {/* Endpoints & Separation Table */}
              <div className="border border-[#382f28] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#28211c] text-[#cfc8c0] border-b border-[#382f28]">
                      <th className="p-3 font-semibold">Tier</th>
                      <th className="p-3 font-semibold">Folder Path</th>
                      <th className="p-3 font-semibold">Core Responsibilities</th>
                      <th className="p-3 font-semibold">Port / Protocol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#322923] text-[#a8a09a]">
                    <tr>
                      <td className="p-3 font-bold text-sky-400">Frontend (Client)</td>
                      <td className="p-3 font-mono text-[#eae6e1]">/client/src/components/*</td>
                      <td className="p-3">Pizza builder, status tracker, navigation, theme toggle</td>
                      <td className="p-3">Client (Port 3000)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-sky-400">Frontend (Client)</td>
                      <td className="p-3 font-mono text-[#eae6e1]">/client/src/api/client.ts</td>
                      <td className="p-3">Centralized typed REST client communicating with /api/*</td>
                      <td className="p-3">HTTP / Fetch</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-amber-400">Backend (Server)</td>
                      <td className="p-3 font-mono text-[#eae6e1]">/server/routes/*</td>
                      <td className="p-3">authRoutes, pizzaRoutes, orderRoutes, paymentRoutes, adminRoutes</td>
                      <td className="p-3">REST APIs</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-amber-400">Backend (Server)</td>
                      <td className="p-3 font-mono text-[#eae6e1]">/server/db/*</td>
                      <td className="p-3">Drizzle ORM schema, PostgreSQL pool, user syncing, disk persistence</td>
                      <td className="p-3">Port 5432 / Drizzle</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-amber-400">Backend (Server)</td>
                      <td className="p-3 font-mono text-[#eae6e1]">/server/services/*</td>
                      <td className="p-3">Cron low-stock monitoring, email notification logs, Razorpay webhooks</td>
                      <td className="p-3">Internal Cron / Razorpay</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'tree' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#a8a09a]">
                  Standardized directory hierarchy establishing clear boundaries between frontend client code and backend server logic:
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`Pizza_Delivery_Fullstack/
├── server/                           # BACKEND ARCHITECTURE (Node.js + Express 5)
│   ├── config/                       # Port bindings & RBAC matrix
│   ├── db/                           # Drizzle ORM, schema & PostgreSQL pool
│   ├── lib/                          # Firebase Admin server SDK
│   ├── middleware/                   # JWT & RBAC port enforcement
│   ├── routes/                       # Express REST endpoints (/api/*)
│   ├── services/                     # Background cron & payment verification
│   └── index.ts                      # Server Express app initializer & route mounting
│
├── client/                           # FRONTEND ARCHITECTURE (React 19 SPA)
│   ├── src/
│   │   ├── api/                      # Centralized typed HTTP client
│   │   ├── components/               # Modular UI components
│   │   ├── context/                  # AuthContext & ThemeContext
│   │   ├── lib/                      # Client Firebase SDK
│   │   ├── types.ts                  # TypeScript models & domain types
│   │   ├── App.tsx                   # Main application router & workbench
│   │   ├── App.css                   # Custom artisan layout CSS
│   │   ├── index.css                 # Tailwind CSS styles
│   │   └── main.tsx                  # Vite React 19 client entry point
│   └── index.html                    # Client entry HTML
│
├── server.ts                         # Server boot entry point (invokes server/index.ts)
├── vite.config.ts                    # Vite build configuration
└── package.json                      # Fullstack dependency declarations`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-3 py-1 text-xs rounded bg-[#322a24] hover:bg-[#3f342d] text-[#e0dad2] transition-colors"
                >
                  {copied ? 'Copied to Clipboard!' : 'Copy Tree Layout'}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#130f0d] border border-[#352d27] font-mono text-xs text-[#4ade80] overflow-x-auto whitespace-pre leading-relaxed">
{`Pizza_Delivery_Fullstack/
├── server/                           # BACKEND ARCHITECTURE (Express REST API)
│   ├── config/                       # Server configuration & constants
│   │   ├── ports.ts                  # Port 3000 & 3001 definitions
│   │   └── firebaseAdmin.ts          # Server Firebase Admin initialization
│   ├── db/                           # Persistence & Data Access
│   │   ├── index.ts                  # PostgreSQL connection pool & health status
│   │   ├── schema.ts                 # Drizzle ORM relational schema
│   │   ├── users.ts                  # DB user queries & role sync
│   │   ├── seed.ts                   # Catalog & inventory seeders
│   │   └── memoryDb.ts               # Local in-memory repository with file sync
│   ├── middleware/                   # Express Middlewares
│   │   ├── authMiddleware.ts         # Firebase Admin & JWT token verification
│   │   └── rbacMiddleware.ts         # Dual-Port Role segregation enforcement
│   ├── routes/                       # Express Route Handlers
│   │   ├── authRoutes.ts             # Customer & admin authentication
│   │   ├── pizzaRoutes.ts            # Menu retrieval & stock checking
│   │   ├── orderRoutes.ts            # Order placement & status lifecycle
│   │   ├── paymentRoutes.ts          # Razorpay order generation & verification
│   │   ├── adminRoutes.ts            # Kitchen ops, inventory restock & logs
│   │   └── architectureRoutes.ts     # Live architectural status endpoint
│   ├── services/                     # Business Logic Services
│   │   ├── auth.ts                   # Password hashing & JWT signing
│   │   ├── inventory.ts              # Automated cron replenishment & email alerts
│   │   └── rbac.ts                   # Port enforcement matrix & audit logger
│   └── index.ts                      # Express app setups & port listeners
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
│   │   ├── lib/                      # Client Libraries
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
└── ARCHITECTURE.md                   # Comprehensive architectural specifications`}
              </div>
            </div>
          )}

          {activeTab === 'live' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-400">Live Endpoint Response: /api/architecture</span>
                </div>
                <span className="text-[11px] text-[#a8a09a]">Polled in real-time from Express backend</span>
              </div>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-[#a8a09a] space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#c92722]" />
                  <span className="text-xs">Querying Express architecture service...</span>
                </div>
              ) : archData ? (
                <div className="p-4 rounded-xl bg-[#130f0d] border border-[#352d27] font-mono text-xs text-[#38bdf8] overflow-x-auto whitespace-pre leading-relaxed max-h-96">
                  {JSON.stringify(archData, null, 2)}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#251f1a] border border-[#3e352f] text-xs text-[#a8a09a]">
                  Unable to load live diagnostics. Verify dev server status.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#352d27] bg-[#221c18] text-xs text-[#a8a09a]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Dual-Port RBAC Enforced: Port 3000 (Customer) | Port 3001 (Admin)</span>
          </div>
          <button
            id="close-arch-footer-btn"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#322a24] hover:bg-[#3f342d] text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

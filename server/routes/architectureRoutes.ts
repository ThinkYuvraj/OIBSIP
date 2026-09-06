import { Router, Request, Response } from 'express';
import { PORTS_CONFIG, ROLE_PERMISSIONS } from '../rbac.js';
import { getDbStatus } from '../db/index.ts';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const dbStatus = getDbStatus();

  res.json({
    system: 'Slice & Fire Full-Stack Architecture',
    status: 'OPERATIONAL',
    version: '3.0.0',
    layers: {
      frontend: {
        root: '/client',
        runtime: 'React 19 + Vite + TypeScript + Tailwind CSS',
        architecture: 'Component-Based Single Page Application (SPA)',
        directories: {
          components: '/client/src/components (Navbar, MobileSidebar, CustomPizzaBuilder, OrderStatusTracker, AdminPanel, ArchitectureModal)',
          context: '/client/src/context (AuthContext, ThemeContext)',
          api: '/client/src/api/client.ts (Centralized typed HTTP API client proxying to /api/*)',
          lib: '/client/src/lib (Client Firebase Auth SDK)',
          types: '/client/src/types.ts (Global shared TypeScript domain contracts)',
        },
        responsiveSupport: 'Phone, Tablet, Desktop (Dedicated Drawer & Breakpoints)',
      },
      backend: {
        root: '/server',
        runtime: 'Node.js + Express 5 + TypeScript (tsx in Dev / esbuild in Prod)',
        architecture: 'Layered REST API with Dual-Port RBAC and Relational Database Sync',
        directories: {
          config: '/server/config (Port bindings, RBAC matrix, Firebase Admin initialization)',
          db: '/server/db (Drizzle ORM, PostgreSQL schema, Connection Pool, Resilient Fallback Repository)',
          routes: '/server/routes (authRoutes, pizzaRoutes, orderRoutes, paymentRoutes, adminRoutes, architectureRoutes)',
          middleware: '/server/middleware (JWT authenticateToken, requireFirebaseAuth, enforcePortRole RBAC)',
          services: '/server/services (Automated Cron Inventory Replenishment, Razorpay Payments)',
        },
        ports: {
          clientService: {
            port: PORTS_CONFIG.CLIENT_PORT,
            purpose: 'Public storefront, pizza customizer, order checkout, order tracking, Vite client middleware',
            allowedRoles: ['CUSTOMER', 'ADMIN'],
          },
          adminService: {
            port: PORTS_CONFIG.ADMIN_PORT,
            purpose: 'Isolated operations console, stock updates, live kitchen ticket management, cron logs',
            allowedRoles: ['ADMIN'],
          },
        },
        rbac: {
          enforced: true,
          permissions: ROLE_PERMISSIONS,
        },
        database: dbStatus,
      },
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;

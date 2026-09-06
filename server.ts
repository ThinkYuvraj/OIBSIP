import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import authRoutes from './server/routes/authRoutes.js';
import pizzaRoutes from './server/routes/pizzaRoutes.js';
import orderRoutes from './server/routes/orderRoutes.js';
import paymentRoutes from './server/routes/paymentRoutes.js';
import adminRoutes from './server/routes/adminRoutes.js';
import architectureRoutes from './server/routes/architectureRoutes.js';

import { initSeedUsers, comparePassword, generateToken } from './server/auth.js';
import { startInventoryCron } from './server/inventory.js';
import { logRbacEvent, ROLE_PERMISSIONS } from './server/rbac.js';
import { db, getDbStatus } from './server/db.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Normalized allowed origins: local dev + deployed Vercel frontend + cloud environments
const rawFrontendUrl = (process.env.FRONTEND_URL || '').trim().replace(/\/+$/, '');
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://pizzadeliveryapp.vercel.app',
  rawFrontendUrl,
].filter(Boolean) as string[];

function isOriginAllowed(origin: string): boolean {
  const normalized = origin.replace(/\/+$/, '');
  if (allowedOrigins.includes(normalized)) return true;
  if (normalized.endsWith('.vercel.app')) return true;
  if (normalized.endsWith('.run.app')) return true;
  if (normalized.endsWith('.onrender.com')) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized)) return true;
  if (process.env.NODE_ENV !== 'production') return true;
  return false;
}

async function startServer() {
  // Initialize seed users (Admin & demo customer)
  initSeedUsers();

  // Start inventory automated background cron job
  startInventoryCron();

  const app = express();

  // -------------------------------------------------------------------------
  // CORS — allow Vercel frontend, Google AI Studio / Cloud Run, Render, and local dev
  // -------------------------------------------------------------------------
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Render health checks, same-origin)
        if (!origin || isOriginAllowed(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  app.use(express.json());

  // -------------------------------------------------------------------------
  // Health & Diagnostics
  // -------------------------------------------------------------------------
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Slice & Fire API',
      port: PORT,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/ports-status', (_req, res) => {
    res.json({
      architecture: 'Single-Port API (Render) + SPA (Vercel)',
      apiService: {
        port: PORT,
        status: 'ONLINE',
        description: 'Customer storefront, artisan pizza customizer, checkout, order tracking, and admin operations',
      },
      rbac: {
        enforced: true,
        roles: ['CUSTOMER', 'ADMIN'],
        permissions: ROLE_PERMISSIONS,
      },
    });
  });

  app.get('/api/db-status', (_req, res) => {
    res.json({
      status: 'ok',
      db: getDbStatus(),
      timestamp: new Date().toISOString(),
    });
  });

  // -------------------------------------------------------------------------
  // Customer API Routes
  // -------------------------------------------------------------------------
  app.use('/api/auth', authRoutes);
  app.use('/api/pizzas', pizzaRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/architecture', architectureRoutes);

  // -------------------------------------------------------------------------
  // Admin Operations — RBAC enforced at route middleware level
  // -------------------------------------------------------------------------

  // Dedicated Admin Auth Login Endpoint
  app.post('/api/admin/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Admin email and password are required' });
      return;
    }

    const user = db.findUserByEmail(email);

    // Strict RBAC: Deny non-admin roles
    if (user && user.role !== 'ADMIN') {
      logRbacEvent(
        PORT,
        user.role,
        '/api/admin/auth/login',
        'DENIED',
        `RBAC Violation: Role '${user.role}' attempted admin login. Access restricted to 'ADMIN' role.`,
        user.email
      );

      res.status(403).json({
        error: `RBAC Access Denied: Role '${user.role}' is not permitted to access admin endpoints. Only 'ADMIN' accounts can authenticate here.`,
        rbacViolation: true,
        userRole: user.role,
        requiredRole: 'ADMIN',
      });
      return;
    }

    if (!user || user.role !== 'ADMIN') {
      logRbacEvent(
        PORT,
        'INVALID',
        '/api/admin/auth/login',
        'DENIED',
        `Unknown admin email attempt: '${email}'`,
        email
      );
      res.status(401).json({ error: 'Invalid admin credentials or unauthorized' });
      return;
    }

    const isMatch = comparePassword(password, user.passwordHash);
    if (!isMatch) {
      logRbacEvent(
        PORT,
        'ADMIN',
        '/api/admin/auth/login',
        'DENIED',
        `Invalid password attempt for admin '${email}'`,
        email
      );
      res.status(401).json({ error: 'Invalid admin credentials' });
      return;
    }

    logRbacEvent(
      PORT,
      'ADMIN',
      '/api/admin/auth/login',
      'ALLOWED',
      `Admin '${user.email}' authenticated successfully`,
      user.email
    );

    const token = generateToken(user);
    res.json({
      message: 'Admin authenticated successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  });

  // Mount Admin Operations Routes
  app.use('/api/admin', adminRoutes);

  // -------------------------------------------------------------------------
  // Vite Middleware (Local Dev) & Static Client Serving (when dist exists)
  // -------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e: any) {
      console.warn('[Vite Middleware] Dev server running in API-only mode:', e?.message);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(path.join(distPath, 'index.html'))) {
      app.use(express.static(distPath));
      app.get('*all', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  // -------------------------------------------------------------------------
  // Start Server
  // -------------------------------------------------------------------------
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 Slice & Fire API running on http://0.0.0.0:${PORT}`);
    console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});

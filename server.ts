import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

import authRoutes from './server/routes/authRoutes.js';
import pizzaRoutes from './server/routes/pizzaRoutes.js';
import orderRoutes from './server/routes/orderRoutes.js';
import paymentRoutes from './server/routes/paymentRoutes.js';
import adminRoutes from './server/routes/adminRoutes.js';

import { initSeedUsers, comparePassword, generateToken } from './server/auth.js';
import { startInventoryCron } from './server/inventory.js';
import { PORTS_CONFIG, logRbacEvent, ROLE_PERMISSIONS } from './server/rbac.js';
import { db } from './server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const CLIENT_PORT = PORTS_CONFIG.CLIENT_PORT; // 3000
  const ADMIN_PORT = PORTS_CONFIG.ADMIN_PORT;   // 3001

  // Initialize seed users (Admin & demo customer)
  initSeedUsers();

  // Start inventory automated background cron job
  startInventoryCron();

  // =========================================================================
  // 1. DEDICATED ADMIN OPERATIONS SERVER (PORT 3001) - RBAC: ADMIN ONLY
  // =========================================================================
  const adminApp = express();
  adminApp.use(cors());
  adminApp.use(express.json());

  adminApp.use((_req, res, next) => {
    res.setHeader('X-Server-Port', `${ADMIN_PORT}`);
    res.setHeader('X-Service-Name', 'Slice & Fire Admin Ops Service');
    res.setHeader('X-RBAC-Required-Role', 'ADMIN');
    next();
  });

  // Admin Service Health Check
  adminApp.get('/api/admin/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Slice & Fire Admin Operations Service',
      port: ADMIN_PORT,
      rbacRoleRequired: 'ADMIN',
      timestamp: new Date().toISOString(),
    });
  });

  // Dedicated Admin Auth Login Endpoint on Port 3001
  adminApp.post('/api/admin/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Admin email and password are required' });
      return;
    }

    const user = db.findUserByEmail(email);

    // Strict RBAC: Deny non-admin roles on Port 3001
    if (user && user.role !== 'ADMIN') {
      logRbacEvent(
        ADMIN_PORT,
        user.role,
        '/api/admin/auth/login',
        'DENIED',
        `RBAC Violation: Role '${user.role}' attempted login on Admin Port ${ADMIN_PORT}. Access restricted to 'ADMIN' role.`,
        user.email
      );

      res.status(403).json({
        error: `RBAC Access Denied: Role '${user.role}' is not permitted on Admin Port ${ADMIN_PORT}. Only 'ADMIN' accounts can authenticate here.`,
        rbacViolation: true,
        userRole: user.role,
        requiredRole: 'ADMIN',
        targetPort: CLIENT_PORT,
      });
      return;
    }

    if (!user || user.role !== 'ADMIN') {
      logRbacEvent(
        ADMIN_PORT,
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
        ADMIN_PORT,
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
      ADMIN_PORT,
      'ADMIN',
      '/api/admin/auth/login',
      'ALLOWED',
      `Admin '${user.email}' authenticated successfully on Admin Port ${ADMIN_PORT}`,
      user.email
    );

    const token = generateToken(user);
    res.json({
      message: `Admin authenticated on Port ${ADMIN_PORT}`,
      token,
      port: ADMIN_PORT,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  });

  // Mount Admin Operations Routes on Port 3001
  adminApp.use('/api/admin', adminRoutes);

  // Start listening on Admin Port 3001
  adminApp.listen(ADMIN_PORT, '0.0.0.0', () => {
    console.log(`🛡️ Slice & Fire Admin Operations Server listening on http://0.0.0.0:${ADMIN_PORT}`);
  });

  // =========================================================================
  // 2. CLIENT PIZZA APPLICATION SERVER (PORT 3000) - RBAC: CUSTOMER PRIMARY
  // =========================================================================
  const clientApp = express();
  clientApp.use(cors());
  clientApp.use(express.json());

  clientApp.use((_req, res, next) => {
    res.setHeader('X-Server-Port', `${CLIENT_PORT}`);
    res.setHeader('X-Service-Name', 'Slice & Fire Client App');
    res.setHeader('X-RBAC-Role', 'CUSTOMER');
    next();
  });

  // Client Health check
  clientApp.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Slice & Fire Customer App',
      port: CLIENT_PORT,
      timestamp: new Date().toISOString(),
    });
  });

  // Dual-Port & RBAC Status Diagnostic endpoint
  clientApp.get('/api/ports-status', (_req, res) => {
    res.json({
      architecture: 'Dual-Port Architecture with RBAC',
      clientService: {
        port: CLIENT_PORT,
        status: 'ONLINE',
        allowedRole: 'CUSTOMER',
        description: 'Customer storefront, artisan pizza customizer, checkout, and order tracking',
      },
      adminService: {
        port: ADMIN_PORT,
        status: 'ONLINE',
        allowedRole: 'ADMIN',
        description: 'Operations console, inventory replenishment, live kitchen ticketing, and cron alerts',
      },
      rbac: {
        enforced: true,
        roles: ['CUSTOMER', 'ADMIN'],
        permissions: ROLE_PERMISSIONS,
      },
    });
  });

  // Client REST API Routes
  clientApp.use('/api/auth', authRoutes);
  clientApp.use('/api/pizzas', pizzaRoutes);
  clientApp.use('/api/orders', orderRoutes);
  clientApp.use('/api/payments', paymentRoutes);

  // Gateway Route to Admin Port 3001:
  // Forward browser admin requests from Port 3000 to the independent Admin service running on Port 3001
  clientApp.use('/api/admin', async (req, res) => {
    try {
      const targetUrl = `http://127.0.0.1:${ADMIN_PORT}/api/admin${req.url}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Forwarded-From-Port': `${CLIENT_PORT}`,
        'X-Target-Port': `${ADMIN_PORT}`,
      };
      if (req.headers.authorization) {
        headers['authorization'] = req.headers.authorization;
      }

      const fetchOptions: RequestInit = {
        method: req.method,
        headers,
      };

      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
        fetchOptions.body = JSON.stringify(req.body);
      }

      const adminRes = await fetch(targetUrl, fetchOptions);
      res.status(adminRes.status);

      const serverPortHeader = adminRes.headers.get('x-server-port');
      if (serverPortHeader) res.setHeader('X-Server-Port', serverPortHeader);

      const contentType = adminRes.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await adminRes.json();
        res.json(data);
      } else {
        const text = await adminRes.text();
        res.send(text);
      }
    } catch (err: any) {
      console.error(`[Admin Proxy] Failed to proxy request to Admin Port ${ADMIN_PORT}:`, err.message);
      res.status(502).json({
        error: 'Admin Service Unavailable',
        message: `Could not connect to Admin Service on Port ${ADMIN_PORT}: ${err.message}`,
        adminPort: ADMIN_PORT,
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    clientApp.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    clientApp.use(express.static(distPath));
    clientApp.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  clientApp.listen(CLIENT_PORT, '0.0.0.0', () => {
    console.log(`🔥 Slice & Fire Client Application running on http://0.0.0.0:${CLIENT_PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});

import { Router, Response } from 'express';
import { db, OrderStatus } from '../db.js';
import { authenticateToken, AuthRequest } from '../auth.js';
import { checkInventoryThresholds } from '../inventory.js';
import {
  enforcePortRole,
  PORTS_CONFIG,
  getRbacAuditLogs,
  ROLE_PERMISSIONS,
  logRbacEvent,
} from '../rbac.js';

const router = Router();

// Protect all admin routes with authentication and strict RBAC port enforcement
router.use(authenticateToken as any, enforcePortRole('ADMIN', PORTS_CONFIG.ADMIN_PORT) as any);

// 1. Get dashboard stats & overview
router.get('/stats', (_req: AuthRequest, res: Response) => {
  const orders = db.getOrders();
  const inventory = db.getInventory();
  const emailLogs = db.getEmailLogs();
  const cronStats = db.getCronStats();

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + o.total, 0);

  const lowStockCount = inventory.filter((i) => i.stock <= i.threshold).length;
  const activeOrdersCount = orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length;

  res.json({
    totalOrders: orders.length,
    activeOrders: activeOrdersCount,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    lowStockCount,
    totalInventoryItems: inventory.length,
    alertsSentCount: emailLogs.length,
    cronStats,
    serverPort: PORTS_CONFIG.ADMIN_PORT,
    rbacRole: 'ADMIN',
  });
});

// 2. Inventory Dashboard - Get all stock
router.get('/inventory', (_req: AuthRequest, res: Response) => {
  const inventory = db.getInventory();
  res.json({ inventory });
});

// 3. Manual stock update capability for each inventory item
router.patch('/inventory/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { stock, threshold, price } = req.body;

  const item = db.getInventoryItem(id);
  if (!item) {
    res.status(404).json({ error: 'Inventory item not found' });
    return;
  }

  const updates: any = {};
  if (typeof stock === 'number') updates.stock = Math.max(0, Math.round(stock));
  if (typeof threshold === 'number') updates.threshold = Math.max(1, Math.round(threshold));
  if (typeof price === 'number') updates.price = Number(price.toFixed(2));

  const updated = db.updateInventoryItem(id, updates);

  // Trigger threshold check if stock was altered
  checkInventoryThresholds(false).catch(console.error);

  res.json({
    message: 'Inventory item updated successfully',
    item: updated,
  });
});

// 4. Trigger manual stock check / run cron on demand
router.post('/inventory/check-now', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await checkInventoryThresholds(true);
    res.json({
      message: 'Inventory threshold scan completed',
      result,
      stats: db.getCronStats(),
    });
  } catch (err) {
    console.error('Manual check error:', err);
    res.status(500).json({ error: 'Could not complete inventory check' });
  }
});

// 5. Restock all inventory to full levels
router.post('/inventory/restock', (_req: AuthRequest, res: Response) => {
  db.resetInventory();
  res.json({
    message: 'All inventory items have been reset to factory stock levels',
    inventory: db.getInventory(),
  });
});

// 6. View automated email notification outbox & dispatch history
router.get('/inventory/alerts', (_req: AuthRequest, res: Response) => {
  const logs = db.getEmailLogs();
  const cronStats = db.getCronStats();
  res.json({ logs, cronStats });
});

// 7. Order Management Panel: View all incoming orders
router.get('/orders', (_req: AuthRequest, res: Response) => {
  const orders = db.getOrders();
  res.json({ orders });
});

// 8. Order Management Panel: Update status for each order
router.patch('/orders/:id/status', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, note } = req.body;

  const validStatuses: OrderStatus[] = [
    'Order Received',
    'In Kitchen',
    'Sent to Delivery',
    'Delivered',
    'Cancelled',
  ];

  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
    return;
  }

  const updated = db.updateOrderStatus(id, status, note);
  if (!updated) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  res.json({
    message: `Order #${id} status updated to ${status}`,
    order: updated,
  });
});

// 9. RBAC Audit Logs - View live permission events on Port 3001
router.get('/rbac/logs', (_req: AuthRequest, res: Response) => {
  const logs = getRbacAuditLogs();
  res.json({
    port: PORTS_CONFIG.ADMIN_PORT,
    roleRequired: 'ADMIN',
    logs,
  });
});

// 10. RBAC Matrix - View complete permission mapping
router.get('/rbac/matrix', (_req: AuthRequest, res: Response) => {
  res.json({
    ports: PORTS_CONFIG,
    roles: ['CUSTOMER', 'ADMIN'],
    permissions: ROLE_PERMISSIONS,
    portAllocation: {
      client: {
        port: PORTS_CONFIG.CLIENT_PORT,
        primaryRole: 'CUSTOMER',
        description: 'Customer ordering, pizza customization, and payment portal',
      },
      admin: {
        port: PORTS_CONFIG.ADMIN_PORT,
        primaryRole: 'ADMIN',
        description: 'Operations console, inventory replenishment, kitchen dispatch, and cron management',
      },
    },
  });
});

// 11. Interactive RBAC Cross-Port Simulation
// Simulates an unauthorized request from a CUSTOMER role to demonstrate RBAC rejection
router.post('/rbac/simulate-cross-port-test', (req: AuthRequest, res: Response) => {
  const simulatedCustomerEmail = req.body.email || 'customer@sliceandfire.com';
  
  // Log the simulated violation
  logRbacEvent(
    PORTS_CONFIG.ADMIN_PORT,
    'CUSTOMER',
    '/api/admin/inventory/restock',
    'DENIED',
    `Simulated RBAC Test: Customer account '${simulatedCustomerEmail}' attempted privileged operation on Admin Port ${PORTS_CONFIG.ADMIN_PORT}`,
    simulatedCustomerEmail
  );

  res.status(403).json({
    error: 'RBAC Authorization Failed',
    simulated: true,
    message: `Access denied. Port ${PORTS_CONFIG.ADMIN_PORT} is strictly restricted to role 'ADMIN'. Your role 'CUSTOMER' lacks required permissions: ['admin:access', 'inventory:update_stock'].`,
    port: PORTS_CONFIG.ADMIN_PORT,
    userRole: 'CUSTOMER',
    requiredRole: 'ADMIN',
    status: 403,
    timestamp: new Date().toISOString(),
  });
});

export default router;

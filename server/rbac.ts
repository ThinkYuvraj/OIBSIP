import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface RbacAuditLog {
  id: string;
  timestamp: string;
  port: number;
  role: UserRole | 'ANONYMOUS' | 'INVALID';
  userEmail?: string;
  action: string;
  outcome: 'ALLOWED' | 'DENIED';
  reason: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  CUSTOMER: [
    'menu:browse',
    'pizza:build_custom',
    'order:create',
    'order:view_own',
    'payment:submit',
  ],
  ADMIN: [
    'admin:access',
    'inventory:view_all',
    'inventory:update_stock',
    'inventory:restock',
    'kitchen:change_status',
    'cron:trigger_alerts',
    'cron:view_email_logs',
    'rbac:view_audit_logs',
  ],
};

export const PORTS_CONFIG = {
  CLIENT_PORT: process.env.CLIENT_PORT ? parseInt(process.env.CLIENT_PORT) : 3000,
  ADMIN_PORT: process.env.ADMIN_PORT ? parseInt(process.env.ADMIN_PORT) : 3001,
};

// In-memory RBAC audit store (last 100 events)
const rbacAuditLogs: RbacAuditLog[] = [
  {
    id: `rbac-init-1`,
    timestamp: new Date().toISOString(),
    port: PORTS_CONFIG.ADMIN_PORT,
    role: 'ADMIN',
    userEmail: 'system@sliceandfire.com',
    action: 'admin:service_boot',
    outcome: 'ALLOWED',
    reason: `Admin operations server initialized on dedicated port ${PORTS_CONFIG.ADMIN_PORT} with strict RBAC`,
  },
  {
    id: `rbac-init-2`,
    timestamp: new Date().toISOString(),
    port: PORTS_CONFIG.CLIENT_PORT,
    role: 'CUSTOMER',
    userEmail: 'system@sliceandfire.com',
    action: 'client:service_boot',
    outcome: 'ALLOWED',
    reason: `Client pizza delivery server initialized on client port ${PORTS_CONFIG.CLIENT_PORT}`,
  },
];

export function logRbacEvent(
  port: number,
  role: UserRole | 'ANONYMOUS' | 'INVALID',
  action: string,
  outcome: 'ALLOWED' | 'DENIED',
  reason: string,
  userEmail?: string
) {
  const log: RbacAuditLog = {
    id: `rbac-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    port,
    role,
    userEmail,
    action,
    outcome,
    reason,
  };

  rbacAuditLogs.unshift(log);
  if (rbacAuditLogs.length > 100) {
    rbacAuditLogs.pop();
  }
}

export function getRbacAuditLogs(): RbacAuditLog[] {
  return [...rbacAuditLogs];
}

/**
 * Middleware: Enforce port-level role restriction.
 * Admin Port 3001 MUST only be accessible to users with 'ADMIN' role.
 */
export function enforcePortRole(requiredRole: UserRole, targetPort: number) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      logRbacEvent(
        targetPort,
        'ANONYMOUS',
        req.path,
        'DENIED',
        `Unauthenticated request to restricted port ${targetPort}`,
        undefined
      );
      res.status(401).json({
        error: 'Authentication Required',
        message: `Authentication is mandatory to access services on Port ${targetPort}`,
        port: targetPort,
        requiredRole,
      });
      return;
    }

    if (user.role !== requiredRole) {
      logRbacEvent(
        targetPort,
        user.role as UserRole,
        req.path,
        'DENIED',
        `Role mismatch on Port ${targetPort}: user has role '${user.role}' but '${requiredRole}' is strictly required by RBAC policy`,
        user.email
      );

      res.status(403).json({
        error: 'RBAC Authorization Failed',
        message: `Access denied. Port ${targetPort} is restricted to role '${requiredRole}'. Your account possesses role '${user.role}'.`,
        port: targetPort,
        userRole: user.role,
        requiredRole,
        rbacViolation: true,
      });
      return;
    }

    logRbacEvent(
      targetPort,
      user.role as UserRole,
      req.path,
      'ALLOWED',
      `RBAC verified: Role '${user.role}' authorized on Port ${targetPort}`,
      user.email
    );

    next();
  };
}

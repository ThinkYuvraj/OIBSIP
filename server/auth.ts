import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { db, User } from './db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'slice-and-fire-artisan-jwt-secret-key-2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'CUSTOMER' | 'ADMIN';
    name: string;
  };
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

// Ensure default Admin and demo customer exist
export function initSeedUsers() {
  const adminEmail = 'admin@sliceandfire.com';
  const existingAdmin = db.findUserByEmail(adminEmail);
  if (!existingAdmin) {
    const adminUser: User = {
      id: 'usr-admin-1',
      name: 'Executive Chef Admin',
      email: adminEmail,
      passwordHash: hashPassword('Admin@12345'),
      role: 'ADMIN',
      isVerified: true,
      createdAt: new Date().toISOString(),
    };
    db.addUser(adminUser);
    console.log(`[Auth] Seeded default Admin user: ${adminEmail} (password: Admin@12345)`);
  }

  const demoCustomerEmail = 'customer@sliceandfire.com';
  const existingCustomer = db.findUserByEmail(demoCustomerEmail);
  if (!existingCustomer) {
    const demoCustomer: User = {
      id: 'usr-customer-1',
      name: 'Marco Bellini',
      email: demoCustomerEmail,
      passwordHash: hashPassword('Customer@123'),
      role: 'CUSTOMER',
      isVerified: true,
      createdAt: new Date().toISOString(),
    };
    db.addUser(demoCustomer);
    console.log(`[Auth] Seeded demo customer user: ${demoCustomerEmail}`);
  }
}

// Middleware: Authenticate JWT
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: 'CUSTOMER' | 'ADMIN';
      name: string;
    };
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }
}

// Middleware: Require Admin role
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Access denied: Admin privileges required' });
    return;
  }
  next();
}

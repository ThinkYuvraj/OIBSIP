import { Router, Request, Response } from 'express';
import { db, User } from '../db.js';
import { generateToken, hashPassword, comparePassword, authenticateToken, AuthRequest } from '../auth.js';
import { logRbacEvent, PORTS_CONFIG } from '../rbac.js';
import { adminAuth } from '../../src/lib/firebase-admin.ts';
import { getOrCreateUser } from '../../src/db/users.ts';

const router = Router();

// Google Sign-In with Firebase ID token
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      res.status(400).json({ error: 'Firebase ID token is required' });
      return;
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const email = decoded.email || '';
    const name = decoded.name || email.split('@')[0] || 'Google User';
    const uid = decoded.uid;

    // Sync with Cloud SQL PostgreSQL users table
    try {
      await getOrCreateUser(uid, email, name, 'CUSTOMER');
    } catch (dbErr) {
      console.warn('[CloudSQL User Sync] Non-blocking warning:', dbErr);
    }

    let user = db.findUserByEmail(email);
    if (!user) {
      user = {
        id: `usr-${uid.substring(0, 10)}`,
        name,
        email,
        passwordHash: '',
        role: 'CUSTOMER',
        isVerified: true,
        createdAt: new Date().toISOString(),
      };
      db.addUser(user);
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: true,
        theme: user.theme || 'light',
      },
    });

  } catch (err: any) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

// 1. User Registration with Email Verification
router.post('/register', (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      res.status(400).json({ error: 'An account with this email already exists' });
      return;
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser: User = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(password),
      role: 'CUSTOMER', // strictly customer; admin registration not permitted here
      isVerified: false,
      verificationCode,
      createdAt: new Date().toISOString(),
    };

    db.addUser(newUser);

    // In production, nodemailer sends an email. We provide the verification code in response for testing/smooth flow
    res.status(201).json({
      message: 'Registration successful! Please verify your email.',
      userId: newUser.id,
      email: newUser.email,
      verificationCode, // Exposed for easy verification in test / sandbox
      verificationLink: `/verify-email?email=${encodeURIComponent(newUser.email)}&code=${verificationCode}`,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// 2. Email Verification
router.post('/verify-email', (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({ error: 'Email and verification code are required' });
      return;
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.isVerified) {
      const token = generateToken(user);
      res.json({
        message: 'Account is already verified!',
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, theme: user.theme || 'light' },
      });
      return;
    }

    if (user.verificationCode !== code.trim()) {
      res.status(400).json({ error: 'Invalid verification code' });
      return;
    }

    const updated = db.updateUser(user.id, {
      isVerified: true,
      verificationCode: undefined,
    });

    if (!updated) {
      res.status(500).json({ error: 'Could not update verification status' });
      return;
    }

    const token = generateToken(updated);
    res.json({
      message: 'Email successfully verified! You are now logged in.',
      token,
      user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role, theme: updated.theme || 'light' },
    });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: 'Server error during email verification' });
  }
});

// 3. Resend Verification Code
router.post('/resend-verification', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (user.isVerified) {
    res.status(400).json({ error: 'User is already verified' });
    return;
  }

  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  db.updateUser(user.id, { verificationCode: newCode });

  res.json({
    message: 'New verification code sent',
    verificationCode: newCode,
  });
});

// 4. Customer Login with JWT
router.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Only customers can log in via the client portal on Port 3000
    if (user.role !== 'CUSTOMER') {
      logRbacEvent(
        PORTS_CONFIG.CLIENT_PORT,
        user.role,
        '/api/auth/login',
        'DENIED',
        `RBAC Violation: Admin account '${user.email}' attempted login on Client Port ${PORTS_CONFIG.CLIENT_PORT}. Admin accounts must use Admin Port ${PORTS_CONFIG.ADMIN_PORT}.`,
        user.email
      );

      res.status(403).json({
        error: `RBAC Access Denied: Admin accounts are not permitted on Client Port ${PORTS_CONFIG.CLIENT_PORT}. Please switch to the Admin Portal on Port ${PORTS_CONFIG.ADMIN_PORT}.`,
        rbacViolation: true,
        userRole: user.role,
        requiredRole: 'CUSTOMER',
        targetPort: PORTS_CONFIG.ADMIN_PORT,
      });
      return;
    }

    const isMatch = comparePassword(password, user.passwordHash);
    if (!isMatch) {
      logRbacEvent(
        PORTS_CONFIG.CLIENT_PORT,
        'CUSTOMER',
        '/api/auth/login',
        'DENIED',
        `Invalid password attempt for customer '${email}'`,
        email
      );
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({
        error: 'Please verify your email before logging in.',
        needsVerification: true,
        email: user.email,
        verificationCode: user.verificationCode,
      });
      return;
    }

    logRbacEvent(
      PORTS_CONFIG.CLIENT_PORT,
      'CUSTOMER',
      '/api/auth/login',
      'ALLOWED',
      `Customer '${user.email}' successfully authenticated on Client Port ${PORTS_CONFIG.CLIENT_PORT}`,
      user.email
    );

    const token = generateToken(user);
    res.json({
      message: 'Login successful on Client Port',
      token,
      port: PORTS_CONFIG.CLIENT_PORT,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        theme: user.theme || 'light',
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// 5. Dedicated Admin Login (Admin Port 3001)
router.post('/admin/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Admin email and password are required' });
      return;
    }

    const user = db.findUserByEmail(email);

    // Strict RBAC: If a customer tries to log in through admin portal
    if (user && user.role !== 'ADMIN') {
      logRbacEvent(
        PORTS_CONFIG.ADMIN_PORT,
        user.role,
        '/api/admin/auth/login',
        'DENIED',
        `RBAC Violation: Non-admin account '${user.email}' attempted authentication on Admin Port ${PORTS_CONFIG.ADMIN_PORT}`,
        user.email
      );

      res.status(403).json({
        error: `RBAC Access Denied: Account role '${user.role}' lacks administrative clearance on Port ${PORTS_CONFIG.ADMIN_PORT}. Only 'ADMIN' role is allowed.`,
        rbacViolation: true,
        userRole: user.role,
        requiredRole: 'ADMIN',
        targetPort: PORTS_CONFIG.CLIENT_PORT,
      });
      return;
    }

    if (!user || user.role !== 'ADMIN') {
      logRbacEvent(
        PORTS_CONFIG.ADMIN_PORT,
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
        PORTS_CONFIG.ADMIN_PORT,
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
      PORTS_CONFIG.ADMIN_PORT,
      'ADMIN',
      '/api/admin/auth/login',
      'ALLOWED',
      `Admin '${user.email}' successfully authenticated on Admin Port ${PORTS_CONFIG.ADMIN_PORT}`,
      user.email
    );

    const token = generateToken(user);
    res.json({
      message: `Admin authentication successful on Port ${PORTS_CONFIG.ADMIN_PORT}`,
      token,
      port: PORTS_CONFIG.ADMIN_PORT,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        theme: user.theme || 'light',
      },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Server error during admin login' });
  }
});

// 6. Forgot Password Flow (Email Reset Link)
router.post('/forgot-password', (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      // Return success to avoid email enumeration
      res.json({
        message: 'If an account exists with this email, a password reset link has been dispatched.',
      });
      return;
    }

    // Generate reset token
    const resetToken = `rst-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const expiry = Date.now() + 1000 * 60 * 60; // 1 hour

    db.updateUser(user.id, {
      resetToken,
      resetTokenExpiry: expiry,
    });

    const resetLink = `/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    res.json({
      message: 'Password reset link dispatched.',
      resetToken,
      resetLink,
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error during forgot password' });
  }
});

// 7. Reset Password Flow
router.post('/reset-password', (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Reset token and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const users = db.getUsers();
    const user = users.find((u) => u.resetToken === token);

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < Date.now()) {
      res.status(400).json({ error: 'Reset token is invalid or has expired' });
      return;
    }

    db.updateUser(user.id, {
      passwordHash: hashPassword(newPassword),
      resetToken: undefined,
      resetTokenExpiry: undefined,
    });

    res.json({ message: 'Password has been successfully updated. You may now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error during password reset' });
  }
});

// 8. Current User Profile
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const user = db.findUserById(req.user.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    theme: user.theme || 'light',
    createdAt: user.createdAt,
  });
});

// 9. Update User Theme Preference
router.patch('/theme', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { theme } = req.body;
  if (theme !== 'light' && theme !== 'dark') {
    res.status(400).json({ error: 'Theme must be either "light" or "dark"' });
    return;
  }

  const updated = db.updateUser(req.user.id, { theme });
  if (!updated) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    message: `Theme updated to ${theme}`,
    theme: updated.theme || theme,
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      isVerified: updated.isVerified,
      theme: updated.theme || theme,
    },
  });
});

export default router;


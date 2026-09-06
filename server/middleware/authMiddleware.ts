import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebaseAdmin.js';
import { DecodedIdToken } from 'firebase-admin/auth';
import { getOrCreateUser } from '../db/users.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken & {
    id?: string;
    role?: string;
  };
}

export const requireFirebaseAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing token' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;

    if (decodedToken.uid && decodedToken.email) {
      try {
        await getOrCreateUser(decodedToken.uid, decodedToken.email, decodedToken.name);
      } catch (syncErr) {
        console.warn('[AuthMiddleware] User sync warning:', syncErr);
      }
    }

    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return;
  }
};

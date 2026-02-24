import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/auth';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.accessToken || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

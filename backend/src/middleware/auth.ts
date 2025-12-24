import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface AuthRequest extends Request {
  userId?: number;
  user?: {
    id: number;
    email: string;
    subscriptionTier: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    
    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: number;
      email: string;
      subscriptionTier: string;
    };
    
    req.userId = decoded.userId;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      subscriptionTier: decoded.subscriptionTier,
    };
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwt.secret) as {
        userId: number;
        email: string;
        subscriptionTier: string;
      };
      
      req.userId = decoded.userId;
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        subscriptionTier: decoded.subscriptionTier,
      };
    }
    
    next();
  } catch (error) {
    next();
  }
};



import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface TokenPayload {
  userId: number;
  email: string;
  subscriptionTier: string;
}

export const generateToken = (payload: TokenPayload): string => {
  // expiresIn accepts string (like '7d', '1h') or number (seconds)
  // StringValue is a branded type from 'ms' package, but string values work at runtime
  // Using 'as any' to bypass TypeScript's strict type checking for StringValue
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as any,
  });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
};



import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface TokenPayload {
  userId: number;
  email: string;
  subscriptionTier: string;
}

export const generateToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: config.jwt.expiresIn as string | number,
  };
  return jwt.sign(payload, config.jwt.secret, options);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
};



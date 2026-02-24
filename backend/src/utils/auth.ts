import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

export const hashPassword = (password: string) => bcrypt.hash(password, 10);
export const comparePassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export const signAccessToken = (userId: string) => jwt.sign({ userId }, env.accessSecret, { expiresIn: env.accessTtl });
export const signRefreshToken = (userId: string) => jwt.sign({ userId }, env.refreshSecret, { expiresIn: env.refreshTtl });

export const verifyAccessToken = (token: string): { userId: string } => jwt.verify(token, env.accessSecret) as { userId: string };
export const verifyRefreshToken = (token: string): { userId: string } => jwt.verify(token, env.refreshSecret) as { userId: string };

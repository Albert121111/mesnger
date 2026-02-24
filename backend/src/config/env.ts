import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });
dotenv.config();

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const env = {
  host: process.env.BACKEND_HOST || '0.0.0.0',
  port: Number(process.env.BACKEND_PORT || 4000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  corsOrigins: allowedOrigins,
  accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh',
  accessTtl: Number(process.env.ACCESS_TOKEN_TTL || 900),
  refreshTtl: Number(process.env.REFRESH_TOKEN_TTL || 2_592_000),
  uploadDir: process.env.UPLOAD_DIR || 'uploads'
};

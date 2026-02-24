import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

export const env = {
  port: Number(process.env.BACKEND_PORT || 4000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh',
  accessTtl: Number(process.env.ACCESS_TOKEN_TTL || 900),
  refreshTtl: Number(process.env.REFRESH_TOKEN_TTL || 2_592_000),
  uploadDir: process.env.UPLOAD_DIR || 'uploads'
};

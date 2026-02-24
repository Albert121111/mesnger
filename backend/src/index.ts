import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './config/env';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import chatRoutes from './routes/chats';
import messageRoutes from './routes/messages';
import callRoutes from './routes/calls';
import { authRequired } from './middleware/auth';
import { prisma } from './db/prisma';
import { initSockets } from './sockets';

const app = express();
const httpServer = createServer(app);

const isAllowedOrigin = (origin?: string) => {
  if (!origin) return true;
  if (env.corsOrigins.includes(origin)) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
};

const corsDelegate: cors.CorsOptionsDelegate = (req, callback) => {
  const origin = req.header('Origin');
  callback(null, {
    origin: isAllowedOrigin(origin),
    credentials: true
  });
};

const io = new Server(httpServer, { cors: { origin: (origin, cb) => cb(null, isAllowedOrigin(origin)), credentials: true } });
app.set('io', io);
initSockets(io);

app.use(cors(corsDelegate));
app.options('*', cors(corsDelegate));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.resolve(process.cwd(), env.uploadDir)));
app.use('/auth', rateLimit({ windowMs: 60_000, max: 30 }), authRoutes);
app.use('/users', userRoutes);
app.use('/chats', chatRoutes);
app.use('/messages', rateLimit({ windowMs: 10_000, max: 60 }), messageRoutes);
app.use('/calls', callRoutes);
app.get('/auth/me', authRequired, async (req, res) => res.json(await prisma.user.findUnique({ where: { id: req.userId } })));
app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

httpServer.listen(env.port, () => console.log(`Backend on port ${env.port} (host bind: all interfaces)`));

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '../generated/sqlite-client';

const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });
const port = Number(process.env.DESKTOP_BACKEND_PORT || 4010);
const secret = process.env.JWT_ACCESS_SECRET || 'desktop_secret';
const uploadDir = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'desktop-data/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(uploadDir));

const auth = (req: any, res: any, next: any) => {
  const token = req.cookies.accessToken || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try { req.userId = (jwt.verify(token, secret) as any).userId; next(); } catch { return res.status(401).json({ message: 'Unauthorized' }); }
};

app.post('/auth/register', async (req, res) => {
  const u = await prisma.user.create({ data: { email: req.body.email, username: req.body.username.replace('@','').toLowerCase(), displayName: req.body.displayName, passwordHash: await bcrypt.hash(req.body.password, 10) } });
  const token = jwt.sign({ userId: u.id }, secret, { expiresIn: '7d' });
  res.cookie('accessToken', token, { httpOnly: true, sameSite: 'lax' });
  res.json({ user: u });
});
app.post('/auth/login', async (req, res) => {
  const login = req.body.login.replace('@','').toLowerCase();
  const u = await prisma.user.findFirst({ where: { OR: [{ email: login }, { username: login }] } });
  if (!u || !(await bcrypt.compare(req.body.password, u.passwordHash))) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ userId: u.id }, secret, { expiresIn: '7d' });
  res.cookie('accessToken', token, { httpOnly: true, sameSite: 'lax' });
  res.json({ user: u });
});
app.get('/auth/me', auth, async (req: any, res) => res.json(await prisma.user.findUnique({ where: { id: req.userId } })));
app.get('/users/me', auth, async (req: any, res) => res.json(await prisma.user.findUnique({ where: { id: req.userId } })));
app.get('/users/search', auth, async (req: any, res) => {
  const q = String(req.query.q || '').replace('@','').toLowerCase();
  const users = await prisma.user.findMany({ where: { username: { contains: q }, id: { not: req.userId } }, take: 20 });
  res.json(users);
});
app.get('/chats', auth, async (req: any, res) => {
  const cps = await prisma.chatParticipant.findMany({ where: { userId: req.userId }, include: { chat: { include: { participants: { include: { user: true } } } } } });
  res.json(cps.map((c) => c.chat));
});
app.post('/chats/direct', auth, async (req: any, res) => {
  const peerId = req.body.userId;
  const mine = await prisma.chatParticipant.findMany({ where: { userId: req.userId }, select: { chatId: true } });
  const existing = await prisma.chatParticipant.findFirst({ where: { userId: peerId, chatId: { in: mine.map((m) => m.chatId) } } });
  if (existing) return res.json(await prisma.chat.findUnique({ where: { id: existing.chatId }, include: { participants: { include: { user: true } } } }));
  const chat = await prisma.chat.create({ data: { participants: { create: [{ userId: req.userId }, { userId: peerId }] } }, include: { participants: { include: { user: true } } } });
  res.json(chat);
});
app.get('/chats/:chatId/messages', auth, async (req, res) => res.json(await prisma.message.findMany({ where: { chatId: req.params.chatId }, orderBy: { createdAt: 'asc' } })));
app.post('/messages', auth, async (req: any, res) => {
  const m = await prisma.message.create({ data: { chatId: req.body.chatId, senderId: req.userId, text: req.body.text, type: req.body.type || 'TEXT' } });
  io.to(req.body.chatId).emit('message:new', m);
  res.json(m);
});
app.get('/health', (_req, res) => res.json({ ok: true, mode: 'desktop' }));

io.on('connection', (s) => {
  s.on('auth:join-user-room', async ({ userId }) => {
    const parts = await prisma.chatParticipant.findMany({ where: { userId }, select: { chatId: true } });
    parts.forEach((p) => s.join(p.chatId));
  });
  ['call:invite','call:accept','call:end','webrtc:offer','webrtc:answer','webrtc:ice-candidate'].forEach((event) => s.on(event, (payload) => s.broadcast.emit(event, payload)));
});

httpServer.listen(port, () => console.log('Desktop backend on', port));

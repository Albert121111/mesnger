import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authRequired } from '../middleware/auth';

const router = Router();
router.use(authRequired);

router.get('/me', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId }, include: { settings: true } });
  res.json(user);
});

router.patch('/me', async (req, res) => {
  const body = z.object({ displayName: z.string().optional(), username: z.string().optional(), bio: z.string().max(160).nullable().optional(), phone: z.string().nullable().optional(), isSearchableByUsername: z.boolean().optional() }).parse(req.body);
  const user = await prisma.user.update({ where: { id: req.userId }, data: { ...body, username: body.username?.replace('@', '').toLowerCase() } });
  res.json(user);
});

router.get('/search', async (req, res) => {
  const qRaw = String(req.query.q || '').trim();
  const q = qRaw.replace('@', '').toLowerCase();
  if (!q) return res.json([]);
  const users = await prisma.user.findMany({ where: { id: { not: req.userId }, isSearchableByUsername: true, OR: [{ username: { contains: q, mode: 'insensitive' } }, { displayName: { contains: q, mode: 'insensitive' } }] }, take: 20, select: { id: true, username: true, displayName: true, avatarUrl: true, isOnline: true } });
  res.json(users);
});

router.get('/:username', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { username: req.params.username.replace('@', '').toLowerCase() }, select: { id: true, username: true, displayName: true, bio: true, avatarUrl: true, isOnline: true, lastSeenAt: true } });
  if (!user) return res.status(404).json({ message: 'Not found' });
  res.json(user);
});

export default router;

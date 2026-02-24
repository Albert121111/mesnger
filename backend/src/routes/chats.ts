import { Router } from 'express';
import { prisma } from '../db/prisma';
import { authRequired } from '../middleware/auth';

const router = Router();
router.use(authRequired);

router.get('/', async (req, res) => {
  const chats = await prisma.chatParticipant.findMany({ where: { userId: req.userId, isArchived: false }, include: { chat: { include: { participants: { include: { user: true } }, messages: { take: 1, orderBy: { createdAt: 'desc' }, include: { sender: true, attachments: true } } } } }, orderBy: { chat: { lastMessageAt: 'desc' } } });
  res.json(chats.map((c) => c.chat));
});

router.post('/direct', async (req, res) => {
  const { userId } = req.body as { userId: string };
  const me = req.userId!;
  const existing = await prisma.chat.findFirst({ where: { type: 'DIRECT', participants: { every: { userId: { in: [me, userId] } }, some: { userId: me } } } });
  if (existing) return res.json(existing);
  const chat = await prisma.chat.create({ data: { type: 'DIRECT', participants: { create: [{ userId: me }, { userId }] } } });
  res.json(chat);
});

router.get('/:chatId/messages', async (req, res) => {
  const messages = await prisma.message.findMany({ where: { chatId: req.params.chatId, deletionsForUsers: { none: { userId: req.userId } } }, include: { sender: true, attachments: true }, orderBy: { createdAt: 'asc' } });
  res.json(messages);
});

router.patch('/:chatId/read', async (req, res) => {
  await prisma.chatParticipant.updateMany({ where: { chatId: req.params.chatId, userId: req.userId }, data: { lastReadMessageId: req.body.lastReadMessageId } });
  res.json({ ok: true });
});

export default router;

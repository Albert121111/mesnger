import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authRequired } from '../middleware/auth';
import { prisma } from '../db/prisma';

const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir, limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();
router.use(authRequired);

router.post('/', async (req, res) => {
  const { chatId, text, replyToMessageId, attachments = [], type = 'TEXT', forwardedFromMessageId } = req.body;
  const message = await prisma.message.create({ data: { chatId, senderId: req.userId!, text, replyToMessageId, forwardedFromMessageId, type, attachments: { create: attachments } }, include: { sender: true, attachments: true } });
  await prisma.chat.update({ where: { id: chatId }, data: { lastMessageAt: new Date() } });
  req.app.get('io').to(chatId).emit('message:new', message);
  res.json(message);
});

router.patch('/:id', async (req, res) => {
  const msg = await prisma.message.findUniqueOrThrow({ where: { id: req.params.id } });
  if (msg.senderId !== req.userId) return res.status(403).json({ message: 'Forbidden' });
  const previousText = msg.text || '';
  const updated = await prisma.message.update({ where: { id: msg.id }, data: { text: req.body.text, isEdited: true, editedAt: new Date() } });
  await prisma.messageEditHistory.create({ data: { messageId: msg.id, previousText, newText: req.body.text, editedByUserId: req.userId! } });
  req.app.get('io').to(msg.chatId).emit('message:updated', updated);
  res.json({ ...updated, previousText });
});

router.post('/:id/undo-edit', async (req, res) => {
  const last = await prisma.messageEditHistory.findFirst({ where: { messageId: req.params.id }, orderBy: { createdAt: 'desc' } });
  if (!last) return res.status(404).json({ message: 'No history' });
  const updated = await prisma.message.update({ where: { id: req.params.id }, data: { text: last.previousText } });
  res.json(updated);
});

router.post('/:id/delete-for-me', async (req, res) => {
  await prisma.messageDeletionForUser.upsert({ where: { messageId_userId: { messageId: req.params.id, userId: req.userId! } }, update: {}, create: { messageId: req.params.id, userId: req.userId! } });
  res.json({ ok: true });
});

router.post('/:id/delete-for-everyone', async (req, res) => {
  const msg = await prisma.message.findUniqueOrThrow({ where: { id: req.params.id } });
  if (msg.senderId !== req.userId) return res.status(403).json({ message: 'Forbidden' });
  const updated = await prisma.message.update({ where: { id: req.params.id }, data: { deletedForEveryoneAt: new Date(), text: 'Сообщение удалено', attachments: { deleteMany: {} } } });
  req.app.get('io').to(msg.chatId).emit('message:deleted-for-everyone', updated);
  res.json(updated);
});

router.post('/:id/forward', async (req, res) => {
  const msg = await prisma.message.findUniqueOrThrow({ where: { id: req.params.id }, include: { attachments: true } });
  const targetChatIds: string[] = req.body.targetChatIds;
  const created = await Promise.all(targetChatIds.map((chatId) => prisma.message.create({ data: { chatId, senderId: req.userId!, text: msg.text, type: msg.type, forwardedFromMessageId: msg.id, attachments: { create: msg.attachments.map((a) => ({ kind: a.kind, url: a.url, fileName: a.fileName, mimeType: a.mimeType, fileSize: a.fileSize })) } } })));
  res.json(created);
});

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file' });
  res.json({ url: `/uploads/${req.file.filename}`, fileName: req.file.originalname, mimeType: req.file.mimetype, fileSize: req.file.size, kind: req.file.mimetype.startsWith('image') ? 'IMAGE' : 'FILE' });
});

router.post('/voice', upload.single('voice'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No voice' });
  res.json({ url: `/uploads/${req.file.filename}`, fileName: req.file.originalname, mimeType: req.file.mimetype, fileSize: req.file.size, durationSec: Number(req.body.durationSec || 0), kind: 'VOICE' });
});

export default router;

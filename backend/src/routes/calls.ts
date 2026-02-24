import { Router } from 'express';
import { authRequired } from '../middleware/auth';
import { prisma } from '../db/prisma';

const router = Router();
router.use(authRequired);

router.post('/start', async (req, res) => {
  const { chatId, recipientId, type } = req.body;
  const call = await prisma.call.create({ data: { chatId, initiatorId: req.userId!, recipientId, type, status: 'ONGOING', startedAt: new Date() } });
  res.json(call);
});

router.post('/:id/end', async (req, res) => {
  const call = await prisma.call.update({ where: { id: req.params.id }, data: { status: 'ENDED', endedAt: new Date(), durationSec: req.body.durationSec } });
  await prisma.message.create({ data: { chatId: call.chatId, senderId: req.userId!, type: 'CALL_EVENT', text: `${call.type === 'VIDEO' ? 'Видеозвонок' : 'Звонок'} завершён, ${call.durationSec || 0} сек.` } });
  res.json(call);
});

router.post('/:id/accept', async (req, res) => {
  const call = await prisma.call.update({ where: { id: req.params.id }, data: { status: 'ONGOING', startedAt: new Date() } });
  res.json(call);
});

export default router;

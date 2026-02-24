import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const pass = 'Test12345!';

async function main() {
  await prisma.messageDeletionForUser.deleteMany();
  await prisma.messageEditHistory.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chatParticipant.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.call.deleteMany();
  await prisma.session.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.user.deleteMany();

  const users = await Promise.all(Array.from({ length: 10 }).map((_, i) => prisma.user.create({ data: { email: `demo${i + 1}@mail.dev`, username: `demo${i + 1}`, displayName: `Demo User ${i + 1}`, passwordHash: bcrypt.hashSync(pass, 10), isOnline: i % 2 === 0, settings: { create: {} } } })));
  const [u1, u2, u3] = users;
  const chat = await prisma.chat.create({ data: { type: 'DIRECT', participants: { create: [{ userId: u1.id }, { userId: u2.id }] } } });
  await prisma.chat.create({ data: { type: 'DIRECT', participants: { create: [{ userId: u1.id }, { userId: u3.id }] } } });

  const m1 = await prisma.message.create({ data: { chatId: chat.id, senderId: u1.id, text: 'Привет! Это seeded chat.', type: 'TEXT' } });
  await prisma.message.create({ data: { chatId: chat.id, senderId: u2.id, text: 'Ответ с вложением', type: 'IMAGE', replyToMessageId: m1.id, attachments: { create: [{ kind: 'IMAGE', url: '/uploads/demo-image.jpg', fileName: 'demo-image.jpg', mimeType: 'image/jpeg', fileSize: 200000 }] } } });
  await prisma.message.create({ data: { chatId: chat.id, senderId: u1.id, type: 'VOICE', text: 'Голосовое', attachments: { create: [{ kind: 'VOICE', url: '/uploads/demo-voice.webm', fileName: 'demo-voice.webm', mimeType: 'audio/webm', fileSize: 32000, durationSec: 9 }] } } });

  await prisma.call.create({ data: { chatId: chat.id, initiatorId: u1.id, recipientId: u2.id, type: 'AUDIO', status: 'MISSED' } });
  await prisma.call.create({ data: { chatId: chat.id, initiatorId: u2.id, recipientId: u1.id, type: 'VIDEO', status: 'ENDED', durationSec: 723, startedAt: new Date(Date.now()-800000), endedAt: new Date() } });
}

main().finally(() => prisma.$disconnect());

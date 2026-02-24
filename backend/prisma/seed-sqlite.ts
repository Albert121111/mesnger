import { PrismaClient } from '../generated/sqlite-client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (await prisma.user.count()) return;
  const pass = await bcrypt.hash('Test12345!', 10);
  const u1 = await prisma.user.create({ data: { email: 'demo1@mail.dev', username: 'demo1', displayName: 'Demo User 1', passwordHash: pass } });
  const u2 = await prisma.user.create({ data: { email: 'demo2@mail.dev', username: 'demo2', displayName: 'Demo User 2', passwordHash: pass } });
  const chat = await prisma.chat.create({ data: { participants: { create: [{ userId: u1.id }, { userId: u2.id }] } } });
  await prisma.message.create({ data: { chatId: chat.id, senderId: u1.id, text: 'Desktop seeded message' } });
}

main().finally(() => prisma.$disconnect());

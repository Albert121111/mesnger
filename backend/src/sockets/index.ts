import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/auth';
import { prisma } from '../db/prisma';

export function initSockets(io: Server) {
  io.on('connection', (socket) => {
    const token = socket.handshake.auth?.token;
    let userId = '';
    try { userId = verifyAccessToken(token).userId; } catch { socket.disconnect(); return; }

    socket.join(`user:${userId}`);
    prisma.user.update({ where: { id: userId }, data: { isOnline: true, lastSeenAt: new Date() } }).catch(() => null);
    io.emit('presence:update', { userId, isOnline: true });

    socket.on('auth:join-user-room', async () => {
      const parts = await prisma.chatParticipant.findMany({ where: { userId }, select: { chatId: true } });
      parts.forEach((p) => socket.join(p.chatId));
    });

    socket.on('typing:start', ({ chatId }) => socket.to(chatId).emit('typing:start', { chatId, userId }));
    socket.on('typing:stop', ({ chatId }) => socket.to(chatId).emit('typing:stop', { chatId, userId }));

    ['call:invite','call:ringing','call:accept','call:decline','call:end','webrtc:offer','webrtc:answer','webrtc:ice-candidate'].forEach((event) => {
      socket.on(event, ({ toUserId, ...payload }) => io.to(`user:${toUserId}`).emit(event, { fromUserId: userId, ...payload }));
    });

    socket.on('disconnect', () => {
      prisma.user.update({ where: { id: userId }, data: { isOnline: false, lastSeenAt: new Date() } }).catch(() => null);
      io.emit('presence:update', { userId, isOnline: false });
    });
  });
}

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { comparePassword, hashPassword, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/auth';

const router = Router();

const authCookie = (res: any, accessToken: string, refreshToken: string) => {
  res.cookie('accessToken', accessToken, { httpOnly: true, sameSite: 'lax' });
  res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'lax' });
};

router.post('/register', async (req, res) => {
  try {
    const body = z.object({ email: z.string().email(), password: z.string().min(8), username: z.string().min(2), displayName: z.string().min(2) }).parse(req.body);
    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        passwordHash: await hashPassword(body.password),
        username: body.username.toLowerCase().replace('@', ''),
        displayName: body.displayName,
        settings: { create: {} }
      },
      include: { settings: true }
    });
    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);
    await prisma.session.create({ data: { userId: user.id, tokenHash: await hashPassword(refreshToken), expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), userAgent: req.headers['user-agent'], ipAddress: req.ip } });
    authCookie(res, accessToken, refreshToken);
    return res.json({ user });
  } catch (error: any) {
    if (error?.name === 'ZodError') return res.status(400).json({ message: 'Некорректные данные регистрации.' });
    if (String(error?.code) === 'P2002') return res.status(409).json({ message: 'Email или username уже используются.' });
    return res.status(500).json({ message: 'Не удалось зарегистрироваться.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const body = z.object({ login: z.string(), password: z.string() }).parse(req.body);
    const login = body.login.toLowerCase().replace('@', '');
    const user = await prisma.user.findFirst({ where: { OR: [{ email: login }, { username: login }] }, include: { settings: true } });
    if (!user || !(await comparePassword(body.password, user.passwordHash))) return res.status(401).json({ message: 'Invalid credentials' });
    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);
    await prisma.session.create({ data: { userId: user.id, tokenHash: await hashPassword(refreshToken), expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), userAgent: req.headers['user-agent'], ipAddress: req.ip } });
    authCookie(res, accessToken, refreshToken);
    return res.json({ user });
  } catch {
    return res.status(400).json({ message: 'Некорректные данные входа.' });
  }
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token' });
  const payload = verifyRefreshToken(token);
  const accessToken = signAccessToken(payload.userId);
  const refreshToken = signRefreshToken(payload.userId);
  authCookie(res, accessToken, refreshToken);
  return res.json({ ok: true });
});

router.post('/logout', async (_req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  return res.json({ ok: true });
});

export default router;

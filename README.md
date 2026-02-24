# Mesnger MVP+

## Быстрый старт

### Web mode (Docker, одной командой)
```bash
docker compose up --build
```
Поднимаются `postgres`, `backend`, `frontend`.
- Frontend: http://localhost:3000
- Backend: http://localhost:4000

Что происходит автоматически в backend-контейнере:
1. ожидание готовности Postgres;
2. `prisma generate`;
3. `prisma migrate deploy`;
4. seed, если база пустая;
5. запуск API.

## Локальный запуск без Docker

### Первый запуск
```bash
cp .env.example .env
npm install
npm run db:prepare
```

### Запуск dev одной командой
```bash
npm run dev
```
Запускает frontend + backend параллельно через `concurrently`.

## Desktop Edition (Windows .exe / installer)
Отдельный режим с Electron + SQLite.

### Desktop dev
```bash
npm run dev:desktop
```
Запускает Electron, локальный backend на SQLite и frontend.

### Desktop build (.exe)
```bash
npm run build:desktop
```
Результат: `dist-desktop/` (NSIS installer `.exe` и portable `.exe`).

Desktop ограничения:
- SQLite профиль покрывает базовые auth/chats/messages/realtime/signaling сценарии.
- WebRTC 1-на-1 работает в пределах desktop-клиентов, но без TURN по умолчанию.

## Полезные команды
- `npm run seed`
- `npm run reset-db`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run test`

## Demo users
- `demo1@mail.dev` ... `demo10@mail.dev`
- username: `demo1` ... `demo10`
- password: `Test12345!`

## Переменные окружения
См. `.env.example`.

## Структура
- `backend/` — Express + Prisma + Socket.IO API
- `frontend/` — Next.js App Router + Tailwind + Zustand + React Query
- `desktop/` — Electron main/preload и desktop orchestration
- `docker-compose.yml` — web mode infra

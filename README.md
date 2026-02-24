# Mesnger MVP+

## Структура
- `backend/` — Express + Prisma + Socket.IO API
- `frontend/` — Next.js App Router + Tailwind + Zustand + React Query
- `docker-compose.yml` — frontend/backend/postgres

## Реализовано
- Auth: register/login/refresh/logout/me.
- PostgreSQL Prisma schema: users/chats/messages/attachments/calls/settings/sessions.
- Chat list, open/close active chat, message feed.
- Message send/edit/undo-edit/delete-for-me/delete-for-everyone/forward/reply id support.
- Upload image/file + voice blob endpoint.
- Username search with `@` support and direct chat upsert.
- Presence/typing/message realtime via Socket.IO.
- WebRTC 1:1 audio/video signaling via socket events.
- Profile/settings data model and APIs (`users/me`, `PATCH users/me`).
- Seed users/chats/messages/calls and demo credentials.

## Demo users
- `demo1@mail.dev` ... `demo10@mail.dev`
- username: `demo1` ... `demo10`
- password: `Test12345!`

## Локальный запуск
1. `cp .env.example .env`
2. `npm install`
3. `npm run prisma:generate -w backend`
4. `npx prisma migrate dev --schema backend/prisma/schema.prisma --name init`
5. `npm run seed`
6. `npm run dev`
7. Open `http://localhost:3000`

## Docker
1. `docker compose up --build`
2. in another shell run migrations+seed inside backend container.

## Упрощения
- UI закрывает большинство требований MVP, но без полного набора модальных экранов/иконографики и без wavesurfer.
- TURN server задаётся env, по умолчанию STUN-only.
- Undo edit хранит последнюю версию и доступен API, без серверного hard cutoff окна.

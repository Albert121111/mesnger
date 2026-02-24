# Mesnger MVP+

## Быстрый старт и проверка

### 1) Docker (одной командой)
```bash
docker compose up --build
```

Проверка:
- Frontend: http://localhost:3000
- Backend health: http://localhost:4000/health (должен вернуть `{ "ok": true }`)

### 2) Локально без Docker
```bash
cp .env.example .env
cp frontend/.env.example frontend/.env.local
npm install
npm run db:prepare
npm run dev
```

Проверка:
- http://localhost:4000/health
- http://localhost:3000
- Логин demo-пользователем: `demo1@mail.dev` / `Test12345!`

## Диагностика проблем с backend
- Проверка портов:
  - Linux/macOS: `ss -ltnp | grep -E ':3000|:4000'`
  - Windows PowerShell: `netstat -ano | findstr :4000`
- Docker:
  - `docker compose ps`
  - `docker compose logs backend`

## Что исправлено для ошибки `Network Error`
- Backend теперь слушает `0.0.0.0` и доступен с хоста на `http://localhost:4000`.
- Добавлен/проверен endpoint `GET /health`.
- FRONTEND API base URL унифицирован через `NEXT_PUBLIC_API_URL=http://localhost:4000`.
- Улучшена обработка ошибок auth:
  - backend недоступен,
  - CORS,
  - 401,
  - 409.
- На login/register добавлен `show/hide password` (глазик).

## Desktop Edition
- Dev: `npm run dev:desktop`
- Build Windows: `npm run build:desktop`
- Output: `dist-desktop/` (NSIS installer + portable exe)

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
- `npm run db:prepare` автоматически использует `prisma migrate deploy`, а если миграций ещё нет — fallback на `prisma db push` (чтобы backend не падал при первом запуске).
- http://localhost:3000
- Логин demo-пользователем: `demo1@mail.dev` / `Test12345!`


### Если backend падает с Prisma ошибкой
Ошибка вида `@prisma/client did not initialize yet` означает, что клиент Prisma не сгенерирован.
Выполните:
```bash
npm run prisma:generate -w backend
npm run dev
```
(или просто `npm install`, postinstall тоже запускает генерацию Prisma).

## Диагностика Network Error
1. Проверить порты:
   - Linux/macOS: `ss -ltnp | grep -E ':3000|:4000'`
   - Windows PowerShell: `netstat -ano | findstr :4000`
2. Проверить backend health: `http://localhost:4000/health`
3. Открыть DevTools → Console:
   - `[API REQUEST]` покажет куда реально уходит запрос
   - `[API ERROR]` покажет HTTP status/code
4. Если Docker:
   - `docker compose ps`
   - `docker compose logs backend`

## Что исправлено для ошибки `Network Error`
- Backend слушает все интерфейсы (bind all interfaces), порт `4000`.
- Добавлен endpoint `GET /health`.
- CORS разрешает localhost/127.0.0.1 с credentials.
- FRONTEND API URL унифицирован через `NEXT_PUBLIC_API_URL=http://localhost:4000`.
- В auth UI добавлены понятные сообщения для network/CORS/401/409.
- На login/register есть `show/hide password` (глазик).

## Desktop Edition
- Dev: `npm run dev:desktop`
- Build Windows: `npm run build:desktop`
- Output: `dist-desktop/` (NSIS installer + portable exe)

# Mesnger MVP+

## Диагноз проблем
- `Network Error` появлялся, когда backend не поднимался (ошибка Prisma/migrate на старте).
- Падал TypeScript build backend (`TS6059`), потому что `prisma/seed.ts` был вне `rootDir: src`.
- Desktop требовал явной схемы Host/Client и понятной настройки адреса сервера.

## Команды одной строкой

### Desktop dev
```bash
npm run dev:desktop
```

### Сборка Windows `.exe`
```bash
npm run build:desktop
```
Артефакты: `dist-desktop/` (NSIS installer + portable exe).

### Web через Docker (опционально)
```bash
docker compose up --build
```

## Локальный web без Docker
```bash
cp .env.example .env
cp frontend/.env.example frontend/.env.local
npm install
npm run db:prepare
npm run dev
```

## Проверка здоровья backend
- Web: `http://localhost:4000/health`
- Desktop host: `http://<LAN_IP>:4010/health`

## Desktop Host / Client
1. Запустите `npm run dev:desktop`.
2. На экране логина выберите режим:
   - **Host**: backend поднимается на `0.0.0.0:4010`, показывается локальный адрес и найденные IP.
   - **Client**: введите адрес хоста (например `http://192.168.1.10:4010`) и сохраните.
3. Для второго ПК в LAN/Tailscale используйте режим Client и адрес Host.

## Что исправлено технически
- Убрали `prisma/seed.ts` из main backend tsconfig, добавили отдельный `tsconfig.seed.json`.
- Добавили `backend/scripts/db-prepare.sh`: `prisma generate` + `migrate deploy`, fallback на `db push` если миграций нет.
- Desktop backend:
  - слушает `0.0.0.0`;
  - имеет `/health` и `/host-info`;
  - улучшен socket auth join.
- Frontend:
  - единый api client с runtime baseURL;
  - корректные ошибки (`сервер недоступен`, `401`, `409`, `CORS`);
  - парольные поля с show/hide (“глазик”).

## Ограничения
- TURN-сервер не встроен (только STUN), поэтому звонки между разными сетями могут требовать дополнительной TURN-конфигурации.

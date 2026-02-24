#!/bin/sh
set -e

SCHEMA_PATH="prisma/schema.prisma"

if [ ! -f "$SCHEMA_PATH" ]; then
  echo "[backend] prisma schema not found at $SCHEMA_PATH"
  exit 1
fi

echo "[backend] running prisma generate"
npx prisma generate --schema "$SCHEMA_PATH"

if [ -d "prisma/migrations" ] && find prisma/migrations -mindepth 1 -maxdepth 1 -type d | read -r _; then
  echo "[backend] applying migrations (prisma migrate deploy)"
  npx prisma migrate deploy --schema "$SCHEMA_PATH"
else
  echo "[backend] no migrations found, applying schema with prisma db push"
  npx prisma db push --schema "$SCHEMA_PATH" --accept-data-loss
fi

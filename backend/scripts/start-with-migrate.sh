#!/bin/sh
set -e

echo "[backend] waiting for postgres..."
until node -e "const {Client}=require('pg');const c=new Client({connectionString:process.env.DATABASE_URL});c.connect().then(()=>c.end()).then(()=>process.exit(0)).catch(()=>process.exit(1));"; do
  sleep 2
done

sh ./scripts/db-prepare.sh

echo "[backend] seeding if empty"
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.count().then(async(c)=>{if(!c){await require('tsx/cjs').tsxRequire('./prisma/seed.ts', __filename)} }).finally(()=>p.$disconnect())" || true

echo "[backend] starting server"
node dist/index.js

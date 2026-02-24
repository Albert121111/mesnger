FROM node:20-alpine

WORKDIR /app/backend

# Prisma schema must exist before npm install because @prisma/client may generate on postinstall
COPY backend/package*.json ./
COPY backend/prisma ./prisma
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
RUN npm install

COPY backend ./

RUN npm run prisma:generate && npm run build

EXPOSE 4000

CMD ["sh", "./scripts/start-with-migrate.sh"]

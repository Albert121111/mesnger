FROM node:20-alpine

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install

COPY backend ./

RUN npx prisma generate --schema prisma/schema.prisma && npm run build

EXPOSE 4000

CMD ["sh", "./scripts/start-with-migrate.sh"]

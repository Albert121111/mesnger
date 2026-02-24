FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm install
COPY . .
WORKDIR /app/backend
RUN npx prisma generate && npm run build
EXPOSE 4000
CMD ["sh","./scripts/start-with-migrate.sh"]

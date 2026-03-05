FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

# Prisma needs these to load the config file during generation, even if it doesn't connect to the DB
ENV DB_HOST=localhost DB_PORT=5432 DB_NAME=db DB_USER=user DB_PASSWORD=pass ADMIN_API_KEY=test CORS_ORIGIN=test PORT=8080

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev && npm cache clean --force
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 8080

CMD ["npm", "run", "start:prod:app-only"]

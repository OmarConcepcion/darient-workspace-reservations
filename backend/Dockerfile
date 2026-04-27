FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY tsconfig.json vitest.config.ts ./
COPY src ./src

EXPOSE 3000

CMD ["npm", "run", "dev"]

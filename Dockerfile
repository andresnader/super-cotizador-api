FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/prisma ./prisma
RUN npx prisma generate

COPY backend/src ./src
COPY backend/tsconfig.json ./

RUN npm run build

EXPOSE 3000
CMD ["node", "dist/server.js"]
FROM node:22.16.0 AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build


FROM node:22.16.0 AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist 
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["node","dist/server.js"]

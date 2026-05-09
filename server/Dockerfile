FROM node:22-alpine AS base

# Server Dockerfile
FROM base AS server-deps
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci

FROM base AS server-build
WORKDIR /app/server
COPY --from=server-deps /app/server/node_modules ./node_modules
COPY server/prisma ./prisma
RUN npx prisma generate
COPY server/ ./
RUN npm run build

FROM base AS server-run
WORKDIR /app/server
COPY --from=server-build /app/server/dist ./dist
COPY --from=server-build /app/server/node_modules ./node_modules
COPY --from=server-build /app/server/node_modules/.prisma ./node_modules/.prisma
EXPOSE 3001
CMD ["node", "dist/main.js"]
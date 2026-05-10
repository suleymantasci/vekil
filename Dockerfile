FROM node:22-alpine AS base

WORKDIR /app

# Server dependencies
FROM base AS server-deps
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --legacy-peer-deps

# Server build
FROM base AS server-build
WORKDIR /app/server
COPY --from=server-deps /app/server/node_modules ./node_modules
COPY server/prisma ./prisma
RUN npx prisma generate
COPY server/ ./
RUN npm run build

# Server runtime
FROM base AS server-run
WORKDIR /app/server
COPY --from=server-build /app/server/dist ./dist
COPY --from=server-build /app/server/node_modules ./node_modules
COPY --from=server-build /app/server/node_modules/.prisma ./node_modules/.prisma
EXPOSE 3001
CMD ["node", "dist/main.js"]

# Client dependencies
FROM base AS client-deps
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci

# Client build
FROM base AS client-builder
WORKDIR /app/client
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=client-deps /app/client/node_modules ./node_modules
COPY client/ ./
RUN npm run build

# Client runtime
FROM base AS client-run
WORKDIR /app/client
ENV NODE_ENV=production
COPY --from=client-builder /app/client/public ./public
COPY --from=client-builder /app/client/.next/standalone ./
COPY --from=client-builder /app/client/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
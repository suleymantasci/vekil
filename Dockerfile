FROM node:22-bookworm AS base
WORKDIR /app

# Server runtime
FROM base AS server-run
WORKDIR /app/server
RUN npm install -g ts-node
COPY server/package*.json ./
RUN npm ci --legacy-peer-deps
COPY server/prisma ./prisma
RUN npx prisma generate
COPY server/tsconfig.json ./
COPY server/src ./src
EXPOSE 3001
CMD ["npx", "ts-node", "--transpile-only", "src/main.ts"]

# Client deps
FROM base AS client-deps
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci

# Client build
FROM base AS client-builder
WORKDIR /app/client
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
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
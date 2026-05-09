FROM node:22-alpine AS base

# Client Dockerfile
FROM base AS deps
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app/client
COPY --from=deps /app/client/node_modules ./node_modules
COPY client/ ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app/client
ENV NODE_ENV=production
COPY --from=builder /app/client/public ./public
COPY --from=builder /app/client/.next/standalone ./
COPY --from=builder /app/client/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
# ── Build stage ──
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace root files
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./

# Copy package manifests first (better layer caching)
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/

# Install all dependencies
RUN npm ci --workspace=packages/shared --workspace=packages/server

# Copy source
COPY packages/shared/ packages/shared/
COPY packages/server/ packages/server/

# Build shared then server
RUN npm run build -w packages/shared
RUN npm run build -w packages/server

# ── Production stage ──
FROM node:20-alpine

RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/

RUN npm ci --workspace=packages/shared --workspace=packages/server --omit=dev

COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/packages/server/dist packages/server/dist

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "packages/server/dist/index.js"]

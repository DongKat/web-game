# ── Build stage ──
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace root files
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./

# Copy package manifests first (better layer caching)
COPY packages/shared/package.json packages/shared/
COPY packages/client/package.json packages/client/

# Install all dependencies
RUN npm ci --workspace=packages/shared --workspace=packages/client

# Copy source
COPY packages/shared/ packages/shared/
COPY packages/client/ packages/client/

# Build shared then client
RUN npm run build -w packages/shared
RUN npm run build -w packages/client

# ── Production stage ──
FROM nginx:alpine

# Copy custom nginx config
COPY packages/client/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built client assets
COPY --from=builder /app/packages/client/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

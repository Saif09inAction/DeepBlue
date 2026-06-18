# ============================================================
# DeepBlue Frontend — Multi-stage Docker Build
# Stage 1: Build React app with Vite
# Stage 2: Serve with Nginx (non-root, minimal attack surface)
# ============================================================

# ── Stage 1: Build ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cache friendly)
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit

# Copy source and build
COPY . .
RUN npm run build

# Verify build output
RUN ls -lh dist/

# ── Stage 2: Serve ───────────────────────────────────────────
FROM nginx:1.25-alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Custom nginx config for SPA routing
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Security: run as non-root
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

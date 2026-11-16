# ---- Stage 1: install dependencies ----
# Kept separate so Docker can reuse this layer while package*.json is unchanged.
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Stage 2: build the app ----
FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV BUILD_STANDALONE=1
RUN npm run build

# ---- Stage 3: the small image that actually runs ----
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# Listen on all network interfaces, otherwise the container's port is unreachable
ENV HOSTNAME=0.0.0.0

# Run as a normal user instead of root
RUN useradd --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

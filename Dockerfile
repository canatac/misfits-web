# Dockerfile multi-stage — misfits.ai Mail Frontend
# Optimisé: build Next.js dans Docker, pas de rebuild dans CI
# Image finale ~150MB (standalone output)

# ============================================================
# Stage 1: Deps (cached unless package.json/lockfile change)
# ============================================================
FROM node:22-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile --prod=false || pnpm install

# ============================================================
# Stage 2: Build
# ============================================================
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ARG NEXT_PUBLIC_MISFITS_WEB_BUILD_VERSION=misfits-web@unknown
ENV NEXT_PUBLIC_MISFITS_WEB_BUILD_VERSION=${NEXT_PUBLIC_MISFITS_WEB_BUILD_VERSION}

RUN pnpm build

# ============================================================
# Stage 3: Runner (production) — minimal image
# ============================================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only standalone output + static assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]

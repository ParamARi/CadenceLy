FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

# Install dependencies
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY cadencely/package.json ./cadencely/
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/cadencely/node_modules ./cadencely/node_modules

# Copy the rest of the workspace
COPY . .

# Disable Next.js telemetry if needed
# ENV NEXT_TELEMETRY_DISABLED=1

RUN cd cadencely && pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# ENV NEXT_TELEMETRY_DISABLED=1

# ffmpeg for /api/bpm/youtube (fluent-ffmpeg); ffmpeg-static often lacks Alpine/musl builds
RUN apk add --no-cache ffmpeg
ENV FFMPEG_PATH=/usr/bin/ffmpeg

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir -p cadencely/.next
RUN chown -R nextjs:nodejs cadencely

# The standalone folder structure mirrors the monorepo workspace
COPY --from=builder --chown=nextjs:nodejs /app/cadencely/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/cadencely/.next/static ./cadencely/.next/static
COPY --from=builder /app/cadencely/public ./cadencely/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
# set hostname to localhost
ENV HOSTNAME="0.0.0.0"

CMD ["node", "cadencely/server.js"]

FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Stage that produces a flat node_modules holding just what the
# migration script imports. Next's standalone trace doesn't include
# modules used outside the app code, so the runtime image needs its
# own copies of these.
FROM node:20-alpine AS migrator-deps
WORKDIR /m
RUN npm init -y >/dev/null \
  && npm install --omit=dev postgres@3 drizzle-orm@0.45

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/scripts/migrate.mjs ./scripts/migrate.mjs
COPY --from=migrator-deps --chown=nextjs:nodejs /m/node_modules/postgres ./node_modules/postgres
COPY --from=migrator-deps --chown=nextjs:nodejs /m/node_modules/drizzle-orm ./node_modules/drizzle-orm

USER nextjs
EXPOSE 3000

CMD ["sh", "-c", "node scripts/migrate.mjs && node server.js"]

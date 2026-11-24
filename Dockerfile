FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

FROM base AS dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --chmod=0644 package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN chmod -R a+rX /app/prisma
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

FROM dependencies AS builder
COPY . .
RUN npm run build

# Explicit release/operations image; never run migrations from web startup.
FROM dependencies AS tools
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node lib ./lib
ENV NODE_ENV=production
USER node
RUN npm run db:validate
ENTRYPOINT ["npm", "run"]
CMD ["db:deploy"]

FROM base AS runner
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --chown=node:node scripts/production-start.mjs ./scripts/production-start.mjs
COPY --chown=node:node lib/server/deployment/environment.mjs ./scripts/production-environment.mjs
USER node
EXPOSE 3000
CMD ["node", "scripts/production-start.mjs"]

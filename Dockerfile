FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

FROM dependencies AS builder
COPY . .
RUN npm run build

# Explicit release/operations image; never run migrations from web startup.
FROM dependencies AS tools
COPY scripts ./scripts
COPY lib ./lib
ENV NODE_ENV=production
USER node
ENTRYPOINT ["npm", "run"]
CMD ["db:deploy"]

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]

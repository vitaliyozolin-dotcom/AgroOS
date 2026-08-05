FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    AGROOS_DB_PATH=/data/agroos.sqlite
RUN groupadd --system --gid 1001 agroos && useradd --system --uid 1001 --gid agroos agroos
RUN install -d -o agroos -g agroos /data
COPY --from=builder --chown=agroos:agroos /app/.next/standalone ./
COPY --from=builder --chown=agroos:agroos /app/.next/static ./.next/static
COPY --from=builder --chown=agroos:agroos /app/public ./public
COPY --from=builder --chown=agroos:agroos /app/scripts ./scripts
COPY --from=dependencies --chown=agroos:agroos /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=dependencies --chown=agroos:agroos /app/node_modules/bindings ./node_modules/bindings
COPY --from=dependencies --chown=agroos:agroos /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path
USER agroos
EXPOSE 3000
CMD ["node", "server.js"]

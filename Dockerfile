# One image: builds the React app, then runs the API which also serves it.
FROM oven/bun:1 AS web
WORKDIR /web
COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile
COPY frontend/ ./
RUN bun run build

FROM oven/bun:1
WORKDIR /app
COPY backend/package.json backend/bun.lock ./
RUN bun install --frozen-lockfile --production
COPY backend/ ./
# app.js looks for ../../frontend/dist relative to /app/src
COPY --from=web /web/dist /frontend/dist
ENV NODE_ENV=production
# Don't run as root: the app only reads its files. The oven/bun image ships this user.
USER bun
CMD ["bun", "src/server.js"]

# Oddsly

Practice prediction market (virtual credits only, no real money).

- `backend/`: Express + MongoDB API. See `backend/README.md`.
- `frontend/`: React + Tailwind app. In production the API serves the built app, so there is one service and no CORS.

## Local development

Terminal 1: `cd backend && bun run dev`. Terminal 2: `cd frontend && bun run dev`. Open http://localhost:5173.

## Deploy: MongoDB Atlas + Railway

The database must be a replica set (the app refuses to start on a standalone server), so use Atlas, not Railway's Mongo template.

1. **Atlas:** create a free cluster, a database user, and allow network access (Railway has no fixed IP, so use 0.0.0.0/0 and rely on the strong DB password, or upgrade to a private link later). Copy the `mongodb+srv://...` URI and add the database name: `.../oddsly?retryWrites=true&w=majority`. Do NOT add `replicaSet=rs0`.
2. **Railway:** New Project, Deploy from GitHub repo. `railway.json` and `Dockerfile` at the repo root do the rest.
3. **Variables** (Railway service, Variables tab):
   - `MONGODB_URI` = the Atlas URI
   - `JWT_SECRET` = `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
   - `CORS_ORIGIN` = your Railway URL (only matters if you ever host the frontend elsewhere)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` = a strong password, NOT the default
   - `NODE_ENV=production` is already set by the Dockerfile; `PORT` is injected by Railway.
4. **Create the admin once:** `railway run --service <name> bun run seed:admin` (or run the seed locally with the production `MONGODB_URI` set).
5. Open the Railway URL. Health check: `/api/v1/health`.

Limits to know: the rate limiter keeps counts in memory, so run exactly one instance. See the `shortcut:` comments in `backend/src` for the other known scale limits.

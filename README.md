# Oddsly

A prediction market built for learning. **Virtual credits only, no real money.**

**Live demo:** https://oddsly.up.railway.app

Users register with 10,000 virtual credits, buy YES or NO contracts on markets at a fixed price, and track their portfolio. An admin creates markets, closes them and resolves them. Winning contracts pay 1 credit each.

## Features

- **Auth:** register, login, bcrypt password hashing, JWT, user and admin roles
- **Markets:** create, edit, delete, search, category filter, status `OPEN` / `CLOSED` / `RESOLVED`
- **Wallet:** 10,000 starting credits and a full transaction history. Users can never set their own balance.
- **Trading:** fixed price, no order book. The server reads price and balance from the database, never from the client.
- **Portfolio:** positions, average price, amount invested, potential payout, realized profit and loss
- **Resolution:** the admin resolves YES or NO and winners are paid. A market can never be paid out twice.

## How money is kept safe

- All money is stored as **integer cents**, so there are no floating-point errors.
- Every balance change runs in a **MongoDB transaction** (this needs a replica set; the server refuses to start on a standalone database).
- Debits are **atomic**: the update only matches if the balance covers the cost, so it cannot go negative even with parallel requests.
- Double payout is blocked three ways: an atomic status change, settling only unsettled orders, and a unique database index on payouts.

## Stack

| Part | Tech |
|---|---|
| Backend | Bun, Express 5, MongoDB, Mongoose, Zod, JWT, bcrypt, Helmet |
| Frontend | React 19, Vite, Tailwind CSS |
| Hosting | Railway (one Docker image serves the API and the app), MongoDB Atlas |

## Project layout

```
backend/    Express API  (config, models, routes, controllers, middleware, validators, services, utils)
frontend/   React app
Dockerfile  builds the frontend, then runs the API, which also serves the built app
```

API reference and security notes: [`backend/README.md`](backend/README.md).

## Run it locally

You need [Bun](https://bun.sh) and MongoDB running as a **single-node replica set**
(see "MongoDB replica set" in `backend/README.md`, or run `backend/scripts/mongo-local.ps1` on Windows).

```bash
# API
cd backend
bun install
cp .env.example .env        # set JWT_SECRET to 32+ random characters
bun run seed:admin          # creates the admin from ADMIN_EMAIL / ADMIN_PASSWORD
bun run dev                 # http://localhost:3000/api/v1/health

# Frontend (second terminal)
cd frontend
bun install
bun run dev                 # http://localhost:5173
```

Run the tests with `cd backend && bun test` (20 integration tests, using a separate `oddsly_test` database).

## Deploy

1. **MongoDB Atlas:** create a free cluster and a database user with `readWrite` on the `oddsly` database. Use the `mongodb+srv://…/oddsly?retryWrites=true&w=majority` connection string. Do not add `replicaSet=rs0`.
2. **Railway:** create a project from this repo. The root `Dockerfile` and `railway.json` do the rest.
3. **Variables:** set `MONGODB_URI`, `JWT_SECRET` (32+ random characters) and `ADMIN_EMAIL` / `ADMIN_PASSWORD` (a strong password). `PORT` is set by Railway, and the domain must point at that port.
4. **Create the admin once:** run `bun run seed:admin` from `backend/` with the production variables set.

Run a single instance: the rate limiter keeps its counts in memory. The `shortcut:` comments in `backend/src` list the other known limits.

## License

[MIT](LICENSE)

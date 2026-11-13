# Oddsly backend

Kalshi-inspired prediction market. Virtual credits only, no real money.
Money is stored as integer cents: 1 credit = 100 cents, and a winning contract pays 100 cents.

## Run

```powershell
bun install
copy .env.example .env      # then set JWT_SECRET (32+ chars)
bun run seed:admin          # creates the admin from ADMIN_EMAIL / ADMIN_PASSWORD
bun run dev                 # http://localhost:3000/api/v1/health
bun test                    # integration tests (uses the oddsly_test database)
```

## MongoDB replica set (required for transactions)

Option A: the Windows service. Add to `C:\Program Files\MongoDB\Server\9.0\bin\mongod.cfg`:

```yaml
replication:
  replSetName: rs0
```

Then restart the service (admin PowerShell: `Restart-Service MongoDB`) and run once:

```powershell
mongosh --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'127.0.0.1:27017'}]})"
```

Option B: folder-only. `powershell -File scripts\mongo-local.ps1` runs a replica set with data in `backend\.mongo-data` on port 27018. Point `MONGODB_URI` at port 27018.

Verify: `mongosh --eval "rs.status().members[0].stateStr"` prints `PRIMARY`. The server also refuses to start on a standalone MongoDB.

## API (/api/v1)

| Method | Path | Auth |
|---|---|---|
| POST | /auth/register, /auth/login | none |
| GET | /auth/me | user |
| GET | /markets?search=&category=&status=&page=&limit=&sort= | none |
| GET | /markets/:id | none |
| POST, PATCH, DELETE | /markets, /markets/:id | admin |
| POST | /admin/markets/:id/close | admin |
| POST | /admin/markets/:id/resolve `{outcome:"YES"\|"NO"}` | admin |
| POST | /orders `{marketId, side, quantity}` | user |
| GET | /orders | user |
| GET | /wallet, /wallet/transactions | user |
| GET | /portfolio | user |

Errors are RFC 7807 `application/problem+json`.

## Security notes

- Passwords: bcrypt, 12 rounds. JWT is HS256 with issuer and audience pinned.
- The server never reads a price or balance from the client. Order bodies are `strictObject`s, so extra fields are rejected.
- Balance debits are atomic (`balance >= cost` in the update filter) inside a transaction.
- Double payout is prevented three ways: an atomic status transition, FILLED-only settlement, and a unique partial index on PAYOUT transactions.
- Helmet, CORS allowlist, 10kb body limit, and rate limits on auth and trading.
- Before deploying: set a strong JWT_SECRET, change the admin password, and enable MongoDB auth.

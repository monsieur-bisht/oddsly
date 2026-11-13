import { afterAll, beforeAll, describe, expect, test } from "bun:test";

// Use an isolated database so tests never touch dev data.
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/oddsly_test?replicaSet=rs0";
process.env.NODE_ENV = "test";

const { connectDB, disconnectDB } = await import("../src/config/db.js");
const { createApp } = await import("../src/app.js");
const { User } = await import("../src/models/User.js");
const { Market } = await import("../src/models/Market.js");
const { Order } = await import("../src/models/Order.js");
const { Transaction } = await import("../src/models/Transaction.js");
const { env } = await import("../src/config/env.js");
const { JWT_OPTIONS } = await import("../src/middleware/auth.js");
const jwt = (await import("jsonwebtoken")).default;
const mongoose = (await import("mongoose")).default;
const bcrypt = (await import("bcrypt")).default;

let server;
let base;

const call = async (method, path, { token, body } = {}) => {
  const res = await fetch(`${base}/api/v1${path}`, {
    method,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
};

const register = async (name) => {
  const r = await call("POST", "/auth/register", {
    body: { email: `${name}@test.dev`, username: name, password: "correct-horse-battery" },
  });
  return { token: r.body.data.token, id: r.body.data.user._id, res: r };
};

let adminToken;
let alice;
let bob;

beforeAll(async () => {
  await connectDB();
  await mongoose.connection.dropDatabase();
  await Promise.all([Market.init(), Transaction.init(), Order.init(), User.init()]);
  server = createApp().listen(0);
  base = `http://localhost:${server.address().port}`;

  await User.create({
    email: "admin@test.dev",
    username: "admin",
    passwordHash: await bcrypt.hash("admin-password-123", 4),
    role: "admin",
  });
  const login = await call("POST", "/auth/login", { body: { email: "admin@test.dev", password: "admin-password-123" } });
  adminToken = login.body.data.token;
  alice = await register("alice");
  bob = await register("bob");
});

afterAll(async () => {
  server.close();
  await mongoose.connection.dropDatabase();
  await disconnectDB();
});

describe("auth & wallet", () => {
  test("new users start with 10,000 credits and a signup transaction", async () => {
    const w = await call("GET", "/wallet", { token: alice.token });
    expect(w.body.data.balance).toBe(1_000_000);
    const t = await call("GET", "/wallet/transactions", { token: alice.token });
    expect(t.body.data[0].type).toBe("SIGNUP_BONUS");
  });

  test("clients cannot set balance or role at registration", async () => {
    const r = await call("POST", "/auth/register", {
      body: { email: "evil@test.dev", username: "evil", password: "correct-horse-battery", balance: 999999999, role: "admin" },
    });
    expect(r.status).toBe(422);
  });

  test("wrong password and unknown email give the same error", async () => {
    const a = await call("POST", "/auth/login", { body: { email: "alice@test.dev", password: "wrong-password-1" } });
    const b = await call("POST", "/auth/login", { body: { email: "nobody@test.dev", password: "wrong-password-1" } });
    expect(a.status).toBe(401);
    expect(b.body.detail).toBe(a.body.detail);
  });

  test("NoSQL operator injection at login is rejected", async () => {
    const r = await call("POST", "/auth/login", { body: { email: { $ne: null }, password: { $ne: null } } });
    expect(r.status).toBe(422);
  });

  test("a password over 72 bytes is rejected at registration", async () => {
    const r = await call("POST", "/auth/register", {
      body: { email: "emoji@test.dev", username: "emoji", password: "😀".repeat(30) }, // 30 chars, 120 bytes
    });
    expect(r.status).toBe(422);
  });

  test("forged and expired tokens are rejected", async () => {
    const claims = { sub: alice.id, role: "admin" };
    const opts = { algorithm: "HS256", issuer: JWT_OPTIONS.issuer, audience: JWT_OPTIONS.audience };
    const forged = jwt.sign(claims, "x".repeat(40), opts);
    const expired = jwt.sign(claims, env.JWT_SECRET, { ...opts, expiresIn: -10 });
    expect((await call("GET", "/wallet", { token: forged })).status).toBe(401);
    expect((await call("GET", "/wallet", { token: expired })).status).toBe(401);
  });

  test("health reports ok while the database is connected", async () => {
    expect((await call("GET", "/health")).status).toBe(200);
  });

  test("protected routes require a token; admin routes require admin", async () => {
    expect((await call("GET", "/wallet")).status).toBe(401);
    const r = await call("POST", "/markets", { token: alice.token, body: {} });
    expect(r.status).toBe(403);
  });
});

describe("markets, trading, resolution", () => {
  let marketId;

  test("admin creates a market; noPrice is derived", async () => {
    const r = await call("POST", "/markets", {
      token: adminToken,
      body: { title: "Will it rain tomorrow?", category: "Weather", yesPrice: 40, endDate: new Date(Date.now() + 86400000).toISOString() },
    });
    expect(r.status).toBe(201);
    expect(r.body.data.noPrice).toBe(60);
    marketId = r.body.data._id;
  });

  test("search and category filter work", async () => {
    const r = await call("GET", "/markets?search=rain&category=weather&status=OPEN");
    expect(r.body.pagination.total).toBe(1);
  });

  test("buy uses the server price and debits the server balance", async () => {
    const r = await call("POST", "/orders", { token: alice.token, body: { marketId, side: "YES", quantity: 10 } });
    expect(r.status).toBe(201);
    expect(r.body.data.order.price).toBe(40);
    expect(r.body.data.balance).toBe(1_000_000 - 400);
  });

  test("client-supplied price or balance is rejected", async () => {
    const r = await call("POST", "/orders", { token: alice.token, body: { marketId, side: "YES", quantity: 1, price: 1 } });
    expect(r.status).toBe(422);
  });

  test("cannot spend more than the balance, even concurrently", async () => {
    // bob has 1,000,000 cents. Each order costs 60 * 10,000 = 600,000 cents (NO @ 60). Only one can succeed.
    const results = await Promise.all(
      Array.from({ length: 5 }, () => call("POST", "/orders", { token: bob.token, body: { marketId, side: "NO", quantity: 10000 } })),
    );
    const ok = results.filter((r) => r.status === 201).length;
    expect(ok).toBe(1);
    const w = await call("GET", "/wallet", { token: bob.token });
    expect(w.body.data.balance).toBe(400_000);
    expect(w.body.data.balance).toBeGreaterThanOrEqual(0);
  });

  test("portfolio shows positions", async () => {
    const r = await call("GET", "/portfolio", { token: alice.token });
    const p = r.body.data.positions[0];
    expect(p.quantity).toBe(10);
    expect(p.averagePrice).toBe(40);
    expect(p.potentialPayout).toBe(1000);
  });

  test("resolve pays winners once and only once", async () => {
    const first = await call("POST", `/admin/markets/${marketId}/resolve`, { token: adminToken, body: { outcome: "YES" } });
    expect(first.status).toBe(200);
    expect(first.body.data.totalPaid).toBe(1000);

    const second = await call("POST", `/admin/markets/${marketId}/resolve`, { token: adminToken, body: { outcome: "NO" } });
    expect(second.status).toBe(409);

    const w = await call("GET", "/wallet", { token: alice.token });
    expect(w.body.data.balance).toBe(1_000_000 - 400 + 1000);

    const payouts = await Transaction.countDocuments({ type: "PAYOUT" });
    expect(payouts).toBe(1);
  });

  test("a resolved market cannot be edited", async () => {
    const r = await call("PATCH", `/markets/${marketId}`, { token: adminToken, body: { yesPrice: 50 } });
    expect(r.status).toBe(409);
  });

  test("concurrent resolves pay exactly once", async () => {
    const m = await call("POST", "/markets", {
      token: adminToken,
      body: { title: "Concurrent resolve market", category: "test", yesPrice: 50, endDate: new Date(Date.now() + 86400000).toISOString() },
    });
    const id = m.body.data._id;
    await call("POST", "/orders", { token: alice.token, body: { marketId: id, side: "YES", quantity: 5 } });
    const before = (await call("GET", "/wallet", { token: alice.token })).body.data.balance;
    await Promise.all(
      Array.from({ length: 4 }, () => call("POST", `/admin/markets/${id}/resolve`, { token: adminToken, body: { outcome: "YES" } })),
    );
    const after = (await call("GET", "/wallet", { token: alice.token })).body.data.balance;
    expect(after - before).toBe(500);
  });

  test("realized P/L is reported after resolution", async () => {
    const r = await call("GET", "/portfolio", { token: alice.token });
    const resolved = r.body.data.positions.find((p) => p.title === "Will it rain tomorrow?");
    expect(resolved.realizedPnl).toBe(1000 - 400);
  });

  test("closed and resolved markets reject trades; markets with orders cannot be deleted", async () => {
    const t = await call("POST", "/orders", { token: alice.token, body: { marketId, side: "YES", quantity: 1 } });
    expect(t.status).toBe(409);
    const d = await call("DELETE", `/markets/${marketId}`, { token: adminToken });
    expect(d.status).toBe(409);
  });

  test("admin can close a market and then trades are rejected", async () => {
    const m = await call("POST", "/markets", {
      token: adminToken,
      body: { title: "Close me please", category: "test", yesPrice: 30, endDate: new Date(Date.now() + 86400000).toISOString() },
    });
    const id = m.body.data._id;
    expect((await call("POST", `/admin/markets/${id}/close`, { token: adminToken })).status).toBe(200);
    expect((await call("POST", "/orders", { token: alice.token, body: { marketId: id, side: "NO", quantity: 1 } })).status).toBe(409);
    expect((await call("DELETE", `/markets/${id}`, { token: adminToken })).status).toBe(204);
  });
});

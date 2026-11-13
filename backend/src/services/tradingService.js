import { Market } from "../models/Market.js";
import { Order } from "../models/Order.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { AppError, conflict, notFound } from "../utils/errors.js";
import { withTransaction } from "../utils/transaction.js";

/**
 * Buy `quantity` contracts of `side` at the market's CURRENT price (read from the database).
 * The client supplies only marketId, side and quantity.
 */
export async function buyContracts(userId, { marketId, side, quantity }) {
  return withTransaction(async (session) => {
    // shortcut: writing `volume` makes concurrent buys on ONE market retry each other; drop it if a single market gets heavy simultaneous trading.
    // Atomic check + write on the market: must be OPEN and not past its end date.
    // Writing `volume` also serialises this against edits, closes, resolves and deletes.
    const market = await Market.findOneAndUpdate(
      { _id: marketId, status: "OPEN", endDate: { $gt: new Date() } },
      { $inc: { volume: quantity } },
      { returnDocument: "after", session },
    );
    if (!market) {
      const existing = await Market.findById(marketId).session(session);
      if (!existing) throw notFound("Market not found");
      throw conflict(existing.status === "OPEN" ? "Market has ended" : `Market is ${existing.status}`);
    }

    const price = side === "YES" ? market.yesPrice : market.noPrice;
    const cost = price * quantity;

    // Atomic debit: the filter guarantees the balance can never go negative, even under concurrency.
    const user = await User.findOneAndUpdate(
      { _id: userId, balance: { $gte: cost } },
      { $inc: { balance: -cost } },
      { returnDocument: "after", session },
    );
    if (!user) throw new AppError(402, "insufficient-balance", "Insufficient balance");

    const [order] = await Order.create(
      [{ user: userId, market: market._id, side, quantity, price, cost, status: "FILLED" }],
      { session },
    );
    await Transaction.create(
      [{ user: userId, type: "TRADE_BUY", amount: -cost, balanceAfter: user.balance, market: market._id, order: order._id }],
      { session },
    );

    return { order, balance: user.balance };
  });
}

export async function listOrders(userId, { page, limit }) {
  const filter = { user: userId };
  const [data, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("market", "title status outcome").lean(),
    Order.countDocuments(filter),
  ]);
  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

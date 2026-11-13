import { Market } from "../models/Market.js";
import { Order } from "../models/Order.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { conflict, notFound } from "../utils/errors.js";
import { CONTRACT_PAYOUT } from "../utils/money.js";
import { withTransaction } from "../utils/transaction.js";

/**
 * Resolve a market and pay winners, atomically.
 * Double-payout protection (three layers):
 *  1. The OPEN/CLOSED -> RESOLVED transition is one atomic update; a second resolve matches nothing.
 *  2. Only orders still in FILLED status are settled, and each is flipped to WON/LOST in the same transaction.
 *  3. A unique partial index allows at most one PAYOUT transaction per order.
 */
export async function resolveMarket(marketId, outcome) {
  return withTransaction(async (session) => {
    const market = await Market.findOneAndUpdate(
      { _id: marketId, status: { $in: ["OPEN", "CLOSED"] } },
      { status: "RESOLVED", outcome, resolvedAt: new Date() },
      { returnDocument: "after", session },
    );
    if (!market) {
      const existing = await Market.findById(marketId).session(session);
      if (!existing) throw notFound("Market not found");
      throw conflict("Market is already resolved");
    }

    // shortcut: settles orders one by one in one transaction (60s limit), fine up to a few thousand orders per market; batch with bulkWrite + one $inc per user beyond that.
    const orders = await Order.find({ market: marketId, status: "FILLED" }).session(session);
    let winners = 0;
    let totalPaid = 0;

    for (const order of orders) {
      const won = order.side === outcome;
      const payout = won ? order.quantity * CONTRACT_PAYOUT : 0;

      const settled = await Order.updateOne(
        { _id: order._id, status: "FILLED" },
        { status: won ? "WON" : "LOST", payout, settledAt: new Date() },
        { session },
      );
      if (settled.modifiedCount !== 1) continue;

      if (won) {
        const user = await User.findByIdAndUpdate(order.user, { $inc: { balance: payout } }, { returnDocument: "after", session });
        await Transaction.create(
          [{ user: order.user, type: "PAYOUT", amount: payout, balanceAfter: user.balance, market: marketId, order: order._id }],
          { session },
        );
        winners += 1;
        totalPaid += payout;
      }
    }

    return { market, settledOrders: orders.length, winningOrders: winners, totalPaid };
  });
}

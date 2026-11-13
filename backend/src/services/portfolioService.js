import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { CONTRACT_PAYOUT } from "../utils/money.js";

/** Positions are derived from orders (single source of truth), grouped by market + side. */
export async function getPortfolio(userId) {
  const rows = await Order.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: { market: "$market", side: "$side" },
        quantity: { $sum: "$quantity" },
        invested: { $sum: "$cost" },
        payout: { $sum: "$payout" },
      },
    },
    { $lookup: { from: "markets", localField: "_id.market", foreignField: "_id", as: "market" } },
    { $unwind: "$market" },
  ]);

  const positions = rows.map((r) => {
    const resolved = r.market.status === "RESOLVED";
    return {
      marketId: r._id.market,
      title: r.market.title,
      marketStatus: r.market.status,
      outcome: r.market.outcome,
      side: r._id.side,
      quantity: r.quantity,
      averagePrice: Math.round(r.invested / r.quantity), // cents per contract
      invested: r.invested,
      potentialPayout: resolved ? 0 : r.quantity * CONTRACT_PAYOUT,
      realizedPnl: resolved ? r.payout - r.invested : 0,
      settled: resolved,
    };
  });

  const open = positions.filter((p) => !p.settled);
  return {
    positions,
    summary: {
      openInvested: open.reduce((s, p) => s + p.invested, 0),
      potentialPayout: open.reduce((s, p) => s + p.potentialPayout, 0),
      realizedPnl: positions.reduce((s, p) => s + p.realizedPnl, 0),
    },
  };
}

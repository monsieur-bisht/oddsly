import { Transaction } from "../models/Transaction.js";

export async function listTransactions(userId, { page, limit }) {
  const filter = { user: userId };
  const [data, total] = await Promise.all([
    Transaction.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("market", "title").lean(),
    Transaction.countDocuments(filter),
  ]);
  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

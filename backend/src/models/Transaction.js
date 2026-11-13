import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["SIGNUP_BONUS", "TRADE_BUY", "PAYOUT"], required: true },
    amount: { type: Number, required: true, validate: Number.isInteger }, // signed cents (+credit / -debit)
    balanceAfter: { type: Number, required: true, min: 0, validate: Number.isInteger },
    market: { type: mongoose.Schema.Types.ObjectId, ref: "Market", default: null },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  },
  { timestamps: true },
);

transactionSchema.index({ user: 1, createdAt: -1 });
// A given order can be paid out at most once, enforced by the database.
transactionSchema.index(
  { order: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: "PAYOUT" } },
);

export const Transaction = mongoose.model("Transaction", transactionSchema);

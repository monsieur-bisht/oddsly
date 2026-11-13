import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    market: { type: mongoose.Schema.Types.ObjectId, ref: "Market", required: true, index: true },
    side: { type: String, enum: ["YES", "NO"], required: true },
    quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
    price: { type: Number, required: true, min: 1, max: 99, validate: Number.isInteger }, // cents per contract
    cost: { type: Number, required: true, min: 1, validate: Number.isInteger }, // price * quantity
    status: { type: String, enum: ["FILLED", "WON", "LOST"], default: "FILLED" },
    payout: { type: Number, default: 0, min: 0, validate: Number.isInteger }, // cents credited on resolution
    settledAt: { type: Date, default: null },
  },
  { timestamps: true },
);

orderSchema.index({ market: 1, status: 1 });

export const Order = mongoose.model("Order", orderSchema);

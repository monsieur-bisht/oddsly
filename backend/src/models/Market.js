import mongoose from "mongoose";

const isCents = (v) => Number.isInteger(v) && v >= 1 && v <= 99;

const marketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    category: { type: String, required: true, trim: true, lowercase: true, maxlength: 40, index: true },
    status: { type: String, enum: ["OPEN", "CLOSED", "RESOLVED"], default: "OPEN", index: true },
    // Integer cents per contract. yesPrice + noPrice must equal 100.
    yesPrice: { type: Number, required: true, validate: isCents },
    noPrice: { type: Number, required: true, validate: isCents },
    endDate: { type: Date, required: true },
    outcome: { type: String, enum: ["YES", "NO", null], default: null },
    resolvedAt: { type: Date, default: null },
    // Contracts traded. Every trade writes this field, which makes trades, price edits,
    // closes and deletes of the same market conflict inside transactions instead of racing.
    volume: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

marketSchema.pre("validate", function () {
  if (this.yesPrice + this.noPrice !== 100) {
    this.invalidate("noPrice", "yesPrice + noPrice must equal 100 cents");
  }
});

marketSchema.index({ title: 1 });
marketSchema.index({ createdAt: -1 });

export const Market = mongoose.model("Market", marketSchema);

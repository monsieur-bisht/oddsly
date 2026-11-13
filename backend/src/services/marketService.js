import { Market } from "../models/Market.js";
import { Order } from "../models/Order.js";
import { conflict, notFound } from "../utils/errors.js";
import { withTransaction } from "../utils/transaction.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function listMarkets({ page, limit, search, category, status, sort }) {
  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (search) filter.title = { $regex: escapeRegex(search), $options: "i" };

  const sortBy = sort === "ending" ? { endDate: 1 } : { createdAt: -1 };
  const [data, total] = await Promise.all([
    Market.find(filter).sort(sortBy).skip((page - 1) * limit).limit(limit).lean(),
    Market.countDocuments(filter),
  ]);
  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function getMarket(id) {
  const market = await Market.findById(id);
  if (!market) throw notFound("Market not found");
  return market;
}

export async function createMarket(input, adminId) {
  return Market.create({
    ...input,
    noPrice: 100 - input.yesPrice,
    status: "OPEN",
    outcome: null,
    createdBy: adminId,
  });
}

export async function updateMarket(id, input) {
  return withTransaction(async (session) => {
    const market = await Market.findById(id).session(session);
    if (!market) throw notFound("Market not found");
    if (market.status === "RESOLVED") throw conflict("A resolved market cannot be edited");
    if (input.yesPrice !== undefined && market.status !== "OPEN") {
      throw conflict("Prices can only be changed while the market is OPEN");
    }
    const { yesPrice, ...rest } = input;
    market.set(rest);
    if (yesPrice !== undefined) {
      market.yesPrice = yesPrice;
      market.noPrice = 100 - yesPrice;
    }
    return market.save({ session });
  });
}

export async function deleteMarket(id) {
  return withTransaction(async (session) => {
    // Touch the market first so a concurrent trade conflicts with this transaction.
    const market = await Market.findOneAndUpdate({ _id: id }, { $inc: { volume: 0 } }, { session });
    if (!market) throw notFound("Market not found");
    if (await Order.exists({ market: id }).session(session)) {
      throw conflict("Markets with orders cannot be deleted; close or resolve them instead");
    }
    await Market.deleteOne({ _id: id }, { session });
  });
}

export async function closeMarket(id) {
  const market = await Market.findOneAndUpdate(
    { _id: id, status: "OPEN" },
    { status: "CLOSED" },
    { returnDocument: "after" },
  );
  if (market) return market;
  const existing = await Market.findById(id);
  if (!existing) throw notFound("Market not found");
  throw conflict(`Market is already ${existing.status}`);
}

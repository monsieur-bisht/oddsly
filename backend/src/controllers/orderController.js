import * as tradingService from "../services/tradingService.js";

export async function create(req, res) {
  res.status(201).json({ data: await tradingService.buyContracts(req.user._id, req.body) });
}
export async function list(req, res) {
  res.json(await tradingService.listOrders(req.user._id, req.validatedQuery));
}

import * as walletService from "../services/walletService.js";

export async function get(req, res) {
  res.json({ data: { balance: req.user.balance } });
}
export async function transactions(req, res) {
  res.json(await walletService.listTransactions(req.user._id, req.validatedQuery));
}

import * as portfolioService from "../services/portfolioService.js";

export async function get(req, res) {
  res.json({ data: await portfolioService.getPortfolio(req.user._id) });
}

import * as marketService from "../services/marketService.js";
import * as resolutionService from "../services/resolutionService.js";

export async function list(req, res) {
  res.json(await marketService.listMarkets(req.validatedQuery));
}
export async function get(req, res) {
  res.json({ data: await marketService.getMarket(req.params.id) });
}
export async function create(req, res) {
  res.status(201).json({ data: await marketService.createMarket(req.body, req.user._id) });
}
export async function update(req, res) {
  res.json({ data: await marketService.updateMarket(req.params.id, req.body) });
}
export async function remove(req, res) {
  await marketService.deleteMarket(req.params.id);
  res.status(204).end();
}
export async function close(req, res) {
  res.json({ data: await marketService.closeMarket(req.params.id) });
}
export async function resolve(req, res) {
  res.json({ data: await resolutionService.resolveMarket(req.params.id, req.body.outcome) });
}

import * as authService from "../services/authService.js";

export async function register(req, res) {
  const { user, token } = await authService.register(req.body);
  res.status(201).json({ data: { user, token } });
}

export async function login(req, res) {
  const { user, token } = await authService.login(req.body);
  res.json({ data: { user, token } });
}

export async function me(req, res) {
  res.json({ data: { user: req.user } });
}

const TOKEN_KEY = "oddsly_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

// Money helpers: the API speaks integer cents; people read credits.
export const credits = (cents) =>
  (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function api(path, { method = "GET", body } = {}) {
  const token = getToken();
  const res = await fetch(`/api/v1${path}`, {
    method,
    headers: { ...(body ? { "content-type": "application/json" } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const json = await res.json().catch(() => null);
  if (res.status === 401 && token) {
    // Expired or revoked token: drop it and let the app return to the login screen.
    setToken(null);
    window.dispatchEvent(new Event("oddsly:logout"));
  }
  if (!res.ok) {
    const fields = json?.errors?.map((e) => `${e.field}: ${e.message}`).join("; ");
    throw new ApiError(fields || json?.detail || "Request failed", res.status, json?.errors);
  }
  return json;
}

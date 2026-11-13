import { useState } from "react";
import { api, setToken } from "./api.js";
import { btn, card, input } from "./ui.js";

export default function Auth({ onAuthed }) {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body =
      mode === "login"
        ? { email: f.get("email"), password: f.get("password") }
        : { email: f.get("email"), username: f.get("username"), password: f.get("password") };
    setBusy(true);
    setError(null);
    try {
      const { data } = await api(`/auth/${mode}`, { method: "POST", body });
      setToken(data.token);
      onAuthed(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto mt-16 max-w-sm px-4">
      <h1 className="mb-1 text-3xl font-bold text-emerald-400">Oddsly</h1>
      <p className="mb-6 text-sm text-slate-400">Practice prediction market. Virtual credits only, no real money.</p>
      <form onSubmit={submit} className={`${card} space-y-3`}>
        <label className="block text-sm">
          Email
          <input name="email" type="email" required autoComplete="email" className={input} />
        </label>
        {mode === "register" && (
          <label className="block text-sm">
            Username
            <input name="username" required minLength={3} maxLength={30} pattern="[A-Za-z0-9_]+" className={input} />
          </label>
        )}
        <label className="block text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={mode === "register" ? 10 : 1}
            maxLength={72}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className={input}
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}
        <button disabled={busy} className={`${btn} w-full`}>
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account (+10,000 credits)"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
          className="w-full text-sm text-slate-400 underline"
        >
          {mode === "login" ? "New here? Create an account" : "Have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}

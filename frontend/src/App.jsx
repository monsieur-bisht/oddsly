import { useCallback, useEffect, useState } from "react";
import { api, credits, getToken, setToken } from "./api.js";
import Auth from "./Auth.jsx";
import Markets from "./Markets.jsx";
import Portfolio from "./Portfolio.jsx";
import Wallet from "./Wallet.jsx";
import CreateMarket from "./CreateMarket.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(() => Boolean(getToken()));
  const [view, setView] = useState("markets");

  const refreshUser = useCallback(
    () => api("/auth/me").then((r) => setUser(r.data.user)).catch(() => {}),
    [],
  );

  useEffect(() => {
    if (!getToken()) return;
    api("/auth/me")
      .then((r) => setUser(r.data.user))
      .catch(() => setToken(null))
      .finally(() => setBooting(false));
  }, []);

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener("oddsly:logout", onLogout);
    return () => window.removeEventListener("oddsly:logout", onLogout);
  }, []);

  if (booting) return <p className="p-6 text-slate-400">Loading…</p>;
  if (!user) return <Auth onAuthed={(u) => { setUser(u); setView("markets"); }} />;

  const tabs = [["markets", "Markets"], ["portfolio", "Portfolio"], ["wallet", "Wallet"], ...(user.role === "admin" ? [["create", "New market"]] : [])];

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-3 py-4">
        <h1 className="text-2xl font-bold text-emerald-400">Oddsly</h1>
        <div className="flex items-center gap-4 text-sm">
          <span aria-label="Balance">
            {user.username} · <strong>{credits(user.balance)}</strong> credits
          </span>
          <button
            className="text-slate-400 underline"
            onClick={() => {
              setToken(null);
              setUser(null);
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <nav aria-label="Main" className="mb-6 flex gap-2 border-b border-slate-800">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            aria-current={view === key ? "page" : undefined}
            onClick={() => setView(key)}
            className={`px-3 py-2 text-sm ${view === key ? "border-b-2 border-emerald-500 font-semibold" : "text-slate-400 hover:text-slate-200"}`}
          >
            {label}
          </button>
        ))}
      </nav>
      <main>
        {view === "markets" && <Markets user={user} onChanged={refreshUser} />}
        {view === "portfolio" && <Portfolio />}
        {view === "wallet" && <Wallet />}
        {view === "create" && user.role === "admin" && <CreateMarket />}
      </main>
    </div>
  );
}

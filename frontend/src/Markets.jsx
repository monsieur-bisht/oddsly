import { useState } from "react";
import { api, credits } from "./api.js";
import { useApi } from "./hooks.js";
import { btn, btnGhost, card, input } from "./ui.js";

const STATUS_STYLE = { OPEN: "text-emerald-400", CLOSED: "text-amber-400", RESOLVED: "text-slate-400" };

function Trade({ market, onDone }) {
  const [side, setSide] = useState("YES");
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const price = side === "YES" ? market.yesPrice : market.noPrice;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api("/orders", { method: "POST", body: { marketId: market._id, side, quantity: Number(qty) } });
      setMsg({ ok: true, text: `Bought ${qty} ${side} contract${qty > 1 ? "s" : ""}` });
      onDone();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-wrap items-end gap-3">
      <div role="group" aria-label="Side" className="flex gap-1">
        {["YES", "NO"].map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={side === s}
            onClick={() => setSide(s)}
            className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${
              side === s ? "border-emerald-500 bg-emerald-600 text-white" : "border-slate-700 hover:bg-slate-800"
            }`}
          >
            {s} {s === "YES" ? market.yesPrice : market.noPrice}¢
          </button>
        ))}
      </div>
      <label className="text-sm">
        Contracts
        <input type="number" min={1} max={10000} step={1} required value={qty} onChange={(e) => setQty(e.target.value)} className={`${input} w-28`} />
      </label>
      <button disabled={busy || !(qty >= 1)} className={btn}>
        Buy for {credits(price * (Number(qty) || 0))}
      </button>
      {msg && (
        <p role="status" className={`w-full text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>
          {msg.text}
        </p>
      )}
    </form>
  );
}

function Admin({ market, onDone }) {
  const [error, setError] = useState(null);
  async function run(path, body, confirmText) {
    if (confirmText && !window.confirm(confirmText)) return;
    setError(null);
    try {
      await api(path, { method: "POST", body });
      onDone();
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3 text-sm">
      <span className="text-slate-400">Admin:</span>
      {market.status === "OPEN" && (
        <button className={btnGhost} onClick={() => run(`/admin/markets/${market._id}/close`)}>
          Close
        </button>
      )}
      {market.status !== "RESOLVED" &&
        ["YES", "NO"].map((o) => (
          <button
            key={o}
            className={btnGhost}
            onClick={() => run(`/admin/markets/${market._id}/resolve`, { outcome: o }, `Resolve "${market.title}" as ${o}? This pays winners and cannot be undone.`)}
          >
            Resolve {o}
          </button>
        ))}
      {error && (
        <span role="alert" className="text-red-400">
          {error}
        </span>
      )}
    </div>
  );
}

export default function Markets({ user, onChanged }) {
  const [filters, setFilters] = useState({ search: "", category: "", status: "OPEN" });
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);

  const qs = new URLSearchParams({ page, limit: 10, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
  const { data, error, loading } = useApi(`/markets?${qs}`, reload);

  const changed = () => {
    setReload((n) => n + 1);
    onChanged(); // refresh the balance in the header
  };

  return (
    <section>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setPage(1);
          setFilters({ search: f.get("search").trim(), category: f.get("category").trim().toLowerCase(), status: f.get("status") });
        }}
        className="mb-4 flex flex-wrap gap-2"
      >
        <input name="search" placeholder="Search markets" aria-label="Search markets" defaultValue={filters.search} className={`${input} max-w-xs`} />
        <input name="category" placeholder="Category" aria-label="Category" defaultValue={filters.category} className={`${input} max-w-40`} />
        <select name="status" aria-label="Status" defaultValue={filters.status} className={`${input} max-w-40`}>
          <option value="">All statuses</option>
          <option>OPEN</option>
          <option>CLOSED</option>
          <option>RESOLVED</option>
        </select>
        <button className={btn}>Filter</button>
      </form>

      {error && (
        <p role="alert" className="text-red-400">
          {error.message}
        </p>
      )}
      {loading && !data && <p className="text-slate-400">Loading…</p>}
      {data?.data.length === 0 && <p className="text-slate-400">No markets match.</p>}

      <ul className="space-y-3">
        {data?.data.map((m) => (
          <li key={m._id} className={card}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{m.title}</h2>
                <p className="text-xs text-slate-400">
                  {m.category} · ends {new Date(m.endDate).toLocaleString()} · {m.volume} traded
                </p>
                {m.description && <p className="mt-1 text-sm text-slate-300">{m.description}</p>}
              </div>
              <span className={`text-xs font-semibold ${STATUS_STYLE[m.status]}`}>
                {m.status}
                {m.outcome ? `: ${m.outcome}` : ""}
              </span>
            </div>
            {m.status === "OPEN" && new Date(m.endDate) > new Date() && <Trade market={m} onDone={changed} />}
            {user.role === "admin" && <Admin market={m} onDone={changed} />}
          </li>
        ))}
      </ul>

      {data && data.pagination.pages > 1 && (
        <div className="mt-4 flex items-center gap-3 text-sm">
          <button className={btnGhost} disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>
            Page {data.pagination.page} of {data.pagination.pages}
          </span>
          <button className={btnGhost} disabled={page >= data.pagination.pages} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      )}
    </section>
  );
}

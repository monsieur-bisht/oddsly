import { useState } from "react";
import { credits } from "./api.js";
import { useApi } from "./hooks.js";
import { btnGhost } from "./ui.js";

const LABEL = { SIGNUP_BONUS: "Signup bonus", TRADE_BUY: "Trade", PAYOUT: "Payout" };

export default function Wallet() {
  const [page, setPage] = useState(1);
  const { data, error, loading } = useApi(`/wallet/transactions?page=${page}&limit=15`);
  if (error) return <p role="alert" className="text-red-400">{error.message}</p>;
  if (loading && !data) return <p className="text-slate-400">Loading…</p>;

  return (
    <section>
      <table className="w-full text-left text-sm">
        <thead className="text-slate-400">
          <tr>
            <th className="py-2">When</th>
            <th>Type</th>
            <th>Market</th>
            <th className="text-right">Amount</th>
            <th className="text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {data.data.map((t) => (
            <tr key={t._id} className="border-t border-slate-800">
              <td className="py-2">{new Date(t.createdAt).toLocaleString()}</td>
              <td>{LABEL[t.type]}</td>
              <td>{t.market?.title ?? "—"}</td>
              <td className={`text-right ${t.amount < 0 ? "text-red-400" : "text-emerald-400"}`}>{credits(t.amount)}</td>
              <td className="text-right">{credits(t.balanceAfter)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex items-center gap-3 text-sm">
        <button className={btnGhost} disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <span>
          Page {data.pagination.page} of {Math.max(1, data.pagination.pages)}
        </span>
        <button className={btnGhost} disabled={page >= data.pagination.pages} onClick={() => setPage(page + 1)}>
          Next
        </button>
      </div>
    </section>
  );
}

import { credits } from "./api.js";
import { useApi } from "./hooks.js";
import { card } from "./ui.js";

const pnlColor = (c) => (c > 0 ? "text-emerald-400" : c < 0 ? "text-red-400" : "");

export default function Portfolio() {
  const { data, error, loading } = useApi("/portfolio");
  if (error) return <p role="alert" className="text-red-400">{error.message}</p>;
  if (loading) return <p className="text-slate-400">Loading…</p>;
  const { positions, summary } = data.data;

  return (
    <section>
      <dl className="mb-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <div className={card}>
          <dt className="text-slate-400">Invested (open)</dt>
          <dd className="text-lg font-semibold">{credits(summary.openInvested)}</dd>
        </div>
        <div className={card}>
          <dt className="text-slate-400">Potential payout</dt>
          <dd className="text-lg font-semibold">{credits(summary.potentialPayout)}</dd>
        </div>
        <div className={card}>
          <dt className="text-slate-400">Realized P/L</dt>
          <dd className={`text-lg font-semibold ${pnlColor(summary.realizedPnl)}`}>{credits(summary.realizedPnl)}</dd>
        </div>
      </dl>
      {positions.length === 0 ? (
        <p className="text-slate-400">No positions yet. Buy a contract on the Markets tab.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="py-2">Market</th>
                <th>Side</th>
                <th>Qty</th>
                <th>Avg price</th>
                <th>Invested</th>
                <th>Potential payout</th>
                <th>Realized P/L</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={`${p.marketId}-${p.side}`} className="border-t border-slate-800">
                  <td className="py-2">
                    {p.title} <span className="text-xs text-slate-500">({p.marketStatus}{p.outcome ? `: ${p.outcome}` : ""})</span>
                  </td>
                  <td>{p.side}</td>
                  <td>{p.quantity}</td>
                  <td>{p.averagePrice}¢</td>
                  <td>{credits(p.invested)}</td>
                  <td>{p.settled ? "—" : credits(p.potentialPayout)}</td>
                  <td className={pnlColor(p.realizedPnl)}>{p.settled ? credits(p.realizedPnl) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

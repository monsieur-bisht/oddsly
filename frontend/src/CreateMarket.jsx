import { useState } from "react";
import { api } from "./api.js";
import { btn, card, input } from "./ui.js";

export default function CreateMarket() {
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true);
    setMsg(null);
    try {
      await api("/markets", {
        method: "POST",
        body: {
          title: f.get("title"),
          description: f.get("description") || undefined,
          category: f.get("category"),
          yesPrice: Number(f.get("yesPrice")),
          endDate: new Date(f.get("endDate")).toISOString(),
        },
      });
      setMsg({ ok: true, text: "Market created. Find it on the Markets tab." });
      form.reset();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className={`${card} max-w-lg space-y-3`}>
      <h2 className="font-semibold">Create market</h2>
      <label className="block text-sm">
        Question
        <input name="title" required minLength={5} maxLength={200} className={input} />
      </label>
      <label className="block text-sm">
        Description (optional)
        <textarea name="description" maxLength={2000} rows={2} className={input} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          Category
          <input name="category" required minLength={2} maxLength={40} className={input} />
        </label>
        <label className="block text-sm">
          YES price (1–99¢)
          <input name="yesPrice" type="number" required min={1} max={99} step={1} defaultValue={50} className={input} />
        </label>
      </div>
      <label className="block text-sm">
        Ends
        <input name="endDate" type="datetime-local" required className={input} />
      </label>
      {msg && (
        <p role="status" className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>
          {msg.text}
        </p>
      )}
      <button disabled={busy} className={btn}>
        Create
      </button>
    </form>
  );
}

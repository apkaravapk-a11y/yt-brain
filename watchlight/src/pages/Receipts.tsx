import { useState } from "react";
import { toast } from "sonner";

interface Rec { id: string; ts: string; action: string; target: string; reason: string; }
const SEED: Rec[] = [
  { id: "r1", ts: "2026-04-26 14:22", action: "Posted comment", target: "youtube.com/watch?v=abc on @AI Daily", reason: "you opened a window for 30 min · Π p=0.91" },
  { id: "r2", ts: "2026-04-26 13:05", action: "Liked video",     target: "RAG with LlamaIndex",                  reason: "auto-eligible · Π p=0.94" },
  { id: "r3", ts: "2026-04-26 09:00", action: "Sent daily brief", target: "Windows toast",                        reason: "scheduled" },
];

export default function Receipts() {
  const [recs, setRecs] = useState<Rec[]>(SEED);
  const undo = (id: string) => {
    const r = recs.find((x) => x.id === id);
    setRecs((xs) => xs.filter((x) => x.id !== id));
    toast.success(`Undone: ${r?.action}`, {
      description: "Action reversed and logged.",
      action: { label: "Restore", onClick: () => r && setRecs((xs) => [r, ...xs]) },
    });
  };
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-medium tracking-tight mb-2 text-on-surface">Privacy Receipts</h1>
      <p className="text-on-surface-variant mb-6">Every external write Watchlight made on your behalf — with a one-click undo.</p>
      {recs.length === 0 && (
        <div className="elev-2 rounded-2xl p-10 text-center">
          <span className="material-symbols-rounded text-on-surface-variant" style={{ fontSize: 48 }}>receipt_long</span>
          <div className="text-lg font-medium mt-3">No receipts</div>
          <div className="text-sm text-on-surface-variant mt-1">When Watchlight does something on your behalf, it shows up here.</div>
        </div>
      )}
      <div className="space-y-3">
        {recs.map((r) => (
          <div key={r.id} className="elev-2 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-rounded" style={{ color: "var(--md-success)" }}>check_circle</span>
              <div className="flex-1">
                <div className="font-medium text-on-surface">{r.action} · {r.target}</div>
                <div className="text-xs text-on-surface-variant mt-1">{r.ts} · {r.reason}</div>
              </div>
              <button className="btn" onClick={() => undo(r.id)}>
                <span className="material-symbols-rounded">undo</span> Undo
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

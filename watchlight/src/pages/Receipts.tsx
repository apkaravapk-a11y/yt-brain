const RECEIPTS = [
  { ts: "2026-04-26 14:22", action: "Posted comment", target: "youtube.com/watch?v=abc on @AI Daily", reason: "you opened a window for 30 min · Π p=0.91" },
  { ts: "2026-04-26 13:05", action: "Liked video",    target: "RAG with LlamaIndex",                  reason: "auto-eligible · Π p=0.94" },
  { ts: "2026-04-26 09:00", action: "Sent daily brief", target: "Windows toast",                       reason: "scheduled" },
];
export default function Receipts() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-medium tracking-tight mb-2 text-on-surface">Privacy Receipts</h1>
      <p className="text-on-surface-variant mb-6">Every external write Watchlight made on your behalf — with a one-click undo.</p>
      <div className="space-y-3">
        {RECEIPTS.map((r, i) => (
          <div key={i} className="elev-2 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-rounded text-success">check_circle</span>
              <div className="flex-1">
                <div className="font-medium text-on-surface">{r.action} · {r.target}</div>
                <div className="text-xs text-on-surface-variant mt-1">{r.ts} · {r.reason}</div>
              </div>
              <button className="btn"><span className="material-symbols-rounded">undo</span> Undo</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

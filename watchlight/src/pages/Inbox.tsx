const ITEMS = [
  { title: "RAG with LlamaIndex — hybrid retrieval", ch: "AI Daily", conf: 0.87, files: 5 },
  { title: "Agentic workflows in production", ch: "AI Daily", conf: 0.79, files: 3 },
  { title: "Fine-tuning Qwen2.5 with LoRA", ch: "Trelis Research", conf: 0.82, files: 7 },
];
export default function Inbox() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-medium tracking-tight mb-2 text-on-surface">Inbox</h1>
      <p className="text-on-surface-variant mb-6">Overnight extracts ranked by Π predicted-yes × technique-confidence.</p>
      <div className="space-y-3">
        {ITEMS.map((it, i) => (
          <div key={i} className="elev-2 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                   style={{ background: "color-mix(in srgb, var(--md-primary) 15%, transparent)" }}>
                <span className="material-symbols-rounded text-primary">commit</span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-on-surface">{it.title}</div>
                <div className="text-xs text-on-surface-variant mt-1">
                  {it.ch} · confidence {(it.conf * 100).toFixed(0)}% · {it.files} files in diff
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="btn btn-primary"><span className="material-symbols-rounded">check</span> Apply</button>
                  <button className="btn">Snooze</button>
                  <button className="btn">Reject</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

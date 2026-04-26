import { useState } from "react";
import { toast } from "sonner";

interface Item { id: string; title: string; ch: string; conf: number; files: number; status?: "pending" | "applied" | "snoozed" | "rejected"; }

const SEED: Item[] = [
  { id: "i1", title: "RAG with LlamaIndex — hybrid retrieval", ch: "AI Daily",        conf: 0.87, files: 5 },
  { id: "i2", title: "Agentic workflows in production",         ch: "AI Daily",        conf: 0.79, files: 3 },
  { id: "i3", title: "Fine-tuning Qwen2.5 with LoRA",            ch: "Trelis Research", conf: 0.82, files: 7 },
  { id: "i4", title: "Building a personal coding agent",         ch: "Hamel Husain",    conf: 0.74, files: 4 },
];

export default function Inbox() {
  const [items, setItems] = useState<Item[]>(SEED);

  const act = (id: string, status: Item["status"], label: string) => {
    setItems((xs) => xs.map((x) => x.id === id ? { ...x, status } : x));
    const item = items.find((x) => x.id === id);
    toast.success(`${label} · ${item?.title.slice(0, 40)}…`, {
      action: { label: "Undo", onClick: () => setItems((xs) => xs.map((x) => x.id === id ? { ...x, status: undefined } : x)) },
    });
  };

  const visible = items.filter((x) => x.status !== "rejected");

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-medium tracking-tight mb-2 text-on-surface">Inbox</h1>
      <p className="text-on-surface-variant mb-6">Overnight extracts ranked by Π predicted-yes × technique-confidence.</p>
      {visible.length === 0 && (
        <div className="elev-2 rounded-2xl p-10 text-center">
          <span className="material-symbols-rounded text-on-surface-variant" style={{ fontSize: 48 }}>inbox</span>
          <div className="text-lg font-medium mt-3">All caught up</div>
          <div className="text-sm text-on-surface-variant mt-1">No pending extracts.</div>
        </div>
      )}
      <div className="space-y-3">
        {visible.map((it) => (
          <div key={it.id} className={"elev-2 rounded-2xl p-5 transition-all " + (it.status === "applied" ? "glow" : "")}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                   style={{ background: it.status === "applied"
                     ? "color-mix(in srgb, var(--md-success) 20%, transparent)"
                     : "color-mix(in srgb, var(--md-primary) 15%, transparent)" }}>
                <span className="material-symbols-rounded" style={{ color: it.status === "applied" ? "var(--md-success)" : "var(--md-primary)" }}>
                  {it.status === "applied" ? "check_circle" : "commit"}
                </span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-on-surface">{it.title}</div>
                <div className="text-xs text-on-surface-variant mt-1">
                  {it.ch} · confidence {(it.conf * 100).toFixed(0)}% · {it.files} files in diff
                  {it.status && <span className="ml-2 chip active" style={{ padding: "1px 8px", fontSize: 10 }}>{it.status}</span>}
                </div>
                {!it.status && (
                  <div className="flex gap-2 mt-3">
                    <button className="btn btn-primary" onClick={() => act(it.id, "applied", "Applied")}>
                      <span className="material-symbols-rounded">check</span> Apply
                    </button>
                    <button className="btn" onClick={() => act(it.id, "snoozed", "Snoozed")}>Snooze</button>
                    <button className="btn" onClick={() => act(it.id, "rejected", "Rejected")}>Reject</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

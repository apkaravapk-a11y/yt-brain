import { useState } from "react";

interface W { action: string; expires: string; used: number; max: number; previews: string[]; }

export default function Windows() {
  const [list, setList] = useState<W[]>([]);
  const open = () => {
    setList((l) => [...l, {
      action: "like",
      expires: "29m 56s",
      used: 0,
      max: 3,
      previews: [
        "RAG explainer (p=0.84)",
        "Qwen-coder LoRA talk (p=0.92)",
        "Agentic RAG demo (p=0.88)",
      ],
    }]);
  };
  const close = (i: number) => setList((l) => l.filter((_, idx) => idx !== i));
  return (
    <div className="p-4">
      <h2 className="text-xl m-0 mb-2">Consent Windows — d-escape hatches</h2>
      <p className="text-dim text-xs mb-4">
        Session-scoped permission ceilings. Dry-run preview before open. Auto-close on time or count.
      </p>
      {list.length === 0 && (
        <div className="text-dim text-xs">(no open windows — resting in wide-floor)</div>
      )}
      {list.map((w, i) => (
        <div key={i} className="bg-panel border border-accent rounded p-4 mb-3">
          <div>
            <b className="text-accent">{w.action}</b> — {w.used}/{w.max} used · {w.expires}
            <button className="btn btn-bad ml-4" onClick={() => close(i)}>close now</button>
          </div>
          <div className="text-dim text-xs mt-1">
            Dry-run preview: {w.previews.join(" · ")}
          </div>
        </div>
      ))}
      <button className="btn btn-primary mt-3" onClick={open}>
        + Open window: like for 30 min (max 3)
      </button>
    </div>
  );
}

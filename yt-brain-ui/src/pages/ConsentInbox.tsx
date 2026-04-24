import { useState } from "react";
import { api } from "../lib/api";

const PENDING = [
  { id: "q1", action: "like", target: "RAG with LlamaIndex — hybrid retrieval", p: 0.72,
    reasons: ["channel trust 0.88", "matches your embed project"] },
  { id: "q2", action: "save_to_playlist", target: "Fine-tuning Qwen2.5 with LoRA", p: 0.81,
    reasons: ["similar to 4 watched", "+18% eval on last adapter"] },
  { id: "q3", action: "subscribe", target: "Local AI", p: 0.54,
    reasons: ["new channel", "3 videos watched in 7d"] },
];

export default function ConsentInbox() {
  const [probe, setProbe] = useState("like");
  const [result, setResult] = useState<string>("");

  const doProbe = async () => {
    try {
      const r = await api.consent.decide(probe);
      setResult(JSON.stringify(r, null, 2));
    } catch (e) {
      setResult(`offline — error: ${e}`);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl m-0 mb-2">Consent Inbox — Π decisions needing you</h2>
      <p className="text-dim text-xs mb-4">Every ask trains both LightGBM (hourly) and LoRA (nightly).</p>

      {PENDING.map((q) => (
        <div key={q.id} className="bg-panel border border-border rounded p-4 mb-3">
          <div>
            <b className="text-accent2">{q.action}</b> on <span>{q.target}</span>
            <span className="float-right text-dim">Π p={q.p.toFixed(2)}</span>
          </div>
          <ul className="text-dim text-xs list-disc list-inside mt-1">
            {q.reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
          <div className="flex gap-1 mt-2">
            <button className="btn btn-ok">allow</button>
            <button className="btn btn-bad">deny</button>
            <button className="btn">allow all similar</button>
          </div>
        </div>
      ))}

      <h3 className="text-accent mt-6 mb-2 text-sm uppercase tracking-wide">Probe the policy</h3>
      <div className="flex gap-2 items-center">
        <input
          value={probe}
          onChange={(e) => setProbe(e.target.value)}
          className="bg-panel border border-border rounded px-3 py-2 text-sm"
          placeholder="action name (e.g. like, delete_account)"
        />
        <button className="btn btn-primary" onClick={doProbe}>policy.decide()</button>
      </div>
      {result && (
        <pre className="bg-panel border border-border rounded p-3 mt-3 text-xs overflow-auto">
          {result}
        </pre>
      )}
    </div>
  );
}

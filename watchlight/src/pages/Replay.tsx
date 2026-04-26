import { useState } from "react";
const VIDEOS = [
  "RAG with LlamaIndex","Agentic workflows","Coding agent","Ollama setup","Qwen LoRA",
  "three.js 3D","React Three Fiber","UMAP","Playwright","CDP","Home feed","Trending AI",
];
export default function Replay() {
  const [d, setD] = useState(0);
  const date = new Date(); date.setDate(date.getDate() - d);
  const lbl = d === 0 ? "today" : `${d} days ago — ${date.toISOString().split("T")[0]}`;
  const shuffled = [...VIDEOS].sort((a, b) => ((a.charCodeAt(1) + d) % 7) - ((b.charCodeAt(1) + d) % 7));
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-medium tracking-tight mb-2 text-on-surface">Web Replay</h1>
      <p className="text-on-surface-variant mb-4">Travel back through your YouTube feed.</p>
      <div className="elev-2 rounded-2xl p-5 mb-6">
        <input type="range" min={0} max={30} value={d} onChange={(e) => setD(parseInt(e.target.value))} className="w-full" />
        <div className="text-on-surface mt-2">{lbl}</div>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {shuffled.slice(0, 8).map((t) => (
          <div key={t} className="hero-tile aspect-video flex items-end p-4">
            <div>
              <div className="text-on-surface font-medium text-sm">{t}</div>
              <div className="text-xs text-on-surface-variant mt-1">archived snapshot</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

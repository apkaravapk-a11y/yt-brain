import { useState } from "react";

const VIDEOS = [
  "RAG with LlamaIndex",
  "Agentic workflows",
  "Personal coding agent",
  "Ollama on Windows",
  "Qwen LoRA fine-tune",
  "three.js 3D scatter",
  "React Three Fiber",
  "UMAP explained",
  "Playwright profiles",
  "CDP deep dive",
  "Home feed 2026-04-22",
  "Trending AI Agents",
];

export default function Replay() {
  const [d, setD] = useState(0);
  const date = new Date();
  date.setDate(date.getDate() - d);
  const label = d === 0 ? "today" : `${d} days ago (${date.toISOString().split("T")[0]})`;
  const shuffled = [...VIDEOS].sort(
    (a, b) => ((a.charCodeAt(1) + d) % 7) - ((b.charCodeAt(1) + d) % 7),
  );
  return (
    <div className="p-4">
      <h2 className="text-xl m-0 mb-2">Web Replay — travel back in your feed</h2>
      <input
        type="range"
        min={0}
        max={30}
        value={d}
        onChange={(e) => setD(parseInt(e.target.value))}
        className="w-full"
      />
      <div className="text-dim text-xs my-2">{label}</div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}>
        {shuffled.slice(0, 8).map((t) => (
          <div key={t} className="bg-panel border border-border rounded p-3">
            <div className="h-28 rounded mb-2 flex items-center justify-center text-dim text-xs px-2 text-center"
                 style={{ background: "linear-gradient(135deg, #333, #111)" }}>
              {t.split(" ").slice(0, 3).join(" ")}
            </div>
            <div className="text-sm">{t}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

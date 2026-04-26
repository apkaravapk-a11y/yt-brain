import { useEffect, useRef, useState } from "react";
import { useLiveStore } from "../lib/store";

const SIM: [string, string][] = [
  ["browser.goto", "https://youtube.com/"],
  ["harvest.home", "captured 20 tiles"],
  ["video.upsert", "3 new, 17 skipped"],
  ["psi.harvest_history", "rank-over-time recorded"],
  ["consent.decide", "like(a1) → p=0.72 → ask"],
  ["yt-ai.embed", "nomic-embed-text → 768d × 20"],
  ["umap.incremental", "3D positions updated"],
  ["notify.push", "3 new inbox candidates"],
];

export default function CoPilot() {
  const events = useLiveStore((s) => s.events);
  const pushEvent = useLiveStore((s) => s.pushEvent);
  const [input, setInput] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let id: number | null = null;
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      const [tag, text] = SIM[Math.floor(Math.random() * SIM.length)];
      pushEvent({ t: Date.now(), tag, text });
    };
    id = window.setInterval(tick, 2200);
    return () => { if (id !== null) clearInterval(id); };
  }, [pushEvent]);

  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [events.length]);

  return (
    <div className="p-8 max-w-5xl mx-auto h-full flex flex-col" style={{ height: "calc(100vh - 73px)" }}>
      <h1 className="text-3xl font-medium tracking-tight mb-2 text-on-surface">Live Co-Pilot</h1>
      <p className="text-on-surface-variant mb-4">Stream of every action the AI takes for you.</p>
      <div ref={ref} className="elev-2 rounded-2xl p-5 flex-1 overflow-y-auto font-mono text-xs">
        {events.slice().reverse().map((e, i) => (
          <div key={`${e.t}-${i}`} className="py-1">
            <span className="text-primary">[{e.tag}]</span>{" "}
            <span className="text-on-surface">{e.text}</span>
          </div>
        ))}
        {events.length === 0 && <div className="text-on-surface-variant">Waiting for events…</div>}
      </div>
      <div className="flex gap-2 mt-4">
        <input
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && input.trim()) { pushEvent({ t: Date.now(), tag: "you", text: input }); setInput(""); } }}
          placeholder="Direct the co-pilot…"
          className="flex-1 bg-surface-2 border border-outline-variant rounded-full px-5 py-3 text-on-surface"
        />
        <button className="btn btn-primary">Send</button>
      </div>
    </div>
  );
}

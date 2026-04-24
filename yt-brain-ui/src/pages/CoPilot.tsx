import { useEffect, useRef, useState } from "react";
import { useStore } from "../lib/store";

const SIM_LINES: [string, string][] = [
  ["browser.goto", "https://youtube.com/"],
  ["browser.read_dom", "a11y tree: 42 tiles"],
  ["harvest.home", "captured 20 tiles, 3 shelves"],
  ["video.upsert", "3 new, 17 skipped (dedupe)"],
  ["psi.harvest_history", "rank-over-time recorded"],
  ["consent.decide", "like(a1) → p=0.72 → ask"],
  ["browser.screenshot", "C:/browsers/screenshots/..."],
  ["yt-ai.embed", "nomic-embed-text → 768d × 20"],
  ["storage.upsert", "faiss index +20 vectors"],
  ["umap.incremental", "3D positions updated"],
  ["notify.push", "toast: 3 new inbox candidates"],
];

export default function CoPilot() {
  const { events, pushEvent } = useStore();
  const [input, setInput] = useState("");
  const [liveBackend, setLiveBackend] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // When the WebSocket lands events, we'll see them in `events`.
    // If none within 3s, start a local simulation loop so the page never looks dead.
    const t = setTimeout(() => {
      if (events.length > 0) { setLiveBackend(true); return; }
      let i = 0;
      const iv = setInterval(() => {
        const [tag, text] = SIM_LINES[i % SIM_LINES.length];
        pushEvent({ t: Date.now(), tag, text });
        i++;
      }, 2000);
      return () => clearInterval(iv);
    }, 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (viewportRef.current) viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
  }, [events.length]);

  const send = () => {
    if (!input.trim()) return;
    pushEvent({ t: Date.now(), tag: "chat", text: `you: ${input}` });
    setInput("");
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-xl m-0">Live Co-Pilot</h2>
        <span className={`text-xs ${liveBackend ? "text-ok" : "text-warn"}`}>
          {liveBackend ? "● WebSocket attached" : "● backend offline — simulating"}
        </span>
      </div>
      <div
        ref={viewportRef}
        className="flex-1 bg-panel border border-border rounded p-4 overflow-y-auto text-xs"
      >
        {events.slice().reverse().map((e, i) => (
          <div key={i} className="py-0.5">
            <span className="text-accent">[{e.tag}]</span>{" "}
            <span className="text-text">{e.text}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Direct Λ: 'open my YouTube home and add top 3 to Watch Later'"
          className="flex-1 bg-panel border border-border rounded px-3 py-2 text-sm"
        />
        <button className="btn btn-primary" onClick={send}>Send</button>
      </div>
    </div>
  );
}

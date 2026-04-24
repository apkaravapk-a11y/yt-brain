import { useEffect, useRef, useState } from "react";
import { useLiveStore } from "../lib/store";

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
  // A3: use selectors so this component only re-renders when events change.
  const events = useLiveStore((s) => s.events);
  const pushEvent = useLiveStore((s) => s.pushEvent);

  const [input, setInput] = useState("");
  const [liveBackend, setLiveBackend] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // A2 + A4: proper cleanup for both timers + visibility gating so the stream
  // pauses when the tab is hidden and doesn't leak intervals across remounts.
  useEffect(() => {
    let intervalId: number | null = null;
    let timeoutId: number | null = null;
    let i = 0;

    const tick = () => {
      if (document.visibilityState !== "visible") return;
      const [tag, text] = SIM_LINES[i % SIM_LINES.length];
      pushEvent({ t: Date.now(), tag, text });
      i += 1;
    };

    timeoutId = window.setTimeout(() => {
      if (events.length > 0) {
        setLiveBackend(true);
        return;
      }
      // only start the sim if the backend hasn't produced anything
      intervalId = window.setInterval(tick, 2000);
    }, 3000);

    const onVis = () => {
      if (document.visibilityState === "visible" && intervalId === null) {
        // resume the sim if we were paused mid-hidden
        intervalId = window.setInterval(tick, 2000);
      } else if (document.visibilityState !== "visible" && intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (intervalId !== null) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVis);
    };
    // Deliberately not re-creating on `events` change — we set up once per mount.
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
          {liveBackend ? "● WebSocket attached" : "● simulating"}
        </span>
      </div>
      <div
        ref={viewportRef}
        className="flex-1 bg-panel border border-border rounded p-4 overflow-y-auto text-xs"
      >
        {events.slice().reverse().map((e, i) => (
          <div key={`${e.t}-${i}`} className="py-0.5">
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

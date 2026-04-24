import { useEffect, useMemo, useState } from "react";
import { api, type Video } from "../lib/api";

const FALLBACK: Video[] = [
  { video_id: "a1", title: "RAG with LlamaIndex — hybrid retrieval", channel_name: "AI Daily", source: "psi_home" },
  { video_id: "a2", title: "Agentic workflows in production", channel_name: "AI Daily", source: "psi_home" },
  { video_id: "a3", title: "Building a personal coding agent", channel_name: "Hamel Husain", source: "takeout" },
  { video_id: "a4", title: "Minimal Ollama setup on Windows", channel_name: "Local AI", source: "youtube_api" },
  { video_id: "a5", title: "Fine-tuning Qwen2.5 with LoRA", channel_name: "Trelis Research", source: "psi_home" },
  { video_id: "b1", title: "3D scatter with three.js", channel_name: "Bruno Simon", source: "takeout" },
  { video_id: "b2", title: "React Three Fiber basics", channel_name: "Codrops", source: "psi_home" },
  { video_id: "b3", title: "UMAP explained", channel_name: "StatQuest", source: "takeout" },
  { video_id: "c1", title: "Playwright persistent profiles", channel_name: "TestDev", source: "psi_home" },
  { video_id: "c2", title: "Chrome DevTools Protocol deep dive", channel_name: "Steve Kinney", source: "psi_home" },
  { video_id: "d1", title: "Weekly home feed 2026-04-22", channel_name: "Ψ-harvest", source: "psi_home" },
  { video_id: "d2", title: "Trending — AI Agents this week", channel_name: "Ψ-trending", source: "psi_trending" },
];

// A6: hoist the pill resolver out of the render path.
const SOURCE_PILL: Record<string, string> = {
  psi_home: "live",
  psi_trending: "live",
  psi_history: "live",
  psi_subs: "live",
  psi_library: "live",
  psi_search: "live",
  psi_channel: "live",
  psi_watch: "live",
  takeout: "trusted",
  youtube_api: "trusted",
  live_visit: "live",
  mobile_feed: "caution",
  yt_dlp: "caution",
};
function sourcePill(source: string) {
  return SOURCE_PILL[source] ?? "caution";
}

export default function Home() {
  const [videos, setVideos] = useState<Video[]>(FALLBACK);
  const [q, setQ] = useState("");
  const [liveBackend, setLiveBackend] = useState(false);

  useEffect(() => {
    let alive = true;
    api.videos()
      .then((v) => {
        if (!alive) return;
        if (v.length) { setVideos(v); setLiveBackend(true); }
      })
      .catch(() => { /* fall back to sample data */ });
    return () => { alive = false; };
  }, []);

  // A6: memoize the filtered list.
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return videos;
    return videos.filter(
      (v) => v.title.toLowerCase().includes(needle) || v.channel_name.toLowerCase().includes(needle),
    );
  }, [videos, q]);

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl m-0">Home feed</h2>
        <span className={`text-xs ${liveBackend ? "text-ok" : "text-warn"}`}>
          {liveBackend ? "● live backend" : "● offline — showing sample"}
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="filter…"
          className="ml-auto bg-panel border border-border px-3 py-1 rounded text-sm"
        />
      </div>
      <p className="text-dim text-xs mb-4">
        Ingested surfaces: API + Takeout + Ψ-home + Ψ-subs + Ψ-history. Sort: most-relevant-to-me.
      </p>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}>
        {filtered.map((v) => (
          <a
            key={v.video_id}
            href={v.url || `https://youtu.be/${v.video_id}`}
            target="_blank"
            rel="noreferrer"
            className="bg-panel border border-border rounded p-3 hover:border-accent block no-underline text-text"
          >
            <div
              className="h-28 rounded mb-2 flex items-center justify-center text-dim text-xs px-2 text-center"
              style={{ background: "linear-gradient(135deg, #333, #111)" }}
            >
              {v.title.split(" ").slice(0, 5).join(" ")}
            </div>
            <div className="text-sm mb-1">{v.title}</div>
            <div className="text-xs text-dim">{v.channel_name}</div>
            <div className="mt-2 flex gap-1 flex-wrap">
              <span className={`pill ${sourcePill(v.source)}`}>{v.source}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

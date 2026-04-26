import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Video } from "../lib/api";

const FALLBACK: Video[] = [
  { video_id: "a1", title: "RAG with LlamaIndex — hybrid retrieval that actually works", channel_name: "AI Daily", source: "psi_home" },
  { video_id: "a2", title: "Agentic workflows in production", channel_name: "AI Daily", source: "psi_home" },
  { video_id: "a3", title: "Building a personal coding agent in 200 lines", channel_name: "Hamel Husain", source: "takeout" },
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

const FILTERS = ["All", "AI", "Code", "Design", "Live", "Music", "Tutorials"];

export default function Home() {
  const [videos, setVideos] = useState<Video[]>(FALLBACK);
  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    api.videos().then((v) => { if (alive && v.length) setVideos(v); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const tagMap: Record<string, RegExp | null> = {
      All: null,
      AI: /\b(rag|agent|llm|qwen|llama|gpt|ai|fine-tune)\b/i,
      Code: /\b(code|coding|playwright|cdp|api|chrome devtools)\b/i,
      Design: /\b(design|3d|three|react three|umap|scatter)\b/i,
      Live: /^psi_|live|trending/i,
      Music: /\b(music|song|album|artist)\b/i,
      Tutorials: /\b(tutorial|how to|guide|setup|build|build a|setup)\b/i,
    };
    const re = tagMap[filter];
    return videos.filter((v) => {
      if (needle && !`${v.title} ${v.channel_name}`.toLowerCase().includes(needle)) return false;
      if (re && !(re.test(v.title) || re.test(v.channel_name) || re.test(v.source))) return false;
      return true;
    });
  }, [videos, q, filter]);

  const hero = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Hero row */}
      <div className="grid gap-4 mb-10" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        {hero.map((v, i) => (
          <Link to={`/watch/${v.video_id}`} key={v.video_id}>
            <div className="hero-tile aspect-video flex flex-col justify-end p-6 group" style={{ minHeight: 200 }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="material-symbols-rounded text-on-surface-variant opacity-30" style={{ fontSize: 80 }}>
                  play_circle
                </div>
              </div>
              <div className="relative z-10">
                <div className="text-xs text-on-surface-variant mb-1 flex items-center gap-2">
                  <span className="chip" style={{ padding: "2px 8px", fontSize: 11 }}>{i === 0 ? "TOP" : `#${i + 1}`}</span>
                  {v.channel_name}
                </div>
                <div className="font-medium text-on-surface" style={{ fontSize: 16, lineHeight: 1.3 }}>
                  {v.title}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {FILTERS.map((f) => (
          <button key={f} className={`chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search this view…"
          className="ml-auto bg-surface-2 border border-outline-variant rounded-full px-4 py-1.5 text-sm w-64 text-on-surface placeholder:text-on-surface-variant"
        />
      </div>

      {/* Grid */}
      <div className="grid gap-x-4 gap-y-8" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {rest.map((v) => (
          <Link to={`/watch/${v.video_id}`} key={v.video_id} className="group">
            <div className="aspect-video rounded-2xl overflow-hidden mb-3 relative"
                 style={{ background: "linear-gradient(135deg, var(--md-surface-2), var(--md-surface-3))" }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-rounded text-on-surface-variant opacity-20" style={{ fontSize: 60 }}>
                  movie
                </span>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-xs text-white">
                12:34
              </div>
            </div>
            <div className="font-medium text-on-surface line-clamp-2" style={{ fontSize: 14, lineHeight: 1.35 }}>{v.title}</div>
            <div className="text-xs text-on-surface-variant mt-1">{v.channel_name}</div>
            <div className="text-xs text-on-surface-variant">{v.source}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

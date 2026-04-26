// Architecture map + live demo. Pings each service and lights up the diagram in real time.
import { useEffect, useState } from "react";

type Status = "checking" | "up" | "down";
interface Node {
  id: string;
  label: string;
  url?: string;
  desc: string;
  x: number; y: number;
  badge: string;
}

const NODES: Node[] = [
  { id: "user",     label: "You", x: 50, y: 50,
    desc: "Click the icon. Everything starts here.", badge: "1", },
  { id: "ui",       label: "Watchlight UI", x: 50, y: 200,
    desc: "React + Material You. Where you live in the app.", badge: "2", url: window.location.origin },
  { id: "api",      label: "watchlight-api", x: 320, y: 200,
    desc: "FastAPI backend. SQLite, consent engine, harvesters.",
    url: "http://127.0.0.1:11811/api/health", badge: "3", },
  { id: "ai",       label: "watchlight-ai", x: 590, y: 200,
    desc: "OpenAI-compatible router. Ollama → Anthropic → Stub.",
    url: "http://127.0.0.1:11435/v1/status", badge: "4", },
  { id: "ollama",   label: "Ollama", x: 590, y: 380,
    desc: "Local models on your machine.",
    url: "http://127.0.0.1:11434/api/tags", badge: "5", },
  { id: "yt",       label: "YouTube", x: 50, y: 380,
    desc: "Data sources: API + Takeout + Chrome extension.", badge: "6" },
  { id: "storage",  label: "SQLite + FAISS", x: 320, y: 380,
    desc: "All knowledge stays on your laptop.", badge: "7" },
];

const EDGES: [string, string, string][] = [
  ["user",   "ui",      "click"],
  ["ui",     "api",     "REST + WS"],
  ["api",    "ai",      "/v1/chat"],
  ["ai",     "ollama",  "local"],
  ["yt",     "api",     "ingest"],
  ["api",    "storage", "persist"],
];

export default function Map() {
  const [status, setStatus] = useState<Record<string, Status>>({});

  useEffect(() => {
    const probe = async () => {
      const next: Record<string, Status> = {};
      for (const n of NODES) {
        if (!n.url || n.id === "ui") continue;
        next[n.id] = "checking";
      }
      setStatus({ ...next });
      for (const n of NODES) {
        if (!n.url || n.id === "ui") continue;
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 1500);
          await fetch(n.url, { signal: ctrl.signal, mode: "no-cors" });
          clearTimeout(t);
          next[n.id] = "up";
        } catch { next[n.id] = "down"; }
        setStatus({ ...next });
      }
      next["ui"] = "up";
      setStatus({ ...next });
    };
    probe();
    const iv = setInterval(probe, 8000);
    return () => clearInterval(iv);
  }, []);

  const dotColor = (s: Status) =>
    s === "up" ? "var(--md-success)" : s === "down" ? "var(--md-error)" : "var(--md-warn)";

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-medium tracking-tight text-on-surface">How Watchlight runs</h1>
        <p className="text-on-surface-variant mt-2">
          Live map of every component. Each node pings every 8 seconds. Green = healthy, red = offline,
          amber = checking. Click any node to drill in.
        </p>

        <div className="elev-2 rounded-3xl p-6 mt-8 overflow-x-auto">
          <svg viewBox="0 0 700 480" className="w-full" style={{ minWidth: 700, height: 480 }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--md-on-surface-variant)" />
              </marker>
              <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--md-primary)" stopOpacity="0.1" />
                <stop offset="100%" stopColor="var(--md-primary)" stopOpacity="0.6" />
              </linearGradient>
            </defs>

            {EDGES.map(([from, to, label]) => {
              const a = NODES.find((n) => n.id === from)!;
              const b = NODES.find((n) => n.id === to)!;
              return (
                <g key={`${from}-${to}`}>
                  <line
                    x1={a.x + 80} y1={a.y + 30}
                    x2={b.x + 80} y2={b.y + 30}
                    stroke="var(--md-outline)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    markerEnd="url(#arrow)"
                  >
                    <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="1.2s" repeatCount="indefinite" />
                  </line>
                  <text
                    x={(a.x + b.x) / 2 + 80} y={(a.y + b.y) / 2 + 30}
                    fill="var(--md-on-surface-variant)" fontSize="10" textAnchor="middle"
                    style={{ paintOrder: "stroke", stroke: "var(--md-surface-2)", strokeWidth: 4 }}
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {NODES.map((n) => {
              const s = status[n.id] || "checking";
              return (
                <g key={n.id} style={{ cursor: "pointer" }} onClick={() => n.url && window.open(n.url, "_blank")}>
                  <rect
                    x={n.x} y={n.y} width={160} height={60}
                    rx={16}
                    fill="var(--md-surface-3)"
                    stroke={s === "up" ? "var(--md-primary)" : "var(--md-outline-variant)"}
                    strokeWidth={s === "up" ? 2 : 1}
                  />
                  <circle cx={n.x + 18} cy={n.y + 30} r={8} fill={dotColor(s)}>
                    {s === "up" && (
                      <animate attributeName="opacity" values="1;0.5;1" dur="1.6s" repeatCount="indefinite" />
                    )}
                  </circle>
                  <text x={n.x + 32} y={n.y + 25} fill="var(--md-on-surface)" fontSize="14" fontWeight="500">{n.label}</text>
                  <text x={n.x + 32} y={n.y + 44} fill="var(--md-on-surface-variant)" fontSize="10">{n.desc.slice(0, 40)}…</text>
                  <circle cx={n.x + 145} cy={n.y + 18} r={10} fill="var(--md-primary)" opacity="0.15" />
                  <text x={n.x + 145} y={n.y + 21} fill="var(--md-primary)" fontSize="11" textAnchor="middle" fontWeight="600">{n.badge}</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">
          {NODES.map((n) => {
            const s = status[n.id] || "checking";
            return (
              <div key={n.id} className="elev-2 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-on-primary"
                       style={{ background: "var(--md-primary)" }}>{n.badge}</div>
                  <div className="font-medium text-on-surface flex-1">{n.label}</div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: dotColor(s) }} />
                    {s === "up" ? "online" : s === "down" ? "offline" : "checking"}
                  </div>
                </div>
                <p className="text-sm text-on-surface-variant mt-2">{n.desc}</p>
                {n.url && (
                  <a href={n.url} target="_blank" rel="noreferrer" className="text-xs text-primary mt-2 inline-flex items-center gap-1">
                    {n.url} <span className="material-symbols-rounded" style={{ fontSize: 14 }}>open_in_new</span>
                  </a>
                )}
              </div>
            );
          })}
        </div>

        <div className="elev-2 rounded-2xl p-6 mt-8">
          <h2 className="text-lg font-medium text-on-surface flex items-center gap-2">
            <span className="material-symbols-rounded text-primary">play_circle</span>
            How a click flows through the system
          </h2>
          <ol className="mt-4 space-y-3 text-sm text-on-surface-variant">
            <li><b className="text-on-surface">1. You click the Watchlight icon.</b> The PWA opens in a frameless window.</li>
            <li><b className="text-on-surface">2. The UI pings <code>/api/health</code>.</b> If the backend is online, the dock turns green.</li>
            <li><b className="text-on-surface">3. You ask: "show me my recent AI videos".</b> UI calls <code>/api/videos?q=AI</code>.</li>
            <li><b className="text-on-surface">4. Backend hits SQLite</b> with an indexed <code>LIKE</code> query (sub-10ms warm).</li>
            <li><b className="text-on-surface">5. Need a summary?</b> Backend forwards to <code>watchlight-ai</code>, which routes to Ollama (local) → Anthropic (cloud) → Stub.</li>
            <li><b className="text-on-surface">6. The result streams back via SSE</b> to the UI as it generates. No polling.</li>
            <li><b className="text-on-surface">7. Every external write</b> (PR opened, comment posted, like recorded) creates a Receipt — visible in the Receipts page with a one-click undo.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

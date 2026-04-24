import { NavLink, Route, Routes, Link } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { useModeStore, useLiveStore } from "./lib/store";
import { connectLive } from "./lib/api";

// B1: route-level code splitting — each page is its own chunk, loaded on first visit.
// B5: we attach prefetch handlers on each NavLink so hovering warms the chunk.
const Home = lazy(() => import("./pages/Home"));
const Galaxy = lazy(() => import("./pages/Galaxy"));
const CoPilot = lazy(() => import("./pages/CoPilot"));
const Inbox = lazy(() => import("./pages/Inbox"));
const Comments = lazy(() => import("./pages/Comments"));
const Status = lazy(() => import("./pages/Status"));
const ConsentInbox = lazy(() => import("./pages/ConsentInbox"));
const Windows = lazy(() => import("./pages/Windows"));
const Replay = lazy(() => import("./pages/Replay"));
const Modes = lazy(() => import("./pages/Modes"));

const PREFETCH: Record<string, () => Promise<unknown>> = {
  "/": () => import("./pages/Home"),
  "/galaxy": () => import("./pages/Galaxy"),
  "/copilot": () => import("./pages/CoPilot"),
  "/inbox": () => import("./pages/Inbox"),
  "/comments": () => import("./pages/Comments"),
  "/status": () => import("./pages/Status"),
  "/consent": () => import("./pages/ConsentInbox"),
  "/windows": () => import("./pages/Windows"),
  "/replay": () => import("./pages/Replay"),
  "/modes": () => import("./pages/Modes"),
};

const NAV = [
  { to: "/", label: "Home" },
  { to: "/galaxy", label: "3D Galaxy" },
  { to: "/copilot", label: "Live Co-Pilot" },
  { to: "/inbox", label: "Inbox" },
  { to: "/comments", label: "Comments" },
  { to: "/status", label: "Status / Ops" },
  { to: "/consent", label: "Consent Inbox" },
  { to: "/windows", label: "Consent Windows" },
  { to: "/replay", label: "Web Replay" },
  { to: "/modes", label: "Mode Theater" },
];

function PageSkeleton() {
  return <div className="p-4 text-dim text-xs">loading…</div>;
}

function NavEntry({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onMouseEnter={() => PREFETCH[to]?.()}
      onFocus={() => PREFETCH[to]?.()}
      className={({ isActive }) =>
        `block px-4 py-2 text-sm border-l-2 ${isActive ? "border-accent bg-border" : "border-transparent hover:bg-border"}`
      }
    >
      {label}
    </NavLink>
  );
}

export default function App() {
  // A3: selector-scoped reads so App itself doesn't re-render on event pushes.
  const mode = useModeStore((s) => s.mode);
  const setMode = useModeStore((s) => s.setMode);
  const pushEvent = useLiveStore((s) => s.pushEvent);

  useEffect(() => {
    document.body.className = `mode-${mode}`;
  }, [mode]);

  useEffect(() => {
    const ws = connectLive((ev) =>
      pushEvent({ t: Date.now(), tag: ev.tag || "live", text: ev.text || JSON.stringify(ev) }),
    );
    return () => ws?.close();
  }, [pushEvent]);

  // B5: idle-time prefetch of heavy routes (Galaxy + CoPilot) so the first click is instant.
  useEffect(() => {
    if (typeof (window as any).requestIdleCallback === "function") {
      const id = (window as any).requestIdleCallback(() => {
        PREFETCH["/galaxy"]?.();
        PREFETCH["/copilot"]?.();
        PREFETCH["/status"]?.();
      });
      return () => (window as any).cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(() => {
      PREFETCH["/galaxy"]?.();
      PREFETCH["/copilot"]?.();
    }, 1200);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="h-screen grid" style={{ gridTemplateColumns: "220px 1fr", gridTemplateRows: "48px 1fr" }}>
      <header
        className="flex items-center gap-4 px-4 bg-panel border-b border-border"
        style={{ gridColumn: "1 / -1" }}
      >
        <Link to="/" className="text-accent font-semibold tracking-wide">yt-brain</Link>
        <span className="text-dim text-xs">Ω++ · Precision 5560 · T1200 4GB · 64GB</span>
        <span className="ml-auto text-xs flex items-center gap-2">
          <span className="text-dim">mode:</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="bg-panel text-accent2 border border-border px-2 py-1 rounded"
          >
            {["jarvis", "minority", "ops", "samantha", "mentat", "scholar"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </span>
      </header>

      <nav className="bg-panel border-r border-border py-4 overflow-y-auto">
        <div className="text-dim text-xs px-4 py-2 uppercase">Faces</div>
        {NAV.slice(0, 6).map((n) => <NavEntry key={n.to} {...n} />)}
        <div className="text-dim text-xs px-4 py-2 mt-2 uppercase">Learn</div>
        {NAV.slice(6, 9).map((n) => <NavEntry key={n.to} {...n} />)}
        <div className="text-dim text-xs px-4 py-2 mt-2 uppercase">Meta</div>
        {NAV.slice(9).map((n) => <NavEntry key={n.to} {...n} />)}
      </nav>

      <main className="overflow-y-auto relative">
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/galaxy" element={<Galaxy />} />
            <Route path="/copilot" element={<CoPilot />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/comments" element={<Comments />} />
            <Route path="/status" element={<Status />} />
            <Route path="/consent" element={<ConsentInbox />} />
            <Route path="/windows" element={<Windows />} />
            <Route path="/replay" element={<Replay />} />
            <Route path="/modes" element={<Modes />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

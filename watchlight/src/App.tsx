import { Suspense, lazy, useEffect } from "react";
import { NavLink, Route, Routes, Link } from "react-router-dom";
import { Toaster } from "sonner";
import { useModeStore, useUIStore } from "./lib/store";
import CommandPalette from "./components/CommandPalette";
import ActivityDock from "./components/ActivityDock";
import Wizard from "./components/Wizard";
import Shortcuts from "./components/Shortcuts";
import ErrorBoundary from "./components/ErrorBoundary";

const Home = lazy(() => import("./pages/Home"));
const Watch = lazy(() => import("./pages/Watch"));
const Galaxy = lazy(() => import("./pages/Galaxy"));
const Inbox = lazy(() => import("./pages/Inbox"));
const Comments = lazy(() => import("./pages/Comments"));
const CoPilot = lazy(() => import("./pages/CoPilot"));
const Replay = lazy(() => import("./pages/Replay"));
const Modes = lazy(() => import("./pages/Modes"));
const Settings = lazy(() => import("./pages/Settings"));
const Help = lazy(() => import("./pages/Help"));
const Receipts = lazy(() => import("./pages/Receipts"));
const Map = lazy(() => import("./pages/Map"));

const NAV = [
  { to: "/", label: "Home", icon: "home", end: true },
  { to: "/galaxy", label: "Galaxy", icon: "auto_awesome" },
  { to: "/copilot", label: "Co-Pilot", icon: "smart_toy" },
  { to: "/inbox", label: "Inbox", icon: "inbox" },
  { to: "/comments", label: "Comments", icon: "forum" },
  { to: "/replay", label: "Web Replay", icon: "history" },
  { to: "/modes", label: "Modes", icon: "tune" },
  { to: "/receipts", label: "Receipts", icon: "receipt_long" },
  { to: "/map", label: "Map / Demo", icon: "map" },
  { to: "/settings", label: "Settings", icon: "settings" },
  { to: "/help", label: "Help", icon: "help" },
];

function PageSkel() {
  return (
    <div className="p-8 space-y-4">
      <div className="skeleton h-8 w-1/3" />
      <div className="skeleton h-4 w-2/3" />
      <div className="grid grid-cols-3 gap-4 mt-6">
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-40" />)}
      </div>
    </div>
  );
}

export default function App() {
  const mode = useModeStore((s) => s.mode);
  const setPaletteOpen = useUIStore((s) => s.setPaletteOpen);
  const wizardComplete = useUIStore((s) => s.wizardComplete);

  useEffect(() => {
    document.documentElement.setAttribute("data-mode", mode);
  }, [mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPaletteOpen]);

  if (!wizardComplete) return <Wizard />;

  return (
    <div className="h-screen grid" style={{ gridTemplateColumns: "256px 1fr" }}>
      <Sidebar />
      <main className="overflow-y-auto bg-surface relative">
        <TopBar />
        <ErrorBoundary>
          <Suspense fallback={<PageSkel />}>
            <div className="page-enter">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/watch/:id" element={<Watch />} />
                <Route path="/galaxy" element={<Galaxy />} />
                <Route path="/copilot" element={<CoPilot />} />
                <Route path="/inbox" element={<Inbox />} />
                <Route path="/comments" element={<Comments />} />
                <Route path="/replay" element={<Replay />} />
                <Route path="/modes" element={<Modes />} />
                <Route path="/receipts" element={<Receipts />} />
                <Route path="/map" element={<Map />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/help" element={<Help />} />
              </Routes>
            </div>
          </Suspense>
        </ErrorBoundary>
        <Shortcuts />
        <button
          className="fab"
          onClick={() => setPaletteOpen(true)}
          aria-label="Ask Watchlight (Ctrl+K)"
          title="Ask Watchlight (Ctrl+K)"
        >
          <span className="material-symbols-rounded">auto_awesome</span>
        </button>
      </main>
      <CommandPalette />
      <ActivityDock />
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          className: "glass",
          style: { background: "var(--md-surface-3)", color: "var(--md-on-surface)", border: "1px solid var(--md-outline-variant)" },
        }}
      />
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="elev-1 border-r border-outline-variant flex flex-col py-3 overflow-y-auto">
      <Link to="/" className="flex items-center gap-3 px-6 py-4 mb-2">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-on-primary glow"
             style={{ background: "var(--md-primary)" }}>
          <span className="material-symbols-rounded" style={{ fontSize: 24 }}>visibility</span>
        </div>
        <div>
          <div className="font-medium text-on-surface tracking-tight" style={{ fontSize: 18 }}>Watchlight</div>
          <div className="text-xs text-on-surface-variant">your YouTube, with a brain</div>
        </div>
      </Link>
      {NAV.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => "nav-item " + (isActive ? "active" : "")}>
          <span className="material-symbols-rounded" style={{ fontSize: 22 }}>{n.icon}</span>
          {n.label}
        </NavLink>
      ))}
    </aside>
  );
}

function TopBar() {
  const mode = useModeStore((s) => s.mode);
  const setMode = useModeStore((s) => s.setMode);
  const setPaletteOpen = useUIStore((s) => s.setPaletteOpen);
  return (
    <header className="sticky top-0 z-30 glass px-6 py-3 flex items-center gap-4 border-b border-outline-variant">
      <button className="btn btn-text" onClick={() => setPaletteOpen(true)}>
        <span className="material-symbols-rounded">search</span>
        Search or ask Watchlight…
        <kbd className="ml-2 text-xs opacity-60">⌘K</kbd>
      </button>
      <div className="ml-auto flex items-center gap-2">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as any)}
          className="bg-surface-2 border border-outline-variant rounded-full px-3 py-1.5 text-sm text-on-surface"
        >
          {["jarvis", "minority", "ops", "samantha", "mentat", "scholar"].map((m) => (
            <option key={m} value={m}>{m[0].toUpperCase() + m.slice(1)} mode</option>
          ))}
        </select>
      </div>
    </header>
  );
}

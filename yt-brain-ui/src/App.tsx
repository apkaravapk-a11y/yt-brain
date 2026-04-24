import { Link, NavLink, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { useStore } from "./lib/store";
import { connectLive } from "./lib/api";

import Home from "./pages/Home";
import Galaxy from "./pages/Galaxy";
import CoPilot from "./pages/CoPilot";
import Inbox from "./pages/Inbox";
import Comments from "./pages/Comments";
import Status from "./pages/Status";
import ConsentInbox from "./pages/ConsentInbox";
import Windows from "./pages/Windows";
import Replay from "./pages/Replay";
import Modes from "./pages/Modes";

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

export default function App() {
  const { mode, setMode, pushEvent } = useStore();

  useEffect(() => {
    document.body.className = `mode-${mode}`;
  }, [mode]);

  useEffect(() => {
    const ws = connectLive((ev) =>
      pushEvent({ t: Date.now(), tag: ev.tag || "live", text: ev.text || JSON.stringify(ev) }),
    );
    return () => ws?.close();
  }, [pushEvent]);

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
        {NAV.slice(0, 6).map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === "/"}
            className={({ isActive }) =>
              `block px-4 py-2 text-sm border-l-2 ${isActive ? "border-accent bg-border" : "border-transparent hover:bg-border"}`
            }
          >
            {n.label}
          </NavLink>
        ))}
        <div className="text-dim text-xs px-4 py-2 mt-2 uppercase">Learn</div>
        {NAV.slice(6, 9).map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              `block px-4 py-2 text-sm border-l-2 ${isActive ? "border-accent bg-border" : "border-transparent hover:bg-border"}`
            }
          >
            {n.label}
          </NavLink>
        ))}
        <div className="text-dim text-xs px-4 py-2 mt-2 uppercase">Meta</div>
        {NAV.slice(9).map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              `block px-4 py-2 text-sm border-l-2 ${isActive ? "border-accent bg-border" : "border-transparent hover:bg-border"}`
            }
          >
            {n.label}
          </NavLink>
        ))}
      </nav>

      <main className="overflow-y-auto relative">
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
      </main>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const SEQUENCES: Record<string, string> = {
  "g h": "/",
  "g g": "/galaxy",
  "g c": "/copilot",
  "g i": "/inbox",
  "g s": "/settings",
  "g m": "/map",
  "g r": "/receipts",
};

export default function Shortcuts() {
  const nav = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    let pending = "";
    let timer: number | null = null;
    const onKey = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).matches?.("input, textarea, select, [contenteditable]")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "?" || (e.shiftKey && e.key === "/")) { e.preventDefault(); setShowHelp(true); return; }
      if (e.key === "Escape") setShowHelp(false);
      if (e.key.length !== 1) return;
      pending = (pending + e.key.toLowerCase()).slice(-3);
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => { pending = ""; }, 800);
      const trimmed = pending.trim();
      // Try 3-char then 2-char match
      for (const seq of Object.keys(SEQUENCES)) {
        if (trimmed.endsWith(seq)) { nav(SEQUENCES[seq]); pending = ""; return; }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); if (timer) window.clearTimeout(timer); };
  }, [nav]);

  if (!showHelp) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6"
         style={{ background: "rgba(0,0,0,0.6)" }}
         onClick={() => setShowHelp(false)}>
      <div className="glass rounded-3xl p-8 max-w-md w-full glow" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-medium text-on-surface mb-4">Keyboard shortcuts</h2>
        <div className="space-y-2 text-sm">
          {[
            ["⌘ K", "Open command palette / Ask Watchlight"],
            ["?", "Show this help"],
            ["g h", "Go to Home"],
            ["g g", "Go to Galaxy"],
            ["g c", "Go to Co-Pilot"],
            ["g i", "Go to Inbox"],
            ["g m", "Go to Map / Demo"],
            ["g r", "Go to Receipts"],
            ["g s", "Go to Settings"],
            ["esc", "Close any dialog"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-1.5 border-b border-outline-variant">
              <span className="text-on-surface-variant">{v}</span>
              <kbd className="text-primary bg-surface-3 px-2 py-1 rounded text-xs">{k}</kbd>
            </div>
          ))}
        </div>
        <div className="mt-6 text-xs text-on-surface-variant text-center">Press <kbd className="text-primary">esc</kbd> to close</div>
      </div>
    </div>
  );
}

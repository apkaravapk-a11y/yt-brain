import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import { useUIStore, useModeStore, type ModeName } from "../lib/store";
import { useEffect } from "react";
import { toast } from "sonner";

const MODES: ModeName[] = ["jarvis", "minority", "ops", "samantha", "mentat", "scholar"];

export default function CommandPalette() {
  const open = useUIStore((s) => s.paletteOpen);
  const setOpen = useUIStore((s) => s.setPaletteOpen);
  const setMode = useModeStore((s) => s.setMode);
  const nav = useNavigate();

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, setOpen]);

  if (!open) return null;
  const go = (path: string) => { setOpen(false); nav(path); };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh] px-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={() => setOpen(false)}
    >
      <Command
        className="w-full max-w-2xl glass rounded-3xl overflow-hidden glow"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant">
          <span className="material-symbols-rounded text-primary" style={{ fontSize: 24 }}>auto_awesome</span>
          <Command.Input
            placeholder="Ask Watchlight, search videos, jump anywhere…"
            className="flex-1 bg-transparent outline-none text-base text-on-surface placeholder:text-on-surface-variant"
            autoFocus
          />
          <kbd className="text-xs text-on-surface-variant">esc</kbd>
        </div>
        <Command.List className="max-h-[50vh] overflow-y-auto p-2">
          <Command.Empty className="px-4 py-6 text-on-surface-variant text-sm">
            No results. Try "go to galaxy" or "switch to minority".
          </Command.Empty>

          <Command.Group heading="Navigate" className="text-xs text-on-surface-variant px-2 py-1">
            {[
              ["/", "home", "Home"],
              ["/galaxy", "auto_awesome", "3D Galaxy"],
              ["/copilot", "smart_toy", "Live Co-Pilot"],
              ["/inbox", "inbox", "Inbox"],
              ["/comments", "forum", "Comments Explorer"],
              ["/replay", "history", "Web Replay"],
              ["/modes", "tune", "Modes"],
              ["/receipts", "receipt_long", "Privacy Receipts"],
              ["/map", "map", "Architecture Map / Demo"],
              ["/settings", "settings", "Settings"],
              ["/help", "help", "Help"],
            ].map(([p, ic, lbl]) => (
              <Command.Item key={p} value={`go ${lbl}`} onSelect={() => go(p)} className="cmd-item">
                <span className="material-symbols-rounded">{ic}</span>
                <span>{lbl}</span>
                <span className="ml-auto text-xs text-on-surface-variant">{p}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Switch mode" className="text-xs text-on-surface-variant px-2 py-1 mt-2">
            {MODES.map((m) => (
              <Command.Item key={m} value={`mode ${m}`} onSelect={() => { setMode(m); setOpen(false); toast.success(`Mode → ${m}`); }} className="cmd-item">
                <span className="material-symbols-rounded">style</span>
                <span className="capitalize">{m}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Actions" className="text-xs text-on-surface-variant px-2 py-1 mt-2">
            <Command.Item value="reset wizard" onSelect={() => { localStorage.removeItem("watchlight.wizard"); location.reload(); }} className="cmd-item">
              <span className="material-symbols-rounded">refresh</span>
              <span>Re-run onboarding wizard</span>
            </Command.Item>
            <Command.Item value="open vercel" onSelect={() => window.open("https://yt-brain-ui.vercel.app", "_blank")} className="cmd-item">
              <span className="material-symbols-rounded">open_in_new</span>
              <span>Open production deploy</span>
            </Command.Item>
            <Command.Item value="open github" onSelect={() => window.open("https://github.com/apkaravapk-a11y/yt-brain", "_blank")} className="cmd-item">
              <span className="material-symbols-rounded">code</span>
              <span>Open GitHub repo</span>
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
      <style>{`
        .cmd-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; border-radius: 12px;
          color: var(--md-on-surface);
          cursor: pointer;
        }
        .cmd-item[data-selected="true"] {
          background: color-mix(in srgb, var(--md-primary) 12%, transparent);
        }
      `}</style>
    </div>
  );
}

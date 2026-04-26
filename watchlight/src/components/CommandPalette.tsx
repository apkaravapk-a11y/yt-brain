import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import { useUIStore, useModeStore, type ModeName } from "../lib/store";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const MODES: ModeName[] = ["jarvis", "minority", "ops", "samantha", "mentat", "scholar"];

// Mock streamed answer for AI Spotlight (replace with real /api/ai/ask SSE later)
const MOCK_ANSWERS: Record<string, { text: string; cites: string[] }> = {
  rag: {
    text: "Across 8 videos in your library, hybrid retrieval (BM25 + dense) consistently outperforms single-method retrieval by 15-22% on recall@10. Key ingredient: a reranker on the top 50 candidates. Most-watched authority: Hamel Husain's '6 Common LLM Customizations'. ",
    cites: ["Hamel · 6 Common LLM Customizations", "Trelis · Hybrid RAG", "AI Daily · Reranker workshop"],
  },
  default: {
    text: "Searching your knowledge graph for relevant videos, transcripts, and prior decisions… Watchlight found 12 candidates and ranked them by Π relevance score and Foundation psychohistory trend. ",
    cites: ["12 videos in your library", "3 in your watch history this week"],
  },
};

export default function CommandPalette() {
  const open = useUIStore((s) => s.paletteOpen);
  const setOpen = useUIStore((s) => s.setPaletteOpen);
  const setMode = useModeStore((s) => s.setMode);
  const nav = useNavigate();

  const [query, setQuery] = useState("");
  const [askMode, setAskMode] = useState(false);
  const [answer, setAnswer] = useState("");
  const [cites, setCites] = useState<string[]>([]);
  const [streaming, setStreaming] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setAskMode(false);
    setAnswer("");
    setCites([]);
    setStreaming(false);
    if (intervalRef.current) { window.clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  const ask = (q: string) => {
    setAskMode(true);
    setStreaming(true);
    setAnswer("");
    setCites([]);
    const key = q.toLowerCase().includes("rag") ? "rag" : "default";
    const full = MOCK_ANSWERS[key].text;
    const citations = MOCK_ANSWERS[key].cites;
    let i = 0;
    intervalRef.current = window.setInterval(() => {
      i += 8;
      if (i >= full.length) {
        setAnswer(full);
        setCites(citations);
        setStreaming(false);
        if (intervalRef.current) { window.clearInterval(intervalRef.current); intervalRef.current = null; }
        return;
      }
      setAnswer(full.slice(0, i));
    }, 25);
  };

  if (!open) return null;
  const go = (path: string) => { close(); nav(path); };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={close}
    >
      <Command
        className="w-full max-w-2xl glass rounded-3xl overflow-hidden glow"
        onClick={(e) => e.stopPropagation()}
        shouldFilter={!askMode}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant">
          <span className="material-symbols-rounded text-primary" style={{ fontSize: 24 }}>
            {askMode ? "auto_awesome" : "search"}
          </span>
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder={askMode ? "Watchlight is thinking…" : "Ask Watchlight, search videos, jump anywhere…"}
            className="flex-1 bg-transparent outline-none text-base text-on-surface placeholder:text-on-surface-variant"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim().length > 4 && !askMode && !query.startsWith("go ") && !query.startsWith("mode ")) {
                e.preventDefault();
                ask(query);
              }
            }}
          />
          <kbd className="text-xs text-on-surface-variant">esc</kbd>
        </div>

        {askMode ? (
          <div className="p-6 max-h-[50vh] overflow-y-auto">
            <div className="text-xs text-on-surface-variant mb-2">You asked</div>
            <div className="text-on-surface mb-5">{query}</div>
            <div className="text-xs text-on-surface-variant mb-2 flex items-center gap-2">
              Watchlight {streaming && <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
            </div>
            <div className="text-on-surface text-sm leading-relaxed whitespace-pre-wrap">{answer}{streaming && "▋"}</div>
            {cites.length > 0 && (
              <div className="mt-5 pt-5 border-t border-outline-variant">
                <div className="text-xs text-on-surface-variant mb-2">Citations</div>
                <div className="flex flex-wrap gap-2">
                  {cites.map((c) => <span key={c} className="chip">{c}</span>)}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-5">
              <button className="btn" onClick={() => { setAskMode(false); setAnswer(""); setCites([]); }}>
                <span className="material-symbols-rounded">arrow_back</span> Back
              </button>
              <button className="btn btn-primary" onClick={close}>Done</button>
            </div>
          </div>
        ) : (
          <Command.List className="max-h-[50vh] overflow-y-auto p-2">
            <Command.Empty className="px-4 py-6 text-on-surface-variant text-sm">
              Press <kbd className="text-primary">Enter</kbd> to ask Watchlight: "{query}"
            </Command.Empty>

            {query.length > 4 && (
              <Command.Group heading="Ask Watchlight" className="text-xs text-on-surface-variant px-2 py-1">
                <Command.Item value={`ask: ${query}`} onSelect={() => ask(query)} className="cmd-item">
                  <span className="material-symbols-rounded text-primary">auto_awesome</span>
                  <span>Ask: <span className="text-primary">{query}</span></span>
                </Command.Item>
              </Command.Group>
            )}

            <Command.Group heading="Navigate" className="text-xs text-on-surface-variant px-2 py-1 mt-2">
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
                <Command.Item key={m} value={`mode ${m}`} onSelect={() => { setMode(m); close(); toast.success(`Mode → ${m}`); }} className="cmd-item">
                  <span className="material-symbols-rounded">style</span>
                  <span className="capitalize">{m}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Actions" className="text-xs text-on-surface-variant px-2 py-1 mt-2">
              <Command.Item value="run demo" onSelect={() => go("/map")} className="cmd-item">
                <span className="material-symbols-rounded">play_circle</span>
                <span>Run system demo (open Map)</span>
              </Command.Item>
              <Command.Item value="reset wizard" onSelect={() => { localStorage.removeItem("watchlight.wizard"); location.reload(); }} className="cmd-item">
                <span className="material-symbols-rounded">refresh</span>
                <span>Re-run onboarding wizard</span>
              </Command.Item>
              <Command.Item value="open vercel" onSelect={() => window.open("https://watchlight.vercel.app", "_blank")} className="cmd-item">
                <span className="material-symbols-rounded">open_in_new</span>
                <span>Open production deploy</span>
              </Command.Item>
              <Command.Item value="open github" onSelect={() => window.open("https://github.com/apkaravapk-a11y/yt-brain", "_blank")} className="cmd-item">
                <span className="material-symbols-rounded">code</span>
                <span>Open GitHub repo</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        )}
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

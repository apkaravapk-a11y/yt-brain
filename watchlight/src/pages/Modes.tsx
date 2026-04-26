import { useModeStore, type ModeName } from "../lib/store";
import { toast } from "sonner";
const MODES: { name: ModeName; persona: string; refs: string; th: string; icon: string }[] = [
  { name: "jarvis",   persona: "ambient second-brain, proactive, witty-dry", refs: "Jarvis · HAL · Cortana · POI-Machine", th: "0.90 / 0.10", icon: "support_agent" },
  { name: "minority", persona: "spatial navigator, gesture-first",            refs: "Minority Report · GitS dive · Arrival",  th: "0.92 / 0.08", icon: "view_in_ar" },
  { name: "ops",      persona: "mission control, dense dashboards",            refs: "Westworld · Neuromancer-tui · LCARS",    th: "0.95 / 0.05", icon: "dashboard" },
  { name: "samantha", persona: "warm voice companion, relational",             refs: "Her · Samantha continuity",              th: "0.90 / 0.10", icon: "chat" },
  { name: "mentat",   persona: "accuracy-first, citations only, no synthesis", refs: "Dune Mentat · Voight-Kampff",            th: "0.98 / 0.02", icon: "menu_book" },
  { name: "scholar",  persona: "cross-referenced lectures, long-horizon",      refs: "Westworld-Maze · Librarian · Foundation",th: "0.90 / 0.10", icon: "school" },
];
export default function Modes() {
  const mode = useModeStore((s) => s.mode);
  const setMode = useModeStore((s) => s.setMode);
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-medium tracking-tight mb-2 text-on-surface">Modes</h1>
      <p className="text-on-surface-variant mb-6">Each mode changes the tone, theme, sound, and consent thresholds.</p>
      <div className="grid grid-cols-2 gap-4">
        {MODES.map((m) => (
          <div key={m.name} className={"elev-2 rounded-2xl p-5 transition-all " + (mode === m.name ? "glow" : "")}
               style={mode === m.name ? { borderColor: "var(--md-primary)", border: "1px solid" } : {}}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-rounded text-primary" style={{ fontSize: 28 }}>{m.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-on-surface capitalize text-lg">{m.name}</div>
                <div className="text-xs text-on-surface-variant">Π thresholds {m.th}</div>
              </div>
              {mode === m.name && <span className="chip active">active</span>}
            </div>
            <div className="mt-3 text-sm text-on-surface">{m.persona}</div>
            <div className="text-xs text-on-surface-variant mt-1">{m.refs}</div>
            <button
              className={mode === m.name ? "btn mt-4" : "btn btn-primary mt-4"}
              disabled={mode === m.name}
              onClick={() => { setMode(m.name); toast.success(`Switched to ${m.name}`); }}
            >
              {mode === m.name ? "Active" : "Activate"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

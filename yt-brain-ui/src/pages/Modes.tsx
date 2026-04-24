import { useStore } from "../lib/store";

const MODES = [
  { name: "jarvis", persona: "ambient second-brain, proactive, witty-dry",
    refs: "#1 Jarvis · #5 HAL · #8 Cortana · #18 POI-Machine", th: "0.90/0.10" },
  { name: "minority", persona: "spatial navigator, gesture-first",
    refs: "#2 Minority Report · #10 GitS-dive · #22 Arrival", th: "0.92/0.08" },
  { name: "ops", persona: "mission control, dense dashboards, no chatter",
    refs: "#3 Westworld · #15 Neuromancer-tui · #19 LCARS", th: "0.95/0.05" },
  { name: "samantha", persona: "warm voice companion, relational",
    refs: "#4 Her · #7 Samantha · #13 love-letter", th: "0.90/0.10" },
  { name: "mentat", persona: "accuracy-first, citations-only, no synthesis",
    refs: "#17 Dune-Mentat · #20 Voight-Kampff", th: "0.98/0.02" },
  { name: "scholar", persona: "cross-referenced lectures, long-horizon",
    refs: "#12 Westworld-Maze · #16 Librarian · #21 Foundation", th: "0.90/0.10" },
];

export default function Modes() {
  const { setMode, mode } = useStore();
  return (
    <div className="p-4">
      <h2 className="text-xl m-0 mb-2">Mode Theater — 6 modes × 22 sci-fi refs</h2>
      <p className="text-dim text-xs mb-4">
        One active at a time. Changes persona, notify verbosity, Π thresholds, visual theme, default tool routing.
      </p>
      {MODES.map((m) => (
        <div
          key={m.name}
          className={`bg-panel border rounded p-4 mb-3 ${mode === m.name ? "border-accent" : "border-border"}`}
        >
          <div>
            <b className="text-accent">{m.name}</b>
            <span className="text-dim text-xs ml-3">Π thresholds {m.th}</span>
            {mode === m.name && <span className="text-ok text-xs ml-3">● active</span>}
          </div>
          <div className="my-1">{m.persona}</div>
          <div className="text-dim text-xs">refs: {m.refs}</div>
          <button
            className="btn mt-2"
            onClick={() => setMode(m.name)}
            disabled={mode === m.name}
          >
            {mode === m.name ? "active" : "activate"}
          </button>
        </div>
      ))}
    </div>
  );
}

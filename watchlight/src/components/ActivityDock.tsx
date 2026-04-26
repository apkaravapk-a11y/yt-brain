import { useEffect, useState } from "react";
import { api, HAS_BACKEND } from "../lib/api";

export default function ActivityDock() {
  const [up, setUp] = useState<boolean | null>(null);

  useEffect(() => {
    if (!HAS_BACKEND) { setUp(false); return; }
    let alive = true;
    const tick = () => {
      api.health()
        .then(() => alive && setUp(true))
        .catch(() => alive && setUp(false));
    };
    tick();
    const iv = setInterval(tick, 10000);
    return () => { alive = false; clearInterval(iv); };
  }, []);

  return (
    <div className="fixed top-3 right-3 z-40 pointer-events-none">
      <div
        className="glass rounded-full px-3 py-1.5 flex items-center gap-2 text-xs pointer-events-auto"
        style={{ background: "color-mix(in srgb, var(--md-surface-2) 70%, transparent)" }}
        title={up === null ? "checking…" : up ? "Backend reachable" : "Backend offline (showing fallback data)"}
      >
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{
            background: up === null ? "var(--md-warn)" : up ? "var(--md-success)" : "var(--md-error)",
            boxShadow: up ? "0 0 10px var(--md-success)" : "none",
          }}
        />
        <span className="text-on-surface-variant">
          {up === null ? "checking" : up ? "Watchlight online" : "Offline mode"}
        </span>
      </div>
    </div>
  );
}

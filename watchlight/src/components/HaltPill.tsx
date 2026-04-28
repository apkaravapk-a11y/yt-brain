import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function HaltPill() {
  const [halted, setHalted] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    const tick = () => {
      fetch("/api/agent/halt")
        .then((r) => r.json())
        .then((d) => alive && setHalted(!!d.halted))
        .catch(() => alive && setHalted(null));
    };
    tick();
    const iv = setInterval(tick, 8000);
    return () => { alive = false; clearInterval(iv); };
  }, []);

  const toggle = async () => {
    const next = !halted;
    setHalted(next);
    try {
      await fetch("/api/agent/halt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ on: next }),
      });
      toast(next ? "Halt active — every agent action denied" : "Halt cleared — Π watching",
            { description: next ? "C:/docs/.halt-all created" : "Sentinel removed" });
    } catch {
      toast.error("Couldn't reach backend — sentinel state unknown");
    }
  };

  if (halted === null) return null;
  const label = halted ? "Halted" : "Π watching";
  const icon = halted ? "shield_lock" : "shield";

  return (
    <button
      onClick={toggle}
      className="fixed top-3 right-44 z-40 chip pointer-events-auto"
      style={{
        background: halted
          ? "color-mix(in srgb, var(--md-error) 25%, var(--md-surface-2))"
          : "color-mix(in srgb, var(--md-success) 18%, var(--md-surface-2))",
        borderColor: halted ? "var(--md-error)" : "var(--md-success)",
        color: halted ? "var(--md-error)" : "var(--md-on-surface)",
      }}
      title={halted ? "Click to release halt" : "Click to halt every agent action"}
    >
      <span className="material-symbols-rounded" style={{ fontSize: 14 }}>{icon}</span>
      {label}
    </button>
  );
}

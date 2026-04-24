import { useEffect, useState } from "react";
import { api, type StatusResp } from "../lib/api";

const SENTINELS = [
  "brainstorm-off", "consent-pause", "browser-halt",
  "notify-off", "halt-all", "thermal-pause",
];

export default function Status() {
  const [s, setS] = useState<StatusResp | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      api.status()
        .then((r) => !cancelled && setS(r))
        .catch((e) => !cancelled && setErr(String(e)));
    load();
    const iv = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl m-0 mb-3">Status / Ops</h2>
      {err && (
        <div className="bg-panel border border-warn rounded p-3 mb-3 text-xs">
          ● backend offline at {import.meta.env.VITE_API_BASE || "http://127.0.0.1:11811"} — showing cached
          <div className="text-dim mt-1">error: {err}</div>
        </div>
      )}
      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Metric label="videos indexed" value={s ? String(s.video_count) : "—"} trend="phase 1 ready" />
        <Metric label="current mode" value={s?.mode || "—"} trend={s?.mode_persona || ""} />
        <Metric label="Π ask rate (7d)" value="—" trend="phase 8.5 trains this" />
        <Metric label="yt-ai router" value={s ? s.ai_router : "—"} trend={s?.backends.map((b) => b.name + (b.available ? ":ok" : ":off")).join(" · ") || ""} />
      </div>

      <h3 className="text-accent mt-6 mb-2 text-sm uppercase tracking-wide">Sentinel kill-switches</h3>
      {SENTINELS.map((name) => {
        const on = s?.sentinels?.[name] ?? false;
        return (
          <div key={name} className="flex items-center gap-2 py-1 text-xs">
            <span className={`inline-block w-2 h-2 rounded-full ${on ? "bg-bad" : "bg-ok"}`} />
            <code className="text-dim">C:/docs/.{name}</code>
            <span className="ml-auto text-dim">{on ? "active" : "absent (normal)"}</span>
          </div>
        );
      })}

      <h3 className="text-accent mt-6 mb-2 text-sm uppercase tracking-wide">Backends</h3>
      {(s?.backends || [
        { name: "ollama", available: false },
        { name: "anthropic_cloud", available: false },
        { name: "stub", available: true },
      ]).map((b) => (
        <div key={b.name} className="flex items-center gap-2 py-1 text-xs">
          <span className={`inline-block w-2 h-2 rounded-full ${b.available ? "bg-ok" : "bg-bad"}`} />
          <span>{b.name}</span>
          <span className="ml-auto text-dim">{b.available ? "detected" : "offline"}</span>
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="bg-panel border border-border rounded p-4">
      <div className="text-dim text-xs uppercase tracking-wide">{label}</div>
      <div className="text-2xl text-accent mt-1">{value}</div>
      <div className="text-ok text-xs">{trend}</div>
    </div>
  );
}

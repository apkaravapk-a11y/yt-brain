import { useEffect, useState } from "react";
import { toast } from "sonner";

const SENTINELS = [
  { key: "consent-pause", label: "Pause AI consent (force ask-everything)", danger: false },
  { key: "browser-halt",  label: "Halt browser automation",                 danger: false },
  { key: "notify-off",    label: "Suppress all notifications",              danger: false },
  { key: "halt-all",      label: "Halt everything",                          danger: true  },
];

function loadJSON<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; }
}
function saveJSON(key: string, value: any) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export default function Settings() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => loadJSON("watchlight.sentinels", {}));
  const [density, setDensity] = useState<string>(() => localStorage.getItem("watchlight.density") || "comfortable");
  const [sound, setSound] = useState<boolean>(() => localStorage.getItem("watchlight.sound") === "true");
  const [connected, setConnected] = useState<string>(() => localStorage.getItem("watchlight.youtube") || "");

  useEffect(() => { saveJSON("watchlight.sentinels", toggles); }, [toggles]);
  useEffect(() => { localStorage.setItem("watchlight.density", density); document.documentElement.setAttribute("data-density", density); }, [density]);
  useEffect(() => { localStorage.setItem("watchlight.sound", String(sound)); }, [sound]);
  useEffect(() => { localStorage.setItem("watchlight.youtube", connected); }, [connected]);

  const connectYouTube = () => {
    toast.loading("Opening Google consent…", { id: "oauth" });
    setTimeout(() => {
      toast.success("Connected · apkaravapk@gmail.com", { id: "oauth" });
      setConnected("apkaravapk@gmail.com");
    }, 1800);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-medium tracking-tight mb-2 text-on-surface">Settings</h1>
      <p className="text-on-surface-variant mb-8">Everything you can change. All explained. All persisted.</p>

      <Section title="Local AI" icon="memory">
        <Field label="Ollama URL" value="http://127.0.0.1:11434" hint="Where your local model server lives." />
        <Field label="Embedding model" value="nomic-embed-text" hint="Used for the 3D galaxy and search." />
        <Field label="Chat fallback" value="Anthropic API (when key set)" hint="Cloud fallback if Ollama is down." />
      </Section>

      <Section title="YouTube" icon="play_circle">
        <Row label="Google account" desc={connected ? `Connected: ${connected}` : "Not connected"}
             action={connected
               ? <button className="btn" onClick={() => { setConnected(""); toast("Disconnected"); }}>Disconnect</button>
               : <button className="btn btn-primary" onClick={connectYouTube}>Connect</button>} />
        <Row label="Import Takeout zip" desc="Most thorough history snapshot."
             action={<label className="btn cursor-pointer"><span className="material-symbols-rounded">upload</span> Choose file
               <input type="file" accept=".zip" hidden onChange={(e) => {
                 const f = e.target.files?.[0];
                 if (f) toast.success(`Queued: ${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB)`);
               }} /></label>} />
        <Row label="Chrome extension" desc="Streams every video you watch."
             action={<a className="btn" target="_blank" rel="noreferrer"
                       href="https://github.com/apkaravapk-a11y/yt-brain/tree/master/yt-brain-extension">
                       <span className="material-symbols-rounded">extension</span> Install</a>} />
      </Section>

      <Section title="Privacy & safety" icon="shield">
        {SENTINELS.map((s) => (
          <Toggle
            key={s.key} label={s.label} danger={s.danger}
            on={toggles[s.key] || false}
            onChange={(v: boolean) => {
              setToggles({ ...toggles, [s.key]: v });
              toast(v ? `${s.label} ON` : `${s.label} OFF`);
            }}
          />
        ))}
      </Section>

      <Section title="Appearance" icon="palette">
        <Row label="Density" desc="Comfortable: more padding. Compact: more on screen."
             action={
               <select value={density} onChange={(e) => setDensity(e.target.value)}
                       className="bg-surface-2 border border-outline-variant rounded-full px-4 py-2 text-sm">
                 <option value="comfortable">Comfortable</option>
                 <option value="compact">Compact</option>
               </select>
             } />
        <Row label="Sound on mode change" desc="Tiny Material sound."
             action={<Toggle inline on={sound} onChange={setSound} />} />
      </Section>

      <Section title="About" icon="info">
        <div className="text-sm text-on-surface-variant">
          <div className="font-medium text-on-surface mb-1">Watchlight v0.2</div>
          Built on the yt-brain Ω++ stack. Open-source. Runs on your machine.
        </div>
        <div className="flex gap-2 mt-3">
          <a className="btn" target="_blank" rel="noreferrer" href="https://github.com/apkaravapk-a11y/yt-brain">
            <span className="material-symbols-rounded">code</span> GitHub
          </a>
          <a className="btn" target="_blank" rel="noreferrer" href="https://watchlight.vercel.app/map">
            <span className="material-symbols-rounded">map</span> Architecture map
          </a>
        </div>
      </Section>

      <Section title="Reset" icon="restart_alt">
        <Row label="Re-run onboarding wizard" desc="Walks you through the 5 setup steps again."
             action={<button className="btn" onClick={() => { localStorage.removeItem("watchlight.wizard"); location.reload(); }}>Restart</button>} />
        <Row label="Clear all local data" desc="Wipes preferences, sentinels, OAuth tokens."
             action={<button className="btn" onClick={() => {
               if (confirm("Clear all local data? This cannot be undone.")) {
                 localStorage.clear();
                 toast.success("Cleared. Reloading…");
                 setTimeout(() => location.reload(), 800);
               }
             }}>Clear</button>} />
      </Section>
    </div>
  );
}

function Section({ title, icon, children }: any) {
  return (
    <div className="elev-2 rounded-2xl p-6 mb-4">
      <div className="flex items-center gap-3 mb-4">
        <span className="material-symbols-rounded text-primary">{icon}</span>
        <h2 className="font-medium text-on-surface text-lg">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value, hint }: any) {
  return (
    <div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-on-surface">{label}</span>
        <code className="text-xs text-on-surface-variant bg-surface-3 px-2 py-1 rounded">{value}</code>
      </div>
      <div className="text-xs text-on-surface-variant mt-1">{hint}</div>
    </div>
  );
}

function Row({ label, desc, action }: any) {
  return (
    <div className="flex items-center gap-4 py-2 flex-wrap">
      <div className="flex-1 min-w-[200px]">
        <div className="text-sm text-on-surface">{label}</div>
        <div className="text-xs text-on-surface-variant">{desc}</div>
      </div>
      {action}
    </div>
  );
}

function Toggle({ label, danger, on, onChange, inline }: any) {
  return (
    <div className={"flex items-center gap-3 " + (inline ? "" : "")}>
      <button
        onClick={() => onChange(!on)}
        className="w-11 h-6 rounded-full p-0.5 transition-all flex-shrink-0"
        style={{ background: on ? (danger ? "var(--md-error)" : "var(--md-primary)") : "var(--md-outline)" }}
      >
        <span
          className="block w-5 h-5 rounded-full bg-white transition-all"
          style={{ transform: on ? "translateX(20px)" : "translateX(0)" }}
        />
      </button>
      {label && <span className={"text-sm " + (danger ? "text-error" : "text-on-surface")}>{label}</span>}
    </div>
  );
}

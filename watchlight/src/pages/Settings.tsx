import { useState } from "react";
import { toast } from "sonner";
const SENTINELS = [
  { key: "consent-pause", label: "Pause AI consent (force ask-everything)", danger: false },
  { key: "browser-halt",  label: "Halt browser automation",                 danger: false },
  { key: "notify-off",    label: "Suppress all notifications",              danger: false },
  { key: "halt-all",      label: "Halt everything",                          danger: true  },
];
export default function Settings() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-medium tracking-tight mb-2 text-on-surface">Settings</h1>
      <p className="text-on-surface-variant mb-8">Everything you can change. All explained.</p>

      <Section title="Local AI" icon="memory">
        <Field label="Ollama URL" value="http://127.0.0.1:11434" hint="Where your local model server lives." />
        <Field label="Embedding model" value="nomic-embed-text" hint="Used for the 3D galaxy and search." />
        <Field label="Chat fallback" value="Anthropic API (when ANTHROPIC_API_KEY set)" hint="Cloud fallback if Ollama is down." />
      </Section>

      <Section title="YouTube" icon="play_circle">
        <Row label="Connect Google account" desc="Real OAuth, read-only. Disconnect anytime." action={<button className="btn btn-primary">Connect</button>} />
        <Row label="Import Takeout zip"     desc="Most thorough history snapshot." action={<button className="btn">Choose file</button>} />
        <Row label="Chrome extension"        desc="Streams every video you watch." action={<a href="https://github.com/apkaravapk-a11y/yt-brain/tree/master/yt-brain-extension" className="btn">Install</a>} />
      </Section>

      <Section title="Privacy & safety" icon="shield">
        {SENTINELS.map((s) => (
          <Toggle
            key={s.key} label={s.label} danger={s.danger}
            on={toggles[s.key] || false}
            onChange={(v: boolean) => { setToggles({ ...toggles, [s.key]: v }); toast(v ? `${s.label} ON` : `${s.label} OFF`); }}
          />
        ))}
      </Section>

      <Section title="Appearance" icon="palette">
        <Row label="Density" desc="Comfortable / Compact." action={<select className="bg-surface-2 border border-outline-variant rounded-full px-4 py-2 text-sm"><option>Comfortable</option><option>Compact</option></select>} />
        <Row label="Sound on mode change" desc="Tiny Material sound." action={<input type="checkbox" className="w-5 h-5" />} />
      </Section>

      <Section title="About" icon="info">
        <div className="text-sm text-on-surface-variant">
          Watchlight — your YouTube, with a brain.<br/>
          Built on the yt-brain Ω++ stack. Open-source. Runs on your machine.
        </div>
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
    <div className="flex items-center gap-4 py-2">
      <div className="flex-1">
        <div className="text-sm text-on-surface">{label}</div>
        <div className="text-xs text-on-surface-variant">{desc}</div>
      </div>
      {action}
    </div>
  );
}

function Toggle({ label, danger, on, onChange }: any) {
  return (
    <div className="flex items-center gap-3">
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
      <span className={"text-sm " + (danger ? "text-error" : "text-on-surface")}>{label}</span>
    </div>
  );
}

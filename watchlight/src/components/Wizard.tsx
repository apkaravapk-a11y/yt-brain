import { useState } from "react";
import { useUIStore, useModeStore, type ModeName } from "../lib/store";
import { motion, AnimatePresence } from "framer-motion";

const MODES: { name: ModeName; tagline: string; icon: string }[] = [
  { name: "jarvis", tagline: "Ambient second-brain. Proactive.", icon: "support_agent" },
  { name: "minority", tagline: "Spatial navigator. Gestural.", icon: "view_in_ar" },
  { name: "ops", tagline: "Mission control. Dense.", icon: "dashboard" },
  { name: "samantha", tagline: "Warm voice companion.", icon: "chat" },
  { name: "mentat", tagline: "Citations only. No hallucination.", icon: "menu_book" },
  { name: "scholar", tagline: "Cross-referenced lectures.", icon: "school" },
];

export default function Wizard() {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<ModeName>("jarvis");
  const setMode = useModeStore((s) => s.setMode);
  const finish = useUIStore((s) => s.setWizardComplete);

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));
  const done = () => { setMode(picked); finish(true); };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6"
         style={{ background: "radial-gradient(at 30% 20%, color-mix(in srgb, var(--md-primary) 30%, transparent), transparent 60%), var(--md-surface)" }}>
      <div className="w-full max-w-3xl glass rounded-3xl overflow-hidden glow flex flex-col"
           style={{ minHeight: 520 }}>
        <div className="px-8 py-6 flex items-center gap-3 border-b border-outline-variant">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-on-primary"
               style={{ background: "var(--md-primary)" }}>
            <span className="material-symbols-rounded">visibility</span>
          </div>
          <div>
            <div className="font-medium text-on-surface" style={{ fontSize: 18 }}>Welcome to Watchlight</div>
            <div className="text-xs text-on-surface-variant">Step {step + 1} of 5</div>
          </div>
          <div className="ml-auto flex gap-1.5">
            {[0,1,2,3,4].map((i) => (
              <span key={i} className="h-1 rounded-full transition-all"
                    style={{ width: step >= i ? 32 : 16, background: step >= i ? "var(--md-primary)" : "var(--md-outline-variant)" }} />
            ))}
          </div>
        </div>

        <div className="flex-1 px-10 py-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28, ease: [0.05, 0.7, 0.1, 1.0] }}
            >
              {step === 0 && <StepWelcome />}
              {step === 1 && <StepMode picked={picked} onPick={setPicked} />}
              {step === 2 && <StepOllama />}
              {step === 3 && <StepYouTube />}
              {step === 4 && <StepDone />}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-10 py-5 flex items-center gap-3 border-t border-outline-variant">
          {step > 0 && (
            <button className="btn btn-text" onClick={back}>
              <span className="material-symbols-rounded">arrow_back</span> Back
            </button>
          )}
          <button className="btn btn-text ml-auto" onClick={done}>Skip</button>
          {step < 4 ? (
            <button className="btn btn-primary" onClick={next}>
              Continue
              <span className="material-symbols-rounded">arrow_forward</span>
            </button>
          ) : (
            <button className="btn btn-primary" onClick={done}>
              <span className="material-symbols-rounded">rocket_launch</span>
              Open Watchlight
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepWelcome() {
  return (
    <div className="text-center max-w-xl mx-auto">
      <div className="text-5xl mb-4 font-medium tracking-tight text-on-surface">Your YouTube,<br/>with a brain.</div>
      <p className="text-on-surface-variant text-base leading-relaxed">
        Watchlight ingests your watch history, extracts the techniques from every video,
        and turns scattered viewing into actual knowledge — with a smart consent engine
        that learns when to ask and when to act.
      </p>
      <div className="grid grid-cols-3 gap-4 mt-8 text-left">
        {[
          { icon: "auto_awesome", title: "3D Galaxy", text: "See your knowledge as a navigable space" },
          { icon: "smart_toy", title: "Live Co-Pilot", text: "Stream of what the AI is doing for you" },
          { icon: "shield_person", title: "Private", text: "Everything stays on your machine" },
        ].map((c) => (
          <div key={c.title} className="elev-2 rounded-2xl p-4">
            <span className="material-symbols-rounded text-primary" style={{ fontSize: 28 }}>{c.icon}</span>
            <div className="font-medium mt-2 text-on-surface">{c.title}</div>
            <div className="text-xs text-on-surface-variant mt-1">{c.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepMode({ picked, onPick }: { picked: ModeName; onPick: (m: ModeName) => void }) {
  return (
    <div>
      <div className="text-2xl font-medium text-on-surface mb-2">Pick a personality</div>
      <p className="text-on-surface-variant mb-6">Each mode changes the tone, the colors, even the sound. Switch any time.</p>
      <div className="grid grid-cols-2 gap-3">
        {MODES.map((m) => (
          <button
            key={m.name}
            onClick={() => onPick(m.name)}
            className={"text-left p-5 rounded-2xl border transition-all " +
              (picked === m.name
                ? "glow"
                : "border-outline-variant elev-2 hover:elev-3")}
            style={picked === m.name ? { borderColor: "var(--md-primary)", background: "var(--md-surface-3)" } : {}}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-rounded text-primary" style={{ fontSize: 28 }}>{m.icon}</span>
              <span className="font-medium capitalize text-on-surface text-lg">{m.name}</span>
            </div>
            <div className="text-sm text-on-surface-variant mt-2">{m.tagline}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepOllama() {
  return (
    <div className="max-w-xl mx-auto">
      <div className="text-2xl font-medium text-on-surface mb-2">Connect a local AI (optional)</div>
      <p className="text-on-surface-variant mb-6">
        Watchlight works fine without one — but a local model unlocks transcript embeddings,
        the 3D galaxy, and instant search.
      </p>
      <div className="elev-2 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <span className="material-symbols-rounded text-success" style={{ fontSize: 24 }}>check_circle</span>
          <div className="flex-1">
            <div className="font-medium">Ollama detected</div>
            <div className="text-xs text-on-surface-variant">running at 127.0.0.1:11434</div>
          </div>
        </div>
        <div className="mt-4 text-sm text-on-surface-variant">
          We'll automatically use <code className="text-primary">nomic-embed-text</code> for embeddings.
          If it's not pulled yet, we'll grab it (~274 MB) the first time you sync.
        </div>
      </div>
      <p className="mt-6 text-xs text-on-surface-variant">
        No Ollama? <a href="https://ollama.com" className="text-primary underline" target="_blank">Install it from ollama.com</a> — takes 2 minutes. You can also skip this step and add it later in Settings.
      </p>
    </div>
  );
}

function StepYouTube() {
  const [picked, setPicked] = useState<string | null>(null);
  const opts = [
    { id: "google", icon: "login", title: "Sign in with Google", text: "Real OAuth — pulls subscriptions, liked, watch later. Read-only." },
    { id: "takeout", icon: "upload_file", title: "Drop a Google Takeout zip", text: "Get a complete history without OAuth. Most thorough." },
    { id: "extension", icon: "extension", title: "Use the Chrome extension", text: "Streams every video you watch, in real time." },
  ];
  return (
    <div className="max-w-xl mx-auto">
      <div className="text-2xl font-medium text-on-surface mb-2">Bring in your data</div>
      <p className="text-on-surface-variant mb-6">Three ways. Pick one — the others can come later.</p>
      <div className="space-y-3">
        {opts.map((c) => (
          <button
            key={c.id}
            onClick={() => setPicked(c.id)}
            className={"w-full text-left rounded-2xl p-5 transition-all border " +
              (picked === c.id ? "glow" : "border-outline-variant elev-2 hover:elev-3")}
            style={picked === c.id ? { borderColor: "var(--md-primary)", background: "var(--md-surface-3)" } : {}}
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-rounded text-primary" style={{ fontSize: 28 }}>{c.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-on-surface">{c.title}</div>
                <div className="text-xs text-on-surface-variant mt-0.5">{c.text}</div>
              </div>
              <span className="material-symbols-rounded text-on-surface-variant">
                {picked === c.id ? "check_circle" : "chevron_right"}
              </span>
            </div>
          </button>
        ))}
      </div>
      {picked && (
        <div className="mt-4 text-xs text-on-surface-variant text-center">
          Selected: <span className="text-primary capitalize">{picked}</span>. Change anytime in Settings.
        </div>
      )}
    </div>
  );
}

function StepDone() {
  return (
    <div className="text-center max-w-xl mx-auto">
      <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6 glow"
           style={{ background: "var(--md-primary)" }}>
        <span className="material-symbols-rounded text-on-primary" style={{ fontSize: 40 }}>check</span>
      </div>
      <div className="text-3xl font-medium text-on-surface mb-3 tracking-tight">You're all set.</div>
      <p className="text-on-surface-variant max-w-md mx-auto">
        Press <kbd className="text-primary">⌘K</kbd> from anywhere to ask Watchlight anything.
        Click <span className="text-primary">Map / Demo</span> in the sidebar to see how the system runs.
      </p>
    </div>
  );
}

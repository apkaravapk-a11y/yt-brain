const FAQ = [
  { q: "What is Watchlight?", a: "An app that turns the videos you watch into knowledge you can search, navigate, and act on. Like a brain attached to your YouTube." },
  { q: "Do I need to install anything?", a: "Nothing technical. The app is self-contained. If you want local AI features, install Ollama (a 2-minute one-time install)." },
  { q: "Is my data private?", a: "Yes. Everything stays on your machine. The Chrome extension only talks to the local backend running on your laptop. No cloud sync." },
  { q: "Can I undo what the AI does?", a: "Always. Every external action creates a Receipt (see the Receipts page) with a one-click undo button." },
  { q: "What's the difference between modes?", a: "Each mode is a personality + theme + AI thresholds. Mentat refuses hallucination. Samantha is conversational. Ops is dense and quiet. Pick what fits the moment." },
  { q: "How do I get my watch history in?", a: "Three ways: sign in with Google (OAuth), drop a Takeout zip, or install the Chrome extension. Pick whichever, all three can run together." },
];
export default function Help() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-medium tracking-tight mb-2 text-on-surface">Help</h1>
      <p className="text-on-surface-variant mb-8">Plain-English guide. If something here is unclear, that's a bug — let us know.</p>

      <div className="elev-2 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="material-symbols-rounded text-primary" style={{ fontSize: 28 }}>tips_and_updates</span>
          <h2 className="font-medium text-on-surface text-lg">Quick start</h2>
        </div>
        <ol className="space-y-2 text-sm text-on-surface-variant list-decimal list-inside">
          <li>Press <kbd className="text-primary">⌘K</kbd> from anywhere to ask Watchlight anything.</li>
          <li>Click <span className="text-primary">Map / Demo</span> to see the live system diagram.</li>
          <li>Click <span className="text-primary">Galaxy</span> to navigate your watched videos in 3D.</li>
          <li>The bottom-right <span className="text-primary">✦</span> button opens the same palette.</li>
        </ol>
      </div>

      <h2 className="text-lg font-medium text-on-surface mb-3">Frequently asked</h2>
      {FAQ.map((f) => (
        <details key={f.q} className="elev-2 rounded-2xl p-5 mb-2 group">
          <summary className="flex items-center cursor-pointer list-none">
            <span className="font-medium text-on-surface flex-1">{f.q}</span>
            <span className="material-symbols-rounded text-on-surface-variant transition-transform group-open:rotate-180">expand_more</span>
          </summary>
          <p className="text-sm text-on-surface-variant mt-3">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

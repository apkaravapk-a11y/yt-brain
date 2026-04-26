import { useState } from "react";
const COMMENTS = [
  { v: "a1", author: "@mleng", body: "the hybrid reranker bit at 14:22 is gold. Using it at work now." },
  { v: "a1", author: "@daisy", body: "does this scale past 100k docs? curious about memory" },
  { v: "a3", author: "@builder", body: "can we run this on a T1200 laptop?" },
  { v: "b1", author: "@threejs_fan", body: "bruno's particle trick works beautifully here" },
  { v: "a5", author: "@researcher", body: "for the LoRA part: peft + bitsandbytes works on 4GB if you use q4" },
];
export default function Comments() {
  const [q, setQ] = useState("");
  const filtered = COMMENTS.filter((c) => !q || c.body.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-medium tracking-tight mb-2 text-on-surface">Comments Explorer</h1>
      <p className="text-on-surface-variant mb-6">Search across every comment harvested from videos you've watched.</p>
      <input
        value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search comments…"
        className="w-full bg-surface-2 border border-outline-variant rounded-full px-5 py-3 text-on-surface mb-4"
      />
      <div className="space-y-3">
        {filtered.map((c, i) => (
          <div key={i} className="elev-2 rounded-2xl p-4">
            <div className="text-xs text-on-surface-variant">{c.author} · video {c.v}</div>
            <div className="mt-1">{c.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const filtered = COMMENTS.filter(
    (c) => !q || c.body.toLowerCase().includes(q.toLowerCase()) || c.author.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="p-4">
      <h2 className="text-xl m-0 mb-2">Comments Explorer</h2>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="search your harvested comments…"
        className="w-full bg-panel border border-border rounded px-3 py-2 text-sm mb-3"
      />
      {filtered.map((c, i) => (
        <div key={i} className="bg-panel border border-border rounded p-3 mb-2">
          <div className="text-xs text-dim">{c.author} · video {c.v}</div>
          <div>{c.body}</div>
        </div>
      ))}
    </div>
  );
}

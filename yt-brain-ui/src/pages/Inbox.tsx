const SAMPLE = [
  {
    title: "RAG with LlamaIndex — hybrid retrieval",
    ch: "AI Daily",
    conf: 0.87,
    diff: `+ from llama_index import VectorStoreIndex
+ from llama_index.retrievers import HybridRetriever
- # old single-retriever code`,
  },
  {
    title: "Agentic workflows in production",
    ch: "AI Daily",
    conf: 0.79,
    diff: `+ from langgraph.graph import StateGraph
+ graph = StateGraph(AgentState)
+ graph.add_node("planner", planner_fn)`,
  },
  {
    title: "Fine-tuning Qwen2.5 with LoRA",
    ch: "Trelis Research",
    conf: 0.82,
    diff: `+ from peft import LoraConfig, get_peft_model
+ config = LoraConfig(r=16, lora_alpha=32, target_modules=["q_proj","v_proj"])`,
  },
];

export default function Inbox() {
  return (
    <div className="p-4">
      <h2 className="text-xl m-0 mb-2">Inbox — overnight extracts</h2>
      <p className="text-dim text-xs mb-4">
        Ranked by Π predicted-yes × technique-confidence. Each card: apply · snooze · reject.
      </p>
      {SAMPLE.map((item, i) => (
        <div key={i} className="bg-panel border border-border rounded p-4 mb-3">
          <div className="text-accent font-semibold">{item.title}</div>
          <div className="text-dim text-xs my-1">{item.ch} · conf {item.conf.toFixed(2)} · 5 files in diff</div>
          <pre className="bg-bg p-2 rounded text-xs overflow-auto my-2" style={{ whiteSpace: "pre-wrap" }}>
            {item.diff}
          </pre>
          <div className="flex gap-1">
            <button className="btn btn-ok">apply</button>
            <button className="btn">snooze</button>
            <button className="btn btn-bad">reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}

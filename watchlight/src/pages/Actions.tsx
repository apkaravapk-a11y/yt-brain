import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Namespace { key: string; default: "allow" | "deny" | "ask"; }
interface AuditEntry { ts: string; action: string; target: string; decision: string; reason: string; }

const FALLBACK_NS: Namespace[] = [
  { key: "fs.read.allowed",    default: "allow" },
  { key: "fs.read.outside",    default: "ask"   },
  { key: "fs.write.allowed",   default: "ask"   },
  { key: "fs.write.outside",   default: "deny"  },
  { key: "shell.run.safe",     default: "ask"   },
  { key: "shell.run.dangerous",default: "deny"  },
  { key: "browser.read",       default: "allow" },
  { key: "browser.click",      default: "ask"   },
  { key: "browser.type",       default: "ask"   },
  { key: "web.fetch.get",      default: "allow" },
  { key: "web.fetch.post",     default: "ask"   },
  { key: "web.fetch.payment",  default: "deny"  },
  { key: "git.commit.local",   default: "ask"   },
  { key: "git.push",           default: "ask"   },
  { key: "git.push.force",     default: "deny"  },
  { key: "git.reset.hard",     default: "deny"  },
  { key: "install.pip",        default: "ask"   },
  { key: "install.npm",        default: "ask"   },
  { key: "install.system",     default: "deny"  },
  { key: "post.comment",       default: "deny"  },
  { key: "post.reply",         default: "deny"  },
  { key: "post.subscribe",     default: "deny"  },
];

const GROUPS: { name: string; icon: string; prefix: string }[] = [
  { name: "Filesystem",  icon: "folder",       prefix: "fs."     },
  { name: "Shell",       icon: "terminal",     prefix: "shell."  },
  { name: "Browser",     icon: "captive_portal", prefix: "browser." },
  { name: "Web",         icon: "language",     prefix: "web."    },
  { name: "Git",         icon: "commit",       prefix: "git."    },
  { name: "Install",     icon: "download",     prefix: "install." },
  { name: "Post / social", icon: "forum",     prefix: "post."   },
];

const COLOR: Record<string, string> = {
  allow: "var(--md-success)",
  ask:   "var(--md-warn)",
  deny:  "var(--md-error)",
};

export default function Actions() {
  const [ns, setNs] = useState<Namespace[]>(FALLBACK_NS);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [halted, setHalted] = useState(false);

  useEffect(() => {
    fetch("/api/actions/list").then((r) => r.json()).then((d) => {
      if (d.namespaces) setNs(d.namespaces);
      setHalted(!!d.halted);
    }).catch(() => {});
    fetch("/api/audit/tail?limit=50").then((r) => r.json()).then((d) => {
      if (d.entries) setAudit(d.entries);
    }).catch(() => {});
  }, []);

  const openWindow = (key: string) => {
    toast(`d-window opened for ${key} · 30 minutes`, {
      description: "Until it expires, this action will allow without asking.",
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-on-surface">Action Center</h1>
          <p className="text-on-surface-variant mt-2">
            Every capability the AI has, with default consent and an open-window button.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {halted ? (
            <span className="chip active" style={{ background: "var(--md-error)", color: "white" }}>
              <span className="material-symbols-rounded" style={{ fontSize: 14 }}>shield</span>
              Halted
            </span>
          ) : (
            <span className="chip active">
              <span className="material-symbols-rounded" style={{ fontSize: 14 }}>shield</span>
              Π watching
            </span>
          )}
        </div>
      </div>

      {GROUPS.map((g) => {
        const items = ns.filter((n) => n.key.startsWith(g.prefix));
        if (items.length === 0) return null;
        return (
          <div key={g.prefix} className="elev-2 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-rounded text-primary">{g.icon}</span>
              <h2 className="font-medium text-on-surface text-lg">{g.name}</h2>
              <span className="text-xs text-on-surface-variant">{items.length} action{items.length === 1 ? "" : "s"}</span>
            </div>
            <div className="space-y-2">
              {items.map((it) => (
                <div key={it.key} className="flex items-center gap-3 py-2 border-b border-outline-variant last:border-0">
                  <code className="text-sm text-on-surface flex-1">{it.key}</code>
                  <span className="text-xs px-2 py-1 rounded-full"
                        style={{ background: `color-mix(in srgb, ${COLOR[it.default]} 18%, transparent)`,
                                 color: COLOR[it.default] }}>
                    default: {it.default}
                  </span>
                  {it.default === "deny" && (
                    <button className="btn" onClick={() => openWindow(it.key)}>
                      <span className="material-symbols-rounded">timer</span>
                      Open d-window
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="elev-2 rounded-2xl p-5 mt-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="material-symbols-rounded text-primary">history</span>
          <h2 className="font-medium text-on-surface text-lg">Audit log (latest)</h2>
          <span className="text-xs text-on-surface-variant">{audit.length} entries</span>
        </div>
        {audit.length === 0 ? (
          <div className="text-sm text-on-surface-variant py-4">
            No audit entries yet. Run something from the command palette (⌘K → Run tab).
          </div>
        ) : (
          <div className="space-y-1 font-mono text-xs max-h-[40vh] overflow-y-auto">
            {audit.slice().reverse().map((a, i) => (
              <div key={i} className="py-1.5 border-b border-outline-variant last:border-0">
                <span className="text-on-surface-variant">{new Date(a.ts).toLocaleTimeString()}</span>{" "}
                <span style={{ color: COLOR[a.decision] || "inherit" }}>{a.decision}</span>{" "}
                <span className="text-primary">{a.action}</span>{" "}
                <span className="text-on-surface">{a.target?.slice(0, 80)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

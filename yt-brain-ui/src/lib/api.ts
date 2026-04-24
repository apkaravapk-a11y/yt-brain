// Single API client for the yt-brain backend. Hits the Python FastAPI server
// in dev; in prod (Vercel) `VITE_API_BASE` is empty and we short-circuit to
// offline fallbacks so the page never hangs on a failed fetch.

export const API_BASE = import.meta.env.VITE_API_BASE || "";
const DEFAULT_DEV_BASE = "http://127.0.0.1:11811";
const EFFECTIVE_BASE = API_BASE || (import.meta.env.DEV ? DEFAULT_DEV_BASE : "");
export const BACKEND_CONFIGURED = EFFECTIVE_BASE !== "";

class OfflineError extends Error {
  constructor() { super("backend not configured"); }
}

async function req<T>(path: string, init?: RequestInit, timeoutMs = 3500): Promise<T> {
  if (!BACKEND_CONFIGURED) throw new OfflineError();
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${EFFECTIVE_BASE}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return r.json();
  } finally {
    clearTimeout(t);
  }
}

export interface Video {
  video_id: string;
  title: string;
  channel_name: string;
  source: string;
  url?: string;
  watched_at?: string | null;
}

export interface StatusResp {
  video_count: number;
  mode: string;
  mode_persona: string;
  sentinels: Record<string, boolean>;
  backends: { name: string; available: boolean }[];
  ai_router: string;
}

export interface ConsentDecision {
  decision: "allow" | "deny" | "ask";
  reason: string;
  p: number | null;
}

export interface Mode {
  name: string;
  persona_hint: string;
  visual_theme: string;
  voice_on: boolean;
}

export const api = {
  status: () => req<StatusResp>("/api/status"),
  videos: (q?: string) => req<Video[]>(`/api/videos${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  consent: {
    decide: (action: string) => req<ConsentDecision>(`/api/consent/decide?action=${encodeURIComponent(action)}`),
  },
  mode: {
    current: () => req<Mode>("/api/mode"),
    list: () => req<string[]>("/api/mode/list"),
    set: (name: string) => req<Mode>("/api/mode", { method: "POST", body: JSON.stringify({ name }) }),
  },
  ai: {
    status: () => req<any>("/api/ai/status"),
  },
};

// WebSocket for live events. Returns null if backend isn't configured — callers
// should treat that as "offline" and run their local simulation.
export function connectLive(onEvent: (ev: any) => void): WebSocket | null {
  if (!BACKEND_CONFIGURED) return null;
  try {
    const wsUrl = EFFECTIVE_BASE.replace(/^http/, "ws") + "/ws/live";
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (m) => {
      try { onEvent(JSON.parse(m.data)); } catch { /* ignore */ }
    };
    // Swallow errors silently — UI already shows an offline badge.
    ws.onerror = () => { /* noop */ };
    return ws;
  } catch {
    return null;
  }
}

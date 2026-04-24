// Single API client for the yt-brain backend. Hits the Python FastAPI server
// in dev, same-origin in prod (Vercel proxies /api/* to the backend).

export const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:11811";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
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

// WebSocket for live events
export function connectLive(onEvent: (ev: any) => void): WebSocket | null {
  try {
    const wsUrl = API_BASE.replace(/^http/, "ws") + "/ws/live";
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (m) => {
      try { onEvent(JSON.parse(m.data)); } catch { /* ignore */ }
    };
    return ws;
  } catch {
    return null;
  }
}

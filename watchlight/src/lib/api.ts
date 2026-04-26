// Watchlight API client — talks to the FastAPI sidecar (or shows fallback in prod web).

export const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.DEV ? "http://127.0.0.1:11811" : "");
export const HAS_BACKEND = !!API_BASE;

export class OfflineError extends Error {
  constructor() { super("backend not configured"); }
}

async function req<T>(path: string, init?: RequestInit, ms = 3500): Promise<T> {
  if (!HAS_BACKEND) throw new OfflineError();
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return r.json();
  } finally { clearTimeout(t); }
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

export const api = {
  health: () => req<{ ok: boolean; ts: string; service: string; version: string }>("/api/health"),
  status: () => req<StatusResp>("/api/status"),
  videos: (q?: string) => req<Video[]>(`/api/videos${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  consent: { decide: (a: string) => req<any>(`/api/consent/decide?action=${a}`) },
  mode: {
    current: () => req<any>("/api/mode"),
    list: () => req<string[]>("/api/mode/list"),
    set: (name: string) => req<any>("/api/mode", { method: "POST", body: JSON.stringify({ name }) }),
  },
  liveVisit: (url: string, title: string) =>
    req<any>("/api/live/visit", { method: "POST", body: JSON.stringify({ url, title }) }),
};

export function connectLive(onEvent: (ev: any) => void): WebSocket | null {
  if (!HAS_BACKEND) return null;
  try {
    const ws = new WebSocket(API_BASE.replace(/^http/, "ws") + "/ws/live");
    ws.onmessage = (m) => { try { onEvent(JSON.parse(m.data)); } catch {} };
    ws.onerror = () => {};
    return ws;
  } catch { return null; }
}

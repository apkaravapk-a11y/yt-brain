// Service worker — relays content-script events to the local yt-brain backend.
const DEFAULT_API = "http://127.0.0.1:11811";

async function getApiBase() {
  const { apiBase } = await chrome.storage.local.get("apiBase");
  return apiBase || DEFAULT_API;
}

async function post(path, body) {
  const base = await getApiBase();
  try {
    const r = await fetch(base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { ok: r.ok, status: r.status };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function getStatus() {
  const base = await getApiBase();
  try {
    const r = await fetch(base + "/api/status");
    return await r.json();
  } catch (e) {
    return { error: String(e) };
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "live.visit") {
    post("/api/live/visit", { url: msg.url, title: msg.title, ts: Date.now() }).then(sendResponse);
    return true;
  }
  if (msg.type === "status") {
    getStatus().then(sendResponse);
    return true;
  }
  if (msg.type === "set_api_base") {
    chrome.storage.local.set({ apiBase: msg.apiBase }).then(() => sendResponse({ ok: true }));
    return true;
  }
});

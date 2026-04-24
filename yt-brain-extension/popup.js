async function refresh() {
  const { apiBase } = await chrome.storage.local.get("apiBase");
  document.getElementById("api-base").value = apiBase || "http://127.0.0.1:11811";
  chrome.runtime.sendMessage({ type: "status" }, (s) => {
    const el = document.getElementById("backend-status");
    if (!s || s.error) {
      el.textContent = "offline"; el.className = "bad";
      document.getElementById("video-count").textContent = "—";
      document.getElementById("mode").textContent = "—";
      document.getElementById("sentinels").textContent = s?.error || "";
      return;
    }
    el.textContent = "ok · " + (s.ai_router || "?"); el.className = "ok";
    document.getElementById("video-count").textContent = s.video_count ?? "—";
    document.getElementById("mode").textContent = s.mode ?? "—";
    const sentinels = s.sentinels || {};
    const active = Object.entries(sentinels).filter(([, v]) => v).map(([k]) => k);
    document.getElementById("sentinels").innerHTML = active.length
      ? `<span class="dot" style="background:#ff6b6b"></span>active kill-switches: ${active.join(", ")}`
      : `<span class="dot" style="background:#58e6a7"></span>no sentinels active`;
  });
}

document.getElementById("save").addEventListener("click", () => {
  const val = document.getElementById("api-base").value.trim() || "http://127.0.0.1:11811";
  chrome.runtime.sendMessage({ type: "set_api_base", apiBase: val }, () => {
    document.getElementById("saved").style.display = "block";
    setTimeout(() => (document.getElementById("saved").style.display = "none"), 1500);
    refresh();
  });
});

refresh();
setInterval(refresh, 5000);

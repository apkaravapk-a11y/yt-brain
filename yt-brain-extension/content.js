// Fires on YouTube watch pages + home. Reports the visible video to yt-brain.
// Batch C9: debounce the MutationObserver + compare URL before sending.
(function () {
  function extract() {
    const m = location.href.match(/[?&]v=([A-Za-z0-9_-]{11})/);
    const videoId = m ? m[1] : null;
    const title = document.title.replace(/\s*-\s*YouTube\s*$/, "").trim();
    return { videoId, title, url: location.href };
  }

  let lastUrl = "";
  let debounceId = null;

  function reportNow() {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    const info = extract();
    try {
      chrome.runtime.sendMessage({ type: "live.visit", ...info });
    } catch (e) {
      // Extension context can become invalidated during navigation; stay quiet.
    }
  }

  function scheduleReport() {
    if (debounceId !== null) clearTimeout(debounceId);
    debounceId = setTimeout(() => {
      debounceId = null;
      reportNow();
    }, 300);
  }

  // Initial visit
  reportNow();

  // Most YT route changes are pushState — listen to that directly + popstate.
  const wrap = (name) => {
    const orig = history[name];
    if (!orig) return;
    history[name] = function () {
      const r = orig.apply(this, arguments);
      scheduleReport();
      return r;
    };
  };
  wrap("pushState");
  wrap("replaceState");
  window.addEventListener("popstate", scheduleReport);

  // Fallback: observe only title changes (cheap, subtree=false).
  const titleEl = document.querySelector("title");
  if (titleEl) {
    new MutationObserver(scheduleReport).observe(titleEl, { childList: true });
  }
})();

// Fires on YouTube watch pages + home. Reports the visible video to yt-brain.
(function () {
  function extract() {
    const m = location.href.match(/[?&]v=([A-Za-z0-9_-]{11})/);
    const videoId = m ? m[1] : null;
    const title = document.title.replace(/\s*-\s*YouTube\s*$/, "").trim();
    return { videoId, title, url: location.href };
  }

  function report() {
    const info = extract();
    chrome.runtime.sendMessage({ type: "live.visit", ...info });
  }

  // Initial + on SPA route changes (YT uses history.pushState)
  report();
  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      report();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();

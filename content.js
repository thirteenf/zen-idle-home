/* Idle Home Redirect — content script
 *
 * Sends throttled "activity" pings to the background page while this
 * document is visible and being interacted with.
 */
(() => {
  const THROTTLE_MS = 5000;
  let lastPing = 0;

  function ping() {
    if (document.visibilityState !== "visible") return;
    const now = Date.now();
    if (now - lastPing < THROTTLE_MS) return;
    lastPing = now;
    try {
      browser?.runtime?.sendMessage({ type: "activity" }).catch(() => {});
    } catch (err) {
      /* Background page may be restarting; ignore. */
    }
  }

  for (const type of ["mousemove", "mousedown", "keydown", "scroll", "wheel", "touchstart"]) {
    window.addEventListener(type, ping, { passive: true, capture: true });
  }

  document.addEventListener("visibilitychange", ping);
  ping();
})();

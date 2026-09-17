/* Idle Home Redirect — background script
 *
 * If the focused tab has had no activity for IDLE_TIMEOUT_MS,
 * navigate it to the browser's configured home page.
 */

const IDLE_TIMEOUT_MS = 30 * 1000; // TEMP: 30 seconds for testing (restore to 15 * 60 * 1000)
const ALARM_NAME = "idle-home-check";

const state = {
  // Grace period: the idle clock starts when the browser (or extension) starts.
  lastActivity: Date.now(),
  navigatedThisIdle: false,
  homeUrl: null,
};

function noteActivity() {
  state.lastActivity = Date.now();
  state.navigatedThisIdle = false;
  updateBadge();
}

// Visible debugging aid: the toolbar badge shows how long until the
// idle redirect fires (e.g. "29" seconds), or "OK" right after a
// redirect until the next activity. Makes it obvious the extension
// is alive and the idle clock is being reset.
function updateBadge() {
  if (!browser.browserAction) return;
  let text;
  if (state.navigatedThisIdle) {
    text = "OK";
  } else {
    const remaining = Math.max(0, IDLE_TIMEOUT_MS - (Date.now() - state.lastActivity));
    const secs = Math.ceil(remaining / 1000);
    text = secs >= 60 ? Math.floor(secs / 60) + "m" : String(secs);
  }
  browser.browserAction
    .setBadgeText({ text })
    .catch((err) => console.warn("idle-home-redirect: badge update failed", err));
}

// Firefox can report the homepage setting as a bare Windows filesystem path
// (e.g. "C:\Users\...") instead of a proper file:// URL; tabs.update() then
// silently no-ops instead of navigating, so normalize it here.
function normalizeHomeUrl(value) {
  if (/^[a-zA-Z]:[\\/]/.test(value)) {
    return "file:///" + encodeURI(value.replace(/\\/g, "/"));
  }
  return value;
}

async function getHomePageUrl() {
  if (state.homeUrl) return state.homeUrl;
  try {
    const setting = await browser.browserSettings.homepageOverride.get({});
    if (setting && setting.value) {
      const url = normalizeHomeUrl(setting.value);
      // Firefox refuses to navigate tabs to file:// URLs via the tabs API
      // (a hard, permanent security restriction, not a permission you can
      // grant). Fall back to the bundled copy in that case.
      if (!url.startsWith("file://")) {
        state.homeUrl = url;
        return url;
      }
    }
  } catch (err) {
    console.warn("idle-home-redirect: could not read home page, falling back to bundled page", err);
  }
  const bundled = browser.runtime.getURL("home.html");
  state.homeUrl = bundled;
  return bundled;
}

async function checkIdle() {
  if (Date.now() - state.lastActivity < IDLE_TIMEOUT_MS) return;
  if (state.navigatedThisIdle) return;

  const windows = await browser.windows.getAll({ populate: true, windowTypes: ["normal"] });
  const window = windows.find((w) => w.focused) || windows[0];
  const tab = window && window.tabs && window.tabs.find((t) => t.active);
  if (!tab || tab.id == null) return;

  // Don't interrupt pages that are still loading or downloading.
  if (tab.status === "loading" || tab.downloading) return;
  // Don't clobber add-on pages (e.g. this extension's own pages).
  if (typeof tab.url === "string" && tab.url.startsWith("moz-extension://")) return;

  const home = await getHomePageUrl();
  if (tab.url === home) return; // already at home

  state.navigatedThisIdle = true;
  try {
    await browser.tabs.update(tab.id, { url: home });
  } catch (err) {
    state.navigatedThisIdle = false;
    console.warn("idle-home-redirect: failed to navigate to home page", err);
  }
}

// Alarms are the reliable way to keep an event-page background alive,
// but alarms cannot fire more often than once per minute. For short
// timeouts (e.g. the 30s test setting), also poll with a repeating
// timer. checkIdle() is idempotent via state.lastActivity, so running
// both mechanisms is safe.
const CHECK_INTERVAL_MS = 10 * 1000; // check every 10s

browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) checkIdle();
});

browser.alarms.create(ALARM_NAME, { periodInMinutes: 1 });

let checkTimer = null;
function scheduleCheck() {
  if (checkTimer) return;
  checkTimer = setTimeout(() => {
    checkTimer = null;
    checkIdle();
    updateBadge();
    scheduleCheck();
  }, CHECK_INTERVAL_MS);
}
scheduleCheck();
updateBadge();

// Activity signals from content scripts.
browser.runtime.onMessage.addListener((message) => {
  if (message && message.type === "activity") noteActivity();
});

// Activity signals from browser events.
browser.tabs.onActivated.addListener(noteActivity);
browser.windows.onFocusChanged.addListener(noteActivity);
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "complete") noteActivity();
});

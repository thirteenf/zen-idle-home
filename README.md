# Idle Home Redirect (Zen Browser)

Returns the **focused tab** to Zen's default home page after **15 minutes** of inactivity.

## How it works

- A content script on every page sends throttled (max once per 5 s) "activity" pings
  on mouse movement, clicks, key presses, scrolling, or touch — only while the tab is visible.
- The background script keeps an idle clock. Any activity (including switching tabs or
  windows) resets it.
- An alarm ticks once per minute; if 15 minutes have passed with no activity, the
  focused tab is navigated to the browser's configured home page.
- Safety: it never interrupts a page that is still loading or downloading, never
  touches `moz-extension://` pages, and skips if the tab is already at home.
- The home page is read from Zen's settings via `browserContext.getHome()`;
  if that fails it falls back to `about:home`.

## Install

**Permanent install (recommended):**

1. In Zen, open `about:addons`
2. Click the gear (⚙) menu → **Install Add-on From File…**
3. Select `idle-home-redirect.xpi`

**Temporary install (for testing, lasts until Zen restarts):**

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…**
3. Select `idle-home-redirect.xpi` (or the `manifest.json` in the unzipped folder)

## Testing

- Set a short timer (or just walk away for 15 min) on any web page.
- After 15 minutes of no mouse/keyboard/scroll activity, the tab returns to home.
- Any activity — even switching to another tab — resets the 15-minute clock.
- Note: the idle clock starts when Zen (or the extension) starts, so a freshly
  opened tab gets a full 15 minutes of grace.

## Customizing

- **Idle duration**: edit `IDLE_TIMEOUT_MS` in `background.js` (e.g. `10 * 60 * 1000` for 10 minutes).
- **Check frequency**: `periodInMinutes` in `browser.alarms.create(...)` (Firefox minimum is `0.5`).

## Uninstall

`about:addons` → find *Idle Home Redirect* → **Remove**.

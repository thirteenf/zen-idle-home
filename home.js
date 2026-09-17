// ── Config ──
const STORAGE_KEY = 'zen_homepage_links';
const ENGINE_KEY = 'zen_homepage_engine';

const defaultLinks = [
  { name: 'GitHub',     url: 'https://github.com',          emoji: '🐙', color: '#6e5494' },
  { name: 'Reddit',     url: 'https://reddit.com',          emoji: '🤖', color: '#ff4500' },
  { name: 'YouTube',    url: 'https://youtube.com',         emoji: '▶️', color: '#ff0000' },
  { name: 'Gmail',      url: 'https://mail.google.com',     emoji: '📧', color: '#4285f4' },
  { name: 'Twitter',    url: 'https://x.com',               emoji: '🐦', color: '#1d9bf0' },
  { name: 'Notion',     url: 'https://notion.so',           emoji: '📝', color: '#fff' },
  { name: 'Drive',      url: 'https://drive.google.com',    emoji: '📁', color: '#4285f4' },
  { name: 'Calendar',   url: 'https://calendar.google.com', emoji: '📅', color: '#0f9d58' },
];

const quotes = [
  '"The only way to do great work is to love what you do." — Steve Jobs',
  '"Simplicity is the ultimate sophistication." — Leonardo da Vinci',
  '"What you think, you become." — Buddha',
  '"The present moment is filled with joy." — Buddha',
  '"Less is more." — Mies van der Rohe',
  '"Do what you can, with what you have, where you are." — Theodore Roosevelt',
  '"Everything you can imagine is real." — Pablo Picasso',
  '"The best time to plant a tree was 20 years ago. The second best time is now."',
  '"Focus on being productive instead of busy." — Tim Ferriss',
  '"Your limitation—it\'s only your imagination."',
  '"Stay away from people who diminish your vision." — Oprah Winfrey',
  '"The mind is everything. What you think, you become." — Buddha',
];

const searchEngines = {
  google:      'https://www.google.com/search?igu=1&q=',
  duckduckgo:  'https://duckduckgo.com/?q=',
  bing:        'https://www.bing.com/search?q=',
  brave:       'https://search.brave.com/search?q=',
  youtube:     'https://www.youtube.com/results?search_query=',
};

// ── Safe Storage (falls back to memory if sandboxed) ──
const _store = {};
let storageAvailable = false;
try { localStorage.getItem('__test'); storageAvailable = true; } catch(e) { storageAvailable = false; }

function storeGet(key) {
  if (storageAvailable) return localStorage.getItem(key);
  return _store[key] !== undefined ? _store[key] : null;
}

function storeSet(key, value) {
  if (storageAvailable) localStorage.setItem(key, value);
  else _store[key] = value;
}

function storeRemove(key) {
  if (storageAvailable) localStorage.removeItem(key);
  else delete _store[key];
}

// ── State ──
let links = JSON.parse(storeGet(STORAGE_KEY)) || defaultLinks;
let currentEngine = storeGet(ENGINE_KEY) || 'google';

// ── Clock ──
function updateClock() {
  const now = new Date();
  const h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  const t = String(h % 12 || 12).padStart(2, '0');
  document.getElementById('clock').textContent = `${t}:${m}`;

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('date').textContent = now.toLocaleDateString('en-US', options);

  let greet = 'Good evening';
  if (h >= 5 && h < 12) greet = 'Good morning';
  else if (h >= 12 && h < 17) greet = 'Good afternoon';
  document.getElementById('greeting').textContent = greet;
}
updateClock();
setInterval(updateClock, 1000);

// ── Quote ──
document.getElementById('quote').textContent = quotes[Math.floor(Math.random() * quotes.length)];

// ── Search ──
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && searchInput.value.trim()) {
    window.location.href = searchEngines[currentEngine] + encodeURIComponent(searchInput.value.trim());
  }
});

document.querySelectorAll('.engine-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.engine-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    currentEngine = pill.dataset.engine;
    storeSet(ENGINE_KEY, currentEngine);
    searchInput.focus();
  });
});
document.querySelector(`[data-engine="${currentEngine}"]`)?.classList.add('active');
setTimeout(() => searchInput.focus(), 300);

// ── Links ──
function saveLinks() { storeSet(STORAGE_KEY, JSON.stringify(links)); }

function renderLinks() {
  const grid = document.getElementById('linksGrid');
  grid.innerHTML = '';
  links.forEach((link, i) => {
    const card = document.createElement('a');
    card.className = 'link-card';
    card.href = link.url;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'link-delete';
    deleteBtn.dataset.index = i;
    deleteBtn.title = 'Remove';
    deleteBtn.textContent = '✕';
    card.appendChild(deleteBtn);

    const iconDiv = document.createElement('div');
    iconDiv.className = 'link-icon';
    iconDiv.style.background = link.color || 'var(--bg-card)';
    iconDiv.textContent = link.emoji || '🔗';
    card.appendChild(iconDiv);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'link-name';
    nameSpan.textContent = link.name;
    card.appendChild(nameSpan);

    grid.appendChild(card);
  });

  grid.querySelectorAll('.link-delete').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      links.splice(+btn.dataset.index, 1);
      saveLinks();
      renderLinks();
    });
  });
}
renderLinks();

// ── Modal ──
const overlay  = document.getElementById('modalOverlay');
const btnAdd   = document.getElementById('btnAdd');
const btnCancel = document.getElementById('modalCancel');
const btnConfirm = document.getElementById('modalConfirm');

btnAdd.addEventListener('click', () => { overlay.classList.add('active'); document.getElementById('modalName').focus(); });
btnCancel.addEventListener('click', () => overlay.classList.remove('active'));
overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('active'); });

btnConfirm.addEventListener('click', () => {
  const name = document.getElementById('modalName').value.trim();
  let url = document.getElementById('modalUrl').value.trim();
  const emoji = document.getElementById('modalEmoji').value.trim() || '🔗';
  if (!name || !url) return;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  const hue = Math.floor(Math.random() * 360);
  links.push({ name, url, emoji, color: `hsl(${hue}, 50%, 50%)` });
  saveLinks();
  renderLinks();
  overlay.classList.remove('active');
  document.getElementById('modalName').value = '';
  document.getElementById('modalUrl').value = '';
  document.getElementById('modalEmoji').value = '';
});

// ── Keyboard shortcut: / to focus search ──
document.addEventListener('keydown', e => {
  if (e.key === '/' && document.activeElement !== searchInput) {
    e.preventDefault();
    searchInput.focus();
  }
});

// ── Settings ──
const SETTINGS_KEY = 'zen_homepage_settings';
const defaultSettings = { showClock: true, showQuote: true, showSearch: true, accentColor: '#7c6aef' };
let settings = { ...defaultSettings, ...JSON.parse(storeGet(SETTINGS_KEY) || '{}') };

function saveSettings() { storeSet(SETTINGS_KEY, JSON.stringify(settings)); }

function applySettings() {
  document.getElementById('toggleClock').checked = settings.showClock;
  document.getElementById('toggleQuote').checked = settings.showQuote;
  document.getElementById('toggleSearch').checked = settings.showSearch;
  document.getElementById('clockSection').style.display = settings.showClock ? '' : 'none';
  document.getElementById('quote').style.display = settings.showQuote ? '' : 'none';
  document.querySelector('.search-section').style.display = settings.showSearch ? '' : 'none';
  document.documentElement.style.setProperty('--accent', settings.accentColor);
  // Update glow color
  const r = parseInt(settings.accentColor.slice(1,3),16);
  const g = parseInt(settings.accentColor.slice(3,5),16);
  const b = parseInt(settings.accentColor.slice(5,7),16);
  document.documentElement.style.setProperty('--accent-glow', `rgba(${r},${g},${b},0.25)`);
  // Highlight active swatch
  document.querySelectorAll('.color-swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.color === settings.accentColor);
  });
}

// Apply on load
const clockSection = document.querySelector('.clock-section');
clockSection.id = 'clockSection';
applySettings();

// Toggle handlers
document.getElementById('toggleClock').addEventListener('change', e => {
  settings.showClock = e.target.checked;
  document.getElementById('clockSection').style.display = settings.showClock ? '' : 'none';
  saveSettings();
});

document.getElementById('toggleQuote').addEventListener('change', e => {
  settings.showQuote = e.target.checked;
  document.getElementById('quote').style.display = settings.showQuote ? '' : 'none';
  saveSettings();
});

document.getElementById('toggleSearch').addEventListener('change', e => {
  settings.showSearch = e.target.checked;
  document.querySelector('.search-section').style.display = settings.showSearch ? '' : 'none';
  saveSettings();
});

// Color swatches
document.querySelectorAll('.color-swatch').forEach(swatch => {
  swatch.addEventListener('click', () => {
    settings.accentColor = swatch.dataset.color;
    applySettings();
    saveSettings();
  });
});

// Settings modal open/close
const settingsOverlay = document.getElementById('settingsOverlay');
document.getElementById('btnCustomize').addEventListener('click', () => settingsOverlay.classList.add('active'));
document.getElementById('settingsClose').addEventListener('click', () => settingsOverlay.classList.remove('active'));
settingsOverlay.addEventListener('click', e => { if (e.target === settingsOverlay) settingsOverlay.classList.remove('active'); });

// Reset to defaults
document.getElementById('btnReset').addEventListener('click', () => {
  if (confirm('Reset homepage to defaults? This will restore original links, settings, and search engine.')) {
    storeRemove(STORAGE_KEY);
    storeRemove(ENGINE_KEY);
    storeRemove(SETTINGS_KEY);
    links = JSON.parse(JSON.stringify(defaultLinks));
    currentEngine = 'google';
    settings = { ...defaultSettings };
    renderLinks();
    applySettings();
    document.querySelectorAll('.engine-pill').forEach(p => p.classList.remove('active'));
    document.querySelector('[data-engine="google"]').classList.add('active');
    settingsOverlay.classList.remove('active');
  }
});

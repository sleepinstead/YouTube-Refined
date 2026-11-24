/** Popup: reads/writes preferences to chrome.storage.sync. Changes apply instantly to open tabs. */

const YTC = globalThis.YTC;

const STORAGE_KEY = 'columns';
const HINT_KEY = 'gridHint';
const VIDEO_QUALITY_KEY = 'videoQuality';
const PLAYBACK_SPEED_KEY = 'playbackSpeed';

const TOGGLE_OPTIONS = [
  { key: 'blockShorts', id: 'blockShorts', initial: YTC.DEFAULT_BLOCK_SHORTS, sanitize: YTC.sanitizeBlockShorts },
  { key: 'hideExploreTopics', id: 'hideExploreTopics', initial: YTC.DEFAULT_HIDE_EXPLORE_TOPICS, sanitize: YTC.sanitizeHideExploreTopics },
  { key: 'hideMemberships', id: 'hideMemberships', initial: YTC.DEFAULT_HIDE_MEMBERSHIPS, sanitize: YTC.sanitizeHideMemberships },
  { key: 'hideMixes', id: 'hideMixes', initial: YTC.DEFAULT_HIDE_MIXES, sanitize: YTC.sanitizeHideMixes },
  { key: 'hideFilterChips', id: 'hideFilterChips', initial: YTC.DEFAULT_HIDE_FILTER_CHIPS, sanitize: YTC.sanitizeHideFilterChips },
  { key: 'hideLiveStreams', id: 'hideLiveStreams', initial: YTC.DEFAULT_HIDE_LIVE_STREAMS, sanitize: YTC.sanitizeHideLiveStreams },
  { key: 'hideStartedVideos', id: 'hideStartedVideos', initial: YTC.DEFAULT_HIDE_STARTED_VIDEOS, sanitize: YTC.sanitizeHideStartedVideos },
  { key: 'hidePlaylists', id: 'hidePlaylists', initial: YTC.DEFAULT_HIDE_PLAYLISTS, sanitize: YTC.sanitizeHidePlaylists },
  { key: 'hideComments', id: 'hideComments', initial: YTC.DEFAULT_HIDE_COMMENTS, sanitize: YTC.sanitizeHideComments },
  { key: 'hideRecommendations', id: 'hideRecommendations', initial: YTC.DEFAULT_HIDE_RECOMMENDATIONS, sanitize: YTC.sanitizeHideRecommendations },
  { key: 'hideEndScreen', id: 'hideEndScreen', initial: YTC.DEFAULT_HIDE_END_SCREEN, sanitize: YTC.sanitizeHideEndScreen },
  { key: 'hideSidebar', id: 'hideSidebar', initial: YTC.DEFAULT_HIDE_SIDEBAR, sanitize: YTC.sanitizeHideSidebar },
  { key: 'showNavbarSettings', id: 'showNavbarSettings', initial: YTC.DEFAULT_SHOW_NAVBAR_SETTINGS, sanitize: YTC.sanitizeShowNavbarSettings },
  { key: 'hideCreateButton', id: 'hideCreateButton', initial: YTC.DEFAULT_HIDE_CREATE_BUTTON, sanitize: YTC.sanitizeHideCreateButton },
  { key: 'hideVoiceSearch', id: 'hideVoiceSearch', initial: YTC.DEFAULT_HIDE_VOICE_SEARCH, sanitize: YTC.sanitizeHideVoiceSearch },
  { key: 'hideNotifications', id: 'hideNotifications', initial: YTC.DEFAULT_HIDE_NOTIFICATIONS, sanitize: YTC.sanitizeHideNotifications },
  { key: 'hideCountryCode', id: 'hideCountryCode', initial: YTC.DEFAULT_HIDE_COUNTRY_CODE, sanitize: YTC.sanitizeHideCountryCode },
  { key: 'hideHoverPreviews', id: 'hideHoverPreviews', initial: YTC.DEFAULT_HIDE_HOVER_PREVIEWS, sanitize: YTC.sanitizeHideHoverPreviews },
  { key: 'hideAmbientMode', id: 'hideAmbientMode', initial: YTC.DEFAULT_HIDE_AMBIENT_MODE, sanitize: YTC.sanitizeHideAmbientMode },
  { key: 'hideInfoCards', id: 'hideInfoCards', initial: YTC.DEFAULT_HIDE_INFO_CARDS, sanitize: YTC.sanitizeHideInfoCards },
  { key: 'gridColumnsEnabled', id: 'gridColumnsEnabled', initial: YTC.DEFAULT_GRID_COLUMNS_ENABLED, sanitize: YTC.sanitizeGridColumnsEnabled },
];

const countInput = document.getElementById('count');
const slider = document.getElementById('slider');
const decrement = document.getElementById('decrement');
const increment = document.getElementById('increment');
const reset = document.getElementById('reset');
const note = document.getElementById('note');
const gridBody = document.getElementById('gridBody');
const toggleInputs = new Map(TOGGLE_OPTIONS.map(({ key, id }) => [key, document.getElementById(id)]));
const shortsNote = document.getElementById('shortsNote');
const speedSelect = document.getElementById('playbackSpeed');
const qualitySelect = document.getElementById('videoQuality');
const statusEl = document.getElementById('status');
const tabs = [...document.querySelectorAll('.tab')];

/* Tabs */
function selectTab(tab, focus) {
  for (const t of tabs) {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  }
  if (focus) tab.focus();
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (step) { e.preventDefault(); selectTab(tabs[(i + step + tabs.length) % tabs.length], true); }
    if (e.key === 'Home') { e.preventDefault(); selectTab(tabs[0], true); }
    if (e.key === 'End') { e.preventDefault(); selectTab(tabs[tabs.length - 1], true); }
  });
});

let statusTimer = 0;
function setStatus(state, text) {
  statusEl.textContent = text;
  statusEl.dataset.state = state;
  clearTimeout(statusTimer);
  if (state === 'saved') statusTimer = setTimeout(() => { statusEl.dataset.state = 'idle'; }, 1400);
}

const SHORTS_ON_HINT = 'Removes Shorts from feeds; Shorts links go home.';
const SHORTS_OFF_HINT = 'Shorts are left alone — reload a YouTube tab to see them again.';

const WRITE_DELAY = 120;
let writeTimer = 0;
let writeItems = {};

function queueWrite(items) {
  writeItems = { ...writeItems, ...items };
  clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    const pending = writeItems;
    writeItems = {};
    chrome.storage.sync.set(pending).then(() => setStatus('saved', 'Saved')).catch(() => setStatus('error', 'Not saved'));
  }, WRITE_DELAY);
}

/* -------------------------------------------------------------------------- */

function renderNote(hint) {
  const match = /^(\d+):(\d+)$/.exec(hint || '');
  const clamped = match && Number(match[2]) < Number(match[1]);

  note.hidden = !clamped;
  note.textContent = clamped
    ? `Your open YouTube tabs are too narrow for ${match[1]} columns, so they show ${match[2]}. Widen the window or pick fewer.`
    : '';
}

function defaultsForToggles() {
  return Object.fromEntries(TOGGLE_OPTIONS.map(({ key, initial }) => [key, initial]));
}

function currentToggleValues() {
  return Object.fromEntries(TOGGLE_OPTIONS.map(({ key, sanitize }) => [key, sanitize(toggleInputs.get(key).checked)]));
}

function render(value, hint, toggles) {
  const columns = YTC.sanitizeColumns(value);
  const isDefault = columns === YTC.DEFAULT_COLUMNS;
  const isGridEnabled = YTC.sanitizeGridColumnsEnabled(toggles.gridColumnsEnabled);

  countInput.value = String(columns);
  slider.value = String(columns);
  countInput.disabled = !isGridEnabled;
  slider.disabled = !isGridEnabled;
  decrement.disabled = !isGridEnabled || columns <= YTC.MIN_COLUMNS;
  increment.disabled = !isGridEnabled || columns >= YTC.MAX_COLUMNS;
  reset.hidden = !isGridEnabled || isDefault;
  gridBody.classList.toggle('disabled', !isGridEnabled);

  for (const { key, sanitize } of TOGGLE_OPTIONS) {
    toggleInputs.get(key).checked = sanitize(toggles[key]);
  }
  shortsNote.textContent = toggleInputs.get('blockShorts').checked ? SHORTS_ON_HINT : SHORTS_OFF_HINT;

  if (isGridEnabled) {
    renderNote(hint);
  } else {
    note.hidden = true;
  }
}

/* -------------------------------------------------------------------------- */

const write = (items) => queueWrite(items);

async function init() {
  let columns = YTC.DEFAULT_COLUMNS;
  let toggles = defaultsForToggles();
  let hint = '';

  try {
    const stored = await chrome.storage.sync.get({
      [STORAGE_KEY]: YTC.DEFAULT_COLUMNS,
      [VIDEO_QUALITY_KEY]: YTC.DEFAULT_VIDEO_QUALITY,
      [PLAYBACK_SPEED_KEY]: YTC.DEFAULT_PLAYBACK_SPEED,
      ...defaultsForToggles(),
    });
    qualitySelect.value = YTC.sanitizeVideoQuality(stored[VIDEO_QUALITY_KEY]);
    speedSelect.value = YTC.sanitizePlaybackSpeed(stored[PLAYBACK_SPEED_KEY]);
    columns = YTC.sanitizeColumns(stored[STORAGE_KEY]);
    toggles = Object.fromEntries(TOGGLE_OPTIONS.map(({ key, sanitize }) => [key, sanitize(stored[key])]));
  } catch {
    columns = YTC.DEFAULT_COLUMNS;
    toggles = defaultsForToggles();
  }

  try {
    const local = await chrome.storage.local.get({ [HINT_KEY]: '' });
    hint = local[HINT_KEY];
  } catch {
    hint = '';
  }

  render(columns, hint, toggles);
}

/* -------------------------------------------------------------------------- */

function commit(raw) {
  const columns = YTC.sanitizeColumns(raw);
  render(columns, '', currentToggleValues());
  write({ [STORAGE_KEY]: columns });
}

countInput.addEventListener('input', () => {
  const value = countInput.valueAsNumber;
  if (Number.isNaN(value)) return;
  commit(value);
});

countInput.addEventListener('blur', () => {
  commit(countInput.valueAsNumber);
});

slider.addEventListener('input', () => commit(slider.valueAsNumber));

decrement.addEventListener('click', () => commit(countInput.valueAsNumber - 1));
increment.addEventListener('click', () => commit(countInput.valueAsNumber + 1));

reset.addEventListener('click', () => commit(YTC.DEFAULT_COLUMNS));

for (const { key } of TOGGLE_OPTIONS) {
  toggleInputs.get(key).addEventListener('change', () => {
    const value = toggleInputs.get(key).checked;
    if (key === 'blockShorts') shortsNote.textContent = value ? SHORTS_ON_HINT : SHORTS_OFF_HINT;
    if (key === 'gridColumnsEnabled') {
      render(countInput.valueAsNumber, note.textContent ? '' : '', currentToggleValues());
    }
    write({ [key]: value });
  });
}

qualitySelect.addEventListener('change', () => {
  write({ [VIDEO_QUALITY_KEY]: YTC.sanitizeVideoQuality(qualitySelect.value) });
});

speedSelect.addEventListener('change', () => {
  write({ [PLAYBACK_SPEED_KEY]: YTC.sanitizePlaybackSpeed(speedSelect.value) });
});

init();

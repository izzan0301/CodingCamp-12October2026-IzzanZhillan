/* js/app.js — To Do List Life Dashboard */

/* ==========================================================================
   StorageManager
   Foundation module — initialized first.
   Handles all read/write operations to localStorage with graceful fallback
   to an in-memory store when localStorage is unavailable (e.g. private mode).
   ========================================================================== */
const StorageManager = (() => {
  // ── Constants ────────────────────────────────────────────────────────────
  const KEYS = {
    TASKS: 'tld_tasks',
    LINKS: 'tld_links',
  };

  // ── In-memory fallback store (used when localStorage is not available) ───
  const _memoryStore = {};

  // ── Internal: resolve whether to use real localStorage ───────────────────
  // Evaluated once at module init; avoids repeated isAvailable() calls.
  let _useLocalStorage = false; // will be set after isAvailable() check

  // ── Internal: show/hide the storage banner ───────────────────────────────
  function _showBanner(message) {
    // Banner element may not exist yet if called before DOMContentLoaded;
    // defer safely so as not to crash the module.
    function _apply() {
      const banner = document.getElementById('storage-banner');
      if (!banner) return;
      banner.textContent = message;
      banner.hidden = false;
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _apply, { once: true });
    } else {
      _apply();
    }
  }

  function _hideBanner() {
    const banner = document.getElementById('storage-banner');
    if (banner) {
      banner.hidden = true;
      banner.textContent = '';
    }
  }

  // ── isAvailable ───────────────────────────────────────────────────────────
  /**
   * Tests localStorage availability by performing a write / read / delete cycle.
   * Returns true if all three operations succeed without throwing.
   * @returns {boolean}
   */
  function isAvailable() {
    const TEST_KEY = '__tld_storage_test__';
    const TEST_VALUE = '1';
    try {
      localStorage.setItem(TEST_KEY, TEST_VALUE);
      const read = localStorage.getItem(TEST_KEY);
      localStorage.removeItem(TEST_KEY);
      return read === TEST_VALUE;
    } catch (e) {
      return false;
    }
  }

  // ── get ───────────────────────────────────────────────────────────────────
  /**
   * Reads the value for `key` from localStorage (or the in-memory fallback).
   * Parses the JSON string and returns the resulting value.
   * Returns null if the key does not exist or if the stored JSON is invalid.
   * @param {string} key
   * @returns {Array|null}
   */
  function get(key) {
    try {
      let raw;
      if (_useLocalStorage) {
        raw = localStorage.getItem(key);
      } else {
        raw = Object.prototype.hasOwnProperty.call(_memoryStore, key)
          ? _memoryStore[key]
          : null;
      }

      if (raw === null || raw === undefined) return null;

      const parsed = JSON.parse(raw);
      return parsed;
    } catch (e) {
      // JSON parse error or unexpected storage error → treat as missing
      return null;
    }
  }

  // ── set ───────────────────────────────────────────────────────────────────
  /**
   * Serializes `data` to JSON and writes it under `key`.
   * Returns true on success, false on failure.
   * On failure (QuotaExceededError, SecurityError, etc.) displays an error
   * message in #storage-banner without throwing.
   * @param {string} key
   * @param {Array} data
   * @returns {boolean}
   */
  function set(key, data) {
    try {
      const json = JSON.stringify(data);

      if (_useLocalStorage) {
        localStorage.setItem(key, json);
      } else {
        // In-memory fallback: keep data alive for current session
        _memoryStore[key] = json;
      }

      return true;
    } catch (e) {
      // Determine a user-friendly message based on the error type
      let message;
      if (e && e.name === 'QuotaExceededError') {
        message = 'Penyimpanan penuh. Data tidak dapat disimpan. Coba hapus beberapa item.';
      } else if (e && e.name === 'SecurityError') {
        message = 'Akses ke penyimpanan ditolak oleh browser. Periksa pengaturan privasi Anda.';
      } else {
        message = 'Gagal menyimpan data: ' + (e && e.message ? e.message : 'Kesalahan tidak diketahui.');
      }
      _showBanner(message);
      return false;
    }
  }

  // ── Module initialisation ─────────────────────────────────────────────────
  // Run the availability check once so every subsequent get/set call knows
  // which storage backend to use.
  (function _init() {
    _useLocalStorage = isAvailable();
    if (!_useLocalStorage) {
      _showBanner(
        'Penyimpanan lokal tidak tersedia (mode privat atau diblokir). ' +
        'Data Anda tidak akan tersimpan setelah halaman ditutup.'
      );
    }
  })();

  // ── Public API ────────────────────────────────────────────────────────────
  return { get, set, isAvailable, KEYS };
})();

/* ==========================================================================
   GreetingModule
   Displays real-time clock, date in Bahasa Indonesia, and a contextual
   greeting based on the current hour.
   Task 3.1 — core formatting functions only (init/render added in Task 3.2).
   ========================================================================== */
const GreetingModule = (() => {
  // ── Indonesian locale data ────────────────────────────────────────────────
  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const BULAN = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  // ── formatTime ────────────────────────────────────────────────────────────
  /**
   * Converts hour and minute integers to a zero-padded "HH:MM" string.
   * Returns "--:--" if either argument is not a finite integer in the
   * expected range (defensive guard against Invalid Date values).
   *
   * Requirements: 1.1, 1.9
   *
   * @param {number} hour   - 0–23
   * @param {number} minute - 0–59
   * @returns {string} e.g. "09:05" or "--:--"
   */
  function formatTime(hour, minute) {
    // Guard: both arguments must be finite numbers and integers in valid range
    if (
      typeof hour !== 'number' || !isFinite(hour) ||
      typeof minute !== 'number' || !isFinite(minute) ||
      hour < 0 || hour > 23 ||
      minute < 0 || minute > 59 ||
      !Number.isInteger(hour) || !Number.isInteger(minute)
    ) {
      return '--:--';
    }

    const hh = String(hour).padStart(2, '0');
    const mm = String(minute).padStart(2, '0');
    return hh + ':' + mm;
  }

  // ── formatDate ────────────────────────────────────────────────────────────
  /**
   * Formats a Date object as "Hari, DD Bulan YYYY" in Bahasa Indonesia.
   * Returns "Tanggal tidak tersedia" if the Date is invalid.
   *
   * Requirements: 1.2, 1.9
   *
   * @param {Date} date
   * @returns {string} e.g. "Kamis, 15 Oktober 2026" or "Tanggal tidak tersedia"
   */
  function formatDate(date) {
    // Guard: date must be a Date object and not an Invalid Date
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'Tanggal tidak tersedia';
    }

    const namaHari  = HARI[date.getDay()];
    const tanggal   = date.getDate();           // 1–31 (no padding needed by design)
    const namaBulan = BULAN[date.getMonth()];
    const tahun     = date.getFullYear();

    return namaHari + ', ' + tanggal + ' ' + namaBulan + ' ' + tahun;
  }

  // ── getGreeting ───────────────────────────────────────────────────────────
  /**
   * Maps an hour (0–23) to the appropriate Bahasa Indonesia greeting.
   *
   * | Range      | Greeting        |
   * |------------|-----------------|
   * | 05 – 11    | Selamat Pagi    |
   * | 12 – 14    | Selamat Siang   |
   * | 15 – 17    | Selamat Sore    |
   * | 00–04, 18–23 | Selamat Malam |
   *
   * Requirements: 1.3, 1.4, 1.5, 1.6
   *
   * @param {number} hour - integer 0–23
   * @returns {string}
   */
  function getGreeting(hour) {
    if (hour >= 5 && hour <= 11)  return 'Selamat Pagi';
    if (hour >= 12 && hour <= 14) return 'Selamat Siang';
    if (hour >= 15 && hour <= 17) return 'Selamat Sore';
    return 'Selamat Malam'; // covers 0–4 and 18–23
  }

  // ── render ────────────────────────────────────────────────────────────────
  /**
   * Reads the current system time, formats it, and updates the three DOM
   * elements: #greeting-time, #greeting-date, #greeting-text.
   * Handles Invalid Date gracefully — formatTime/formatDate already return
   * placeholder strings in that case, so no extra try/catch is needed here.
   *
   * Requirements: 1.7, 1.8, 1.9
   */
  function render() {
    const now     = new Date();
    const hours   = now.getHours();
    const minutes = now.getMinutes();

    // Guard against Invalid Date (e.g. system clock issues)
    const isValid = !isNaN(now.getTime());

    const timeStr    = isValid ? formatTime(hours, minutes) : '--:--';
    const dateStr    = isValid ? formatDate(now)            : 'Tanggal tidak tersedia';
    const greetStr   = isValid ? getGreeting(hours)         : 'Selamat Datang';

    const timeEl     = document.getElementById('greeting-time');
    const dateEl     = document.getElementById('greeting-date');
    const greetEl    = document.getElementById('greeting-text');

    if (timeEl)  timeEl.textContent  = timeStr;
    if (dateEl)  dateEl.textContent  = dateStr;
    if (greetEl) greetEl.textContent = greetStr;
  }

  // ── init ──────────────────────────────────────────────────────────────────
  /**
   * Initialises the GreetingModule:
   * 1. Calls render() immediately so the UI is populated in < 500 ms
   *    (satisfies Requirement 1.8).
   * 2. Schedules render() to run every 1 000 ms so the clock ticks in
   *    real-time without a full page reload (satisfies Requirement 1.7).
   *
   * Requirements: 1.7, 1.8
   */
  function init() {
    render();                        // immediate first paint
    setInterval(render, 1000);       // update every second
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return { formatTime, formatDate, getGreeting, render, init };
})();

/* ==========================================================================
   TimerModule
   Manages a Pomodoro-style 25-minute focus timer.

   State machine:
     idle    → running  : start()
     running → paused   : stop()
     paused  → running  : start()
     running → done     : tick() when remaining reaches 0
     done/paused/running → idle : reset()
     done    → (nothing): start() does nothing

   Uses absolute-time tracking to minimise drift:
     On each start(), store startTimestamp = Date.now() and remainingAtStart.
     On each tick(), compute remaining = remainingAtStart - (Date.now() - startTimestamp).

   Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.10
   ========================================================================== */
const TimerModule = (() => {
  // ── Constants ─────────────────────────────────────────────────────────────
  const INITIAL_DURATION_MS = 25 * 60 * 1000; // 25 minutes in milliseconds

  // ── State ─────────────────────────────────────────────────────────────────
  /**
   * @type {{ remaining: number, status: 'idle'|'running'|'paused'|'done' }}
   */
  const state = {
    remaining: INITIAL_DURATION_MS, // milliseconds remaining
    status: 'idle',
  };

  // ── Internal tracking variables ───────────────────────────────────────────
  let _intervalId       = null;  // setInterval handle
  let _startTimestamp   = null;  // Date.now() value recorded when start() is called
  let _remainingAtStart = null;  // state.remaining captured at the moment start() is called

  // ── start ─────────────────────────────────────────────────────────────────
  /**
   * Starts or resumes the countdown.
   *
   * - If status is 'done'  → does nothing (Requirement 2.10)
   * - If status is 'running' → does nothing (already running)
   * - Transitions: idle → running, paused → running
   *
   * Uses absolute-time tracking to minimise drift (Requirement 2.3).
   *
   * Requirements: 2.2, 2.3, 2.10
   */
  function start() {
    // Reject start when timer has finished (Req 2.10)
    if (state.status === 'done') return;
    // No-op if already running
    if (state.status === 'running') return;

    // Record absolute reference point for drift-free countdown
    _startTimestamp   = Date.now();
    _remainingAtStart = state.remaining;

    state.status = 'running';

    // Schedule tick every 200 ms for smooth, accurate updates.
    // tick() itself is responsible for deciding when to update the display.
    _intervalId = setInterval(tick, 200);

    // Update UI if the helpers are available (added in Task 5.2)
    if (typeof renderDisplay === 'function') renderDisplay();
    if (typeof updateButtons === 'function') updateButtons();
  }

  // ── stop ──────────────────────────────────────────────────────────────────
  /**
   * Pauses the countdown.
   * Freezes `remaining` at the nearest whole second (floor).
   *
   * Transitions: running → paused
   *
   * Requirements: 2.5
   */
  function stop() {
    if (state.status !== 'running') return;

    // Clear the interval first to prevent any further tick() calls
    clearInterval(_intervalId);
    _intervalId = null;

    // Snap remaining to the nearest whole second (floor, not round, so we
    // never display a value larger than what was actually elapsed).
    state.remaining = Math.floor(state.remaining / 1000) * 1000;
    state.status = 'paused';

    // Reset absolute-time anchors — they will be re-set on the next start()
    _startTimestamp   = null;
    _remainingAtStart = null;

    // Update UI if the helpers are available (added in Task 5.2)
    if (typeof renderDisplay === 'function') renderDisplay();
    if (typeof updateButtons === 'function') updateButtons();
  }

  // ── reset ─────────────────────────────────────────────────────────────────
  /**
   * Stops any running countdown and restores the timer to its initial state:
   *   remaining = 25 * 60 * 1000 ms, status = 'idle'
   *
   * Works from any status (idle, running, paused, done).
   *
   * Requirements: 2.6
   */
  function reset() {
    // Clear any active interval
    if (_intervalId !== null) {
      clearInterval(_intervalId);
      _intervalId = null;
    }

    // Reset absolute-time anchors
    _startTimestamp   = null;
    _remainingAtStart = null;

    // Restore initial state
    state.remaining = INITIAL_DURATION_MS;
    state.status    = 'idle';

    // Update UI if the helpers are available (added in Task 5.2)
    if (typeof renderDisplay === 'function') renderDisplay();
    if (typeof updateButtons === 'function') updateButtons();
  }

  // ── tick ──────────────────────────────────────────────────────────────────
  /**
   * Called by setInterval every 200 ms while the timer is running.
   * Recomputes `remaining` from the absolute-time anchor to avoid drift.
   *
   * When remaining reaches 0:
   *   - Sets status to 'done'
   *   - Clears the interval
   *   - Calls notifyDone() if it exists
   *
   * Handles invalid Date.now() gracefully: if the computed elapsed value is
   * not a finite number, renders "--:--" via renderDisplay().
   *
   * Requirements: 2.3, 2.7
   */
  function tick() {
    // Guard: only proceed when running
    if (state.status !== 'running') return;

    const now = Date.now();

    // Validate Date.now() result
    if (typeof now !== 'number' || !isFinite(now)) {
      // Invalid clock — render placeholder and bail out
      if (typeof renderDisplay === 'function') renderDisplay(true /* invalid */);
      return;
    }

    const elapsed = now - _startTimestamp;
    const newRemaining = _remainingAtStart - elapsed;

    if (newRemaining <= 0) {
      // Timer has finished
      state.remaining = 0;
      state.status    = 'done';

      clearInterval(_intervalId);
      _intervalId = null;

      // Update display first so it shows 00:00
      if (typeof renderDisplay === 'function') renderDisplay();
      if (typeof updateButtons === 'function') updateButtons();

      // Notify that the session is done (implemented in Task 5.2)
      if (typeof notifyDone === 'function') notifyDone();
    } else {
      state.remaining = newRemaining;

      // Only update DOM when the displayed second would change — avoids
      // unnecessary DOM writes on every 200 ms interval tick.
      if (typeof renderDisplay === 'function') renderDisplay();
    }
  }

  // ── getState (for testing / Task 5.2 helpers) ────────────────────────────
  /**
   * Returns a shallow copy of the current timer state.
   * Used by renderDisplay(), updateButtons(), and property tests.
   * @returns {{ remaining: number, status: string }}
   */
  function getState() {
    return { remaining: state.remaining, status: state.status };
  }

  // ── renderDisplay ─────────────────────────────────────────────────────────
  /**
   * Updates #timer-display with the current MM:SS countdown.
   *
   * @param {boolean} [invalid=false] — when true, shows "--:--" (used when
   *   Date.now() returns a non-finite value, as guarded inside tick()).
   *
   * Requirements: 2.1, 2.7
   */
  function renderDisplay(invalid) {
    const el = document.getElementById('timer-display');
    if (!el) return;

    if (invalid) {
      el.textContent = '--:--';
      return;
    }

    const totalSeconds = Math.floor(state.remaining / 1000);
    const minutes      = Math.floor(totalSeconds / 60);
    const seconds      = totalSeconds % 60;

    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    el.textContent = mm + ':' + ss;
  }

  // ── updateButtons ─────────────────────────────────────────────────────────
  /**
   * Syncs the Start / Stop button disabled states with the current status.
   *
   * - status === 'running'  → Start disabled, Stop enabled
   * - any other status      → Start enabled,  Stop disabled
   *
   * Requirements: 2.4
   */
  function updateButtons() {
    const startBtn = document.getElementById('timer-start');
    const stopBtn  = document.getElementById('timer-stop');
    if (!startBtn || !stopBtn) return;

    if (state.status === 'running') {
      startBtn.disabled = true;
      stopBtn.disabled  = false;
    } else {
      startBtn.disabled = false;
      stopBtn.disabled  = true;
    }
  }

  // ── notifyDone ────────────────────────────────────────────────────────────
  /**
   * Notifies the user that the focus session has ended.
   *
   * Strategy (Requirement 2.8 / 2.9):
   *   1. If the browser supports the Notification API AND permission has been
   *      granted → fire a system notification.
   *   2. Otherwise → show an in-page visual message inside #timer-notification
   *      that remains visible until the user closes it manually.
   *
   * Requirements: 2.7, 2.8, 2.9
   */
  function notifyDone() {
    // ── Strategy 1: Notification API ─────────────────────────────────────
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Sesi Fokus Selesai!', {
          body: 'Istirahat sejenak. Kamu sudah bekerja keras selama 25 menit!',
          icon: 'favicon.ico',
        });
        return; // system notification succeeded — no in-page fallback needed
      } catch (e) {
        // Fall through to in-page fallback if Notification constructor throws
        // (e.g. in certain sandboxed environments).
      }
    }

    // ── Strategy 2: In-page visual fallback ──────────────────────────────
    const notifEl = document.getElementById('timer-notification');
    if (!notifEl) return;

    // Build the message + close button
    notifEl.innerHTML = ''; // clear previous content if any

    const msg = document.createElement('span');
    msg.textContent = '🎉 Sesi Fokus Selesai! Saatnya istirahat.';

    const closeBtn = document.createElement('button');
    closeBtn.type        = 'button';
    closeBtn.textContent = '✕';
    closeBtn.setAttribute('aria-label', 'Tutup notifikasi');
    closeBtn.addEventListener('click', function () {
      notifEl.hidden = true;
      notifEl.innerHTML = '';
    });

    notifEl.appendChild(msg);
    notifEl.appendChild(closeBtn);
    notifEl.hidden = false;
  }

  // ── init ──────────────────────────────────────────────────────────────────
  /**
   * Initialises the TimerModule UI:
   *   1. Renders the initial 25:00 display.
   *   2. Syncs button states (Start enabled, Stop disabled).
   *   3. Attaches click event listeners to Start, Stop, and Reset buttons.
   *
   * Requirements: 2.1, 2.2, 2.5, 2.6, 2.9
   */
  function init() {
    // Initial display and button state
    renderDisplay();
    updateButtons();

    // Wire up buttons
    const startBtn = document.getElementById('timer-start');
    const stopBtn  = document.getElementById('timer-stop');
    const resetBtn = document.getElementById('timer-reset');

    if (startBtn) startBtn.addEventListener('click', start);
    if (stopBtn)  stopBtn.addEventListener('click', stop);
    if (resetBtn) resetBtn.addEventListener('click', reset);
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return { start, stop, reset, tick, getState, renderDisplay, updateButtons, notifyDone, init, INITIAL_DURATION_MS };
})();

/* ==========================================================================
   TodoModule
   Manages the To-Do List: task creation, editing, toggling, deletion,
   and persistence via StorageManager.

   Task data model:
     { id: string, text: string, completed: boolean, createdAt: number }

   IIFE pattern — compatible with file:// protocol (no ES modules).

   Requirements: 3.1 – 3.13
   ========================================================================== */
const TodoModule = (() => {
  // ── State ─────────────────────────────────────────────────────────────────
  /**
   * In-memory array of Task objects.
   * Shape: { id: string, text: string, completed: boolean, createdAt: number }
   * Populated from StorageManager on init(); persisted on every mutation.
   * @type {Array<{id: string, text: string, completed: boolean, createdAt: number}>}
   */
  let tasks = [];

  // ── generateId ────────────────────────────────────────────────────────────
  /**
   * Generates a unique string identifier for a new Task.
   *
   * Uses `crypto.randomUUID()` when available (modern browsers) for
   * cryptographically-strong UUIDs.  Falls back to a timestamp + random
   * string combination for environments that do not expose randomUUID().
   *
   * Requirements: 3.1 (each Task needs a stable unique id)
   *
   * @returns {string} A unique identifier string.
   */
  function generateId() {
    if (
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID === 'function'
    ) {
      return crypto.randomUUID();
    }
    // Fallback: timestamp + base-36 random suffix to minimise collision risk
    return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  }

  // ── validateText ──────────────────────────────────────────────────────────
  /**
   * Validates candidate task text before adding or editing a Task.
   *
   * Rules (Requirements 3.2, 3.3):
   *   1. Trim the input first.
   *   2. If the trimmed value is empty (including whitespace-only input)
   *      → return { valid: false, error: 'Teks tugas tidak boleh kosong' }
   *   3. If the trimmed value exceeds 200 characters
   *      → return { valid: false, error: 'Teks tugas maksimal 200 karakter' }
   *   4. Otherwise
   *      → return { valid: true, error: null }
   *
   * @param {string} text - Raw input from the user (may be untrimmed).
   * @returns {{ valid: boolean, error: string|null }}
   */
  function validateText(text) {
    const trimmed = (typeof text === 'string' ? text : String(text)).trim();

    if (trimmed.length === 0) {
      return { valid: false, error: 'Teks tugas tidak boleh kosong' };
    }

    if (trimmed.length > 200) {
      return { valid: false, error: 'Teks tugas maksimal 200 karakter' };
    }

    return { valid: true, error: null };
  }

  // ── showError ─────────────────────────────────────────────────────────────
  /**
   * Displays an error message in the #todo-error element and automatically
   * hides it after 3 seconds.
   *
   * Requirements: 3.2, 3.3
   *
   * @param {string} message - The error text to display.
   */
  let _errorTimer = null; // track auto-hide timeout so we can reset it

  function showError(message) {
    const errorEl = document.getElementById('todo-error');
    if (!errorEl) return;

    // Clear any pending auto-hide from a previous call
    if (_errorTimer !== null) {
      clearTimeout(_errorTimer);
      _errorTimer = null;
    }

    errorEl.textContent = message;
    errorEl.hidden = false;

    // Auto-hide after 3 seconds
    _errorTimer = setTimeout(function () {
      errorEl.hidden = true;
      errorEl.textContent = '';
      _errorTimer = null;
    }, 3000);
  }

  // ── render ────────────────────────────────────────────────────────────────
  /**
   * Rebuilds the entire task list DOM from the in-memory `tasks` array.
   * Renders an empty list (no error message) when there are no tasks.
   *
   * Normal mode — each list item contains:
   *   - A checkbox (wired to toggleTask) — completed tasks show strikethrough
   *   - A <span> for task text (class "todo-text completed" when done)
   *   - An "Edit" button that switches the item to inline-edit mode
   *   - A "Hapus" button that calls deleteTask
   *
   * Inline-edit mode (activated when editingId matches the task):
   *   - A checkbox (same toggle wiring)
   *   - An <input> pre-filled with the current task text
   *   - A "Simpan" button that calls editTask then re-renders
   *   - A "Batal" button that re-renders (restoring the original text)
   *   - No "Hapus" button while editing
   *
   * Requirements: 3.4, 3.7, 3.8, 3.12
   *
   * @param {string|null} [editingId=null] - id of the task currently in edit mode.
   */
  function render(editingId) {
    const listEl = document.getElementById('todo-list');
    if (!listEl) return;

    // Default to no item in edit mode
    if (editingId === undefined) editingId = null;

    // Clear existing DOM
    listEl.innerHTML = '';

    // Empty list — render nothing (no error message per Req 3.12)
    if (tasks.length === 0) return;

    const fragment = document.createDocumentFragment();

    tasks.forEach(function (task) {
      const li = document.createElement('li');
      li.className = 'todo-item';
      li.dataset.id = task.id;

      // ── Checkbox (toggle) ──────────────────────────────────────────────
      const checkbox = document.createElement('input');
      checkbox.type    = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.setAttribute('aria-label', 'Tandai selesai: ' + task.text);
      // Wire change event to toggleTask (Requirements 3.7, 3.8)
      checkbox.addEventListener('change', function () {
        toggleTask(task.id);
      });

      li.appendChild(checkbox);

      if (task.id === editingId) {
        // ── INLINE EDIT MODE ─────────────────────────────────────────────

        // Input pre-filled with the exact current text (Requirement 3.4)
        const inputEl = document.createElement('input');
        inputEl.type      = 'text';
        inputEl.className = 'todo-edit-input';
        inputEl.value     = task.text;
        inputEl.maxLength = 200;
        inputEl.setAttribute('aria-label', 'Edit teks tugas');

        // Save button (Requirement 3.5, 3.6)
        const saveBtn = document.createElement('button');
        saveBtn.type      = 'button';
        saveBtn.className = 'todo-save-btn';
        saveBtn.textContent = 'Simpan';
        saveBtn.setAttribute('aria-label', 'Simpan perubahan tugas');
        saveBtn.addEventListener('click', function () {
          editTask(task.id, inputEl.value);
        });

        // Allow pressing Enter inside the input to save
        inputEl.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            editTask(task.id, inputEl.value);
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            render(); // cancel — restore normal view
          }
        });

        // Cancel button (Requirement 3.6)
        const cancelBtn = document.createElement('button');
        cancelBtn.type      = 'button';
        cancelBtn.className = 'todo-cancel-btn';
        cancelBtn.textContent = 'Batal';
        cancelBtn.setAttribute('aria-label', 'Batalkan edit tugas');
        cancelBtn.addEventListener('click', function () {
          render(); // re-render in normal mode — original text is untouched
        });

        li.appendChild(inputEl);
        li.appendChild(saveBtn);
        li.appendChild(cancelBtn);

      } else {
        // ── NORMAL VIEW MODE ─────────────────────────────────────────────

        // Task text span (class "completed" adds strikethrough via CSS)
        const span = document.createElement('span');
        span.className   = 'todo-text' + (task.completed ? ' completed' : '');
        span.textContent = task.text;

        // Edit button (Requirement 3.4)
        const editBtn = document.createElement('button');
        editBtn.type      = 'button';
        editBtn.className = 'todo-edit-btn';
        editBtn.textContent = 'Edit';
        editBtn.dataset.id  = task.id;
        editBtn.setAttribute('aria-label', 'Edit tugas: ' + task.text);
        editBtn.addEventListener('click', function () {
          render(task.id); // re-render with this task in edit mode
        });

        // Delete button (Requirement 3.9)
        const delBtn = document.createElement('button');
        delBtn.type      = 'button';
        delBtn.className = 'todo-delete-btn';
        delBtn.textContent = 'Hapus';
        delBtn.dataset.id  = task.id;
        delBtn.setAttribute('aria-label', 'Hapus tugas: ' + task.text);
        delBtn.addEventListener('click', function () {
          deleteTask(task.id);
        });

        li.appendChild(span);
        li.appendChild(editBtn);
        li.appendChild(delBtn);
      }

      fragment.appendChild(li);
    });

    listEl.appendChild(fragment);
  }

  // ── addTask ───────────────────────────────────────────────────────────────
  /**
   * Validates the input text, creates a new Task, pushes it to the array,
   * persists via StorageManager, and re-renders the list.
   *
   * On validation failure, calls showError() with the relevant message.
   *
   * Requirements: 3.1, 3.2, 3.3, 3.10
   *
   * @param {string} text - Raw input from the user.
   */
  function addTask(text) {
    const result = validateText(text);

    if (!result.valid) {
      showError(result.error);
      return;
    }

    /** @type {{ id: string, text: string, completed: boolean, createdAt: number }} */
    const newTask = {
      id:        generateId(),
      text:      text.trim(),
      completed: false,
      createdAt: Date.now(),
    };

    tasks.push(newTask);
    StorageManager.set(StorageManager.KEYS.TASKS, tasks);
    render();
  }

  // ── deleteTask ────────────────────────────────────────────────────────────
  /**
   * Removes the Task with the given id from the array, persists the updated
   * list, and re-renders.
   *
   * Requirements: 3.9, 3.10
   *
   * @param {string} id - The id of the Task to delete.
   */
  function deleteTask(id) {
    tasks = tasks.filter(function (task) {
      return task.id !== id;
    });
    StorageManager.set(StorageManager.KEYS.TASKS, tasks);
    render();
  }

  // ── editTask ──────────────────────────────────────────────────────────────
  /**
   * Updates the text of an existing Task after validating the new text.
   *
   * Behaviour:
   *   - Whitespace-only input → cancel (don't change text), re-render normal view.
   *     This matches Requirement 3.6: "batalkan perubahan dan kembalikan teks Task
   *     ke nilai sebelum mode edit diaktifkan."
   *   - Too-long input (> 200 chars after trim) → show error, stay in edit mode
   *     by re-rendering with the task still in edit mode.
   *   - Valid input → update task.text = newText.trim() (keep id and createdAt
   *     unchanged), save via StorageManager, render normal view.
   *
   * Requirements: 3.5, 3.6
   *
   * @param {string} id      - id of the Task to edit.
   * @param {string} newText - Raw text from the inline edit input.
   */
  function editTask(id, newText) {
    const result = validateText(newText);

    if (!result.valid) {
      if ((typeof newText === 'string' ? newText : String(newText)).trim().length === 0) {
        // Whitespace-only — cancel: restore normal view without changing data
        render();
      } else {
        // Too long — show error and keep the edit input open
        showError(result.error);
        render(id);
      }
      return;
    }

    // Valid — find and update the task
    const task = tasks.find(function (t) { return t.id === id; });
    if (!task) {
      // Task not found (should not happen in normal usage) — just re-render
      render();
      return;
    }

    // Update text only; preserve id and createdAt (Requirement 3.5)
    task.text = newText.trim();

    StorageManager.set(StorageManager.KEYS.TASKS, tasks);
    render(); // render in normal view after successful edit
  }

  // ── toggleTask ────────────────────────────────────────────────────────────
  /**
   * Flips the `completed` status of the Task with the given id.
   *
   * - false → true  (Requirement 3.7): marks as done, CSS class "completed"
   *   adds strikethrough via text-decoration: line-through.
   * - true  → false (Requirement 3.8): unmarks as done, removes strikethrough.
   *
   * After flipping: persists via StorageManager and re-renders.
   *
   * Requirements: 3.7, 3.8, 3.10
   *
   * @param {string} id - id of the Task to toggle.
   */
  function toggleTask(id) {
    const task = tasks.find(function (t) { return t.id === id; });
    if (!task) return;

    task.completed = !task.completed;

    StorageManager.set(StorageManager.KEYS.TASKS, tasks);
    render();
  }

  // ── init ──────────────────────────────────────────────────────────────────
  /**
   * Initialises the TodoModule:
   *   1. Loads persisted tasks from StorageManager.
   *      - If the stored value is a non-null Array → use it as the tasks list.
   *      - Otherwise (null, corrupt JSON, wrong type) → start with an empty array.
   *        This handles private-mode fallback and corrupted storage gracefully,
   *        showing an empty list with no error message (Requirement 3.13).
   *   2. Wires the "Tambah" button click and the Enter-key shortcut on the
   *      input field to addTask() (Requirement 3.11).
   *   3. Calls render() so the initial state is visible immediately.
   *
   * Requirements: 3.11, 3.13
   */
  function init() {
    // ── 1. Load persisted tasks ──────────────────────────────────────────
    const stored = StorageManager.get(StorageManager.KEYS.TASKS);

    // Validate: only accept a real, non-null Array; anything else → empty list
    if (stored !== null && Array.isArray(stored)) {
      tasks = stored;
    } else {
      tasks = [];
    }

    // ── 2. Wire event listeners ──────────────────────────────────────────
    const inputEl  = document.getElementById('todo-input');
    const addBtn   = document.getElementById('todo-add-btn');

    if (addBtn) {
      addBtn.addEventListener('click', function () {
        if (inputEl) {
          addTask(inputEl.value);
          inputEl.value = '';
        }
      });
    }

    if (inputEl) {
      inputEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          addTask(inputEl.value);
          inputEl.value = '';
        }
      });
    }

    // ── 3. Initial render ────────────────────────────────────────────────
    render();
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return { validateText, generateId, addTask, deleteTask, editTask, toggleTask, render, showError, init };
})();

/* ==========================================================================
   QuickLinksModule
   Manages Quick Links: adding, deleting, and rendering bookmarked URLs.

   QuickLink data model:
     { id: string, label: string, url: string, createdAt: number }

   IIFE pattern — compatible with file:// protocol (no ES modules).

   Requirements: 4.1 – 4.9
   ========================================================================== */
const QuickLinksModule = (() => {
  // ── State ─────────────────────────────────────────────────────────────────
  /**
   * In-memory array of QuickLink objects.
   * Shape: { id: string, label: string, url: string, createdAt: number }
   * Populated from StorageManager on init(); persisted on every mutation.
   * @type {Array<{id: string, label: string, url: string, createdAt: number}>}
   */
  let links = [];

  // ── generateId ────────────────────────────────────────────────────────────
  /**
   * Generates a unique string identifier for a new QuickLink.
   *
   * Uses `crypto.randomUUID()` when available (modern browsers) for
   * cryptographically-strong UUIDs. Falls back to a timestamp + random
   * string combination for environments that do not expose randomUUID().
   *
   * @returns {string} A unique identifier string.
   */
  function generateId() {
    if (
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID === 'function'
    ) {
      return crypto.randomUUID();
    }
    // Fallback: timestamp + base-36 random suffix to minimise collision risk
    return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  }

  // ── validateLabel ─────────────────────────────────────────────────────────
  /**
   * Validates the label for a QuickLink before adding.
   *
   * Rules (Requirement 4.2):
   *   1. Trim the input first.
   *   2. If the trimmed value is empty (including whitespace-only input)
   *      → return { valid: false, error: 'Label tautan tidak boleh kosong' }
   *   3. If the trimmed length exceeds 50 characters
   *      → return { valid: false, error: 'Label tautan maksimal 50 karakter' }
   *   4. Otherwise
   *      → return { valid: true, error: null }
   *
   * @param {string} label - Raw input from the user (may be untrimmed).
   * @returns {{ valid: boolean, error: string|null }}
   */
  function validateLabel(label) {
    const trimmed = (typeof label === 'string' ? label : String(label)).trim();

    if (trimmed.length === 0) {
      return { valid: false, error: 'Label tautan tidak boleh kosong' };
    }

    if (trimmed.length > 50) {
      return { valid: false, error: 'Label tautan maksimal 50 karakter' };
    }

    return { valid: true, error: null };
  }

  // ── validateUrl ───────────────────────────────────────────────────────────
  /**
   * Validates the URL for a QuickLink before adding.
   *
   * Rules (Requirement 4.3):
   *   1. If the url length exceeds 2048 characters
   *      → return { valid: false, error: 'URL terlalu panjang (maksimal 2048 karakter)' }
   *   2. If the url does not start with 'http://' or 'https://' (case-sensitive)
   *      → return { valid: false, error: 'URL harus dimulai dengan http:// atau https://' }
   *   3. Otherwise
   *      → return { valid: true, error: null }
   *
   * Note: length is checked before the prefix check so that an overly long URL
   * with a valid prefix surfaces the more actionable "too long" error first.
   *
   * @param {string} url - Raw URL input from the user.
   * @returns {{ valid: boolean, error: string|null }}
   */
  function validateUrl(url) {
    const str = typeof url === 'string' ? url : String(url);

    if (str.length > 2048) {
      return { valid: false, error: 'URL terlalu panjang (maksimal 2048 karakter)' };
    }

    if (!str.startsWith('http://') && !str.startsWith('https://')) {
      return { valid: false, error: 'URL harus dimulai dengan http:// atau https://' };
    }

    return { valid: true, error: null };
  }

  // ── showError ─────────────────────────────────────────────────────────────
  /**
   * Displays an error message in #link-error and optionally highlights the
   * label and/or URL input fields with the `input-error` CSS class.
   * The error is auto-hidden after 3 seconds.
   *
   * Requirements: 4.2, 4.3
   *
   * @param {string}  message    - Error text to display.
   * @param {boolean} [labelErr] - If true, add `input-error` to #link-label-input.
   * @param {boolean} [urlErr]   - If true, add `input-error` to #link-url-input.
   */
  let _errorTimer = null; // track auto-hide timeout so we can reset it

  function showError(message, labelErr, urlErr) {
    const errorEl    = document.getElementById('link-error');
    const labelInput = document.getElementById('link-label-input');
    const urlInput   = document.getElementById('link-url-input');

    // Clear any pending auto-hide from a previous call
    if (_errorTimer !== null) {
      clearTimeout(_errorTimer);
      _errorTimer = null;
    }

    // Clear previous field highlights before applying new ones
    if (labelInput) labelInput.classList.remove('input-error');
    if (urlInput)   urlInput.classList.remove('input-error');

    // Highlight failing fields
    if (labelErr && labelInput) labelInput.classList.add('input-error');
    if (urlErr   && urlInput)   urlInput.classList.add('input-error');

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    }

    // Auto-hide after 3 seconds and remove field highlights
    _errorTimer = setTimeout(function () {
      if (errorEl) {
        errorEl.hidden = true;
        errorEl.textContent = '';
      }
      if (labelInput) labelInput.classList.remove('input-error');
      if (urlInput)   urlInput.classList.remove('input-error');
      _errorTimer = null;
    }, 3000);
  }

  // ── updateAddButtonState ──────────────────────────────────────────────────
  /**
   * Syncs the Add button's disabled state and the limit-message visibility
   * with the current number of links.
   *
   * - links.length >= 20 → disable #link-add-btn, show #link-limit-msg
   * - links.length < 20  → enable  #link-add-btn, hide #link-limit-msg
   *
   * Requirements: 4.9
   */
  function updateAddButtonState() {
    const addBtn   = document.getElementById('link-add-btn');
    const limitMsg = document.getElementById('link-limit-msg');

    if (links.length >= 20) {
      if (addBtn)   addBtn.disabled = true;
      if (limitMsg) limitMsg.hidden = false;
    } else {
      if (addBtn)   addBtn.disabled = false;
      if (limitMsg) limitMsg.hidden = true;
    }
  }

  // ── render ────────────────────────────────────────────────────────────────
  /**
   * Rebuilds the entire links list DOM from the in-memory `links` array.
   * Renders an empty list (no error message) when there are no links.
   *
   * Each list item contains:
   *   - An <a href="url" target="_blank" rel="noopener noreferrer"> with the label
   *     (opens in a new tab, Requirement 4.4)
   *   - A delete button wired to deleteLink()
   *
   * Requirements: 4.4, 4.5, 4.8
   */
  function render() {
    const listEl = document.getElementById('links-list');
    if (!listEl) return;

    // Clear existing DOM
    listEl.innerHTML = '';

    // Empty list — render nothing (no error message per Req 4.8)
    if (links.length === 0) return;

    const fragment = document.createDocumentFragment();

    links.forEach(function (link) {
      const li = document.createElement('li');
      li.className  = 'quicklink-item';
      li.dataset.id = link.id;

      // Anchor — opens in a new tab (Requirement 4.4)
      const anchor = document.createElement('a');
      anchor.href             = link.url;
      anchor.target           = '_blank';
      anchor.rel              = 'noopener noreferrer';
      anchor.textContent      = link.label;
      anchor.className        = 'quicklink-anchor';
      anchor.setAttribute('aria-label', 'Buka tautan: ' + link.label);

      // Delete button (Requirement 4.5)
      const delBtn = document.createElement('button');
      delBtn.type        = 'button';
      delBtn.className   = 'quicklink-delete-btn';
      delBtn.textContent = 'Hapus';
      delBtn.dataset.id  = link.id;
      delBtn.setAttribute('aria-label', 'Hapus tautan: ' + link.label);
      delBtn.addEventListener('click', function () {
        deleteLink(link.id);
      });

      li.appendChild(anchor);
      li.appendChild(delBtn);
      fragment.appendChild(li);
    });

    listEl.appendChild(fragment);
  }

  // ── addLink ───────────────────────────────────────────────────────────────
  /**
   * Validates label and url, creates a new QuickLink, pushes it to the array,
   * persists via StorageManager, re-renders the list, and updates the button state.
   *
   * - If count >= 20: do nothing (button should already be disabled).
   * - If label or url fail validation: call showError() with the relevant
   *   message and highlight the failing field(s).
   * - On success: create { id, label: label.trim(), url, createdAt }, push,
   *   save, render, updateAddButtonState.
   *
   * Requirements: 4.1, 4.2, 4.3, 4.6, 4.9
   *
   * @param {string} label - Raw label input from the user.
   * @param {string} url   - Raw URL input from the user.
   */
  function addLink(label, url) {
    // Guard: already at the limit
    if (links.length >= 20) return;

    const labelResult = validateLabel(label);
    const urlResult   = validateUrl(url);

    if (!labelResult.valid || !urlResult.valid) {
      // Determine the most relevant error message to display
      const message = !labelResult.valid ? labelResult.error : urlResult.error;
      showError(message, !labelResult.valid, !urlResult.valid);
      return;
    }

    /** @type {{ id: string, label: string, url: string, createdAt: number }} */
    const newLink = {
      id:        generateId(),
      label:     label.trim(),
      url:       url,
      createdAt: Date.now(),
    };

    links.push(newLink);
    StorageManager.set(StorageManager.KEYS.LINKS, links);
    render();
    updateAddButtonState();
  }

  // ── deleteLink ────────────────────────────────────────────────────────────
  /**
   * Removes the QuickLink with the given id from the array, persists the
   * updated list, re-renders, and updates the button state.
   *
   * Requirements: 4.5, 4.6
   *
   * @param {string} id - The id of the QuickLink to delete.
   */
  function deleteLink(id) {
    links = links.filter(function (link) {
      return link.id !== id;
    });
    StorageManager.set(StorageManager.KEYS.LINKS, links);
    render();
    updateAddButtonState();
  }

  // ── init ──────────────────────────────────────────────────────────────────
  /**
   * Initialises the QuickLinksModule:
   *   1. Loads persisted links from StorageManager.
   *      - If the stored value is a non-null Array → use it as the links list.
   *      - Otherwise (null, corrupt JSON, wrong type) → start with an empty array.
   *        This handles private-mode fallback and corrupted storage gracefully,
   *        showing an empty list with no error message (Requirement 4.8).
   *   2. Wires the "Tambah" button click event on #link-add-btn to addLink()
   *      using the values from #link-label-input and #link-url-input.
   *      Both inputs are cleared after the call regardless of outcome — the
   *      next interaction starts fresh, and any validation error is shown via
   *      showError() by addLink() itself.
   *   3. Calls render() so the initial state is visible immediately.
   *   4. Calls updateAddButtonState() to reflect the loaded count.
   *
   * StorageManager.set() is called synchronously inside addLink() and
   * deleteLink(), so all mutations are persisted in well under 500 ms
   * (satisfies Requirement 4.6 / 4.7).
   *
   * Requirements: 4.7
   */
  function init() {
    // ── 1. Load persisted links ──────────────────────────────────────────
    const stored = StorageManager.get(StorageManager.KEYS.LINKS);

    // Validate: only accept a real, non-null Array; anything else → empty list
    if (stored !== null && Array.isArray(stored)) {
      links = stored;
    } else {
      links = [];
    }

    // ── 2. Wire event listeners ──────────────────────────────────────────
    const labelEl  = document.getElementById('link-label-input');
    const urlEl    = document.getElementById('link-url-input');
    const addBtn   = document.getElementById('link-add-btn');

    if (addBtn) {
      addBtn.addEventListener('click', function () {
        const labelVal = labelEl ? labelEl.value : '';
        const urlVal   = urlEl   ? urlEl.value   : '';
        addLink(labelVal, urlVal);
        // Clear both inputs after the attempt so the form is fresh for the
        // next entry. addLink() handles showing validation errors internally.
        if (labelEl) labelEl.value = '';
        if (urlEl)   urlEl.value   = '';
      });
    }

    // ── 3. Initial render ────────────────────────────────────────────────
    render();

    // ── 4. Sync button state with loaded count ───────────────────────────
    updateAddButtonState();
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    validateLabel,
    validateUrl,
    generateId,
    addLink,
    deleteLink,
    render,
    updateAddButtonState,
    showError,
    init,
  };
})();

/* ==========================================================================
   Main Orchestrator
   Wires all modules together. Called once on DOMContentLoaded.

   Requirements: 5.2, 5.3, 6.2, 6.4
   ========================================================================== */

/**
 * Main init function — orchestrates all modules in the correct order.
 *
 * 1. StorageManager is already self-initialised (runs its availability check
 *    as part of its own IIFE). We just double-check here so the banner is
 *    always visible if something went wrong.
 * 2. Initialise GreetingModule, TimerModule, TodoModule, QuickLinksModule in
 *    order. Each module's init() assumes the DOM is ready (we are already
 *    inside the DOMContentLoaded callback).
 *
 * No ES Module imports / requires — plain function, IIFE-compatible,
 * works over file:// without a web server.
 *
 * Requirements: 5.2, 5.3, 6.2, 6.4
 */
function init() {
  // ── 1. Storage availability check ───────────────────────────────────────
  // StorageManager already called isAvailable() and showed the banner when
  // its IIFE ran. We repeat the check here as a safety net in case the banner
  // was missed (e.g. DOM not yet ready when the IIFE fired).
  if (!StorageManager.isAvailable()) {
    const banner = document.getElementById('storage-banner');
    if (banner && banner.hidden) {
      banner.textContent =
        'Penyimpanan lokal tidak tersedia (mode privat atau diblokir). ' +
        'Data Anda tidak akan tersimpan setelah halaman ditutup.';
      banner.hidden = false;
    }
  }

  // ── 2. Initialise modules in order ──────────────────────────────────────
  GreetingModule.init();
  TimerModule.init();
  TodoModule.init();
  QuickLinksModule.init();
}

// ── Wire DOMContentLoaded ──────────────────────────────────────────────────
// Calling init() from inside DOMContentLoaded guarantees all DOM elements
// referenced by the modules already exist before any module code runs.
document.addEventListener('DOMContentLoaded', init);

// === Light / Dark Mode ===
const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener("click", () => {
  const body = document.body;
  const currentTheme = body.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";
  body.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme); // simpan preferensi
});

// Load theme dari localStorage saat halaman dibuka
document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.body.setAttribute("data-theme", savedTheme);
  }
});

// === Custom Name Greeting ===
const nameInput = document.getElementById("name-input");
const nameSaveBtn = document.getElementById("name-save-btn");
const greetingText = document.getElementById("greeting-text");

nameSaveBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  if (name) {
    localStorage.setItem("username", name);
    greetingText.textContent = `Halo, ${name}!`;
  }
});

// Load nama dari localStorage
document.addEventListener("DOMContentLoaded", () => {
  const savedName = localStorage.getItem("username");
  if (savedName) {
    greetingText.textContent = `Halo, ${savedName}!`;
  }
});

// === Custom Pomodoro Time ===
const pomodoroInput = document.getElementById("pomodoro-time");
const pomodoroSaveBtn = document.getElementById("pomodoro-save-btn");
const timerDisplay = document.getElementById("timer-display");

let pomodoroMinutes = 25; // default

pomodoroSaveBtn.addEventListener("click", () => {
  const minutes = parseInt(pomodoroInput.value, 10);
  if (!isNaN(minutes) && minutes > 0) {
    pomodoroMinutes = minutes;
    localStorage.setItem("pomodoroMinutes", pomodoroMinutes);
    timerDisplay.textContent = `${String(pomodoroMinutes).padStart(2, "0")}:00`;
  }
});

// Load durasi dari localStorage
document.addEventListener("DOMContentLoaded", () => {
  const savedMinutes = localStorage.getItem("pomodoroMinutes");
  if (savedMinutes) {
    pomodoroMinutes = parseInt(savedMinutes, 10);
    timerDisplay.textContent = `${String(pomodoroMinutes).padStart(2, "0")}:00`;
    pomodoroInput.value = pomodoroMinutes;
  }
});

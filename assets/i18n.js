/* TCEA Freedom Days Breakouts — i18n engine.
   ---------------------------------------------------------------------------
   Modeled on the DrawSplat WidgetI18n engine (assets/js/widget-i18n.js):
   a shared language switcher for self-contained educational pages.

   Seven languages, a shared preference (localStorage `tcea.breakouts.lang`),
   ?lang= share links, an auto-built <select> picker, RTL for Arabic and Urdu,
   and a `breakout-i18n:changed` event so pages that render dynamic UI (clue
   boards, lock cards) can re-render on language change.

   NOTE ON TRANSLATIONS: non-English text is AI-seeded and pending
   native-speaker review. See each page's footer disclaimer.

   ADOPT IN A PAGE
   ---------------------------------------------------------------------------
   1) Load before the page's main script:
        <script src="../assets/i18n.js" defer></script>   (band pages)
        <script src="assets/i18n.js" defer></script>      (top-level pages)

   2) Mark static chrome with data-i18n helpers:
        <h1 data-i18n="header.h1">The Day After the Fireworks</h1>
        <button data-i18n="ui.check">Check</button>
        <div data-i18n-picker></div>            <!-- the language <select> -->
      Helpers: data-i18n (textContent), data-i18n-html (innerHTML),
      data-i18n-placeholder, data-i18n-title, data-i18n-aria-label, data-i18n-alt.

   3) Register a flat dictionary (chrome + UI strings):
        BreakoutI18n.register('july5', { en:{...}, es:{...}, vi:{...},
          ar:{...}, hi:{...}, ur:{...}, zh:{...} });

   4) For dynamic content (clues/locks) held as structured per-locale data,
      read BreakoutI18n.getLang() and re-render on change:
        window.addEventListener('breakout-i18n:changed', render);

   RESOLUTION ORDER: ?lang= -> localStorage -> navigator.language -> English.
*/
(function () {
  'use strict';

  const STORAGE_KEY = 'tcea.breakouts.lang';

  const LANGS = [
    { code: 'en', label: 'English',    dir: 'ltr', htmlLang: 'en' },
    { code: 'es', label: 'Español',    dir: 'ltr', htmlLang: 'es' },
    { code: 'vi', label: 'Tiếng Việt', dir: 'ltr', htmlLang: 'vi' },
    { code: 'ar', label: 'العربية',     dir: 'rtl', htmlLang: 'ar' },
    { code: 'hi', label: 'हिन्दी',       dir: 'ltr', htmlLang: 'hi' },
    { code: 'ur', label: 'اردو',        dir: 'rtl', htmlLang: 'ur' },
    { code: 'zh', label: '中文',        dir: 'ltr', htmlLang: 'zh' },
  ];

  const state = { lang: 'en', dictionaries: {}, activeWidget: null, initialized: false };

  function normalizeLang(raw) {
    if (!raw) return '';
    const lower = String(raw).toLowerCase();
    if (lower.startsWith('es')) return 'es';
    if (lower.startsWith('vi')) return 'vi';
    if (lower.startsWith('ar')) return 'ar';
    if (lower.startsWith('ur')) return 'ur';
    if (lower.startsWith('hi')) return 'hi';
    if (lower.startsWith('zh')) return 'zh';
    if (lower.startsWith('en')) return 'en';
    return '';
  }

  function safeGet() { try { return localStorage.getItem(STORAGE_KEY); } catch (_) { return null; } }
  function safeSet(v) { try { localStorage.setItem(STORAGE_KEY, v); } catch (_) {} }

  function detectLang() {
    const params = new URLSearchParams(location.search || '');
    const candidates = [params.get('lang'), safeGet(), navigator.language, ...(navigator.languages || [])];
    for (const c of candidates) { const n = normalizeLang(c); if (n) return n; }
    return 'en';
  }

  function currentDict() {
    const w = state.dictionaries[state.activeWidget] || {};
    return w[state.lang] || w.en || {};
  }
  function lookup(key) {
    const d = currentDict();
    if (d[key] !== undefined) return d[key];
    const en = (state.dictionaries[state.activeWidget] || {}).en || {};
    return en[key];
  }
  function interpolate(str, vars) {
    if (!vars || typeof str !== 'string') return str;
    return str.replace(/\{([^}]+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
  }

  function apply() {
    const cfg = LANGS.find(l => l.code === state.lang) || LANGS[0];
    document.documentElement.lang = cfg.htmlLang || cfg.code;
    document.documentElement.dir = cfg.dir;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const v = lookup(el.getAttribute('data-i18n')); if (v !== undefined) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const v = lookup(el.getAttribute('data-i18n-html')); if (v !== undefined) el.innerHTML = v;
    });
    ['placeholder', 'title', 'aria-label', 'alt'].forEach(attr => {
      document.querySelectorAll(`[data-i18n-${attr}]`).forEach(el => {
        const v = lookup(el.getAttribute(`data-i18n-${attr}`)); if (v !== undefined) el.setAttribute(attr, v);
      });
    });
    document.querySelectorAll('select#i18nSwitcher, select.breakout-i18n-switcher').forEach(sel => {
      if (sel.value !== state.lang) sel.value = state.lang;
    });
  }

  function buildPickerInto(sel) {
    sel.innerHTML = '';
    LANGS.forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.code; opt.textContent = l.label;
      if (l.code === state.lang) opt.selected = true;
      sel.appendChild(opt);
    });
    if (!sel.dataset.i18nWired) {
      sel.addEventListener('change', () => BreakoutI18n.setLang(sel.value));
      sel.dataset.i18nWired = '1';
    }
    if (!sel.getAttribute('aria-label')) {
      sel.setAttribute('aria-label', 'Language / Idioma / Ngôn ngữ / اللغة / भाषा / زبان / 语言');
    }
  }
  function ensurePickers() {
    const existing = document.getElementById('i18nSwitcher');
    if (existing && existing.tagName === 'SELECT') buildPickerInto(existing);
    document.querySelectorAll('[data-i18n-picker]').forEach(host => {
      let sel = host.querySelector('select');
      if (!sel) {
        sel = document.createElement('select');
        sel.className = 'breakout-i18n-switcher';
        if (!host.id && !document.getElementById('i18nSwitcher')) sel.id = 'i18nSwitcher';
        host.appendChild(sel);
      }
      buildPickerInto(sel);
    });
  }

  const BreakoutI18n = {
    register(widgetKey, dictionaries) {
      state.dictionaries[widgetKey] = dictionaries || {};
      state.activeWidget = widgetKey;
      if (!state.initialized && state.lang === 'en') state.lang = detectLang();
      if (state.initialized) { ensurePickers(); apply(); return; }
      const start = () => init();
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
      else start();
    },
    t(key, vars) { const v = lookup(key); return interpolate(v === undefined ? key : v, vars); },
    setLang(code) {
      const n = normalizeLang(code) || 'en';
      if (n === state.lang) return;
      state.lang = n; safeSet(n); apply();
      try { window.dispatchEvent(new CustomEvent('breakout-i18n:changed', { detail: { lang: n } })); } catch (_) {}
    },
    getLang() { return state.lang; },
    dirFor(code) { const c = LANGS.find(l => l.code === (normalizeLang(code) || code)); return c ? c.dir : 'ltr'; },
    LANGS: LANGS.slice(),
    refresh() { if (state.initialized) { ensurePickers(); apply(); } },
  };

  function init() {
    if (state.initialized) return;
    state.initialized = true;
    state.lang = detectLang();
    ensurePickers();
    apply();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { if (state.activeWidget) init(); });
  }
  window.BreakoutI18n = BreakoutI18n;
})();

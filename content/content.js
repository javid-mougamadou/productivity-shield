/**
 * Content script — sticky classification navbar + pause countdown banner
 * Injected on every page; asks the background whether this domain needs the
 * whitelist/blacklist/ignore navbar (only on 'neutral_unconfirmed' pages
 * during an active slot in the 'normal' profile — decision made entirely by
 * background/navigation.js, this script only renders the response) and
 * whether a pause is currently active (shown as a countdown banner, since
 * the pause bypasses blacklist blocking globally, not per-page).
 */

(function () {
  'use strict';

  if (location.href.includes('pages/blocked.html')) return;
  if (!/^https?:/.test(location.href)) return;

  function msg(type, data = {}) {
    if (!chrome.runtime?.id) return Promise.resolve(null);
    return chrome.runtime.sendMessage({ type, ...data }).catch(() => null);
  }

  function escHtml(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ---- Classification navbar (whitelist / blacklist / ignore) -------------

  let bar = null;

  function repositionClassificationBar() {
    if (!bar) return;
    bar.style.top = (pauseState.bar ? pauseState.bar.offsetHeight : 0) + 'px';
  }

  function removeBar() {
    if (bar) {
      bar.remove();
      bar = null;
    }
  }

  function showNavbar(domain) {
    if (document.getElementById('__ps-navbar')) return;

    bar = document.createElement('div');
    bar.id = '__ps-navbar';
    bar.style.cssText = [
      'position:fixed', 'left:0', 'right:0', 'z-index:2147483647',
      'display:flex', 'align-items:center', 'justify-content:space-between',
      'gap:12px', 'padding:8px 16px',
      'background:#111827', 'color:#f9fafb',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif',
      'font-size:13px', 'box-shadow:0 2px 8px rgba(0,0,0,.25)',
    ].join(';');

    bar.innerHTML = `
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
        <strong>productivity_shield</strong> — classer <strong>${escHtml(domain)}</strong> ?
      </span>
      <span style="display:flex;gap:8px;flex-shrink:0;">
        <button id="__ps-whitelist" style="background:#059669;color:#fff;border:none;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px;font-weight:600;">Whitelist</button>
        <button id="__ps-blacklist" style="background:#dc2626;color:#fff;border:none;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px;font-weight:600;">Blacklist</button>
        <button id="__ps-ignore" style="background:#4b5563;color:#fff;border:none;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px;font-weight:600;">Ignorer</button>
      </span>`;

    document.documentElement.appendChild(bar);
    repositionClassificationBar();

    bar.querySelector('#__ps-whitelist').addEventListener('click', async () => {
      await msg('WHITELIST_ADD', { domain });
      removeBar();
    });

    bar.querySelector('#__ps-blacklist').addEventListener('click', async () => {
      await msg('BLACKLIST_ADD', { domain });
      // Reload lets webNavigation.onBeforeNavigate intercept and redirect
      // to the blocked page — reuses the existing blocking path.
      window.location.reload();
    });

    bar.querySelector('#__ps-ignore').addEventListener('click', async () => {
      await msg('NEUTRAL_CONFIRM', { domain });
      removeBar();
    });
  }

  // ---- Pause countdown banner -----------------------------------------------
  // Shown whenever a pause is active, on every page (the pause bypasses
  // blacklist blocking globally, not just on the page that triggered it).

  const pauseState = { bar: null, intervalId: null, remainingMs: 0, hiddenThisPage: false };

  function formatCountdown(ms) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function renderPauseCountdown() {
    const el = pauseState.bar?.querySelector('#__ps-pause-countdown');
    if (el) el.textContent = formatCountdown(pauseState.remainingMs);
  }

  function stopPauseBar() {
    if (pauseState.intervalId) {
      clearInterval(pauseState.intervalId);
      pauseState.intervalId = null;
    }
    if (pauseState.bar) {
      pauseState.bar.remove();
      pauseState.bar = null;
    }
    repositionClassificationBar();
  }

  function startPauseBar(remainingMs) {
    pauseState.remainingMs = remainingMs;
    if (pauseState.hiddenThisPage) return;

    if (!pauseState.bar) {
      pauseState.bar = document.createElement('div');
      pauseState.bar.id = '__ps-pause-bar';
      pauseState.bar.style.cssText = [
        'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:2147483647',
        'display:flex', 'align-items:center', 'justify-content:space-between',
        'gap:12px', 'padding:8px 16px',
        'background:#059669', 'color:#ffffff',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif',
        'font-size:13px', 'box-shadow:0 2px 8px rgba(0,0,0,.25)',
      ].join(';');

      pauseState.bar.innerHTML = `
        <span>⏸ <strong>Pause active</strong> — <span id="__ps-pause-countdown"></span> restantes</span>
        <button id="__ps-pause-hide" style="background:rgba(255,255,255,.2);color:#fff;border:none;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;font-weight:600;">Masquer</button>`;

      document.documentElement.appendChild(pauseState.bar);
      repositionClassificationBar();

      pauseState.bar.querySelector('#__ps-pause-hide').addEventListener('click', () => {
        pauseState.hiddenThisPage = true;
        stopPauseBar();
      });

      pauseState.intervalId = setInterval(() => {
        pauseState.remainingMs -= 1000;
        if (pauseState.remainingMs <= 0) {
          stopPauseBar();
          return;
        }
        renderPauseCountdown();
      }, 1000);
    }

    renderPauseCountdown();
  }

  // ---- Init -----------------------------------------------------------------

  async function syncPauseStatus(status) {
    if (status.profile === 'normal' && status.pauseActive) {
      startPauseBar(status.pauseRemainingMs);
    } else {
      // Pause ended (or profile changed) — re-arm the hide button for next time.
      pauseState.hiddenThisPage = false;
      stopPauseBar();
    }
  }

  async function init() {
    const statusRes = await msg('GET_STATUS');
    if (!statusRes) return;

    await syncPauseStatus(statusRes);

    const domainRes = await msg('GET_DOMAIN_STATUS', { url: location.href });
    if (!domainRes) return;

    const shouldShowNavbar =
      statusRes.profile === 'normal' &&
      statusRes.withinActiveSlot &&
      domainRes.status === 'neutral_unconfirmed';

    if (shouldShowNavbar) {
      const domain = new URL(location.href).hostname.replace(/^www\./, '');
      showNavbar(domain);
    }

    // Periodic resync: catches a pause started/ended from another tab, and
    // corrects any local countdown drift.
    setInterval(async () => {
      const s = await msg('GET_STATUS');
      if (s) await syncPauseStatus(s);
    }, 15000);
  }

  init();
})();

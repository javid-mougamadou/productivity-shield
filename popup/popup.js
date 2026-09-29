const $ = id => document.getElementById(id);

function msg(type, data = {}) {
  return chrome.runtime.sendMessage({ type, ...data });
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

function getDomain(url) {
  try {
    let h = new URL(url).hostname;
    if (h.startsWith('www.')) h = h.slice(4);
    return h;
  } catch { return ''; }
}

function formatRemaining(ms) {
  const totalMin = Math.ceil(ms / 60000);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

function formatTime(slotTime) {
  return slotTime;
}

let status = {};
let activeTab = null;

async function init() {
  [status, activeTab] = await Promise.all([msg('GET_STATUS'), getActiveTab()]);
  renderProfile();
  renderStatus();
  await renderSiteBanner();
}

function renderProfile() {
  document.querySelectorAll('.profile-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.profile === status.profile);
  });
}

function renderStatus() {
  if (status.profile === 'zen') {
    $('slotStatus').textContent = 'désactivé (zen)';
    $('pauseStatus').textContent = '—';
    return;
  }

  if (status.profile === 'focus') {
    $('slotStatus').textContent = 'blacklist active 24/7';
    $('pauseStatus').textContent = 'indisponible (focus)';
    return;
  }

  if (status.withinActiveSlot && status.activeSlot) {
    $('slotStatus').textContent = `actif (${status.activeSlot.start}–${status.activeSlot.end})`;
  } else if (status.nextSlot) {
    $('slotStatus').textContent = `inactif — prochain à ${status.nextSlot.start}`;
  } else {
    $('slotStatus').textContent = 'inactif';
  }

  if (status.pauseActive) {
    $('pauseStatus').textContent = `active (${formatRemaining(status.pauseRemainingMs)} restantes)`;
  } else if (status.pauseAvailable) {
    $('pauseStatus').textContent = 'disponible';
  } else {
    const remaining = status.nextPauseAvailableAt ? status.nextPauseAvailableAt - Date.now() : 0;
    $('pauseStatus').textContent = remaining > 0 ? `dans ${formatRemaining(remaining)}` : 'indisponible';
  }
}

async function renderSiteBanner() {
  if (!activeTab?.url || !/^https?:/.test(activeTab.url)) return;
  const domain = getDomain(activeTab.url);
  if (!domain) return;

  const res = await msg('GET_DOMAIN_STATUS', { url: activeTab.url });
  const statusLabel = {
    whitelisted: 'Whitelisté',
    blacklisted: 'Blacklisté',
    neutral_confirmed: 'Ignoré',
    neutral_unconfirmed: 'Non classé',
    internal: null,
  }[res?.status];

  if (!statusLabel) return;

  $('siteDomain').textContent = domain;
  $('siteStatus').textContent = statusLabel;
  $('siteBanner').style.display = 'flex';

  if (res.status !== 'whitelisted' && res.status !== 'blacklisted') {
    $('quickActions').style.display = 'flex';
    $('whitelistBtn').onclick = async () => {
      await msg('WHITELIST_ADD', { domain });
      toast(`${domain} whitelisté`);
      await refresh();
    };
    $('blacklistBtn').onclick = async () => {
      await msg('BLACKLIST_ADD', { domain });
      toast(`${domain} blacklisté`);
      await refresh();
    };
  }
}

document.querySelectorAll('.profile-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    await msg('SET_PROFILE', { profile: btn.dataset.profile });
    toast(`Profil : ${btn.textContent}`);
    await refresh();
  });
});

$('settingsBtn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

async function refresh() {
  [status, activeTab] = await Promise.all([msg('GET_STATUS'), getActiveTab()]);
  renderProfile();
  renderStatus();
  $('quickActions').style.display = 'none';
  $('siteBanner').style.display = 'none';
  await renderSiteBanner();
}

let toastTimer;
function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

init();

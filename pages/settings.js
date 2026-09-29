const $ = id => document.getElementById(id);

function msg(type, data = {}) {
  return chrome.runtime.sendMessage({ type, ...data });
}

let config = {};

async function load() {
  const r = await msg('GET_CONFIG');
  config = r.config || {};
  renderSlots();
  renderTags('whitelistTags', config.whitelistedDomains, 'tag-whitelist', 'WHITELIST_REMOVE');
  renderTags('blacklistTags', config.blacklistedDomains, 'tag-blacklist', 'BLACKLIST_REMOVE');
  renderTags('neutralTags', config.neutralConfirmedDomains, 'tag-neutral', 'NEUTRAL_REMOVE');
  await renderProfilePicker();
}

// ---- Schedules ---------------------------------------------------------------

function renderSlots() {
  const list = $('slotsList');
  const slots = config.schedules || [];

  if (!slots.length) {
    list.innerHTML = '<div class="empty-state">Aucun créneau — navigation libre en permanence (profil Normal).</div>';
    return;
  }

  list.innerHTML = slots.map((slot, i) => `
    <div class="slot-row" data-index="${i}">
      <input type="time" class="slot-start" value="${slot.start}">
      <span>→</span>
      <input type="time" class="slot-end" value="${slot.end}">
      <button class="slot-remove" data-index="${i}" title="Supprimer">×</button>
    </div>
  `).join('');

  list.querySelectorAll('.slot-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.index);
      config.schedules = config.schedules.filter((_, idx) => idx !== i);
      renderSlots();
    });
  });
}

$('addSlotBtn').addEventListener('click', () => {
  if (!config.schedules) config.schedules = [];
  config.schedules.push({ start: '09:00', end: '12:00' });
  renderSlots();
});

// ---- Domain lists --------------------------------------------------------------

function renderTags(containerId, list, tagClass, removeType) {
  const container = $(containerId);
  list = list || [];

  if (!list.length) {
    container.innerHTML = '<span style="font-size:12px;color:var(--text-subtle);">Aucun domaine.</span>';
    return;
  }

  container.innerHTML = list.map(domain => `
    <div class="tag ${tagClass}">
      ${escHtml(domain)}
      <button class="tag-remove" data-domain="${escHtml(domain)}" data-remove-type="${removeType}" title="Retirer">×</button>
    </div>
  `).join('');

  container.querySelectorAll('.tag-remove').forEach(btn => {
    btn.addEventListener('click', async () => {
      await msg(btn.dataset.removeType, { domain: btn.dataset.domain });
      await load();
      toast('Domaine retiré');
    });
  });
}

$('whitelistAddBtn').addEventListener('click', async () => {
  const domain = $('whitelistInput').value.trim();
  if (!domain) return;
  await msg('WHITELIST_ADD', { domain });
  $('whitelistInput').value = '';
  await load();
  toast('Ajouté à la whitelist');
});
$('whitelistInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('whitelistAddBtn').click(); });

$('blacklistAddBtn').addEventListener('click', async () => {
  const domain = $('blacklistInput').value.trim();
  if (!domain) return;
  await msg('BLACKLIST_ADD', { domain });
  $('blacklistInput').value = '';
  await load();
  toast('Ajouté à la blacklist');
});
$('blacklistInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('blacklistAddBtn').click(); });

// ---- Profile ------------------------------------------------------------------

async function renderProfilePicker() {
  const r = await msg('GET_STATUS');
  const current = r?.profile || 'normal';

  document.querySelectorAll('.profile-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.profile === current);
  });
}

document.querySelectorAll('.profile-option').forEach(btn => {
  btn.addEventListener('click', async () => {
    await msg('SET_PROFILE', { profile: btn.dataset.profile });
    document.querySelectorAll('.profile-option').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    toast('Profil enregistré');
  });
});

// ---- Save schedules -------------------------------------------------------------

$('saveBtn').addEventListener('click', async () => {
  const rows = [...document.querySelectorAll('.slot-row')];
  const schedules = rows.map(row => ({
    start: row.querySelector('.slot-start').value,
    end: row.querySelector('.slot-end').value,
  }));

  const res = await msg('SAVE_SCHEDULES', { schedules });
  if (res?.ok) {
    config.schedules = res.schedules;
    renderSlots();
    toast('Créneaux enregistrés');
  } else {
    toast('Erreur : créneau invalide (début < fin requis)');
  }
});

// ---- Helpers ---------------------------------------------------------------

let toastTimer;
function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

function escHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

load();

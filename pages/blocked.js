(function () {
  const $ = id => document.getElementById(id);

  function msg(type, data = {}) {
    return chrome.runtime.sendMessage({ type, ...data });
  }

  const params = new URLSearchParams(location.search);
  const domain = params.get('domain') || '';
  const reason = params.get('reason') || 'schedule';
  const pauseAvailableParam = params.get('pauseAvailable') === 'true';
  const originalUrl = params.get('originalUrl') || '';

  const REASON_LABELS = {
    schedule: 'Ce domaine est bloqué pendant votre créneau de productivité actuel.',
    focus: 'Ce domaine est bloqué en mode Focus, sans exception de créneau ni de pause.',
  };

  function formatRemaining(ms) {
    const totalMin = Math.ceil(ms / 60000);
    if (totalMin < 60) return `${totalMin} min`;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
  }

  async function render() {
    $('domain').textContent = domain;
    $('reason').textContent = REASON_LABELS[reason] || REASON_LABELS.schedule;

    if (reason === 'focus') {
      $('pause-unavailable-section').style.display = 'block';
      $('pause-unavailable-text').textContent = 'Aucune pause possible en mode Focus.';
      return;
    }

    if (pauseAvailableParam) {
      $('pause-section').style.display = 'block';
    } else {
      const status = await msg('GET_STATUS');
      $('pause-unavailable-section').style.display = 'block';
      const remaining = status?.nextPauseAvailableAt ? status.nextPauseAvailableAt - Date.now() : 0;
      $('pause-unavailable-text').textContent = remaining > 0
        ? `Pause indisponible — prochaine pause dans ${formatRemaining(remaining)}.`
        : 'Pause indisponible pour le moment.';
    }
  }

  $('pause-btn')?.addEventListener('click', async () => {
    const btn = $('pause-btn');
    btn.disabled = true;
    btn.textContent = 'Activation…';
    const res = await msg('START_PAUSE');
    if (res?.ok && originalUrl) {
      window.location.href = originalUrl;
    } else {
      btn.disabled = false;
      btn.textContent = 'Pause indisponible';
    }
  });

  render();
})();

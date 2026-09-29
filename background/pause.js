/**
 * Pause mode — 10 min bypass of blacklist blocking, 1 pause per rolling
 * 60-minute window counted from the end of the last used pause.
 * State lives in chrome.storage.local, never cached in memory: must survive
 * service-worker restarts without any window where a stale cache could
 * wrongly re-block an active pause.
 */

import { localGet, localSet } from '../shared/storage.js';

const PAUSE_DURATION_MS = 10 * 60 * 1000;
const PAUSE_COOLDOWN_MS = 60 * 60 * 1000;
const STORAGE_KEY = 'pauseState';

export async function getPauseState() {
  const r = await localGet(STORAGE_KEY);
  return r[STORAGE_KEY] || { pauseEndsAt: null, lastPauseEndAt: null };
}

export async function isPauseActive(now = Date.now()) {
  const { pauseEndsAt } = await getPauseState();
  return pauseEndsAt != null && now < pauseEndsAt;
}

export async function isPauseAvailable(now = Date.now()) {
  const { pauseEndsAt, lastPauseEndAt } = await getPauseState();
  if (pauseEndsAt != null && now < pauseEndsAt) return false; // already active
  if (lastPauseEndAt == null) return true;
  return now >= lastPauseEndAt + PAUSE_COOLDOWN_MS;
}

export async function startPause(now = Date.now()) {
  const pauseEndsAt = now + PAUSE_DURATION_MS;
  const state = { pauseEndsAt, lastPauseEndAt: pauseEndsAt };
  await localSet({ [STORAGE_KEY]: state });
  return state;
}

export async function getPauseRemainingMs(now = Date.now()) {
  const { pauseEndsAt } = await getPauseState();
  if (pauseEndsAt == null || now >= pauseEndsAt) return 0;
  return pauseEndsAt - now;
}

export async function getNextPauseAvailableAt(now = Date.now()) {
  const { lastPauseEndAt } = await getPauseState();
  if (lastPauseEndAt == null) return now;
  return lastPauseEndAt + PAUSE_COOLDOWN_MS;
}

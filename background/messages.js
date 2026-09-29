/**
 * Message router — handles all chrome.runtime.onMessage calls
 */

import { getConfig, saveConfig, loadConfig } from './config.js';
import {
  getDomainStatus,
  addToWhitelist, addToBlacklist, confirmNeutral,
  removeFromWhitelist, removeFromBlacklist, removeFromNeutralConfirmed,
} from './domains.js';
import { getProfile, setProfile } from './profiles.js';
import { isValidSlot, isWithinActiveSlot, getActiveSlot, getNextSlot } from './schedule.js';
import { isPauseActive, isPauseAvailable, startPause, getPauseRemainingMs, getNextPauseAvailableAt } from './pause.js';

export async function handleMessage(msg, sender) {
  switch (msg.type) {

    // ---- Status (popup + blocked page) --------------------------------------
    case 'GET_STATUS': {
      const profile = getProfile();
      const activeSlot = getActiveSlot();
      const nextSlot = getNextSlot();
      const pauseActive = await isPauseActive();
      const pauseAvailable = await isPauseAvailable();
      const pauseRemainingMs = await getPauseRemainingMs();
      const nextPauseAvailableAt = await getNextPauseAvailableAt();
      return {
        profile,
        withinActiveSlot: isWithinActiveSlot(),
        activeSlot,
        nextSlot,
        pauseActive,
        pauseAvailable,
        pauseRemainingMs,
        nextPauseAvailableAt,
      };
    }

    case 'GET_DOMAIN_STATUS': {
      const status = getDomainStatus(msg.url);
      return { status };
    }

    // ---- Config ---------------------------------------------------------------
    case 'GET_CONFIG':
      return { config: getConfig() };

    case 'SAVE_SCHEDULES': {
      const schedules = (msg.schedules || []).filter(isValidSlot);
      await saveConfig({ schedules });
      return { ok: true, schedules };
    }

    case 'RELOAD_CONFIG':
      await loadConfig();
      return { ok: true };

    // ---- Profile ----------------------------------------------------------------
    case 'SET_PROFILE':
      await setProfile(msg.profile);
      return { ok: true };

    // ---- Domain lists -------------------------------------------------------
    case 'WHITELIST_ADD':
      await addToWhitelist(msg.domain);
      return { ok: true };
    case 'WHITELIST_REMOVE':
      await removeFromWhitelist(msg.domain);
      return { ok: true };

    case 'BLACKLIST_ADD':
      await addToBlacklist(msg.domain);
      return { ok: true };
    case 'BLACKLIST_REMOVE':
      await removeFromBlacklist(msg.domain);
      return { ok: true };

    case 'NEUTRAL_CONFIRM':
      await confirmNeutral(msg.domain);
      return { ok: true };
    case 'NEUTRAL_REMOVE':
      await removeFromNeutralConfirmed(msg.domain);
      return { ok: true };

    // ---- Pause ----------------------------------------------------------------
    case 'START_PAUSE': {
      const available = await isPauseAvailable();
      if (!available) return { ok: false, error: 'pause_unavailable' };
      const state = await startPause();
      return { ok: true, state };
    }

    default:
      console.warn('[messages] Unknown message type:', msg.type);
      return { error: 'unknown_message' };
  }
}

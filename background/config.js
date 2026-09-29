/**
 * Settings management — defaults, load, save
 * Persisted in chrome.storage.sync: schedules, domain lists, active profile.
 */

import { syncGet, syncSet } from '../shared/storage.js';

export const DEFAULT_CONFIG = {
  schedules: [
    { start: '09:00', end: '12:00' },
    { start: '14:00', end: '18:00' },
  ],
  whitelistedDomains: [],
  blacklistedDomains: [],
  neutralConfirmedDomains: [],
  profile: 'normal', // 'normal' | 'zen' | 'focus'
};

let _config = { ...DEFAULT_CONFIG };

export function getConfig() {
  return _config;
}

export async function loadConfig() {
  try {
    const result = await syncGet('settings');
    if (result.settings) {
      _config = { ...DEFAULT_CONFIG, ...result.settings };
    }
  } catch (err) {
    console.warn('[config] Failed to load settings, using defaults:', err.message);
  }
}

export async function saveConfig(patch) {
  _config = { ..._config, ...patch };
  try {
    await syncSet({ settings: _config });
  } catch (err) {
    console.error('[config] Failed to save settings:', err.message);
  }
  return _config;
}

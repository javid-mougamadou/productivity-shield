/**
 * Profile management — normal | zen | focus
 * Stored in config.profile (chrome.storage.sync). No transition side-effects
 * to clean up (unlike tab_suspender's modes.js): the profile is read fresh
 * at every navigation evaluation, no timers/alarms tied to it.
 */

import { getConfig, saveConfig } from './config.js';

export const PROFILES = ['normal', 'zen', 'focus'];

export function getProfile() {
  return getConfig().profile || 'normal';
}

export async function setProfile(profile) {
  if (!PROFILES.includes(profile)) throw new Error(`Unknown profile: ${profile}`);
  await saveConfig({ profile });
  return profile;
}

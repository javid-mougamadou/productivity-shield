/**
 * Safe chrome.storage wrappers
 * Prefer local storage for state that must not sync across devices (pause),
 * sync storage for user-configured data (schedules, domain lists, profile).
 */

export async function localGet(keys) {
  return chrome.storage.local.get(keys);
}

export async function localSet(data) {
  return chrome.storage.local.set(data);
}

export async function syncGet(keys) {
  try {
    return await chrome.storage.sync.get(keys);
  } catch {
    // sync storage unavailable in incognito — fall back to local
    return chrome.storage.local.get(keys);
  }
}

export async function syncSet(data) {
  try {
    return await chrome.storage.sync.set(data);
  } catch {
    return chrome.storage.local.set(data);
  }
}

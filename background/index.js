/**
 * Background service worker entry point
 */

import { loadConfig } from './config.js';
import { handleMessage } from './messages.js';
import { registerNavigationListeners } from './navigation.js';
import { isExtensionContextValid } from '../shared/utils.js';

// ---- Install / Startup -----------------------------------------------------

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  await loadConfig();
  if (reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('pages/onboarding.html') });
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await loadConfig();
});

// SW wake-up init (runs every time SW is instantiated — MV3 kills it after
// ~30s idle, so config must be reloaded on every wake to avoid stale cache)
(async () => {
  if (!isExtensionContextValid()) return;
  try {
    await loadConfig();
  } catch (err) {
    console.error('[index] Init error:', err.message);
  }
})();

registerNavigationListeners();

// ---- Messages --------------------------------------------------------------

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handleMessage(msg, sender)
    .then(sendResponse)
    .catch(err => sendResponse({ error: err.message }));
  return true;
});

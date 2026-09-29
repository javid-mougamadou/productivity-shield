/**
 * Navigation decision tree — the core of productivity_shield.
 * evaluateNavigation() is pure w.r.t. its inputs (reads config/pause state)
 * and returns a decision; the webNavigation hook applies it (redirect).
 */

import { getDomainStatus } from './domains.js';
import { getProfile } from './profiles.js';
import { isWithinActiveSlot } from './schedule.js';
import { isPauseActive, isPauseAvailable } from './pause.js';
import { isInternalPage, isBlockedPage, getDomain } from '../shared/utils.js';

/**
 * @returns {Promise<{action: 'allow'|'block'|'navbar', domain: string|null, reason: string|null, pauseAvailable: boolean}>}
 */
export async function evaluateNavigation(url) {
  const allow = (reason = null) => ({ action: 'allow', domain: getDomain(url), reason, pauseAvailable: false });

  // Never intercept internal pages or our own blocked page (avoids redirect loop)
  if (isInternalPage(url) || isBlockedPage(url)) {
    return allow('internal');
  }

  const profile = getProfile();

  if (profile === 'zen') {
    return allow('zen');
  }

  if (profile === 'focus') {
    const status = getDomainStatus(url);
    if (status === 'blacklisted') {
      return { action: 'block', domain: getDomain(url), reason: 'focus', pauseAvailable: false };
    }
    return allow('focus');
  }

  // profile === 'normal'
  if (!isWithinActiveSlot()) {
    return allow('outside_schedule');
  }

  const status = getDomainStatus(url);

  if (status === 'whitelisted') return allow('whitelisted');
  if (status === 'neutral_confirmed') return allow('neutral_confirmed');

  if (status === 'blacklisted') {
    if (await isPauseActive()) return allow('pause_active');
    const pauseAvailable = await isPauseAvailable();
    return { action: 'block', domain: getDomain(url), reason: 'schedule', pauseAvailable };
  }

  // status === 'neutral_unconfirmed'
  return { action: 'navbar', domain: getDomain(url), reason: 'neutral_unconfirmed', pauseAvailable: false };
}

export function registerNavigationListeners() {
  chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    if (details.frameId !== 0) return; // main frame only
    if (!/^https?:/.test(details.url)) return;

    const decision = await evaluateNavigation(details.url);
    if (decision.action !== 'block') return;

    const params = new URLSearchParams({
      domain: decision.domain || '',
      reason: decision.reason || '',
      pauseAvailable: String(decision.pauseAvailable),
      originalUrl: details.url,
    });
    const blockedUrl = chrome.runtime.getURL(`pages/blocked.html?${params}`);

    try {
      await chrome.tabs.update(details.tabId, { url: blockedUrl });
    } catch {
      // Tab may have closed already — ignore
    }
  });

  chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    const tab = await chrome.tabs.get(tabId).catch(() => null);
    if (!tab || !tab.url) return;
    if (!/^https?:/.test(tab.url)) return;

    const decision = await evaluateNavigation(tab.url);
    if (decision.action !== 'block') return;

    const params = new URLSearchParams({
      domain: decision.domain || '',
      reason: decision.reason || '',
      pauseAvailable: String(decision.pauseAvailable),
      originalUrl: tab.url,
    });
    const blockedUrl = chrome.runtime.getURL(`pages/blocked.html?${params}`);

    try {
      await chrome.tabs.update(tabId, { url: blockedUrl });
    } catch {
      // ignore
    }
  });
}

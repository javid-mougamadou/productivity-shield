/**
 * Shared utilities — URL checks, domain helpers
 */

const INTERNAL_PREFIXES = [
  'chrome://',
  'chrome-extension://',
  'chrome-search://',
  'edge://',
  'about:',
  'file://',
  'data:',
  'blob:',
  'javascript:',
  'view-source:',
  'devtools://',
];

export function isInternalPage(url) {
  if (!url) return true;
  return INTERNAL_PREFIXES.some(p => url.startsWith(p));
}

export function isBlockedPage(url) {
  if (!url) return false;
  return url.includes('pages/blocked.html');
}

export function getDomain(url) {
  try {
    let hostname = new URL(url).hostname.toLowerCase();
    if (hostname.startsWith('www.')) hostname = hostname.slice(4);
    return hostname;
  } catch {
    return null;
  }
}

export function normalizeDomain(domain) {
  return (domain || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
}

export function isExtensionContextValid() {
  try {
    return !!(chrome.runtime && chrome.runtime.id);
  } catch {
    return false;
  }
}

/**
 * Chrome API mock for local UI development
 * Include this script BEFORE any page script when serving locally.
 */

const MOCK_CONFIG = {
  schedules: [
    { start: '09:00', end: '12:00' },
    { start: '14:00', end: '18:00' },
  ],
  whitelistedDomains: ['github.com', 'gmail.com'],
  blacklistedDomains: ['youtube.com', 'twitter.com'],
  neutralConfirmedDomains: ['wikipedia.org'],
  profile: 'normal',
};

const MOCK_STATUS = {
  profile: 'normal',
  withinActiveSlot: true,
  activeSlot: { start: '09:00', end: '12:00' },
  nextSlot: { start: '14:00', end: '18:00' },
  pauseActive: false,
  pauseAvailable: true,
  pauseRemainingMs: 0,
  nextPauseAvailableAt: Date.now(),
};

window.chrome = {
  runtime: {
    id: 'mock-extension-id',
    getURL: path => `/${path}`,
    openOptionsPage: () => alert('openOptionsPage()'),
    sendMessage: async (msg) => {
      await new Promise(r => setTimeout(r, 60)); // simulate async
      switch (msg.type) {
        case 'GET_CONFIG': return { config: { ...MOCK_CONFIG } };
        case 'SAVE_SCHEDULES': MOCK_CONFIG.schedules = msg.schedules; return { ok: true, schedules: msg.schedules };
        case 'SET_PROFILE': MOCK_CONFIG.profile = msg.profile; MOCK_STATUS.profile = msg.profile; return { ok: true };
        case 'GET_STATUS': return { ...MOCK_STATUS };
        case 'GET_DOMAIN_STATUS': {
          const domain = (msg.url || '').replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
          if (MOCK_CONFIG.blacklistedDomains.includes(domain)) return { status: 'blacklisted' };
          if (MOCK_CONFIG.whitelistedDomains.includes(domain)) return { status: 'whitelisted' };
          if (MOCK_CONFIG.neutralConfirmedDomains.includes(domain)) return { status: 'neutral_confirmed' };
          return { status: 'neutral_unconfirmed' };
        }
        case 'WHITELIST_ADD': MOCK_CONFIG.whitelistedDomains.push(msg.domain); return { ok: true };
        case 'WHITELIST_REMOVE': MOCK_CONFIG.whitelistedDomains = MOCK_CONFIG.whitelistedDomains.filter(d => d !== msg.domain); return { ok: true };
        case 'BLACKLIST_ADD': MOCK_CONFIG.blacklistedDomains.push(msg.domain); return { ok: true };
        case 'BLACKLIST_REMOVE': MOCK_CONFIG.blacklistedDomains = MOCK_CONFIG.blacklistedDomains.filter(d => d !== msg.domain); return { ok: true };
        case 'NEUTRAL_CONFIRM': MOCK_CONFIG.neutralConfirmedDomains.push(msg.domain); return { ok: true };
        case 'NEUTRAL_REMOVE': MOCK_CONFIG.neutralConfirmedDomains = MOCK_CONFIG.neutralConfirmedDomains.filter(d => d !== msg.domain); return { ok: true };
        case 'START_PAUSE':
          MOCK_STATUS.pauseActive = true;
          MOCK_STATUS.pauseAvailable = false;
          MOCK_STATUS.pauseRemainingMs = 10 * 60 * 1000;
          return { ok: true };
        default: return { error: 'unknown' };
      }
    },
  },
  tabs: {
    query: async (opts) => {
      if (opts.active) return [{ id: 1, url: 'https://example.com', title: 'Example', favIconUrl: '' }];
      return [];
    },
    create: (opts) => { window.open(opts.url, '_blank'); },
  },
  storage: {
    local: { get: async () => ({}), set: async () => {} },
    sync: { get: async () => ({}), set: async () => {} },
  },
};

console.info('[chrome-mock] Chrome API mock loaded');

/**
 * Domain classification — whitelist / blacklist / neutral confirmed
 * A domain belongs to at most one list at a time: adding it to one list
 * removes it from the other two (mutual exclusivity).
 */

import { getConfig, saveConfig } from './config.js';
import { getDomain, normalizeDomain } from '../shared/utils.js';

function matches(list, domain) {
  return list.some(d => {
    const nd = d.toLowerCase();
    return domain === nd || domain.endsWith('.' + nd);
  });
}

/**
 * Classify a URL's domain.
 * Priority order (safety net, mutual exclusivity should make it moot):
 * blacklisted > whitelisted > neutral_confirmed > neutral_unconfirmed
 */
export function getDomainStatus(url) {
  const domain = getDomain(url);
  if (!domain) return 'internal';

  const { whitelistedDomains, blacklistedDomains, neutralConfirmedDomains } = getConfig();

  if (matches(blacklistedDomains, domain)) return 'blacklisted';
  if (matches(whitelistedDomains, domain)) return 'whitelisted';
  if (matches(neutralConfirmedDomains, domain)) return 'neutral_confirmed';
  return 'neutral_unconfirmed';
}

async function removeFromAllLists(domain) {
  const { whitelistedDomains, blacklistedDomains, neutralConfirmedDomains } = getConfig();
  return {
    whitelistedDomains: whitelistedDomains.filter(d => d !== domain),
    blacklistedDomains: blacklistedDomains.filter(d => d !== domain),
    neutralConfirmedDomains: neutralConfirmedDomains.filter(d => d !== domain),
  };
}

export async function addToWhitelist(domain) {
  domain = normalizeDomain(domain);
  if (!domain) return;
  const lists = await removeFromAllLists(domain);
  lists.whitelistedDomains = [...lists.whitelistedDomains, domain];
  await saveConfig(lists);
}

export async function addToBlacklist(domain) {
  domain = normalizeDomain(domain);
  if (!domain) return;
  const lists = await removeFromAllLists(domain);
  lists.blacklistedDomains = [...lists.blacklistedDomains, domain];
  await saveConfig(lists);
}

export async function confirmNeutral(domain) {
  domain = normalizeDomain(domain);
  if (!domain) return;
  const lists = await removeFromAllLists(domain);
  lists.neutralConfirmedDomains = [...lists.neutralConfirmedDomains, domain];
  await saveConfig(lists);
}

export async function removeFromWhitelist(domain) {
  domain = normalizeDomain(domain);
  const list = getConfig().whitelistedDomains.filter(d => d !== domain);
  await saveConfig({ whitelistedDomains: list });
}

export async function removeFromBlacklist(domain) {
  domain = normalizeDomain(domain);
  const list = getConfig().blacklistedDomains.filter(d => d !== domain);
  await saveConfig({ blacklistedDomains: list });
}

export async function removeFromNeutralConfirmed(domain) {
  domain = normalizeDomain(domain);
  const list = getConfig().neutralConfirmedDomains.filter(d => d !== domain);
  await saveConfig({ neutralConfirmedDomains: list });
}

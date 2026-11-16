import {CHARACTER_CARDS, UNIVERSES, cardById} from './flywheel/cards-data.js';
import {readDiscoveryState, discoveryUrl} from './flywheel/discovery-state.js';

export const CHARACTER_HOME = '/characters';

// Only a local catalogue URL can be used as a return destination. The state
// stays in browser history, separate from chat, story saves and account data.
export function characterDirectoryReturn(value) {
  if (typeof value !== 'string' || !/^\/characters(?:[?#]|$)/.test(value)) return null;
  try {
    const url = new URL(value, 'https://storydate.invalid');
    return discoveryUrl(readDiscoveryState(url.search,UNIVERSES), {search:url.search,hash:url.hash});
  } catch { return null; }
}

// Catalogue IDs and existing chat IDs are aliases, never new storage identities.
export function characterProfileUrl(id) {
  const card = cardById(id) || CHARACTER_CARDS.find(c =>
    c.chatId === id || c.chat === '/play/' + id);
  return card ? CHARACTER_HOME + '/' + encodeURIComponent(card.id) : null;
}

export function canonicalCharacterUrl(url) {
  if (typeof url !== 'string' || !url.startsWith('/') || url.startsWith('//')) return url;
  const [, path, suffix] = /^(\/[^?#]*)(.*)$/.exec(url);
  if (path === '/character' || path === '/character/') return CHARACTER_HOME + suffix;
  const match = /^\/(?:character|characters)\/([^/]+)$/.exec(path);
  if (!match) return url;
  let id;
  try { id = decodeURIComponent(match[1]); } catch { return url; }
  const profile = characterProfileUrl(id);
  // Creator titles outside the curated index keep their existing detail route.
  return profile ? profile + suffix : url;
}

export function isCharacterArea(path) {
  if (path === CHARACTER_HOME || path.startsWith(CHARACTER_HOME + '/')) return true;
  const chat = /^\/play\/([^/?]+)$/.exec(path);
  return Boolean(chat && characterProfileUrl(chat[1]));
}

export function syncCharacterLinks(host, path = globalThis.location?.pathname || '/') {
  host.querySelectorAll('a[href]').forEach(a => {
    const before = a.getAttribute('href'), after = canonicalCharacterUrl(before);
    if (before !== after) a.setAttribute('href', after);
  });
  if (!isCharacterArea(path)) return;
  host.querySelectorAll('[data-shrink] a[href]').forEach(a => {
    const selected = a.getAttribute('href') === CHARACTER_HOME;
    a.dataset.status = selected ? 'active' : 'inactive';
    if (selected) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

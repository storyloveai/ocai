import {CHARACTER_CARDS, cardById} from './flywheel/cards-data.js';

export const CHARACTER_HOME = '/characters';

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

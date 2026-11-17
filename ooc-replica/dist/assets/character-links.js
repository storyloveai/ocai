import {CHARACTER_CARDS, UNIVERSES, cardById} from './flywheel/cards-data.js';
import {readDiscoveryState, discoveryUrl} from './flywheel/discovery-state.js';
import {storyById} from './character-stories.js';

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
  // Retired prototype destinations lead back into the existing product.
  // Keep authored content and old bookmarks without a second world catalogue.
  if (path === '/universe' || path === '/frameworks') return '/' + suffix;
  const world = /^\/universe\/([^/]+)$/.exec(path)?.[1];
  if (world === 'original') return '/characters?world=original' + (suffix.startsWith('#') ? suffix : '');
  const retiredWorlds = {xichuan:'xichuan',sanguo:'three-kingdoms',westlin:'ashen-crown',baker:'baker-street'};
  const story = Object.hasOwn(retiredWorlds,world) ? retiredWorlds[world] : null;
  if (story) return '/story/' + story + suffix;
  if (path === '/character' || path === '/character/') return CHARACTER_HOME + suffix;
  const match = /^\/(?:character|characters)\/([^/]+)$/.exec(path);
  if (!match) return url;
  let id;
  try { id = decodeURIComponent(match[1]); } catch { return url; }
  const profile = characterProfileUrl(id);
  // Creator titles outside the curated index keep their existing detail route.
  return profile ? profile + suffix : url;
}

// Return context contains no draft text, arbitrary URL, or account identity.
// It names an existing profile/chat only; story pages can pass it through.
export function characterReturnUrl(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return null;
  const path = canonicalCharacterUrl(value).split(/[?#]/)[0];
  const profile = /^\/characters\/([^/]+)$/.exec(path);
  if (profile && cardById(profile[1])) return path;
  const chat = /^\/play\/([^/]+)$/.exec(path);
  return chat && CHARACTER_CARDS.some(c => c.chatId === chat[1]) ? path : null;
}

export function storyReturnUrl(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return null;
  const path = value.split(/[?#]/)[0], match = /^\/story\/([^/]+)$/.exec(path);
  return match && storyById(match[1]) ? path : null;
}

export function isCharacterJourney(path) {
  if (isCharacterArea(path)) return true;
  const play = /^\/play\/([^/]+)$/.exec(path);
  if (play && storyById(play[1])?.playUrl === path) return true;
  const story = /^\/story\/([^/]+)$/.exec(path);
  return Boolean(story && storyById(story[1]));
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

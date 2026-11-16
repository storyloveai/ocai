// The directory URL owns world/chat/q. Keep draft query text intact; matching
// can trim and normalize it without changing what the visitor is still typing.
const queryParams = search => new URLSearchParams(typeof search === 'string' ? search : '');
const owns = (object, key) => object != null && Object.hasOwn(object, key);
function allowedWorld(world, worlds) {
  if (typeof world !== 'string' || world === 'all') return 'all';
  const allowed = worlds instanceof Set ? worlds.has(world)
    : Array.isArray(worlds) ? worlds.includes(world)
    : owns(worlds, world);
  return allowed ? world : 'all';
}
function normalize(state, worlds) {
  return {
    world: allowedWorld(state?.world, worlds),
    chat: state?.chat === true,
    query: typeof state?.query === 'string' ? state.query : '',
  };
}

export function readDiscoveryState(search = '', allowedWorlds = []) {
  const params = queryParams(search);
  return normalize({world: params.get('world'), chat: params.get('chat') === '1', query: params.get('q')}, allowedWorlds);
}

export function patchDiscoveryState(state, patch, allowedWorlds = []) {
  return normalize(Object.fromEntries(['world', 'chat', 'query'].map(key =>
    [key, owns(patch, key) ? patch[key] : state?.[key]])), allowedWorlds);
}

// Pass a normalized state from readDiscoveryState/patchDiscoveryState. Other
// route context belongs to its caller and survives these three owned fields.
export function discoveryUrl(state, {search = '', hash = ''} = {}) {
  const params = queryParams(search);
  for (const key of ['world', 'chat', 'q']) params.delete(key);
  if (typeof state?.world === 'string' && state.world !== 'all' && state.world) params.set('world', state.world);
  if (state?.chat === true) params.set('chat', '1');
  if (typeof state?.query === 'string' && state.query !== '') params.set('q', state.query);
  const query = params.toString();
  const fragment = typeof hash === 'string' && hash ? (hash.startsWith('#') ? hash : '#' + hash) : '';
  return '/characters' + (query ? '?' + query : '') + fragment;
}

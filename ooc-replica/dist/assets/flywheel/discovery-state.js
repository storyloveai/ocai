const queryParams = search => new URLSearchParams(typeof search === 'string' ? search : '');
function allowedWorld(world, worlds) {
  if (typeof world !== 'string' || world === 'all') return 'all';
  const allowed = worlds instanceof Set ? worlds.has(world)
    : Array.isArray(worlds) ? worlds.includes(world)
    : worlds != null && Object.hasOwn(worlds, world);
  return allowed ? world : 'all';
}
export function readDiscoveryState(search = '', allowedWorlds = []) {
  const params = queryParams(search);
  return {world: allowedWorld(params.get('world'), allowedWorlds), chat: params.get('chat') === '1'};
}

// Old directory links can contain a retired local search term. Keep unrelated
// route parameters while writing only the filters still offered by this page.
export function discoveryUrl(state, {search = '', hash = ''} = {}) {
  const params = queryParams(search);
  for (const key of ['world', 'chat', 'q']) params.delete(key);
  if (typeof state?.world === 'string' && state.world !== 'all' && state.world) params.set('world', state.world);
  if (state?.chat === true) params.set('chat', '1');
  const query = params.toString();
  const fragment = typeof hash === 'string' && hash ? (hash.startsWith('#') ? hash : '#' + hash) : '';
  return '/characters' + (query ? '?' + query : '') + fragment;
}

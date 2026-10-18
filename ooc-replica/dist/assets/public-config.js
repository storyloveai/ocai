// Share a single public configuration request between account restoration and chat.
// The fetch identity keeps injected clients and tests isolated.
const requests = new WeakMap();
export function loadPublicConfig(fetchImpl = fetch) {
  if (!requests.has(fetchImpl)) {
    const request = Promise.resolve().then(() => fetchImpl('/api/config')).then(async response => {
      if (!response.ok) throw Error('无法读取账户配置。');
      return response.json();
    }).catch(error => { requests.delete(fetchImpl); throw error; });
    requests.set(fetchImpl, request);
  }
  return requests.get(fetchImpl);
}

import { createAccountStorage, cloudKey } from './account-storage.js';
import { loadPublicConfig } from './public-config.js';
export function createAccount({ storage = localStorage, fetchImpl = fetch, loadClient = () => import('./firebase-client.js'), changed = () => {}, notify = () => {}, cloudLoadTimeoutMs = 8000 } = {}) {
  const cache = createAccountStorage(storage);
  let client, uid = null, generation = 0, hydrating = false;
  const pending = new Map();
  let timer, inFlight, writeError = '', sending = [];
  const unverified = new Set(), conflicts = new Map();
  const dirtyKey = id => `ooc-sync-pending:${id}`;
  const reviewKey = id => `ooc-sync-review:${id}`;
  function persistPending(id) {
    if (id) {
      storage.setItem(dirtyKey(id), JSON.stringify([...new Set([...sending, ...pending].filter(([, item]) => item.uid === id).map(([key]) => key))]));
      storage.setItem(reviewKey(id), JSON.stringify([...unverified]));
    }
  }
  function status() {
    a.pendingCount = new Set([...sending, ...pending].filter(([, item]) => item.uid === uid).map(([key]) => key)).size;
    a.conflictKeys = [...conflicts.keys()];
    a.syncError = a.restoreError || (conflicts.size ? '本设备与云端都有待确认的修改，请选择要继续的版本。' : writeError);
  }
  async function loadRows(id) {
    let loadTimer;
    try { return await Promise.race([client.load(id), new Promise((_, reject) => { loadTimer = setTimeout(() => reject(Error('Cloud state timed out')), cloudLoadTimeoutMs); })]); }
    finally { clearTimeout(loadTimer); }
  }
  async function hydrate(user) {
    const current = ++generation; hydrating = true;
    clearTimeout(timer); pending.clear(); unverified.clear(); conflicts.clear(); writeError = '';
    uid = null; a.busy = true; a.restored = false; a.user = null; a.syncError = ''; a.restoreError = ''; a.conflictKeys = []; a.pendingCount = 0; a.syncing = false; cache.useAccount(null);
    changed();
    let rows = [], restoreError = '';
    if (user) {
      try { rows = await loadRows(user.uid); }
      catch { restoreError = '无法读取云端进度，目前仅保存在此设备。请重试连接后再同步。'; }
    }
    if (current !== generation) return;
    uid = user?.uid || null; cache.useAccount(uid);
    if (uid) {
      let dirty = [], review = [];
      try { dirty = JSON.parse(storage.getItem(dirtyKey(uid))) || []; review = JSON.parse(storage.getItem(reviewKey(uid))) || []; } catch {}
      for (const key of Array.isArray(dirty) ? dirty : []) if (cloudKey(key)) pending.set(key, {uid, value: cache.read(key, null)});
      for (const key of Array.isArray(review) ? review : []) if (pending.has(key)) unverified.add(key);
    }
    if (!restoreError) {
      const cloud = new Map(rows.filter(([key]) => cloudKey(key)));
      for (const [key, value] of cloud) {
        if (!pending.has(key)) cache.save(key, value);
        else if (unverified.has(key)) {
          const device = pending.get(key).value;
          if (JSON.stringify(device) === JSON.stringify(value)) { pending.delete(key); unverified.delete(key); }
          else conflicts.set(key, {device, cloud: value});
        }
      }
      for (const key of [...unverified]) if (!cloud.has(key)) unverified.delete(key);
      persistPending(uid);
    }
    a.user = user; a.restoreError = restoreError; hydrating = false; a.busy = false; a.restored = true; status();
    changed(true);
    if (uid && pending.size && !restoreError) void a.flush();
  }
  const a = {
    paymentConfig: {},
    async api(path, body) {
      const user = a.user;
      if (!user) throw Error('请先登录。');
      const token = await user.getIdToken();
      if (a.user !== user) throw Error('账户已更换，请重试。');
      const response = await fetchImpl('/api/' + path, { method: body ? 'POST' : 'GET', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const result = await response.json();
      if (a.user !== user) throw Error('账户已更换，请重试。');
      if (!response.ok) throw Error(result.error || '请求失败，请重试。');
      return result;
    },
    user: null, ready: false, restored: false, busy: true, providers: {}, error: '', syncError: '', restoreError: '', conflictKeys: [], pendingCount: 0, syncing: false,
    read: (key, fallback) => cache.read(key, fallback),
    scope() {
      const version = generation;
      return { account: a, read: (key, fallback) => version === generation ? a.read(key, fallback) : fallback, save: (key, value) => { if (version === generation) a.save(key, value); } };
    },
    save(key, value) {
      cache.save(key, value);
      if (uid && cloudKey(key)) {
        pending.set(key, {uid, value: JSON.parse(JSON.stringify(value))});
        if (a.restoreError) unverified.add(key);
        persistPending(uid); status();
        clearTimeout(timer); timer = setTimeout(() => a.flush(), 800);
      }
    },
    async retrySync() {
      if (a.busy) return false;
      if (a.restoreError && a.user) { await hydrate(a.user); return !a.syncError; }
      return a.flush();
    },
    conflictCopies() { return [...conflicts].map(([key, value]) => ({key, ...JSON.parse(JSON.stringify(value)), device: cache.read(key, value.device)})); },
    async resolveConflicts(prefer) {
      if (!['device', 'cloud'].includes(prefer) || !uid || a.busy || !conflicts.size) return false;
      // Keep the local copies on this device before any replacement. Never upload the backup.
      const backupKey = `ooc-sync-backup:${uid}`;
      let backups = []; try { backups = JSON.parse(storage.getItem(backupKey)) || []; } catch {}
      storage.setItem(backupKey, JSON.stringify([...(Array.isArray(backups) ? backups.slice(-2) : []), {at: Date.now(), values: Object.fromEntries([...conflicts].map(([key, value]) => [key, cache.read(key, value.device)]))}]));
      if (prefer === 'cloud') {
        const originals = new Map([...conflicts].map(([key]) => [key, cache.read(key, null)]));
        try { for (const [key, value] of conflicts) cache.save(key, value.cloud); }
        catch (error) { for (const [key, value] of originals) { try { cache.save(key, value); } catch {} } throw error; }
      }
      for (const [key] of conflicts) {
        if (prefer === 'cloud') pending.delete(key);
        unverified.delete(key);
      }
      conflicts.clear(); persistPending(uid); status();
      ++generation; changed(true); // invalidate any view still holding the replaced snapshot
      return a.flush();
    },
    async flush() {
      if (hydrating || a.restoreError || conflicts.size) return false;
      if (inFlight) { await inFlight; return a.flush(); }
      inFlight = a.writePending();
      try { return await inFlight; } finally { inFlight = null; }
    },
    async writePending() {
      clearTimeout(timer);
      const owner = uid, current = generation;
      const writes = [...pending].filter(([key]) => !conflicts.has(key) && !unverified.has(key));
      sending = writes;
      for (const [key] of writes) pending.delete(key);
      if (writes.length) { a.syncing = true; changed(); }
      let failed = false;
      await Promise.all(writes.map(async ([key, item]) => {
        try { await client.save(item.uid, key, item.value); }
        catch { failed = true; if (uid === item.uid && !pending.has(key)) pending.set(key, item); }
      }));
      sending = [];
      // An old account's late network result cannot change the current account's status.
      if (current === generation && owner === uid) {
        if (writes.length) writeError = failed ? '云端保存失败，数据仍保存在此设备。请重试同步后再退出。' : '';
        a.syncing = false; persistPending(uid); status(); if (writes.length) changed();
      }
      return !failed && !conflicts.size && !unverified.size;
    },
    async login(provider = 'google') {
      if (!a.ready) { notify(a.error || '账户服务正在初始化。'); return; }
      if (a.busy || !a.providers[provider]) return;
      a.busy = true; changed();
      try { await client.login(provider); }
      catch (e) {
        const errors = {
          'auth/popup-closed-by-user': '登录已取消。',
          'auth/cancelled-popup-request': '请完成已打开的登录窗口。',
          'auth/popup-blocked': '浏览器拦截了登录窗口，请允许本站弹窗后重试。',
          'auth/unauthorized-domain': '当前域名尚未加入 Firebase 授权域名。',
          'auth/operation-not-allowed': '请先在 Firebase 启用此登录方式。',
          'auth/network-request-failed': '登录服务连接超时，请检查网络后重试。',
          'auth/account-exists-with-different-credential': '此邮箱已使用另一种方式注册，请使用原方式登录。',
        };
        notify(errors[e.code] || '登录失败，请检查网络和 Firebase 配置后重试。');
      } finally { a.busy = hydrating; changed(); }
    },
    async logout() {
      if (a.busy) return;
      a.busy = true; changed();
      try { if (await a.flush()) await client.logout(); else notify(a.syncError); }
      catch { notify('退出失败，请重试。'); }
      finally { a.busy = hydrating; changed(); }
    },
    async init() {
      try {
        const config = await loadPublicConfig(fetchImpl);
        a.paymentConfig = config;
        const { auth } = config;
        if (!auth) throw Error('Firebase 登录尚未配置，请联系站点管理员。');
        a.providers = auth.providers;
        const sdk = await loadClient();
        client = await sdk.connectFirebase(auth.config);
        client.subscribe(hydrate);
        a.ready = true;
      } catch (e) { a.error = e.message; a.busy = false; a.restored = true; }
      changed();
    },
  };
  return a;
}

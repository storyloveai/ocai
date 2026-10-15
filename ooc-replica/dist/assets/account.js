import { createAccountStorage, cloudKey } from './account-storage.js';
export function createAccount({ storage = localStorage, fetchImpl = fetch, loadClient = () => import('./firebase-client.js'), changed = () => {}, notify = () => {} } = {}) {
  const cache = createAccountStorage(storage);
  let client, uid = null, generation = 0, hydrating = false;
  const pending = new Map();
  let timer, inFlight;
  const dirtyKey = id => `ooc-sync-pending:${id}`;
  function persistPending(id) {
    if (id) storage.setItem(dirtyKey(id), JSON.stringify([...pending].filter(([, item]) => item.uid === id).map(([key]) => key)));
  }
  const a = {
    user: null, ready: false, busy: true, providers: {}, error: '', syncError: '',
    read: (key, fallback) => cache.read(key, fallback),
    scope() {
      const version = generation;
      return { read: (key, fallback) => version === generation ? a.read(key, fallback) : fallback, save: (key, value) => { if (version === generation) a.save(key, value); } };
    },
    save(key, value) {
      cache.save(key, value);
      if (uid && cloudKey(key)) {
        // Snapshot values now; streaming callers may mutate their arrays later.
        pending.set(key, { uid, value: JSON.parse(JSON.stringify(value)) });
        persistPending(uid);
        clearTimeout(timer); timer = setTimeout(() => a.flush(), 800);
      }
    },
    async flush() {
      if (inFlight) { await inFlight; return a.flush(); }
      inFlight = a.writePending();
      try { return await inFlight; } finally { inFlight = null; }
    },
    async writePending() {
      clearTimeout(timer);
      const writes = [...pending]; pending.clear();
      let failed = false;
      await Promise.all(writes.map(async ([key, item]) => {
        try { await client.save(item.uid, key, item.value); }
        catch { failed = true; if (uid === item.uid && !pending.has(key)) pending.set(key, item); }
      }));
      for (const id of new Set(writes.map(([, item]) => item.uid))) if(id === uid) persistPending(id);
      if (writes.length) { a.syncError = failed ? '云端保存失败，数据仍保存在此设备。请重试同步后再退出。' : ''; changed(); }
      return !failed;
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
        const response = await fetchImpl('/api/config');
        if (!response.ok) throw Error('无法读取账户配置。');
        const { auth } = await response.json();
        if (!auth) throw Error('Firebase 登录尚未配置，请联系站点管理员。');
        a.providers = auth.providers;
        const sdk = await loadClient();
        client = await sdk.connectFirebase(auth.config);
        client.subscribe(async user => {
          const current = ++generation; hydrating = true;
          clearTimeout(timer); pending.clear();
          uid = null; a.busy = true; a.user = null; cache.useAccount(null);
          changed();
          let rows = [], syncError = '';
          if (user) {
            try { rows = await client.load(user.uid); }
            catch { syncError = '无法读取云端数据，暂时使用本设备缓存。请检查网络和 Firestore 规则。'; }
          }
          if (current !== generation) return;
          uid = user?.uid || null; cache.useAccount(uid);
          if (uid) {
            let dirty = [];
            try { dirty = JSON.parse(storage.getItem(dirtyKey(uid))) || []; } catch {}
            for (const key of dirty) if (cloudKey(key)) pending.set(key, { uid, value: cache.read(key, null) });
          }
          // Local unsynced values win over an older cloud copy.
          for (const [key, value] of rows) if (cloudKey(key) && !pending.has(key)) cache.save(key, value);
          a.user = user; a.syncError = syncError; hydrating = false; a.busy = false;
          changed(true);
          if (uid && pending.size) a.flush();
        });
        a.ready = true;
      } catch (e) { a.error = e.message; a.busy = false; }
      changed();
    },
  };
  return a;
}

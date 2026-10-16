export function createPayments({ account, show, modal, notify, storage = sessionStorage }) {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let root, wallet, error = '', notice = '', busy = false, owner = null, generation = 0, controller, polling = false, observedConfig;
  const cfg = () => account.paymentConfig;
  const key = () => `replica-payment:${cfg().auth?.config?.projectId}:${cfg().walletMode}:${owner}`;
  const current = version => version === generation && owner === account.user?.uid;
  function draw() {
    if (!root?.isConnected) return;
    root.innerHTML = `<div class="preview"><h2>Your credits ${cfg().walletMode === 'test' ? '· 测试环境' : ''}</h2><h1>${wallet ? wallet.balance.toLocaleString() : '—'} <span style="color:#dfff2c">✱</span></h1><p role="status">${esc(error || notice)}</p>${account.user ? `<button class="secondary" data-wallet-refresh ${busy ? 'disabled' : ''}>刷新余额 / 确认到账</button> <button class="primary" data-checkin ${busy || !cfg().walletConfigured || wallet?.checked ? 'disabled' : ''}>${wallet?.checked ? '今日已签到' : '每日签到 +100'}</button>` : '<button class="primary" data-action="login">登录查看余额</button>'}<p>每日 00:00（上海时间）刷新。当前聊天暂不扣除 Credits。</p></div><h2>为下一章补充灵感</h2><p>${cfg().walletMode === 'test' ? '测试结账，不会真实扣款。' : '通过 Stripe 安全付款，USD 一次性充值。'}</p>${!cfg().payments ? '<p>充值服务尚未配置完成。</p>' : ''}<div class="credit-plans">${(cfg().creditPacks || []).map(p => `<section class="preview"><h3>${esc(p.label)}</h3><h2>${p.credits.toLocaleString()} Credits</h2><p>${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p.amount / 100)}</p><button class="primary" data-pack="${p.credits}" ${busy || !cfg().payments || !cfg().embeddedPayments ? 'disabled' : ''}>${cfg().walletMode === 'test' ? '测试充值' : '充值'}</button></section>`).join('')}</div><h2>最近流水</h2>${(wallet?.ledger || []).map(item => `<p>${esc(item.at)} · ${item.type === 'purchase' ? '充值' : '签到'} +${item.amount}</p>`).join('') || '<p>暂无流水</p>'}`;
    root.querySelector('[data-wallet-refresh]')?.addEventListener('click', async () => { await refresh(); await verify(); });
    root.querySelector('[data-checkin]')?.addEventListener('click', checkin);
    root.querySelectorAll('[data-pack]').forEach(button => button.addEventListener('click', () => checkout(Number(button.dataset.pack))));
  }
  async function refresh() {
    if (!account.user || !cfg().walletConfigured) { draw(); return; }
    const version = generation;
    try { const result = await account.api('wallet'); if (current(version)) { wallet = result; error = ''; } }
    catch (e) { if (current(version)) error = e.message; }
    if (current(version)) draw();
  }
  async function checkin() {
    if (busy) return;
    const version = generation; busy = true; draw();
    try { const result = await account.api('checkin', {}); if (current(version)) { wallet = result; error = ''; } }
    catch (e) { if (current(version)) error = e.message; }
    finally { if (current(version)) { busy = false; draw(); } }
  }
  async function verify() {
    if (!account.user || owner !== account.user.uid || polling) return;
    const session = storage.getItem(key());
    if (!session) return;
    const version = generation; polling = true;
    try {
      for (let i = 0; i < 8 && current(version); i++) {
        const status = await account.api('checkout-status?session_id=' + encodeURIComponent(session));
        if (!current(version)) return;
        if (status.credited) { storage.removeItem(key()); notice = '充值已到账。'; error = ''; await refresh(); return; }
        if (status.status === 'expired') { storage.removeItem(key()); notice = '订单已过期，未到账。'; draw(); return; }
        notice = status.paid ? '付款已确认，正在等待到账。可稍后刷新余额。' : '订单尚未完成付款。'; draw();
        if (!status.paid) return;
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    } catch (e) { if (current(version)) { error = e.message; draw(); } }
    finally { if (current(version)) polling = false; }
  }
  async function checkout(pack) {
    if (!account.user) { account.login(); return; }
    if (busy) return;
    const version = generation; const pendingKey = key(); busy = true; error = ''; draw();
    controller?.abort(); controller = new AbortController(); const signal = controller.signal;
    const attemptKey = pendingKey + ':attempt:' + pack;
    let requestId = storage.getItem(attemptKey);
    if (!requestId) { requestId = crypto.randomUUID(); storage.setItem(attemptKey, requestId); }
    try {
      show(`<h2>充值 ${pack.toLocaleString()} Credits</h2><form><div data-wallet-section><div data-express-element></div></div><p data-wallet-separator hidden>或使用其他付款方式</p><div data-payment-element></div><p data-payment-error role="alert"></p><p data-payment-status role="status">正在加载安全付款界面…</p><button class="primary" type="submit" disabled>确认付款</button></form><p>支付信息由 Stripe 安全处理，交易确认后到账。</p>`);
      const result = await account.api('checkout', { pack, request_id: requestId, ui_mode: 'elements' });
      if (!current(version) || signal.aborted) return;
      storage.setItem(pendingKey, result.session_id); storage.removeItem(attemptKey);
      const { mountCheckout } = await import('./checkout.js');
      if (!current(version) || signal.aborted) return;
      await mountCheckout({ root: modal, publishableKey: cfg().stripePublishableKey, clientSecret: result.client_secret, signal, onComplete(session) {
        if (!current(version)) return;
        storage.setItem(pendingKey, session); storage.removeItem(attemptKey);
        modal.close(); notice = '正在确认到账…'; draw(); void verify();
      } });
    } catch (e) {
      if (current(version) && !signal.aborted) {
        error = e.message; const box = modal.querySelector('[data-payment-error]');
        if (modal.open && box) { box.textContent = e.message; modal.querySelector('[data-payment-status]').textContent = ''; }
        else notify(e.message);
      }
    } finally { if (current(version)) { busy = false; draw(); } }
  }
  modal.addEventListener('close', () => { controller?.abort(); controller = null; busy = false; draw(); });
  return {
    mount(element) { root = element; draw(); void refresh(); void verify(); },
    sync() {
      if (observedConfig !== cfg()) { observedConfig = cfg(); draw(); }
      if (owner !== account.user?.uid) {
        owner = account.user?.uid; generation++; wallet = null; error = ''; notice = ''; busy = false; polling = false;
        if (controller) { controller.abort(); controller = null; if (modal.open) modal.close(); }
        const url = new URL(location.href), session = url.searchParams.get('session_id');
        if (owner && url.searchParams.get('checkout')) {
          if (/^cs_[\w]+$/.test(session || '')) storage.setItem(key(), session);
          if (url.searchParams.get('checkout') === 'cancelled') notice = '付款已取消。';
          url.searchParams.delete('session_id'); url.searchParams.delete('checkout'); history.replaceState({}, '', url);
        }
        draw(); void refresh(); void verify();
      }
    },
  };
}

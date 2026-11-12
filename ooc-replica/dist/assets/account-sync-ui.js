import {escapeHTML as esc} from './stream.js';
import {progressText} from './xichuan-state.js';
export function syncSummary(value, lang) {
  if (value?.['game.xichuan']) return progressText(value, lang);
  if (Array.isArray(value)) return lang === 'zh' ? `${value.length} 条记录` : `${value.length} records`;
  return lang === 'zh' ? '已保存的数据' : 'Saved data';
}
export function conflictMarkup(copies, lang = 'zh') {
  const t = (zh, en) => lang === 'zh' ? zh : en;
  const label = key => key === 'ooc-session-v2-xichuan' ? t('汐川故事', 'Xichuan story') :
    key.startsWith('ooc-session-v2-') ? t('角色聊天或故事记录', 'Chat or story records') :
    key === 'ooc-history' ? t('历史列表', 'History') : t('账号资料与偏好', 'Account details and preferences');
  return `<div data-no-i18n><h2>${t('选择要继续的进度', 'Choose which progress to continue')}</h2><p>${t('上次没能读到云端，本设备也留下了修改。现在两份数据不同，需要你选择。', 'The cloud was unavailable when this device made changes. The two copies now differ. Choose which to continue.')}</p>
    <ul>${copies.map(c => `<li style="margin:16px 0"><strong>${esc(label(c.key))}</strong><p>${t('本设备', 'This device')}：${esc(syncSummary(c.device, lang))}<br>${t('云端', 'Cloud')}：${esc(syncSummary(c.cloud, lang))}</p></li>`).join('')}</ul>
    <p>${t('选择云端会替换上面列出的本设备记录。替换前会保留本地备份。', 'Choosing the cloud replaces the listed records on this device. A local backup is kept before replacement.')}</p>
    <div style="display:flex;gap:12px;flex-wrap:wrap"><button class="primary" data-sync-device>${t('继续本设备版本并同步', 'Keep this device’s version and sync')}</button><button class="secondary" data-sync-cloud>${t('改用云端版本', 'Use the cloud version')}</button></div></div>`;
}
export function paintSyncStatus(account, {show, notify, doc = document} = {}) {
  let bar = doc.querySelector('#account-sync-status');
  if (!account.user || !account.syncError) {bar?.remove(); return;}
  if (!doc.querySelector('[data-sync-status-style]')) {
    const style = doc.createElement('style'); style.dataset.syncStatusStyle = '';
    style.textContent = '#account-sync-status{position:fixed;z-index:75;top:62px;right:12px;max-width:min(430px,calc(100vw - 24px));padding:10px 14px;border:1px solid #8c7850;border-radius:10px;background:#242018;color:#f5e8cf;font:13px/1.5 Inter,sans-serif;box-shadow:0 4px 20px #0005}#account-sync-status button{padding:6px 10px;margin-left:8px;border:1px solid #948269;border-radius:7px;background:#373027;color:inherit}';
    doc.head.append(style);
  }
  if (!bar) {bar = doc.createElement('div'); bar.id = 'account-sync-status'; bar.setAttribute('role', 'status'); bar.dataset.noI18n = ''; doc.body.append(bar);}
  const lang = doc.documentElement.lang.startsWith('zh') ? 'zh' : 'en', t = (zh, en) => lang === 'zh' ? zh : en;
  const conflict = Boolean(account.conflictKeys?.length);
  bar.innerHTML = `<span>${conflict ? t('本设备和云端的进度需要确认。', 'Your device and cloud progress need review.') : account.restoreError ? t('云端暂未连接，新进度仅保存在本设备。', 'Cloud unavailable. New progress stays on this device.') : t('新进度尚未同步，本设备副本仍保留。', 'Progress has not synced. Your device copy is safe.')}</span><button ${account.busy ? 'disabled' : ''}>${conflict ? t('查看并选择', 'Review copies') : t('重试连接', 'Retry connection')}</button>`;
  bar.querySelector('button').onclick = async () => {
    if (!conflict) {try {await account.retrySync();} catch {notify(t('重试失败，本设备记录仍保留。', 'Retry failed. Your device copy is retained.'));} return;}
    const owner = account.user;
    show(conflictMarkup(account.conflictCopies(), lang));
    const dialog = doc.querySelector('#modal');
    for (const choice of ['device', 'cloud']) dialog.querySelector(`[data-sync-${choice}]`).onclick = async () => {
      if (owner !== account.user) {dialog.close(); return;}
      try {await account.resolveConflicts(choice); dialog.close();}
      catch {notify(t('暂时无法保存选择，请保留此页面后重试。', 'Unable to save your choice. Keep this page open and retry.'));}
    };
  };
}

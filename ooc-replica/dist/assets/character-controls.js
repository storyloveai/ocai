import {escapeHTML as safe, markdown} from './stream.js';
import {characterReadingHTML, balanceCharacterAction} from './character-reading.js';

const words = {
  zh: {encounter: '相遇', memories: '记事', branches: '走向', pin: '记住这句话', unpin: '移出记事', fork: '从这里另开走向', rewrite: '从这句改写',
    empty: '在对话旁点“记住”，留下想在后面继续提起的话。', saidYou: '你说过', saidThey: '对方说过', remove: '移除', start: '开始这场相遇', initial: '最初的对话', active: '正在继续',
    delete: '删除这条走向', deleteAsk: '删除这条走向及其记事？正在继续的对话会保留。', confirm: '确认删除', cancel: '保留',
    memoryLimit: '已经记下六句话。先移除一条不再需要的记事，再留下新的。', branchLimit: '已经保存十六条走向。先移除不再需要的走向，再另开一条。',
    failure: '这次没有保存成功，原来的对话仍保留。请稍后再试。', error: '暂时无法保存', original: '原来的对话会保留，你可以随时切回来。'},
  en: {encounter: 'Encounter', memories: 'Memories', branches: 'Branches', pin: 'Remember this line', unpin: 'Remove this memory', fork: 'Branch from here', rewrite: 'Rewrite from this line',
    empty: 'Use “Remember” beside a message to keep a line you want to return to.', saidYou: 'You said', saidThey: 'They said', remove: 'Remove', start: 'Begin this encounter', initial: 'The first conversation', active: 'Continuing',
    delete: 'Delete this branch', deleteAsk: 'Delete this branch and its memories? Your active conversation will stay.', confirm: 'Delete branch', cancel: 'Keep it',
    memoryLimit: 'You have kept six memories. Remove one you no longer need before adding another.', branchLimit: 'You have sixteen branches. Remove one you no longer need before starting another.',
    failure: 'The change could not be saved. Your previous conversation is still kept. Please try again.', error: 'Unable to save', original: 'Your original conversation stays available. You can return to it.'}
};
export function attachCharacterControls({root, body, profile, manager, getMessages, isReady, reopen, modal, render}) {
  let pinnedTurns = new Set();
  const toolbar = document.createElement('nav'); toolbar.className = 'character-conversation-tools'; toolbar.setAttribute('data-no-i18n', '');
  body.before(toolbar);
  const lang = () => document.documentElement.lang?.startsWith('zh') ? 'zh' : 'en';
  const l = () => words[lang()];
  const message = error => error?.code === 'CHARACTER_MEMORY_LIMIT' ? l().memoryLimit : error?.code === 'CHARACTER_BRANCH_LIMIT' ? l().branchLimit : l().failure;
  function guarded(action) {try {action();} catch (error) {modal(l().error, `<p>${safe(message(error))}</p>`);}}
  const sceneName = thread => profile.scenes?.find(s => s.id === thread.sceneId)?.title[lang()] || profile.scene[lang()];
  const dialog = (title, html) => {const d = modal(title, html); d.classList.add('character-dialog'); return d;};
  function showMemories() {
    const pins = manager.pins(getMessages()), labels = l();
    const draw = d => {d.querySelector('[data-character-memory-list]').innerHTML = pins.length ? pins.map((p, i) => `<article><p class="character-memory-source">${p.role === 'user' ? labels.saidYou : labels.saidThey}</p><blockquote>${characterReadingHTML(markdown(balanceCharacterAction(p.text)),p.text)}</blockquote><button type="button" data-remove-memory="${i}">${labels.remove}</button></article>`).join('') : `<p class="character-empty">${labels.empty}</p>`;};
    const d = dialog(labels.memories, '<div data-character-memory-list></div>'); draw(d);
    d.onclick = event => {
      const b = event.target.closest('[data-remove-memory]'); if (!b) return;
      guarded(() => {manager.removePin(Number(b.dataset.removeMemory), getMessages()); d.close(); render(); update();});
    };
  }
  function showBranches() {
    const state = manager.metadata(), labels = l();
    const d = dialog(labels.branches, `<p class="character-dialog-note">${labels.original}</p><div class="character-branch-list">${state.threads.map(t => `<div><button type="button" data-select-branch="${safe(t.id)}" ${t.id === state.active ? 'aria-current="true"' : ''}><strong>${safe(t.label || sceneName(t) || labels.initial)}</strong><span>${safe(sceneName(t))}${t.id === state.active ? ' · ' + labels.active : ''}</span></button>${t.id !== state.active ? `<button type="button" data-delete-branch="${safe(t.id)}" aria-label="${labels.delete}">×</button>` : ''}</div>`).join('')}</div>`);
    d.onclick = event => {
      const choose = event.target.closest('[data-select-branch]'), remove = event.target.closest('[data-delete-branch]');
      if (choose) guarded(() => {if (choose.dataset.selectBranch === state.active) {d.close(); return;} const changed=manager.select(choose.dataset.selectBranch,getMessages());d.close();if(changed)reopen();else throw Error('Branch unavailable');});
      if (remove) {
        const branch = remove.dataset.deleteBranch; d.close();
        const confirm = dialog(labels.delete, `<p>${labels.deleteAsk}</p><div class="character-dialog-actions"><button type="button" data-confirm-delete>${labels.confirm}</button><button type="button" data-keep-branch>${labels.cancel}</button></div>`);
        confirm.querySelector('[data-keep-branch]').onclick = () => confirm.close();
        confirm.querySelector('[data-confirm-delete]').onclick = () => guarded(() => {manager.remove(branch); confirm.close(); update(); showBranches();});
      }
    };
  }
  function showEncounters() {
    const labels = l();
    const d = dialog(labels.encounter, `<div class="character-encounters">${profile.scenes.map(s => `<button type="button" data-start-encounter="${safe(s.id)}"><strong>${safe(s.title[lang()])}</strong><span>${safe(s.premise[lang()])}</span><span>${labels.start} ↗</span></button>`).join('')}</div><p class="character-dialog-note">${labels.original}</p>`);
    d.onclick = event => {const b = event.target.closest('[data-start-encounter]'); if (!b) return;
      const scene = profile.scenes.find(s => s.id === b.dataset.startEncounter);
      guarded(() => {manager.begin(scene.id, scene.title[lang()], getMessages()); d.close(); reopen();});
    };
  }
  function update() {
    const state = manager.metadata(), labels = l(), pins = manager.pins(getMessages());
    pinnedTurns = new Set(pins.map(p => p.turn));
    toolbar.setAttribute('aria-label', lang() === 'zh' ? '对话与记事' : 'Conversation and memories');
    toolbar.innerHTML = `${profile.scenes ? `<button type="button" data-character-encounters><span>${safe(sceneName(state.thread))}</span><span aria-hidden="true">⌄</span></button>` : `<span class="character-encounter-name">${safe(sceneName(state.thread))}</span>`}<div><button type="button" data-character-memories>${labels.memories}${pins.length ? ' · ' + pins.length : ''}</button><button type="button" data-character-branches>${labels.branches}${state.threads.length > 1 ? ' · ' + state.threads.length : ''}</button></div>`;
    const busy = !isReady();
    for (const b of [...toolbar.querySelectorAll('button'), ...root.querySelectorAll('[data-character-pin],[data-character-fork]')]) b.disabled = busy;
  }
  toolbar.onclick = event => {if(event.target.closest('button'))event.stopPropagation();if (!isReady()) return;
    if (event.target.closest('[data-character-memories]')) showMemories();
    if (event.target.closest('[data-character-branches]')) showBranches();
    if (event.target.closest('[data-character-encounters]')) showEncounters();
  };
  return {
    update,
    tools(message, at) {
      if (!message.text?.trim() || message.streaming || message.failed) return '';
      const labels = l(), pinned = pinnedTurns.has(at);
      return `<div class="character-message-tools" data-no-i18n><button type="button" data-character-pin="${at}" aria-pressed="${pinned}" aria-label="${pinned ? labels.unpin : labels.pin}">${pinned ? '◆' : '◇'} <span>${lang() === 'zh' ? '记住' : 'Remember'}</span></button><button type="button" data-character-fork="${at}">${message.role === 'user' ? labels.rewrite : labels.fork}</button></div>`;
    },
    handle(event) {
      const pin = event.target.closest('[data-character-pin]'), fork = event.target.closest('[data-character-fork]');
      if (!pin && !fork) return false;
      if (!isReady()) return true;
      guarded(() => {
        if (pin) {manager.pin(Number(pin.dataset.characterPin), getMessages()); render(); update();}
        else {
          const messages = getMessages(), at = Number(fork.dataset.characterFork), m = messages[at];
          if (!m) return;
          manager.fork(messages, m.role === 'user' ? at - 1 : at, {label: Array.from(m.text.replace(/[*\n]/g, ' ')).slice(0, 24).join('')});
          reopen(m.role === 'user' ? m.text : '');
        }
      }); return true;
    }
  };
}

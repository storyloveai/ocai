const copy = value => JSON.parse(JSON.stringify(value));
const shortText = value => {let text='';for(const c of String(value||'')){if(text.length+c.length>200)break;text+=c;}return text;};
const validMessages = value => Array.isArray(value) && value.every(m => m && ['user', 'assistant'].includes(m.role) && typeof m.text === 'string');
const makeId = () => globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
const activeViews = new Map();

// Account-scoped helpers are supplied by the website. Each branch has its own
// archive; the original v2 array stays available to history and older clients.
export function createCharacterThreads({id, read, save, defaultScene = null, now = Date.now, newId = makeId}) {
  const view = Symbol(id); activeViews.set(id, view);
  const key = 'ooc-session-v2-' + id, indexKey = key + '-threads';
  const archiveKey = branch => key + '-branch-' + branch;
  const fallback = () => ({version: 1, active: 'main', threads: [{id: 'main', sceneId: defaultScene, label: '', created: now(), pins: []}]});
  function index() {
    const value = read(indexKey, null);
    if (!value || value.version !== 1 || !Array.isArray(value.threads) || !value.threads.length ||
      !value.threads.every(t => t && typeof t.id === 'string' && /^[a-z0-9-]{1,60}$/i.test(t.id) && Array.isArray(t.pins)) ||
      !value.threads.some(t => t.id === value.active)) return fallback();
    return copy(value);
  }
  const initialIndex = index(), capturedBranch = initialIndex.active;
  const isCurrent = () => activeViews.get(id) === view && index().active === capturedBranch;
  const selected = state => state.threads.find(t => t.id === state.active);
  function storedMessages(state = index()) {
    const archive = read(archiveKey(state.active), null);
    if (validMessages(archive)) return copy(archive);
    const legacy = read(key, []); return validMessages(legacy) ? copy(legacy) : [];
  }
  function persistSwitch(previous, next, messages, previousMessages) {
    // Write recoverable archives before changing the active pointer.
    save(archiveKey(previous.active), copy(previousMessages));
    save(archiveKey(next.active), copy(messages));
    try { save(key, copy(messages)); save(indexKey, copy(next)); }
    catch (error) {
      try { save(key, copy(previousMessages)); save(indexKey, copy(previous)); } catch {}
      throw error;
    }
  }
  const matches = (pin, messages) => Number.isInteger(pin.turn) && pin.turn >= 0 &&
    messages[pin.turn]?.role === pin.role && shortText(messages[pin.turn].text) === pin.text &&
    !messages[pin.turn].failed && !messages[pin.turn].streaming;
  return {
    initial() {const state = index(); return {active: state.active, thread: copy(selected(state)), messages: storedMessages(state), threads: copy(state.threads)};},
    metadata() {const state = index(); return {active: state.active, thread: copy(selected(state)), threads: copy(state.threads)};},
    isCurrent,
    saveMessages(messages) {
      if (!isCurrent()) return false;
      const state = index(), thread = selected(state), pins = thread.pins.filter(p => matches(p, messages));
      if (read(indexKey, null)) save(archiveKey(state.active), copy(messages));
      save(key, copy(messages));
      if (pins.length !== thread.pins.length) {thread.pins = pins; save(indexKey, state);}
      return true;
    },
    begin(sceneId, label, messages) {
      if (!isCurrent()) return null;
      if (!read(indexKey, null) && !messages.length) {
        const state = index(); Object.assign(selected(state), {sceneId, label});
        save(archiveKey(state.active), []); save(indexKey, state); save(key, []); return state.active;
      }
      return this.fork(messages, -1, {sceneId, label});
    },
    fork(messages, through, {sceneId, label = ''} = {}) {
      if (!isCurrent()) return null;
      if (!Number.isInteger(through) || through < -1 || through >= messages.length) throw Error('Invalid conversation branch');
      const previous = index(), next = copy(previous), source = selected(previous);
      if (next.threads.length >= 16) throw Object.assign(Error('Keep up to 16 story branches. Remove an unused one first.'), {code: 'CHARACTER_BRANCH_LIMIT'});
      const branch = newId(); if (!/^[a-z0-9-]{1,60}$/i.test(branch) || next.threads.some(t => t.id === branch)) throw Error('Invalid branch ID');
      const scene = sceneId === undefined ? source.sceneId : sceneId;
      if (scene !== source.sceneId && through !== -1) throw Error('A new encounter needs a fresh conversation');
      const messagesInBranch = through < 0 ? [] : copy(messages.slice(0, through + 1));
      const pins = scene === source.sceneId ? source.pins.filter(p => p.turn <= through && matches(p, messagesInBranch)) : [];
      next.active = branch;
      next.threads.push({id: branch, sceneId: scene, label: String(label).slice(0, 60), created: now(), from: source.id, through, pins});
      persistSwitch(previous, next, messagesInBranch, messages); return branch;
    },
    select(branch, currentMessages) {
      if (!isCurrent()) return false;
      const previous = index(), next = copy(previous);
      if (!next.threads.some(t => t.id === branch)) return false;
      const target = read(archiveKey(branch), null); if (!validMessages(target)) return false;
      next.active = branch; persistSwitch(previous, next, target, currentMessages); return true;
    },
    remove(branch) {
      if (!isCurrent()) return false;
      const state = index(); if (branch === state.active || !state.threads.some(t => t.id === branch)) return false;
      state.threads = state.threads.filter(t => t.id !== branch); save(indexKey, state); save(archiveKey(branch), null); return true;
    },
    pin(turn, messages) {
      if (!isCurrent()) return false;
      const message = messages[turn]; if (!message?.text?.trim() || message.failed || message.streaming) return false;
      const state = index(), thread = selected(state), text = shortText(message.text);
      const found = thread.pins.findIndex(p => p.turn === turn && p.role === message.role && p.text === text);
      if (found >= 0) thread.pins.splice(found, 1);
      else {
        if (thread.pins.length >= 6) throw Object.assign(Error('Keep up to six memories. Remove one before adding another.'), {code: 'CHARACTER_MEMORY_LIMIT'});
        thread.pins.push({turn, role: message.role, text});
      }
      save(archiveKey(state.active), copy(messages)); save(indexKey, state); return true;
    },
    removePin(at, messages = storedMessages()) {
      if (!isCurrent()) return false;
      const state = index(), thread = selected(state); thread.pins = thread.pins.filter(p => matches(p, messages));
      thread.pins.splice(at, 1); save(indexKey, state); return true;
    },
    pins(messages) {return selected(index()).pins.filter(p => matches(p, messages));},
    memory(messages) {
      return selected(index()).pins.filter(p => matches(p, messages)).map(p =>
        (p.role === 'user' ? 'Visitor previously said: ' : 'Character previously said (a statement, not verified fact): ') + p.text).join('\n').slice(0, 1600);
    }
  };
}

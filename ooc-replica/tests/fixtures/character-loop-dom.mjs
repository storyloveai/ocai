import {parseHTML, DOMParser} from 'linkedom';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parentPort, workerData} from 'node:worker_threads';

const dist = fileURLToPath(new URL('../../dist/', import.meta.url));
export async function waitFor(predicate, message, timeout = 2500) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const result = predicate();
    if (result) return result;
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  throw Error(message);
}

export function createHistory(window, location, setLocation, initialState = {}) {
  const entries = [{href: location.href, state: structuredClone(initialState)}];
  let index = 0;
  return {
    get state() { return entries[index].state; },
    get length() { return entries.length; },
    replaceState(state, _title, path) {
      if (path != null) setLocation(path);
      entries[index] = {href: location.href, state: structuredClone(state)};
    },
    pushState(state, _title, path) {
      if (path != null) setLocation(path);
      entries.splice(index + 1); entries.push({href: location.href, state: structuredClone(state)}); index++;
    },
    go(delta) {
      const next = index + delta;
      if (!Number.isInteger(next) || next < 0 || next >= entries.length || next === index) return;
      index = next; setLocation(entries[index].href);
      const event = new window.Event('popstate'); event.state = structuredClone(entries[index].state); window.dispatchEvent(event);
    },
    back() { this.go(-1); },
    forward() { this.go(1); },
  };
}

// Runs the real app. Only browser APIs, the public config response and the iframe
// peer are supplied by the fixture; routing, profiles and persistence stay real.
export async function boot({path = '/characters', entries = [], configured = false, mockChat = false, restoreAfterProfileMount = false, historyState = {}} = {}) {
  const {window, document} = parseHTML(await readFile(join(dist, 'index.html'), 'utf8'));
  const values = new Map([['sd.lang', 'zh'], ...entries]), writes = [], requests = [], chatBodies = [];
  let observedRestoring = false;
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { writes.push([key, value]); values.set(key, value); },
    removeItem: key => values.delete(key),
  };
  const location = {origin: 'https://preview.example'};
  const setLocation = path => {
    const url = new URL(path, location.href || location.origin);
    Object.assign(location, {href: url.href, pathname: url.pathname, search: url.search, hash: url.hash});
  };
  setLocation(path);
  const history = window.history = createHistory(window, location, setLocation, historyState);
  const append = window.HTMLElement.prototype.append;
  window.HTMLElement.prototype.append = function (...nodes) {
    const result = append.apply(this, nodes);
    for (const node of nodes) if (node.tagName === 'LINK') queueMicrotask(() => node.onload?.());
    return result;
  };
  let activeElement = null;
  Object.defineProperty(document, 'activeElement', {configurable: true, get: () => activeElement?.isConnected ? activeElement : document.body, set: value => { activeElement = value; }});
  window.HTMLElement.prototype.focus = function () { document.activeElement = this; };
  window.HTMLElement.prototype.setSelectionRange = function (start, end, direction = 'none') {
    this.selectionStart = start; this.selectionEnd = end; this.selectionDirection = direction;
  };
  window.HTMLElement.prototype.blur = function () { document.activeElement = null; };
  window.HTMLElement.prototype.scrollIntoView = function () {};
  window.HTMLElement.prototype.showModal = function () { this.open = true; this.setAttribute('open', ''); };
  window.HTMLElement.prototype.close = function () { this.open = false; this.removeAttribute('open'); };
  window.scrollTo = () => {};
  window.requestAnimationFrame = callback => setTimeout(callback, 0);
  Object.assign(globalThis, {
    window, document, DOMParser, location, history, localStorage: storage,
    sessionStorage: {getItem: key => null, setItem() {}, removeItem() {}},
    CustomEvent: window.CustomEvent, Event: window.Event,
    addEventListener: window.addEventListener.bind(window),
    removeEventListener: window.removeEventListener.bind(window),
    dispatchEvent: window.dispatchEvent.bind(window),
    matchMedia: () => ({matches: true}),
    fetch: async (path, options) => {
      requests.push([String(path), options?.method || 'GET']);
      if (path === '/api/config') {
        if (restoreAfterProfileMount) {
          await waitFor(() => document.querySelector('[data-fw-restoring]'), 'profile did not mount its account-restoration state');
          observedRestoring = true;
        }
        return Response.json({auth: null, configured, model: configured ? 'Fixture model' : '', billing: {enabled: false}});
      }
      if (path === '/api/chat' && mockChat) {
        const body = JSON.parse(options.body);
        chatBodies.push(body);
        const reply = body.task === 'suggestions' ? JSON.stringify(['First?', 'Second?', 'Third?']) : 'Fixture reply';
        return new Response(reply, {headers:{'Content-Type':'text/plain'}});
      }
      if (String(path).startsWith('/api/')) throw Error('Unexpected external operation: ' + path);
      return new Response(await readFile(join(dist, path)), {headers: {'Content-Type': 'application/json'}});
    },
  });
  await import('../../dist/app.js');
  await waitFor(() => !document.querySelector('[data-xichuan-wait],[data-fw-restoring]') && !document.body.hasAttribute('data-booting'), 'app did not restore the local session');
  const go = async path => {
    history.pushState({}, '', path);
    const event = new window.Event('popstate'); event.state = history.state; window.dispatchEvent(event);
    await new Promise(resolve => setTimeout(resolve, 0));
  };
  const click = async selector => {
    const target = document.querySelector(selector);
    if (!target) throw Error('Missing control: ' + selector);
    const event = new window.Event('click', {bubbles: true, cancelable: true});
    Object.assign(event, {button: 0}); target.dispatchEvent(event);
    await new Promise(resolve => setTimeout(resolve, 0));
  };
  const peer = () => {
    const frame = document.querySelector('#xichuan-frame'), messages = [];
    if (!frame) throw Error('Xichuan host is not mounted');
    const peer = {postMessage: data => messages.push(structuredClone(data))};
    Object.defineProperty(frame, 'contentWindow', {configurable: true, value: peer});
    const send = data => {
      const event = new window.Event('message');
      Object.assign(event, {data, origin: location.origin, source: peer}); window.dispatchEvent(event);
    };
    return {frame, messages, send};
  };
  return {window, document, location, history, values, writes, requests, chatBodies, storage, go, click, peer, get observedRestoring() { return observedRestoring; }};
}

// A fresh worker represents a browser reload, so no module cache, route state or
// in-memory account scope can accidentally make the persistence check pass.
if (parentPort) {
  try {
    const f = await boot(workerData);
    await waitFor(() => {
      const profile = f.document.querySelector('[data-fw-page="profile"]');
      if (profile) {
        const state = profile.querySelector('[data-fw-profile-state]');
        if (!state || state.querySelector('[data-fw-restoring]')) return false;
        // A new profile has no progress text. Wait for the restored account's
        // real actions, rather than requiring empty status placeholders.
        if (profile.querySelector('[data-fw-profile-draft]')) return state.querySelector('[data-fw-chat-entry]');
        return state.childElementCount > 0;
      }
      return f.document.querySelector('#xichuan-frame') || f.document.querySelector('#session-input') || f.document.querySelector('[data-fw-page="characters"] #fw-lib-results') || f.document.querySelector('[data-story-characters]');
    }, 'requested route did not finish restoring its dynamic state');
    if (workerData.exerciseAI) {
      await f.click('[data-control="model"]');
      const choice=f.document.querySelector('.interaction-modal[open] select[aria-label="Response mode"] option[value="ai"]');
      if (!choice || choice.disabled) throw Error('The configured model is not available in the reply-mode control');
      choice.selected=true;
      await f.click('.interaction-modal[open] .save');
    }
    if (workerData.exerciseDemo || workerData.exerciseAI) {
      const line = workerData.exerciseDemo || workerData.exerciseAI;
      const input = f.document.querySelector('#session-input');
      input.value = line;
      input.dispatchEvent(new f.window.Event('input', {bubbles: true}));
      await f.click('[data-control="send"]');
      await waitFor(() => {
        const messages = JSON.parse(f.values.get('ooc-session-v2-' + f.location.pathname.split('/').pop()) || '[]');
        return messages.at(-2)?.text === line && messages.at(-1)?.role === 'assistant' && messages.at(-1).text && !messages.at(-1).streaming;
      }, 'reply did not complete after reload', 8000);
      if (workerData.exerciseAI) await waitFor(() => f.document.querySelector('[data-suggest]'), 'mock suggestions did not finish');
    }
    let snapshot = null;
    if (f.document.querySelector('#xichuan-frame')) {
      const peer = f.peer(); peer.send({type: 'xc-ready'});
      snapshot = peer.messages.find(message => message.type === 'xc-init')?.snapshot;
    }
    const directory = f.document.querySelector('[data-fw-page="characters"]');
    const story = f.document.querySelector('[data-story-characters]');
    parentPort.postMessage({
      path: f.location.pathname,
      search: f.location.search, hash: f.location.hash, historyState: f.history.state,
      profileId: f.document.querySelector('[data-fw-character]')?.dataset.fwCharacter,
      profileBack: f.document.querySelector('[data-fw-page="profile"] .fw-back')?.getAttribute('href'),
      directory: directory ? {
        world: directory.querySelector('[data-fw-world][aria-pressed="true"]')?.dataset.fwWorld || null,
        chat: directory.querySelector('[data-fw-chat]').getAttribute('aria-pressed') === 'true',
        cards: [...directory.querySelectorAll('.fw-card')].map(card => card.getAttribute('href')),
      } : null,
      story: story ? {
        id: story.dataset.storyCharacters,
        characters: [...story.querySelectorAll('a[href^="/characters/"]')].map(link => link.getAttribute('href')),
        playUrl: f.document.querySelector(`[data-story-play="${story.dataset.storyCharacters}"]`)?.getAttribute('href'),
      } : null,
      text: f.document.querySelector('[data-fw-page="profile"]')?.textContent || f.document.querySelector('#session-messages')?.textContent || '',
      snapshot, entries: [...f.values], requests: f.requests, chatBodies: f.chatBodies, observedRestoring: f.observedRestoring,
    });
  } catch (error) { parentPort.postMessage({error: error.stack}); }
}

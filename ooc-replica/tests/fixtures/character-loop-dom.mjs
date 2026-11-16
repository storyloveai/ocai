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

// Runs the real app. Only browser APIs, the public config response and the iframe
// peer are supplied by the fixture; routing, profiles and persistence stay real.
export async function boot({path = '/characters', entries = [], configured = false, restoreAfterProfileMount = false} = {}) {
  const {window, document} = parseHTML(await readFile(join(dist, 'index.html'), 'utf8'));
  const values = new Map([['sd.lang', 'zh'], ...entries]), writes = [], requests = [];
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
  const history = window.history = {
    state: {},
    replaceState(state, _title, path) { this.state = state; if (path != null) setLocation(path); },
    pushState(state, _title, path) { this.state = state; if (path != null) setLocation(path); },
  };
  const append = window.HTMLElement.prototype.append;
  window.HTMLElement.prototype.append = function (...nodes) {
    const result = append.apply(this, nodes);
    for (const node of nodes) if (node.tagName === 'LINK') queueMicrotask(() => node.onload?.());
    return result;
  };
  Object.defineProperty(document, 'activeElement', {configurable: true, writable: true, value: null});
  window.HTMLElement.prototype.focus = function () { document.activeElement = this; };
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
      if (String(path).startsWith('/api/')) throw Error('Unexpected external operation: ' + path);
      return new Response(await readFile(join(dist, path)), {headers: {'Content-Type': 'application/json'}});
    },
  });
  await import('../../dist/app.js');
  await waitFor(() => !document.querySelector('[data-xichuan-wait],[data-fw-restoring]') && !document.body.hasAttribute('data-booting'), 'app did not restore the local session');
  const go = async path => {
    setLocation(path); window.dispatchEvent(new window.Event('popstate'));
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
  return {window, document, location, values, writes, requests, storage, go, click, peer, get observedRestoring() { return observedRestoring; }};
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
        // Xia Zhiyao's shell appears before account.init() restores its private
        // progress. Capture only after both actual dynamic status fields mount.
        if (profile.dataset.fwCharacter === 'xc-zhiyao') return state.querySelector('[data-fw-chat-status]') && state.querySelector('[data-fw-progress]');
        return state.childElementCount > 0;
      }
      return f.document.querySelector('#xichuan-frame') || f.document.querySelector('#session-input');
    }, 'requested route did not finish restoring its dynamic state');
    if (workerData.exerciseDemo) {
      const input = f.document.querySelector('#session-input');
      input.value = workerData.exerciseDemo;
      input.dispatchEvent(new f.window.Event('input', {bubbles: true}));
      await f.click('[data-control="send"]');
      await waitFor(() => {
        const messages = JSON.parse(f.values.get('ooc-session-v2-xc-zhiyao') || '[]');
        return messages.at(-2)?.text === workerData.exerciseDemo && messages.at(-1)?.role === 'assistant' && messages.at(-1).text && !messages.at(-1).streaming;
      }, 'demo reply did not complete after reload', 5000);
    }
    let snapshot = null;
    if (f.document.querySelector('#xichuan-frame')) {
      const peer = f.peer(); peer.send({type: 'xc-ready'});
      snapshot = peer.messages.find(message => message.type === 'xc-init')?.snapshot;
    }
    parentPort.postMessage({
      path: f.location.pathname,
      profileId: f.document.querySelector('[data-fw-character]')?.dataset.fwCharacter,
      text: f.document.querySelector('[data-fw-page="profile"]')?.textContent || f.document.querySelector('#session-messages')?.textContent || '',
      snapshot, entries: [...f.values], requests: f.requests, observedRestoring: f.observedRestoring,
    });
  } catch (error) { parentPort.postMessage({error: error.stack}); }
}

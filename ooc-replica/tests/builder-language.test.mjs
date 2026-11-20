import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML, DOMParser} from 'linkedom';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setLang, startI18n} from '../dist/assets/site-i18n.js';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

test('builder translates its own interface in place while preserving content, state and in-flight AI', async t => {
  const {document, window} = parseHTML('<html><head><link href="/style.css"></head><body><main id="main"></main><dialog id="modal"></dialog></body></html>');
  const append = window.HTMLElement.prototype.append;
  window.HTMLElement.prototype.append = function (...nodes) {
    const result = append.apply(this, nodes);
    for (const node of nodes) if (node.tagName === 'LINK') queueMicrotask(() => node.onload?.());
    return result;
  };
  let focused;
  Object.defineProperty(document, 'activeElement', {configurable: true, get: () => focused?.isConnected ? focused : document.body});
  window.HTMLElement.prototype.focus = function () { focused = this; };
  Object.defineProperty(window.HTMLElement.prototype, 'open', {configurable: true, get() { return this.hasAttribute('open'); }});
  window.HTMLElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new window.Event('close')); };
  const language = new Map([['sd.lang', 'zh']]);
  window.localStorage = {getItem: key => language.get(key) ?? null, setItem: (key, value) => language.set(key, value)};
  const location = {pathname: '/builder', search: '', origin: 'https://replica.example'};
  window.history = {replaceState(_a, _b, path) { location.pathname = path; }};
  let streamController, requestSignal, generationStarted, chatCalls = 0;
  const encoder = new TextEncoder();
  Object.assign(globalThis, {
    document, window, DOMParser, location, localStorage: window.localStorage,
    matchMedia: () => ({matches: true}),
    fetch: async (path, options) => {
      if (path === '/api/config') return Response.json({configured: true, billing: {enabled: false}});
      if (path === '/api/chat') {
        chatCalls++; requestSignal = options.signal;
        const body = JSON.parse(options.body);
        assert.equal(body.idea, 'Default');
        return new Response(new ReadableStream({start(controller) {
          streamController = controller;
          controller.enqueue(encoder.encode('{"type":"text","text":"Profile Default"}\n'));
          generationStarted();
        }}), {headers: {'Content-Type': 'application/x-ndjson'}});
      }
      return new Response(await readFile(join(dist, path)), {headers: {'Content-Type': 'application/json'}});
    },
  });
  const values = new Map([['ooc-custom', [{id: 'draft-language-story', type: 'story', title: 'Profile', description: 'Default', details: 'Profile Default', prologue: 'Profile', opening: 'Default', scenario: 'Default', guide: 'Default', suggestions: ['Profile', 'Default'], status: 'draft', visibility: 'private'}]]]);
  let dialogCount = 0;
  const h = {
    read: (key, fallback) => values.get(key) ?? fallback,
    save: (key, value) => values.set(key, structuredClone(value)),
    navigate() {}, data: [], categories: [],
    show(html) { dialogCount++; const dialog = document.querySelector('#modal'); dialog.innerHTML = html; dialog.setAttribute('open', ''); },
  };
  startI18n({win: window, doc: document});
  const chooseLanguage = async lang => { setLang(lang, {win: window, doc: document}); await tick(); };
  const {showBuilder,guardBuilderLeave,preserveBuilderDraft} = await import('../dist/assets/builder.js');

  await t.test('three steps and publish validation use creator-specific bilingual copy without translating user words', async () => {
    showBuilder('/builder', h); await tick();
    assert.match(document.querySelector('.builder-choice').textContent, /创建作品/);
    assert.match(document.querySelector('[data-create-type=story]').textContent, /互动故事/);
    location.pathname = '/builder/story/draft-language-story'; showBuilder(location.pathname, h); await tick();
    assert.deepEqual([...document.querySelectorAll('[data-builder-step]')].map(b => b.textContent.replace(/[1-3*]/g, '')), ['作品信息', '基本设定', '开场']);
    assert.doesNotMatch(document.querySelector('.builder-editor').textContent, /个人资料/);
    assert.equal(document.querySelector('[name=title]').value, 'Profile');
    assert.equal(document.querySelector('[name=description]').value, 'Default');
    assert.equal(document.querySelector('[data-draft-preview] h3').textContent, 'Profile');
    assert.equal(document.querySelector('[data-draft-preview] .builder-scene p').textContent, 'Profile');
    assert.equal(document.querySelector('[data-draft-preview] .builder-preview-card p').textContent, 'Default');

    const save = document.querySelector('[data-draft-save]'), header = document.querySelector('.builder-header');
    document.querySelector('[data-builder-step="1"]').click();
    const details = document.querySelector('[name=details]'), form = document.querySelector('.builder-fields');
    details.focus();
    assert.equal(document.querySelector('label[for=draft-details]').textContent, '故事设定');
    await chooseLanguage('en');
    assert.equal(document.querySelector('[name=details]'), details);
    assert.equal(document.querySelector('.builder-fields'), form);
    assert.equal(document.querySelector('.builder-header'), header);
    assert.equal(document.querySelector('[data-draft-save]'), save);
    assert.equal(document.activeElement, details);
    assert.equal(details.value, 'Profile Default');
    assert.equal(document.querySelector('label[for=draft-details]').textContent, 'Story Details');
    assert.match(document.querySelector('[data-builder-step="0"]').textContent, /Title Information/);
    await chooseLanguage('zh');
    document.querySelector('[data-builder-step="2"]').click();
    const opening = document.querySelector('[name=opening]');
    assert.equal(document.querySelector('label[for=draft-opening]').textContent, '开场内容');
    assert.equal(document.querySelector('[name=scenario]').value, 'Default');
    opening.value = ''; opening.oninput();
    document.querySelector('[data-draft-review]').click();
    const publish = document.querySelector('[data-review-publish]');
    assert.equal(publish.disabled, true);
    assert.match(document.querySelector('.builder-checklist').textContent, /开场内容/);
    assert.match(document.querySelector('.builder-review').textContent, /补全以上必填项/);
    publish.focus(); await chooseLanguage('en');
    assert.equal(document.querySelector('[data-review-publish]'), publish);
    assert.equal(document.activeElement, publish);
    assert.equal(publish.disabled, true);
    assert.match(document.querySelector('.builder-review').textContent, /Complete the required fields/);
    document.querySelector('#modal').close();
    opening.value = 'Default'; opening.oninput();
    await chooseLanguage('zh');
  });

  await t.test('language changes preserve dirty and saved states and the published title', async () => {
    const status = document.querySelector('[data-draft-status]');
    assert.equal(status.textContent, '有未保存的修改');
    await chooseLanguage('en'); assert.equal(status.textContent, 'Unsaved changes');
    const back = document.querySelector('.builder-header>a');
    back.onclick(new window.Event('click', {cancelable: true}));
    assert.ok(document.querySelector('[data-save-leave]'));
    await chooseLanguage('zh'); assert.equal(document.querySelector('[data-save-leave]').textContent, '保存并离开');
    document.querySelector('#modal').close();
    document.querySelector('[data-draft-save]').click();
    const savedText = status.textContent;
    assert.match(savedText, /^草稿已保存 /);
    await chooseLanguage('en'); assert.match(status.textContent, /^Draft saved /);
    await chooseLanguage('zh'); assert.equal(status.textContent, savedText);
    const before = dialogCount;
    back.onclick(new window.Event('click', {cancelable: true}));
    assert.equal(dialogCount, before, 'saved edits must not become dirty after a language change');
    document.querySelector('[data-draft-review]').click();
    assert.equal(document.querySelector('[data-review-publish]').disabled, false);
    await document.querySelector('[data-review-publish]').onclick();
    const name = document.querySelector('.builder-review strong');
    const successButton = document.querySelector('[data-published-play]');
    assert.equal(name.textContent, 'Profile');
    assert.equal(successButton.textContent, '开始体验');
    assert.match(document.querySelector('.builder-review').textContent, /已保存到“我的作品”/);
    const published = structuredClone(values.get('ooc-custom'));
    successButton.focus(); await chooseLanguage('en');
    assert.equal(document.querySelector('.builder-review strong'), name);
    assert.equal(document.querySelector('[data-published-play]'), successButton);
    assert.equal(document.activeElement, successButton);
    assert.equal(name.textContent, 'Profile');
    assert.equal(status.textContent, 'Published');
    await chooseLanguage('zh'); assert.equal(status.textContent, '已发布');
    assert.equal(name.textContent, 'Profile');
    assert.deepEqual(values.get('ooc-custom'), published);
    assert.equal(published[0].publishedId, 'u-language-story');
    document.querySelector('#modal').close();
  });

  await t.test('switching language leaves AI seed, candidates, focus and the active request intact', async () => {
    document.querySelector('[data-builder-step="0"]').click();
    document.querySelector('.builder-fields [name=description]').oninput();
    document.querySelector('[data-expand-field=description]').click();
    const idea = document.querySelector('#ai-idea'), result = document.querySelector('#ai-result');
    const go = document.querySelector('[data-ai-generate]');
    assert.equal(idea.value, 'Default');
    assert.match(document.querySelector('.builder-ai h2').textContent, /用 AI 扩写简介/);
    const started = new Promise(resolve => { generationStarted = resolve; });
    const pending = go.onclick(); await started; await tick();
    assert.equal(result.value, 'Profile Default');
    let left=false;
    assert.equal(guardBuilderLeave(()=>{left=true;}),false);
    assert.equal(preserveBuilderDraft(),false,'legacy-history fallback also leaves an active request and candidate intact');
    assert.equal(left,false);
    assert.equal(document.querySelector('#ai-result'),result,'departure protection does not replace an active AI dialog');
    result.focus(); await chooseLanguage('en');
    assert.equal(document.querySelector('#ai-idea'), idea);
    assert.equal(document.querySelector('#ai-result'), result);
    assert.equal(document.querySelector('[data-ai-generate]'), go);
    assert.equal(document.activeElement, result);
    assert.equal(idea.value, 'Default');
    assert.equal(result.value, 'Profile Default');
    assert.equal(requestSignal.aborted, false);
    assert.equal(go.disabled, true);
    assert.equal(chatCalls, 1);
    await chooseLanguage('zh');
    streamController.enqueue(encoder.encode('{"type":"done"}\n')); streamController.close(); await pending;
    assert.equal(requestSignal.aborted, false);
    assert.equal(chatCalls, 1);
    assert.equal(result.value, 'Profile Default');
    assert.equal(document.querySelector('[name=description]').value, 'Default');
    assert.match(document.querySelector('[data-ai-status]').textContent, /已生成，请审阅后再使用/);
    assert.equal(document.querySelector('[data-ai-apply]').disabled, false);
    document.querySelector('#modal').close();
    document.querySelector('[data-generate-cover]').click();
    const seed = document.querySelector('#cover-idea');
    assert.equal(seed.value, 'Profile — Default');
    await chooseLanguage('en'); assert.equal(document.querySelector('#cover-idea'), seed); assert.equal(seed.value, 'Profile — Default');
    await chooseLanguage('zh'); assert.equal(seed.value, 'Profile — Default');
    assert.equal(values.get('ooc-custom')[0].description, 'Default');
    assert.equal(chatCalls, 1);
  });
});

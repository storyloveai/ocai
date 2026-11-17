import test from 'node:test';
import assert from 'node:assert/strict';
import {boot, waitFor} from './fixtures/character-loop-dom.mjs';

const layouts = [
  {id:'xc-zhiyao', image:'/assets/xichuan/art/sprites/zhiyao/normal.webp', zh:'查看立绘', en:'View portrait', character:true, back:'/characters/xc-zhiyao'},
  {id:'story-005', image:'/assets/originals/story-005.webp', zh:'查看封面', en:'View cover', character:false, back:'/story/story-005'},
];
const previous = [{role:'user',text:'这段对话已经存在。'}, {role:'assistant',text:'我还记得。'}];
const authoredGuide = '先观察，再向钟表匠问路。<img src=x onerror="window.injected=true"> & 保留这句原文。';
const published = {id:'settings-guide-draft',publishedId:'u-settings-guide',status:'published',type:'story',title:'作者提示样本',description:'一段已有作品的说明。',details:'钟表匠的店。',opening:'你来到店门口。',guide:authoredGuide,image:'/assets/originals/story-005.webp'};
const oldSettings = new Map(layouts.map((layout,index) => ['ooc-situation-image-'+layout.id, JSON.stringify(index === 1)]));
const input = f => f.document.querySelector('#session-input');
const settings = f => f.document.querySelector('#session-settings');
const openDialog = f => f.document.querySelector('.interaction-modal[open]');
const edit = (f,text) => {
  input(f).value = text;
  input(f).dispatchEvent(new f.window.Event('input',{bubbles:true}));
};
async function closeDialog(f) {
  await f.click('.interaction-modal[open] .modal-close');
  assert.equal(openDialog(f),null);
}
function keyboard(f,values) {
  const event = new f.window.Event('keydown',{bubbles:true,cancelable:true});
  Object.assign(event,values);
  f.document.dispatchEvent(event);
}
function assertHeaderBack(f,href) {
  const back = f.document.querySelector('[data-session-back]');
  assert.ok(back,'the phone header has a real return action');
  assert.equal(back.tagName,'A');
  assert.equal(back.getAttribute('href'),href);
  assert.equal(back.getAttribute('href'),f.document.querySelector('[data-session-title]')?.closest('a')?.getAttribute('href'),'the return action follows the actual title destination');
  assert.equal(back.style.getPropertyValue('min-width'),'44px');
  assert.equal(back.style.getPropertyValue('min-height'),'44px');
  assert.ok(back.getAttribute('aria-label'));
  assert.ok(back.getAttribute('title'));
  return back;
}

test('chat settings expose actual controls in both layouts without changing conversations or legacy preferences', async t => {
  const profile = {name:'测试读者',audience:'All'};
  const entries = [...oldSettings, ['ooc-profile',JSON.stringify(profile)], ['ooc-custom',JSON.stringify([published])], ...layouts.map(({id}) => ['ooc-session-v2-'+id,JSON.stringify(previous)])];
  const f = await boot({path:'/characters',entries,configured:false});
  const {setLang} = await import('../dist/assets/site-i18n.js');
  // This fixture supplies no global MutationObserver, so startI18n uses its
  // static fallback. Exercise the same public language operation directly.
  const language = lang => setLang(lang,{win:globalThis,doc:f.document});
  try {
    for (const layout of layouts) {
      await t.test(layout.character ? 'character settings keep the portrait, help and a working close control' : 'story settings keep the cover, help and a working close control', async () => {
        await f.go('/play/'+layout.id);
        await waitFor(() => input(f),'the real session did not mount');
        language('zh');
        const draft = '这句还没有发送，先看看设置。';
        edit(f,draft);
        const composer = input(f), toggle = f.document.querySelector('[data-control="settings"]');
        const back = assertHeaderBack(f,layout.back), backLabels = [];
        await f.click('[data-control="settings"]');
        assert.equal(settings(f).classList.contains('session-open'),true);
        assert.equal(settings(f).inert,false);
        assert.equal(settings(f).querySelector('[role="switch"],[role="region"]'),null,'unimplemented switches and carousel are removed');
        const labels = [...settings(f).querySelectorAll('button')].map(button => button.dataset.sessionSetting || button.textContent.trim());
        for (const label of ['Avatars','Character Preview','Start Settings','形象','角色预览','开始设置']) assert.equal(labels.includes(label),false,label+' must not remain a false control');
        assert.doesNotMatch(settings(f).textContent,/Start Settings|开始设置/,'the unused group heading is removed with its button');
        const close = settings(f).querySelector('[data-session-close]');
        assert.ok(close,'settings has an explicit close control');
        assert.equal(close.hidden,false);
        assert.equal(close.closest('[class~="ts:hidden"]'),null,'the close action remains outside the phone-only header');
        assert.equal(close.style.getPropertyValue('min-width'),'44px');
        assert.equal(close.style.getPropertyValue('min-height'),'44px');
        assert.ok(close.getAttribute('aria-label'),'close has an accessible name');
        assert.equal(close.parentElement.querySelectorAll('button').length,1,'the shared title row retains only its working close action');
        assert.equal([...settings(f).querySelectorAll('.sticky button')].filter(button => button !== close).length,0,'the title row has no unused pencil or empty duplicate action');
        assert.ok(f.document.querySelector('[data-control="model"]'),'the real model control remains');
        assert.ok(settings(f).querySelector('a[href="/credit"]'),'the real Credits entry remains');
        assert.ok(settings(f).querySelector('[data-session-setting="Memories"]'),'the existing note control remains');
        if (!layout.character) assert.ok(settings(f).querySelector('[data-session-setting="Output Length"]'),'story output length remains');
        if (layout.character) assert.ok(f.document.querySelector('.character-conversation-tools'),'existing conversation branches and memories remain');

        for (const lang of ['zh','en']) {
          language(lang);
          assert.equal(assertHeaderBack(f,layout.back),back,'language changes update the existing return link');
          backLabels.push([back.getAttribute('aria-label'),back.getAttribute('title')]);
          await waitFor(() => settings(f).querySelector('[data-session-setting="View image"]')?.textContent.trim() === layout[lang],'the image action did not follow '+lang);
          const imageButton = settings(f).querySelector('[data-session-setting="View image"]');
          assert.ok(imageButton);
          await f.click('#session-settings [data-session-setting="View image"]');
          const imageDialog = openDialog(f);
          assert.ok(imageDialog);
          assert.equal(imageDialog.querySelectorAll('img').length,1,'the viewer shows a single real image');
          assert.equal(imageDialog.querySelector('img').getAttribute('src'),layout.image);
          assert.equal(imageDialog.querySelector('[role="region"],[role="switch"]'),null);
          await closeDialog(f);

          const help = settings(f).querySelector('[data-session-setting="Chat help"]');
          assert.ok(help);
          assert.equal(help.textContent.trim(),lang === 'zh' ? '聊天操作说明' : 'Chat controls');
          await f.click('#session-settings [data-session-setting="Chat help"]');
          const helpText = openDialog(f)?.textContent || '';
          assert.equal(openDialog(f).querySelector('[data-author-guide]'),null,'ordinary chat help does not invent an author guide');
          if (lang === 'zh') {
            assert.match(helpText,/聊天操作说明/);
            assert.match(helpText,/作者|(?:只|仅).{0,8}聊天|不是.{0,8}(?:作品|玩法)/,'generic chat help must not pretend to be the author’s story guide');
            assert.match(helpText,/发送/);
            assert.match(helpText,/换行/);
          } else {
            assert.match(helpText,/Chat controls/);
            assert.match(helpText,/author|only.*chat|chat.*only|chat window[’']s controls|not.*story.*guide/i);
            assert.match(helpText,/send/i);
            assert.match(helpText,/line|newline/i);
          }
          await closeDialog(f);
          assert.equal(input(f),composer,'passive tools keep the original composer node');
          assert.equal(composer.value,draft);
        }
        assert.notEqual(backLabels[0][0],backLabels[1][0],'the return accessible name follows the UI language');
        assert.notEqual(backLabels[0][1],backLabels[1][1],'the return tooltip follows the UI language');

        keyboard(f,{key:'?',code:'Slash',ctrlKey:true,shiftKey:true});
        const shortcuts = openDialog(f);
        assert.ok(shortcuts,'the existing keyboard-help shortcut still opens its dialog');
        assert.doesNotMatch(shortcuts.textContent,/Ctrl\+Alt\+N|Ctrl\+Shift\+E|Focus Input Field|聚焦输入框/);
        for (const implemented of ['Ctrl+Shift+S','Ctrl+0','Ctrl+Alt+R']) assert.ok(shortcuts.textContent.includes(implemented),implemented+' remains documented');
        await closeDialog(f);

        await f.click('#session-settings [data-session-close]');
        assert.equal(settings(f).classList.contains('session-open'),false);
        assert.equal(settings(f).inert,true);
        assert.equal(toggle.getAttribute('aria-expanded'),'false');
        assert.equal(f.document.activeElement,toggle,'closing settings restores focus to the toggle');
        assert.equal(input(f),composer);
        assert.equal(composer.value,draft,'opening and closing tools never consumes the unsent draft');
        await f.click('[data-onboard]');
        assert.equal(f.location.pathname,'/profile','the session identity uses the real profile page');
        assert.deepEqual(JSON.parse(f.values.get('ooc-profile')),profile,'viewing settings does not rename the account');
        await f.go('/play/'+layout.id);
        await waitFor(() => input(f),'the session did not mount for the real return action');
        const returnLink = assertHeaderBack(f,layout.back);
        if (!layout.character) assert.equal(returnLink.hasAttribute('data-full-info'),true,'Story return opens full information instead of another preview dialog');
        await f.click('[data-session-back]');
        assert.equal(f.location.pathname,layout.back,'the header return changes the actual route');
        assert.equal(input(f),null,'the former session is removed after returning');
      });
    }
    await t.test('published author tips share the chat-help dialog as escaped, untranslated original text',async () => {
      await f.go('/play/'+published.publishedId);
      await waitFor(() => input(f),'the existing published story did not mount');
      assertHeaderBack(f,'/my-title');
      language('en');
      await f.click('[data-control="settings"]');
      await f.click('#session-settings [data-session-setting="Chat help"]');
      const dialog = openDialog(f),guide = dialog.querySelector('[data-author-guide]');
      assert.ok(guide,'the published guide remains available in the existing help action');
      assert.match(guide.textContent,/Author play tips/);
      assert.ok(guide.textContent.includes(authoredGuide),'the author’s exact text is preserved');
      assert.equal(guide.querySelector('img,script,[onerror]'),null,'author text is escaped instead of becoming executable markup');
      language('zh');
      const translated = dialog.querySelector('[data-author-guide]');
      assert.match(translated.textContent,/作者玩法提示/);
      assert.ok(translated.textContent.includes(authoredGuide),'changing UI language never rewrites the author’s words');
      assert.equal(translated.querySelector('img,script,[onerror]'),null);
      await closeDialog(f);
      assert.deepEqual(JSON.parse(f.values.get('ooc-custom')),[published],'viewing author tips never rewrites the published title');
      await f.click('[data-session-back]');
      assert.equal(f.location.pathname,'/my-title','the local published title returns to its existing library');
    });
    await t.test('an authorized public title keeps Community as its real header return destination',async () => {
      const id = 'u-settings-public', path = '/api/titles?id='+id, fetchBefore = globalThis.fetch;
      globalThis.fetch = async (input,options) => {
        if (input !== path) return fetchBefore(input,options);
        const method = options?.method || 'GET';
        f.requests.push([path,method]);
        assert.equal(method,'GET','the public metadata lookup is read-only');
        return Response.json({title:{id,type:'story',title:'Public story fixture',description:'An existing public title.',details:'A quiet shop.',opening:'You reach the shop.',scenario:'Default',guide:'',image:'/assets/originals/story-005.webp'}});
      };
      try {
        await f.go('/play/'+id);
        await waitFor(() => f.document.querySelector('[data-session-back]')?.getAttribute('href') === '/community','the public title did not restore its Community destination');
        assertHeaderBack(f,'/community');
      } finally { globalThis.fetch = fetchBefore; }
    });
    for (const [key,value] of oldSettings) {
      assert.equal(f.values.get(key),value,'legacy preference remains recoverable');
      assert.equal(f.writes.some(([written]) => written === key),false,'removed controls never write a legacy preference');
    }
    for (const {id} of layouts) assert.deepEqual(JSON.parse(f.values.get('ooc-session-v2-'+id)),previous,'passive settings never generate or rewrite messages');
    assert.deepEqual(f.requests.filter(([path]) => path.startsWith('/api/')),[['/api/config','GET'],['/api/titles?id=u-settings-public','GET']],'settings only load public configuration and the explicitly mocked public title; no model or wallet is called');
  } finally {
    const interaction = await import('../dist/assets/interaction.js');
    interaction.show('/no-session',{});
    clearInterval(f.window.carousel);
  }
});

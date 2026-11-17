import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {readFile} from 'node:fs/promises';
import {boot, waitFor} from './fixtures/character-loop-dom.mjs';
import {XICHUAN_KEY, LATEST, storyContext} from '../dist/assets/xichuan-state.js';
import {createAccount} from '../dist/assets/account.js';
import {roleFor} from '../server/roles.js';
import CC from '../server/xichuan-core.cjs';

const campaign = JSON.parse(await readFile(new URL('../server/xichuan-campaign.json', import.meta.url)));
const save = flags => ({
  G: {...CC.newGame(campaign), v: {...CC.newGame(campaign).v, ...flags}},
  V: {queue: [], i: 0, sprites: {}, log: []}, at: Date.now(),
});
const chatKey = 'ooc-session-v2-xc-zhiyao';
async function reload(options) {
  const worker = new Worker(new URL('./fixtures/character-loop-dom.mjs', import.meta.url), {workerData: options});
  try {
    const result = await new Promise((resolve, reject) => {
      worker.once('message', resolve); worker.once('error', reject);
      worker.once('exit', code => { if (code) reject(Error('Reload worker exited: ' + code)); });
    });
    assert.equal(result.error, undefined, result.error);
    return result;
  } finally { await worker.terminate(); }
}

test('character link helpers preserve identity and old-link context without accepting unknown characters', async () => {
  const {CHARACTER_HOME, characterProfileUrl, canonicalCharacterUrl, characterDirectoryReturn, characterReturnUrl, storyReturnUrl, isCharacterJourney} = await import('../dist/assets/character-links.js');
  const {CHARACTER_CARDS} = await import('../dist/assets/flywheel/cards-data.js');
  const {storydateCharacters} = await import('../dist/assets/storydate-originals.js');
  assert.equal(CHARACTER_HOME, '/characters');
  assert.equal(canonicalCharacterUrl('/character?world=xichuan#cast'), '/characters?world=xichuan#cast');
  for (const card of CHARACTER_CARDS) {
    const canonical = '/characters/' + card.id;
    assert.equal(characterProfileUrl(card.id), canonical);
    if (!card.chat) continue;
    const chatId = card.chat.split('/').pop();
    assert.equal(characterProfileUrl(chatId), canonical, `${chatId} retains the existing chat identity`);
    assert.equal(canonicalCharacterUrl('/character/' + chatId + '?source=history#experiences'), canonical + '?source=history#experiences');
  }
  for (const title of storydateCharacters) {
    const canonical = characterProfileUrl(title.id);
    assert.ok(canonical?.startsWith('/characters/'), `${title.id} from the existing public chat catalogue has one canonical profile`);
    assert.equal(canonicalCharacterUrl('/character/' + title.id), canonical);
    assert.equal(canonicalCharacterUrl('/characters/' + title.id), canonical);
    assert.equal(roleFor(title.id).mode, 'character');
  }
  assert.equal(canonicalCharacterUrl('/characters/xc-zhiyao'), '/characters/xc-zhiyao');
  assert.equal(characterProfileUrl('u-private-creator'), null);
  assert.equal(canonicalCharacterUrl('/character/u-private-creator'), '/character/u-private-creator');
  assert.equal(canonicalCharacterUrl('/play/xc-zhiyao'), '/play/xc-zhiyao');
  assert.equal(characterDirectoryReturn('/characters'), '/characters');
  assert.equal(characterDirectoryReturn('/characters?source=home&world=xichuan#cast'), '/characters?source=home&world=xichuan#cast');
  for (const unsafe of ['//outside.example/characters', 'https://outside.example/characters', '/characters-extra', '/characters/xc-zhiyao', '/play/xc-zhiyao']) {
    assert.equal(characterDirectoryReturn(unsafe), null, 'return context only accepts the exact local directory: ' + unsafe);
  }
  assert.equal(characterReturnUrl('/character/sgc-002?say=private#memory'), '/characters/sg-caocao');
  assert.equal(characterReturnUrl('/play/xc-zhiyao?say=private&source=profile'), '/play/xc-zhiyao');
  for (const unsafe of ['//outside.example/play/xc-zhiyao', 'https://outside.example/characters/xc-zhiyao', '/characters/not-a-person', '/play/not-a-character', '/story/xichuan']) assert.equal(characterReturnUrl(unsafe), null);
  for (const [old, canonical] of [['/universe', '/'], ['/frameworks', '/'], ['/universe/xichuan', '/story/xichuan'], ['/universe/sanguo', '/story/three-kingdoms'], ['/universe/westlin', '/story/ashen-crown'], ['/universe/baker', '/story/baker-street']]) assert.equal(canonicalCharacterUrl(old), canonical);
  assert.equal(storyReturnUrl('/story/xichuan?say=private#cast'), '/story/xichuan');
  for (const unsafe of ['//outside.example/story/xichuan', 'https://outside.example/story/xichuan', '/story/not-a-story', '/story/xichuan/extra', '/play/xichuan']) assert.equal(storyReturnUrl(unsafe), null);
  for (const id of ['sg-001', 'sg-002', 'sg-003', 'sg-004', 'sg-005', 'sg-006', 'sg-007', 'sg-008', 'xichuan', 'three-kingdoms', 'three-kingdoms-ink']) assert.equal(isCharacterJourney('/play/' + id), true, id + ' retains its character source during real site play');
  for (const path of ['/play/sg-002-extra', '/play/sg-002/extra', '/play/not-a-story', '/play/ashen-crown', '/play/baker-street', '/play/__proto__', '//outside.example/play/sg-002', 'https://outside.example/play/sg-002']) assert.equal(isCharacterJourney(path), false, path + ' is not a real site play URL');
});

test('local walkthrough reflects canon flags and treats false or absent progress as unplayed facts', async () => {
  const {xichuanDemoReply, xichuanDemoStarters} = await import('../dist/assets/xichuan-demo.js');
  const {XICHUAN_FACT_LABELS} = await import('../dist/assets/flywheel/cards-data.js');
  for (const [key, label] of Object.entries(XICHUAN_FACT_LABELS)) assert.deepEqual(label, campaign.vars[key].label, `${key} uses the campaign's actual bilingual fact`);
  const earlier = {[LATEST]: save({'flag.joined_club': false, 'flag.z_promised': false})};
  const before = structuredClone(earlier);
  assert.match(xichuanDemoReply({raw: earlier, language: 'en'}), /not reached.*join/i);
  assert.match(xichuanDemoStarters(earlier, 'en')[0], /where do we start/i);
  assert.match(xichuanDemoReply({language: 'en'}), /not reached.*join/i);
  const pinned = [{role: 'assistant', text: 'unverified assistant assertion'}, {role: 'user', text: 'I kept the cinema ticket.'}];
  assert.ok(xichuanDemoReply({raw: earlier, pins: pinned, language: 'en'}).includes(pinned[1].text));
  assert.equal(xichuanDemoReply({raw: earlier, pins: pinned.slice(0, 1), language: 'en'}).includes(pinned[0].text), false);
  for (const [flags, expected] of [
    [{'flag.joined_club': true}, /you joined the film club/i],
    [{'flag.z_promised': true}, /promised to stand/i],
    [{'flag.z_promised': true, 'flag.z_broke_promise': true}, /missed our promise/i],
    [{'flag.z_promised': true, 'flag.z_broke_promise': true, 'flag.broken_zhiyao': true}, /still unresolved/i],
  ]) assert.match(xichuanDemoReply({raw: {[LATEST]: save(flags)}, language: 'en'}), expected);
  assert.deepEqual(earlier, before, 'a chat reply does not advance or mutate the game save');
});

test('real app connects profiles, local chat, current story memory and reloads through existing save keys', async t => {
  const f = await boot({path: '/character?world=xichuan'});
  const profile = () => f.document.querySelector('[data-fw-page="profile"]');
  const read = key => JSON.parse(f.values.get(key) || 'null');
  const selectStory=async value=>{const select=f.document.querySelector('[data-fw-world-select]');select.querySelectorAll('option').forEach(option=>option.removeAttribute('selected'));select.querySelector('option[value="'+value+'"]').setAttribute('selected','');select.dispatchEvent(new f.window.Event('change',{bubbles:true}));await new Promise(resolve=>setTimeout(resolve,0));};
  let future;
  try {
    await t.test('retired world and format links lead to established Story pages without starting a game', async () => {
      const before = f.values.get(XICHUAN_KEY);
      for (const [oldPath, path, storyId] of [
        ['/universe', '/'], ['/frameworks', '/'],
        ['/universe/xichuan', '/story/xichuan', 'xichuan'],
        ['/universe/sanguo', '/story/three-kingdoms', 'three-kingdoms'],
        ['/universe/westlin', '/story/ashen-crown', 'ashen-crown'],
        ['/universe/baker', '/story/baker-street', 'baker-street'],
      ]) {
        await f.go(oldPath);
        assert.equal(f.location.pathname, path, oldPath + ' has one established destination');
        assert.equal(f.document.querySelector('.fw-nav'), null);
        assert.equal(f.document.querySelector('#xichuan-frame'), null, 'a Story detail does not auto-start its player');
        if (storyId) assert.ok(f.document.querySelector(`[data-story-characters="${storyId}"] a[href^="/characters/"]`), 'the real detail links its existing cast');
      }
      await f.go('/universe/original');
      assert.equal(f.location.pathname, '/characters'); assert.equal(new URLSearchParams(f.location.search).get('world'), 'original');
      assert.equal(f.document.querySelectorAll('#fw-lib-results .fw-card').length, 3);
      await f.go('/universe/not-a-world');
      assert.ok(f.document.querySelector('[data-fw-page="missing"] .fw-missing a[href="/"]'));
      assert.equal(f.values.get(XICHUAN_KEY), before);
      await f.go('/studio');
      assert.equal(f.location.pathname, '/builder', 'visiting the old studio with no backup reuses the existing workshop');
      assert.equal(f.values.has('sd-flywheel-drafts'), false);
      await f.go('/character?world=xichuan');
    });

    await t.test('a real biography keeps its character source through play, refresh and the session information preview', async () => {
      const character = '/characters/sg-caocao';
      await f.go(character);
      await f.click('a.fw-appearance[href="/story/sg-002"]');
      assert.equal(f.location.pathname, '/story/sg-002');
      assert.equal(f.history.state.characterReturn, character);
      await f.click('[data-story-play="sg-002"]');
      await waitFor(() => f.document.querySelector('#session-input'), 'the real biography did not open its existing session');
      assert.equal(f.location.pathname, '/play/sg-002');
      assert.equal(f.history.state.characterReturn, character, 'playing the biography preserves the original character source');
      const refreshed = await reload({path: f.location.pathname, entries: [...f.values], historyState: f.history.state});
      assert.equal(refreshed.path, '/play/sg-002');
      assert.equal(refreshed.historyState.characterReturn, character);
      await f.click('a[href="/story/sg-002"] [data-session-title]');
      assert.ok(f.document.querySelector('#title-preview [data-story-characters="sg-002"]'));
      await f.click('#title-preview [data-story-information="sg-002"][data-full-info]');
      assert.equal(f.location.pathname, '/story/sg-002');
      assert.equal(f.history.state.characterReturn, character);
      assert.equal(f.document.querySelector('.shell-page-header a').getAttribute('href'), character);
      await f.click('.shell-page-header a');
      assert.equal(profile().dataset.fwCharacter, 'sg-caocao');
      assert.equal(f.values.has('ooc-session-v2-sg-caocao'), false, 'a profile pathname never becomes a new chat identity');
    });

    await t.test('a character and the real Story detail share one Xichuan save and return to the actual entry source', async () => {
      const previous = f.values.get(XICHUAN_KEY), current = save({'flag.joined_club': true});
      const envelope = JSON.stringify({[LATEST]: current});
      f.values.set(XICHUAN_KEY, envelope);
      try {
        await f.go('/characters/xc-shencheng?say=private-unsubmitted-text&source=profile');
        await f.click('.fw-persona a[href="/story/xichuan"]');
        assert.equal(f.location.pathname, '/story/xichuan');
        assert.equal(f.document.querySelector('#xichuan-frame'), null, 'reading the real Story detail does not mount the game');
        const cast = f.document.querySelector('[data-story-characters="xichuan"]');
        assert.ok(cast.querySelector('a[href="/characters/xc-shencheng"]'));
        assert.equal(cast.querySelectorAll('a[href^="/characters/"]').length, 5);
        assert.equal(f.history.state.characterReturn, '/characters/xc-shencheng', 'source context contains only the actual profile pathname');
        assert.equal(f.document.querySelector('[data-story-play="xichuan"]').getAttribute('href'), '/play/xichuan');
        const restoredDetail = await reload({path: '/story/xichuan', entries: [...f.values], historyState: f.history.state});
        assert.equal(restoredDetail.story.id, 'xichuan');
        assert.equal(restoredDetail.story.playUrl, '/play/xichuan');
        assert.ok(restoredDetail.story.characters.includes('/characters/xc-shencheng'));
        await f.click('[data-story-characters="xichuan"] a[href="/characters/xc-shencheng"]');
        await waitFor(profile, 'the real Story cast did not open its character');
        assert.equal(profile().querySelector('.fw-back').getAttribute('href'), '/story/xichuan', 'a character opened from Story returns to that same real Story');
        await f.click('[data-fw-page="profile"] .fw-back');
        assert.ok(f.document.querySelector('[data-story-characters="xichuan"]'));
        await f.click('[data-story-play="xichuan"]');
        let peer = f.peer(); peer.send({type: 'xc-ready'});
        assert.deepEqual(peer.messages.find(message => message.type === 'xc-init').snapshot.latest, current);
        assert.equal(f.document.querySelectorAll('.xc-header a').length, 1, 'the host has one source-specific return, not competing destinations');
        assert.equal(new URL(f.document.querySelector('[data-xichuan-return]').getAttribute('href'), f.location.href).pathname, '/characters/xc-shencheng');
        await f.click('[data-xichuan-return]'); await waitFor(profile, 'the game did not return to Shen Cheng’s actual profile');
        assert.equal(profile().dataset.fwCharacter, 'xc-shencheng');
        assert.equal(f.values.get(XICHUAN_KEY), envelope);
        assert.equal(f.values.has('ooc-session-v2-xc-shencheng'), false, 'story access does not invent an unavailable Shen Cheng chat');
        await f.go('/story/xichuan');
        await f.click('[data-story-play="xichuan"]');
        peer = f.peer(); peer.send({type: 'xc-ready'});
        assert.deepEqual(peer.messages.find(message => message.type === 'xc-init').snapshot.latest, current);
        assert.equal(new URL(f.document.querySelector('[data-xichuan-return]').getAttribute('href'), f.location.href).pathname, '/story/xichuan', 'a direct Story entry returns to that Story');
        await f.click('[data-xichuan-return]');
        assert.ok(f.document.querySelector('[data-story-characters="xichuan"]'));
        assert.equal(f.values.get(XICHUAN_KEY), envelope, 'both entrances retain the same unchanged canonical envelope');
      } finally {
        if (previous === undefined) f.values.delete(XICHUAN_KEY); else f.values.set(XICHUAN_KEY, previous);
        await f.go('/character?world=xichuan');
      }
    });

    await t.test('combined directory choices survive browser history, profile/chat/story returns and fresh URL reloads', async () => {
      await f.go('/characters?source=home#cast');
      const initialLength = f.history.length;
      await selectStory('xichuan');
      await f.click('[data-fw-chat]');
      const search = f.document.getElementById('fw-search'); search.value = '夏知遥'; search.focus();
      search.dispatchEvent(new f.window.Event('input', {bubbles: true}));
      assert.equal(f.history.length, initialLength + 2, 'world/chat push while query replaces the current entry');
      assert.equal(f.document.activeElement, search);
      assert.equal(f.document.querySelectorAll('#fw-lib-results .fw-card').length, 1);
      const directoryUrl = f.location.pathname + f.location.search + f.location.hash;
      const directoryHistoryLength = f.history.length;
      const assertDirectory = () => {
        assert.equal(f.location.pathname + f.location.search + f.location.hash, directoryUrl);
        assert.equal(f.document.getElementById('fw-search').value, '夏知遥');
        assert.equal(f.document.querySelector('[data-fw-world-select]').value, 'xichuan');
        assert.equal(f.document.querySelector('[data-fw-chat]').getAttribute('aria-pressed'), 'true');
        assert.equal(f.document.querySelectorAll('#fw-lib-results .fw-card').length, 1);
      };
      await f.click('#fw-lib-results a[href="/characters/xc-zhiyao"]');
      await waitFor(profile, 'directory card did not open its profile');
      assert.equal(f.history.state.discoveryReturn, directoryUrl);
      assert.equal(profile().querySelector('.fw-back').getAttribute('href'), directoryUrl);
      f.history.back(); await waitFor(() => f.document.querySelector('#fw-search'), 'browser Back did not restore the directory'); assertDirectory();
      f.history.forward(); await waitFor(profile, 'browser Forward did not restore the profile');
      await f.click('[data-fw-chat-entry]');
      await waitFor(() => f.document.querySelector('#session-input'), 'chat did not open from the filtered profile');
      assert.equal(f.history.state.discoveryReturn, directoryUrl);
      await f.click('a[href="/characters/xc-zhiyao"]'); await waitFor(profile, 'chat did not return to the same profile');
      assert.equal(profile().querySelector('.fw-back').getAttribute('href'), '/play/xc-zhiyao', 'a profile opened from chat returns to that chat');
      await f.click('[data-fw-story-entry]');
      const peer = f.peer(); peer.send({type: 'xc-ready'});
      assert.equal(f.history.state.discoveryReturn, directoryUrl);
      assert.equal(new URL(f.document.querySelector('[data-xichuan-return]').getAttribute('href'), f.location.href).pathname, '/characters/xc-zhiyao');
      await f.click('[data-xichuan-return]'); await waitFor(profile, 'the story did not return to its source profile');
      await f.click('[data-fw-chat-entry]'); await waitFor(() => f.document.querySelector('#session-input'), 'the source profile did not reopen the same chat');
      await f.click('a[href="/characters/xc-zhiyao"]'); await waitFor(profile, 'story/chat chain did not return to profile');
      const reloadedProfile = await reload({path: '/characters/xc-zhiyao', entries: [...f.values], historyState: f.history.state});
      assert.equal(reloadedProfile.profileBack, '/play/xc-zhiyao', 'a profile reload preserves its immediate chat return');
      assert.equal(reloadedProfile.historyState.discoveryReturn, directoryUrl, 'the earlier filtered directory remains available in native history');
      f.history.go(directoryHistoryLength - f.history.length);
      await waitFor(() => f.document.querySelector('#fw-search'), 'history did not return to the original filtered directory'); assertDirectory();
      const reloadedDirectory = await reload({path: directoryUrl, entries: [...f.values]});
      assert.deepEqual(reloadedDirectory.directory, {query: '夏知遥', world: 'xichuan', chat: true, cards: ['/characters/xc-zhiyao']});
      assert.equal(reloadedDirectory.hash, '#cast');
      assert.equal(new URLSearchParams(reloadedDirectory.search).get('source'), 'home');
      assert.deepEqual(f.requests.filter(([path]) => path.startsWith('/api/')), [['/api/config', 'GET']], 'browsing and unsent local chat never call a model or wallet');
      await f.go('/character?world=xichuan');
    });

    await t.test('unknown and prototype world URLs cannot revive earlier filters, even after a refresh', async () => {
      await f.go('/characters?world=xichuan&chat=1&q=夏知遥');
      for (const world of ['__proto__', 'toString', 'constructor', 'not-a-world']) {
        await f.go('/characters?world=' + world);
        assert.equal(f.document.querySelectorAll('#fw-lib-results .fw-card').length, 33);
        assert.equal(f.document.getElementById('fw-search').value, '');
        assert.equal(f.document.querySelector('[data-fw-chat]').getAttribute('aria-pressed'), 'false');
        assert.equal(f.document.querySelector('[data-fw-world-select]').value, 'all');
      }
      const reloaded = await reload({path: '/characters?world=__proto__'});
      assert.equal(reloaded.directory.world, 'all'); assert.equal(reloaded.directory.chat, false); assert.equal(reloaded.directory.query, '');
      assert.equal(reloaded.directory.cards.length, 33);
      await f.go('/character?world=xichuan');
    });

    await t.test('legacy library and profile links reach the same canonical directory and identity', async () => {
      assert.equal(f.location.pathname, '/characters');
      assert.equal(f.document.querySelectorAll('[data-fw-page="characters"] .fw-card').length, 5);
      assert.equal(f.document.querySelectorAll('[data-shrink] a[href="/characters"]').length, 1);
      assert.equal(f.document.querySelector('[data-shrink] a[href="/character"]'), null);
      await f.go('/character/xc-zhiyao?source=old#experiences');
      await waitFor(profile, 'old character link did not reach the profile');
      assert.equal(f.location.pathname, '/characters/xc-zhiyao');
      assert.equal(f.location.search, '?source=old');
      assert.equal(f.location.hash, '#experiences');
      assert.equal(profile().dataset.fwCharacter, 'xc-zhiyao');
      assert.ok(profile().querySelector('.fw-ctas a[href="/play/xc-zhiyao"]'));
      assert.ok(profile().querySelector('.fw-ctas a[href="/play/xichuan"]'));
      const {storydateCharacters} = await import('../dist/assets/storydate-originals.js');
      const {characterProfileUrl} = await import('../dist/assets/character-links.js');
      for (const title of storydateCharacters) {
        await f.go('/character/' + title.id);
        assert.equal(f.location.pathname, characterProfileUrl(title.id));
        assert.equal(profile().dataset.fwCharacter, f.location.pathname.split('/').pop());
        assert.ok(profile().querySelector(`[data-fw-chat-entry][href="/play/${title.id}"]`), `${title.id} keeps its established chat entry`);
      }
      await f.go('/characters/xc-zhiyao');
      assert.equal([...f.values.keys()].filter(key => key.startsWith('ooc-session-v2-')).length, 0, 'viewing an alias does not create a session');
    });

    await t.test('unconfigured preview labels local scripted chat and sends no model or credit requests', async () => {
      await f.click('.fw-ctas a[href="/play/xc-zhiyao"]');
      const input = await waitFor(() => f.document.querySelector('#session-input'), 'character chat did not mount');
      assert.match(f.document.querySelector('#session-messages').textContent, /演示|Demo/);
      assert.match(f.document.querySelector('#session-messages').textContent, /不调用\s*AI|No AI|scripted|simulated/i);
      input.value = '我想先了解潮声影院。';
      input.dispatchEvent(new f.window.Event('input', {bubbles: true}));
      await f.click('[data-control="send"]');
      await waitFor(() => read(chatKey)?.some(message => message.role === 'assistant' && message.text && !message.streaming), 'local preview did not persist a completed reply', 5000);
      assert.ok(read(chatKey).some(message => message.role === 'user' && message.text === '我想先了解潮声影院。'));
      assert.equal(f.document.querySelector('.session-error'), null);
      assert.deepEqual(f.requests.filter(([path]) => path.startsWith('/api/')), [['/api/config', 'GET']]);
      assert.equal(f.document.querySelector('.interaction-modal[open]'), null);
      await f.click('[data-character-pin="0"]');
      assert.equal(f.document.querySelector('[data-character-pin="0"]').getAttribute('aria-pressed'), 'true');
      await f.click('[data-character-pin="1"]');
      assert.equal(f.document.querySelector('[data-character-pin="1"]').getAttribute('aria-pressed'), 'true');
      await f.click('a[href="/characters/xc-zhiyao"]');
      await waitFor(profile, 'chat return did not reach its unified profile');
      assert.match(profile().querySelector('[data-fw-chat-entry]').textContent, /继续|continu/i);
      assert.ok(profile().querySelector('[data-fw-experiences]').textContent.includes('我想先了解潮声影院。'));
      assert.ok([...profile().querySelectorAll('[data-fw-experiences] cite')].some(cite => /演示|demo/i.test(cite.textContent)), 'a pinned scripted response remains clearly identified as a demo');
    });

    await t.test('host bridge persists the current save and chat displays its acquired facts', async () => {
      await f.click('.fw-ctas a[href="/play/xichuan"]');
      const peer = f.peer();
      assert.ok(peer.frame.getAttribute('src').startsWith('/assets/xichuan/index.html?site=1'));
      peer.send({type: 'xc-ready'});
      assert.equal(peer.messages.find(message => message.type === 'xc-init').snapshot.latest, undefined);
      future = save({'flag.z_promised': true, 'flag.knows_mom': true});
      peer.send({type: 'xc-save', key: 'auto', value: future});
      assert.deepEqual(read(XICHUAN_KEY)[LATEST], future);
      assert.equal(new URL(f.document.querySelector('[data-xichuan-return]').getAttribute('href'), f.location.href).pathname, '/characters/xc-zhiyao');
      await f.click('[data-xichuan-return]'); await waitFor(profile, 'the story did not return to its source profile');
      await f.click('[data-fw-chat-entry]');
      await waitFor(() => f.document.querySelector('#session-input'), 'story return did not open chat');
      assert.match(f.document.querySelector('.xc-chat-bridge').textContent, /答应|promis/i);
      assert.equal(read(chatKey).filter(message => message.role === 'user').length, 1, 'returning to chat preserves the existing thread');
      const role = roleFor('xc-zhiyao', {xichuan: storyContext(read(XICHUAN_KEY))});
      assert.deepEqual(role.storyProgress.facts.map(fact => fact.id).sort(), ['flag.knows_mom', 'flag.z_promised']);
      const input = f.document.querySelector('#session-input');
      input.value = '你还记得我们的约定和我留下的话吗？';
      input.dispatchEvent(new f.window.Event('input', {bubbles: true}));
      await f.click('[data-control="send"]');
      await waitFor(() => read(chatKey)?.filter(message => message.role === 'user').length === 2 && read(chatKey)?.at(-1)?.role === 'assistant' && read(chatKey).at(-1).text && !read(chatKey).at(-1).streaming, 'story-aware local reply did not complete', 5000);
      assert.match(read(chatKey).at(-1).text, /答应|promis/i);
      assert.ok(read(chatKey).at(-1).text.includes('我想先了解潮声影院。'), 'the local reply carries the actual pinned user line');
      assert.equal(read(chatKey).at(-1).transport, 'demo', 'demo provenance survives persistence');
      await f.click('a[href="/characters/xc-zhiyao"]');
      await waitFor(profile, 'chat header did not return to profile');
      assert.match(profile().querySelector('[data-fw-progress]').textContent, /答应|promis/i);
      const actions = [...profile().querySelectorAll('.fw-ctas a')];
      assert.equal(actions[0].getAttribute('href'), '/play/xichuan', 'a played story becomes the first continuation action');
      assert.equal(actions[0].classList.contains('fw-btn-secondary'), false);
      assert.equal(profile().querySelector('[data-fw-chat-entry]').classList.contains('fw-btn-secondary'), true);
      assert.equal(profile().querySelector('[data-fw-experiences]').closest('[aria-live],[role="status"]'), null);
      const rawBefore = f.values.get(XICHUAN_KEY);
      await f.go('/characters/xc-zhiyao');
      assert.equal(f.values.get(XICHUAN_KEY), rawBefore, 'the profile reads progress without rewriting it');
    });

    await t.test('fresh app instances restore the same chat and iframe progress without new aliases', async () => {
      const entries = [...f.values];
      const restoredProfile = await reload({path: '/character/xc-zhiyao', entries, restoreAfterProfileMount: true});
      assert.equal(restoredProfile.observedRestoring, true, 'reload waits through a real restoring profile before capturing its private state');
      assert.equal(restoredProfile.path, '/characters/xc-zhiyao');
      assert.equal(restoredProfile.profileId, 'xc-zhiyao');
      assert.match(restoredProfile.text, /答应|promis/i);
      assert.match(restoredProfile.text, /继续|continu/i);
      const restoredStory = await reload({path: '/play/xichuan', entries});
      assert.deepEqual(restoredStory.snapshot.latest, future, 'the real iframe initializes from the account-scoped persisted envelope');
      const restoredChat = await reload({path: '/play/xc-zhiyao', entries});
      assert.ok(restoredChat.text.includes('我想先了解潮声影院。'));
      assert.deepEqual(restoredChat.requests.filter(([path]) => path.startsWith('/api/')), [['/api/config', 'GET']]);
      const expected = entries.filter(([key]) => key.startsWith('ooc-session-v2-')).map(([key]) => key).sort();
      assert.deepEqual(expected, [chatKey, chatKey + '-threads', chatKey + '-branch-main', XICHUAN_KEY].sort());
      assert.ok(restoredProfile.text.includes('我想先了解潮声影院。'), 'a fresh profile restores real pinned memories');
      const configured = await reload({path: '/play/xc-zhiyao', entries: [...entries, ['ooc-response-mode', '"ai"']], configured: true, exerciseDemo: '再聊一句。'});
      assert.deepEqual(configured.requests.filter(([path]) => path.startsWith('/api/')), [['/api/config', 'GET']], 'an available model and a generic AI preference never opt this walkthrough into paid requests');
      const configuredMessages = JSON.parse(new Map(configured.entries).get(chatKey));
      assert.equal(configuredMessages.at(-1).transport, 'demo');
      assert.match(configuredMessages.at(-1).text, /答应|promis/i);
      assert.ok(configuredMessages.at(-1).text.includes('我想先了解潮声影院。'));
    });

    await t.test('story viewport observers detach on route leave and stale layout callbacks cannot affect a later view', () => verifyPlayerLayoutLifecycle(f));

    await t.test('loading an older save removes future facts from the profile and chat', async () => {
      await f.go('/play/xc-zhiyao'); await waitFor(() => f.document.querySelector('#session-input'), 'the chat did not mount before continuing the story');
      await f.click('[data-xichuan-entry]');
      const peer = f.peer(); peer.send({type: 'xc-ready'});
      peer.send({type: 'xc-save', key: 'latest', value: save({})});
      assert.equal(new URL(f.document.querySelector('[data-xichuan-return]').getAttribute('href'), f.location.href).pathname, '/play/xc-zhiyao');
      await f.click('[data-xichuan-return]');
      await waitFor(() => f.document.querySelector('#session-input'), 'chat did not resume after rollback');
      assert.doesNotMatch(f.document.querySelector('.xc-chat-bridge').textContent, /答应|promis/i);
      assert.equal(roleFor('xc-zhiyao', {xichuan: storyContext(read(XICHUAN_KEY))}).storyProgress.facts.length, 0);
      await f.click('a[href="/characters/xc-zhiyao"]');
      await waitFor(profile, 'profile did not render after rollback');
      assert.doesNotMatch(profile().querySelector('[data-fw-progress]').textContent, /答应|promis/i);
      const restoredStory = await reload({path: '/play/xichuan', entries: [...f.values]});
      assert.equal(storyContext({[LATEST]: restoredStory.snapshot.latest}).flags['flag.z_promised'], false);
    });

    await t.test('profile hydration hides the previous account and rejects its stale scope', () => verifyProfileHydration(f));
    await t.test('guest legacy progress remains read-only and is never attached to a signed-in account', () => verifyLegacyProgress(f));
    await t.test('profiles follow actual conversation branches and validate pinned source text', () => verifyBranchMemories(f));
  } finally {
    await f.go('/characters'); clearInterval(f.window.carousel);
  }
});

async function verifyPlayerLayoutLifecycle(f) {
  const previousObserver = globalThis.ResizeObserver, previousViewport = f.window.visualViewport;
  const add = f.window.addEventListener, remove = f.window.removeEventListener;
  const windowResizes = new Set(), viewportResizes = new Set(), observers = [];
  const viewport = {
    height: 800,
    addEventListener(type, callback) { if (type === 'resize') viewportResizes.add(callback); },
    removeEventListener(type, callback) { if (type === 'resize') viewportResizes.delete(callback); },
  };
  globalThis.ResizeObserver = class {
    targets = []; disconnected = false;
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe(target) { this.targets.push(target); }
    disconnect() { this.disconnected = true; }
  };
  f.window.visualViewport = viewport;
  f.window.addEventListener = function (type, callback, ...options) {
    if (type === 'resize') windowResizes.add(callback);
    return add.call(this, type, callback, ...options);
  };
  f.window.removeEventListener = function (type, callback, ...options) {
    if (type === 'resize') windowResizes.delete(callback);
    return remove.call(this, type, callback, ...options);
  };
  const progress = f.values.get(XICHUAN_KEY);
  try {
    await f.go('/play/xichuan');
    const frame = f.document.querySelector('#xichuan-frame');
    assert.equal(observers.length, 1);
    assert.ok(observers[0].targets.includes(f.document.querySelector('.xc-header')), 'header wrapping is observed by the mounted host');
    assert.equal(windowResizes.size, 1); assert.equal(viewportResizes.size, 1);
    let measurements = 0;
    frame.getBoundingClientRect = () => { measurements++; return {top: 100}; };
    const windowResize = [...windowResizes][0], viewportResize = [...viewportResizes][0];
    f.window.dispatchEvent(new f.window.Event('resize'));
    viewportResize(); observers[0].callback();
    assert.ok(measurements > 0, 'active layout notifications measure the real mounted frame');
    await f.go('/characters/xc-zhiyao');
    assert.equal(observers[0].disconnected, true);
    assert.equal(windowResizes.size, 0); assert.equal(viewportResizes.size, 0);
    const before = measurements;
    windowResize(); viewportResize(); observers[0].callback();
    assert.equal(measurements, before, 'queued callbacks from a disposed host no longer measure or change its frame');
    assert.equal(f.values.get(XICHUAN_KEY), progress, 'layout updates do not change game progress');
    await f.go('/play/xichuan');
    assert.equal(observers.length, 2);
    assert.equal(windowResizes.size, 1); assert.equal(viewportResizes.size, 1, 're-entry installs a single fresh observer set');
    await f.go('/characters/xc-zhiyao');
    assert.equal(observers[1].disconnected, true);
    assert.equal(windowResizes.size, 0); assert.equal(viewportResizes.size, 0);
  } finally {
    await f.go('/characters/xc-zhiyao');
    f.window.addEventListener = add; f.window.removeEventListener = remove;
    f.window.visualViewport = previousViewport;
    if (previousObserver === undefined) delete globalThis.ResizeObserver; else globalThis.ResizeObserver = previousObserver;
  }
}

async function verifyProfileHydration(f) {
  const {show, syncAccount} = await import('../dist/assets/flywheel/flywheel.js');
  let subscribe, resolveBob, reads = 0;
  const client = {
    subscribe: callback => subscribe = callback,
    load: async uid => uid === 'alice' ? [[chatKey, [{role: 'user', text: 'Alice private chat'}]], [XICHUAN_KEY, {[LATEST]: save({'flag.z_promised': true})}]] : new Promise(resolve => resolveBob = resolve),
    save: async () => {},
  };
  const account = createAccount({
    storage: f.storage,
    fetchImpl: async () => Response.json({auth: {config: {}, providers: {}}}),
    loadClient: async () => ({connectFirebase: async () => client}),
  });
  await account.init(); await subscribe({uid: 'alice'});
  const scope = account.scope();
  const helpers = {data: [], categories: [], show() {}, navigate() {}, ...scope, read: (key, fallback) => { reads++; return account.read(key, fallback); }};
  await f.go('/characters/xc-zhiyao');
  show('/characters/xc-zhiyao', helpers);
  assert.match(f.document.querySelector('[data-fw-progress]').textContent, /答应|promis/i);
  const identity = f.document.querySelector('.fw-profile-head');
  f.document.querySelector('[data-fw-story-entry]').focus();
  syncAccount(account);
  assert.equal(f.document.activeElement, f.document.querySelector('[data-fw-story-entry]'), 'private status refresh preserves the focused action');
  const experience = () => f.document.querySelector('[data-fw-experiences]');
  const about = f.document.querySelector('[data-fw-about]');
  experience().setAttribute('open', ''); about.setAttribute('open', '');
  experience().querySelector('summary').focus();
  account.save('ooc-Memories-xc-zhiyao', 'Alice private note');
  const afterMemorySave = f.writes.length;
  syncAccount(account);
  assert.equal(experience().hasAttribute('open'), true, 'same-owner memory refresh preserves the chosen expansion');
  assert.equal(f.document.activeElement, experience().querySelector('summary'), 'same-owner memory refresh preserves summary focus');
  assert.equal(f.document.querySelector('[data-fw-about]'), about, 'a private refresh keeps the existing public details node');
  assert.equal(about.hasAttribute('open'), true);
  assert.equal(f.writes.length, afterMemorySave, 'details display state is not written to private or cloud storage');
  const switching = subscribe({uid: 'bob'}); reads = 0;
  syncAccount(account);
  const waiting = f.document.querySelector('[data-fw-profile-state]');
  assert.ok(waiting.querySelector('[role="status"]') || waiting.getAttribute('role') === 'status');
  assert.match(waiting.textContent, /恢复|Restor/i);
  assert.doesNotMatch(waiting.textContent, /Alice|答应|promis|继续聊天|Continue chatting/i);
  assert.equal(about.hasAttribute('open'), false, 'a different owner does not inherit an expanded public details panel');
  assert.equal(reads, 0, 'unrestored account state is never read for a public profile');
  assert.equal(f.document.querySelector('.fw-profile-head'), identity, 'account restoration does not replace public identity');
  scope.save(XICHUAN_KEY, {[LATEST]: save({'flag.z_promised': true})});
  resolveBob([]); await switching; syncAccount(account);
  assert.equal(account.read(XICHUAN_KEY, null), null);
  assert.equal(f.document.querySelector('[data-fw-progress]'), null, 'a new account has no invented progress text');
  assert.deepEqual(account.read(chatKey, []), []);
  assert.equal(experience(), null, 'an empty new account does not inherit the previous experience panel');
  account.save('ooc-Memories-xc-zhiyao', 'Bob private note');
  const afterBobSave = f.writes.length;
  syncAccount(account);
  assert.equal(experience().hasAttribute('open'), false, 'new-owner experiences start folded even when the previous owner opened them');
  assert.match(experience().textContent, /Bob private note/);
  assert.doesNotMatch(experience().textContent, /Alice|答应|promis/i);
  assert.equal(f.writes.length, afterBobSave, 'a new owner’s initial folded state is also display-only');
  clearInterval(f.window.carousel);
}

async function verifyLegacyProgress(f) {
  const {show} = await import('../dist/assets/flywheel/flywheel.js');
  const {createAccountStorage} = await import('../dist/assets/account-storage.js');
  const cache = createAccountStorage(f.storage);
  f.values.delete(XICHUAN_KEY);
  const legacy = JSON.stringify(save({'flag.z_promised': true}));
  f.values.set('xc.auto', legacy);
  const guest = {user: null, busy: false, restored: true};
  const helpers = {data: [], categories: [], show() {}, navigate() {}, account: guest, read: cache.read, save: cache.save};
  const before = f.writes.length;
  show('/characters/xc-zhiyao', helpers);
  assert.match(f.document.querySelector('[data-fw-progress]').textContent, /答应|promis/i);
  assert.match(f.document.querySelector('[data-fw-story-entry]').textContent, /继续|continu/i);
  assert.equal(f.values.get('xc.auto'), legacy);
  assert.equal(f.values.has(XICHUAN_KEY), false, 'viewing a legacy save does not silently migrate it');
  assert.equal(f.writes.length, before, 'profile rendering never mutates existing keys');
  cache.useAccount('new-account'); helpers.account = {...guest, user: {uid: 'new-account'}};
  show('/characters/xc-zhiyao', helpers);
  assert.equal(f.document.querySelector('[data-fw-progress]'), null, 'a new account has no invented progress text');
  assert.equal(cache.read(XICHUAN_KEY, null), null);
  assert.equal(f.values.get('xc.auto'), legacy);
  assert.equal(f.writes.length, before);
}

async function verifyBranchMemories(f) {
  const {show} = await import('../dist/assets/flywheel/flywheel.js');
  const {createAccountStorage} = await import('../dist/assets/account-storage.js');
  const {createCharacterThreads} = await import('../dist/assets/character-threads.js');
  const cache = createAccountStorage(f.storage); cache.useAccount('branch-owner');
  const account = {user: {uid: 'branch-owner'}, restored: true, busy: false};
  const helpers = {data: [], categories: [], show() {}, navigate() {}, account, read: cache.read, save: cache.save};
  const manager = createCharacterThreads({id: 'xc-zhiyao', ...helpers, defaultScene: 'cinema', newId: () => 'new-branch'});
  const first = [{role: 'user', text: 'MAIN_PRIVATE<script>do not execute</script>'}, {role: 'assistant', text: 'Main reply'}];
  manager.saveMessages(first); manager.pin(0, first);
  show('/characters/xc-zhiyao', helpers);
  assert.ok(f.document.querySelector('[data-fw-experiences]').textContent.includes(first[0].text));
  assert.equal(f.document.querySelector('[data-fw-experiences] script'), null, 'saved words are escaped in the profile');
  manager.fork(first, -1);
  show('/characters/xc-zhiyao', helpers);
  assert.equal((f.document.querySelector('[data-fw-experiences]')?.textContent || '').includes('MAIN_PRIVATE'), false, 'another branch does not inherit a prior branch memory');
  assert.equal(f.document.querySelector('[data-fw-experiences]'), null, 'an empty active branch has no fabricated experience panel');
  assert.match(f.document.querySelector('[data-fw-chat-entry]').textContent, /开始|Start/i);
  const current = createCharacterThreads({id: 'xc-zhiyao', ...helpers, defaultScene: 'cinema'});
  const second = [{role: 'user', text: 'CURRENT_PRIVATE ' + 'x'.repeat(200) + 'A'}];
  current.saveMessages(second); current.pin(0, second);
  const before = f.writes.length;
  show('/characters/xc-zhiyao', helpers);
  assert.ok(f.document.querySelector('[data-fw-experiences]').textContent.includes('CURRENT_PRIVATE'));
  assert.equal(f.document.querySelector('[data-fw-experiences]').textContent.includes('MAIN_PRIVATE'), false);
  assert.equal(f.writes.length, before, 'reading a branch does not open or rewrite a thread manager');
  const changed = [{role: 'user', text: second[0].text.slice(0, -1) + 'B'}];
  cache.save(chatKey + '-branch-new-branch', changed); cache.save(chatKey, changed);
  show('/characters/xc-zhiyao', helpers);
  assert.equal(f.document.querySelectorAll('[data-fw-experiences] blockquote').length, 0, 'changing text beyond the excerpt invalidates the saved source stamp');
  cache.save(chatKey + '-branch-new-branch', null);
  cache.save(chatKey, [{role: 'user', text: 'LEGACY_CURRENT'}]);
  show('/characters/xc-zhiyao', helpers);
  assert.match(f.document.querySelector('[data-fw-chat-entry]').textContent, /继续|continu/i, 'the legacy message array remains the thread fallback');
  assert.equal(f.document.querySelectorAll('[data-fw-experiences] blockquote').length, 0);
  const longNotes = '旧记忆'.repeat(150);
  cache.save('ooc-Memories-xc-zhiyao', longNotes);
  const writes = f.writes.length;
  show('/characters/xc-zhiyao', helpers);
  assert.equal(f.document.querySelector('.fw-memory-notes').textContent.length, 350);
  assert.match(f.document.querySelector('[data-fw-experiences]').textContent, /350/);
  assert.equal(cache.read('ooc-Memories-xc-zhiyao'), longNotes, 'the displayed request limit never truncates the stored original');
  assert.equal(f.writes.length, writes);
}

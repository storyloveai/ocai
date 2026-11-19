import {track} from '../analytics.js';
import {createDepthStage} from './depth-window.js';
import {resolveChoice, interludeDraft} from './episode.js';
import {createRain} from './rain.js';

const words = (zh, en) => ({zh, en});
const ui = {
  back: words('返回 StoryDate', 'Back to StoryDate'),
  color: words('彩漫', 'Color'), ink: words('水墨', 'Ink'),
  view: words('视角与声音', 'View & sound'), auto: words('自动微晃', 'Auto motion'),
  reset: words('正面复位', 'Center view'), sensor: words('启用倾斜', 'Enable tilt'),
  rain: words('雨声', 'Rain sound'), free: words('自己说一句', 'In your own words'),
  send: words('写入下一格', 'Draw the next panel'), again: words('重选这一幕', 'Choose again'),
  you: words('你', 'You'), interlude: words('本集幕间', 'Interlude'),
  chat: words('去找剧里的人聊一聊', 'Speak to someone from the scene'),
  remembered: words('这一幕留下的印记', 'Impressions from this scene'),
  result: words('你的下一格', 'Your next panel'),
  sensorStates: {
    requesting: words('正在请求传感器权限…', 'Requesting sensor access…'),
    waiting: words('请轻轻倾斜手机。', 'Gently tilt your phone.'),
    active: words('已随手机倾斜。', 'Following your tilt.'),
    denied: words('未获得体感权限，可在分镜上横向拖动。', 'Tilt permission was declined. Drag a panel sideways to look around.'),
    unavailable: words('暂未收到体感数据，可横向拖动或重试。', 'No sensor readings yet. Drag sideways or try again.')
  },
  silent: words('当前浏览器无法播放雨声。', 'Rain sound is unavailable in this browser.')
};

export function mountReader(host, episode, {getLanguage, changeLanguage, sendEvent = track}) {
  const doc = host.ownerDocument, win = doc.defaultView;
  let lang = getLanguage(), disposed = false;
  const prior = win.history?.state?.livingManga;
  const saved = prior?.episodeId === episode.id ? prior : {};
  const measured = episode.id === 'seven-nights';
  const emit = (step, fields) => {
    if (measured) sendEvent('living_manga_' + step, {episode_id:episode.id, ...fields});
  };
  let viewed = Boolean(saved.viewed), engaged = false;
  const engagementKey = 'sd.living-manga.engaged.' + episode.id;
  try { engaged = win.sessionStorage?.getItem(engagementKey) === '1'; } catch {}
  function engage(method) {
    if (!measured || engaged) return;
    engaged = true;
    try { win.sessionStorage?.setItem(engagementKey, '1'); } catch {}
    emit('engaged', {input_method:method});
  }
  let theme = saved.theme === 'ink' ? 'ink' : episode.theme;
  let selection, choice, branch, sensorState = 'idle', audioOn = false;
  let soundVersion = 0, audioPending = false, feedback;
  const rain = createRain(win);
  const bindings = new WeakMap();
  const el = (name, css) => {
    const node = doc.createElement(name);
    if (css) node.className = css;
    return node;
  };
  function label(node, value) {
    node.dataset.lmText = '';
    bindings.set(node, value);
    node.textContent = value[lang];
    return node;
  }
  const copy = (name, css, value) => label(el(name, css), value);
  function button(action, value) {
    const node = copy('button', '', value);
    node.type = 'button';
    node.dataset.lmAction = action;
    return node;
  }
  const page = el('article', 'lm-reader');
  page.dataset.noI18n = '';
  page.dataset.lmEpisode = episode.id;
  host.replaceChildren(page);
  const hud = el('header','lm-hud');
  const home = el('a', 'lm-home');
  home.href = '/';
  home.innerHTML = '<span aria-hidden="true">←</span><img src="/assets/storydate-dialogue-logo.svg" width="109" height="27" alt="StoryDate">';
  const toolbar = el('div','lm-toolbar');
  const themes = el('div','lm-themes');
  const color = button('color',ui.color), ink = button('ink',ui.ink);
  themes.append(color, ink);
  const settings = el('details','lm-settings'), summary = copy('summary','',ui.view);
  const controls = el('div','lm-menu');
  const auto = button('auto',ui.auto), reset = button('reset',ui.reset);
  const sensor = button('sensor',ui.sensor), sound = button('rain',ui.rain);
  const status = el('p','lm-feedback');
  status.setAttribute('role','status');
  controls.append(auto, reset, sensor, sound, status);
  settings.append(summary, controls);
  const language = button('language',words('EN','中文'));
  toolbar.append(themes, settings, language);
  hud.append(home, toolbar);
  const book = el('div','lm-book');
  const head = el('header','lm-title');
  head.append(copy('h1','',episode.title),copy('p','',episode.subtitle));
  const opening = el('section','lm-opening'), decision = el('section','lm-decision');
  const prompt = copy('h2','',episode.decision.prompt);
  prompt.id = 'lm-decision-title';
  decision.setAttribute('aria-labelledby',prompt.id);
  const options = el('div','lm-options');
  for (const option of episode.decision.options) {
    const b = button('choose',option.label);
    b.dataset.lmOption = option.id;
    options.append(b);
  }
  const form = el('form','lm-free'), field = el('input');
  field.type = 'text';
  field.maxLength = episode.decision.freeInput.maxLength;
  field.autocomplete = 'off';
  const send = button('speak',ui.send);
  send.type = 'submit';
  send.disabled = true;
  form.append(field,send);
  decision.append(prompt, options, form);
  const result = el('section','lm-result');
  result.tabIndex = -1;
  const tail = el('div','lm-tail'), afterword = el('footer','lm-interlude');
  const tags = el('ul','lm-tags'), chatHeading = copy('h2','',ui.chat);
  const again = button('again',ui.again), links = el('div','lm-links');
  const interludeHeading = el('div','lm-interlude-heading');
  interludeHeading.append(copy('p','lm-interlude-label',ui.interlude),chatHeading);
  afterword.append(tags,interludeHeading,links,again);
  result.append(tail,afterword);
  result.hidden = true;
  book.append(head, opening, decision, result);
  page.append(hud, book);
  const stage = createDepthStage(page,{onEngage:engage,onMotionPreferenceChange:paintControls,onSensorChange(state) {
    if (disposed) return;
    sensorState = state;
    feedback = ui.sensorStates[state];
    paintControls();
  }});
  sensor.hidden = !stage.canUseSensor;
  const reactionEls = [];

  function paintControls() {
    page.dataset.theme = theme;
    color.setAttribute('aria-pressed', String(theme !== 'ink'));
    ink.setAttribute('aria-pressed', String(theme === 'ink'));
    auto.setAttribute('aria-pressed', String(stage.autoEnabled));
    sensor.setAttribute('aria-pressed', String(sensorState === 'active'));
    auto.disabled = stage.reducedMotion;
    sensor.disabled = stage.reducedMotion || sensorState === 'requesting' || sensorState === 'waiting';
    sound.setAttribute('aria-pressed', String(audioOn));
    status.textContent = feedback?.[lang] || '';
    status.hidden = !status.textContent;
  }
  function persist() {
    if (!win.history) return;
    win.history.replaceState({...win.history.state,livingManga:{episodeId:episode.id,theme,selection,viewed}}, '');
  }
  function addRow(container, layout, panels, isReaction = false) {
    const row = el('div','lm-row ' + layout);
    container.append(row);
    for (const panel of panels) {
      const asset = episode.assets[panel.scene];
      const frame = el('figure','lm-frame lm-' + panel.heightClass);
      frame.dataset.scene = panel.scene;
      const original = el('img','lm-depth-image');
      original.src = asset.image;
      original.alt = asset.alt[lang];
      original.draggable = false;
      const canvas = el('canvas','lm-depth-canvas');
      canvas.setAttribute('aria-hidden','true');
      if (panel.captionRails) {
        const window = el('div','lm-art-window');
        window.append(original, canvas);
        frame.append(window);
      } else frame.append(original,canvas);
      for (const effect of panel.fx || []) {
        const fx = el('span','lm-fx lm-' + effect);
        fx.setAttribute('aria-hidden','true');
        frame.append(fx);
      }
      for (const overlay of panel.overlays) {
        const node = el('div','z-layer lm-overlay lm-' + overlay.type + ' ' + overlay.position + ' ' + overlay.style);
        node.dataset.z = overlay.z;
        if (overlay.type === 'sfx') node.setAttribute('aria-hidden','true');
        if (overlay.speaker || overlay.type === 'player-bubble') node.append(copy('span','lm-speaker',overlay.speaker || ui.you));
        const text = el('span','lm-line');
        if (overlay.type === 'player-bubble') {
          frame.classList.add('lm-dialogue');
          text.dataset.lmPlayer = '';
          text.textContent = choice.playerText;
        } else label(text,overlay.text);
        node.append(text);
        frame.append(node);
      }
      row.append(frame);
      stage.addPanel(frame, asset);
      if (isReaction) reactionEls.push(frame);
    }
  }
  function updateLinks() {
    const fragment = doc.createDocumentFragment();
    for (const entry of branch.interlude) {
      const a = el('a','lm-chat');
      a.dataset.fullInfo = '';
      a.dataset.lmCharacter = entry.characterId;
      a.href = (entry.path || '/play/' + encodeURIComponent(entry.characterId)) + '?' + new URLSearchParams({draft:interludeDraft(entry,choice,lang)});
      a.append(copy('span','',entry.label));
      const arrow = el('span');
      arrow.setAttribute('aria-hidden','true');
      arrow.textContent = '↗';
      a.append(arrow);
      fragment.append(a);
    }
    links.replaceChildren(fragment);
  }
  function clearResult() {
    for (const frame of reactionEls.splice(0)) stage.removePanel(frame);
    tail.replaceChildren();
    tags.replaceChildren();
    links.replaceChildren();
    result.hidden = true;
    decision.hidden = false;
    selection = choice = branch = undefined;
  }
  function choose(input, jump) {
    const resolved = resolveChoice(episode,input,lang);
    if (!resolved) return;
    clearResult();
    selection = input;
    choice = resolved;
    branch = episode.branches[choice.branchId];
    result.hidden = false;
    decision.hidden = true;
    for (const panel of branch.reactionPanels) addRow(tail,'cols-1',[panel],true);
    for (const tag of branch.consequenceTags) tags.append(copy('li','',tag));
    updateLinks();
    persist();
    if (jump) {
      emit('decision', {branch_id:choice.branchId, input_kind:input.optionId ? 'preset' : 'free', lang});
      result.focus({preventScroll:true});
      result.scrollIntoView({behavior:win.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
    }
  }
  function localize() {
    lang = getLanguage();
    page.lang = lang === 'zh' ? 'zh-CN' : 'en';
    doc.title = episode.title[lang] + ' · StoryDate';
    page.querySelectorAll('[data-lm-text]').forEach(node => {node.textContent = bindings.get(node)[lang];});
    page.querySelectorAll('[data-scene]').forEach(node => {
      node.querySelector('img').alt = episode.assets[node.dataset.scene].alt[lang];
    });
    if (selection) {
      choice = resolveChoice(episode,selection,lang);
      const player = tail.querySelector('[data-lm-player]');
      if (player) player.textContent = choice.playerText;
      updateLinks();
    }
    field.placeholder = episode.decision.freeInput.placeholder[lang];
    field.setAttribute('aria-label',ui.free[lang]);
    home.setAttribute('aria-label',ui.back[lang]);
    language.setAttribute('aria-label',lang === 'zh'?'English':'中文');
    result.setAttribute('aria-label',ui.result[lang]);
    tags.setAttribute('aria-label',ui.remembered[lang]);
    paintControls();
  }
  async function toggleRain() {
    const revision = ++soundVersion;
    if (audioOn || audioPending) {
      rain.stop();
      audioOn = audioPending = false;
    } else {
      audioPending = true;
      const played = await rain.start();
      if (disposed || revision !== soundVersion) return;
      audioPending = false;
      audioOn = played;
      feedback = played ? undefined : ui.silent;
    }
    paintControls();
  }
  function onClick(event) {
    const chatLink = event.target.closest('[data-lm-character]');
    if (chatLink && choice) emit('interlude_click', {branch_id:choice.branchId, character_id:chatLink.dataset.lmCharacter});
    if (!settings.contains(event.target)) settings.open = false;
    const b = event.target.closest('button[data-lm-action]');
    if (!b) return;
    switch (b.dataset.lmAction) {
      case 'color': case 'ink':
        theme = b.dataset.lmAction;
        stage.setInk(theme === 'ink');
        persist();
        break;
      case 'language': changeLanguage(lang === 'zh'?'en':'zh'); break;
      case 'auto': stage.setAuto(!stage.autoEnabled); break;
      case 'reset': stage.reset(); break;
      case 'sensor': if (sensorState === 'active') stage.reset(); else void stage.enableSensor(); break;
      case 'rain': void toggleRain(); break;
      case 'choose': choose({optionId:b.dataset.lmOption},true); break;
      case 'again':
        clearResult();persist();
        options.firstElementChild.focus({preventScroll:true});
        decision.scrollIntoView({block:'center'});
        break;
    }
    paintControls();
  }
  form.onsubmit = event => {event.preventDefault();choose({text:field.value.trim().slice(0,field.maxLength)},true);};
  field.oninput = () => {send.disabled = !field.value.trim();};
  const onKey = event => {
    if (event.key === 'Escape' && settings.open) {settings.open = false;summary.focus();}
  };
  const onHide = () => {
    page.toggleAttribute('data-lm-paused',Boolean(doc.hidden));
    if (doc.hidden) {soundVersion++;rain.stop();audioOn = audioPending = false;paintControls();}
  };
  page.addEventListener('click',onClick);
  page.addEventListener('keydown',onKey);
  win.addEventListener('sd-lang',localize);
  doc.addEventListener('visibilitychange',onHide);
  for (const row of episode.openingRows) addRow(opening,row.layout,row.panels);
  let rowObserver;
  if (measured && !viewed) {
    viewed = true;
    emit('viewed', {lang, viewport:win.innerWidth <= 767 ? 'mobile' : 'desktop'});
    // Retain an existing selection while a restored reader is mounting.
    win.history.replaceState({...win.history.state, livingManga:{...saved, episodeId:episode.id, viewed}}, '');
  }
  if (measured && !engaged && win.IntersectionObserver && opening.children[1]) {
    rowObserver = new win.IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { engage('read'); rowObserver.disconnect(); }
    }, {threshold:.25});
    rowObserver.observe(opening.children[1]);
  }
  if (saved.selection) choose(saved.selection,false);
  stage.setInk(theme === 'ink');
  localize();
  return () => {
    disposed = true;
    soundVersion++;
    win.removeEventListener('sd-lang',localize);
    doc.removeEventListener('visibilitychange',onHide);
    page.removeEventListener('click',onClick);
    page.removeEventListener('keydown',onKey);
    rain.stop();
    rowObserver?.disconnect();
    stage.destroy();
    page.remove();
  };
}

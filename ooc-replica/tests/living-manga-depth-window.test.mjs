import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { createDepthStage } from '../dist/assets/living-manga/depth-window.js';

function rig({ touch = 0, orientation, reduced = false, observe = true } = {}) {
  const { document, window: dom } = parseHTML('<main><section><img class="lm-depth-image" src="art.webp"><canvas class="lm-depth-canvas"></canvas><b class="z-layer" data-z="1"></b></section></main>');
  const win = new EventTarget();
  Object.defineProperty(document, 'defaultView', { value: win });
  const root = document.querySelector('main'), el = root.firstElementChild;
  const [image, canvas, layer] = el.children;
  Object.assign(el, { clientWidth: 320, clientHeight: 240, getBoundingClientRect: () => ({
    left: 0, top: 0, right: 320, bottom: 240, width: 320, height: 240,
  }) });
  Object.assign(image, { naturalWidth: 1600, naturalHeight: 900 });
  const preference = Object.assign(new EventTarget(), { matches: reduced });
  const frames = new Map(), timers = new Map(), results = [];
  let serial = 0, now = 0, intersection, glAttempts = 0, disconnected = 0;
  class Observer {
    constructor(fn) { intersection = fn; }
    observe() {}
    unobserve() {}
    disconnect() { disconnected++; }
  }
  Object.assign(win, {
    navigator: { maxTouchPoints: touch }, screen: { orientation: { angle: 0 } },
    isSecureContext: true, DeviceOrientationEvent: orientation, devicePixelRatio: 2,
    PointerEvent: class {}, Image: class {}, IntersectionObserver: observe ? Observer : undefined,
    innerHeight: 844, innerWidth: 390,
    matchMedia: () => preference,
    requestAnimationFrame(fn) { frames.set(++serial, fn); return serial; },
    cancelAnimationFrame(id) { frames.delete(id); },
    setTimeout(fn) { timers.set(++serial, fn); return serial; },
    clearTimeout(id) { timers.delete(id); },
  });
  canvas.getContext = () => { glAttempts++; return null; };
  const stage = createDepthStage(root, { onSensorChange: status => results.push(status) });
  stage.addPanel(el, { image: 'art.webp', depth: 'depth.webp', crop: [0.5, 0, 0.5, 1] });
  function tick() {
    now += 16;
    const queued = [...frames.values()];
    frames.clear();
    for (const fn of queued) fn(now);
  }
  function advance() { for (let i = 0; i < 90; i++) tick(); }
  function settle() {
    for (let i = 0; frames.size && i < 90; i++) tick();
    assert.equal(frames.size, 0);
  }
  function pointer(type, attrs) {
    const event = Object.assign(new dom.Event(type, { bubbles: true, cancelable: true }),
      { pointerType: 'touch', pointerId: 1, isPrimary: true }, attrs);
    image.dispatchEvent(event);
    assert.equal(event.defaultPrevented, false, 'drag leaves vertical scrolling to the browser');
  }
  return {
    stage, win, el, image, layer, frames, timers, results, preference, canvas, tick, settle, advance, pointer,
    get glAttempts() { return glAttempts; }, get disconnected() { return disconnected; },
    visible(value) { intersection([{ target: el, isIntersecting: value }]); },
    hidden(value) { document.hidden = value; document.dispatchEvent(new dom.Event('visibilitychange')); },
    tilt(beta, gamma, alpha) { win.dispatchEvent(Object.assign(new Event('deviceorientation'), { beta, gamma, alpha })); },
    expire() { for (const fn of [...timers.values()]) fn(); },
  };
}

test('unavailable WebGL retains the cropped image and counter-moving overlays, then RAF sleeps', () => {
  const r = rig();
  r.stage.setAuto(false);
  assert.equal(r.stage.canUseSensor, false);
  assert.equal(r.frames.size, 0);
  assert.equal(r.glAttempts, 0, 'offscreen panels never request GL');
  r.visible(true);
  r.settle();
  assert.equal(r.glAttempts, 1);
  assert.equal(r.canvas.style.visibility, 'hidden');
  assert.equal(r.image.getAttribute('src'), 'art.webp');
  // With a right-half crop, the center of the source rectangle is at x = 0.75.
  assert.ok(Math.abs((50 - parseFloat(r.image.style.left)) / parseFloat(r.image.style.width) - 0.75) < 0.00001);
  r.pointer('pointermove', { pointerType: 'mouse', clientX: 320, clientY: 120 });
  r.tick();
  assert.ok(parseFloat(r.layer.style.translate) > 0 && parseFloat(r.layer.style.translate) < 13);
  r.settle();
  assert.equal(r.layer.style.translate, '13px 0px');
  assert.equal(r.image.style.translate, '-4px 0px');
  r.stage.setInk(true);
  r.settle();
  assert.match(r.image.style.filter, /grayscale/);
  r.stage.reset();
  r.settle();
  assert.equal(r.layer.style.translate, '0px 0px');
  r.pointer('pointerdown', { clientX: 100, clientY: 100 });
  r.pointer('pointermove', { clientX: 150, clientY: 110 });
  r.settle();
  assert.ok(parseFloat(r.layer.style.translate) > 6);
  r.stage.destroy();
  r.pointer('pointermove', { pointerType: 'mouse', clientX: 320, clientY: 120 });
  assert.equal(r.frames.size, 0);
  assert.equal(r.disconnected, 1);
});

test('auto animation pauses when invisible or hidden; reduced-motion changes restore a static view', () => {
  const r = rig();
  assert.equal(r.el.hasAttribute('data-lm-visible'), false);
  r.visible(true);
  assert.equal(r.el.hasAttribute('data-lm-visible'), true);
  r.stage.setAuto(true);
  r.tick();
  assert.equal(r.frames.size, 1);
  r.visible(false);
  assert.equal(r.el.hasAttribute('data-lm-visible'), false);
  assert.equal(r.frames.size, 0);
  r.visible(true);
  r.tick();
  assert.equal(r.frames.size, 1);
  r.hidden(true);
  assert.equal(r.frames.size, 0);
  assert.equal(r.el.hasAttribute('data-lm-visible'), false);
  r.hidden(false);
  assert.equal(r.el.hasAttribute('data-lm-visible'), true);
  assert.equal(r.frames.size, 1);
  r.preference.matches = true;
  r.preference.dispatchEvent(new Event('change'));
  r.settle();
  assert.equal(r.layer.style.translate, '0px 0px');
  r.pointer('pointermove', { pointerType: 'mouse', clientX: 320, clientY: 120 });
  assert.equal(r.frames.size, 0);
  r.stage.destroy();
  assert.equal(r.el.hasAttribute('data-lm-visible'), false);
});

test('explicit permission, neutral calibration, screen axes, denial, silent device, and sensor cleanup', async () => {
  let choice = 'granted', calls = 0;
  const r = rig({ touch: 1, orientation: { requestPermission() { calls++; return Promise.resolve(choice); } } });
  r.stage.setAuto(false);
  assert.equal(r.stage.canUseSensor, true);
  assert.equal(calls, 0);
  r.visible(true);
  r.settle();
  const request = r.stage.enableSensor();
  assert.equal(calls, 1, 'permission is requested within the user gesture');
  assert.equal(await request, true);
  assert.deepEqual(r.results, ['requesting', 'waiting']);
  r.tilt(null, null);
  assert.equal(r.results.at(-1), 'waiting');
  r.tilt(40, 12);
  r.settle();
  assert.equal(r.layer.style.translate, '0px 0px');
  r.tilt(40, 35);
  r.settle();
  assert.equal(r.layer.style.translate, '13px 0px');
  r.win.screen.orientation.angle = 90;
  r.tilt(40, 35);
  r.tilt(63, 35);
  r.settle();
  assert.ok(parseFloat(r.layer.style.translate) > 12.9);
  assert.equal(r.timers.size, 0);
  r.hidden(true);
  r.hidden(false);
  assert.equal(r.results.at(-1), 'waiting');
  r.expire();
  assert.equal(r.results.at(-1), 'unavailable');
  choice = 'denied';
  assert.equal(await r.stage.enableSensor(), false);
  assert.equal(r.results.at(-1), 'denied');
  choice = 'granted';
  await r.stage.enableSensor();
  r.tilt(0, 0);
  r.stage.setAuto(true);
  assert.equal(r.results.at(-1), 'idle');
  r.stage.destroy();
  r.tilt(22, 22);
  assert.equal(r.frames.size, 0);
  assert.equal(r.timers.size, 0);
});

test('leaving the route during the native permission sheet cannot register a late sensor listener', async () => {
  let resolve;
  const r = rig({ touch: 1, orientation: { requestPermission: () => new Promise(r => { resolve = r; }) } });
  const pending = r.stage.enableSensor();
  r.stage.destroy();
  resolve('granted');
  assert.equal(await pending, false);
  assert.deepEqual(r.results, ['requesting']);
  assert.equal(r.timers.size, 0);
});

test('removing a panel while its depth map loads releases GL and disconnects late image callbacks', () => {
  const r = rig();
  r.stage.setAuto(false);
  let pendingDepth, released = 0;
  r.win.Image = class {
    constructor() { pendingDepth = this; }
  };
  r.canvas.getContext = () => ({
    getExtension(name) {
      assert.equal(name, 'WEBGL_lose_context');
      return { loseContext: () => { released++; } };
    },
  });
  r.visible(true);
  r.settle();
  assert.equal(pendingDepth.src, 'depth.webp');
  assert.equal(typeof pendingDepth.onload, 'function');
  r.stage.removePanel(r.el);
  assert.equal(pendingDepth.onload, null);
  assert.equal(pendingDepth.onerror, null);
  assert.equal(released, 1);
  assert.equal(r.frames.size, 0);
  r.stage.destroy();
  assert.equal(released, 1);
});

test('an upright phone can turn sideways; denial leaves auto mode and gestures usable', async () => {
  let response = 'denied';
  const r = rig({ touch: 1, orientation: { requestPermission: async () => response } });
  r.visible(true);
  r.stage.setAuto(true);
  assert.equal(r.stage.autoEnabled, true);
  await r.stage.enableSensor();
  assert.equal(r.stage.autoEnabled, true);
  r.pointer('pointerdown', { clientX: 0, clientY: 0 });
  r.pointer('pointermove', { clientX: 70, clientY: 0 });
  r.advance();
  assert.ok(parseFloat(r.layer.style.translate) > 8);
  response = 'granted';
  await r.stage.enableSensor();
  r.tilt(90, 0, 0);
  r.advance();
  assert.equal(r.layer.style.translate, '0px 0px');
  r.tilt(90, 0, 23);
  r.advance();
  assert.ok(parseFloat(r.layer.style.translate) > 12.9, 'portrait upright heading rotation moves horizontally');
  r.tilt(90, 0, 23);
  assert.equal(r.frames.size, 1, 'visible cinematic lighting stays animated');
  r.stage.destroy();
});

test('a missing depth asset immediately releases the allocated context and keeps the artwork', () => {
  const r = rig();
  r.stage.setAuto(false);
  let depth, released = 0;
  r.win.Image = class { constructor() { depth = this; } };
  r.canvas.getContext = () => ({
    getExtension: () => ({ loseContext: () => { released++; } }),
  });
  r.visible(true);
  r.settle();
  depth.onerror();
  r.settle();
  assert.equal(released, 1);
  assert.equal(r.canvas.style.visibility, 'hidden');
  assert.ok(r.image.style.width);
  r.stage.destroy();
  assert.equal(released, 1, 'failed context released only once');
});

test('legacy viewport fallback toggles visual effects on scroll and removes the marker on disposal', () => {
  const r = rig({ observe: false });
  r.stage.setAuto(false);
  assert.equal(r.el.hasAttribute('data-lm-visible'), true);
  r.settle();
  r.el.getBoundingClientRect = () => ({ top: 900, bottom: 1140, left: 0, right: 320 });
  r.win.dispatchEvent(new Event('scroll'));
  assert.equal(r.el.hasAttribute('data-lm-visible'), false);
  assert.equal(r.frames.size, 0);
  r.el.getBoundingClientRect = () => ({ top: 50, bottom: 290, left: 0, right: 320 });
  r.win.dispatchEvent(new Event('scroll'));
  assert.equal(r.el.hasAttribute('data-lm-visible'), true);
  r.stage.removePanel(r.el);
  assert.equal(r.el.hasAttribute('data-lm-visible'), false);
  r.stage.destroy();
});

test('shader compilation failure releases partial allocations before showing the original image', () => {
  const r = rig(), freed = [];
  r.stage.setAuto(false);
  r.win.Image = class { complete = true; naturalWidth = 512; };
  r.canvas.getContext = () => ({
    createProgram: () => 'program', createShader: () => 'shader',
    shaderSource() {}, compileShader() {}, getShaderParameter: () => false, getShaderInfoLog: () => 'unsupported',
    deleteProgram: id => freed.push(id), deleteShader: id => freed.push(id),
    getExtension: () => ({ loseContext: () => freed.push('context') }),
  });
  r.visible(true);
  r.settle();
  assert.deepEqual(freed, ['program', 'shader', 'context']);
  assert.equal(r.canvas.style.visibility, 'hidden');
  assert.ok(r.image.style.width);
  r.stage.destroy();
});

test('ambient motion works before permission, tracks viewport position, and survives a silent sensor', async () => {
  const r = rig({touch:1, orientation:{}});
  r.visible(true);
  r.advance();
  const first = r.layer.style.translate;
  assert.notEqual(first, '0px 0px');
  r.tick();
  assert.notEqual(r.layer.style.translate, first);
  r.el.getBoundingClientRect = () => ({top:680,bottom:920,left:0,right:320,width:320,height:240});
  r.win.dispatchEvent(new Event('scroll'));
  r.advance();
  assert.ok(parseFloat(r.layer.style.translate.split(' ')[1]) < -3);
  await r.stage.enableSensor();
  r.expire();
  assert.equal(r.results.at(-1), 'unavailable');
  assert.equal(r.stage.autoEnabled, true);
  r.pointer('pointerdown', {clientX:10,clientY:30});
  r.pointer('pointermove', {clientX:100,clientY:32});
  r.advance();
  assert.ok(parseFloat(r.layer.style.translate) > 10);
  assert.ok(parseFloat(r.layer.style.getPropertyValue('--lm-shadow-x')) < 0);
  r.pointer('pointerup',{});
  r.advance();
  assert.ok(parseFloat(r.layer.style.translate) < 2);
  r.preference.matches=true;
  r.preference.dispatchEvent(new Event('change'));
  r.settle();
  assert.equal(r.layer.style.translate,'0px 0px');
  r.stage.destroy();
});

test('horizontal ray uses full panel width and the focused POM keeps its nine-percent overscan', () => {
  const r = rig();
  r.stage.setAuto(false);
  const uniforms = new Map();
  r.win.Image = class { complete = true; naturalWidth = 390 };
  const gl = new Proxy({
    NO_ERROR:0, getError:()=>0, getProgramParameter:()=>true, getShaderParameter:()=>true,
    getUniformLocation:(_program,name)=>name, getExtension:()=>null,
    uniform1f:(name,v)=>uniforms.set(name,v), uniform2f:(name,x,y)=>uniforms.set(name,[x,y])
  }, {get:(o,k)=>k in o ? o[k] : ()=>({})});
  r.canvas.getContext=()=>gl;
  r.visible(true);r.settle();
  r.pointer('pointermove',{pointerType:'mouse',clientX:320,clientY:120});r.settle();
  const [rayX,rayY]=uniforms.get('u_tilt'), focus=uniforms.get('u_focus');
  assert.equal(rayX,.07);assert.equal(rayY,0);
  assert.equal(focus,.58);assert.equal(uniforms.get('u_inset'),.09);
  const near=(1-focus)*rayX, far=(0-focus)*rayX;
  assert.ok(near>0 && far<0 && Math.max(near,-far)<uniforms.get('u_inset'));
  r.stage.destroy();
});

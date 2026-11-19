// DeviceOrientation's beta/gamma axes refer to the natural (usually portrait) screen.
const clampAxis = value => Math.max(-1, Math.min(1, value));
const rad = Math.PI / 180;
const difference = (angle, baseline) => ((angle - baseline + 540) % 360) - 180;

// Columns of the deviceorientation rotation matrix, Rz(alpha) Rx(beta) Ry(gamma).
function deviceAxes({ alpha, beta, gamma }) {
  const ca = Math.cos(alpha * rad), sa = Math.sin(alpha * rad);
  const cb = Math.cos(beta * rad), sb = Math.sin(beta * rad);
  const cg = Math.cos(gamma * rad), sg = Math.sin(gamma * rad);
  return {
    right: [ca * cg - sa * sb * sg, sa * cg + ca * sb * sg, -cb * sg],
    up: [-sa * cb, ca * cb, sb],
    normal: [ca * sg + sa * sb * cg, sa * sg - ca * sb * cg, cb * cg],
  };
}

export function createMotionInput(root, { panelAt, onEngage, onSensorChange, canMove, isAuto, onSensorStart, setView }) {
  const doc = root.ownerDocument;
  const win = doc.defaultView || window;
  const orientation = win.DeviceOrientationEvent;
  const canUseSensor = !!orientation && win.isSecureContext !== false
    && ((win.navigator?.maxTouchPoints || 0) > 0 || !!win.matchMedia?.('(pointer: coarse)').matches);
  let destroyed = false, generation = 0, sensor = 'idle', baseline = null, timer = 0;
  let drag = null, dragX = 0, dragY = 0;

  function report(state) {
    if (state === sensor) return;
    sensor = state;
    if (!destroyed) onSensorChange?.(state);
  }
  function stopListening() {
    win.removeEventListener('deviceorientation', handleOrientation);
    win.clearTimeout(timer);
    baseline = null;
  }
  function stopSensor() {
    ++generation;
    stopListening();
    drag = null;
    dragX = dragY = 0;
    report('idle');
  }
  function handleOrientation(event) {
    if (!canMove() || !Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
    const screenAngle = win.screen?.orientation?.angle ?? win.orientation ?? 0;
    const hasHeading = Number.isFinite(event.alpha);
    if (!baseline || baseline.screenAngle !== screenAngle || baseline.hasHeading !== hasHeading) {
      baseline = { beta: event.beta, gamma: event.gamma, screenAngle, hasHeading };
      if (hasHeading) {
        const { right, up } = deviceAxes(event);
        baseline.right = right;
        baseline.up = up;
      }
    }
    if (sensor !== 'active') {
      win.clearTimeout(timer);
      report('active');
    }
    let pitch = difference(event.beta, baseline.beta) / 23;
    let roll = difference(event.gamma, baseline.gamma) / 23;
    if (hasHeading) {
      // Compare the current screen normal to the phone's original local axes.
      // This also detects left/right tilting when the phone starts upright.
      const { normal } = deviceAxes(event);
      const angle = axis => Math.asin(clampAxis(axis[0]*normal[0] + axis[1]*normal[1] + axis[2]*normal[2]));
      roll = angle(baseline.right) / (23 * rad);
      pitch = -angle(baseline.up) / (23 * rad);
    }
    const radians = screenAngle * rad;
    const c = Math.cos(radians), s = Math.sin(radians);
    onEngage?.('tilt');
    setView(clampAxis(roll * c + pitch * s), clampAxis(pitch * c - roll * s));
  }
  function listen() {
    stopListening();
    report('waiting');
    if (doc.hidden) return;
    win.addEventListener('deviceorientation', handleOrientation, { passive: true });
    // Touch laptops and browser emulators can expose the API without a sensor.
    timer = win.setTimeout(() => { stopListening(); report('unavailable'); }, 2500);
  }
  async function enableSensor() {
    if (destroyed) return false;
    if (!canUseSensor || !canMove()) { report('unavailable'); return false; }
    if (sensor === 'requesting' || sensor === 'waiting' || sensor === 'active') return true;
    const request = ++generation;
    onSensorStart();
    report('requesting');
    try {
      // iOS requires this invocation synchronously within the button click.
      const granted = !orientation.requestPermission || await orientation.requestPermission() === 'granted';
      if (request !== generation || destroyed) return false;
      if (!granted) { report('denied'); return false; }
      listen();
      return true;
    } catch {
      if (request === generation && !destroyed) report('denied');
      return false;
    }
  }
  function visibilityChange() {
    drag = null;
    if (sensor !== 'waiting' && sensor !== 'active') return;
    if (doc.hidden) stopListening();
    else listen();
  }
  function manual() { return canMove() && !isAuto() && sensor !== 'active'; }
  function begin(id, x, y, target) {
    if (!manual() || !panelAt(target)) return;
    drag = { id, x, y, startX: dragX, startY: dragY };
  }
  function move(id, x, y) {
    if (!manual() || !drag || drag.id !== id) return;
    dragX = clampAxis(drag.startX + (x - drag.x) / 95);
    dragY = clampAxis(drag.startY + (y - drag.y) / 95);
    onEngage?.('drag');
    setView(dragX, dragY);
  }
  function mouse(event) {
    if (!manual()) return;
    const bounds = panelAt(event.target)?.getBoundingClientRect();
    if (!bounds?.width || !bounds?.height) return;
    onEngage?.('pointer');
    setView((event.clientX - bounds.left) / bounds.width * 2 - 1,
      (event.clientY - bounds.top) / bounds.height * 2 - 1);
  }
  function mouseLeave() { if (manual() && !drag) setView(0, 0); }
  const bindings = [];
  function bind(type, fn) {
    root.addEventListener(type, fn, { passive: true });
    bindings.push([type, fn]);
  }
  if (win.PointerEvent) {
    bind('pointerdown', e => {
      if (e.pointerType !== 'mouse' && e.isPrimary !== false) begin(e.pointerId, e.clientX, e.clientY, e.target);
    });
    bind('pointermove', e => {
      if (e.pointerType === 'mouse') mouse(e);
      else move(e.pointerId, e.clientX, e.clientY);
    });
    const end = e => { if (drag?.id === e.pointerId) drag = null; };
    bind('pointerup', end);
    bind('pointercancel', end);
    bind('pointerleave', e => { if (e.pointerType === 'mouse') mouseLeave(); });
  } else {
    bind('mousemove', mouse);
    bind('mouseleave', mouseLeave);
    bind('touchstart', e => {
      if (e.touches.length !== 1) { drag = null; return; }
      const t = e.touches[0];
      begin(t.identifier, t.clientX, t.clientY, e.target);
    });
    bind('touchmove', e => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      move(t.identifier, t.clientX, t.clientY);
    });
    bind('touchend', () => { drag = null; });
    bind('touchcancel', () => { drag = null; });
  }
  return {
    canUseSensor, enableSensor, stopSensor, visibilityChange,
    destroy() {
      destroyed = true;
      stopSensor();
      for (const [type, fn] of bindings) root.removeEventListener(type, fn);
    },
  };
}

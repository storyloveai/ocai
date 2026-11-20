// The crop uses top-left, normalized source coordinates, shared by the image and GPU.
import { createMotionInput } from './motion-input.js';

const VERTEX = `
attribute vec2 a_point;
varying vec2 v_uv;
void main() {
  gl_Position = vec4(a_point, 0.0, 1.0);
  v_uv = a_point * vec2(0.5, -0.5) + 0.5;
}`;

const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v_uv;
uniform sampler2D u_img, u_depth;
uniform vec4 u_crop;
uniform vec2 u_tilt;
uniform float u_ink, u_pixelRatio;

vec2 intersectDepth(vec2 uv, vec2 ray) {
  if (dot(ray, ray) < 0.00000001) return uv;
  // March from the near plane to the back of the depth field (white = near).
  vec2 prevUV = uv + ray;
  float prevGap = 1.0 - texture2D(u_depth, prevUV).r;
  for (int i = 1; i <= 8; i++) {
    float plane = 1.0 - float(i) / 8.0;
    vec2 nextUV = uv + plane * ray;
    float nextGap = plane - texture2D(u_depth, nextUV).r;
    if (nextGap <= 0.0) {
      float fraction = prevGap / max(prevGap - nextGap, 0.00001);
      return mix(prevUV, nextUV, clamp(fraction, 0.0, 1.0));
    }
    prevUV = nextUV;
    prevGap = nextGap;
  }
  return uv;
}

void main() {
  // Reserve 9% on all sides. Even the near-plane end of the ray stays in crop.
  vec2 uv = u_crop.xy + u_crop.zw * (0.09 + v_uv * 0.82);
  vec3 color = texture2D(u_img, intersectDepth(uv, u_crop.zw * u_tilt)).rgb;
  if (u_ink > 0.5) {
    float tone = dot(color, vec3(0.299, 0.587, 0.114));
    vec2 paper = gl_FragCoord.xy / (3.8 * u_pixelRatio);
    vec2 cell = fract(mat2(0.866, -0.5, 0.5, 0.866) * paper) - 0.5;
    float radius = 0.54 * sqrt(1.0 - tone);
    float dotInk = 1.0 - smoothstep(radius - 0.10, radius + 0.10, length(cell));
    float printTone = smoothstep(0.05, 0.90, tone) * (1.0 - 0.46 * dotInk);
    color = mix(vec3(0.065), vec3(0.97), printTone);
  }
  gl_FragColor = vec4(color, 1.0);
}`;

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
function coverCrop(asset, width, height, image) {
  const [cx, cy, cw, ch] = asset.crop || [0, 0, 1, 1];
  const x = clamp(cx, 0, 0.999), y = clamp(cy, 0, 0.999);
  const w = clamp(cw, 0.001, 1 - x), h = clamp(ch, 0.001, 1 - y);
  const ratio = (width / height) / (image.naturalWidth / image.naturalHeight);
  const fitW = Math.min(w, h * ratio), fitH = Math.min(h, w / ratio);
  return [x + (w - fitW) / 2, y + (h - fitH) / 2, fitW, fitH];
}

// Own every allocation, including partially compiled programs or failed texture uploads.
function makeSurface(gl, image, depth) {
  const program = gl.createProgram();
  const shaders = [], textures = [];
  let buffer;
  function dispose() {
    for (const texture of textures) gl.deleteTexture(texture);
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    for (const shader of shaders) gl.deleteShader(shader);
  }
  try {
    for (const [type, source] of [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, FRAGMENT]]) {
      const shader = gl.createShader(type);
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader));
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const point = gl.getAttribLocation(program, 'a_point');
    gl.enableVertexAttribArray(point);
    gl.vertexAttribPointer(point, 2, gl.FLOAT, false, 0, 0);
    for (const [unit, name, source] of [[0, 'u_img', image], [1, 'u_depth', depth]]) {
      const texture = gl.createTexture();
      textures.push(texture);
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
      gl.uniform1i(gl.getUniformLocation(program, name), unit);
    }
    if (gl.getError() !== gl.NO_ERROR) throw Error('Texture upload failed');
    const crop = gl.getUniformLocation(program, 'u_crop');
    const tilt = gl.getUniformLocation(program, 'u_tilt');
    const ink = gl.getUniformLocation(program, 'u_ink');
    const pixelRatio = gl.getUniformLocation(program, 'u_pixelRatio');
    return {
      draw(rect, dx, dy, monochrome, dpr) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.uniform4fv(crop, rect);
        gl.uniform2f(tilt, dx, dy);
        gl.uniform1f(ink, Number(monochrome));
        gl.uniform1f(pixelRatio, dpr);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}

// Preserve each overlay's authored transform (for example a rotated sound effect).
// Older touch browsers only support the composite transform property.
function layerOffset(node, win) {
  if (win.CSS?.supports('translate', '1px') !== false) {
    return { measure() {}, move(x, y) { node.style.translate = x + 'px ' + y + 'px'; } };
  }
  const original = node.style.transform;
  let base = '';
  return {
    measure() {
      node.style.transform = original;
      const transform = win.getComputedStyle(node).transform;
      base = transform === 'none' ? '' : ' ' + transform;
    },
    move(x, y) { node.style.transform = 'translate(' + x + 'px,' + y + 'px)' + base; },
  };
}

function createPanel(element, asset, win, invalidate) {
  const image = element.querySelector('img.lm-depth-image, .lm-depth-image img');
  const canvas = element.querySelector('canvas.lm-depth-canvas');
  const layers = [...element.querySelectorAll('.z-layer[data-z]')].map(node => ({
    offset: layerOffset(node, win), z: clamp(Number(node.dataset.z) || 0, -2, 2),
  }));
  const imageOffset = image && layerOffset(image, win);
  const strength = clamp(asset.strength ?? 0.07, 0, 0.088);
  let gl, depth, surface, failed = false, lost = false, resized = true;
  let rect = [0, 0, 1, 1], width = 0, height = 0, dpr = 1;
  element.removeAttribute('data-lm-visible');
  if (canvas) canvas.style.visibility = 'hidden';
  function handleImage() { resized = true; invalidate(); }
  function releaseContext() {
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    gl = null;
  }
  function fallback() {
    if (gl?.isContextLost?.()) return; // Wait for the browser's restoration event.
    failed = true;
    canvas.style.visibility = 'hidden';
    releaseContext();
    invalidate();
  }
  function contextLost(event) {
    if (failed) return;
    event.preventDefault();
    lost = true;
    surface = null; // WebGL invalidated every handle.
    canvas.style.visibility = 'hidden';
    invalidate();
  }
  function contextRestored() { lost = false; failed = false; invalidate(); }
  image?.addEventListener('load', handleImage);
  canvas?.addEventListener('webglcontextlost', contextLost);
  canvas?.addEventListener('webglcontextrestored', contextRestored);
  function prepare() {
    if (!canvas || !win.Image || !asset.depth || failed || lost || surface) return;
    try {
      if (!gl) gl = canvas.getContext?.('webgl', {
        alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power',
      });
      if (!gl) { failed = true; return; }
      if (!depth) {
        depth = new win.Image();
        depth.onload = invalidate;
        depth.onerror = fallback;
        depth.src = asset.depth;
      }
      if (depth.complete && depth.naturalWidth) surface = makeSurface(gl, image, depth);
    } catch {
      fallback();
    }
  }
  function measure() {
    width = element.clientWidth;
    height = element.clientHeight;
    if (!width || !height || !image?.naturalWidth || !image.naturalHeight) return;
    for (const { offset } of layers) offset.measure();
    imageOffset.measure();
    rect = coverCrop(asset, width, height, image);
    const [x, y, w, h] = rect;
    const sw = w * 0.82, sh = h * 0.82;
    // Exact CSS equivalent of u_crop at rest, including the same safety inset.
    Object.assign(image.style, {
      position: 'absolute', objectFit: 'fill', maxWidth: 'none', maxHeight: 'none',
      width: (100 / sw) + '%', height: (100 / sh) + '%',
      left: (-100 * (x + w * 0.09) / sw) + '%', top: (-100 * (y + h * 0.09) / sh) + '%',
    });
    if (canvas) {
      // Limit fill rate on large, high-DPR screens.
      dpr = Math.min(win.devicePixelRatio || 1, 1.5, 1600 / Math.max(width, height));
      const cw = Math.max(1, Math.round(width * dpr)), ch = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== cw) canvas.width = cw;
      if (canvas.height !== ch) canvas.height = ch;
    }
    resized = false;
  }
  return {
    visible: false,
    resize() { resized = true; },
    draw(tx, ty, ink) {
      if (resized) measure();
      if (!resized) prepare();
      if (surface && !lost) {
        const side = Math.min(width, height);
        surface.draw(rect, tx * strength * side / width, ty * strength * side / height, ink, dpr);
        canvas.style.visibility = 'visible';
      }
      if (image) {
        imageOffset.move(surface ? 0 : -4 * tx, surface ? 0 : -4 * ty);
        image.style.filter = ink ? 'grayscale(1) contrast(1.22)' : '';
      }
      for (const { offset, z } of layers) offset.move(tx * z * 13, ty * z * 13);
    },
    dispose() {
      element.removeAttribute('data-lm-visible');
      canvas?.removeEventListener('webglcontextlost', contextLost);
      canvas?.removeEventListener('webglcontextrestored', contextRestored);
      image?.removeEventListener('load', handleImage);
      if (depth) {
        depth.onload = depth.onerror = null;
        if (!depth.complete) depth.removeAttribute?.('src');
      }
      surface?.dispose();
      releaseContext();
      if (canvas) canvas.style.visibility = 'hidden';
    },
  };
}

export function createDepthStage(root, { onSensorChange, onMotionPreferenceChange } = {}) {
  const doc = root.ownerDocument;
  const win = doc.defaultView || window;
  const panels = new Map();
  const preference = win.matchMedia?.('(prefers-reduced-motion: reduce)');
  let reduced = !!preference?.matches, ink = false, auto = false, destroyed = false;
  let x = 0, y = 0, targetX = 0, targetY = 0, frame = 0, last = 0, phase = 0;
  function canDraw() {
    return !destroyed && !doc.hidden && [...panels.values()].some(p => p.visible);
  }
  function cancelFrame() {
    if (frame) win.cancelAnimationFrame(frame);
    frame = last = 0;
  }
  function invalidate() {
    if (!canDraw()) { cancelFrame(); return; }
    if (!frame && win.requestAnimationFrame) frame = win.requestAnimationFrame(paint);
  }
  function paint(now) {
    frame = 0;
    if (!canDraw()) return;
    const dt = last ? Math.min(64, now - last) : 16;
    if (auto && !reduced) {
      phase += dt * 0.00065;
      targetX = 0.36 * Math.sin(phase);
      targetY = 0.22 * Math.sin(phase * 0.73);
    }
    const blend = 1 - Math.exp(-dt / 85);
    x += (targetX - x) * blend;
    y += (targetY - y) * blend;
    if (Math.abs(targetX - x) < 0.001) x = targetX;
    if (Math.abs(targetY - y) < 0.001) y = targetY;
    for (const p of panels.values()) if (p.visible) p.draw(x, y, ink);
    last = now;
    if ((!reduced && auto) || x !== targetX || y !== targetY) invalidate();
    else last = 0;
  }
  const motion = createMotionInput(root, {
    onSensorChange,
    panelAt(target) {
      for (const el of panels.keys()) if (el.contains(target)) return el;
      return null;
    },
    canMove: () => !reduced && !doc.hidden,
    isAuto: () => auto,
    onSensorStart() { auto = false; targetX = targetY = 0; invalidate(); },
    setView(tx, ty) {
      const nextX = clamp(tx, -1, 1), nextY = clamp(ty, -1, 1);
      if (Math.abs(nextX - targetX) < 0.001 && Math.abs(nextY - targetY) < 0.001) return;
      targetX = nextX; targetY = nextY;
      invalidate();
    },
  });
  function setVisible(el, panel, visible) {
    if (visible && !panel.visible) panel.resize();
    panel.visible = visible;
    el.toggleAttribute('data-lm-visible', visible && !doc.hidden);
  }
  const intersection = win.IntersectionObserver && new win.IntersectionObserver(entries => {
    for (const entry of entries) {
      const panel = panels.get(entry.target);
      if (panel) setVisible(entry.target, panel, entry.isIntersecting);
    }
    invalidate();
  });
  const resize = win.ResizeObserver && new win.ResizeObserver(entries => {
    if (!intersection) { viewportChange(); return; }
    for (const entry of entries) panels.get(entry.target)?.resize();
    invalidate();
  });
  function viewportChange() {
    for (const [el, p] of panels) {
      p.resize();
      if (!intersection) {
        const box = el.getBoundingClientRect?.();
        setVisible(el, p, !box || (box.bottom > 0 && box.top < win.innerHeight && box.right > 0 && box.left < win.innerWidth));
      }
    }
    invalidate();
  }
  function reset() {
    motion.stopSensor();
    auto = false;
    x = y = targetX = targetY = phase = 0;
    invalidate();
  }
  function changePreference() {
    reduced = !!preference.matches;
    reset();
    onMotionPreferenceChange?.();
  }
  function changeVisibility() {
    for (const [el, p] of panels) setVisible(el, p, p.visible);
    motion.visibilityChange();
    invalidate();
  }
  if (preference?.addEventListener) preference.addEventListener('change', changePreference);
  else preference?.addListener?.(changePreference);
  doc.addEventListener('visibilitychange', changeVisibility);
  win.addEventListener('resize', viewportChange, { passive: true });
  if (!intersection) win.addEventListener('scroll', viewportChange, { passive: true, capture: true });
  function removePanel(el) {
    const panel = panels.get(el);
    if (!panel) return;
    intersection?.unobserve(el);
    resize?.unobserve(el);
    panels.delete(el);
    panel.dispose();
    invalidate();
  }
  return {
    canUseSensor: motion.canUseSensor,
    get autoEnabled() { return auto; },
    get reducedMotion() { return reduced; },
    enableSensor: motion.enableSensor,
    addPanel(el, asset) {
      if (destroyed || panels.has(el)) return;
      panels.set(el, createPanel(el, asset, win, invalidate));
      intersection?.observe(el);
      resize?.observe(el);
      if (!intersection) viewportChange();
    },
    removePanel,
    setInk(value) { ink = !!value; invalidate(); },
    setAuto(value) { reset(); auto = !!value && !reduced; invalidate(); },
    reset,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelFrame();
      motion.destroy();
      intersection?.disconnect();
      resize?.disconnect();
      for (const p of panels.values()) p.dispose();
      panels.clear();
      if (preference?.removeEventListener) preference.removeEventListener('change', changePreference);
      else preference?.removeListener?.(changePreference);
      doc.removeEventListener('visibilitychange', changeVisibility);
      win.removeEventListener('resize', viewportChange);
      if (!intersection) win.removeEventListener('scroll', viewportChange, true);
    },
  };
}

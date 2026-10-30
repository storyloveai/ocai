/* StoryDate ink-wash scene painter — original artwork drawn in code (SVG).
 * ART.scene(id, layers:Set<string>, opts) → SVG markup string (viewBox 1200×480).
 * Every painting is deterministic for a scene id, so a scene always looks the same,
 * and layers switch on/off with game state (e.g. a boat appears after you choose to row out).
 */
(function (root) {
  "use strict";
  let W = 1200, H = 480;
  const INK = "#1d1a17", PAPER = "#EFE6D2", PAPER2 = "#E3D7BF", VERM = "#B8321F", LAMP = "#F5B14C", EMBER = "#E2632B", ROSE = "#D9677F";
  let uid = 0;

  /* ---------- noise ---------- */
  function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function noise1(r, n) { const v = Array.from({ length: n + 2 }, r); return x => { const i = Math.floor(x), f = x - i, t = f * f * (3 - 2 * f); return v[i % (n + 1)] * (1 - t) + v[(i + 1) % (n + 1)] * t; }; }
  const f1 = n => Math.round(n * 10) / 10;

  /* ---------- defs ---------- */
  function defs(p, night) {
    return `<defs>
<linearGradient id="${p}paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PAPER}"/><stop offset="1" stop-color="${PAPER2}"/></linearGradient>
<linearGradient id="${p}inkfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${INK}" stop-opacity=".92"/><stop offset=".55" stop-color="${INK}" stop-opacity=".45"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></linearGradient>
<linearGradient id="${p}night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14111f" stop-opacity=".9"/><stop offset=".7" stop-color="#1d1a2b" stop-opacity=".55"/><stop offset="1" stop-color="#1d1a2b" stop-opacity=".35"/></linearGradient>
<linearGradient id="${p}firesky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1210" stop-opacity=".85"/><stop offset=".55" stop-color="${EMBER}" stop-opacity=".55"/><stop offset="1" stop-color="${LAMP}" stop-opacity=".25"/></linearGradient>
<radialGradient id="${p}glow"><stop offset="0" stop-color="${LAMP}" stop-opacity=".95"/><stop offset=".35" stop-color="${LAMP}" stop-opacity=".45"/><stop offset="1" stop-color="${LAMP}" stop-opacity="0"/></radialGradient>
<radialGradient id="${p}flame" cx=".5" cy=".75" r=".7"><stop offset="0" stop-color="#FFE7A3"/><stop offset=".35" stop-color="${LAMP}"/><stop offset=".75" stop-color="${EMBER}"/><stop offset="1" stop-color="${VERM}" stop-opacity="0"/></radialGradient>
<radialGradient id="${p}vig" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="${INK}" stop-opacity="0"/><stop offset="1" stop-color="${INK}" stop-opacity="${night ? .55 : .22}"/></radialGradient>
<filter id="${p}rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="6"/></filter>
<filter id="${p}brush" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="8"/><feDisplacementMap in="SourceGraphic" scale="3"/></filter>
<filter id="${p}soft"><feGaussianBlur stdDeviation="2.5"/></filter>
<filter id="${p}wash" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>
<filter id="${p}haze" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
<filter id="${p}grain"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="11"/><feColorMatrix values="0 0 0 0 .1  0 0 0 0 .08  0 0 0 0 .06  0 0 0 -1.6 1.05"/></filter>
</defs>`;
  }

  /* ---------- primitives ---------- */
  function mountains(p, r, { base, height, opacity = 1, blur = 0, step = 18, peaks = 3, jag = .25, fill } = {}) {
    const nz = noise1(r, 40), ph = r() * 6, ph2 = r() * 6;
    let d = `M-20 ${H + 10} `;
    for (let x = -20; x <= W + 20; x += step) {
      const u = x / W;
      const y = base - height * (0.55 * (0.5 + 0.5 * Math.sin(u * Math.PI * peaks + ph)) + 0.25 * (0.5 + 0.5 * Math.sin(u * Math.PI * peaks * 2.3 + ph2)) + jag * nz(Math.max(0, u) * 30));
      d += `L${f1(x)} ${f1(y)} `;
    }
    d += `L${W + 20} ${H + 10} Z`;
    const f = blur ? `filter="url(#${p}${blur > 6 ? "haze" : "wash"})"` : `filter="url(#${p}rough)"`;
    return `<path d="${d}" fill="${fill || `url(#${p}inkfade)`}" opacity="${opacity}" ${f}/>`;
  }
  function mist(y, h, op = .85) { return `<rect x="-50" y="${y}" width="${W + 100}" height="${h}" fill="${PAPER}" opacity="${op}" filter="url(#__haze)"/>`; }
  function water(r, y0, y1, { op = .35, color = INK, n = 60 } = {}) {
    let s = "";
    for (let i = 0; i < n; i++) {
      const y = y0 + (y1 - y0) * Math.pow(r(), .8), x = r() * W, w = 30 + r() * 140 * (0.4 + (y - y0) / (y1 - y0 + 1));
      s += `<path d="M${f1(x)} ${f1(y)} q${f1(w / 2)} ${f1(-2 - r() * 2)} ${f1(w)} 0" stroke="${color}" stroke-width="${f1(.6 + r() * 1.2)}" fill="none" opacity="${f1(op * (0.4 + r() * .6))}" stroke-linecap="round"/>`;
    }
    return s;
  }
  function figure(x, y, s = 1, { kind = "man", face = 1, color = INK, op = 1, held, woman = false, hat } = {}) {
    const k = s;
    const head = (kind === "woman" || woman) ? `<ellipse cx="0" cy="-58" rx="6.4" ry="7"/><path d="M-6 -63 Q0 -78 7 -64 Q3 -70 -6 -63Z"/><path d="M2 -72 l9 -5" stroke="${color}" stroke-width="1.2"/>`
      : `<ellipse cx="0" cy="-58" rx="6.6" ry="7.2"/><path d="M-5 -64 L-4 -72 L4 -72 L5 -64Z"/>`;
    const robe = kind === "woman"
      ? `<path d="M-8 -51 C-13 -40 -15 -20 -22 0 L22 0 C15 -20 13 -40 8 -51 Z"/><path d="M-8 -48 C-20 -40 -24 -28 -20 -22 C-16 -26 -12 -32 -9 -36Z" opacity=".85"/><path d="M8 -48 C20 -40 24 -28 20 -22 C16 -26 12 -32 9 -36Z" opacity=".85"/>`
      : kind === "seated"
        ? `<path d="M-9 -51 C-15 -40 -18 -28 -24 -14 C-26 -6 -20 0 0 0 L26 0 C26 -8 18 -12 14 -18 C13 -32 12 -44 9 -51Z"/>`
        : `<path d="M-9 -51 C-15 -40 -17 -20 -20 0 L20 0 C17 -20 15 -40 9 -51 Z"/><path d="M-9 -48 C-22 -38 -24 -26 -18 -20 C-15 -26 -12 -30 -9 -34Z" opacity=".85"/><path d="M9 -48 C22 -38 24 -26 18 -20 C15 -26 12 -30 9 -34Z" opacity=".85"/>`;
    const extra = held === "box" ? `<rect x="10" y="-36" width="12" height="10" rx="1" fill="${VERM}" opacity=".9"/>` : held === "spear" ? `<path d="M-14 -20 L22 -96" stroke="${color}" stroke-width="2"/><path d="M22 -96 l2 -9 l2 9z"/>` : held === "lamp" ? `<circle cx="16" cy="-30" r="4" fill="${LAMP}"/><circle cx="16" cy="-30" r="14" fill="${LAMP}" opacity=".25"/>` : "";
    const hatEl = hat === "tall" ? `<path d="M-6 -70 L-5 -92 L7 -92 L8 -70Z"/>` : hat === "crown" ? `<path d="M-3 -72 L-3 -79 L3 -79 L3 -72Z"/>` : "";
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${face * k} ${k})" fill="${color}" opacity="${op}">${head}${hatEl}${robe}${extra}</g>`;
  }
  function horse(x, y, s = 1, { face = 1, gallop = false, rider = false, color = INK, riderColor, spear = false, child = false } = {}) {
    const legs = gallop
      ? `<path d="M30 -46 L48 -30 L60 -24" /><path d="M22 -46 L36 -26 L44 -12"/><path d="M-36 -46 L-52 -30 L-66 -24"/><path d="M-28 -46 L-40 -22 L-50 -10"/>`
      : `<path d="M30 -46 L34 -22 L32 0"/><path d="M22 -46 L20 -22 L24 0"/><path d="M-36 -46 L-40 -24 L-34 0"/><path d="M-26 -46 L-22 -24 L-26 0"/>`;
    const r = rider ? `<g transform="translate(-6 -64) scale(.62)" fill="${riderColor || color}"><ellipse cx="0" cy="-58" rx="6.6" ry="7.2"/><path d="M-5 -64 L-4 -72 L4 -72 L5 -64Z"/><path d="M-9 -51 C-14 -38 -16 -24 -14 -8 L18 -4 C16 -24 14 -40 9 -51Z"/>${child ? `<circle cx="10" cy="-36" r="6" fill="${VERM}" opacity=".85"/>` : ""}${spear ? `<path d="M-30 -10 L40 -110" stroke="${riderColor || color}" stroke-width="3"/><path d="M40 -110 l3 -13 l3 13z"/>` : ""}</g>` : "";
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${face * s} ${s})" fill="${color}"><g stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none">${legs}<path d="M-45 -58 C-58 -56 -64 -40 -60 -24" stroke-width="4"/></g>
<path d="M-45 -58 C-46 -68 -30 -70 -10 -68 L22 -68 C30 -70 36 -80 44 -92 L50 -98 L54 -94 C60 -90 66 -84 70 -78 C71 -75 68 -72 64 -74 C58 -77 52 -77 48 -71 C44 -64 42 -56 38 -46 C30 -42 -30 -42 -40 -44 C-46 -48 -46 -54 -45 -58 Z"/><path d="M50 -98 L52 -105 L55 -96Z"/>${r}</g>`;
  }
  function pavilion(x, y, s = 1, op = 1) {
    return `<g transform="translate(${x} ${y}) scale(${s})" fill="${INK}" opacity="${op}" filter="url(#__brush)">
<rect x="-78" y="-6" width="156" height="8"/><rect x="-62" y="-70" width="6" height="66"/><rect x="56" y="-70" width="6" height="66"/><rect x="-24" y="-70" width="4" height="66" opacity=".7"/><rect x="20" y="-70" width="4" height="66" opacity=".7"/>
<path d="M-104 -66 Q-80 -70 -60 -84 Q-20 -112 0 -122 Q20 -112 60 -84 Q80 -70 104 -66 Q96 -62 88 -58 Q60 -72 0 -74 Q-60 -72 -88 -58 Q-96 -62 -104 -66Z"/><rect x="-3" y="-134" width="6" height="14"/>
<path d="M-62 -40 L62 -40" stroke="${INK}" stroke-width="2"/></g>`;
  }
  function plumBranch(r, x, y, ang, len, w, depth, out) {
    if (depth <= 0 || len < 10) return;
    const a = ang + (r() - .5) * .5;
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
    const mx = (x + x2) / 2 + (r() - .5) * len * .25, my = (y + y2) / 2 + (r() - .5) * len * .25;
    out.b.push(`<path d="M${f1(x)} ${f1(y)} Q${f1(mx)} ${f1(my)} ${f1(x2)} ${f1(y2)}" stroke="${INK}" stroke-width="${f1(w)}" stroke-linecap="round" fill="none"/>`);
    const nb = 1 + Math.floor(r() * 2.6);
    for (let i = 0; i < nb; i++) {
      const t = .35 + r() * .6, bx = x + (x2 - x) * t, by = y + (y2 - y) * t;
      plumBranch(r, bx, by, a + (r() < .5 ? -1 : 1) * (.45 + r() * .7), len * (.45 + r() * .3), w * .55, depth - 1, out);
    }
    plumBranch(r, x2, y2, a + (r() - .5) * .4, len * .72, w * .7, depth - 1, out);
    if (depth <= 2) for (let i = 0; i < 2; i++) out.f.push([x2 + (r() - .5) * 18, y2 + (r() - .5) * 18, 3.5 + r() * 3.5, r()]);
  }
  function plum(r, x, y, ang, len, w, { color = "#F7EFE9", center = VERM, petals = 1 } = {}) {
    const out = { b: [], f: [] };
    plumBranch(r, x, y, ang, len, w, 5, out);
    const fl = out.f.slice(0, Math.floor(out.f.length * petals)).map(([fx, fy, rr, k]) => k < .25
      ? `<circle cx="${f1(fx)}" cy="${f1(fy)}" r="${f1(rr * .5)}" fill="${VERM}"/>`
      : `<g transform="translate(${f1(fx)} ${f1(fy)})">${[0, 72, 144, 216, 288].map(d => `<circle cx="${f1(Math.cos(d * Math.PI / 180) * rr * .7)}" cy="${f1(Math.sin(d * Math.PI / 180) * rr * .7)}" r="${f1(rr * .62)}" fill="${color}" stroke="${INK}" stroke-width=".4" stroke-opacity=".4"/>`).join("")}<circle r="${f1(rr * .28)}" fill="${center}"/></g>`).join("");
    return `<g filter="url(#__brush)">${out.b.join("")}</g>${fl}`;
  }
  function bamboo(r, x, y, h, w = 7, op = 1) {
    let s = `<g opacity="${op}" fill="${INK}">`;
    let yy = y; const lean = (r() - .5) * 0.12;
    while (yy > y - h) { const seg = 34 + r() * 18; const dx = (y - yy) * lean; s += `<rect x="${f1(x + dx - w / 2)}" y="${f1(yy - seg + 2)}" width="${w}" height="${f1(seg - 3)}" rx="2"/>`; if (r() < .45) { const sd = r() < .5 ? -1 : 1; for (let k = 0; k < 3; k++) s += `<path d="M${f1(x + dx)} ${f1(yy - seg)} q${f1(sd * (18 + k * 6))} ${f1(-6 + k * 8)} ${f1(sd * (40 + k * 8))} ${f1(4 + k * 10)} q${f1(-sd * 16)} ${f1(-3)} ${f1(-sd * (40 + k * 8))} ${f1(-(4 + k * 10))}Z" opacity=".85"/>`; } yy -= seg; }
    return s + `</g>`;
  }
  function wall(x, y, w, h, op = .8) {
    let s = `<g opacity="${op}" fill="${INK}" filter="url(#__brush)"><rect x="${x}" y="${y - h}" width="${w}" height="${h}" opacity=".55"/>`;
    for (let i = x; i < x + w; i += 18) s += `<rect x="${i}" y="${y - h - 8}" width="10" height="9" opacity=".55"/>`;
    const gx = x + w * .5;
    s += `<path d="M${gx - 50} ${y - h - 10} L${gx + 50} ${y - h - 10} L${gx + 40} ${y - h - 40} L${gx - 40} ${y - h - 40}Z" opacity=".7"/><path d="M${gx - 66} ${y - h - 38} Q${gx} ${y - h - 70} ${gx + 66} ${y - h - 38} Q${gx} ${y - h - 50} ${gx - 66} ${y - h - 38}Z"/><path d="M${gx - 14} ${y} L${gx - 14} ${y - h * .55} Q${gx} ${y - h * .8} ${gx + 14} ${y - h * .55} L${gx + 14} ${y}Z" fill="${PAPER}" opacity=".7"/>`;
    return s + `</g>`;
  }
  function tent(x, y, s = 1, op = 1, flag = true) {
    return `<g transform="translate(${x} ${y}) scale(${s})" opacity="${op}"><path d="M-40 0 L0 -44 L40 0Z" fill="${INK}" opacity=".75"/><path d="M-8 0 L0 -18 L8 0Z" fill="${PAPER}" opacity=".6"/>${flag ? `<path d="M0 -44 L0 -84" stroke="${INK}" stroke-width="2"/><path d="M0 -84 L22 -80 L18 -74 L22 -68 L0 -68Z" fill="${VERM}"/>` : ""}</g>`;
  }
  function boat(x, y, s = 1, { sail = true, lamp = false, straw = false, arrows = false, op = 1, people = 0, burning = false, p } = {}) {
    let st = "";
    if (straw) { for (let i = -44; i <= 44; i += 4) st += `<path d="M${i} -6 l${(i % 8 ? 2 : -2)} -22" stroke="#6b5a3a" stroke-width="2" opacity=".8"/>`; }
    if (arrows) { for (let i = -40; i <= 40; i += 6) st += `<path d="M${i} -20 l${i % 12 ? -12 : -9} -${6 + (i % 5)}" stroke="${INK}" stroke-width="1.2"/>`; }
    const ppl = people ? [figure(-8, -6, .32, { kind: "man" }), people > 1 ? figure(10, -6, .3, { kind: "woman", face: -1 }) : ""].join("") : "";
    const lmp = lamp ? `<circle cx="34" cy="-30" r="22" fill="url(#${p}glow)"/><path d="M34 -6 L34 -26" stroke="${INK}" stroke-width="1.5"/><circle cx="34" cy="-28" r="3.6" fill="${LAMP}"/>` : "";
    const fire = burning ? `<path d="M-40 -8 C-40 -40 -20 -50 -16 -84 C-6 -60 4 -66 6 -96 C16 -64 34 -58 30 -30 C40 -40 44 -24 40 -8Z" fill="url(#${p}flame)" filter="url(#${p}soft)"/>` : "";
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${s})" opacity="${op}"><path d="M-60 -6 Q0 14 60 -6 L52 -10 L-52 -10Z" fill="${INK}"/>${sail ? `<path d="M0 -10 L0 -86" stroke="${INK}" stroke-width="2"/><path d="M2 -82 Q22 -60 20 -18 L2 -18Z" fill="${INK}" opacity=".55"/>` : ""}${st}${ppl}${lmp}${fire}</g>`;
  }
  function flames(r, p, x, y, w, h, n = 7) {
    let s = "";
    for (let i = 0; i < n; i++) {
      const fx = x + (r() - .5) * w, fh = h * (.5 + r() * .8), fw = 26 + r() * 40;
      s += `<path d="M${f1(fx - fw / 2)} ${y} C${f1(fx - fw / 2)} ${f1(y - fh * .5)} ${f1(fx - fw * .1)} ${f1(y - fh * .6)} ${f1(fx)} ${f1(y - fh)} C${f1(fx + fw * .15)} ${f1(y - fh * .55)} ${f1(fx + fw / 2)} ${f1(y - fh * .45)} ${f1(fx + fw / 2)} ${y}Z" fill="url(#${p}flame)" opacity="${f1(.7 + r() * .3)}"/>`;
    }
    return `<g filter="url(#${p}soft)">${s}</g>`;
  }
  function smoke(r, p, x, y, n = 6, spread = 200) { let s = ""; for (let i = 0; i < n; i++) s += `<ellipse cx="${f1(x + (r() - .5) * spread)}" cy="${f1(y - i * 40 - r() * 30)}" rx="${f1(60 + r() * 80)}" ry="${f1(26 + r() * 30)}" fill="${INK}" opacity="${f1(.18 + r() * .15)}"/>`; return `<g filter="url(#${p}haze)">${s}</g>`; }
  function snow(r, n = 90, op = .9) { let s = ""; for (let i = 0; i < n; i++) s += `<circle cx="${f1(r() * W)}" cy="${f1(r() * H)}" r="${f1(1 + r() * 2.4)}" fill="#fff" opacity="${f1(op * (.4 + r() * .6))}"/>`; return s; }
  function rain(r, n = 120, op = .35) { let s = ""; for (let i = 0; i < n; i++) { const x = r() * W, y = r() * H; s += `<path d="M${f1(x)} ${f1(y)} l-6 22" stroke="${INK}" stroke-width=".8" opacity="${f1(op * (.4 + r() * .6))}"/>`; } return s; }
  function clouds(r, p, y, n = 6, op = .5) { let s = ""; for (let i = 0; i < n; i++) s += `<ellipse cx="${f1(r() * W)}" cy="${f1(y + (r() - .5) * 60)}" rx="${f1(120 + r() * 160)}" ry="${f1(30 + r() * 30)}" fill="${INK}" opacity="${f1(op * (.5 + r() * .5))}"/>`; return `<g filter="url(#${p}haze)">${s}</g>`; }
  function lightning(p, x, y) { const d = `M${x} ${y} l-18 60 l20 -6 l-26 78 l18 -4 l-22 70`; return `<path d="${d}" stroke="${LAMP}" stroke-width="10" fill="none" opacity=".35" filter="url(#${p}wash)"/><path d="${d}" stroke="#FFF4D6" stroke-width="2.4" fill="none" stroke-linejoin="round"/>`; }
  function moon(p, x, y, r = 34) { return `<circle cx="${x}" cy="${y}" r="${r * 2.4}" fill="#fff" opacity=".12" filter="url(#${p}wash)"/><circle cx="${x}" cy="${y}" r="${r}" fill="#F4EEDC" opacity=".92"/>`; }
  function banners(r, x0, x1, y, n, { color = VERM, h = 70, op = 1 } = {}) { let s = ""; for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * (i + r() * .6) / n, hh = h * (.7 + r() * .5); s += `<g opacity="${op}"><path d="M${f1(x)} ${y} L${f1(x)} ${f1(y - hh)}" stroke="${INK}" stroke-width="1.6"/><path d="M${f1(x)} ${f1(y - hh)} q14 4 26 0 l-5 9 l5 9 q-12 4 -26 0Z" fill="${color}" opacity=".9"/></g>`; } return s; }
  function spears(r, x0, x1, y, n, h = 60, op = .8) { let s = ""; for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * i / n + (r() - .5) * 6; s += `<path d="M${f1(x)} ${y} l${f1((r() - .5) * 4)} -${f1(h * (.8 + r() * .4))}" stroke="${INK}" stroke-width="1.4" opacity="${op}"/>`; } return `<g>${s}</g><rect x="${x0 - 10}" y="${y - 22}" width="${x1 - x0 + 20}" height="24" fill="${INK}" opacity="${op * .55}" filter="url(#__soft)"/>`; }
  function cottage(x, y, s = 1, { snowy = false, smoke: sm = false, p } = {}) {
    return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-70" y="-50" width="140" height="50" fill="${INK}" opacity=".55" filter="url(#${p}brush)"/><path d="M-90 -44 Q-60 -110 0 -116 Q60 -110 90 -44 Q40 -56 0 -56 Q-40 -56 -90 -44Z" fill="${INK}" opacity=".85" filter="url(#${p}rough)"/>${snowy ? `<path d="M-84 -50 Q-56 -106 0 -112 Q56 -106 84 -50 Q40 -86 0 -88 Q-40 -86 -84 -50Z" fill="#fff" opacity=".85" filter="url(#${p}brush)"/>` : ""}<rect x="-16" y="-38" width="22" height="38" fill="${PAPER}" opacity=".5"/><rect x="24" y="-38" width="26" height="18" fill="${LAMP}" opacity=".55"/>${sm ? `<path d="M50 -110 q-16 -30 6 -56 q20 -26 -4 -60" stroke="${INK}" stroke-width="10" opacity=".18" fill="none" filter="url(#${p}wash)"/>` : ""}</g>`;
  }
  function seal(p, text, x, y, s = 1) {
    const chars = [...text]; const n = chars.length; const cols = n > 2 ? 2 : 1; const rows = Math.ceil(n / cols);
    const w = 22 * cols + 10, h = 22 * rows + 10;
    let t = ""; chars.forEach((c, i) => { const col = cols - 1 - Math.floor(i / rows), row = i % rows; t += `<text x="${5 + col * 22 + 11}" y="${5 + row * 22 + 18}" font-size="20" text-anchor="middle" fill="${PAPER}" font-family="'Noto Serif SC','Songti SC',serif" font-weight="600">${c}</text>`; });
    return `<g transform="translate(${x} ${y}) scale(${s}) rotate(-2)" filter="url(#${p}brush)" aria-hidden="true"><rect width="${w}" height="${h}" rx="3" fill="${VERM}" opacity=".9"/>${t}</g>`;
  }
  function paper(p, night) {
    return `<rect width="${W}" height="${H}" fill="url(#${p}paper)"/>${night ? `<rect width="${W}" height="${H}" fill="url(#${p}night)"/>` : ""}`;
  }
  function finish(p, night) { return `<rect width="${W}" height="${H}" filter="url(#${p}grain)" opacity="${night ? .18 : .3}"/><rect width="${W}" height="${H}" fill="url(#${p}vig)"/>`; }

  /* ---------- scenes ---------- */
  const S = {};
  // 许都后园 · 煮酒论英雄
  S.garden = (p, r, L) => [paper(p, L.has("storm")), L.has("storm") ? clouds(r, p, 60, 8, .75) : "",
    mountains(p, r, { base: 250, height: 110, opacity: .25, blur: 12, peaks: 2 }), mist(220, 80),
    wall(120, 330, 520, 46, .45),
    mountains(p, r, { base: 380, height: 50, opacity: .35, blur: 4, peaks: 4 }),
    pavilion(860, 380, 1.15),
    figure(822, 372, .62, { kind: "seated" }), figure(898, 372, .62, { kind: "seated", face: -1 }), figure(940, 378, .5, { kind: "man", face: -1, op: .85 }),
    `<ellipse cx="860" cy="344" rx="20" ry="5" fill="${INK}" opacity=".7"/>`,
    `<path d="M0 420 Q300 400 600 430 T1200 420 L1200 480 L0 480Z" fill="${INK}" opacity=".18" filter="url(#${p}wash)"/>`,
    plum(r, -10, 30, .55, 150, 15),
    L.has("storm") ? lightning(p, 1010, 10) + rain(r, 140, .3) : ""].join("");
  // 夜读 / 衣带诏
  S.lamp = (p, r, L) => [paper(p, true), bamboo(r, 980, 480, 480, 9, .35), bamboo(r, 1060, 480, 460, 7, .25), bamboo(r, 120, 480, 470, 8, .28),
    `<circle cx="600" cy="250" r="260" fill="url(#${p}glow)" opacity=".7"/>`,
    `<g fill="none" stroke="${INK}" stroke-width="6" opacity=".9" filter="url(#${p}brush)"><rect x="380" y="70" width="440" height="300"/>${[1, 2, 3].map(i => `<path d="M${380 + i * 110} 70 V370"/>`).join("")}${[1, 2].map(i => `<path d="M380 ${70 + i * 100} H820"/>`).join("")}</g>`,
    figure(560, 340, 1.5, { kind: "seated", color: "#120f14", op: .9 }), `<rect x="600" y="300" width="70" height="8" fill="#120f14" opacity=".9"/>`,
    `<circle cx="700" cy="286" r="7" fill="#FFE7A3"/><path d="M700 292 V330" stroke="#120f14" stroke-width="4"/>`,
    L.has("edict") ? `<path d="M610 304 q30 -6 52 4 q8 18 -4 30 q-28 -8 -48 -2Z" fill="${VERM}" opacity=".95"/>` : `<rect x="610" y="292" width="40" height="10" fill="${PAPER2}" opacity=".7"/>`,
    `<rect x="0" y="372" width="1200" height="108" fill="#120f14" opacity=".55"/>`].join("");
  // 药圃
  S.herbs = (p, r, L) => [paper(p, false), mountains(p, r, { base: 210, height: 90, opacity: .18, blur: 12, peaks: 2 }), mist(180, 90),
    `<g filter="url(#${p}brush)"><rect x="0" y="236" width="1200" height="100" fill="${INK}" opacity=".08"/><path d="M0 236 H1200" stroke="${INK}" stroke-width="10" opacity=".55"/><path d="M0 226 H1200" stroke="${INK}" stroke-width="3" opacity=".35"/></g>`,
    `<circle cx="300" cy="300" r="72" fill="${PAPER}" stroke="${INK}" stroke-width="6" opacity=".95" filter="url(#${p}brush)"/><circle cx="300" cy="300" r="62" fill="${LAMP}" opacity=".18"/>`,
    ...[0, 1, 2].map(i => `<g transform="translate(${640 + i * 150} ${360 - (i % 2) * 18})"><path d="M-4 0 V60 M60 0 V60" stroke="${INK}" stroke-width="3" opacity=".6"/><ellipse cx="28" cy="0" rx="70" ry="16" fill="#C9B48A" stroke="${INK}" stroke-width="2" opacity=".9"/>${Array.from({ length: 16 }, (_, k) => `<circle cx="${f1(-20 + (k * 37) % 96)}" cy="${f1(-6 + (k * 13) % 12)}" r="3.2" fill="${k % 3 ? "#7a5a3a" : "#5d6b3a"}" opacity=".85"/>`).join("")}</g>`),
    figure(L.has("two") ? 470 : 530, 440, 1.7, { kind: "woman" }),
    L.has("two") ? figure(580, 440, 1.8, { kind: "man", face: -1 }) : "",
    `<path d="M0 430 Q600 410 1200 440 L1200 480 L0 480Z" fill="${INK}" opacity=".16" filter="url(#${p}wash)"/>`,
    plum(r, 1210, 10, 2.5, 120, 11, { petals: L.has("spring") ? 1 : .55 }),
    L.has("romance") ? Array.from({ length: 22 }, () => `<ellipse cx="${f1(380 + r() * 600)}" cy="${f1(150 + r() * 260)}" rx="4" ry="2.4" transform="rotate(${f1(r() * 180)} 0 0)" fill="${ROSE}" opacity="${f1(.4 + r() * .4)}"/>`).join("") : ""].join("");
  // 大路 / 追兵
  S.road = (p, r, L) => [paper(p, false), mountains(p, r, { base: 230, height: 120, opacity: .22, blur: 12, peaks: 2 }), mist(200, 80),
    mountains(p, r, { base: 300, height: 60, opacity: .3, blur: 4, peaks: 5 }),
    wall(980, 300, 200, 26, .35),
    `<path d="M-20 480 C300 420 500 360 760 320 C880 302 960 300 1000 300" stroke="${INK}" stroke-width="60" opacity=".1" fill="none" filter="url(#${p}wash)"/>`,
    ...Array.from({ length: 14 }, (_, i) => figure(250 + i * 30, 430 - i * 7, .5 - i * .015, { kind: "man", face: -1, op: .85 })),
    banners(r, 250, 640, 430, 6, { h: 60 }),
    horse(200, 452, .7, { face: -1, rider: true }),
    L.has("chase") ? [`<ellipse cx="1080" cy="300" rx="140" ry="40" fill="#b9a57d" opacity=".55" filter="url(#${p}haze)"/>`, ...[0, 1, 2, 3, 4].map(i => horse(1000 + i * 40, 318 + (i % 2) * 6, .28, { face: -1, gallop: true, rider: true }))].join("") : ""].join("");
  // 书案 / 信
  S.letter = (p, r, L) => [paper(p, true), `<circle cx="760" cy="220" r="320" fill="url(#${p}glow)" opacity=".75"/>`,
    `<path d="M0 330 L1200 300 L1200 480 L0 480Z" fill="#2a2018" opacity=".85"/>`,
    `<g transform="rotate(-3 600 360)"><rect x="380" y="300" width="380" height="120" fill="#F2E9D6"/>${Array.from({ length: 8 }, (_, i) => `<path d="M${720 - i * 42} 312 V${380 + (i % 3) * 12}" stroke="${INK}" stroke-width="5" stroke-dasharray="7 6" opacity=".7"/>`).join("")}</g>`,
    `<rect x="830" y="300" width="90" height="34" rx="6" fill="#120f14"/><ellipse cx="875" cy="304" rx="30" ry="6" fill="#33302c"/>`,
    `<path d="M300 296 L520 270" stroke="#3a2a1c" stroke-width="7" stroke-linecap="round"/><path d="M520 270 l22 -3" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`,
    `<rect x="760" y="170" width="16" height="130" fill="#E9E2D0"/><path d="M768 168 c-10 -16 4 -28 0 -40 c12 10 14 26 0 40Z" fill="#FFE7A3"/><circle cx="768" cy="150" r="60" fill="url(#${p}glow)"/>`,
    L.has("packet") ? `<g transform="translate(200 360) rotate(8)"><rect width="120" height="80" fill="#B99F6A"/><path d="M0 0 L60 40 L120 0" stroke="#7a6440" stroke-width="2" fill="none"/><rect x="40" y="-6" width="60" height="16" fill="#F2E9D6" transform="rotate(-12)"/></g>` : "",
    L.has("seal") ? `<rect x="600" y="372" width="30" height="30" fill="${VERM}" opacity=".9" transform="rotate(-3 600 360)"/>` : "",
    L.has("window") ? `<g opacity=".6"><rect x="40" y="60" width="240" height="190" fill="#1a1726"/><path d="M40 200 Q160 180 280 205" stroke="${EMBER}" stroke-width="3" fill="none"/>${water(r, 205, 250, { color: LAMP, op: .5, n: 14 })}</g>` : ""].join("");
  // 土山
  S.hill = (p, r, L) => [paper(p, false), clouds(r, p, 80, 5, .25), mountains(p, r, { base: 250, height: 130, opacity: .22, blur: 12, peaks: 2 }), mist(220, 70),
    `<path d="M380 420 C470 300 540 220 600 210 C660 220 740 300 840 420Z" fill="url(#${p}inkfade)" opacity=".85" filter="url(#${p}rough)"/>`,
    figure(596, 214, .75, { kind: "man" }), figure(624, 216, .62, { kind: "woman", face: -1, op: .9 }), figure(642, 218, .58, { kind: "woman", face: -1, op: .85 }),
    `<path d="M570 214 V150" stroke="${INK}" stroke-width="2"/><path d="M570 150 l30 5 l-6 10 l6 10 l-30 0Z" fill="${INK}" opacity=".8"/>`,
    ...[100, 200, 980, 1080, 1160].map((x, i) => tent(x, 440 - (i % 2) * 14, .9)), ...[260, 900].map(x => tent(x, 452, 1.1)),
    horse(470, 430, .55, { rider: true, face: 1 }),
    L.has("escape") ? horse(760, 360, .38, { face: 1, gallop: true, rider: true }) + `<path d="M720 380 C760 360 800 330 860 300" stroke="${INK}" stroke-width="2" stroke-dasharray="4 8" opacity=".5" fill="none"/>` : "",
    `<path d="M0 450 Q600 430 1200 455 L1200 480 L0 480Z" fill="${INK}" opacity=".2" filter="url(#${p}wash)"/>`].join("");
  // 厅堂（挂印封金 / 赤兔）
  S.hall = (p, r, L) => [paper(p, false), `<rect x="0" y="0" width="1200" height="480" fill="${INK}" opacity=".08"/>`,
    `<g fill="${INK}" filter="url(#${p}brush)"><rect x="0" y="40" width="1200" height="22" opacity=".85"/><rect x="120" y="60" width="26" height="420" opacity=".8"/><rect x="1050" y="60" width="26" height="420" opacity=".8"/><rect x="0" y="430" width="1200" height="50" opacity=".25"/></g>`,
    `<rect x="380" y="90" width="440" height="340" fill="${PAPER}" opacity=".6"/><rect x="420" y="110" width="360" height="320" fill="#fff" opacity=".35" filter="url(#${p}wash)"/>`,
    L.has("seal") ? `<path d="M240 62 V180" stroke="${INK}" stroke-width="2"/><rect x="222" y="178" width="36" height="36" rx="3" fill="#C9A24A" stroke="${INK}" stroke-width="2"/><path d="M226 214 q14 22 28 0" stroke="${VERM}" stroke-width="5" fill="none"/>` : "",
    L.has("seal") ? [0, 1, 2].map(i => `<g transform="translate(${170 + i * 70} ${430 - (i === 1 ? 54 : 0)})"><rect x="0" y="-52" width="64" height="52" fill="#5a3d26"/><path d="M4 -48 L60 -4 M60 -48 L4 -4" stroke="#F2E9D6" stroke-width="7" opacity=".9"/></g>`).join("") : "",
    L.has("horse") ? horse(600, 430, 1.3, { face: 1, color: "#7a2418" }) + figure(480, 430, 1.2, { kind: "man" }) : figure(600, 430, 1.25, { kind: "man", face: 1 }) + figure(700, 430, 1.1, { kind: "man", face: -1, op: .8 })].join("");
  // 北方营寨
  S.camp = (p, r, L) => [paper(p, false), clouds(r, p, 60, 6, .3), mountains(p, r, { base: 240, height: 140, opacity: .3, blur: 10, peaks: 3 }), mist(230, 60),
    mountains(p, r, { base: 330, height: 70, opacity: .3, blur: 3, peaks: 6 }),
    ...Array.from({ length: 9 }, (_, i) => tent(80 + i * 130, 410 + (i % 3) * 16, .8 + (i % 2) * .2, .9)),
    banners(r, 60, 1140, 470, 14, { color: "#2f4a6b", h: 110 }),
    `<path d="M0 455 Q600 440 1200 465 L1200 480 L0 480Z" fill="${INK}" opacity=".22" filter="url(#${p}wash)"/>`,
    figure(600, 470, 1.1, { kind: "man" }), figure(660, 470, 1.25, { kind: "man", face: -1 })].join("");
  // 水镜庄
  S.mirror = (p, r, L) => [paper(p, false), mountains(p, r, { base: 230, height: 150, opacity: .28, blur: 10, peaks: 2 }), mist(200, 100),
    ...Array.from({ length: 9 }, (_, i) => bamboo(r, 40 + i * 42, 480, 380 + r() * 80, 6 + r() * 4, .55 + r() * .35)),
    ...Array.from({ length: 6 }, (_, i) => bamboo(r, 900 + i * 50, 480, 300 + r() * 120, 6, .35)),
    `<path d="M380 470 C520 420 720 430 1200 470" stroke="${INK}" stroke-width="40" opacity=".1" fill="none" filter="url(#${p}wash)"/>`, water(r, 420, 470, { n: 26, op: .35 }),
    `<path d="M560 400 Q600 350 680 360 Q720 380 700 400Z" fill="${INK}" opacity=".7" filter="url(#${p}rough)"/>`,
    figure(620, 372, .9, { kind: "seated" }), `<rect x="560" y="356" width="80" height="7" rx="3" fill="#5a3d26" transform="rotate(-6 600 360)"/>`,
    figure(760, 420, .8, { kind: "man", face: -1, op: .85 }), figure(800, 422, .78, { kind: "man", face: -1, op: .7 })].join("");
  // 雪中茅庐
  S.snow = (p, r, L) => [paper(p, false), `<rect width="1200" height="480" fill="#c7cbd0" opacity=".25"/>`,
    mountains(p, r, { base: 250, height: 160, opacity: .35, blur: 8, peaks: 2 }), mist(230, 70, .7),
    `<path d="M0 360 Q300 330 600 350 T1200 340 L1200 480 L0 480Z" fill="#fff" opacity=".7"/>`,
    cottage(820, 370, 1.2, { snowy: true, smoke: true, p }),
    `<g stroke="${INK}" stroke-width="3" opacity=".6">${Array.from({ length: 14 }, (_, i) => `<path d="M${640 + i * 26} 400 V372"/>`).join("")}<path d="M630 380 H1000"/></g>`,
    figure(470, 420, 1.0, { kind: "man" }), figure(410, 424, .95, { kind: "man", op: .85 }), L.has("three") ? figure(350, 428, .9, { kind: "man", op: .8 }) : "", L.has("xushu") ? figure(530, 424, .92, { kind: "man", op: .85 }) : "",
    `<path d="M340 432 H560" stroke="#fff" stroke-width="10" opacity=".7"/>`,
    snow(r, 140, .95)].join("");
  // 长坂桥
  S.bridge = (p, r, L) => [paper(p, false), clouds(r, p, 80, 6, .35), mountains(p, r, { base: 230, height: 110, opacity: .25, blur: 12, peaks: 3 }), mist(210, 70),
    ...Array.from({ length: 16 }, (_, i) => `<g opacity="${f1(.35 + r() * .35)}"><path d="M${f1(700 + i * 32)} 330 l0 -${f1(70 + r() * 60)}" stroke="${INK}" stroke-width="5"/><ellipse cx="${f1(700 + i * 32)}" cy="${f1(250 - r() * 40)}" rx="30" ry="46" fill="${INK}" filter="url(#${p}wash)"/></g>`).join(""),
    L.has("dust") ? `<ellipse cx="920" cy="270" rx="300" ry="80" fill="#b9a57d" opacity=".7" filter="url(#${p}haze)"/>` : "",
    `<path d="M0 420 Q600 360 1200 410 L1200 480 L0 480Z" fill="${INK}" opacity=".12"/>`, water(r, 380, 470, { n: 30, op: .4 }),
    `<g filter="url(#${p}brush)"><path d="M380 380 L760 380 L760 390 L380 390Z" fill="${INK}"/>${[400, 470, 540, 610, 680, 740].map(x => `<path d="M${x} 390 V450" stroke="${INK}" stroke-width="7"/><path d="M${x} 380 V356" stroke="${INK}" stroke-width="4"/>`).join("")}<path d="M380 360 H760" stroke="${INK}" stroke-width="3"/></g>`,
    horse(570, 380, .95, { rider: true, spear: true, face: -1 }),
    ...Array.from({ length: 10 }, () => figure(60 + r() * 260, 440 + r() * 30, .4 + r() * .2, { kind: r() < .4 ? "woman" : "man", face: -1, op: .6 })),
    L.has("rescue") ? horse(240, 380, .5, { rider: true, gallop: true, face: -1, riderColor: "#F4EEDC" }) + figure(160, 400, .45, { kind: "woman", face: -1 }) : ""].join("");
  // 长坂·曹营视角
  S.slope = (p, r, L) => [paper(p, false), clouds(r, p, 60, 6, .3), mountains(p, r, { base: 220, height: 120, opacity: .25, blur: 12, peaks: 2 }), mist(200, 60),
    `<path d="M780 200 Q900 130 1200 120 L1200 480 L760 480Z" fill="url(#${p}inkfade)" opacity=".7" filter="url(#${p}rough)"/>`,
    banners(r, 920, 1120, 170, 5, { h: 80 }), figure(980, 168, .7, { kind: "man", face: -1 }), figure(1020, 166, .66, { kind: "man", face: -1, op: .85 }),
    spears(r, 40, 700, 360, 60, 70, .7), spears(r, 80, 720, 440, 70, 80, .85),
    `<path d="M120 420 C260 380 420 370 640 330" stroke="${PAPER}" stroke-width="40" opacity=".5" fill="none" filter="url(#${p}wash)"/>`,
    horse(380, 400, .9, { rider: true, gallop: true, face: 1, color: "#3a3430", riderColor: "#F7F1E2", spear: true, child: true }),
    L.has("gap") ? [0, 1].map(i => `<g transform="translate(${80 + i * 70} ${300 + i * 6}) scale(.5)"><rect x="-40" y="-40" width="80" height="34" fill="${INK}" opacity=".7"/><circle cx="-24" cy="0" r="12" fill="none" stroke="${INK}" stroke-width="5"/><circle cx="24" cy="0" r="12" fill="none" stroke="${INK}" stroke-width="5"/></g>`).join("") : ""].join("");
  // 江雾（草船 / 凤雏）
  S.fog = (p, r, L) => [paper(p, true), `<rect width="1200" height="480" fill="#d9d4c6" opacity=".25"/>`,
    mountains(p, r, { base: 200, height: 60, opacity: .25, blur: 14, peaks: 3 }),
    ...Array.from({ length: 8 }, (_, i) => `<circle cx="${f1(150 + i * 130)}" cy="200" r="20" fill="${LAMP}" opacity=".35" filter="url(#${p}wash)"/>`),
    water(r, 230, 480, { n: 70, op: .25, color: "#e8e2d2" }),
    ...(L.has("arrows") ? [0, 1, 2, 3].map(i => boat(240 + i * 230, 330 + (i % 2) * 40, .9 + (i % 2) * .15, { straw: true, arrows: true, sail: false, p })) : [boat(600, 380, 1.3, { lamp: true, people: 2, p })]),
    `<rect x="0" y="150" width="1200" height="320" fill="#ddd6c6" opacity=".45" filter="url(#${p}haze)"/>`,
    L.has("arrows") ? boat(860, 430, 1.25, { lamp: true, people: 2, p }) : ""].join("");
  // 赤壁
  S.fire = (p, r, L) => {
    const burning = L.has("burning");
    const ships = [];
    for (let i = 0; i < 9; i++) ships.push(boat(140 + i * 110, 300 + (i % 2) * 10, .85, { burning, p }));
    const chain = `<path d="M90 300 H1080" stroke="${INK}" stroke-width="3" stroke-dasharray="8 5" opacity=".8"/>`;
    return [paper(p, !burning), burning ? `<rect width="1200" height="480" fill="url(#${p}firesky)"/>` : moon(p, 1020, 90, 30),
      `<path d="M0 260 C200 160 300 180 420 230 L420 260Z" fill="${INK}" opacity="${burning ? .85 : .6}" filter="url(#${p}rough)"/>`,
      `<path d="M820 250 C960 200 1100 210 1200 220 L1200 260 L820 260Z" fill="${INK}" opacity=".6" filter="url(#${p}rough)"/>`,
      L.has("camp_burning") ? flames(r, p, 1060, 248, 200, 70, 5) : "", L.has("camp_empty") ? `<g opacity=".7">${tent(1000, 250, .5, 1, false)}${tent(1090, 250, .5, 1, false)}</g>` : "",
      ships.join(""), chain,
      burning ? flames(r, p, 600, 300, 1000, 160, 14) + smoke(r, p, 600, 160, 10, 900) : "",
      water(r, 320, 480, { n: 80, op: burning ? .6 : .3, color: burning ? LAMP : "#e8e2d2" }),
      burning ? Array.from({ length: 18 }, () => `<path d="M${f1(100 + r() * 1000)} ${f1(330 + r() * 30)} v${f1(40 + r() * 90)}" stroke="${EMBER}" stroke-width="${f1(2 + r() * 5)}" opacity=".35" filter="url(#${p}soft)"/>`).join("") : "",
      L.has("reserve") ? [0, 1, 2, 3].map(i => boat(140 + i * 90, 430, .6, { sail: true, op: .9 })).join("") : "",
      L.has("boat") ? boat(980, 420, 1.1, { sail: false, lamp: true, people: 2, p }) : "",
      L.has("fireships") ? [0, 1, 2].map(i => boat(240 + i * 120, 400, .7, { burning: true, sail: true, p })).join("") : ""].join("");
  };
  // 华容道
  S.huarong = (p, r, L) => [paper(p, false), clouds(r, p, 50, 8, .45), rain(r, 90, .25),
    `<path d="M0 0 L0 480 L360 480 C320 380 300 260 340 120 C360 60 330 20 300 0Z" fill="url(#${p}inkfade)" opacity=".95" filter="url(#${p}rough)"/>`,
    `<path d="M1200 0 L1200 480 L820 480 C860 380 900 280 860 140 C840 80 880 30 900 0Z" fill="url(#${p}inkfade)" opacity=".95" filter="url(#${p}rough)"/>`,
    mist(140, 120, .55),
    `<path d="M380 480 C440 400 520 340 600 300 C660 270 720 250 760 230" stroke="#8a7a5a" stroke-width="70" opacity=".35" fill="none" filter="url(#${p}wash)"/>`,
    ...Array.from({ length: 9 }, (_, i) => figure(430 + i * 24, 470 - i * 18, .55 - i * .03, { kind: "man", face: 1, op: .8 })),
    horse(560, 380, .5, { rider: true, face: 1, color: "#3a3430" }),
    L.has("blocker") ? horse(740, 250, .7, { rider: true, spear: true, face: -1 }) + banners(r, 780, 840, 240, 3, { h: 70 }) : "",
    L.has("medic") ? figure(400, 478, .62, { kind: "woman", held: "box" }) : ""].join("");
  // 夜营篝火
  S.campfire = (p, r, L) => [paper(p, true), `<rect width="1200" height="480" fill="#120f1c" opacity=".35"/>`,
    mountains(p, r, { base: 250, height: 110, opacity: .55, blur: 10, peaks: 2, fill: "#0e0c14" }),
    L.has("wall") ? `<g opacity=".8">${wall(160, 300, 520, 50, .9)}</g>` + Array.from({ length: 6 }, (_, i) => `<circle cx="${200 + i * 85}" cy="240" r="16" fill="${LAMP}" opacity=".4" filter="url(#${p}wash)"/>`).join("") : [tent(150, 380, 1.2, .9, false), tent(1030, 390, 1.4, .9, false), tent(900, 360, .9, .7, false)].join(""),
    `<rect x="0" y="380" width="1200" height="100" fill="#0b0a10" opacity=".75"/>`,
    `<circle cx="600" cy="400" r="230" fill="url(#${p}glow)" opacity=".9"/>`,
    flames(r, p, 600, 410, 70, 110, 6),
    `<g stroke="#2a2018" stroke-width="10" stroke-linecap="round"><path d="M548 420 L652 404"/><path d="M552 404 L648 422"/></g>`,
    Array.from({ length: 26 }, () => `<circle cx="${f1(560 + r() * 80 + (r() - .5) * 120)}" cy="${f1(380 - r() * 220)}" r="${f1(1 + r() * 1.8)}" fill="${LAMP}" opacity="${f1(.4 + r() * .6)}"/>`).join(""),
    figure(480, 430, 1.25, { kind: "seated", color: "#0b0a10" }), figure(722, 430, 1.25, { kind: "seated", face: -1, color: "#0b0a10" }),
    L.has("blade") ? `<path d="M650 400 L800 392" stroke="#cfc6b0" stroke-width="4" stroke-linecap="round" opacity=".85"/><path d="M800 392 q14 -2 22 -12" stroke="#cfc6b0" stroke-width="4" fill="none"/>` : ""].join("");
  // 战后江边
  S.riverbank = (p, r, L) => [paper(p, true), `<rect width="1200" height="480" fill="#141225" opacity=".3"/>`, moon(p, 260, 90, 26),
    mountains(p, r, { base: 230, height: 70, opacity: .5, blur: 10, peaks: 3, fill: "#0e0c14" }),
    Array.from({ length: 5 }, (_, i) => `<circle cx="${700 + i * 90}" cy="${222 + (i % 2) * 6}" r="${18 + i * 3}" fill="${EMBER}" opacity=".35" filter="url(#${p}wash)"/>`).join(""),
    smoke(r, p, 900, 200, 5, 400),
    water(r, 240, 400, { n: 60, op: .35, color: "#d8cfb8" }),
    Array.from({ length: 7 }, () => `<rect x="${f1(380 + r() * 700)}" y="${f1(260 + r() * 110)}" width="${f1(40 + r() * 60)}" height="5" rx="2" fill="#0b0a10" opacity=".75" transform="rotate(${f1((r() - .5) * 20)} 600 300)"/>`).join(""),
    `<path d="M0 400 Q300 380 600 396 T1200 390 L1200 480 L0 480Z" fill="#17140f" opacity=".85"/>`,
    figure(520, 420, 1.15, { kind: "seated", color: "#0b0a10" }), `<path d="M560 402 l26 -16" stroke="#cfc6b0" stroke-width="3"/>`,
    L.has("two") ? figure(640, 424, 1.25, { kind: "man", face: -1, color: "#0b0a10" }) : ""].join("");
  // 尾声
  S.ending = (p, r, L) => [paper(p, false), `<circle cx="960" cy="140" r="54" fill="${LAMP}" opacity=".55" filter="url(#${p}wash)"/><circle cx="960" cy="140" r="36" fill="${VERM}" opacity=".55"/>`,
    mountains(p, r, { base: 230, height: 150, opacity: .3, blur: 10, peaks: 2 }), mist(200, 90),
    mountains(p, r, { base: 320, height: 70, opacity: .35, blur: 3, peaks: 4 }),
    water(r, 330, 480, { n: 50, op: .3 }),
    L.has("city") ? wall(700, 330, 380, 40, .5) : "",
    L.has("home") ? cottage(260, 350, .8, { smoke: true, p }) + figure(360, 352, .55, { kind: "man" }) + figure(384, 354, .52, { kind: "woman", face: -1 }) : "",
    L.has("two_boat") ? boat(620, 420, 1.1, { sail: true, people: 2, p }) : "",
    L.has("lone") ? figure(300, 360, .7, { kind: "man" }) + `<path d="M220 362 H420" stroke="${INK}" stroke-width="3" opacity=".5"/>` : "",
    L.has("plum") ? plum(r, -10, 40, .6, 120, 12) : "",
    L.has("sail") ? boat(980, 360, .5, { sail: true, op: .7 }) : ""].join("");


  /* ---------- volume II ---------- */
  // 城下（南郡 / 雒城 / 成都）
  S.citywall = (p, r, L) => [paper(p, L.has("dusk")), L.has("dusk") ? `<rect width="1200" height="480" fill="#E8A76A" opacity=".18"/>` : clouds(r, p, 70, 6, .35),
    mountains(p, r, { base: 230, height: 120, opacity: .28, blur: 12, peaks: 2 }), mist(200, 60),
    `<g filter="url(#${p}brush)"><rect x="300" y="190" width="600" height="150" fill="${INK}" opacity=".78"/>${Array.from({ length: 16 }, (_, i) => `<rect x="${300 + i * 38}" y="176" width="22" height="18" fill="${INK}" opacity=".78"/>`).join("")}
      <path d="M540 340 V262 Q600 222 660 262 V340Z" fill="${L.has("open") ? "#E9DFC9" : "#2a241e"}"/><path d="M520 190 L600 132 L680 190Z" fill="${INK}" opacity=".85"/><rect x="540" y="150" width="120" height="40" fill="${INK}" opacity=".7"/></g>`,
    banners(r, 320, 880, 176, 7, { h: 60, color: L.has("flag_liu") ? "#4f7a58" : L.has("flag_wu") ? "#b0503a" : "#4f6688" }),
    `<path d="M0 380 Q600 340 1200 380 L1200 480 L0 480Z" fill="${INK}" opacity=".1"/>`,
    L.has("siege") ? spears(r, 80, 1120, 440, 70, 70, .75) + [0, 1, 2].map(i => `<path d="M${380 + i * 200} 440 L${420 + i * 200} 200" stroke="#5a3d26" stroke-width="6"/>`).join("") : "",
    L.has("rider") ? horse(600, 420, .9, { rider: true, spear: true, face: 1, riderColor: "#F4EEDC" }) : figure(600, 430, .9, { kind: "man" }),
    L.has("crowd") ? Array.from({ length: 14 }, (_, i) => figure(240 + i * 55 + (r() - .5) * 20, 455 + r() * 14, .55, { kind: r() < .3 ? "woman" : "man", op: .7 })).join("") : ""].join("");
  // 甘露寺
  S.temple = (p, r, L) => [paper(p, false), clouds(r, p, 60, 5, .3), mountains(p, r, { base: 260, height: 170, opacity: .3, blur: 10, peaks: 2 }), mist(230, 70),
    `<path d="M0 480 L0 330 Q300 260 620 300 Q900 330 1200 300 L1200 480Z" fill="${INK}" opacity=".16" filter="url(#${p}rough)"/>`,
    pavilion(720, 300, 1.5), `<g opacity=".8">${pavilion(950, 280, .9, .8)}</g>`,
    ...[90, 190, 1110].map(x => `<g filter="url(#${p}brush)"><path d="M${x} 480 L${x + 6} 200" stroke="${INK}" stroke-width="10"/>${[0, 1, 2, 3].map(i => `<ellipse cx="${x + (i % 2 ? 40 : -30)}" cy="${220 + i * 50}" rx="70" ry="22" fill="${INK}" opacity=".55"/>`).join("")}</g>`),
    figure(680, 300, .8, { kind: "woman", face: 1 }), figure(760, 300, .85, { kind: "man", face: -1 }), figure(820, 302, .78, { kind: "man", face: -1, op: .85 }),
    L.has("ambush") ? spears(r, 840, 1060, 300, 22, 50, .9) + `<g opacity=".7">${[0, 1, 2, 3].map(i => figure(880 + i * 40, 302, .6, { kind: "man", face: -1, color: "#2a241e" })).join("")}</g>` : "",
    L.has("rock") ? `<g filter="url(#${p}rough)"><path d="M360 430 Q400 370 470 380 Q520 400 500 440Z" fill="#6a6258"/><path d="M432 376 L440 440" stroke="${PAPER}" stroke-width="5"/></g>` + figure(320, 440, .7, { kind: "man" }) : ""].join("");
  // 大江上的船（截江）
  S.bigriver = (p, r, L) => [paper(p, false), clouds(r, p, 50, 6, .35), mountains(p, r, { base: 200, height: 90, opacity: .28, blur: 12, peaks: 3 }), mist(180, 60),
    water(r, 220, 480, { n: 90, op: .35 }),
    `<g filter="url(#${p}brush)"><path d="M380 330 L860 330 L820 380 L420 380Z" fill="${INK}" opacity=".85"/><path d="M620 330 V140" stroke="${INK}" stroke-width="8"/><path d="M626 150 Q760 200 626 300Z" fill="#E9DFC9" stroke="${INK}" stroke-width="3"/>${[0, 1, 2, 3, 4].map(i => `<path d="M${440 + i * 80} 380 l-30 50" stroke="${INK}" stroke-width="4"/>`).join("")}</g>`,
    figure(700, 330, .8, { kind: "woman", face: -1 }), figure(560, 330, .7, { kind: "man", face: 1, op: .8 }),
    L.has("child") ? `<ellipse cx="690" cy="300" rx="8" ry="10" fill="#F4EEDC" stroke="${INK}" stroke-width="2"/>` : "",
    L.has("zhaoyun") ? boat(280, 400, .8, { sail: false, people: 1 }) + figure(420, 330, .78, { kind: "man", face: 1, color: "#3a4656" }) : "",
    L.has("blockade") ? [0, 1, 2].map(i => boat(960 + i * 70, 360 + i * 30, .7, { sail: true, op: .9 })).join("") + banners(r, 940, 1140, 330, 4, { h: 50, color: "#4f7a58" }) : "",
    L.has("wu_ships") ? [0, 1].map(i => boat(120 + i * 110, 320 + i * 20, .6, { sail: true, op: .8 })).join("") + banners(r, 100, 260, 300, 3, { h: 40, color: "#b0503a" }) : ""].join("");
  // 灵堂（吊丧）
  S.mourning = (p, r, L) => [paper(p, true), `<rect width="1200" height="480" fill="#1a1724" opacity=".28"/>`,
    `<g filter="url(#${p}brush)"><rect x="140" y="40" width="20" height="400" fill="${INK}" opacity=".85"/><rect x="1040" y="40" width="20" height="400" fill="${INK}" opacity=".85"/><rect x="120" y="40" width="960" height="26" fill="${INK}" opacity=".85"/></g>`,
    ...[260, 420, 780, 940].map((x, i) => `<path d="M${x} 66 C${x - 16} 160 ${x + 16} 240 ${x} ${330 + (i % 2) * 20}" stroke="#F4EEDC" stroke-width="34" fill="none" opacity=".85"/>`),
    `<rect x="470" y="300" width="260" height="70" rx="8" fill="#2a241e"/><rect x="560" y="200" width="80" height="100" fill="#F4EEDC" stroke="${INK}" stroke-width="3"/>`,
    ...[540, 660].map(x => `<circle cx="${x}" cy="230" r="26" fill="${LAMP}" opacity=".5" filter="url(#${p}wash)"/><rect x="${x - 3}" y="232" width="6" height="40" fill="#EDE3CC"/>`),
    figure(600, 440, 1.0, { kind: "seated" }),
    L.has("crowd") ? Array.from({ length: 8 }, (_, i) => figure(200 + i * 30, 444, .7, { kind: "man", op: .6 })).join("") + Array.from({ length: 8 }, (_, i) => figure(790 + i * 30, 444, .7, { kind: "man", face: -1, op: .6 })).join("") : "",
    L.has("phoenix") ? figure(1100, 446, .85, { kind: "man", face: -1, color: "#3a3020" }) : ""].join("");
  // 落凤坡
  S.ravine = (p, r, L) => [paper(p, false), `<rect width="1200" height="480" fill="#4a5a3a" opacity=".08"/>`,
    `<path d="M0 0 L0 480 L420 480 C380 380 360 240 420 120 C440 60 420 20 400 0Z" fill="url(#${p}inkfade)" opacity=".95" filter="url(#${p}rough)"/>`,
    `<path d="M1200 0 L1200 480 L780 480 C820 360 840 240 780 120 C760 60 800 20 820 0Z" fill="url(#${p}inkfade)" opacity=".95" filter="url(#${p}rough)"/>`,
    ...Array.from({ length: 14 }, (_, i) => bamboo(r, (i < 7 ? 40 + i * 50 : 800 + (i - 7) * 52), 300 - (i % 3) * 20, 200, 6, .7)),
    mist(200, 90, .5),
    `<path d="M520 480 C560 400 600 320 640 220" stroke="#8a7a5a" stroke-width="80" opacity=".3" fill="none" filter="url(#${p}wash)"/>`,
    horse(L.has("turnback") ? 600 : 610, L.has("turnback") ? 380 : 340, .7, { rider: true, face: L.has("turnback") ? -1 : 1, color: "#F4EEDC", riderColor: "#2a241e" }),
    ...Array.from({ length: 6 }, (_, i) => figure(560 + i * 10, 440 + i * 6, .45, { kind: "man", op: .6 })),
    L.has("arrows") ? Array.from({ length: 40 }, () => { const x = 360 + r() * 500, y = 80 + r() * 260; return `<path d="M${f1(x)} ${f1(y)} l${f1(30 + r() * 20)} ${f1(12 + r() * 10)}" stroke="${INK}" stroke-width="2"/>`; }).join("") : "",
    L.has("you") ? figure(520, 460, .55, { kind: "man", face: 1, color: "#3a2e1e" }) : ""].join("");

  /* ---------- key-moment CGs (1200×720, close framing) ---------- */
  const CG = {};
  // 煮酒·惊雷：匙箸落地
  CG.thunder = (p, r) => [paper(p, true), `<rect width="1200" height="720" fill="#14111f" opacity=".45"/>`,
    lightning(p, 900, 0), lightning(p, 300, 40), rain(r, 260, .35),
    `<g fill="${INK}" filter="url(#${p}brush)"><rect x="80" y="0" width="34" height="560"/><rect x="1086" y="0" width="34" height="560"/><path d="M0 0 H1200 V60 Q600 110 0 60Z"/></g>`,
    plum(r, 1220, 70, 2.6, 140, 12),
    figure(330, 600, 4.2, { kind: "seated", color: "#0b0a10", hat: "crown" }), figure(880, 600, 4.2, { kind: "seated", face: -1, color: "#0b0a10", hat: "tall" }),
    `<path d="M0 560 L1200 540 L1200 720 L0 720Z" fill="#20160f"/><path d="M0 560 L1200 540" stroke="#4a3a28" stroke-width="6"/>`,
    `<g><ellipse cx="560" cy="566" rx="46" ry="12" fill="#3a2a1c"/><path d="M520 566 L530 520 L590 520 L600 566Z" fill="#5a4630"/><ellipse cx="760" cy="560" rx="30" ry="9" fill="#3a2a1c"/><path d="M736 560 L744 528 L776 528 L784 560Z" fill="#5a4630"/></g>`,
    `<g stroke="#E9DCC0" stroke-width="5" stroke-linecap="round"><path d="M640 430 L700 480"/><path d="M660 420 L702 500"/></g><g stroke="#E9DCC0" stroke-width="2" opacity=".35"><path d="M630 400 L644 414"/><path d="M650 392 L664 406"/><path d="M640 380 L654 394"/></g>`,
    `<path d="M690 520 Q700 500 720 512" stroke="#C9A24A" stroke-width="5" fill="none" stroke-linecap="round"/>`].join("");
  // 土山·执笔三约
  CG.terms = (p, r) => [paper(p, true), `<rect width="1200" height="720" fill="#14111f" opacity=".35"/>`, moon(p, 980, 120, 40),
    mountains(p, r, { base: 380, height: 120, opacity: .6, blur: 10, peaks: 2, fill: "#0e0c14" }),
    ...[120, 260, 1000, 1120].map((x, i) => `<g opacity=".7">${tent(x, 470 + (i % 2) * 20, 1.2, 1)}</g>`),
    `<circle cx="560" cy="520" r="300" fill="url(#${p}glow)" opacity=".85"/>`,
    `<path d="M0 560 Q600 520 1200 570 L1200 720 L0 720Z" fill="#17140f"/>`,
    `<g transform="rotate(-4 560 600)"><rect x="380" y="560" width="360" height="110" fill="#F2E9D6"/>${[0, 1, 2].map(i => `<path d="M${690 - i * 70} 574 V${640 - i * 6}" stroke="${INK}" stroke-width="8" stroke-dasharray="10 7"/>`).join("")}</g>`,
    `<path d="M520 560 L610 470" stroke="#3a2a1c" stroke-width="9" stroke-linecap="round"/><path d="M610 470 l14 -14" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`,
    `<rect x="760" y="520" width="18" height="60" fill="#E9E2D0"/><path d="M769 518 c-12 -18 6 -32 0 -44 c14 12 16 30 0 44Z" fill="#FFE7A3"/>`,
    figure(330, 640, 3.8, { kind: "seated", color: "#0b0a10" }),
    figure(900, 640, 4.6, { kind: "man", face: -1, color: "#0b0a10" }),
    `<path d="M886 404 C888 470 896 520 904 560 Q912 586 920 560 C926 520 930 470 930 404 Q914 420 908 420 Q896 418 886 404Z" fill="#0b0a10"/>`,
    `<path d="M1000 640 L1060 300" stroke="#0b0a10" stroke-width="8"/><path d="M1060 300 q24 -40 4 -90 q-14 40 -30 60Z" fill="#0b0a10"/>`].join("");
  // 赤壁·夜驾小舟
  CG.fireboat = (p, r) => [paper(p, false), `<rect width="1200" height="720" fill="url(#${p}firesky)"/>`,
    smoke(r, p, 600, 260, 12, 1100),
    ...Array.from({ length: 6 }, (_, i) => boat(120 + i * 200, 330 + (i % 2) * 14, 1.1, { burning: true, p })),
    flames(r, p, 600, 340, 1200, 220, 16),
    water(r, 360, 720, { n: 140, op: .6, color: LAMP }),
    Array.from({ length: 30 }, () => `<path d="M${f1(r() * 1200)} ${f1(370 + r() * 40)} v${f1(60 + r() * 160)}" stroke="${EMBER}" stroke-width="${f1(3 + r() * 6)}" opacity=".35" filter="url(#${p}soft)"/>`).join(""),
    `<g transform="translate(620 600) scale(3.2)"><path d="M-70 -6 Q0 16 70 -6 L60 -12 L-60 -12Z" fill="#0b0a10"/><path d="M40 -12 L40 -44" stroke="#0b0a10" stroke-width="1.6"/><circle cx="40" cy="-46" r="16" fill="url(#${p}glow)"/><circle cx="40" cy="-46" r="3" fill="#FFE7A3"/>${figure(-26, -10, .42, { kind: "man", color: "#0b0a10" })}${figure(8, -10, .4, { kind: "woman", face: -1, color: "#0b0a10", held: "box" })}<path d="M-40 -18 L-62 6" stroke="#0b0a10" stroke-width="1.6"/></g>`].join("");
  // 华容道·拨马让路
  CG.turn = (p, r) => [paper(p, false), clouds(r, p, 80, 10, .55), rain(r, 160, .25),
    `<path d="M0 0 L0 720 L300 720 C260 560 240 380 300 160 C320 80 290 30 260 0Z" fill="url(#${p}inkfade)" filter="url(#${p}rough)"/>`,
    `<path d="M1200 0 L1200 720 L960 720 C990 560 1010 380 960 180 C940 100 980 40 1000 0Z" fill="url(#${p}inkfade)" filter="url(#${p}rough)"/>`,
    mist(260, 200, .55),
    `<path d="M300 720 C420 600 560 520 700 470" stroke="#8a7a5a" stroke-width="140" opacity=".3" fill="none" filter="url(#${p}wash)"/>`,
    ...Array.from({ length: 12 }, (_, i) => figure(360 + i * 26, 690 - i * 18, .9 - i * .04, { kind: "man", face: 1, op: .7 })),
    horse(520, 560, .9, { rider: true, face: 1, color: "#3a3430" }),
    horse(850, 640, 2.6, { rider: true, spear: true, face: -1, color: "#0b0a10" }),
    `<path d="M760 420 Q820 400 880 430" stroke="${PAPER}" stroke-width="3" fill="none" opacity=".6"/>`,
    banners(r, 1000, 1080, 470, 2, { h: 160 })].join("");
  // 江边·说出口
  CG.river = (p, r) => [paper(p, true), `<rect width="1200" height="720" fill="#141225" opacity=".35"/>`, moon(p, 860, 170, 70),
    mountains(p, r, { base: 380, height: 90, opacity: .55, blur: 10, peaks: 3, fill: "#0e0c14" }),
    water(r, 400, 600, { n: 110, op: .4, color: "#e8e2d2" }),
    `<path d="M780 420 Q860 470 940 600" stroke="#F4EEDC" stroke-width="40" opacity=".12" filter="url(#${p}wash)" fill="none"/>`,
    Array.from({ length: 40 }, () => { const x = r() * 1200; return `<path d="M${f1(x)} 720 q${f1((r() - .5) * 20)} -${f1(60 + r() * 110)} ${f1((r() - .5) * 30)} -${f1(110 + r() * 120)}" stroke="#0b0a10" stroke-width="${f1(2 + r() * 2)}" fill="none" opacity=".8"/>`; }).join(""),
    `<path d="M0 620 Q600 590 1200 630 L1200 720 L0 720Z" fill="#0b0a10"/>`,
    figure(540, 640, 3.2, { kind: "seated", color: "#0b0a10", woman: true }), figure(680, 640, 3.4, { kind: "seated", face: -1, color: "#0b0a10" }),
    Array.from({ length: 14 }, () => `<ellipse cx="${f1(400 + r() * 500)}" cy="${f1(220 + r() * 300)}" rx="5" ry="3" fill="#E07A8C" opacity="${f1(.3 + r() * .4)}"/>`).join("")].join("");
  function cg(id, { label = "" } = {}) {
    const fn = CG[id]; if (!fn) return "";
    const p = "c" + (++uid) + "_"; const r = rng(hash("cg|" + id));
    const W0 = W, H0 = H; W = 1200; H = 720;
    let body; try { body = fn(p, r).replace(/url\(#__/g, `url(#${p}`); } finally { W = W0; H = H0; }
    W = 1200; H = 720; const fin = finish(p, 1); W = W0; H = H0;
    return `<svg viewBox="0 0 1200 720" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label.replace(/"/g, "&quot;")}" preserveAspectRatio="xMidYMid slice">${defs(p, 1)}${body}${fin}</svg>`;
  }

  const SEALS = { garden: "许都", lamp: "夜读", herbs: "药圃", road: "出许", letter: "家书", hill: "土山", hall: "封金", camp: "冀州", mirror: "水镜", snow: "隆中", bridge: "长坂", slope: "长坂", fog: "大江", fire: "赤壁", huarong: "华容", ending: "子衡", campfire: "夜话", riverbank: "江畔", citywall: "城下", temple: "甘露", bigriver: "截江", mourning: "吊丧", ravine: "落凤" };
  const NIGHT = { lamp: 1, letter: 1, fog: 1, campfire: 1, riverbank: 1, mourning: 1 };

  function scene(id, layers = [], { label = "", seal = true } = {}) {
    const fn = S[id]; if (!fn) return "";
    const L = new Set(layers);
    const p = "a" + (++uid) + "_";
    const r = rng(hash(id + "|" + [...L].sort().join(",")));
    const night = NIGHT[id] || (id === "fire" && !L.has("burning")) ? 1 : 0;
    let body = fn(p, r, L);
    body = body.replace(/url\(#__/g, `url(#${p}`);
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label.replace(/"/g, "&quot;")}" preserveAspectRatio="xMidYMid slice">${defs(p, night)}${body}${finish(p, night)}${seal ? seal_(p, SEALS[id]) : ""}</svg>`;
  }
  const seal_ = (p, t) => seal(p, t, 1120, 380, 1);

  /* ---------- character seal (portrait substitute) ---------- */
  function charSeal(text, { color = VERM, size = 44, rose = false } = {}) {
    const chars = [...text].slice(0, 2);
    const fs = chars.length > 1 ? 15 : 24;
    const inner = chars.length > 1
      ? chars.map((c, i) => `<text x="${size / 2}" y="${size / 2 - 4 + i * 17}" font-size="${fs}" text-anchor="middle" fill="${PAPER}" font-family="'Noto Serif SC','Songti SC',serif" font-weight="600">${c}</text>`).join("")
      : `<text x="${size / 2}" y="${size / 2 + 8}" font-size="${fs}" text-anchor="middle" fill="${PAPER}" font-family="'Noto Serif SC','Songti SC',serif" font-weight="600">${chars[0]}</text>`;
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"><rect x="1" y="1" width="${size - 2}" height="${size - 2}" rx="${rose ? size / 2 : 5}" fill="${color}"/><rect x="4" y="4" width="${size - 8}" height="${size - 8}" rx="${rose ? size / 2 : 3}" fill="none" stroke="${PAPER}" stroke-width="1" opacity=".5"/>${inner}</svg>`;
  }

  /* ---------- journey map ---------- */
  const PLACES_V1 = {
    xuchang: { x: 520, y: 210, zh: "许都", en: "Xuchang" }, xiapi: { x: 820, y: 200, zh: "下邳", en: "Xiapi" }, jizhou: { x: 560, y: 60, zh: "冀州", en: "Jizhou" },
    gucheng: { x: 470, y: 270, zh: "古城", en: "Gucheng" }, xinye: { x: 400, y: 330, zh: "新野", en: "Xinye" }, changban: { x: 430, y: 410, zh: "长坂", en: "Changban" },
    chibi: { x: 610, y: 470, zh: "赤壁", en: "Red Cliffs" }, huarong: { x: 520, y: 450, zh: "华容", en: "Huarong" }, xiakou: { x: 660, y: 430, zh: "夏口", en: "Xiakou" },
  };
  const RIVERS_V1 = [{ d: "M80 150 C250 120 400 170 560 140 C700 115 820 150 980 120", w: 10, label: [860, 108, { zh: "黄河", en: "Yellow River" }] },
    { d: "M60 440 C200 400 330 470 470 470 C600 470 700 430 820 450 C900 465 960 440 1000 430", w: 14, label: [860, 490, { zh: "长江", en: "Yangtze" }] },
    { d: "M380 260 C400 300 420 360 440 420", w: 6, op: .35 }];
  // The journey map (v2.19). A route walked again is drawn once, so a campaign that goes back and forth stays one
  // clean line; the last few legs are strong and older ones fade. Legs walked since the map was last shown draw in one
  // after another (animateFrom = how many legs were already on show; -1 = no animation), then the current place glows.
  // Only places you have been get a name, placed where it doesn't collide with another name or dot.
  function journeyMap(stops, { lang = "zh", current, places: PLACES_ = null, rivers = null, animateFrom = -1 } = {}) {
    const PLACES = PLACES_ || PLACES_V1;
    const p = "m" + (++uid) + "_";
    const r = rng(7);
    const walk = stops.filter(s => PLACES[s]).filter((s, i, a) => !i || a[i - 1] !== s);
    const seen = new Set(walk);
    const hash = k => { let h = 7; for (const ch of k) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
    const curve = (a, b) => { // the same bend whichever way the leg is walked
      const [u, v] = [a, b].sort(), A = PLACES[u], B = PLACES[v], dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1;
      const bend = ((hash(u + v) % 100) / 100 - .5) * Math.min(80, len * .35) + (len > 120 ? 18 : 8);
      const cx = (A.x + B.x) / 2 - dy / len * bend, cy = (A.y + B.y) / 2 + dx / len * bend;
      return a === u ? `M${A.x} ${A.y} Q${f1(cx)} ${f1(cy)} ${B.x} ${B.y}` : `M${B.x} ${B.y} Q${f1(cx)} ${f1(cy)} ${A.x} ${A.y}`;
    };
    const steps = []; for (let i = 1; i < walk.length; i++) steps.push([walk[i - 1], walk[i]]);
    const legs = new Map(); steps.forEach(([a, b], i) => { const k = [a, b].sort().join("|"); const L = legs.get(k) || { a, b, n: 0, last: 0 }; L.n++; L.last = i; legs.set(k, L); });
    const recent = Math.max(0, steps.length - 3);
    const base = [...legs.values()].map(L => { const strong = L.last >= recent;
      return `<path d="${curve(L.a, L.b)}" stroke="${VERM}" stroke-width="${strong ? 4 : 2.5 + Math.min(2, L.n - 1) * .6}" fill="none" stroke-dasharray="10 7" stroke-linecap="round" opacity="${strong ? .9 : .38}"/>`; }).join("");
    const from = animateFrom < 0 ? steps.length : Math.min(animateFrom, steps.length), fresh = steps.slice(from), per = fresh.length ? Math.min(.7, 3.2 / fresh.length) : 0;
    const draws = fresh.map(([a, b], i) => `<path class="${p}${from + i >= recent ? "draw" : "dfade"}" style="animation-delay:${f1(i * per)}s;animation-duration:${f1(Math.max(.35, per * 1.2))}s" pathLength="1" d="${curve(a, b)}" stroke="${VERM}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/>`).join("");
    const glowAt = f1(fresh.length * per);
    // names: current first, then the places in the order you reached them; each tries right, left, above, below
    const ys = walk.concat(current ? [current] : []).filter(k => PLACES[k]).map(k => PLACES[k].y);
    let y0 = ys.length ? Math.max(0, Math.min(...ys) - 70) : 0, y1 = ys.length ? Math.min(540, Math.max(...ys) + 70) : 540;
    if (y1 - y0 < 320) { const grow = (320 - (y1 - y0)) / 2; y0 = Math.max(0, y0 - grow); y1 = Math.min(540, y0 + 320); y0 = Math.max(0, y1 - 320); }
    const fs = lang === "zh" ? 20 : 17, boxes = [];
    walk.forEach(k => { const v = PLACES[k]; boxes.push([v.x - 9, v.y - 9, v.x + 9, v.y + 9]); });
    const hit = b => b[0] < 4 || b[2] > 996 || b[1] < y0 + 2 || b[3] > y1 - 2 || boxes.some(o => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
    const order = [...new Set([current, ...walk])].filter(k => k && PLACES[k]);
    const labels = order.map(k => { const v = PLACES[k], name = v[lang] || v.zh, w = name.length * fs * (lang === "zh" ? 1.02 : .52), hgt = fs * 1.15;
      const cands = [[v.x + 12, v.y + fs * .3, "start"], [v.x - 12, v.y + fs * .3, "end"], [v.x, v.y - 14, "middle"], [v.x, v.y + fs + 10, "middle"]];
      const box = ([x, y, anc]) => { const x0 = anc === "start" ? x : anc === "end" ? x - w : x - w / 2; return [x0 - 2, y - hgt * .85, x0 + w + 2, y + hgt * .25]; };
      const pick = cands.find(c => !hit(box(c))) || cands[0]; boxes.push(box(pick));
      return `<text x="${f1(pick[0])}" y="${f1(pick[1])}" text-anchor="${pick[2]}" font-size="${fs}" fill="${INK}" font-weight="${k === current ? 700 : 400}" font-family="'Noto Serif SC','Fraunces',serif" paint-order="stroke" stroke="${PAPER}" stroke-width="4" stroke-linejoin="round">${name}</text>`; }).join("");
    const dots = Object.entries(PLACES).map(([k, v]) => { const on = seen.has(k), cur = k === current;
      return `${cur ? `<circle class="${p}glow" style="animation-delay:${glowAt}s,${f1(+glowAt + .5)}s" cx="${v.x}" cy="${v.y}" r="22" fill="${LAMP}" opacity=".45" filter="url(#${p}wash)"/>` : ""}<circle cx="${v.x}" cy="${v.y}" r="${on ? 7 : 4}" fill="${on ? VERM : INK}" opacity="${on ? 1 : .3}"/>`; }).join("");
    const css = `<style>.${p}draw{stroke-dasharray:1;stroke-dashoffset:1;animation:${p}d .6s ease-out forwards}@keyframes ${p}d{to{stroke-dashoffset:0}}.${p}dfade{stroke-dasharray:1;stroke-dashoffset:1;animation:${p}df .6s ease-out forwards}@keyframes ${p}df{0%{stroke-dashoffset:1;opacity:.85}55%{stroke-dashoffset:0;opacity:.85}100%{stroke-dashoffset:0;opacity:0}}.${p}glow{transform-box:fill-box;transform-origin:center;animation:${p}in .5s ease-out both,${p}g 2.4s ease-in-out infinite}@keyframes ${p}in{from{opacity:0;transform:scale(.4)}to{opacity:.45;transform:scale(1)}}@keyframes ${p}g{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:.6;transform:scale(1.15)}}@media (prefers-reduced-motion: reduce){.${p}draw{animation:none;stroke-dashoffset:0}.${p}dfade{display:none}.${p}glow{animation:none}}</style>`;
    return `<svg viewBox="0 ${f1(y0)} 1000 ${f1(y1 - y0)}" role="img" aria-label="${lang === "zh" ? "舆图：你走过的路" : "Map of your journey"}">${css}${defs(p, 0)}<rect width="1000" height="540" fill="url(#${p}paper)"/>
${mountains(p, r, { base: 140, height: 90, opacity: .18, blur: 8, peaks: 3 }).replace(/url\(#__/g, `url(#${p}`)}
${(rivers || RIVERS_V1).map(v => `<path d="${v.d}" stroke="#6d86a0" stroke-width="${v.w}" fill="none" opacity="${v.op || .45}" filter="url(#${p}soft)"/>` + (v.label ? `<text x="${v.label[0]}" y="${v.label[1]}" font-size="15" fill="#4a6178" opacity=".8" font-family="'Noto Serif SC',serif">${v.label[2][lang] || v.label[2].zh}</text>` : "")).join("")}
${base}${draws}${dots}${labels}<rect width="1000" height="540" filter="url(#${p}grain)" opacity=".8" pointer-events="none"/></svg>`;
  }

  /* ---------- realm map: stylized provinces of the late Eastern Han (schematic, not cartographic) ---------- */
  const PROV = {
    liang: [[60, 150], [190, 110], [320, 150], [360, 230], [330, 320], [230, 330], [120, 300], [70, 230]],
    bing: [[400, 70], [520, 60], [560, 140], [550, 250], [470, 270], [410, 220], [380, 140]],
    you: [[580, 40], [760, 30], [900, 60], [890, 150], [780, 170], [660, 160], [590, 120]],
    ji: [[560, 140], [660, 160], [760, 175], [740, 260], [690, 300], [600, 300], [555, 255]],
    qing: [[760, 180], [880, 170], [930, 240], [880, 300], [780, 300], [740, 260]],
    sili: [[320, 250], [410, 225], [470, 270], [550, 260], [560, 320], [500, 360], [400, 360], [330, 330]],
    yan: [[600, 300], [690, 300], [780, 300], [760, 350], [690, 370], [620, 360]],
    yu: [[560, 320], [620, 360], [690, 370], [700, 430], [640, 460], [570, 440], [530, 380]],
    xu: [[760, 350], [880, 310], [900, 390], [840, 450], [760, 450], [700, 430], [690, 370]],
    jing: [[400, 380], [500, 360], [530, 380], [570, 440], [640, 460], [660, 520], [620, 600], [520, 620], [430, 580], [400, 480]],
    yang: [[660, 460], [700, 430], [760, 450], [840, 450], [900, 520], [880, 620], [760, 650], [660, 620], [620, 600], [660, 520]],
    yi: [[190, 340], [330, 330], [400, 360], [400, 480], [430, 580], [360, 640], [240, 640], [160, 560], [150, 430]],
    jiao: [[360, 640], [430, 580], [520, 620], [620, 600], [660, 620], [760, 650], [700, 690], [420, 695]],
  };
  const PROV_CENTER = { liang: [200, 230], bing: [470, 160], you: [740, 100], ji: [650, 230], qing: [840, 245], sili: [430, 300], yan: [690, 335], yu: [578, 448], xu: [800, 400], jing: [520, 500], yang: [770, 545], yi: [280, 480], jiao: [560, 655] };
  const REALM_PLACES_V1 = { xuchang: [612, 392], xiapi: [800, 372], jizhou: [650, 250], gucheng: [640, 430], xinye: [545, 428], changban: [528, 488], chibi: [612, 540], xiakou: [640, 515], huarong: [570, 532] };
  function smooth(pts) {
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < pts.length; i++) {
      const p0 = pts[(i - 1 + pts.length) % pts.length], p1 = pts[i], p2 = pts[(i + 1) % pts.length], p3 = pts[(i + 2) % pts.length];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${p2[0]} ${p2[1]}`;
    }
    return d + "Z";
  }
  // control: { provinceId: factionId | [factionId, factionId] (contested) }, factions: { id: { color, name } }
  function realmMap(stops, { lang = "zh", current, control = {}, factions = {}, provNames = {}, note = "", realmPlaces = null, placeNames = null } = {}) {
    const REALM_PLACES = Object.assign({}, REALM_PLACES_V1, realmPlaces || {});
    const p = "r" + (++uid) + "_";
    const r = rng(11);
    let defs2 = "";
    const shapes = Object.entries(PROV).map(([id, pts]) => {
      const c = control[id];
      let fill = "#cfc3a8", op = .5;
      if (Array.isArray(c)) {
        const pid = `${p}hatch_${id}`;
        const [a, b] = c.map(f => (factions[f] || {}).color || "#999");
        defs2 += `<pattern id="${pid}" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill="${a}"/><rect width="7" height="14" fill="${b}"/></pattern>`;
        fill = `url(#${pid})`; op = .55;
      } else if (c && factions[c]) { fill = factions[c].color; op = .55; }
      return `<path d="${smooth(pts)}" fill="${fill}" opacity="${op}" stroke="${PAPER}" stroke-width="5" filter="url(#${p}brush)"/>`;
    }).join("");
    const labels = Object.entries(PROV_CENTER).map(([id, [x, y]]) => provNames[id] ? `<text x="${x}" y="${y}" font-size="${lang === "zh" ? 30 : 26}" text-anchor="middle" fill="${INK}" opacity=".6" font-family="'Noto Serif SC','Fraunces',serif" letter-spacing="${lang === "zh" ? 4 : 1}">${provNames[id]}</text>` : "").join("");
    const pts = stops.map(s => REALM_PLACES[s]).filter(Boolean);
    let path = ""; pts.forEach((pt, i) => { if (!i) path = `M${pt[0]} ${pt[1]}`; else { const a = pts[i - 1]; path += ` Q${f1((a[0] + pt[0]) / 2 + (r() - .5) * 30)} ${f1((a[1] + pt[1]) / 2 + (r() - .5) * 20)} ${pt[0]} ${pt[1]}`; } });
    const seen = new Set(stops);
    const marks = Object.entries(REALM_PLACES).filter(([k]) => seen.has(k)).map(([k, [x, y]]) => `${k === current ? `<circle cx="${x}" cy="${y}" r="20" fill="${LAMP}" opacity=".55" filter="url(#${p}wash)"/>` : ""}<circle cx="${x}" cy="${y}" r="6" fill="${VERM}" stroke="${PAPER}" stroke-width="2"/>${k === current ? `<text x="${x + 10}" y="${y - 10}" font-size="${lang === "zh" ? 26 : 24}" fill="${INK}" font-family="'Noto Serif SC','Fraunces',serif" font-weight="600">${((placeNames || {})[k] || PLACES_V1[k] || { [lang]: k })[lang]}</text>` : ""}`).join("");
    return `<svg viewBox="0 0 1000 700" role="img" aria-label="${lang === "zh" ? "天下形势图（示意）" : "The realm (schematic)"}">${defs(p, 0).replace("</defs>", defs2 + "</defs>")}<rect width="1000" height="700" fill="url(#${p}paper)"/>
${shapes}
<path d="M120 150 C260 170 380 200 470 250 C560 290 660 300 760 300 C840 300 900 280 960 260" stroke="#6d86a0" stroke-width="7" fill="none" opacity=".55" filter="url(#${p}soft)"/>
<path d="M200 470 C300 450 380 500 460 520 C540 540 600 550 650 520 C720 480 800 470 960 500" stroke="#6d86a0" stroke-width="10" fill="none" opacity=".55" filter="url(#${p}soft)"/>
${labels}
${path ? `<path d="${path}" stroke="${VERM}" stroke-width="3.5" fill="none" stroke-dasharray="8 6" stroke-linecap="round" opacity=".95"/>` : ""}${marks}
${note ? `<text x="20" y="684" font-size="20" fill="${INK}" opacity=".55" font-family="system-ui,sans-serif">${note}</text>` : ""}
<rect width="1000" height="700" filter="url(#${p}grain)" opacity=".5"/></svg>`;
  }

  const ART = { scene, cg, charSeal, journeyMap, realmMap, provinces: Object.keys(PROV), scenes: Object.keys(S), cgs: Object.keys(CG), places: Object.keys(PLACES_V1) };
  if (typeof module === "object" && module.exports) module.exports = ART; else root.ART = ART;
})(typeof self !== "undefined" ? self : this);

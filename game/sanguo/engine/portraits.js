/* StoryDate ink portraits — original bust portraits drawn in code (SVG, viewBox 300×400).
 * Looks follow the novel's own descriptions (public domain), not any film, drama or game design:
 *   刘备  两耳垂肩、面如冠玉      关羽  面如重枣、丹凤眼、卧蚕眉、髯长二尺、绿袍
 *   曹操  细眼长髯               诸葛亮 纶巾、鹤氅、羽扇（第38回）
 *   温芷  original character
 * PORTRAIT.draw(id, { mood }) → SVG string. Moods: neutral, warm, cold, sad, surprised, shy.
 */
(function (root) {
  "use strict";
  const INK = "#1d1a17", PAPER = "#EFE6D2", SKIN = "#EBD3B5", SKIN_SH = "#D9BC98";
  let uid = 0;
  const C = {
    liubei: { halo: "#8a9a74", robe: "#6f7f63", robe2: "#566349", skin: SKIN, ears: "big", beard: "short", hat: "crown", eye: "kind" },
    guanyu: { halo: "#4f7a58", robe: "#3f6b4a", robe2: "#2d5137", skin: "#A9473A", ears: "std", beard: "long", hat: "scarf", eye: "phoenix", brow: "thick" },
    caocao: { halo: "#7a3a34", robe: "#4a1f1f", robe2: "#2c1212", skin: SKIN, ears: "std", beard: "thin", hat: "tall", eye: "narrow" },
    zhuge: { halo: "#6d86a0", robe: "#E8E3D6", robe2: "#3b4656", skin: SKIN, ears: "std", beard: "none", hat: "guan", eye: "calm", fan: true },
    wenzhi: { halo: "#c4788a", robe: "#9aa7b4", robe2: "#6e7c8a", skin: "#EED8BD", ears: "std", beard: "none", hat: "bun", eye: "soft", female: true },
  };

  function eyes(c, mood) {
    const st = `stroke="${INK}" stroke-linecap="round" fill="none"`;
    const pupil = (x, y, r = 3.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/>`;
    const lid = (x, d) => `<path d="${d.replace(/X/g, "").trim()}" ${st} stroke-width="3"/>`;
    const pair = fn => fn(129, -1) + fn(171, 1);
    if (mood === "warm" || mood === "shy") return pair((x, s) => `<path d="M${x - 11} 194 Q${x} 185 ${x + 11} 194" ${st} stroke-width="3"/>`);
    if (mood === "surprised") return pair((x) => `<ellipse cx="${x}" cy="192" rx="7" ry="6.5" ${st} stroke-width="2.4"/>` + pupil(x, 192, 2.6));
    const tilt = c.eye === "phoenix" ? 5 : c.eye === "narrow" ? 2 : 0;
    const h = mood === "cold" ? 2 : c.eye === "narrow" ? 3 : mood === "sad" ? 3 : 5;
    return pair((x, s) => {
      const ox = x - 12 * 1, ix = x + 12; // outer/inner relative per side
      const outer = s < 0 ? x - 13 : x + 13, inner = s < 0 ? x + 11 : x - 11;
      const d = `M${inner} 194 Q${x} ${193 - h} ${outer} ${193 - tilt}`;
      const low = mood === "sad" ? `<path d="M${inner} 195 Q${x} 198 ${outer} ${196 - tilt}" ${st} stroke-width="1.2" opacity=".6"/>` : "";
      return `<path d="${d}" ${st} stroke-width="3"/>${low}${pupil(x + (s < 0 ? -1 : 1), 194 - Math.min(h, 3) / 2, mood === "cold" ? 2.4 : 3)}`;
    });
  }
  function brows(c, mood) {
    const w = c.brow === "thick" ? 7 : c.female ? 2.4 : 3.6;
    const st = `stroke="${INK}" stroke-linecap="round" fill="none" stroke-width="${w}"`;
    const y = mood === "surprised" ? 168 : mood === "warm" || mood === "shy" ? 175 : 177;
    return [-1, 1].map(s => {
      const x = 150 + s * 21;
      const outer = x + s * 15, inner = x - s * 13;
      let iy = y, oy = y, my = y - 5;
      if (mood === "cold") { iy = y + 5; oy = y - 4; my = y - 1; }
      if (mood === "sad") { iy = y - 6; oy = y + 3; my = y - 3; }
      if (c.brow === "thick") { oy -= 4; } // 卧蚕眉 sweeps up at the tail
      return `<path d="M${inner} ${iy} Q${x} ${my} ${outer} ${oy}" ${st}/>`;
    }).join("");
  }
  function mouth(c, mood) {
    const st = `stroke="${c.skin === SKIN || c.female ? "#7a3b30" : INK}" stroke-linecap="round" fill="none" stroke-width="2.6"`;
    const y = 232;
    if (mood === "warm") return `<path d="M139 ${y - 2} Q150 ${y + 8} 161 ${y - 2}" ${st}/>`;
    if (mood === "shy") return `<path d="M143 ${y} Q150 ${y + 5} 157 ${y}" ${st}/>`;
    if (mood === "cold") return `<path d="M140 ${y + 1} L160 ${y - 1}" ${st}/>`;
    if (mood === "sad") return `<path d="M141 ${y + 3} Q150 ${y - 3} 159 ${y + 3}" ${st}/>`;
    if (mood === "surprised") return `<ellipse cx="150" cy="${y + 1}" rx="5" ry="6" fill="#5a2a22"/>`;
    return `<path d="M141 ${y} Q150 ${y + 2} 159 ${y}" ${st}/>`;
  }
  function beard(c, p) {
    const f = `fill="${INK}" filter="url(#${p}brush)"`;
    const mus = `<path d="M128 222 Q140 214 150 219 Q160 214 172 222 Q162 220 150 224 Q138 220 128 222Z" ${f}/>`;
    if (c.beard === "long") return mus + `<path d="M118 228 C120 260 128 300 138 360 Q150 392 162 360 C172 300 180 260 182 228 Q170 246 150 248 Q130 246 118 228Z" ${f} opacity=".95"/>` +
      Array.from({ length: 9 }, (_, i) => `<path d="M${132 + i * 4} 250 Q${136 + i * 3} 310 ${142 + i * 2} ${350 + (i % 3) * 8}" stroke="#3a3430" stroke-width="1" fill="none" opacity=".6"/>`).join("");
    if (c.beard === "thin") return mus.replace('fill="', 'opacity=".9" fill="') + `<path d="M144 242 Q150 290 152 312 Q156 290 157 242Z" ${f}/><path d="M124 226 Q118 250 122 262" stroke="${INK}" stroke-width="2" fill="none"/><path d="M176 226 Q182 250 178 262" stroke="${INK}" stroke-width="2" fill="none"/>`;
    if (c.beard === "short") return mus + `<path d="M140 242 Q150 266 160 242 Q150 250 140 242Z" ${f}/>`;
    return "";
  }
  function hat(c, p) {
    const br = `filter="url(#${p}brush)"`;
    if (c.hat === "crown") return `<path d="M98 178 C96 130 120 118 150 118 C180 118 204 130 202 178 C196 150 178 140 150 140 C122 140 104 150 98 178Z" fill="${INK}" ${br}/><path d="M132 120 L134 96 L166 96 L168 120Z" fill="#B99A55" stroke="${INK}" stroke-width="2"/><path d="M118 104 L182 104" stroke="#8c6d2c" stroke-width="3"/>`;
    if (c.hat === "scarf") return `<path d="M96 182 C90 122 120 108 150 108 C180 108 210 122 204 182 C196 148 176 136 150 136 C124 136 104 148 96 182Z" fill="#2f5a3b" ${br}/><path d="M100 160 Q150 140 200 160" stroke="#1f3d28" stroke-width="4" fill="none"/><path d="M196 150 Q226 170 222 214 Q214 190 200 176Z" fill="#2f5a3b" ${br}/>`;
    if (c.hat === "tall") return `<path d="M100 176 C98 140 120 128 150 128 C180 128 202 140 200 176 C192 152 174 146 150 146 C126 146 108 152 100 176Z" fill="${INK}" ${br}/><path d="M112 140 L120 70 L182 70 L190 140Z" fill="#151216" ${br}/><path d="M112 140 L190 140" stroke="#8c6d2c" stroke-width="5"/><path d="M128 84 L174 84" stroke="#3a3430" stroke-width="2"/>`;
    if (c.hat === "guan") return `<path d="M96 180 C90 120 118 98 150 98 C182 98 210 120 204 180 C198 150 178 140 150 140 C122 140 102 150 96 180Z" fill="#4a5a70" ${br}/>` + [0, 1, 2, 3].map(i => `<path d="M${112 + i * 22} 112 Q${118 + i * 22} 130 ${114 + i * 22} 150" stroke="#2f3a4a" stroke-width="2" fill="none"/>`).join("") + `<path d="M200 160 Q232 200 220 260" stroke="#4a5a70" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M100 160 Q72 200 82 254" stroke="#4a5a70" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    if (c.hat === "bun") return `<path d="M96 200 C88 132 116 112 150 112 C184 112 212 132 204 200 C200 160 182 142 150 142 C118 142 100 160 96 200Z" fill="${INK}" ${br}/><ellipse cx="150" cy="98" rx="30" ry="22" fill="${INK}" ${br}/><path d="M112 96 L196 78" stroke="#B99A55" stroke-width="3" stroke-linecap="round"/><g transform="translate(118 112)">${[0, 72, 144, 216, 288].map(d => `<circle cx="${(Math.cos(d * Math.PI / 180) * 5).toFixed(1)}" cy="${(Math.sin(d * Math.PI / 180) * 5).toFixed(1)}" r="4.4" fill="#F4E4E6"/>`).join("")}<circle r="2.4" fill="#B8321F"/></g><path d="M100 196 Q94 240 104 268" stroke="${INK}" stroke-width="8" fill="none" stroke-linecap="round" opacity=".9"/><path d="M200 196 Q206 240 196 268" stroke="${INK}" stroke-width="8" fill="none" stroke-linecap="round" opacity=".9"/>`;
    return "";
  }
  function ears(c) {
    if (c.ears === "big") return `<path d="M100 186 C88 186 88 236 98 250 C104 256 108 240 106 220Z" fill="${c.skin}" stroke="${SKIN_SH}" stroke-width="2"/><path d="M200 186 C212 186 212 236 202 250 C196 256 192 240 194 220Z" fill="${c.skin}" stroke="${SKIN_SH}" stroke-width="2"/>`;
    return `<ellipse cx="100" cy="198" rx="7" ry="14" fill="${c.skin}" stroke="${SKIN_SH}" stroke-width="2"/><ellipse cx="200" cy="198" rx="7" ry="14" fill="${c.skin}" stroke="${SKIN_SH}" stroke-width="2"/>`;
  }
  function robe(c, p) {
    const crane = c.fan ? `<path d="M40 400 C50 330 96 300 150 296 C204 300 250 330 260 400Z" fill="${c.robe}" filter="url(#${p}brush)"/><path d="M40 400 C50 330 96 300 120 298 L150 360 L180 298 C204 300 250 330 260 400" stroke="${c.robe2}" stroke-width="14" fill="none"/>`
      : `<path d="M34 400 C44 326 94 296 150 292 C206 296 256 326 266 400Z" fill="${c.robe}" filter="url(#${p}brush)"/>`;
    return crane + `<path d="M118 296 L152 360 L186 294" stroke="${c.robe2}" stroke-width="10" fill="none" stroke-linejoin="round"/><path d="M124 298 L152 350 L180 296" stroke="#F2EBDD" stroke-width="4" fill="none" opacity=".85"/>`;
  }
  function fan(p) {
    return `<g transform="translate(222 300) rotate(-18)"><path d="M0 0 C-36 -20 -44 -90 0 -118 C44 -90 36 -20 0 0Z" fill="#F7F3EA" stroke="#9c9486" stroke-width="2"/>${Array.from({ length: 9 }, (_, i) => `<path d="M0 -4 L${-30 + i * 7.5} ${-100 + Math.abs(i - 4) * 6}" stroke="#bdb4a3" stroke-width="1"/>`).join("")}<rect x="-4" y="-2" width="8" height="40" rx="3" fill="#6b4a2a"/></g>`;
  }

  function draw(id, { mood = "neutral", size } = {}) {
    const c = C[id]; if (!c) return "";
    const p = "pt" + (++uid) + "_";
    const blush = (mood === "shy" || (mood === "warm" && c.female)) ? `<ellipse cx="124" cy="214" rx="12" ry="7" fill="#E07A8C" opacity="${mood === "shy" ? .45 : .25}"/><ellipse cx="176" cy="214" rx="12" ry="7" fill="#E07A8C" opacity="${mood === "shy" ? .45 : .25}"/>` : "";
    const face = c.female
      ? `<path d="M102 186 C102 140 124 128 150 128 C176 128 198 140 198 186 C198 226 178 258 150 262 C122 258 102 226 102 186Z" fill="${c.skin}"/>`
      : `<path d="M98 184 C98 136 122 124 150 124 C178 124 202 136 202 184 C202 228 182 262 150 266 C118 262 98 228 98 184Z" fill="${c.skin}"/>`;
    const shade = `<path d="M188 160 C200 200 192 240 168 262 C184 236 190 204 188 160Z" fill="${INK}" opacity=".08"/>`;
    const nose = `<path d="M150 196 Q145 212 151 216 Q156 216 158 213" stroke="${c.skin === SKIN || c.female ? "#a0785a" : "#5a1f18"}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    const tint = mood === "cold" ? `<rect width="300" height="400" fill="#3b4656" opacity=".10"/>` : mood === "sad" ? `<rect width="300" height="400" fill="#4a5a70" opacity=".08"/>` : (mood === "warm" || mood === "shy") ? `<rect width="300" height="400" fill="#F5B14C" opacity=".07"/>` : "";
    const sz = size ? ` width="${size}" height="${Math.round(size * 4 / 3)}"` : "";
    return `<svg viewBox="45 62 210 280"${sz} xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>
<filter id="${p}brush" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="5"/><feDisplacementMap in="SourceGraphic" scale="4"/></filter>
<filter id="${p}wash"><feGaussianBlur stdDeviation="14"/></filter>
<radialGradient id="${p}bg" cx=".5" cy=".42" r=".7"><stop offset="0" stop-color="${PAPER}"/><stop offset="1" stop-color="#DCCFB5"/></radialGradient></defs>
<rect width="300" height="400" fill="url(#${p}bg)"/><circle cx="150" cy="210" r="120" fill="${c.halo}" opacity=".28" filter="url(#${p}wash)"/>
${robe(c, p)}<rect x="136" y="250" width="28" height="50" fill="${c.skin}"/><path d="M136 270 Q150 282 164 270 L164 292 L136 292Z" fill="${INK}" opacity=".08"/>
${ears(c)}${face}${shade}${hat(c, p)}${brows(c, mood)}${eyes(c, mood)}${nose}${blush}${mouth(c, mood)}${beard(c, p)}${c.fan ? fan(p) : ""}${tint}
</svg>`;
  }

  const PORTRAIT = { draw, ids: Object.keys(C), moods: ["neutral", "warm", "cold", "sad", "surprised", "shy"] };
  if (typeof module === "object" && module.exports) module.exports = PORTRAIT; else root.PORTRAIT = PORTRAIT;
})(typeof self !== "undefined" ? self : this);

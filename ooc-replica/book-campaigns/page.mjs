// Builds a standalone playable page for a book campaign from the team's Three Kingdoms page.
// The upstream document and engine are not edited: this applies string-marker patches to a copy,
// swaps in the book's data/art and reuses the same website adapter + bridge as the Three Kingdoms page.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export async function buildBookPage({ book, camp, ui, artScripts, css = '' }) {
  const upstream = new URL('../sanguo/upstream/', import.meta.url), here = new URL('../sanguo/', import.meta.url);
  const manifest = JSON.parse(await readFile(new URL('manifest.json', upstream), 'utf8'));
  for (const [path, sha] of Object.entries(manifest.blobs)) {
    const file = await readFile(new URL(path, upstream));
    const actual = createHash('sha1').update('blob ' + file.length + '\0').update(file).digest('hex');
    if (actual !== sha) throw Error('Upstream checksum mismatch: ' + path);
  }
  let html = await readFile(new URL('index.html', upstream), 'utf8');
  const adapter = await readFile(new URL('adapter.js', here), 'utf8');
  const bridge = await readFile(new URL('bridge.js', here), 'utf8');
  const themeCss = await readFile(new URL('theme.css', here), 'utf8');
  const patch = (from, to) => { if (!html.includes(from)) throw Error('Marker missing: ' + from.slice(0, 80)); html = html.replace(from, () => to); };

  // 1. data script and art script
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  if (scripts.length !== 4) throw Error('unexpected upstream script layout: ' + scripts.length);
  const bookJson = JSON.stringify({ id: book.id, title: book.title, hero: book.hero, volumes: [{ id: camp.id, title: book.volumeTitle, canon: book.canon, years: book.years, blurb: book.blurb, camp }] });
  const dataScript = `const BOOK = ${bookJson};\nlet CAMP = BOOK.volumes[0].camp;\nconst VOL = id => BOOK.volumes.find(v => v.id === id);\nconst volIndex = id => BOOK.volumes.findIndex(v => v.id === id);\nfunction useVol(id) { const v = VOL(id) || BOOK.volumes[0]; CAMP = v.camp; COL = loadCOL(v.id); }\n`;
  html = html.replace(scripts[0][0], () => `<script>\n${dataScript}</script>`).replace(scripts[2][0], () => `<script>\n${artScripts}\n</script>`);

  // 2. same website integration as the Three Kingdoms page
  patch('const store = {', 'const upstreamStore = {');
  patch('const settings = Object.assign', 'const store = siteStore;\nconst settings = Object.assign');
  patch('lang: /^zh/i.test(navigator.language || "") ? "zh" : "en"', 'lang: "zh"');
  patch('const creatorAllowed = () => RT.canEdit || location.hash === "#creator";', 'const creatorAllowed = () => false;');
  patch('painting("garden", ["storm"], t(BOOK.title))', 'painting((BOOK.hero || {}).scene || "garden", (BOOK.hero || {}).layers || ["storm"], t(BOOK.title))');
  const uiPatch = `Object.assign(UI.zh, ${JSON.stringify(ui)});\nObject.assign(UI.en, ${JSON.stringify(ui)});\n`;
  patch('/* ---------------- boot ---------------- */', adapter + '\n' + uiPatch + '\n/* ---------------- boot ---------------- */');
  patch('let COL = loadCOL(BOOK.volumes[0].id);', 'let COL = loadCOL(BOOK.volumes[0].id);\nuseVol = function(id) { const v = VOL(id) || BOOK.volumes[0]; CAMP = v.camp; COL = loadCOL(v.id); };');
  const build = /const BUILD = "[^"]+";/.exec(html); if (!build) throw Error('Marker missing: BUILD');
  patch(build[0], `function startCampaign(siteStore) {\nconst BUILD = "${book.build}";`);

  // 3. generic reputation panel (the upstream one lists Three Kingdoms renown bars)
  const panel = /box\.append\(h\("div", \{ class: "ch" \}, h\("h5", \{\}, l\.renown\), \["renown\.loyal"[\s\S]*?l\.meterRash\)\)\);/.exec(html);
  if (!panel) throw Error('Marker missing: renown panel');
  html = html.replace(panel[0], () => `(CAMP.panel || []).forEach(g => box.append(h("div", { class: "ch" }, h("h5", {}, t(g.title)), g.vars.map(v => barRow(v.v, V.open === v.v, v.neg ? "neg" : "")), g.hint ? h("div", { class: "hintline" }, t(g.hint)) : null)));`);
  patch('const SEAL_TEXT = { liubei: "刘", caocao: "曹", guanyu: "关", zhuge: "诸葛", wenzhi: "温" };', 'const SEAL_TEXT = {};');

  const end = html.lastIndexOf('</script>');
  html = html.slice(0, end) + '}\n' + bridge.replace("href:'/play/three-kingdoms',textContent:'进入三国 · 谋士 / Open The Strategist'", `href:'/play/${book.slug}',textContent:'进入${book.title}'`) + '\n' + html.slice(end);
  html = html.replace('</head>', `<link rel="icon" href="/assets/storydate-mark.svg"></head>`);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${book.title}</title>`);
  html = html.replace('</style>', `</style><style>${themeCss}\n.seg[aria-label="Language"]{display:none}\n${css}</style>`);
  html = html.replace('这是内部试玩原型：选择会被匿名记录，用来改进内容。', '进度与图鉴使用 StoryDate 账号存档；剧情结果由规则决定。');
  return html;
}

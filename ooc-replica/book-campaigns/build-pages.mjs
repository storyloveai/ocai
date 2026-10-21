import { writeFile, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { buildBookPage } from './page.mjs';
const require = createRequire(import.meta.url);
export async function buildBookPages() {
  const CC = require('../server/sanguo-core.cjs');
  const art = await readFile(new URL('./art/stub.js', import.meta.url), 'utf8');
  const { monteCampaign } = await import('./src/monte/index.mjs');
  const camp = monteCampaign();
  const { errors } = CC.validate(camp);
  if (errors.length) throw Error('monte campaign invalid:\n' + errors.join('\n'));
  const book = { id: 'monte_cristo', slug: 'monte-cristo', title: '基督山伯爵', volumeTitle: '余烬与潮汐', canon: '原著第1–30章 · 改编', years: '1815—1829年', blurb: '你是莫雷尔商行的年轻账房诺埃尔。婚宴上的一封匿名信带走了你的朋友。接下来的十四年里，每一个沉默都会记在账上。', build: 'monte-v1.0', hero: { scene: 'quay', layers: ['sunset'] } };
  const ui = { title: '基督山伯爵', premise: ['一八一五年二月，马赛。法老号半旗入港，大副爱德蒙·唐泰斯即将成为船长，也即将成婚。', '你是诺埃尔，莫雷尔商行的见习账房。你不是主角，也不是仇人。你能做的是：看见，记下，说或者不说，替人跑一趟，把一笔钱借出去，或者在某个夜晚什么也不做。', '原著的大事会发生。发生的方式、谁付出代价、谁记得你，由你决定。'], how: [['你不是伯爵，是账房。', '你站在每个大场面的边上：拱棚、婚宴、检察官的外厅。你看得见，也有机会开口。'], ['每个沉默都记在账上。', '你前面做的事、没做的事，会在十几年后被人提起。标着「回响」的段落，会告诉你是因为哪一步。'], ['人会记得你。', '每个人有交情、信任、看重三条线。它们决定谁愿意为你开口，谁在最后一刻伸手。']], rightsNote: '原著《基督山伯爵》为公版作品；诺埃尔为原创人物，情节为本项目新写。' };
  const html = await buildBookPage({ book, camp, ui, artScripts: art });
  await writeFile(new URL('../dist/assets/book-monte-cristo.html', import.meta.url), html);
  return { monte: { nodes: Object.keys(camp.nodes).length } };
}
if (process.argv[1] && process.argv[1].endsWith('build-pages.mjs')) console.log(await buildBookPages());

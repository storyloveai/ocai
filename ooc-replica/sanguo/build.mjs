import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
const here=new URL('./',import.meta.url);
export async function buildSanguo(){
 const game=new URL('upstream/',here);
 const manifest=JSON.parse(await readFile(new URL('manifest.json',game),'utf8'));
 for(const [path,sha]of Object.entries(manifest.blobs)){const file=await readFile(new URL(path,game));const actual=createHash('sha1').update('blob '+file.length+'\0').update(file).digest('hex');if(actual!==sha)throw Error('Upstream campaign checksum mismatch: '+path);}
 // Two editions of the same book share saves: ink (pictures drawn in code) and illustrated (/assets/sanguo-art/).
 await writeFile(new URL('../dist/assets/sanguo-campaign.html',here),await adapt(game,'index.html'));
 await writeFile(new URL('../dist/assets/sanguo-campaign-illus.html',here),rebase(await adapt(game,'illus.html')));
 await writeFile(new URL('../server/sanguo-campaign.json',here),await readFile(new URL('campaign.json',game)));
 await writeFile(new URL('../server/sanguo-campaign-v2.json',here),await readFile(new URL('campaign_v2.json',game)));
 await writeFile(new URL('../server/sanguo-campaign-v3.json',here),await readFile(new URL('campaign_v3.json',game)));
 await writeFile(new URL('../server/sanguo-campaign-v4.json',here),await readFile(new URL('campaign_v4.json',game)));
 await writeFile(new URL('../server/sanguo-campaign-v5.json',here),await readFile(new URL('campaign_v5.json',game)));
 await writeFile(new URL('../server/sanguo-campaign-v6.json',here),await readFile(new URL('campaign_v6.json',game)));
 await writeFile(new URL('../server/sanguo-core.cjs',here),await readFile(new URL('campaign_core.js',game)));
 // Books use the shared engine copy (game/engine via scripts/sync-game.mjs); see book-campaigns/engine/README.md.
 await writeFile(new URL('../server/book-core.cjs',here),await readFile(new URL('../book-campaigns/engine/campaign_core.js',here)));
}
function rebase(html){const from='const ART_BASE = "../art/";';if(!html.includes(from))throw Error('Sanguo upstream integration marker missing: ART_BASE');return html.replace(from,'const ART_BASE = "/assets/sanguo-art/";');}
async function adapt(game,file){
 let html=await readFile(new URL(file,game),'utf8');
 const adapter=await readFile(new URL('adapter.js',here),'utf8');
 const css=await readFile(new URL('theme.css',here),'utf8');
 function patch(from,to){if(!html.includes(from))throw Error('Sanguo upstream integration marker missing: '+from.slice(0,70));html=html.replace(from,to);}
 // Only adapt the published standalone document; canonical content and engine are untouched.
 patch('const store = {', 'const upstreamStore = {');
 patch('const settings = Object.assign', `const store = siteStore;\nconst settings = Object.assign`);
 patch('lang: /^zh/i.test(navigator.language || "") ? "zh" : "en"','lang: "zh"');
 patch('const creatorAllowed = () => RT.canEdit || location.hash === "#creator";', 'const creatorAllowed = () => false;');
 patch('/* ---------------- boot ---------------- */',adapter+'\n/* ---------------- boot ---------------- */');
 // The volume switcher is defined before the wrapped region but needs the wrapped collection state.
 patch('let COL = loadCOL(BOOK.volumes[0].id);','let COL = loadCOL(BOOK.volumes[0].id);\nuseVol = function(id) { const v = VOL(id) || BOOK.volumes[0]; CAMP = v.camp; COL = loadCOL(v.id); };');
 // Start only after the account-scoped parent has supplied its snapshot.
 const build=/const BUILD = "[^"]+";/.exec(html);if(!build)throw Error('Sanguo upstream integration marker missing: BUILD');
 patch(build[0],`function startCampaign(siteStore) {\n${build[0]}`);
 const end=html.lastIndexOf('</script>');
 html=html.slice(0,end)+'}\n'+await readFile(new URL('bridge.js',here),'utf8')+'\n'+html.slice(end);
 html=html.replace('</head>','<link rel="icon" href="/assets/storydate-mark.svg"></head>');
 html=html.replace('</style>','</style><style>'+css+'</style>');
 // The local prototype footer promises telemetry which this public integration does not collect.
 html=html.replace('这是内部试玩原型：选择会被匿名记录，用来改进内容。','进度与图鉴使用 StoryDate 账号存档；剧情结果由规则决定。');
 html=html.replace('This is an internal playtest prototype: choices are logged anonymously to improve the content.','Progress and the gallery use your StoryDate save. Rules decide story outcomes.');
 return html;
}

const pair = (zh, en) => ({zh, en});
export const ZHIYAO_ID = 'xc-zhiyao';
export const SHENCHENG_ID = 'xc-shencheng';
export const JIBAI_ID = 'xc-jibai';
export const xichuanStory = {
  id: 'xichuan', type: 'story', original: true, genre: 'Romance', author: 'StoryDate Studio',
  title: 'The Seventh Spring of Xichuan', title_zh: '汐川的第七个春天',
  image: '/assets/xichuan-cover.webp', href: '/play/xichuan', plays: '原创恋爱 galgame · 八章',
  description: 'Return to a seaside town and an open-air cinema in its last spring.',
  description_zh: '回到海边的小城，陪潮声影院走过最后一个春天。'
};
const cinema = {
  id: 'cinema', title: pair('潮声影院', 'Tidesound Cinema'),
  location: pair('汐川 · 潮声影院', 'Xichuan · Tidesound Cinema'),
  premise: pair('你是陆远，七年后回到汐川。在电影社认识夏知遥。剧情进度以当前存档为准。',
    'You are Lu Yuan, returning to Xichuan after seven years. Meet Xia Zhiyao through the film club. The active save determines story progress.'),
  opening: pair('“喂，要不要来看看潮声影院？”\n\n*夏知遥把电影社的宣传单递过来，语速很快。*\n\n“先别急着走。你想问电影社的事，还是先聊两句？”',
    '“Hey, want to see the Tidesound Cinema?”\n\n*Xia Zhiyao offers a film-club leaflet, speaking quickly.*\n\n“Don’t rush off. Want to ask about the club, or just talk for a minute?”'),
  starters: pair(['你为什么这么想保住电影社？', '潮声影院有什么特别的？', '先聊两句吧，你今天忙什么？'],
    ['Why does keeping the film club matter so much to you?', 'What makes the Tidesound Cinema special?', 'Let’s talk first. What are you working on today?'])
};
const cafe = {
  id: 'cafe', title: pair('海边的咖啡馆', 'The Seaside Café'),
  location: pair('汐川 · 海边的咖啡馆', 'Xichuan · The Seaside Café'),
  premise: pair("你是陆远，七年后回到汐川。在海堤边的沈家咖啡馆重遇青梅竹马沈澄。剧情进度以当前存档为准。",
    "You are Lu Yuan, returning to Xichuan after seven years. Reunite with your childhood friend Shen Cheng at her family's seaside café. The active save determines story progress."),
  opening: pair("“风铃响了。进来坐吧，陆远。”\n\n*沈澄放下正在擦的杯子，抬眼看了你一下，语调很平。*\n\n“七年没回来了。要喝点什么，还是先说正事？”",
    "“The wind chime rang. Come in and sit, Lu Yuan.”\n\n*Shen Cheng sets down the cup she was drying and glances up, her tone even.*\n\n“Seven years away. Do you want something to drink, or are you here on business?”"),
  starters: pair(['热可可，多放一块棉花糖。', '咖啡馆门口的风铃一直没换。', '这七年，汐川变化大吗？'],
    ['Hot cocoa, extra marshmallow.', 'You kept the same wind chime by the door.', 'Has Xichuan changed much in seven years?'])
};
const booth = {
  id: 'booth', title: pair('放映室', 'The Projection Booth'),
  location: pair('汐川 · 潮声影院放映室', 'Xichuan · Tidesound Projection Booth'),
  premise: pair("你是陆远，七年后回到汐川。在潮声影院银幕对面的小楼放映室认识兼职放映员季白。剧情进度以当前存档为准。",
    "You are Lu Yuan, returning to Xichuan after seven years. Meet part-time projectionist Ji Bai in the booth facing the Tidesound Cinema screen. The active save determines story progress."),
  opening: pair("“门没锁。进来时小心脚下的胶片盒，陆同学。”\n\n*季白正对着台灯一格一格检查老胶片，没有抬头，声音很轻。*\n\n“你是来看放映机的，还是想聊聊潮声影院的片子？”",
    "“The door is unlocked. Watch the film tins on the floor, Mr. Lu.”\n\n*Ji Bai holds a strip of old film up to the desk lamp, checking it frame by frame, her voice quiet.*\n\n“Are you here to see the projector, or to talk about the films at the Tidesound?”"),
  starters: pair(['你在修什么胶片？我能帮忙吗？', '你为什么喜欢守在放映室里？', '潮声影院以前放过哪些老片子？'],
    ['What film are you restoring? Can I help?', 'What keeps you working in the projection booth?', 'What old films used to play at the Tidesound?'])
};

function character(key, scene, details) {
  return {
    key, type: 'character', original: true, author: 'StoryDate Studio', genre: 'Romance', plays: '',
    image: `/assets/xichuan/art/sprites/${key}/normal.webp`, ...details,
    source: pair('汐川的第七个春天 · 原创人物', 'The Seventh Spring of Xichuan · Original character'),
    defaultScene: scene.id, scenes: [scene], scene: scene.location, opening: scene.opening, starters: scene.starters
  };
}
export const xichuanCharacters = [
  character('zhiyao', cinema, {
    id: ZHIYAO_ID, title: 'Xia Zhiyao', title_zh: '夏知遥', age: 21,
    description: 'The quick-tongued film-club president refuses to give up on a cinema facing demolition. Talk with her, then step into her story.',
    description_zh: '嘴快又固执的电影社社长，还想留住那座快拆的影院。先和她聊聊，再一起走进汐川。',
    character_brief: 'Xia Zhiyao, 21, an adult university student and president of the film club in Xichuan.',
    tags: pair(['电影社社长', '海边小城', '聊天与故事'], ['Film-club president', 'Seaside town', 'Chat and story'])
  }),
  character('shencheng', cafe, {
    id: SHENCHENG_ID, title: 'Shen Cheng', title_zh: '沈澄', age: 21,
    description: 'Your childhood friend studies in Xichuan and helps at her family’s seaside café. She calls you Lu Yuan.',
    description_zh: '青梅竹马沈澄一边读书，一边在家里的海边咖啡馆帮忙。她叫你陆远。',
    character_brief: 'Shen Cheng, 21, a student who helps at her family’s seaside café in Xichuan.',
    tags: pair(['青梅竹马', '海边咖啡馆', '聊天与故事'], ['Childhood friend', 'Seaside café', 'Chat and story'])
  }),
  character('jibai', booth, {
    id: JIBAI_ID, title: 'Ji Bai', title_zh: '季白', age: 23,
    description: 'A graduate student and part-time projectionist restores old film in the Tidesound booth. She speaks quietly and precisely.',
    description_zh: '研究生季白在潮声影院兼职做放映员。她在放映室里修老胶片，说话轻而准。',
    character_brief: 'Ji Bai, 23, a graduate student and part-time projectionist at the Tidesound Cinema.',
    tags: pair(['放映员', '老胶片', '聊天与故事'], ['Projectionist', 'Film restoration', 'Chat and story'])
  })
];
export const XICHUAN_CHARACTER_IDS = xichuanCharacters.map(character => character.id);
export const isXichuanCharacterId = id => XICHUAN_CHARACTER_IDS.includes(id);
export const xichuanCharacterById = id => xichuanCharacters.find(character => character.id === id) ?? null;

const sharedFacts = new Set(['joined_club', 'poster_sale', 'route_zhiyao', 'route_shencheng', 'route_jibai', 'route_none']);
const heroineFacts = {
  [ZHIYAO_ID]: /^(?:saw_last_spring|knows_mom|zhiyao_secret|broken_zhiyao|z_[a-z_]+)$/,
  [SHENCHENG_ID]: /^(?:cheng_coffee|third_cheng|cheng_promise|broken_shencheng|c_[a-z_]+)$/,
  [JIBAI_ID]: /^(?:saw_reel|third_jibai|reel_together|broken_jibai|j_[a-z_]+)$/
};

// Callers also check the key against the published campaign variable dictionary.
export function heroineCanKnowFact(id, variable) {
  if (!isXichuanCharacterId(id) || !variable.startsWith('flag.')) return false;
  const name = variable.slice(5);
  return sharedFacts.has(name) || heroineFacts[id].test(name);
}

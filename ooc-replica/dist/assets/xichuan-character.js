const pair = (zh, en) => ({zh, en});
export const ZHIYAO_ID = 'xc-zhiyao';
export const xichuanStory = {
  id: 'xichuan', type: 'story', original: true, genre: 'Romance', author: 'StoryDate Studio',
  title: 'The Seventh Spring of Xichuan', title_zh: '汐川的第七个春天',
  image: '/assets/xichuan-cover.webp', href: '/play/xichuan', plays: '原创恋爱 galgame · 八章',
  description: 'Return to a seaside town and an open-air cinema in its last spring.',
  description_zh: '回到海边的小城，陪潮声影院走过最后一个春天。'
};
const scene = {
  id: 'cinema', title: pair('潮声影院', 'Tidesound Cinema'),
  location: pair('汐川 · 潮声影院', 'Xichuan · Tidesound Cinema'),
  premise: pair('你是陆远，七年后回到汐川。在电影社认识夏知遥。剧情进度以当前存档为准。',
    'You are Lu Yuan, returning to Xichuan after seven years. Meet Xia Zhiyao through the film club. The active save determines story progress.'),
  opening: pair('“喂，要不要来看看潮声影院？”\n\n*夏知遥把电影社的宣传单递过来，语速很快。*\n\n“先别急着走。你想问电影社的事，还是先聊两句？”',
    '“Hey, want to see the Tidesound Cinema?”\n\n*Xia Zhiyao offers a film-club leaflet, speaking quickly.*\n\n“Don’t rush off. Want to ask about the club, or just talk for a minute?”'),
  starters: pair(['你为什么这么想保住电影社？', '潮声影院有什么特别的？', '先聊两句吧，你今天忙什么？'],
    ['Why does keeping the film club matter so much to you?', 'What makes the Tidesound Cinema special?', 'Let’s talk first. What are you working on today?'])
};
export const xichuanCharacters = [{
  id: ZHIYAO_ID, key: 'zhiyao', type: 'character', original: true, author: 'StoryDate Studio',
  title: 'Xia Zhiyao', title_zh: '夏知遥', age: 21, genre: 'Romance', plays: '',
  image: '/assets/xichuan/art/sprites/zhiyao/normal.webp',
  description: 'The quick-tongued film-club president refuses to give up on a cinema facing demolition. Talk with her, then step into her story.',
  description_zh: '嘴快又固执的电影社社长，还想留住那座快拆的影院。先和她聊聊，再一起走进汐川。',
  character_brief: 'Xia Zhiyao, 21, an adult university student and president of the film club in Xichuan.',
  tags: pair(['电影社社长', '海边小城', '聊天与故事'], ['Film-club president', 'Seaside town', 'Chat and story']),
  source: pair('汐川的第七个春天 · 原创人物', 'The Seventh Spring of Xichuan · Original character'),
  defaultScene: scene.id, scenes: [scene], scene: scene.location, opening: scene.opening, starters: scene.starters
}];

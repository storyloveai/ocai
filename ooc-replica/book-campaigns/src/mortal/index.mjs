import { T, relVars } from '../../dsl.mjs';
import { tiers, dims, reactPatterns } from '../common.mjs';
import { chapters, chars, vars, debts, echoes, places, valueTags } from './meta.mjs';
import { nodes as n1 } from './c1.mjs';
import { nodes as n2 } from './c2.mjs';
import { nodes as n3 } from './c3.mjs';
import { nodes as n4 } from './c4.mjs';
import { nodes as n5 } from './c5.mjs';
import { nodes as n6 } from './c6.mjs';
import { nodes as n7 } from './c7.mjs';
import { endings, endNote, fragFace, endingArt, interrupts, commitRules } from './ending.mjs';

export function mortalCampaign() {
  const nodes = {};
  for (const n of [...n1, ...n2, ...n3, ...n4, ...n5, ...n6, ...n7, ...interrupts]) {
    if (nodes[n.id]) throw Error('duplicate node ' + n.id);
    nodes[n.id] = n;
  }
  return {
    spec: 'storydate.campaign/0.3', tiers, carry_compress: { pivot: 6, k: 0.5 },
    id: 'mortal_path_v1', prev: null, title: T('凡人修仙传'), volume: T('卷一 · 谷外微尘'),
    rights: { source: '题材取自《凡人修仙传》（忘语）的“凡人修仙”世界观', quotes: '情节、人物与文字均为项目原创；韩立仅作远景客串，不继承任何原著机缘', original_characters: ['沈微尘（玩家）', '陆晞', '叶行舟', '乔素', '陶岑', '魏冲', '老丁'] },
    player: { name: '沈微尘' }, side_prompt: T('这几天，你只来得及做一件事。'),
    ai_intro: 'an original xianxia story set in the mortal-cultivation world of A Record of a Mortal\'s Journey to Immortality. The player is Shen Weichen, an original, ordinary four-spirit-root outer disciple at Yellow Maple Valley; Han Li appears only as a distant cameo and no canon treasures are inherited',
    vars: { ...vars, ...relVars(chars) }, chars, dims,
    echoes, debts, chapters: chapters.map(c => ({ ...c, title: T(c.title), year: T(c.year), canon: T(c.canon) })),
    nodes, endings, future_terms: [], ending_art: endingArt, art_prompts: {}, frag_face: fragFace, portrait_prompts: {},
    cg_captions: { lamp: '药灯', stone: '灵石', ravine: '雾涧', bridge: '石桥', boat: '云舟', gate: '山门' },
    react_patterns: reactPatterns, value_tags: valueTags, commit_rules: commitRules, flash: [], witness: [],
    places, rivers: [], presets: [], sources: [], end_note: T(endNote),
    panel: [
      { title: T('家底'), vars: [{ v: 'stone' }, { v: 'cult' }, { v: 'meridian' }], hint: T('灵石买路，修为冲关，经脉是你能撑多久；三样都要留一点') },
      { title: T('人心'), vars: [{ v: 'valley' }, { v: 'renown.kind' }, { v: 'renown.sharp' }], hint: T('谷中人心决定危难时有没有人听你；厚道与精明，各有各的路') },
      { title: T('危险'), vars: [{ v: 'mark', neg: true }], hint: T('到 4 会有人半夜来敲门；借息、私账、顶撞，都会让它上升') },
    ],
  };
}

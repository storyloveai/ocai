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

export function monteCampaign() {
  const nodes = {};
  for (const n of [...n1, ...n2, ...n3, ...n4, ...n5, ...n6, ...n7, ...interrupts]) {
    if (nodes[n.id]) throw Error('duplicate node ' + n.id);
    nodes[n.id] = n;
  }
  return {
    spec: 'storydate.campaign/0.3', tiers, carry_compress: { pivot: 6, k: 0.5 },
    id: 'monte_cristo_v1', prev: null, title: T('基督山伯爵'), volume: T('卷一 · 余烬与潮汐'),
    rights: { source: '《基督山伯爵》（大仲马，1844—1846），公版', quotes: '情节为项目新写；人物与背景据原著', original_characters: ['诺埃尔（玩家）'] },
    player: { name: '诺埃尔' }, side_prompt: T('这几天，你只来得及做一件事。'),
    ai_intro: 'the interactive adaptation of The Count of Monte Cristo (Dumas). The player is Noël, an original young clerk at Morrel & Son in Marseille, 1815–1829',
    vars: { ...vars, ...relVars(chars) }, chars, dims,
    echoes, debts, chapters: chapters.map(c => ({ ...c, title: T(c.title), year: T(c.year), canon: T(c.canon) })),
    nodes, endings, future_terms: [], ending_art: endingArt, art_prompts: {}, frag_face: fragFace, portrait_prompts: {},
    cg_captions: { toast: '第一杯', ink: '左手', arrest: '带走', burn: '炉火', ship: '三桅船', purse: '红丝钱袋' },
    react_patterns: reactPatterns, value_tags: valueTags, commit_rules: commitRules, flash: [], witness: [],
    places, rivers: [], presets: [], sources: [], end_note: T(endNote),
    panel: [
      { title: T('家底'), vars: [{ v: 'money' }, { v: 'house' }], hint: T('积蓄够用才能垫付、打点；商行信用降到底，商行就撑不住了') },
      { title: T('名声'), vars: [{ v: 'renown.reliable' }, { v: 'renown.shrewd' }], hint: T('可靠让人托付你，精明让人提防你；两样都会被人记在心里') },
      { title: T('危险'), vars: [{ v: 'watch', neg: true }], hint: T('到 4 会被传去问话；多管闲事、替人出头都会让它上升') },
    ],
  };
}

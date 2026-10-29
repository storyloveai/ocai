// Website character conversations. The campaign's content, rules and saves are
// separate. Persona sources are recorded in server/sanguo-character-roles.js.
const pair = (zh, en) => ({zh, en});
export const sanguoCharacters = [
  {
    id: 'sgc-002', key: 'caocao', title: 'Cao Cao', title_zh: '曹操',
    image: '/assets/sanguo-art/portraits/caocao.webp',
    description: 'Over a cup of wine in Xudu, the Chancellor weighs your judgment. He enjoys a sharp answer; flattery will not earn his trust.',
    description_zh: '许都的一盏酒，既能谈诗，也能试人。他爱才、多疑，笑着问你的话，未必只是闲话。',
    character_brief: 'Cao Cao, adult man in his forties; sharp eyes, dark robes; amused, direct, suspicious and fond of talent.',
    tags: pair(['识人', '诗酒', '锋芒'], ['Judgment', 'Poetry', 'Ambition']),
    scene: pair('许都 · 酒后灯下', 'Xudu · After the wine'),
    opening: pair('*席上的酒还温着。曹操把一只空杯推到你面前，没有让侍从来斟。*\n\n“方才满座的人，都说孤用人不疑。”他笑了一声，“你也这么想？”',
      '*The wine is still warm. Cao Cao pushes an empty cup toward you, without calling a servant to fill it.*\n\n“Everyone at that table said I trust the people I appoint.” He smiles. “Do you think so too?”'),
    starters: pair(['丞相若真不疑，为什么还要问我？', '我先替丞相斟酒，问他今日听到了哪句真话。', '我想谈谈诗，今晚先不论天下。'],
      ['If you truly trusted them, why ask me?', 'I fill his cup and ask which honest answer he heard today.', 'May we talk about poetry, and leave the realm aside tonight?'])
  },
  {
    id: 'sgc-004', key: 'zhuge', title: 'Zhuge Liang', title_zh: '诸葛亮',
    image: '/assets/sanguo-art/portraits/zhuge.webp',
    description: 'Newly out of his thatched cottage, Zhuge Liang leaves a map unfinished. Talk through a hard choice with someone who hears what you leave unsaid.',
    description_zh: '刚出山的孔明还没有后世的神机妙算。他从容、机敏，愿意听你说，也会追问你没有说出口的那一半。',
    character_brief: 'Zhuge Liang, 27, adult man; pale scholar robes and a feather fan; composed, perceptive and courteous.',
    tags: pair(['谋略', '试探', '长谈'], ['Strategy', 'Questions', 'Reflection']),
    scene: pair('新野 · 雨夜案前', 'Xinye · Rain at the desk'),
    opening: pair('*窗外的雨压低了灯火。诸葛亮把地图往旁边移了移，给你留出一块空桌。*\n\n“来时想好要问什么了？”他放下羽扇，“若还没想好，也不妨先坐。”',
      '*Rain softens the lamplight. Zhuge Liang moves a map aside, clearing a place for you at the desk.*\n\n“Did you decide what to ask on your way here?” He sets down his fan. “You can sit even if you have not.”'),
    starters: pair(['你出山之前，最舍不得放下的是什么？', '若每条路都有代价，你会先看什么？', '我暂时不谈天下，只想在这里坐一会儿。'],
      ['What was hardest to leave behind when you left your cottage?', 'When every path has a cost, what do you examine first?', 'I would rather leave politics aside and sit here for a while.'])
  },
  {
    id: 'sgc-009', key: 'wenzhi', title: 'Wen Zhi', title_zh: '温芷',
    image: '/assets/sanguo-art/portraits/wenzhi.webp',
    description: 'A physician’s daughter from Yingchuan, practical and sharp-tongued, with a soft heart. Help her finish the herbs, or tell her what is really troubling you.',
    description_zh: '颍川医家之女，也是《谋士》的原创人物。她嘴上不饶人，却记得你有没有好好吃饭；比起漂亮话，她更信你做了什么。',
    character_brief: 'Wen Zhi, an adult woman from Yingchuan and a physician’s daughter; calm, practical, sharp-tongued and soft-hearted.',
    tags: pair(['同乡', '医馆', '日常'], ['Hometown', 'Herbs', 'Everyday life']),
    scene: pair('许都 · 医馆将歇', 'Xudu · Closing the clinic'),
    opening: pair('*医馆的门已经掩了一半。温芷抬头看见你，把案边的小凳往外踢了踢，手里的药杵却没停。*\n\n“站门口做什么？进来。”她看了你一眼，“先说，吃过饭没有？”',
      '*The clinic door is half closed. Seeing you, Wen Zhi nudges a stool out from the workbench without stopping her pestle.*\n\n“Why stand in the doorway? Come in.” She looks you over. “First—have you eaten?”'),
    starters: pair(['还没。你也一直忙到现在吗？', '我拿过药杵，问她今天最难照顾的是哪位病人。', '今天有件事，我只想跟你说。'],
      ['Not yet. Have you been working all this time too?', 'I take the pestle and ask which patient gave her the most trouble today.', 'Something happened today. You are the person I wanted to tell.'])
  },
  {
    id: 'sgc-001', key: 'liubei', title: 'Liu Bei', title_zh: '刘备',
    image: '/assets/sanguo-art/portraits/liubei.webp',
    description: 'A guest under another man’s roof, Liu Bei listens before he speaks. Sit with his patience, his kindness, and the ambition he cannot quite put away.',
    description_zh: '寄人篱下的刘备仍不肯认命。你可以和他谈仁义的代价，也可以问问，这些年的隐忍究竟累不累。',
    character_brief: 'Liu Bei, around forty, adult man; plain robes; kind, patient, modest, with flashes of frustration.',
    tags: pair(['仁义', '去留', '信任'], ['Mercy', 'Resolve', 'Trust']),
    scene: pair('许都 · 客舍庭中', 'Xudu · A borrowed courtyard'),
    opening: pair('*刘备把沾着泥的手在布上擦了擦，将门边唯一一把好凳子让给你。菜畦里的水还没有浇完。*\n\n“来了？坐。”他望了一眼墙外，“这几日，倒像只有这里还由得备做主。”',
      '*Liu Bei wipes the soil from his hands and offers you the one sound stool by the door. The vegetable beds are only half watered.*\n\n“Come, sit.” He glances beyond the wall. “These days, this patch seems the only place where I still decide anything.”'),
    starters: pair(['我帮你把剩下的菜浇完，你慢慢说。', '若眼下只能忍，怎样才不算认命？', '你最怕辜负的，到底是谁？'],
      ['Let me water the rest while you tell me about it.', 'If patience is all we have, how do we keep it from becoming surrender?', 'Who are you most afraid of letting down?'])
  },
  {
    id: 'sgc-003', key: 'guanyu', title: 'Guan Yu', title_zh: '关羽',
    image: '/assets/sanguo-art/portraits/guanyu.webp',
    description: 'Guan Yu reads by a single lamp. He says little, keeps his promises, and does not mistake an easy answer for an honorable one.',
    description_zh: '一卷《春秋》，一盏夜灯。关羽不轻易亲近人，也不轻易收回承诺；有些难题，他愿意与你直说。',
    character_brief: 'Guan Yu, adult man; long beard and green robes; taciturn, solemn, guarded, utterly loyal to Liu Bei.',
    tags: pair(['忠义', '承诺', '寡言'], ['Loyalty', 'Promises', 'Few words']),
    scene: pair('许都 · 夜读春秋', 'Xudu · Reading by lamplight'),
    opening: pair('*关羽听见脚步，将书扣在案上。他没有起身，只把灯拨亮了一些。*\n\n“坐。”他看着你，“有话便说。关某听着。”',
      '*At your footsteps, Guan Yu closes his book on the desk. He stays seated, but turns up the lamp.*\n\n“Sit.” His gaze rests on you. “Say what you came to say. I am listening.”'),
    starters: pair(['若守一个诺要负另一个人，该怎么办？', '你读《春秋》时，也会有不认同的地方吗？', '我不急着说话，先陪你坐一会儿。'],
      ['What if keeping one promise means failing someone else?', 'Do you ever disagree with the book you are reading?', 'There is no hurry. I can sit with you for a while.'])
  },
  {
    id: 'sgc-008', key: 'zhaoyun', title: 'Zhao Yun', title_zh: '赵云',
    image: '/assets/sanguo-art/portraits/zhaoyun.webp',
    description: 'After Changban, Zhao Yun checks the tack rather than recounting his charge. His courage is careful, his kindness practical; ask what the stories leave out.',
    description_zh: '长坂之后，他先检查马具，再问有没有人落下。赵云沉稳、守礼，不爱讲自己的功劳，却会认真听你的担心。',
    character_brief: 'Zhao Yun, adult man; silver armor; calm, careful, courteous, sparing with words and meticulous in action.',
    tags: pair(['可靠', '勇气', '同行'], ['Steadiness', 'Courage', 'Companionship']),
    scene: pair('汉津 · 营外卸甲', 'Hanjin · Outside the camp'),
    opening: pair('*赵云正低头检查一截磨损的缰绳。听见你来，他将长枪靠稳，腾出一只手示意你避开泥水。*\n\n“站这边，干些。”他看清你的神色，“有事？末将眼下有空。”',
      '*Zhao Yun is examining a worn length of rein. Hearing you, he steadies his spear against the rack and gestures you away from the mud.*\n\n“This side is drier.” He notices your expression. “Something on your mind? I have time.”'),
    starters: pair(['你冲进去之前，也会怕自己回不来吗？', '我帮你理好马具，问还有谁没有回来。', '我有一件拿不准的事，想听听你的看法。'],
      ['Before you rode in, were you afraid you might not return?', 'I help with the tack and ask whether anyone is still missing.', 'I am uncertain about something. May I ask your view?'])
  }
];

export const characterById = new Map(sanguoCharacters.map(c => [c.id, c]));
export function mergeSanguoCharacters(existing) {
  const seen = new Set();
  const merged = existing.map(c => {seen.add(c.id); return {...c, ...characterById.get(c.id)};});
  return [...merged, ...sanguoCharacters.filter(c => !seen.has(c.id)).map(c => ({
    author: 'StoryDate Studio', genre: 'History', type: 'character', original: true, plays: '', ...c
  }))];
}

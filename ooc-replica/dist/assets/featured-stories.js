import {xichuan, ashenCrown, bakerStreet} from './ashen-crown.js';
import {threeKingdoms} from './three-kingdoms.js';
import {bookMetadata} from './book-catalog.js';

const pair = (zh, en) => ({zh, en});

export const STORY_FILTERS = [
  {id:'all', label:pair('全部','All')},
  {id:'visual-novels', label:pair('恋爱与群像 Galgame','Visual Novels')},
  {id:'strategy', label:pair('历史谋略','Historical Strategy')},
  {id:'detective', label:pair('侦探推理','Detective Mystery')},
  {id:'classics', label:pair('名著互动','Classics Interactive')},
];

const books = new Map(bookMetadata.map(book => [book.id, book]));

// The public shelf has its own editorial order. The full catalogue still owns
// routes, saves, biographies and bookmarks, including the alternate ink edition.
export const FEATURED_STORIES = [
  {
    id:xichuan.id, image:xichuan.image, category:'visual-novels', featured:true,
    title:pair(xichuan.title,'The Seventh Spring of Xichuan'),
    badge:pair('恋爱 Galgame · 全本','Romance Galgame · Full story'),
    quote:pair('“你是来拆它的，还是来救它的？”——陪海边露天影院走过最后一个春天。','“Are you here to tear it down, or to save it?” — Spend one last spring at the seaside cinema.'),
    meta:pair('夏知遥 · 沈澄 · 季白','Xia Zhiyao · Shen Cheng · Ji Bai'),
  },
  {
    id:threeKingdoms.id, image:threeKingdoms.image, category:'strategy', featured:true,
    title:pair(threeKingdoms.title,'Three Kingdoms: The Strategist'),
    badge:pair('历史谋略 · 八卷完结','Historical Strategy · 8 volumes'),
    quote:pair('“今天下英雄，惟使君与操耳。”——化身谋士子衡，你说的每句话都有后果。','“The only heroes under heaven are you and I.” — Step in as strategist Ziheng, where every word has consequences.'),
    meta:pair('曹操 · 诸葛亮 · 温芷 · 刘备 · 关羽','Cao Cao · Zhuge Liang · Wen Zhi · Liu Bei · Guan Yu'),
  },
  {
    id:ashenCrown.id, image:ashenCrown.image, category:'visual-novels', featured:true,
    title:pair('灰烬王冠','The Ashen Crown'),
    badge:pair('奇幻群像 · 卷一《灯火》','Modern Fantasy · Vol. 1 Lights'),
    quote:pair('“借一次全力，拿走你一段最温暖的记忆。”——十二件遗器苏醒的港城之战。','“Go all-out, pay your warmest memory.” — Twelve relics wake beneath a modern harbour city.'),
    meta:pair('提灯 · 伊芙琳·冯·艾希','The Lamp · Evelyn von Eiche'),
  },
  {
    id:bakerStreet.id, image:bakerStreet.image, category:'detective', featured:true,
    title:pair(bakerStreet.title,'Baker Street · A Study in Scarlet'),
    badge:pair('侦探推理 · 卷一试样','Detective Mystery · Vol. 1'),
    quote:pair('“华生，你看了，但你没有观察。”——勘查现场、盘问证人，看穿案件真相。','“You see, Watson, but you do not observe.” — Examine clues, question witnesses, and test your deduction.'),
    meta:pair('歇洛克·福尔摩斯','Sherlock Holmes'),
  },
  {
    id:'mortal-path', image:books.get('mortal-path').image, category:'classics', featured:false,
    title:pair(books.get('mortal-path').title,'Mortal Path · Dust Outside the Valley'),
    badge:pair('修仙成长 · 规则战役','Cultivation · Rule campaign'),
    quote:pair('一张能预支灵力的借息契让你看见捷径，但没有一条路不付代价。','A loan contract offers a shortcut in spiritual power, but every path exacts its price.'),
    meta:pair('名著互动 · 前两章试玩','Classics Interactive · 2 chapters'),
  },
  {
    id:'monte-cristo', image:books.get('monte-cristo').image, category:'classics', featured:false,
    title:pair(books.get('monte-cristo').title,'Monte Cristo · Embers and Tides'),
    badge:pair('悬疑复仇 · 规则战役','Revenge Mystery · Rule campaign'),
    quote:pair('当证据足以摧毁一个人，你还要查清谁会和他一起倒下。','When the evidence can destroy a man, you must learn who else will fall with him.'),
    meta:pair('名著互动 · 前两章试玩','Classics Interactive · 2 chapters'),
  },
];

export const featuredStoryById = new Map(FEATURED_STORIES.map(story => [story.id,story]));

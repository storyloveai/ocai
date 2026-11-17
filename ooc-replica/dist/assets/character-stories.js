import {CHARACTER_CARDS, WORKS} from './flywheel/cards-data.js';
import {storydateOriginals, storydateCharacters} from './storydate-originals.js';
import {threeKingdoms, threeKingdomsInk} from './three-kingdoms.js';
import {ashenCrown, ashenCrownEn, bakerStreet, bakerStreetEn} from './ashen-crown.js';
import {xichuanStory} from './xichuan-character.js';

// Relationships only: all descriptions, identities and play URLs come from
// existing published site metadata. No account state or new story is created.
const pair = (zh, en = zh) => ({zh, en});
const gameSources = [
  {work:'sanguo', source:threeKingdoms, titleEn:WORKS.sanguo.title.en, playUrl:'/play/three-kingdoms'},
  {work:'xichuan', source:xichuanStory, playUrl:xichuanStory.href},
  {work:'ashen', source:ashenCrown, titleEn:ashenCrownEn.title, playUrl:ashenCrown.href},
  {work:'holmes', source:bakerStreet, titleEn:bakerStreetEn.title, playUrl:bakerStreet.href},
];
const gameStoryForWork = new Map(gameSources.map(({work,source}) => [work,source.id]));
const workForGameStory = new Map(gameSources.map(({work,source}) => [source.id,work]));
workForGameStory.set(threeKingdomsInk.id,'sanguo');

function gameRecord({work,source,titleEn,playUrl}) {
  const known = WORKS[work];
  return {
    id:source.id,
    title:pair(source.title_zh || source.title, titleEn || source.title),
    informationUrl:'/story/' + source.id,
    playUrl,
    image:source.image,
    description:pair(source.description_zh || source.description || known.kind.zh,
      source.description_zh ? source.description : known.kind.en),
  };
}
const gameRecords = gameSources.map(gameRecord);
const records = new Map(storydateOriginals.map(source => [source.id,{
  id:source.id,
  title:pair(source.title_zh || source.title,source.title),
  informationUrl:'/story/' + source.id,
  playUrl:'/play/' + source.id,
  image:source.image,
  description:pair(source.description_zh || source.description || '',source.description || ''),
}]));
for (const record of gameRecords) records.set(record.id,record);
records.set(threeKingdomsInk.id,{
  ...records.get(threeKingdoms.id), id:threeKingdomsInk.id,
  title:pair(threeKingdomsInk.title,WORKS.sanguo.title.en + ' · Ink'),
  informationUrl:'/story/' + threeKingdomsInk.id,
  playUrl:'/play/' + threeKingdomsInk.id,
  image:threeKingdomsInk.image,
  description:pair(threeKingdomsInk.description,WORKS.sanguo.kind.en),
});

// These four games already have cards and players. Registering their metadata
// lets the ordinary Story search, preview and detail view find the same works.
export const linkedStoryCatalog = gameSources.map(({source}) => {
  const record = records.get(source.id);
  return {
    ...source, type:'story', original:true,
    title:record.title.en, title_zh:record.title.zh,
    description:record.description.en, description_zh:record.description.zh,
    href:record.informationUrl, playUrl:record.playUrl,
  };
});

export function storyById(storyId) { return records.get(storyId) || null; }

export function storiesForCharacter(cardId) {
  const card = CHARACTER_CARDS.find(c => c.id === cardId);
  if (!card) return [];
  const found = new Map();
  for (const appearance of [{work:card.source.work},...card.appearances]) {
    const id = gameStoryForWork.get(appearance.work), record = records.get(id);
    if (record) found.set(id,{...record,...(appearance.role ? {role:appearance.role} : {})});
  }
  // Preserve the existing StoryDate character→biography link. This is separate
  // from the campaign, with its original story and chat storage IDs unchanged.
  const siteCharacter = storydateCharacters.find(c => c.id === card.chatId);
  const biography = records.get(siteCharacter?.story_id);
  if (biography && !found.has(biography.id)) found.set(biography.id,{...biography});
  return [...found.values()];
}

export function charactersForStory(storyId) {
  const work = workForGameStory.get(storyId);
  if (work) return CHARACTER_CARDS.filter(card => card.source.work === work || card.appearances.some(a => a.work === work));
  if (!records.has(storyId)) return [];
  const chatIds = new Set(storydateCharacters.filter(c => c.story_id === storyId).map(c => c.id));
  return CHARACTER_CARDS.filter(card => chatIds.has(card.chatId));
}

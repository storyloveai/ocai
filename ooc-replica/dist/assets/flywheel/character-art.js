// Presentation only: reuse deployed, character-free story backgrounds behind
// the existing transparent sprites. These are visual settings, not new canon.
// Portrait alpha and scene thumbnails were checked before adding each mapping.
// A null entry keeps the existing complete portrait, including its own scenery;
// opaque Three Kingdoms and Original artwork must not receive a second backdrop.
const xichuan = file => Object.freeze({background: `/assets/xichuan/art/bg/${file}.webp`});
const westlin = file => Object.freeze({background: `/assets/ashen/art/anime/bg/${file}.webp`});
const baker = file => Object.freeze({background: `/assets/holmes-webgal/game/background/bg_${file}.webp`});

export const CHARACTER_ART = Object.freeze({
  'xc-zhiyao': xichuan('cinema_dusk'),
  'xc-shencheng': xichuan('cafe'),
  'xc-jibai': xichuan('projection'),
  'xc-zhou': xichuan('cinema_night'),
  'xc-chenghang': xichuan('campus'),

  'sg-zhouyu': null,
  'sg-lvbu': null,
  'sg-diaochan': null,
  'sg-caocao': null,
  'sg-zhuge': null,
  'sg-wenzhi': null,
  'sg-liubei': null,
  'sg-guanyu': null,
  'sg-zhaoyun': null,

  'oc-shen-yanzhou': null,
  'oc-lu-wensheng': null,
  'oc-lin-zhaowan': null,

  'wn-lamp': westlin('shop_day'),
  'wn-gran': westlin('bar'),
  'wn-sword': westlin('bar'),
  'wn-evelyn': westlin('eiche_top'),
  'wn-august': westlin('park_gate'),
  'wn-baiqiu': westlin('teahouse'),
  'wn-carlo': westlin('mural_alley'),
  'wn-suman': westlin('ward'),
  'wn-adam': westlin('train'),
  'wn-ben': westlin('metro'),

  'bk-holmes': baker('baker_day'),
  'bk-lestrade': baker('station'),
  'bk-gregson': baker('station'),
  'bk-hudson': baker('baker_day'),
  'bk-hope': baker('street_fog'),
  'bk-stamford': baker('lab'),
});

// Use art?.background as a cover-sized background layer, then keep the original
// sprite as a separate foreground image so expression switching stays intact.
export function characterArt(character) {
  const id = typeof character === 'string' ? character : character?.id;
  return Object.hasOwn(CHARACTER_ART, id) ? CHARACTER_ART[id] : null;
}

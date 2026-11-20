// Private direct-link character. This record is never added to the discovery catalog.
export const julian = {
  id:'sn-julian', type:'character', title:'Julian Vance', title_zh:'纪沉',
  image:'/assets/living-manga/seven-nights/p2.webp',
  background:'/assets/living-manga/seven-nights/p5.webp',
  scene:{en:'2:15 AM · Maison Vance Study',zh:'凌晨 2:15 · 顶层书房'},
  workTitle:{en:'2:00 AM · Seven Nights',zh:'凌晨两点 · 七夜之约'},
  tagline:{en:'The key is yours.',zh:'钥匙在你手里。'},
  description:'*He locks the heavy study door with a quiet click and sets a crystal glass beside the brass lamp.* “Rule one under my roof: never lie to me. Now—why were those two sedans really waiting on my street?”',
  description_zh:'*他轻轻锁上厚重的书房门，将一只水晶杯放在黄铜台灯旁。*「我屋檐下的第一条规矩：别骗我。现在告诉我，那两辆车为什么会等在我的街口？」'
};

export const seasonKey = 'ooc-session-v2-seven-nights-season';
export const scenes = {
  ep1_study: {
    starters:[{"en": "Then why give me the key?", "zh": "那你为什么把钥匙给我？"}, {"en": "Turn out the lamp. They can see us.", "zh": "把灯关了。他们看得见我们。"}],
    number:1, branches:['stand_ground','probe_close','hide_truth','custom']},
  ep2_car: {
    starters:[{"en": "That driver knows your name.", "zh": "那个司机知道你的名字。"}, {"en": "Let me see the ledger.", "zh": "把账本给我看。"}],
    number:2, branches:['claim_name','expose_ledger','cold_warning','custom'],
    scene:{en:'10:15 PM · The Rain-Soaked Backseat',zh:'晚 10:15 · 暴雨后座'},
    background:'/assets/living-manga/seven-nights/ep2_p4.webp',
    image:'/assets/living-manga/seven-nights/ep2_p4.webp',
    tagline:{en:'Lock your door and sit closer.',zh:'锁好车门，坐近一点。'},
    description:'*Julian watches the same headlights make a third turn behind the car.* “The collector let go of your wrist. His driver seems less willing to let the matter drop. What did you see at the auction?”',
    description_zh:'*纪沉看着后视镜，那对车灯跟着拐了第三个弯。*「拍卖行里那人松了你的手，他的司机可还不肯罢休。你当时看见了什么？」'},
  ep3_balcony: {
    starters:[{"en": "Who kept the other half of the seal?", "zh": "另一半银印一直在谁手里？"}, {"en": "If I board that boat, will you come?", "zh": "如果我上船，你跟我走吗？"}],
    number:3, branches:['burn_together','close_distance','walk_away_test','custom'],
    scene:{en:'3:05 AM · Midnight Balcony',zh:'凌晨 3:05 · 暴雨阳台'},
    background:'/assets/living-manga/seven-nights/ep3_p4.webp',
    image:'/assets/living-manga/seven-nights/ep3_p4.webp',
    tagline:{en:'Watch the harbor burn.',zh:'看着港口燃起来。'},
    description:'*A red flare gutters over the harbor. He opens his palm; the two halves of the silver signet fit.* “Three years ago I could give you only half the truth. The boat is nearly here. Ask me the rest.”',
    description_zh:'*港口那枚红色信号弹将熄。纪沉摊开手掌，两半银印严丝合缝。*「三年前，我只能给你一半真相。船快靠岸了，剩下的，你来问。」'}
};
export function sceneId(value) {
  return typeof value === 'string' && Object.hasOwn(scenes,value) ? value : 'ep1_study';
}
export function julianAt(value) {
  const id = sceneId(value);
  return {...julian, ...scenes[id], sceneId:id};
}
export function impressions(value, until = 3) {
  if (!Array.isArray(value)) return [];
  const permitted = Object.values(scenes).filter(s=>s.number<=until)
    .flatMap(s=>s.branches.map(b=>s.number+':'+b));
  return permitted.filter(code=>value.includes(code));
}
export function nightPath(n) {
  return '/pilot/seven-nights' + (n===1?'':'/ep'+n);
}

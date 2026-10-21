import { T, TIER_START, TIER_END } from '../dsl.mjs';

export const tiers = {
  start: TIER_START, end: TIER_END,
  names: {
    trust: [T('戒备'), T('观望'), T('可托'), T('倚重'), T('心腹')],
    esteem: [T('轻视'), T('寻常'), T('器重'), T('推崇'), T('折服')],
    warmth: [T('冷淡'), T('相识'), T('相熟'), T('交好'), T('知己')],
    intimacy: [T('生疏'), T('在意'), T('心动'), T('两情相悦'), T('相许')],
  },
};
export const dims = { warmth: T('交情'), trust: T('信任'), esteem: T('看重'), intimacy: T('亲近') };
export const reactPatterns = {
  love: '爱你|喜欢你|爱上|嫁给我|娶你|心悦|想你|在一起|做我的|亲你|抱你|love you|i love|marry me|kiss you',
  insult: '奸贼|国贼|老贼|蠢|笨|废物|滚|闭嘴|可笑|懦夫|活该|无能|伪君子|stupid|idiot|fool|shut up|cowar',
  praise: '佩服|厉害|雄才|英明|了不起|仰慕|英雄|敬佩|admire|amazing|impressive|great man',
  ask: '[?？]|吗$|呢$|什么|为什么|怎么|如何|\\bhow\\b|\\bwhy\\b|\\bwhat\\b|\\bwho\\b',
  threat: '杀了你|宰了你|砍了你|要你的命|让你死|弄死你|kill you|i\'ll kill|slit your|you\'ll die|end y',
  nonsense: '^(阿巴)+$|^(哈+|啊+|嘿+|呵+|嘻+|嗯+|哦+|lol|ha(ha)+|asdf\\w*|[a-z]{1,2})[!！。.]*$',
};
export const rightsFor = (source, quotes, originals) => ({ source, quotes, original_characters: originals });

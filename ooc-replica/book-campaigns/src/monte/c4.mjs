import { node, choice, callback, talk, ask, F, NF, ALL, ANY, AT, UPTO, IS, GE, LE, setv, add, rel, V } from '../../dsl.mjs';

export const nodes = [
  // ---------------- 支线 ----------------
  node('mc4_soup', 'c4', 'side', '一碗汤的工夫', {
    canon: '原创', place: 'meilhan', cast: [{ id: 'louis' }], art: { scene: 'stairs', layers: [{ id: 'bread' }, { id: 'steam', when: F('flag.louis_cared') }] },
    intro: [
      '秋天，梅兰街的楼梯比往年更冷。老路易的外套已经松得挂不住肩，可他坐在椅子上的姿势，仍像在等一个人推门进来。',
      { text: '你每天傍晚拎着汤上楼，这已经成了习惯。他有时候吃，有时候只是捧着，让热气从手心里一点一点爬上来。', when: F('flag.louis_cared') },
      { text: '你有两个月没有上过这座楼梯。窗台上的水杯是空的，桌上的一小块面包已经发硬。', when: NF('flag.louis_cared') },
    ],
    callbacks: [callback('e_soup', '他笑了笑：「你这孩子，说每天来，就真的每天来。」', F('flag.louis_cared'))],
    choices: [
      choice('read', 'expression', '把爱德蒙留下的旧信读给他听，一遍又一遍。', '老人闭着眼睛听，嘴唇跟着信里的每一个字轻轻地动。你读到「很快到家」那一句时，他睁开眼睛：「他那天回来，说的第一句话，就是这个。」他笑了，眼角的皱纹里全是亮光。',
        { fx: [rel('louis', 'warmth', 2), rel('louis', 'trust', 1)], values: ['yi'] }),
      choice('mercedes', 'strategy', '去加泰兰村，把梅尔塞苔丝请来坐一会儿。', '她来了，没有说话，坐在老人身边，把一块新烤的面包掰成小块，一块一块放进他的手心。老人叫她「我的孩子」，她点点头，眼泪终于落下来。你站在门口，没有进去。',
        { fx: [rel('mercedes', 'warmth', 2), rel('louis', 'warmth', 1), rel('mercedes', 'trust', 1)], values: ['yi'] }),
      choice('coins', 'strategy', '悄悄把一小袋铜钱塞进他的枕头，不告诉他。', '你只留了够吃一周的钱。你不知道这些够不够，但你知道，一个人到了他这个年纪，需要的不只是钱。下楼时你听见身后的椅子响了一下，他在叫你的名字。你没有回头。',
        { fx: [add('money', -2), rel('louis', 'trust', 1), add('renown.reliable', 1)], values: ['li', 'yi'] }),
    ],
  }),

  node('mc4_garde', 'c4', 'side', '守护圣母堂的烛光', {
    canon: '原创', place: 'garde', cast: [{ id: 'mercedes' }], art: { scene: 'church', layers: [{ id: 'candles' }, { id: 'model_ship' }] },
    intro: [
      '守护圣母堂建在马赛城里最高的岩顶上，水手的妻子们把许愿的船模挂在拱顶下，每一只都带着一个名字。梅尔塞苔丝每个礼拜都会来。',
      '她点了一支很细的蜡烛，放在最里面的铁架上，看着它烧。你站在她身后，看着一整片船模在烛光里轻轻地晃，像一片倒挂的、沉没的船队。',
    ],
    choices: [
      choice('light', 'expression', '陪她点一支蜡烛，什么也不许。', '你们并肩站着，看两支烛火靠得很近，又各自燃烧。「你许了什么？」她轻声问。「没有许，」你说，「我只是想让他看见这里有人在等。」她握住你的袖口一瞬，又放开。',
        { fx: [rel('mercedes', 'warmth', 2), rel('mercedes', 'trust', 1)], values: ['yi'] }),
      choice('truth', 'dilemma', '告诉她：「爱德蒙的登记被人封过。他不是丢了，是被藏起来了。」', '她转过身，脸色白得像蜡。「藏起来了，」她重复了一遍，「那就是说……他还活着。」「我不知道，」你说，「但有人不想让他被找到。」她闭上眼睛，嘴唇动了动，又睁开。「谢谢你，」她说，「这比任何安慰都真。」',
        { when: F('flag.knows_file'), fx: [rel('mercedes', 'trust', 2), rel('mercedes', 'esteem', 2), add('watch', 1)], values: ['cheng'] }),
      choice('alone', 'expression', '让她一个人待着，在门口等。', '她在烛前站了很久，肩膀一直很直。出来时，她对你说：「你不问我，我很感谢。」她没有再说别的，你们沿着石阶一级一级走下去，海风把她的头发吹得很乱。',
        { fx: [rel('mercedes', 'esteem', 1), rel('mercedes', 'warmth', 1)], values: ['yi'] }),
    ],
  }),

  // ---------------- 主线 ----------------
  node('mc4_louis', 'c4', 'main', '霜降', {
    lock: 'functional', canon: '原著第14章 · 改编', place: 'meilhan', order: 10,
    cast: [{ id: 'louis' }], on_enter: [{ when: F('flag.louis_cared'), effects: [], resolve: [['d_father', 'transform']] }],
    art: { scene: 'stairs', layers: [{ id: 'bread' }, { id: 'hands', when: F('flag.louis_cared') }] },
    intro: [
      '霜降前后，一个早晨，你在楼梯口听见了一种你不熟悉的安静。',
      { text: '你推门进去时，老路易还靠在椅背上，眼睛半睁着，看着窗。你握住他的手，那只手比一片落叶还轻。「孩子，」他说，「今天……光很好。」', when: F('flag.louis_cared') },
      { text: '卡德鲁斯站在楼梯口，手里攥着帽子，眼睛不敢看你。「他……是昨天夜里走的，」他说，「没有人在。」他的喉结滚了滚，「我、我听见了，我以为……」他没说完。', when: NF('flag.louis_cared') },
    ],
    callbacks: [
      callback('e_cellar', '卡德鲁斯忽然抓住你的袖子：「是左手，」他喃喃地说，「那天晚上……是左手写的。」', F('flag.heard_plot')),
      callback('e_silence', '卡德鲁斯忽然抬头看了你一眼，那一眼里有你熟悉的东西：同谋之间才有的、不敢相认的目光。', F('flag.silent_arbour')),
      callback('e_hand', '梅尔塞苔丝站在门口，看着你的手，没有进来。她记得你是怎么扶住这个家的。', F('flag.held_mercedes')),
    ],
    choices: [
      choice('stay', 'expression', '握着他的手，直到最后一刻。', '他的呼吸一点一点轻下去。最后他说了一句话，很清楚：「告诉爱德蒙……我从来没有怪过他。」说完这句，他闭上了眼睛。窗外有一只鸟落在晾衣绳上，又飞走了。你一直握着他的手，直到那只手凉了。',
        { when: F('flag.louis_cared'), fx: [setv('flag.louis_word'), rel('louis', 'warmth', 2), add('renown.reliable', 2)], echo: ['e_louis_word'], values: ['yi'] }),
      choice('burial', 'strategy', '出钱，替他办一场体面的葬礼。', '你找了一口松木棺材、一个神父、三个愿意抬棺的水手。梅尔塞苔丝站在墓前，把一把野花放在土上。费尔南站在她身后，一直低着头。你把剩下的钱数了数——不够，可够了。',
        { fx: [add('money', -2), add('renown.reliable', 1), rel('mercedes', 'esteem', 1)], values: ['yi', 'li'] }),
      choice('ask_neighbor', 'strategy', '问卡德鲁斯：「他最后说了什么？」', '卡德鲁斯的眼神闪了闪，几乎立刻就回答：「什么也没说。」你盯着他看了一会儿，他忽然低下头：「他说了一个名字。我……我没听清。」你从他的话里听出了谎，也听出了一点悔。',
        { when: NF('flag.louis_cared'), fx: [add('renown.shrewd', 1), rel('caderousse', 'trust', -1), add('renown.reliable', -1)], values: ['zhi'] }),
    ],
  }),

  node('mc4_after', 'c4', 'main', '葬礼之后', {
    lock: 'free', canon: '原创', place: 'catalans', order: 15,
    cast: [{ id: 'mercedes' }], art: { scene: 'seawall', layers: [{ id: 'dusk' }] },
    intro: [
      '葬礼过后，梅尔塞苔丝一个人走到了海堤。你远远跟着，没有靠近，直到她转过身，说：「你可以过来。」',
      '风把她的黑纱吹得很高。她没有看你，只是把两只手交叠着放在石栏上：「一个人在这座城里，要想留住一个名字，是不是比想象的要难？」',
    ],
    callbacks: [callback('e_mercedes', '她看着你，平静地说：「我说过，我还在等。我现在也还在等。」', F('flag.mercedes_wait'))],
    talk: talk('mercedes', 3, [
      { id: 'wait', label: '问她：您还会等下去吗？', reply: '「等，」她说得很快，像在把这个字压住，「可是等一个人，也要有一个理由可以让别人听得懂。我没有，诺埃尔先生。我只有一个人说过的话。」她停了停，「那话还没有失效。」', fx: [rel('mercedes', 'trust', 1)], mood: 'sad' },
      { id: 'fernand', label: '问她：费尔南最近……对您怎样？', reply: '「他很好，」她说，「好得让我害怕。他每天都来，什么也不说，什么也不要。」她握紧栏杆，「我不知道该恨他还是感谢他。」', fx: [rel('mercedes', 'trust', 1)] },
      { id: 'promise', label: '对她说：「不管发生什么，我会尽力护着您。」', reply: '她转过头看着你，目光很深：「你是认真的吗？」「是。」她慢慢点了点头。「我记住了，」她说，「但我不会拿它去要求你。」', fx: [rel('mercedes', 'trust', 2), rel('mercedes', 'warmth', 1)], echo: ['e_mercedes'] },
      { id: 'ask_hand', label: '问她：那天晚上，你为什么抓住我的袖子？', req: V('flag.held_mercedes', '==', true), hint: '你得先在婚宴上扶过她', reply: '她低下头，嘴角有一点勉强的笑意：「因为你是离我最近的、没有往后退的人。」她抬起眼睛，「记得吗？大家都退了。」', fx: [rel('mercedes', 'warmth', 2), rel('mercedes', 'trust', 1)] },
    ]),
    choices: [
      choice('leave', 'expression', '送她回加泰兰村，在离门口还有一段路时停下。', '她在门口站了一会儿，没有回头。「谢谢你，」她说，「也谢谢你没有劝我。」门关上了。街上的灯一盏盏亮起来，你一个人走回商行，脚步很轻。', {}),
    ],
  }),

  node('mc4_wedding', 'c4', 'main', '加泰兰村的婚礼', {
    lock: 'literal', canon: '原著第14章 · 改编', place: 'catalans', order: 20,
    cast: [{ id: 'mercedes' }, { id: 'fernand' }], art: { scene: 'chapel', layers: [{ id: 'doorway' }, { id: 'veil' }, { id: 'empty_pew', when: NF('flag.attended_wedding') }] },
    intro: [
      '第二年的春天，加泰兰村的小教堂里挂上了白布。费尔南穿着从军队里带回来的外套，站在祭坛前，背挺得像一根桅杆。',
      '梅尔塞苔丝穿着浅色的衣裳，没有戴黑纱，脸上没有一丝血色，也没有一丝抗拒。没有人逼她——村里的老人说，她等够了。',
      '你站在教堂门口。门里是风琴的声音，门外是海。',
    ],
    callbacks: [
      callback('e_mercedes', '梅尔塞苔丝路过你身边时，极轻地说了一句：「我曾说过我还在等。你记得吗？」', F('flag.mercedes_wait')),
      callback('e_fernand', '费尔南站在祭坛前，余光扫到你。他朝你几不可见地点了点头，像是想起了很久以前，你对他说过的一句话。', ANY(F('flag.fernand_kind'), F('flag.fernand_needled'))),
      callback('e_hand', '你想起那晚她抓着你袖子的手，指甲陷进肉里，一点没有松。', F('flag.held_mercedes')),
    ],
    choices: [
      choice('attend', 'expression', '走进去，坐在最后一排。', '你坐在最后一排。她经过长椅时，目光在你脸上停了一瞬，又移开。仪式很短，没有人哭。出来时她对你说：「我不是因为爱他才答应的。你知道吗，诺埃尔先生？」你点头。「我是因为……我累了。」她说得那样平静，像在宣读一份判决书。',
        { fx: [setv('flag.attended_wedding'), rel('mercedes', 'trust', 1), rel('mercedes', 'warmth', 1), rel('fernand', 'trust', 1)], echo: ['e_wedding'], values: ['yi'] }),
      choice('letter', 'dilemma', '在仪式开始前，把拱棚下的真相塞进她的手里。', '你把折好的字条按进她掌心：「看完，烧掉。」她读了，脸色一点一点变得很静。教堂的门开了，音乐响起来。她把字条放进袖口，向祭坛走去，没有回头。你知道她会记得，也知道这已经不能改变任何事。',
        { when: F('flag.heard_plot'), fx: [setv('flag.told_mercedes'), rel('mercedes', 'trust', 3), rel('mercedes', 'esteem', 2), rel('fernand', 'trust', -3), add('watch', 1)], echo: ['e_wedding'], values: ['cheng', 'yong'] }),
      choice('away', 'strategy', '没有去。你一整天待在账房里，把整整一年的旧账又核了一遍。', '数字一个一个对得上，没有一个错。晚上你听见窗外传来很远的钟声。你把笔放下，发现墨水在纸上洇开了一小块，像一滴没有落下的泪。',
        { fx: [rel('mercedes', 'trust', -1), add('renown.shrewd', 1), rel('fernand', 'esteem', 1)], values: ['zhi'] }),
    ],
  }),
];

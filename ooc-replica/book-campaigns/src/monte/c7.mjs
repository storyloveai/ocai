import { node, choice, callback, talk, ask, F, NF, ALL, ANY, AT, UPTO, IS, GE, LE, setv, add, rel, V } from '../../dsl.mjs';

export const nodes = [
  node('mc7_morning', 'c7', 'main', '十一点之前', {
    lock: 'functional', canon: '原著第29章 · 改编', place: 'counting', order: 10,
    cast: [{ id: 'morrel' }, { id: 'julie' }, { id: 'wilmore' }],
    art: { scene: 'clock', layers: [{ id: 'purse' }, { id: 'door_shut' }, { id: 'pistol_light', when: F('flag.knows_pistol') }] },
    intro: [
      '早上八点，英国人的马车停在商行门前，他没有下车。窗帘后面能看见他的侧脸，手里握着一块怀表。',
      '莫雷尔先生在八点半走进书房，把门关上。门锁落下的声音很轻，却让整座楼都安静了。朱莉站在楼梯口，两只手紧紧攥着一只红色的丝质小钱袋——那是她出嫁时母亲给的，里面只有几枚旧银币。',
      '「诺埃尔，」她说，声音像一根绷到极限的线，「我不知道该做什么。」',
      { text: '你想起了那个夏夜，抽屉，木匣，和一句「你不要劝我」。', when: F('flag.knows_pistol') },
      { text: '你胸前的口袋里，还放着唐格拉尔银行的那张名片。它的重量，今天格外清楚。', when: F('flag.took_offer') },
    ],
    callbacks: [
      callback('e_warn_morrel', '莫雷尔看了你一眼，那一眼里有感谢，也有你不愿意细看的东西。他记得是谁把那封信交给他的。', F('flag.double_game')),
      callback('e_sold_notes', '莫雷尔不再看你。他从你身边走过去，像走过一件放错了地方的家具。', F('flag.sold_notes')),
      callback('e_pistol', '你的手心里全是汗。那个夜晚他告诉过你的话，此刻一字一字回到耳边。', F('flag.knows_pistol')),
      callback('e_lent', '朱莉看着你胸前的口袋，那里装着莫雷尔亲手写的借据。她的眼睛红了。', F('flag.lent_morrel')),
    ],
    choices: [
      choice('sit', 'expression', '搬一把椅子，坐在书房门外，什么也不说。', '你在门外坐了一个小时又二十分钟。门里没有声音。有一次，你听见椅子拖动的响声，又听见很久很久的沉默。你把后背贴在门板上，一动不动，像是用自己的身体顶着那扇门。十点钟，朱莉在你身边坐下，把头靠在了你的肩上。',
        { fx: [setv('flag.sat_with_morrel'), rel('morrel', 'trust', 2), rel('morrel', 'warmth', 3), rel('julie', 'warmth', 2), add('renown.reliable', 2)], values: ['yi'] }),
      choice('take', 'dilemma', '用钥匙孔里的缝隙确认他在做什么，然后破门进去，拿走那只木匣。', '门被撞开时，莫雷尔正把手放在抽屉上，脸色白得像纸。他没有吼，也没有动，只是看着你。你把木匣抱在怀里，说：「先生，今天只算账，不算别的。」他的嘴唇抖了很久，终于一点一点坐回椅子上，把脸埋在了手里。',
        { when: F('flag.knows_pistol'), fx: [setv('flag.took_pistol'), rel('morrel', 'warmth', 3), rel('morrel', 'trust', -1), rel('julie', 'trust', 2), add('renown.reliable', 1)], values: ['yong', 'yi'] }),
      choice('pay', 'strategy', '把你全部的积蓄放在朱莉手里：「先垫一部分。」', '朱莉看着手里的钱，像看着一件不属于这个世界的东西。她没有道谢，只是把它放进红色的丝钱袋里，一枚一枚地数。数完，她说：「我会记着，每一个法郎。」英国人在窗帘后面抬起头，看了你一眼。',
        { req: GE('money', 6), hint: '需要积蓄至少 6', fx: [add('money', -6), setv('flag.paid_part'), add('house', 1), rel('julie', 'esteem', 2), rel('wilmore', 'esteem', 2)], values: ['yi', 'li'] }),
      choice('harbor', 'strategy', '跑去港口的瞭望台，看有没有任何一条帆船的影子。', '你跑了整整一条街。瞭望台上的老守卫打着盹，被你摇醒。你用他的望远镜把整片海扫了三遍，最后在天边看见了一个很小的白点——三桅，顺风，正在转向。你不敢确定，可你的心脏跳得发疼。',
        { fx: [setv('flag.ship_seen'), rel('julie', 'trust', 1), add('renown.shrewd', 1)], values: ['zhi'] }),
    ],
  }),

  node('mc7_noon', 'c7', 'main', '一艘三桅船', {
    lock: 'functional', canon: '原著第29–30章 · 改编', place: 'quay', order: 20,
    cast: [{ id: 'morrel' }, { id: 'julie' }, { id: 'wilmore' }],
    art: { scene: 'harbor_return', layers: [{ id: 'sails' }, { id: 'crowd' }, { id: 'red_purse' }, { id: 'lone_figure', choice: 'search' }] },
    intro: [
      '十点五十五分，一个报信的孩子冲进商行，一路摔了两跤，嘴里喊着一个没有人敢再提起的名字：「法老号！法老号进港了！」',
      { text: '你认得那个孩子，他是你在瞭望台上遇见的。你本来想自己去喊，可你的腿已经软得走不动。', when: F('flag.ship_seen') },
      '整个商行的人冲了出去。码头上已经挤满了人，所有人都盯着港口入口：一艘新漆的三桅船，满帆，顺风，像一匹从很远的地方跑回来的马。船头上的名字被阳光晃得发白，但每个人都认得出来。',
      { text: '莫雷尔先生走出书房时，脸色是灰的，眼睛却亮得吓人。他一只手扶着门框，另一只手伸向朱莉。', when: ANY(F('flag.sat_with_morrel'), F('flag.took_pistol')) },
      { text: '朱莉已经冲进了书房。你听见一声撕心的喊叫，又听见她的声音变成了哭和笑的混合体。莫雷尔就坐在书桌后面，手边是已经取出来的木匣。他看见女儿，像看见了一个不存在的人。', when: ALL(NF('flag.sat_with_morrel'), NF('flag.took_pistol')) },
    ],
    callbacks: [
      callback('e_hand', '你想起很多年前，另一个家被一声宪兵的靴响撕碎，而你只能用双臂扶住它。今天，你终于看见另一个家，在最后一刻没有碎。', F('flag.held_mercedes')),
      callback('e_louis_word', '有一个人说过：「告诉爱德蒙，我从来没有怪过他。」你站在人群里，忽然很想把这句话说给整个港口听。', F('flag.louis_word')),
    ],
    choices: [
      choice('embrace', 'expression', '冲过去，把莫雷尔、朱莉和埃马纽埃尔一并抱住。', '你们四个人在码头上抱成一团，没有人说话。老水手佩内龙站在船边哭得像个孩子，嘴里一遍遍喊着「老爷，老爷」。有人在远处鼓掌，掌声很快就连成了一片。你把脸埋在莫雷尔肩上，闻到一股旧羊毛和墨水混合的味道，那是你二十年里每一个早晨的味道。',
        { fx: [rel('morrel', 'warmth', 2), rel('julie', 'warmth', 2), add('renown.reliable', 1)], values: ['yi'] }),
      choice('record', 'strategy', '回到账房，在账簿上写下日期、船名与收到的数目。', '你一个人回到安静下来的账房，在新的一页上写下日期、船名和数目。笔尖划过纸面的沙沙声，让你想起十二年前拱棚下另一支笔。你写得很慢，写得很稳。最后一行，你写下了两个字：「结清」。窗外传来港口上炮竹的响声。',
        { fx: [add('renown.shrewd', 1), rel('wilmore', 'esteem', 1), add('house', 1)], values: ['zhi', 'cheng'] }),
      choice('search', 'dilemma', '挤出人群，沿着码头寻找那个英国人。', '他站在最远的一个缆桩旁，没有靠近人群，也没有看那艘船。他看着人群里每一个人的脸，像在读一本很厚的书。你和他的目光在半空中碰了一下，他微微点了点头，嘴角似乎动了动，又立刻收回去。那一瞬间你忽然有一个荒谬而又清晰的感觉：他在为这个港口的每一个人，打分。',
        { fx: [setv('flag.saw_englishman'), rel('wilmore', 'trust', 1)], values: ['zhi'] }),
    ],
  }),

  node('mc7_evening', 'c7', 'main', '账簿合上之前', {
    lock: 'free', canon: '原创', place: 'counting', order: 30,
    cast: [{ id: 'wilmore' }], art: { scene: 'counting', layers: [{ id: 'candle' }, { id: 'stranger' }] },
    intro: [
      '傍晚，商行里终于安静下来。莫雷尔先生被家人接回了家，朱莉已经在厨房里唱歌——是你多年没听过的那种、没有任何悲伤的调子。',
      { text: '你们在码头上对视过的那一眼，谁也没有再提。可他走进门的时候，目光先在你脸上停了一下。', when: F('flag.saw_englishman') },
      { text: '你想起你向他说过那个人的事。他一定也记着，因为他今天穿的，是一件很旧的外套，像是不想显得太陌生。', when: F('flag.told_inspector') },
      '英国人在你的账房门口敲了敲门。他没有带公文包，也没有戴帽子，看起来比白天年轻了一点点。「先生，」他说，「我可以问您最后一个问题吗？」',
    ],
    callbacks: [
      callback('e_gave_proof', '他轻轻拍了拍公文包：「您交给我的东西，我会好好保存。」他停了一下，「它比您想象的重要得多。」', ANY(F('flag.gave_file'), F('flag.gave_draft'))),
      callback('e_toast', '他看着你，像在看一个很久以前许下过一杯酒的人。', F('flag.invited')),
      callback('e_year', '他的目光落在你手边那只旧日历上，二月二十四日的那一页，磨损得特别厉害。', F('flag.kept_year_ritual')),
    ],
    ask: ask('wilmore', '「如果有一天，您能让那个人回到这座城，您想对他说什么？」', [
      { id: 'sorry', means: '道歉，或承认自己曾经没有做到该做的事，没有出声，没有救他', match: '对不起|抱歉|没能|没有出声|没救|愧疚|我欠|原谅',
        out: '英国人没有说话。他走到窗边，背对着你，站了很久。「谢谢您的坦白，」他最终说，声音比之前低，「很多人会选择不提。」他的手在窗框上轻轻按了一下。', fx: [setv('flag.confessed'), rel('wilmore', 'trust', 2)] },
      { id: 'proud', means: '说出自己为他或他的家人做过的事，希望他知道', match: '我替|我照顾|我为|我记着|我每|我陪|我去过|我做了',
        out: '英国人静静地听完，像在听一份账单，每一个字都被他仔细记下。「我会转告，」他说，「转告给——一个值得转告的人。」他欠了欠身，「您做得很好。」', fx: [rel('wilmore', 'esteem', 2)] },
      { id: 'wait', means: '说他还活着，或说自己一直在等，让他回来', match: '等|活着|回来|欢迎|一直在|还在',
        out: '英国人的指尖在窗台上停了一下。「等，」他重复了一遍，像在品尝这个字，「是一种很难的美德。」他转过身，「我会记住您说的这句话。」', fx: [rel('wilmore', 'warmth', 2), rel('wilmore', 'trust', 1)] },
      { id: 'silent', means: '沉默、回避，或者说不知道', match: '不知道|不想说|没什么',
        out: '英国人等了很久，你一直没有开口。「没有关系，」他说，语气里没有失望，也没有宽容，「沉默，也是一个答案。」他点了点头，转身走向门口。', fx: [] },
    ], 'silent'),
    choices: [
      choice('accept', 'strategy', '收下他留下的一袋金币：「这是对您这些年的酬谢。」', '你犹豫了很久，终于把它接了过来。袋子比你想象的沉。英国人只是点了点头：「这不是买，是还。」他戴上帽子，走出门，没有回头。你坐在空空的账房里，打开袋子，看见一枚小小的金币上，刻着一个你不认识的名字。',
        { fx: [add('money', 6), setv('flag.accepted_gift'), rel('wilmore', 'warmth', 1)], values: ['li'] }),
      choice('refuse', 'dilemma', '谢绝：「我做的事，本来就不该收钱。」', '英国人把那只袋子收回去，看了你一眼：「您这样的人，不多了。」他把那只袋子放进怀里，又从另一个口袋里取出一张很薄的名片，放在你桌上：「如果有一天您需要什么，就去找这张名片上的人。」',
        { fx: [setv('flag.refused_gift'), add('renown.reliable', 2), rel('wilmore', 'esteem', 2), rel('wilmore', 'trust', 1)], values: ['yi', 'cheng'] }),
      choice('letter', 'expression', '写一封信，请他带给「如果还活着的那个人」。', '你写了三次，每次都撕掉。最后一次，你只写了一行：「爱德蒙：二月二十四日，我每年都去过。——诺埃尔」英国人接过信，没有读，把它折好，放进了怀里。「我会交给他，」他说，声音平静，「如果他还活着。」他走的时候，你听见他的脚步在门口停了一下。',
        { fx: [setv('flag.left_letter'), rel('wilmore', 'warmth', 2), rel('wilmore', 'trust', 1)], values: ['yi', 'cheng'] }),
    ],
  }),
];

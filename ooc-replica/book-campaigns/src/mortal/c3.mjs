import { node, choice, callback, talk, ask, F, NF, ALL, ANY, AT, UPTO, IS, GE, LE, setv, add, rel, V } from '../../dsl.mjs';

export const nodes = [
  // ---------------- 支线 ----------------
  node('mp3_well', 'c3', 'side', '半口枯井', {
    canon: '原创', place: 'field', cast: [{ id: 'han' }], art: { scene: 'field', layers: [{ id: 'dry_well' }, { id: 'dusk' }] },
    intro: [
      '药田东头有一口老井，旱了三个月，水位退到井壁最深的一道青苔下面。你下去打水，绳子放到底，只提上来半桶混着泥的浑水。',
      '井边有人。一个相貌平常的同门蹲在井沿，手里捏着一小撮干土，慢慢地搓开。他看了看你的桶，又看了看井壁。',
      '「往北三十步，」他说，声音低得几乎被风吹走，「地势低一些。」',
    ],
    choices: [
      choice('follow', 'strategy', '照他说的往北走三十步，挖开干土。', '你挖了半个时辰，铲子碰到一层潮湿的黑土。再往下，渗出了一线细细的水，凉得发疼。你回头想道谢，井边已经没有人了，只有他蹲过的地方留着一小堆搓碎的土。',
        { fx: [setv('flag.found_spring'), add('cult', 1), rel('han', 'trust', 1)], echo: ['e_spring', 'e_han'], values: ['jin'] }),
      choice('thanks', 'expression', '道了谢，却还是先把井里剩下的水打给最急的人。', '你提着半桶浑水走到病棚，陆晞接过去，澄了一刻钟才敢给人喝。你没有走北边那三十步。后来你才想起，那个人的话，一个字也没有多。',
        { fx: [add('renown.kind', 1), rel('lu', 'warmth', 1)], values: ['ren'] }),
      choice('keep', 'strategy', '记下位置，什么也不说，夜里独自来挖。', '你夜里一个人去了北边。泉眼很小，只够一个人慢慢舀。你把它藏进心里，像藏起一枚没有人知道的灵石。回去的路上，你一直觉得有一双眼睛在黑暗里看过你，却始终没有回头。',
        { fx: [setv('flag.found_spring'), add('cult', 1), add('mark', 1)], echo: ['e_spring'], values: ['jin', 'li'] }),
    ],
  }),

  node('mp3_ledger', 'c3', 'side', '乔素的暗账', {
    canon: '原创', place: 'hall', cast: [{ id: 'qiao' }], art: { scene: 'hall', layers: [{ id: 'ledger_book' }, { id: 'lamp' }] },
    intro: [
      '外务堂收工以后，乔素还没有走。她把明账合上，从案板下抽出另一本薄薄的册子，一行一行地誊抄。她写字时背脊挺得很直，像一根不肯弯的竹竿。',
      '你来还木牌，她没有抬头：「放桌上就行。」你的目光无意落在那本薄册上，上面全是水票的出入，数字和明账对不上，差得很远。',
      '她终于抬头，平静地看着你：「看到了？」',
    ],
    choices: [
      choice('copy', 'dilemma', '请她让你抄一份副本：「我替你多留一份，以防万一。」', '乔素沉默了很久。她把册子推到你面前，指尖轻轻点在第一行：「抄吧。抄完以后，它就不只是我一个人的了。」你抄到后半夜，手冻得发僵。你知道，你拿到的不是证据，而是一个人的信任。',
        { fx: [setv('flag.copied_ledger'), rel('qiao', 'trust', 2), add('mark', 1)], echo: ['e_ledger'], values: ['xin', 'yong'] }),
      choice('silent', 'expression', '低下头：「我什么也没看见。」', '乔素看了你很久，轻轻点了点头，把册子合上。「谢谢，」她说，「这是我今天听到的最好的一句话。」你没有说的话，后来她一次也没有问过。',
        { fx: [rel('qiao', 'trust', 1), rel('qiao', 'warmth', 1), add('mark', -1)], echo: ['e_ledger'], values: ['jin', 'xin'] }),
      choice('ask', 'strategy', '问她：「这些数字，到底差在哪里？」', '乔素把册子翻到一页，点出几处：「水票明面上发给药田，实际上，有三成流到了坊市。流到谁手里，我不说，你也别问。」她合上册子，「我告诉你，是因为我想看你会不会去说出去。」',
        { fx: [rel('qiao', 'esteem', 1), add('renown.sharp', 1), add('mark', 1)], echo: ['e_ledger'], values: ['xin'] }),
    ],
  }),

  node('mp3_mother', 'c3', 'side', '山下的信', {
    canon: '原创', place: 'shed', cast: [{ id: 'lu' }], art: { scene: 'shed', layers: [{ id: 'letter' }, { id: 'baskets' }] },
    intro: [
      '陆晞把一封折得整整齐齐的信压在药罐下面，压了三天，一直没有拆。她的眼睛下面有淡淡的青，是连着几夜没睡的颜色。',
      '你终于问起，她才低声说：「我娘病了，山下的药铺断了货，要我送一副药下去。可是路上不太平，我一个人……」她的声音越来越轻，「算了，我自己想办法。」',
    ],
    choices: [
      choice('go', 'dilemma', '「我替你去。」', '你替她背着药篓下了山。山路比平日更远，更荒。你把药送到她母亲的床前时，那位老妇人拉着你的手，一遍一遍地说：「好孩子，好孩子。」回到谷里，陆晞站在药棚口，什么也没有说，只是把一包炒好的瓜子塞进你手里。',
        { fx: [setv('flag.sent_herbs'), rel('lu', 'trust', 2), rel('lu', 'warmth', 1), add('meridian', -1), add('renown.kind', 1)], echo: ['e_herbs'], values: ['ren', 'yong'] }),
      choice('money', 'strategy', '塞给她一枚灵石：「买一副好药，托人带下去。」', '陆晞盯着那枚灵石，很久没有接。「微尘，」她低声说，「我欠你的，会记着。」她终究把灵石收下了，指尖却冷得像冰。你不知道，这到底算帮忙，还是给她添了一笔账。',
        { req: GE('stone', 1), hint: '需要一枚灵石', fx: [add('stone', -1), rel('lu', 'trust', 1), rel('lu', 'esteem', 1)], echo: ['e_herbs'], values: ['li', 'ren'] }),
      choice('listen', 'expression', '没有答应什么，只是陪她坐了一会儿。', '你们并排坐在药棚的门槛上，谁也没有说话。风把干草的苦味吹过来，混着她身上淡淡的药香。过了很久，她轻声说：「谢谢你听我说完。」那一夜，她第一次没有数着水过日子。',
        { fx: [rel('lu', 'warmth', 2), rel('lu', 'trust', 1)], echo: ['e_herbs'], values: ['ren'] }),
    ],
  }),

  // ---------------- 主线 ----------------
  node('mp3_water', 'c3', 'main', '水票', {
    lock: 'functional', canon: '原创', place: 'hall', order: 10,
    cast: [{ id: 'tao' }, { id: 'qiao' }], art: { scene: 'hall', layers: [{ id: 'tickets' }, { id: 'crowd' }] },
    intro: [
      '外务堂门前排起了长队。名册一页一页地贴出来，每个人的名字后面是一个数字——今天能领几瓢水。',
      '陶岑站在堂前，笑容和气，说话慢条斯理：「大家别急，都是自己人。有急用的，可以先来我这里登记，我会酌情。」他的手边摆着一叠额外的水票，用红绳扎着。',
      '你的名字后面是三瓢。药棚病人的名字后面，是零。',
    ],
    callbacks: [
      callback('e_ledger', '你想起乔素那本薄册子上的数字，它们和眼前这叠红绳扎着的水票，严丝合缝。', F('flag.copied_ledger')),
      callback('e_spring', '你想起北边那一线细细的泉水。它很小，只够几个人。', F('flag.found_spring')),
      callback('e_scale', '坊市里那杆偏了二分的秤，让你今天对每一只水瓢都多看了一眼。'),
      callback('e_column', '你想起自己在薄册上写下的那个「药田」。药田的人，今天排在最前面，也最先发现水少了。', F('flag.col_field')),
      callback('e_column', '夜巡的月例多了一倍，可今天你才看清，这一倍里有一半是水票换的。', F('flag.col_patrol')),
      callback('e_stones', '队伍里有个杂役朝你点了点头，那个下午搬过的碎石，他还记得。', F('flag.helped_stones')),
      callback('e_column', '你签下的那个名字，此刻在木牌上显得格外清楚。', F('flag.has_license')),
    ],
    choices: [
      choice('share', 'dilemma', '把自己的三瓢水，全部分给病棚。', '你把水瓢一只一只递到陆晞手里。她不肯收，你说：「我熬得住。」那一整个夏天，你的嘴唇干裂，经脉里的气一天比一天涩。可病棚里没有人再被人抬出去。',
        { fx: [setv('flag.shared_water'), add('meridian', -1), add('cult', -1), rel('lu', 'trust', 2), rel('lu', 'warmth', 1), add('valley', 1), add('renown.kind', 2)], echo: ['e_water'], values: ['ren', 'yong'] }),
      choice('tao', 'strategy', '私下去找陶岑，用一枚灵石换一叠额外的水票。', '陶岑接过灵石，笑得很满意：「小沈懂事。」他抽出两张水票，推到你面前，顺势压低声音：「谷里有谷里的规矩，你知道的。」你拿着水票走出外务堂，每一步都觉得那两张纸比你的灵石更重。',
        { req: GE('stone', 1), hint: '需要一枚灵石', fx: [add('stone', -1), add('cult', 1), rel('tao', 'trust', 2), rel('lu', 'trust', -1), add('renown.sharp', 1), add('valley', -1)], echo: ['e_water'], values: ['li', 'jin'] }),
      choice('expose', 'dilemma', '拿出乔素的暗账抄本，当众指出水票去向对不上。', '你的声音不大，但整个外务堂都安静了。陶岑脸上的笑，慢慢一点一点收了回去。乔素站在案后，没有帮你，也没有拦你。过了很久，陶岑说：「小沈，你要想清楚，这事一旦说出口，就没有退路。」',
        { req: F('flag.copied_ledger'), hint: '需要乔素的暗账抄本', fx: [setv('flag.reported_tao'), setv('flag.exposed_tao'), rel('tao', 'trust', -3), rel('qiao', 'trust', 1), add('mark', 3), add('valley', 2), add('renown.sharp', 1)], echo: ['e_water', 'e_ledger'], values: ['yong', 'xin'] }),
      choice('spring', 'strategy', '带着几个人，去北边那一线泉水取水。', '你领着几个人悄悄绕过药田，走到那一线细流旁。大家轮流舀水，谁也没有多说一个字。回去的路上，一个老杂役拉住你的袖子，低声说：「娃，我活了六十岁，今天头一回，觉得谷里还有人。」',
        { req: F('flag.found_spring'), hint: '需要先找到暗泉', fx: [add('valley', 1), add('renown.kind', 1), rel('lu', 'warmth', 1), add('mark', 1)], echo: ['e_water', 'e_spring'], values: ['ren', 'jin'] }),
    ],
  }),

  node('mp3_sickshed', 'c3', 'main', '病棚之夜', {
    lock: 'free', canon: '原创', place: 'sick', order: 20,
    cast: [{ id: 'lu' }], art: { scene: 'sick_shed', layers: [{ id: 'lamp' }, { id: 'cots' }] },
    intro: [
      '病棚里躺着十一个人。有人发着烧，有人咳个不停，陆晞用湿布一遍一遍擦着他们的额头。你推门进去的时候，她正把最后半勺凉水喂给角落里一个孩子。',
      '她抬头看你，眼睛红得像两盏快熄的灯：「你来了。」',
      '夜很深。外面没有风，也没有星。只有水瓢碰到陶碗的轻响，一声，一声。',
    ],
    callbacks: [
      callback('e_water', '她看了你一眼：「你的水……」她没有说下去，只是把湿布递给你。', F('flag.shared_water')),
      callback('e_herbs', '她的母亲托人带来一小包炒瓜子，她把它放在你手边，没有说是什么。'),
      callback('e_lamp', '药灯的火光映在她脸上，你想起第一次见她的那个夜晚。', F('flag.lamp_helped')),
    ],
    talk: talk('lu', 3, [
      { id: 'mother', label: '问她：「你母亲的病，是怎么起的？」', reply: '「去年冬天，」陆晞说，「咳了一个月，开始以为是寒气。后来……」她停了很久，「我把所有的月例都换成了药。这不是孝顺，是害怕。我怕有一天，连换药的钱都没有了。」她笑了一下，笑得很淡，「说出来，好像轻一点。」', fx: [rel('lu', 'trust', 1), rel('lu', 'warmth', 1)] },
      { id: 'why', label: '问她：「你为什么愿意守在这里？」', reply: '「因为没有别人愿意。」她说得很平静，「我不是什么好人，只是看不得人死在我面前。你信吗？」她看了你一眼，「我自己也不太信。」', fx: [rel('lu', 'esteem', 1), rel('lu', 'trust', 1)] },
      { id: 'promise', label: '对她说：「撑过这个夏天，我陪你下山看你母亲。」', reply: '陆晞没有立刻回答。她把湿布浸进水里，拧干，叠好，放在膝头。「微尘，」她说，「别随便说这样的话。我会当真的。」她抬头，那一瞬，眼睛里有一点你没见过的光，「可是……我想当真。」', fx: [setv('flag.promised_lu'), rel('lu', 'trust', 2), rel('lu', 'intimacy', 1)], echo: ['e_promise'], req: AT('lu', 'trust', 2), hint: '再熟一些才说得出口' },
      { id: 'hand', label: '默默接过她手里的湿布，替她守一个钟头。', reply: '你接过湿布，对她说：「你去睡一会儿。」她愣了愣，没有推辞，靠着墙闭上眼睛。几乎是一瞬间，她的呼吸就均匀下来了。你守着十一个人，守着一盏快熄的灯，听着外面的夜一点一点变薄。', fx: [rel('lu', 'warmth', 2), rel('lu', 'intimacy', 1), add('renown.kind', 1)] },
    ]),
    choices: [
      choice('stay', 'expression', '留在病棚，一直到天亮。', '天亮的时候，最小的孩子烧退了。陆晞靠在你肩上睡着了，她的头发里有干草和药水的味道。你一动不敢动，直到外面传来第一声鸡叫。',
        { fx: [rel('lu', 'warmth', 1), add('cult', -1), add('meridian', -1)], values: ['ren'] }),
      choice('leave', 'strategy', '帮她把最后一批药熬好，在子夜前离开。', '你把药汁一碗一碗分好，对她说：「我明天还要上工。」陆晞点点头，没有挽留：「我知道。谢谢你来过。」你走出病棚，夜风吹在脸上，凉得像刚洗过一遍。',
        { fx: [add('cult', 1), rel('lu', 'trust', 1)], values: ['jin'] }),
    ],
  }),
];

import { node, choice, callback, ask, F, NF, ALL, ANY, AT, UPTO, IS, GE, LE, setv, add, rel, V } from '../../dsl.mjs';

export const nodes = [
  // ---------------- 支线 ----------------
  node('mp1_lamp', 'c1', 'side', '最后一盏药灯', {
    canon: '原创', place: 'shed', cast: [{ id: 'lu' }], art: { scene: 'shed', layers: [{ id: 'lamp' }, { id: 'baskets' }] },
    intro: [
      '药棚在谷西最偏的角落，一排竹架上晾着干草，苦味被夜露泡得又浓又沉。棚里只点了一盏灯，灯下一个年轻姑娘正低头剪灯芯。',
      '她把药包一个一个摞好，每个包上都用炭笔画了小小的记号：圆圈是三日量，叉是五日量，横线是不能碰的。她抬头看你，先看你的手，再看你的眼睛。',
      '「新来的？」她说，「我缺一双稳的手。可我先问一句：你明早有没有必须去的地方？我不想耽误别人。」',
    ],
    choices: [
      choice('stay', 'dilemma', '留下来，帮她把今晚的药分完。', '你们分了一整夜的药。她教你认炭笔画的记号，教你用小秤称出一钱和二钱之间看不见的差别。鸡叫的时候，她把最后一个包递给你，忽然说：「你叫什么？」「沈微尘。」「微尘，」她念了一遍，笑了笑，「好记。我是陆晞。」你出门时才发现，自己整夜没有吐纳一次。',
        { fx: [rel('lu', 'trust', 1), rel('lu', 'warmth', 1), add('renown.kind', 1), add('cult', -1), setv('flag.lamp_helped')], echo: ['e_lamp'], values: ['ren'] }),
      choice('honest', 'strategy', '如实说：「我明早要修炼，只能帮你送一趟药。」', '陆晞点点头，一点也不失望。她从篮子里挑出最轻的那一筐，放在你手上：「那就这一筐。别摔了，里面有一包很贵的。」你提着篮子走了半个山谷，没有一次回头。回来的时候，她在棚口，递了你一碗没有放糖的凉茶。',
        { fx: [add('cult', 1), rel('lu', 'esteem', 1)], values: ['jin', 'xin'] }),
      choice('oil', 'strategy', '花一枚灵石，从坊里买来一小瓶好灯油。', '你把灯油倒进灯盏。灯火一下子亮了一倍，药棚里的影子都变得清晰了。陆晞看着那团亮光，没有立刻说话。「微尘，」她过了一会儿才说，「你不必这样。」可她把灯芯剪得很小心，像是舍不得浪费它。',
        { fx: [add('stone', -1), rel('lu', 'warmth', 2), rel('lu', 'trust', 1)], values: ['ren', 'li'] }),
    ],
  }),

  node('mp1_path', 'c1', 'side', '碎石换路', {
    canon: '原创', place: 'road', cast: [{ id: 'ye' }], art: { scene: 'road', layers: [{ id: 'rockfall' }, { id: 'lantern' }] },
    intro: [
      '山路塌了一段。碎石把去外务堂的石阶盖得严严实实，几个杂役蹲在边上抽旱烟。一个背着竹篓的男人从旁边的树丛里钻出来，抖了抖袖子上的叶子。',
      '「新来的？」他笑，「我叫叶行舟。有一条私径，绕过去只要半个时辰。一枚灵石，明码标价，不讲价，也不赊账。」他看着你，「你要是舍不得，也可以在这里陪他们搬三天石头。」',
    ],
    choices: [
      choice('pay', 'strategy', '花一枚灵石，请他带路。', '你跟着他钻进树丛。他走得很快，却一直放慢脚步等你。每到岔口，他都会用脚尖在地上点一下：「记住，左边是水，右边是崖。」你一路记下了每一个岔口的样子。半个时辰以后你站在外务堂前，才发现自己身上一点灰也没有。',
        { fx: [add('stone', -1), rel('ye', 'trust', 1), rel('ye', 'esteem', 1), setv('flag.paid_route')], echo: ['e_route'], values: ['li', 'jin'] }),
      choice('haul', 'dilemma', '放下行李，和杂役一起搬石头。', '你搬了一下午的石头，手心磨出血泡。夜里点工役簿的人是个瘦削的女子，她看了你一眼，在簿子上画了一道很细的线。「沈微尘，」她念了一遍，「记下了。」你不知道，那一笔后来救了你一次。叶行舟从你身边路过，嘴角动了动，没有说话。',
        { fx: [setv('flag.helped_stones'), add('renown.kind', 1), rel('qiao', 'trust', 1), rel('ye', 'esteem', 1), add('meridian', -1)], echo: ['e_stones'], values: ['ren', 'yong'] }),
      choice('haggle', 'strategy', '笑着还价：「半枚。我带了一包茶叶，抵半枚。」', '叶行舟愣了一下，然后哈哈大笑。「第一次有人拿茶叶跟我还价，」他摇头，「成交——但仅此一次。」他把茶叶闻了闻，眼睛亮了：「这是好茶。你这个人，有意思。」他一路上话多了不少，还顺口告诉了你三件外务堂里不能得罪的人。',
        { fx: [add('renown.sharp', 1), rel('ye', 'esteem', 1), rel('ye', 'warmth', 1)], values: ['li', 'jin'] }),
    ],
  }),

  node('mp1_cushion', 'c1', 'side', '旧蒲团', {
    canon: '原创', place: 'quiet', cast: [{ id: 'han' }], art: { scene: 'quiet_room', layers: [{ id: 'cushion' }, { id: 'draft' }] },
    intro: [
      '外围的静室只有三间，轮值表上排了二十几个人。你领到的时辰是后半夜，最冷最暗的那一段。你推开门，屋里已经有人了。',
      '一个相貌平常的年轻同门，盘腿坐在门边的旧蒲团上，气息收得很细，细得像一根要断不断的线。他睁开眼，看了你一下，把蒲团往门侧让了让，没有说话。',
      '静室里位置有限。他没有邀请你闲谈，也没有拒绝你。风从门缝里钻进来，吹得墙上的灯影一晃一晃。',
    ],
    choices: [
      choice('ask', 'strategy', '压低声音，请教怎么安排轮值和吐纳的时辰。', '他听完，沉默了一会儿，才用很低的声音说了几个时辰：「寅时之前气最乱，不要强行；卯时以后可以走大周天。」他只谈可执行的东西，一个字也没有说自己的功法。说完他又闭上了眼睛。你照着那几个时辰走了一遍，发现那是你来到谷里以后最顺的一次。',
        { fx: [add('cult', 1), rel('han', 'trust', 1), setv('flag.cushion')], echo: ['e_cushion'], values: ['jin'] }),
      choice('latch', 'expression', '不问私事，先把门闩上松动的螺钉拧紧。', '你从袖子里摸出一枚小楔子，把门闩垫稳。风声小了一些，灯影也不晃了。他没有道谢，只在你坐下时，把另一个蒲团往你这边推了一寸。这份安静里没有任何人情债，你却觉得这比任何一句好话都踏实。',
        { fx: [add('meridian', 1), rel('han', 'trust', 1), setv('flag.cushion')], echo: ['e_cushion'], values: ['ren', 'jin'] }),
      choice('silent', 'strategy', '什么也不说，在对面的角落里自己调息。', '一整夜，两个人谁也没有打扰谁。天将亮的时候，你睁开眼，发现对面的蒲团已经空了，只在地上留下一点淡淡的、被压过的痕迹。你起身，把自己的蒲团也摆回原位。',
        { fx: [add('cult', 1), add('mark', -1)], values: ['jin'] }),
    ],
  }),

  // ---------------- 主线 ----------------
  node('mp1_name', 'c1', 'main', '名字写在哪一栏', {
    lock: 'functional', canon: '原创', place: 'hall', order: 10,
    cast: [{ id: 'tao' }, { id: 'qiao' }], art: { scene: 'hall', layers: [{ id: 'tags' }, { id: 'ledger_book' }] },
    intro: [
      '外务堂的门槛被许多脚磨得发白。陶岑坐在案后，圆圆的脸上挂着笑，案上摆着两块木牌，牌边用红线缠着。',
      '「小沈，」他说，「都是自己人，我给你挑两条路。药田的活稳，月例少；夜巡的月例是药田的一倍，只是半夜辛苦些。」他把两块木牌往前推了推，「你选一个，把名字写在簿子上，就算有了着落。」',
      '案边另一位女子正在翻一本很厚的账册，她头也不抬地说：「夜巡的名单里，上个月有三个人伤了。」她手里的笔没有停，「我只是念一下。」',
    ],
    callbacks: [
      callback('e_route', '陶岑瞥了你的鞋一眼：「哟，走的是私径？叶行舟的手艺，我认得。」他笑了笑，没有再问。', F('flag.paid_route')),
      callback('e_cushion', '陶岑翻到簿子最后一页，随口说：「静室那边，我听说有人把门闩修好了。是你？」', ANY(F('flag.cushion'), F('flag.lamp_helped'))),
    ],
    choices: [
      choice('field', 'strategy', '写下药田工役的名字，先熟悉谷里的规矩。', '陶岑笑着在簿子上落了笔，字迹圆润。乔素把一块木牌递过来，牌子背面有一道旧裂痕，用蜡封着。「药田的账，」她说，「写在簿子上的药龄，不一定是真的。你自己留个心眼。」她没有看你，那句话像是说给自己听的。',
        { fx: [setv('flag.col_field'), add('cult', 1), rel('qiao', 'trust', 1), rel('tao', 'trust', 1)], echo: ['e_column'], values: ['jin'] }),
      choice('patrol', 'strategy', '写下夜巡的名字，多领两枚灵石。', '陶岑的笑更深了，像是早就料到。「年轻人有胆气，」他把木牌递过来，「换岗的暗号，一会儿让人教你。」乔素的笔尖在你的名字旁边顿了一下，画了一个极小的叉。你没有问那是什么意思。',
        { fx: [setv('flag.col_patrol'), add('stone', 2), add('mark', 1), rel('tao', 'trust', 1), rel('qiao', 'trust', -1)], echo: ['e_column'], values: ['li', 'yong'] }),
      choice('license', 'strategy', '花两枚灵石，换一张外出的执照。', '陶岑接过灵石，笑得眼睛都眯成了缝，从案下抽出一张盖了印的纸。乔素抬头看了你一眼，那是你进谷以来，她第一次认真看你。「执照只保你能出谷，」她说，「谷外的事，你自己担。」',
        { req: GE('stone', 2), hint: '需要两枚灵石', fx: [add('stone', -2), setv('flag.has_license'), rel('tao', 'trust', 1), rel('qiao', 'esteem', 1)], echo: ['e_column'], values: ['jin', 'li'] }),
    ],
  }),

  node('mp1_loan', 'c1', 'main', '比月例先到的契书', {
    lock: 'functional', canon: '原创', place: 'tea', order: 20,
    cast: [{ id: 'ye' }], art: { scene: 'teahouse', layers: [{ id: 'contract' }, { id: 'lamp' }] },
    intro: [
      '谷口的茶棚只有三张桌子，一口陶壶，一个总是打瞌睡的老头。叶行舟坐在最里面的桌边，把一张折过的纸推过来。',
      '那是一张借息契：先得三分灵力，六个月后连本带息归还。纸边没有血印，落款处的担保人那一栏却空着。「别紧张，」他说，「谷里的人都这么过日子。可是我要先问你一句话。」',
    ],
    callbacks: [
      callback('e_route', '叶行舟朝你眨眨眼：「老主顾，价钱可以谈。」', F('flag.paid_route')),
    ],
    ask: ask('ye', '「借来的修为，到期拿什么还？」', [
      { id: 'clear', means: '说清楚自己的还法，不牵连别人', match: '月例|我自己|不牵连|还法|三个月|六个月|攒|按时',
        out: '叶行舟用笔尾点住担保栏：「这就对了。不牵连旁人，就得把自己的还法写清楚。」他把笔放下，难得认真地看了你一眼：「你还有时间再看一遍。」', fx: [rel('ye', 'trust', 1)] },
      { id: 'reckless', means: '不管不顾，说大不了耍赖、抢、逼别人，或者放弃核验', match: '不管|大不了|抢|逼|赖|无所谓|管他',
        out: '叶行舟的笑容淡了：「大话我听得多了。」他没有立刻同意，只是把这句话记了下来，「说出口的话，是会被人当成价码的。」', fx: [rel('ye', 'trust', -1), add('mark', 1)] },
      { id: 'evade', means: '犹豫、转移话题，或者没有明确回答', match: '想想|再说|不知道|再看看',
        out: '叶行舟靠回椅背，没有逼你：「不急。这张纸不会长腿跑掉。」他把壶往你面前推了推，「喝口茶，想清楚。」', fx: [] },
    ], 'evade'),
    choices: [
      choice('sign', 'dilemma', '签下借息契：先得三分灵力。', '你在落款处签下了自己的名字。叶行舟把纸折好，收进袖中，递过来一个小布包。你打开，里面是一颗温热的灵珠，里头有一点流动的光。你把它握在掌心，感觉体内有什么东西悄悄松开了一道缝。可你也知道，从这一刻起，有一本账上多了你的名字。',
        { fx: [setv('flag.loan'), add('cult', 2), add('mark', 1)], debt: ['d_loan'], echo: ['e_loan'], values: ['li'] }),
      choice('haggle', 'strategy', '压价：「利息按两分算，期限放到八个月。」', '叶行舟看了你很久，忽然笑了。「谁教你的？」他把契书拿回去，在上面改了两个数字，又在旁边按了一个小印，「行。你比看起来精明。」你拿到的灵力少了一点，可你的账上多了两个月的余地。',
        { req: GE('renown.sharp', 1), hint: '需要些精明的名声（路上谈过价、识过假货）', fx: [setv('flag.loan'), setv('flag.haggled'), add('cult', 1), rel('ye', 'esteem', 2)], debt: ['d_loan'], echo: ['e_haggle', 'e_loan'], values: ['li', 'jin'] }),
      choice('guarantor', 'dilemma', '在担保栏里写下陆晞的名字。', '叶行舟的笔停在半空：「她知道吗？」你没有回答。他把契书放在桌上，叹了口气：「沈兄，这事我只收钱，不管后面的事。」灵珠到了你手里，比之前沉了许多。你走出茶棚时，在门口站了很久，才发现自己的手心全是汗。',
        { fx: [setv('flag.loan'), setv('flag.lu_guarantor'), add('cult', 2), rel('ye', 'trust', -1), rel('lu', 'trust', -1)], debt: ['d_loan'], echo: ['e_loan'], values: ['li'] }),
      choice('refuse', 'dilemma', '把契书推回去：「我不借。我自己慢慢来。」', '叶行舟看着那张纸被推回来，眉毛挑了挑。「没几个人敢说这句话，」他把契书折好，「也没几个人，说完还能走得动。」他把一杯茶推过来，「这杯，算我请你。」你喝下去，茶很苦，苦得很真。',
        { fx: [rel('ye', 'trust', 1), rel('ye', 'esteem', 1), add('renown.sharp', 1)], values: ['jin', 'xin'] }),
    ],
  }),
];

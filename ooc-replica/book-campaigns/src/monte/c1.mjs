import { node, choice, callback, F, NF, ALL, ANY, AT, UPTO, IS, GE, LE, setv, add, rel, V } from '../../dsl.mjs';

export const nodes = [
  // ---------------- 支线 ----------------
  node('mc1_ledger', 'c1', 'side', '货单上的第三栏', {
    canon: '原创', place: 'counting', cast: [{ id: 'danglars' }], art: { scene: 'counting', layers: [{ id: 'ledger_open' }] },
    intro: [
      '法老号进港的第二个钟头，商行里没有人说话，只有算盘珠子的声音。唐格拉尔站在高桌前，把货单一页一页翻到第三栏，用笔尖点着你昨天抄的数目。',
      '「桶数对，单价对，」他说，「可是你把『押运员』写在了『船长』上面。诺埃尔，下一次要记得——这是商行，名字也有价格。」',
      '他笑得很客气。你知道他在等一个回答：法老号没有了船长，莫雷尔先生要在二十天内选一个人，而全商行都清楚，会计和大副，是这条船上仅有的两个人选。',
    ],
    choices: [
      choice('agree', 'strategy', '顺着他说：论资历，这条船该交给懂账的人。', '唐格拉尔把笔放下，看了你一眼，像是第一次真正注意到你。「诺埃尔老弟，」他说，「你比看起来聪明。」他随手把第三栏的错处抹掉，没有再提。',
        { fx: [rel('danglars', 'esteem', 1), rel('danglars', 'trust', 1), add('renown.shrewd', 1), setv('flag.sided_danglars')], values: ['zhi', 'li'], echo: ['e_ledger_rule'] }),
      choice('defend', 'dilemma', '替爱德蒙说话：他开船回来，一路没有出错。', '「这我知道，」唐格拉尔说，语气平得像在读一个数字，「没有人说他不会开船。」他低头把那页账翻了过去，翻得很慢。你有一瞬间觉得，自己刚刚在那栏数字旁边多记了一笔，是你自己的名字。',
        { fx: [rel('danglars', 'warmth', -1), rel('danglars', 'esteem', -1), add('renown.reliable', 1), setv('flag.praised_edmond')], echo: ['e_praised'], values: ['yi', 'cheng'] }),
      choice('numbers', 'strategy', '只问货单：哪一栏要改，什么时候交。', '唐格拉尔点了点头，似乎松了口气。「就该这样，」他说，「账里没有立场，只有进出。」他把改过的货单推还给你，你从他的手势里看出，他并不讨厌不多话的人。',
        { fx: [rel('danglars', 'trust', 1), add('renown.shrewd', 1)], values: ['zhi'] }),
    ],
  }),

  node('mc1_quay', 'c1', 'side', '缆绳尽头', {
    canon: '原创', place: 'quay', cast: [{ id: 'dantes' }], art: { scene: 'quay', layers: [{ id: 'sunset' }] },
    intro: [
      '法老号靠岸的缆绳还没有系稳，爱德蒙已经跳上了码头。他的外套袖子上有一道海盐的白痕，脸被风吹得发红，眼睛亮得像刚洗过。',
      '「诺埃尔！」他抓住你的肩膀，「船长走了，可是莫雷尔先生说……他说回来就给我一张委任状。我要去见父亲，然后去加泰兰村。后天，拉雷塞尔，你一定要来。」',
      '他说话时一直在笑，笑得连一点戒备都没有。你想起刚才账房里的那张脸，想起货单第三栏。',
    ],
    choices: [
      choice('toast', 'expression', '「我会来。到时候让我给你敬第一杯。」', '「说好了！」他用力捏了一下你的肩膀，像在画押，「第一杯给你。」他转身朝梅兰街跑去，一边跑一边回头冲你挥手，直到被人群吞掉。',
        { fx: [rel('dantes', 'warmth', 1), setv('flag.invited')], echo: ['e_toast'] }),
      choice('warn', 'dilemma', '拉住他：「爱德蒙，商行里有些人不太高兴。小心点。」', '他愣了一下，然后哈哈笑起来。「唐格拉尔？他就爱板着脸，」他拍拍你的背，「放心，诺埃尔，我这样的运气，谁也拿不走。」你想再说点什么，可他已经跑远了。',
        { fx: [rel('dantes', 'trust', 1), rel('dantes', 'esteem', 1), setv('flag.warned_edmond_early')], echo: ['e_warned'] }),
      choice('coat', 'strategy', '把你最好的外套借给他：「订婚的人，不能穿这件。」', '爱德蒙盯着你递过来的外套看了很久，鼻子有点红。「你自己明天穿什么？」他问。「我是客人，」你说，「随便穿穿。」他笑着把外套搭在臂弯里，笑得有点哑。',
        { fx: [add('money', -1), rel('dantes', 'warmth', 2)] }),
    ],
  }),

  node('mc1_nets', 'c1', 'side', '加泰兰人的网', {
    canon: '原创', place: 'catalans', cast: [{ id: 'fernand' }], art: { scene: 'catalans', layers: [{ id: 'nets' }] },
    intro: [
      '加泰兰村的屋顶挨得很近，海风吹过时，晒着的网像一排排黑色的帘子。费尔南坐在门槛上补网，指节磨得发白，针在手里转得很快。',
      '他没有抬头：「账房先生，你是来给莫雷尔先生的大副贺喜的？」他把「大副」两个字说得很轻，像是怕它被风吹走。',
      '屋里传来梅尔塞苔丝在收拾东西的声音。她在唱一首你听不懂的歌。费尔南手上的针停了停，又继续走。',
    ],
    choices: [
      choice('kind', 'expression', '坐下来，帮他理网：「活不会因为我多说一句就少一点。」', '他没有拒绝。你们沉默着理了半个钟头的网，他忽然说：「她从小就只看他一个人。」他说得很平，像是在说天气。你没有回答，他也不需要你回答。',
        { fx: [rel('fernand', 'trust', 2), setv('flag.fernand_kind')], echo: ['e_fernand'], values: ['yi'] }),
      choice('needle', 'dilemma', '说：「有些事看开了，日子会好过一些。」', '针停在半空。费尔南慢慢抬头，眼神像礁石底下的暗流。「你懂什么叫看开，」他说，「账房先生，你一辈子没有想要过什么。」他把网重新拉回膝上，再没有看你。',
        { fx: [rel('fernand', 'trust', -1), rel('fernand', 'esteem', -1), setv('flag.fernand_needled')], echo: ['e_fernand'], values: ['zhi'] }),
      choice('listen', 'strategy', '只听，不接话，顺便看看他的手。', '你看见他的指节上有新鲜的擦伤，网线里夹着一小片染了墨的纸角，被他随手塞进了腰带。你不知道那是什么，但你记住了那个动作。',
        { fx: [add('renown.shrewd', 1)], values: ['zhi'] }),
    ],
  }),

  // ---------------- 主线 ----------------
  node('mc1_arbour', 'c1', 'main', '拱棚下的左手', {
    lock: 'functional', canon: '原著第3章 · 改编', place: 'reserve', order: 10,
    cast: [{ id: 'danglars' }, { id: 'fernand' }, { id: 'caderousse' }], art: { scene: 'arbour', layers: [{ id: 'paper' }, { id: 'fernand_shadow', when: F('flag.fernand_needled') }, { id: 'escape', choice: 'seize' }] },
    intro: [
      '那天夜里，唐格拉尔带你去拉雷塞尔喝酒——他说是账目已经结清，该有个人陪他喝一杯。拱棚下点着一盏灯，灯下坐着卡德鲁斯，已经喝红了脸；费尔南坐在最暗的一角，没有碰酒。',
      '你出去透了一口气，回来时脚步很轻。拱棚的藤叶间，你看见唐格拉尔正低头写字——他握笔的是左手，字被刻意写得歪歪扭扭，像一个不识字的人在抄样子。',
      '卡德鲁斯在笑：「你疯了吧，这是要出人命的。」唐格拉尔没有抬头。他写完最后一行，把纸推到桌子中央，像推一只死去的虫子。费尔南的手伸了过来。',
      { text: '你想起了爱德蒙袖子上的那道白痕，想起他说「谁也拿不走」。', when: F('flag.warned_edmond_early') },
    ],
    callbacks: [
      callback('e_toast', '你想起码头上答应的那一杯酒，指尖忽然凉了下去。', F('flag.invited')),
    ],
    choices: [
      choice('seize', 'dilemma', '冲进去，从费尔南手里夺下那张纸。', '纸在两个人手里绷紧了，发出裂开的细响。费尔南松了手。他不是不想打，而是没想到账房里的人真的敢——你把纸塞进怀里，听见身后的唐格拉尔轻轻说：「诺埃尔老弟，你想清楚自己在做什么吗？」',
        { fx: [setv('flag.kept_draft'), setv('flag.heard_plot'), rel('danglars', 'trust', -2), rel('danglars', 'esteem', -1), rel('fernand', 'trust', -1), add('watch', 1), add('renown.reliable', 1)], debt: ['d_letter'], echo: ['e_draft'], values: ['yong', 'yi'] }),
      choice('speak', 'dilemma', '站在拱棚口，当面说破：「那是诬告。」', '灯光晃了一下。唐格拉尔把笔慢慢搁下，脸上依然是笑：「在拱棚下写一封信，算不算犯法？」卡德鲁斯垂下头，费尔南却已站起身，把纸折好塞进衣襟，擦着你的肩走了出去。你拦不住他，也没有人拦他。',
        { fx: [setv('flag.heard_plot'), setv('flag.confronted'), rel('danglars', 'warmth', -2), rel('danglars', 'esteem', 1), add('renown.reliable', 1), add('watch', 1)], echo: ['e_draft'], values: ['cheng', 'yong'] }),
      choice('run', 'strategy', '悄悄退出去，一路跑到梅兰街，告诉爱德蒙。', '你跑过了半座城。爱德蒙披着衬衫开门，听完以后沉默了一会儿，然后笑了，笑得像在安慰一个受惊的孩子。「诺埃尔，」他说，「他们不敢。我什么都没有做。」他把手放在你肩上，「谢谢你。」你听出来，他其实一个字都没有当真。',
        { fx: [setv('flag.heard_plot'), setv('flag.warned_edmond'), rel('dantes', 'trust', 1), rel('dantes', 'esteem', 1)], echo: ['e_warned'], values: ['yi', 'zhi'] }),
      choice('hide', 'dilemma', '退回藤叶后面，什么也不做。', '你蹲在暗处，看着唐格拉尔把笔放回墨水瓶，看着费尔南把纸折成四折，看着卡德鲁斯盯着空杯子发呆。没有人发现你。回家的路上你一直在想：那一晚你本可以做很多事，而你选了最安全的一件。',
        { fx: [setv('flag.silent_arbour'), setv('flag.heard_plot'), add('renown.reliable', -1), add('renown.shrewd', 1), rel('danglars', 'trust', 1)], echo: ['e_silence'], values: ['zhi'] }),
    ],
  }),

  node('mc1_feast', 'c1', 'main', '订婚宴', {
    lock: 'literal', canon: '原著第2章 · 改编', place: 'reserve', order: 20,
    on_enter: [{ when: F('flag.kept_draft'), effects: [], resolve: [['d_letter', 'transform']] }],
    cast: [{ id: 'dantes' }, { id: 'mercedes' }, { id: 'louis' }, { id: 'danglars' }, { id: 'caderousse' }, { id: 'fernand' }, { id: 'morrel', when: F('flag.invited') }],
    art: { scene: 'feast', layers: [{ id: 'lamps' }, { id: 'soldiers' }, { id: 'tilted_cup', when: F('flag.warned_edmond') }, { id: 'folded_paper', when: F('flag.kept_draft') }] },
    intro: [
      '拉雷塞尔的露台上挂满了灯。桌上摆着普罗旺斯的橄榄，烤得金黄的鱼，加泰兰村送来的深红葡萄酒。老路易穿了一件旧得发亮的外套，一整个晚上都在整理自己的领子。',
      '梅尔塞苔丝戴着一小串黑色的珠子，站在爱德蒙身边，脸上带着笑，又像在听远处什么声音。莫雷尔先生起身举杯，说：「祝我们未来的法老号船长。」满桌的人都笑了。',
      '你坐在桌尾。唐格拉尔坐在你对面，笑得最体面；费尔南靠着门柱，面前的酒一口没动。夜风吹动了灯，影子在桌面上晃了一下。',
      { text: '你怀里那页底稿还在发烫。可你很快就明白了：费尔南昨夜另抄了一份，比这页干净，早已躺在检察官的案头。纸可以被夺走，信已经寄出去了。', when: F('flag.kept_draft') },
      { text: '爱德蒙注意到你一个晚上都不怎么说话，低声问你：「你还好吗？」你看见他笑意里藏着一点不放心。', when: F('flag.warned_edmond') },
    ],
    callbacks: [
      callback('e_toast', '爱德蒙举杯朝你这边看过来：「第一杯给诺埃尔，他说好的。」满桌的人都在笑。', F('flag.invited')),
      callback('e_warned', '爱德蒙对上你的眼睛，忽然把杯子举得低了些。他不信，可他还是记着。', ANY(F('flag.warned_edmond'), F('flag.warned_edmond_early'))),
    ],
    choices: [
      choice('vouch', 'dilemma', '站出来作保：「他是我认识的最正直的人。」', '宪兵队长看了你一眼，在本子上记下了一行字。「你的名字？」他问。你报了，他点点头，没有表情。爱德蒙被带出门时回过头看你，眼里没有怨，只有震惊。「诺埃尔，」他说，「告诉我父亲……不用怕。」',
        { fx: [setv('flag.spoke_for'), add('watch', 2), add('renown.reliable', 2), rel('dantes', 'trust', 1)], echo: ['e_spoke_for'], values: ['yi', 'cheng', 'yong'] }),
      choice('note', 'strategy', '不动声色，记下宪兵的人数、领头人的名字和出门的方向。', '你的手指在桌布下数着：八个人，领头的是一个中尉，往老港方向，不是去市政厅。你把每一个数字压在舌尖，像压住一枚硬币。爱德蒙被带出门时，你没有动。梅尔塞苔丝的目光越过所有人，落在了你身上。',
        { fx: [setv('flag.noted_orders'), add('renown.shrewd', 1), rel('mercedes', 'esteem', 1)], echo: ['e_orders'], values: ['zhi'] }),
      choice('fetch', 'strategy', '趁乱溜出去，跑去叫莫雷尔先生。', '你从后门挤了出去，一路狂奔。莫雷尔先生在商行里，被你吓得站了起来：「什么？」你说完不到一半，他已经抓起帽子冲了出去。你们追到老港时，船已经走了，只剩一盏灯在水面摇。',
        { fx: [setv('flag.fetched_morrel'), rel('morrel', 'trust', 2), rel('morrel', 'warmth', 1)], echo: ['e_fetch'], values: ['zhi', 'yi'] }),
      choice('hold', 'dilemma', '扶住几乎倒下去的老路易和梅尔塞苔丝。', '老路易的身子在你臂弯里一点一点往下坠，像一根被抽走了支架的帆杆。梅尔塞苔丝紧紧抓着你的袖子，指甲陷进你的手臂，没有哭，也没有出声。她只是盯着门口，像在等一个人回来。',
        { fx: [setv('flag.held_mercedes'), rel('louis', 'warmth', 2), rel('mercedes', 'trust', 2), rel('mercedes', 'warmth', 1)], echo: ['e_hand'], values: ['yi'] }),
    ],
  }),
];

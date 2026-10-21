import { node, choice, callback, talk, ask, F, NF, ALL, ANY, AT, UPTO, IS, GE, LE, setv, add, rel, V } from '../../dsl.mjs';

export const nodes = [
  // ---------------- 支线 ----------------
  node('mc5_house', 'c5', 'side', '商行的天平', {
    canon: '原创', place: 'counting', cast: [{ id: 'morrel' }], art: { scene: 'counting', layers: [{ id: 'ledger_open' }, { id: 'empty_desks' }] },
    on_enter: [{ effects: [add('house', -2), add('money', 2)] }],
    intro: [
      '商行里空了一半的桌子。莫雷尔先生用一把旧的黄铜天平在称一些并不需要称的东西，他把砝码一枚一枚放上去，又一枚一枚拿下来。',
      '「三条船，」他说，「去年有三条。今年还有一条半。」你看见他在笑，像在讲别人家的事。',
    ],
    choices: [
      choice('invest', 'strategy', '把一部分积蓄投进商行的周转：「我信这家商行。」', '莫雷尔深深看了你一眼，把借据收进抽屉最深处。「你比我的儿子还像个商人，」他说，「也比我更像个傻子。」他笑了，是那种又暖又苦的笑。',
        { fx: [add('money', -3), add('house', 1), rel('morrel', 'trust', 2), rel('morrel', 'warmth', 1), setv('flag.lent_morrel')], echo: ['e_lent'], values: ['yi'] }),
      choice('cut', 'dilemma', '提议裁掉两个闲置的职位，保住最核心的人。', '莫雷尔沉默了很久：「他们跟了我二十年。」「可再拖下去，所有人都会一起沉。」他长长吐了口气：「你说得对。可是诺埃尔……我宁愿一起沉，也不想亲手把人推下船。」你知道这是他的原则，也知道这是他的弱点。',
        { fx: [add('house', 1), rel('morrel', 'esteem', 1), rel('morrel', 'warmth', -1), add('renown.shrewd', 1)], values: ['zhi'] }),
      choice('listen', 'expression', '陪他把砝码一枚一枚擦干净。', '你们谁也没说话。擦到最小的那一枚时，莫雷尔忽然说：「这一枚是我父亲留下的。他说，称不准的天平，比没有天平更危险。」他把它放进你手里，「你拿着。」',
        { fx: [rel('morrel', 'warmth', 2), rel('morrel', 'trust', 1)], values: ['yi'] }),
    ],
  }),

  node('mc5_dinner', 'c5', 'side', '男爵的请柬', {
    canon: '原创', place: 'counting', cast: [{ id: 'danglars' }], art: { scene: 'salon', layers: [{ id: 'chandelier' }] },
    intro: [
      '唐格拉尔回到马赛的那个星期，商行里每个人都在窃窃私语。他不再是账房的押运员，而是银行家，穿着剪裁精良的外套，说话时总带一点不动声色的从容。',
      '请柬放在你的桌上，纸张很厚，烫金的边。「老同事，」他写道，「来坐一坐。我想听听你的看法。」',
    ],
    callbacks: [
      callback('e_ledger_rule', '「还记得我教你的那句话吗？」他举杯，「账不撒谎，只有人才撒谎。」', F('flag.sided_danglars')),
      callback('e_silence', '「那天你什么都没看见，」他端着酒杯，像在谈天气，「我至今还很欣赏你的这份分寸。」', F('flag.silent_arbour')),
    ],
    choices: [
      choice('go', 'strategy', '赴宴，把场面话说得漂亮些。', '你换上最好的外套，出现在他的宴会上。他把你介绍给几个商人和一位将军，语气里带着一种你不太愿意去分析的亲切。宴会散时，一个陌生的银行家递给你名片：「听说，您是莫雷尔商行里最靠得住的人。」',
        { fx: [rel('danglars', 'esteem', 2), rel('danglars', 'trust', 1), add('renown.shrewd', 1), add('money', 1)], values: ['zhi', 'li'] }),
      choice('decline', 'dilemma', '回信推辞：「商行里的账，今晚实在放不下。」', '唐格拉尔收到回信时，笑了笑，在信纸上折了一道。后来你听说他对别人说：「那个孩子，对莫雷尔先生忠心得像条狗。」你不确定那是不是夸奖。',
        { fx: [add('renown.reliable', 1), rel('danglars', 'trust', -1), rel('morrel', 'trust', 1)], values: ['yi'] }),
      choice('observe', 'strategy', '去，但不吃不喝，只观察每一个人的手和口袋。', '你坐了一个晚上，看清了：谁在借钱，谁在放贷，谁的笑是演给谁看的。回家后你把这些在纸上画成了一张关系网。你从没觉得自己这么清醒，也从没觉得自己这么孤独。',
        { fx: [add('renown.shrewd', 2), rel('danglars', 'esteem', 1)], values: ['zhi'] }),
    ],
  }),

  // ---------------- 主线 ----------------
  node('mc5_offer', 'c5', 'main', '两张桌子', {
    lock: 'free', canon: '原创', place: 'counting', order: 10,
    cast: [{ id: 'danglars' }, { id: 'morrel' }], art: { scene: 'counting', layers: [{ id: 'two_desks' }, { id: 'gold', choice: 'follow' }] },
    intro: [
      '一八二七年的秋天，唐格拉尔在商行门口等你下班。他靠在马车边上，没有穿外套，像一个来见旧友的人。',
      '「我在巴黎有一间银行，」他说，「缺一个信得过的人，管马赛这条线。你知道我从来不乱许愿。条件是：你要把眼光放远一点。莫雷尔的天平称不动现在这个世界了。」',
      '你转头，看见商行二楼窗子里莫雷尔先生的影子，他正低头在看一本新账。他偶尔会抬头，朝窗外看一眼。',
    ],
    callbacks: [
      callback('e_praised', '「我记得你替那个人说过话，」他说得很平，「我不是记仇的人，诺埃尔老弟。我只是记性好。」', F('flag.praised_edmond')),
      callback('e_draft', '你想起那页被你压了十二年的底稿。他的眼睛在你的衣襟上扫了一眼，像一个人在确认一只他早就知道在哪里的老鼠洞。', F('flag.kept_draft')),
    ],
    choices: [
      choice('follow', 'strategy', '接受邀请，去做他的马赛代理。', '唐格拉尔笑了，伸出手：「聪明的选择。」你们握手时，他的手很干，很稳，像一把好锁。第二天，你把辞呈放在莫雷尔先生桌上。他看了很久，只说了两个字：「去吧。」他没有抬头。',
        { req: AT('danglars', 'esteem', 1), hint: '需要唐格拉尔对你至少「寻常」以上的赏识', fx: [setv('track', 'danglars'), setv('flag.took_offer'), add('money', 3), rel('danglars', 'trust', 2), rel('morrel', 'trust', -2), rel('morrel', 'warmth', -1), add('renown.shrewd', 1), add('renown.reliable', -1)], echo: ['e_ledger_rule'], values: ['li', 'zhi'] }),
      choice('stay', 'dilemma', '谢绝：「莫雷尔先生需要我。」', '唐格拉尔没有生气。他望着窗里的灯，说：「十年后你会明白，忠诚也是一种债。」他上车时，把一张名片留在你手里。「欠的账，总有一天要还。」你把名片放进口袋，没有扔。',
        { fx: [rel('morrel', 'trust', 2), rel('morrel', 'warmth', 2), add('renown.reliable', 2), rel('danglars', 'warmth', -1)], values: ['yi'] }),
      choice('both', 'strategy', '答应他的邀请，又瞒着莫雷尔留下：「我替你们两边都看着账。」', '唐格拉尔眯起眼睛，很快笑了：「有意思。你不是我想象的那种人。」他同意了，条件是你每月给他送一份「看到的东西」。从这一天起，你有了两份薪水，和一份从不对任何人说的账。',
        { req: ALL(AT('danglars', 'esteem', 2), V('renown.shrewd', '>=', 3)), hint: '需要唐格拉尔「器重」你，并且你的精明名声至少为 3', fx: [setv('flag.double_game'), setv('flag.took_offer'), add('money', 3), rel('danglars', 'trust', 1), rel('morrel', 'trust', -1), add('renown.shrewd', 2), add('watch', 1)], echo: ['e_ledger_rule'], values: ['zhi', 'li'] }),
      choice('sell', 'dilemma', '把那页底稿放在桌上：「你出多少？」', '他看着那张发黄的纸，目光里终于露出了一点你等了十二年的东西。「一万法郎，」他说得很轻，「永远别再提。」你把纸推过去。他接过来，放在手心里，像在称一只死去的蝴蝶。「聪明，」他说，「你从此是我这边的人了。」',
        { when: F('flag.kept_draft'), fx: [add('money', 5), rel('danglars', 'trust', 3), rel('danglars', 'esteem', 2), add('renown.reliable', -2), setv('flag.sold_draft')], echo: ['e_sold'], values: ['li'] }),
    ],
  }),

  node('mc5_years', 'c5', 'main', '二月二十四日', {
    lock: 'free', canon: '原创', place: 'meilhan', order: 20,
    cast: [], art: { scene: 'quay', layers: [{ id: 'calendar' }, { id: 'sunset' }] },
    intro: [
      '每年的二月，马赛都有一个日子，只有你自己知道它的分量：二十四日，法老号入港的那一天。十三年来，没有人再提起这个名字。',
      { text: '你在莫雷尔先生的商行里熬成了老账房，眼角有了纹路，头发有了灰。', when: IS('track', 'morrel') },
      { text: '你在唐格拉尔的银行里学会了新的语言：折现，信用，对冲。你的口音里已经混进了一点巴黎的腔调。', when: IS('track', 'danglars') },
      '这一天傍晚，你站在老港边，看着对面空着的泊位。夕阳把水面照成一条长长的金线。',
    ],
    callbacks: [
      callback('e_louis_word', '你想起老路易最后的那句话，它一直压在你心里，像一块没有落地的石头。', F('flag.louis_word')),
      callback('e_face', '你想起走廊里那一声「检察官先生」，和他回过头来那一瞬极淡极淡的笑。你再没有见过他，却一直觉得，他的目光落在你的背上。', F('flag.faced_villefort')),
      callback('e_wedding', '你想起那座小教堂里的风琴声，想起她经过你身边时的脚步。那天之后，她就再没有出现在马赛的街头。', ANY(F('flag.attended_wedding'), F('flag.told_mercedes'))),
      callback('e_mercedes', '你想起梅尔塞苔丝在海堤上说的话。她后来随费尔南去了巴黎，没有再回来。', F('flag.mercedes_wait')),
    ],
    choices: [
      choice('grave', 'expression', '带一束花去墓地，在老路易的墓前站一会儿。', '墓石上刻着他的名字，已经被雨水磨浅。你把花放下，对着空气说了几句话——关于船，关于港口，关于一个还没有回来的人。回来的路上你发现，你说得很平静，像在做一次例行的汇报。',
        { fx: [setv('flag.kept_year_ritual'), add('renown.reliable', 1), rel('louis', 'warmth', 1)], echo: ['e_year'], values: ['yi'] }),
      choice('quay', 'expression', '站在码头，一直站到天黑。', '潮水一进一退，把泊位前的木桩洗得发白。你在心里数着十三年里的每一个二月，数到一半就放弃了。有一个年轻水手经过，好奇地看了你一眼：「先生，您在等谁？」你说：「一条旧船。」',
        { fx: [add('renown.reliable', 1), rel('morrel', 'warmth', 1)], echo: ['e_year'], values: ['yi'] }),
      choice('let_go', 'dilemma', '像过一个普通的日子：核账，吃饭，睡觉。', '这是你给自己的一个决定：往前看。你做完了所有的账，吃了晚饭，睡得很沉。第二天醒来，你发现自己几乎想不起昨天是什么日子。你有一点害怕，也有一点轻松。',
        { fx: [add('renown.shrewd', 1), add('money', 1)], values: ['zhi'] }),
    ],
  }),
];

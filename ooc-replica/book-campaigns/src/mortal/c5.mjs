import { node, choice, callback, talk, ask, F, NF, ALL, ANY, AT, UPTO, IS, GE, LE, setv, add, rel, V } from '../../dsl.mjs';

export const nodes = [
  // ---------------- 支线 ----------------
  node('mp5_receipt', 'c5', 'side', '被撕掉的一页', {
    canon: '原创', place: 'hall', cast: [{ id: 'qiao' }], art: { scene: 'hall', layers: [{ id: 'ledger_book' }, { id: 'torn_page' }] },
    intro: [
      '试炼结束后，外务堂的月例册被人换过了一册。新册子的纸更白，墨更黑，唯独少了夏天那一页——写着药田用水配额的那一页。',
      '乔素在整理旧册，把一摞发黄的纸条夹进新册里。你注意到，她的手指在一处空白停了很久，像是在摸一个看不见的伤口。',
      '「有人把它撕了，」她轻声说，没有看你，「撕得很干净。」',
    ],
    callbacks: [callback('e_ledger', '你想起自己抄下的那份副本，它忽然变得很重，像一块还没有凉透的炭。', F('flag.copied_ledger'))],
    choices: [
      choice('hand', 'dilemma', '把自己的副本交给她，说：「我一直替你留着。」', '乔素接过那几张纸，指尖微微发抖。她没有说谢谢，只是把它们夹进册子里，合上，抱在怀里。「你知道吗，」她说，「这是我第一次，觉得自己不是一个人在写这些东西。」',
        { req: F('flag.copied_ledger'), hint: '需要先抄下乔素的暗账', fx: [rel('qiao', 'trust', 2), rel('qiao', 'warmth', 1), add('mark', 1)], echo: ['e_receipt'], values: ['xin', 'yong'] }),
      choice('quiet', 'expression', '什么也不说，帮她把旧册一页一页整理好。', '你们一直整理到天黑。乔素把最后一张纸条夹好，才低声说：「谢谢。我不需要你说什么，只是不想一个人面对它。」那天夜里，你回到住处，发现门缝里被人塞进了一张很小的字条，上面只有四个字：「有人在看。」',
        { fx: [rel('qiao', 'warmth', 1), rel('qiao', 'trust', 1), add('mark', 1)], echo: ['e_receipt'], values: ['jin', 'ren'] }),
      choice('ask', 'strategy', '问她：「是谁撕的？你有没有怀疑的人？」', '乔素沉默了很久。「我怀疑三个人，」她说，「一个是陶岑，一个是魏冲，还有一个，是我自己。」你不明白最后一句话是什么意思。她没有解释，只是把册子合上了。',
        { fx: [rel('qiao', 'esteem', 1), add('renown.sharp', 1)], echo: ['e_receipt'], values: ['xin'] }),
    ],
  }),

  node('mp5_brother', 'c5', 'side', '魏冲的弟弟', {
    canon: '原创', place: 'sick', cast: [{ id: 'wei' }, { id: 'lu' }], art: { scene: 'sick_shed', layers: [{ id: 'cots' }, { id: 'bowl' }] },
    intro: [
      '病棚最里面的床上，躺着一个十五六岁的少年，脸烧得通红。陆晞正在给他灌药，药汁顺着嘴角流出来，她用手帕一点一点擦净。',
      '少年的床边站着一个人，肩宽，下巴方，手臂上有一道蛇一样的旧疤。魏冲看见你，没有说话，也没有动，只是站在那里，像一堵忽然失去了方向的墙。',
      '「他是我弟弟，」陆晞低声告诉你，「已经三天了，药不够。」',
    ],
    callbacks: [callback('e_wei', '魏冲的目光落在你身上，他显然记得你们山路上的那次相遇。', ANY(F('flag.paid_wei'), F('flag.defied_wei')))],
    choices: [
      choice('bowl', 'dilemma', '把自己的药碗递给陆晞，让她先给少年用。', '陆晞接过药碗，没有道谢，只是把药汁一勺一勺喂进去。魏冲站在旁边，一动不动，攥紧的拳头慢慢松开了。他什么也没说，但你看见他的肩膀轻轻颤了一下。',
        { fx: [add('meridian', -1), rel('wei', 'trust', 2), rel('wei', 'esteem', 1), rel('lu', 'warmth', 1), add('renown.kind', 1)], echo: ['e_brother'], values: ['ren'] }),
      choice('watch', 'expression', '默默退到一旁，不打扰他们。', '你退到门边，看着陆晞灌药，看着魏冲的影子在墙上一动不动。过了很久，少年的烧退了一点，魏冲才缓缓转身，经过你的时候低声说：「你什么都没有看见。」你点点头。',
        { fx: [rel('wei', 'trust', 1), add('mark', -1)], echo: ['e_brother'], values: ['jin'] }),
      choice('leverage', 'strategy', '记在心里：魏冲也有软肋。', '你没有说话，只是把那一幕记了下来。你很清楚，这件事在某一天，也许可以用来换一些东西。走出病棚的时候，陆晞轻轻叫了你一声：「微尘。」你回头，她看着你，什么也没有说。那一眼，你想了很多天。',
        { fx: [rel('wei', 'esteem', 1), rel('lu', 'trust', -1), add('renown.sharp', 1)], echo: ['e_brother'], values: ['li'] }),
    ],
  }),

  // ---------------- 主线 ----------------
  node('mp5_collect', 'c5', 'main', '到期的账', {
    lock: 'functional', canon: '原创', place: 'tea', order: 10,
    cast: [{ id: 'wei' }, { id: 'ye' }], art: { scene: 'teahouse', layers: [{ id: 'contract' }, { id: 'shadow_men' }] },
    intro: [
      '谷口茶棚的陶壶翻了，茶水洒了一桌。魏冲坐在你对面，手里拿着一张折得整整齐齐的纸，纸角已经磨毛了。',
      '「到期了，」他说，「一个字都不必多说。你知道这是什么。」他的声音很稳，一点杀气也没有，却比杀气更让人喘不过气来。',
      '叶行舟远远站在门边，没有靠近，也没有离开。',
    ],
    callbacks: [
      callback('e_wei', '魏冲把你当初在山路上说过的话，原样复述了一遍，一个字也没有差。'),
      callback('e_loan', '那张借息契摊在桌上，你的名字，像一只很小很小的虫子，趴在纸上。', F('flag.loan')),
      callback('e_haggle', '你想起当初压低利息的那几句话，现在它们都成了账上的数字。', F('flag.haggled')),
      callback('e_loan', '担保栏里那个名字还在。陆晞没有出现，可你觉得她的目光，比魏冲的更让你难受。', F('flag.lu_guarantor')),
      callback('e_ledger', '你想起乔素那本薄册子。里面有一页，记着魏冲背后那个人的名字。', F('flag.copied_ledger')),
    ],
    choices: [
      choice('pay', 'strategy', '付清本息，把借息契收回来。', '你把灵石一枚一枚数出去，魏冲接过，数了一遍，抽出那张契书，推到你面前：「干净了。」你握着那张纸，掌心一阵发凉。它不再是债，只是一张废纸。可你的钱袋，几乎空了。',
        { when: F('flag.loan'), req: GE('stone', 3), hint: '需要三枚灵石', fx: [add('stone', -3), setv('flag.paid_loan'), rel('wei', 'esteem', 1), add('mark', -1)], resolve: [['d_loan', 'cancel']], values: ['xin', 'jin'] }),
      choice('stall', 'strategy', '求他宽限一个月，把利息先付一半。', '魏冲看了你很久，慢慢点头：「一个月。」他把契书折好，收进袖子里，站起来，走出了茶棚。你知道，他不会忘，也不会忍太久。月底的钟声，你听得比任何时候都清楚。',
        { when: F('flag.loan'), req: GE('stone', 1), hint: '至少付一枚灵石', fx: [add('stone', -1), setv('flag.stalled_loan'), add('mark', 1)], resolve: [['d_loan', 'reroute']], values: ['jin'] }),
      choice('expose', 'dilemma', '把乔素的暗账抄本放在桌上：「魏师兄，这张契书，背后是谁？」', '魏冲的脸一点一点冷了下来。他没有拿那张纸，只是看着你，目光像两根钉子。「你以为，」他慢慢说，「这样就能赢？」他起身，在门口停了一下，「我们走着瞧。」你知道，从这一刻起，你已经站在了一个更大的局里。',
        { when: F('flag.loan'), req: F('flag.copied_ledger'), hint: '需要乔素的暗账抄本', fx: [setv('flag.exposed_tao'), rel('wei', 'trust', -2), rel('qiao', 'trust', 1), add('mark', 3), add('renown.sharp', 2)], resolve: [['d_loan', 'transform']], echo: ['e_ledger'], values: ['yong', 'xin'] }),
      choice('ask_ye', 'dilemma', '回头看叶行舟，请他出面作保。', '叶行舟叹了一口气，走过来，在魏冲对面坐下，把手按在契书上：「这份账，我认。」魏冲眯起眼：「你的？」「算我的。」叶行舟笑了笑，「但他得跟着我，把这笔账一点点还。」你看着他，忽然明白，这世上最贵的东西，从来不是灵石。',
        { when: F('flag.loan'), req: AT('ye', 'trust', 2), hint: '叶行舟还不够信你', fx: [setv('flag.left_with_ye'), rel('ye', 'trust', 1), add('mark', 1)], resolve: [['d_loan', 'transform']], values: ['xin', 'li'] }),
      choice('work', 'dilemma', '拿不出灵石：「我替你做工，一天抵一天。」', '魏冲盯着你，像在掂一件没有标价的东西。「做工，」他慢慢说，「我这里，只有两种活。一种累，一种脏。」他没有说是哪一种。接下来的一个月，你替他抄账、扛货、守夜，经脉里的气一天比一天薄，可那张契书，终于在月底被他当着你的面撕成了两半。',
        { when: F('flag.loan'), fx: [add('meridian', -2), add('cult', -1), add('mark', 1), rel('wei', 'esteem', 1)], resolve: [['d_loan', 'cancel']], values: ['yong', 'xin'] }),
      choice('clean', 'expression', '你没有借过：「魏师兄，你认错人了。」', '魏冲看了你一眼，把契书重新折起来。「看来，」他说，「是我认错了。」他没有笑，也没有纠缠，起身走了。你知道，没有借过的人，反倒是最容易被惦记的。',
        { when: NF('flag.loan'), fx: [rel('wei', 'esteem', 1), add('renown.sharp', 1)], values: ['xin'] }),
    ],
  }),

  node('mp5_list', 'c5', 'main', '名册副本', {
    lock: 'functional', canon: '原创', place: 'hall', order: 20,
    cast: [{ id: 'qiao' }, { id: 'tao' }], art: { scene: 'hall', layers: [{ id: 'ledger_book' }, { id: 'brazier' }] },
    intro: [
      '夜深以后，外务堂的灯只留了一盏。乔素把一个油纸包推到你面前，里面是一份名册副本：谷里所有外门弟子的名字、住处、欠款、亲人所在。',
      '「兽潮的消息，」她说，声音很轻，「三天之内会传开。到那时，谁的名字在册子上，谁的就先被点名。陶岑今晚来问过它。」',
      '她把火盆往你这边推了推，火星在铜盆里一跳一跳。',
    ],
    callbacks: [
      callback('e_age', '你想起那批药龄不对的灵草，想起自己当时的那句话——或者那句没说的话。'),
      callback('e_receipt', '那份撕掉的一页，还留在你心里，像一个很小很小的伤口。', F('flag.copied_ledger')),
      callback('e_brother', '你想起魏冲弟弟那张烧得通红的脸。名册上，他的名字排在第七行。', AT('wei', 'trust', 1)),
    ],
    choices: [
      choice('burn', 'dilemma', '把名册副本扔进火盆。', '纸页卷曲，边缘变黑，名字一个一个化成灰。乔素没有阻止，也没有说话。火光里，你看见她的睫毛颤了一下。「这样，」她轻声说，「他们就没有凭据了。可也没有人，会知道谁是谁。」',
        { fx: [setv('flag.burned_list'), rel('qiao', 'trust', 1), add('valley', 1), add('mark', 1)], echo: ['e_list'], values: ['ren', 'yong'] }),
      choice('sell', 'strategy', '把名册副本，悄悄卖给陶岑。', '陶岑接过名册，翻了两页，笑得像一朵开败的花。「小沈，」他说，「你很懂事。」他数出两枚灵石递给你。你收下，指尖冷得像冰。你知道，这一页纸，将来会换走很多人的前程。',
        { fx: [setv('flag.sold_list'), add('stone', 2), rel('tao', 'trust', 2), rel('qiao', 'trust', -2), add('valley', -2), add('mark', 1)], echo: ['e_list'], values: ['li'] }),
      choice('keep', 'dilemma', '替乔素守住它：「我替你收着，直到有人该用它。」', '乔素看着你，很久很久，慢慢点头。「谢谢，」她说，「如果有一天我不在了，你知道它该交给谁。」你把油纸包塞进衣襟里，贴着胸口，像揣着一块冰，也像揣着一团火。',
        { fx: [setv('flag.kept_list'), rel('qiao', 'trust', 2), rel('qiao', 'warmth', 1), add('mark', 1)], echo: ['e_list'], values: ['xin', 'jin'] }),
    ],
  }),
];

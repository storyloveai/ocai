import { node, choice, callback, F, NF, ALL, ANY, AT, UPTO, IS, GE, LE, setv, add, rel, V } from '../../dsl.mjs';

export const nodes = [
  // ---------------- 支线 ----------------
  node('mc3_flags', 'c3', 'side', '换旗的港口', {
    canon: '原创', place: 'quay', art: { scene: 'quay', layers: [{ id: 'tricolor' }] }, cast: [],
    intro: [
      '三月的第二个礼拜，老港的桅杆上一夜之间换了颜色。白底的百合花旗被人扯下来，在石阶上被踩成灰；红白蓝的三色旗一面接一面升上去。咖啡馆里吵得要掀屋顶：有人喊皇帝万岁，有人低声说这不过是回光返照。',
      '你夹着一卷货单经过，被人群推到了咖啡馆门口。一个醉醺醺的水手揪住一个穿黑外套的商人，两个人眼看就要动手。',
    ],
    choices: [
      choice('part', 'dilemma', '挤进去把两个人拉开：「港口上不许动刀。」', '你被谁的肘子顶了一下肋骨，疼得吸气。可他们真的松了手。穿黑外套的商人整了整领子，看了你很久：「你是莫雷尔商行的？」他点点头，「那是个讲理的地方。」',
        { fx: [add('renown.reliable', 1), add('watch', 1), rel('morrel', 'esteem', 1)], values: ['yong', 'yi'] }),
      choice('listen', 'strategy', '靠着门柱听：谁在传什么，谁在怕什么。', '你在门口站了一个钟头，把城里的情绪拆成了几条线：谁家的船在国王的名下，谁的合同押给了皇帝。回商行的路上你已经能背出一份「若变天了该先保什么」的清单。莫雷尔先生后来用了其中两条。',
        { fx: [add('renown.shrewd', 1), rel('morrel', 'trust', 1)], values: ['zhi'] }),
      choice('sell', 'strategy', '买下三份报纸，转手卖给商行里想知道行情的人。', '一个小时里你赚了一点小钱，也让几个船东记住了你的脸。可也有人不高兴：「他怎么总能先拿到消息？」你想起莫雷尔先生的话——在这座城里，太快知道一件事，本身就是一件需要解释的事。',
        { fx: [add('money', 1), add('watch', 1), add('renown.shrewd', 1)], values: ['li'] }),
    ],
  }),

  node('mc3_copyist', 'c3', 'side', '抄手的登记簿', {
    canon: '原创', place: 'prefecture', art: { scene: 'registry', layers: [{ id: 'ledger_page', choice: 'copy' }] }, cast: [],
    intro: [
      '省府后院的抄写间里坐着十几个人，每人面前一摞纸，笔尖都在沙沙地响。你有一个老同乡在这里做抄手，欠你一顿酒。',
      '你找到他时，他正抄着一份关于船舶税的公告。你说你想看看一份逮捕登记。他的笔停了，目光在你脸上转了一圈。「你问的是国事犯？」他压低声音，「那种册子，我们不碰。可是……」他看了看四周。「你请得起两顿酒，我可以让你看一眼。」',
    ],
    choices: [
      choice('copy', 'dilemma', '付钱，让他翻开那一页，你默记并抄下来。', '你看见了：唐泰斯，爱德蒙，法老号大副。拿破仑党人的密使。批注是一行极短的字，墨色比别处深得多——「如无特别命令，一律单独关押，严禁与外界联系。」下面是维尔福的签名。那行字像一道封条，把一个活人封进了纸里。你把整页默写在袖口的衬里上。',
        { fx: [add('money', -1), setv('flag.knows_file'), add('watch', 1), add('renown.shrewd', 1)], echo: ['e_file'], values: ['zhi'] }),
      choice('walk', 'dilemma', '摇头：「我只是来问问规矩。」', '同乡松了口气，很快低下头继续抄。你站在窗边，看见院子里的石榴树落了一地的叶。你没有带走任何东西，却一整天都觉得自己错过了什么。',
        { fx: [add('renown.reliable', 1)], values: ['zhi'] }),
      choice('ask', 'strategy', '不看册子，只问他：那一行的批注，字是几个人写的？', '同乡眨眨眼，想了想：「同一个人。同一支笔。」他笑着，笑得有点怕，「你问对了问题。可我什么也没说过。」你向他道了谢，把剩下的酒钱留在桌上。',
        { fx: [add('money', -1), add('renown.shrewd', 1), rel('villefort', 'esteem', 1)], values: ['zhi'] }),
    ],
  }),

  // ---------------- 主线 ----------------
  node('mc3_petition', 'c3', 'main', '请愿书', {
    lock: 'functional', canon: '原著第9章 · 改编', place: 'prefecture', order: 10,
    cast: [{ id: 'morrel' }], art: { scene: 'registry', layers: [{ id: 'petition' }, { id: 'tricolor_banner' }] },
    intro: [
      '三月的最后一个礼拜，莫雷尔先生写好了请愿书，让你誊清三份。新衙门里换了一批人，他们记得「旧政府的受害者」这个词，并且乐于听见它。',
      '「这是个机会，」莫雷尔说，他的声音里有一种许久没有过的光，「可我不知道措辞该怎么写。写得太冷，他们不看；写得太热……」他笑了笑，「我一辈子没写过一封奉承的信。」',
      '你坐在高桌前，把羽毛笔蘸满墨水。第一行你已经想好了，可是第二行不知道该落在哪里。',
    ],
    callbacks: [callback('e_cert', '莫雷尔把你那份品行证明的副本夹在请愿书里，用手抚平了折痕。「这一份，总该有人看。」', F('flag.certificate')), callback('e_orders', '你想起那个中尉的名字和那条往老港的路。他经手过这个案子，也许他还记得。', F('flag.noted_orders'))],
    choices: [
      choice('plain', 'dilemma', '只写事实：时间、地点、证人，不添一句颂词。', '你一字一句把那晚的事写成了账：婚宴，八个人，一个中尉，没有逮捕令，没有罪名。莫雷尔看完后沉默了很久，说：「这样写，他们也许不爱看。」顿了顿，「可至少，每个字我都不怕被人念出来。」',
        { fx: [setv('flag.wrote_plain'), add('renown.reliable', 2), rel('morrel', 'esteem', 1)], echo: ['e_petition'], values: ['cheng'] }),
      choice('flatter', 'strategy', '在第一段加上对「新政府」的赞词，再说爱德蒙「一向忠于皇帝」。', '你很清楚这几句话会让它被翻开。莫雷尔读完，皱了很久的眉：「我不喜欢这几句。」他看着你，「可你是对的——先让人读，再让人信。」他用颤抖的手签了名。那一行字，像一枚还没拔出来的钉子，留在了纸里。',
        { fx: [setv('flag.flattered_petition'), add('renown.shrewd', 2), add('watch', 1)], echo: ['e_petition'], values: ['zhi', 'li'] }),
      choice('officer', 'dilemma', '写上中尉的姓名和那晚的押解路线，让他们去查。', '你把那晚记下的每一个数字都写了进去。莫雷尔读完，眼睛亮了一下：「这是证据，」他说，「是一条能追下去的线。」你没有告诉他，这样写，那个中尉就知道有人在盯着他了。',
        { when: F('flag.noted_orders'), fx: [setv('flag.named_officer'), add('renown.shrewd', 1), add('watch', 1), rel('morrel', 'trust', 1)], echo: ['e_petition'], values: ['zhi'] }),
      choice('clerk', 'strategy', '誊清之后，自己掏钱请一位书记官把它放在最上面。', '你把两枚金路易压在一摞公文的下面。书记官低头看了一眼，咳嗽一声：「可以。」那页纸那天晚上真的被放到了最上面。你不确定自己是买了一次机会，还是买了一次羞辱。',
        { fx: [add('money', -2), setv('flag.petition_pushed'), add('watch', 1), rel('morrel', 'warmth', 1)], echo: ['e_petition'], values: ['li'] }),
    ],
  }),

  node('mc3_july', 'c3', 'main', '七月的卷宗', {
    lock: 'literal', canon: '原著第9–10章 · 改编', place: 'palais', order: 20,
    cast: [{ id: 'villefort' }, { id: 'morrel' }], art: { scene: 'office', layers: [{ id: 'fire' }, { id: 'white_flag' }] },
    on_enter: [{ effects: [add('house', -1)] }],
    intro: [
      '六月的消息一夜之间传遍了马赛：皇帝在一个叫滑铁卢的地方输了。七月，国王回来了，旧衙门里的白底旗重新升起。昨天穿三色徽章的人，今天把徽章缝进了衣服里。',
      '那份请愿书在新衙门里转了三个桌子，最后落到了一张你认识的桌子上——维尔福的。他已经不是副检察官，而是复辟后的国王检察官，勋章别在左胸，身边是他新订婚的、圣梅朗侯爵的女儿的画像。',
      { text: '莫雷尔在你身边极轻地说了一句：「他烧了那封信，对吗？」你点头。那是你们两个人之间的秘密，现在它压在你们肩上，像一块石头。', when: F('flag.told_morrel') },
      '「莫雷尔先生，」维尔福说，语气像是在谈一桩已经过去的小事，「您的这位朋友，已经转交给更合适的机关处理了。您不会再收到任何消息。这是为他好。」',
    ],
    callbacks: [
      callback('e_petition', '维尔福把请愿书翻开了一页，手指停在你写的那一段上：「措辞很讲究，是谁的手笔？」', ANY(F('flag.wrote_plain'), F('flag.flattered_petition'), F('flag.named_officer'), F('flag.petition_pushed'))),
      callback('e_pale', '他的目光在你脸上多停了一秒，那一秒里，有一种你在门缝里见过的、极快被压回去的惊惶。', F('flag.saw_pale')),
    ],
    choices: [
      choice('face', 'dilemma', '等莫雷尔先走，在走廊里叫住他：「检察官先生，我见过那封信。」', '维尔福停下脚步，转过头，温和地问：「什么信？」他一点也不惊慌，只是把声音压得很低：「年轻人，你有前程，不要把它放在这种事上。」他离开前补了一句：「我记得你。」你知道，那不是客气话。',
        { when: F('flag.saw_pale'), fx: [setv('flag.faced_villefort'), add('watch', 3), rel('villefort', 'esteem', 2), rel('villefort', 'trust', -1), add('renown.reliable', 1)], echo: ['e_face'], values: ['yong', 'cheng'] }),
      choice('bow', 'strategy', '随莫雷尔退出去，一个字也不多说。', '你跟在莫雷尔身后，穿过那条铺着黑白石砖的长廊。他没有回头，一直走到法院门口才停下来：「诺埃尔，我老了，不会再来了。」他说得极轻，像对着风说。你想说什么，可没有一个字能撑得住。',
        { fx: [add('renown.shrewd', 1), rel('morrel', 'trust', 1)], values: ['zhi'] }),
      choice('file', 'dilemma', '把默记的登记页递给莫雷尔，让他知道这是一份被封的案。', '莫雷尔看完，抬起头：「你是怎么弄到的？」你说了，他沉默地把纸折好放进怀里。「这个我不能用，」他低声说，「用了，你、我、抄手，三个人都要进去。」可他把纸还给你的时候，用手指在你掌心按了一下：「留着。总有一天，会有人用得上。」',
        { when: F('flag.knows_file'), fx: [rel('morrel', 'trust', 2), rel('morrel', 'esteem', 1), add('renown.shrewd', 1)], values: ['cheng', 'zhi'] }),
    ],
  }),
];

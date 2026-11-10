"""第二章《摩天轮下》"""
from lib import *

BG = {"shop_day": T("林记修复 · 晚上", "Lin's Repairs · evening"), "park_gate": T("星期日乐园 · 大门", "Sunday Park · the gate"),
      "ferris": T("摩天轮下", "Under the Ferris wheel"), "lighthouse": T("北岸旧灯塔顶", "Top of the old north lighthouse")}
CG = {"cg_f_approach": T("走进旧游乐园", "Into the old park"), "cg_f_bench": T("长椅与断剑", "The bench and the Sword"), "cg_f_summon": T("赫拉显形", "Hera appears"), "cg_f_rails": T("重接栏杆", "Rejoining the rails"), "cg_lighthouse": T("灯塔上的人", "Watchers on the lighthouse"), "cg_restore": T("白光接住车厢", "White light catches the cars"), "cg_cut": T("断剑斩向摩天轮", "The Sword cuts the wheel"), "cg_wheel": T("自己转起来的摩天轮", "The wheel that turned on its own")}
FLAGS = [("flag.scouted", "提前看过摩天轮的结构", "Read the Ferris wheel's structure in advance"), ("flag.album", "翻过父亲的旧相册", "Went through Dad's old albums"),
         ("flag.know_cut", "读过灯塔上的那一夜（知道葛兰要砍摩天轮）", "Read the lighthouse night (knew Gran would cut the wheel)"),
         ("flag.gran_plan", "读过葛兰在摩天轮下的盘算", "Read Gran's plan under the wheel"),
         ("flag.hub_only", "只修中心轴，没用全力", "Mended only the hub, not all out"), ("flag.blocked_cut", "在他砍之前挡在轮轴前", "Stood before the hub before he could cut"),
         ("flag.wheel_full", "全力修好了整座摩天轮", "Mended the whole wheel all out"),
         ("flag.dead_wheel", "坏结局：星期", "Bad end: Sunday")]

C2_SHOP = scene("c2_shop", "c2", "main", T("林记修复 · 第二天 21:15", "Lin's Repairs · day two, 21:15"), [
    bg("shop_day"),
    *iff(FORGOT("ride"),
        nar("我花了一整天，想想起那个下午。照片上的院子里，竹椅旁边，又是一片空白。", "I spent the whole day trying to remember that afternoon. In the photo of the yard, beside the bamboo chair, another blank."),
        think("扶车座的人是谁？我连这个都不知道了。", "Who held the seat? I don't even know that any more.")),
    *iff(REMEMBERS("ride"),
        think("昨晚我什么都没交出去。可提灯说，下一次不会这么好运。", "Last night I gave nothing up. But the Lamp says I won't be this lucky next time.")),
    show("lamp", "normal", "center"),
    say("lamp", "你知道我为什么只拿温暖的记忆吗？因为温暖的最重。只有最重的东西，才换得来最强的力量。", "Do you know why I only take warm memories? Because warm ones weigh the most. Only the heaviest buys the strongest power."),
    say("lamp", "离十二点还有三个小时。", "Three hours until midnight."),
], [
    choice("scout", "strategy", T("先去游乐园看场地", "Go to the park early and look at the ground"), [
        bg("park_gate"),
        cg("cg_f_approach"),
        nar("锈死的过山车，倒在地上的碰碰车，停摆的旋转木马，还有正中间那座巨大的摩天轮。", "A rusted coaster, overturned bumper cars, a stalled carousel, and in the middle, a huge Ferris wheel."),
        nar("我用指尖碰了碰它的底座。四十八个车厢，三百八十四根辐条，几千颗螺栓——全都连在中间那根轴上。", "I touch its base with a fingertip. Forty-eight cars, three hundred and eighty-four spokes, thousands of bolts—all tied to the hub at the center."),
        cgoff(),
        think("修东西之前，先看结构。有人这么教过我。", "Before you fix anything, read the structure. Someone taught me that."),
        say("lamp", "这个习惯不错。", "Good habit.", face="smile"),
    ], [setv("flag.scouted"), add("light", 1)], values=["xiu"]),
    choice("album", "expression", T("在铺子里翻父亲的旧相册", "Stay and go through Dad's old albums"), [
        nar("塑料封皮一翻就掉渣。梧桐树，竹椅，搭在椅背上的毛巾。没有自行车，也没有扶车座的人。", "The plastic covers crumble. A plane tree, a bamboo chair, a towel over its back. No bicycle, no one holding a seat."),
        say("lamp", "别看了。你只要记住：那个人，在你最需要的时候，帮了你。", "Stop looking. Just remember: that person helped you when you needed it most.", face="sad"),
    ], [setv("flag.album"), rel("lamp", "warmth", 1)], values=["ji"]),
], order=1, cast=["lamp"])

S2_LIGHT = scene("s2_light", "c2", "side", T("北岸旧灯塔顶（伊芙琳）", "Top of the old lighthouse (Evelyn)"), [
    bg("lighthouse"),
    cg("cg_lighthouse"),
    nar("一公里外，伊芙琳放下了望远镜。", "A kilometer away, Evelyn lowers her binoculars."),
    say("evelyn", "她在等。她接得比他砍得快，只要不停地接，他就永远砍不到她。", "She's waiting. She mends faster than he cuts; as long as she keeps mending, he never lands a blow."),
    say("evelyn", "所以葛兰会换个砍法。他要砍摩天轮。", "So Gran will change what he cuts. He'll cut the Ferris wheel."),
    say("evelyn", "几十个车厢，几千颗螺栓，全靠中间那根轴连着。断剑一刀斩开所有的连结——除非她全力出手，否则修不过来。", "Dozens of cars, thousands of bolts, all held by the hub. One stroke severs every link—she can't mend it unless she goes all out."),
    cgoff(),
    show("evelyn", "serious", "center"),
    nar("诗人在空白的书上写了一个红色的字。", "The poet writes one red word on the blank page."),
], [choice("ok", "expression", T("（合上这一页）", "(Close this page)"), [], [setv("flag.know_cut"), setv("flag.know_evelyn")], values=["ji"])], salience=2, cast=["evelyn"])

S2_GRAN = scene("s2_gran", "c2", "side", T("摩天轮下（葛兰）", "Under the wheel (Gran)"), [
    bg("ferris"),
    show("gran", "normal", "center"),
    nar("葛兰坐在生锈的长椅上，旁边两瓶啤酒，一瓶开着，一瓶没开。", "Gran sits on a rusted bench, two beers beside him, one open, one not."),
    say("sword", "那小姑娘能把断的东西接回去。我砍一刀，她接一刀。", "That girl joins whatever's cut. I cut, she joins."),
    say("gran", "那就砍她接不过来的东西。", "Then cut something she can't join in time."),
    think("他不想要她的命。他想看那盏灯的底牌。", "He doesn't want her life. He wants to see the lamp's last card."),
], [choice("ok", "expression", T("（合上这一页）", "(Close this page)"), [], [setv("flag.gran_plan"), rel("gran", "esteem", 1)], values=["ji"])], salience=1, cast=["gran"])

C2_DUEL = scene("c2_duel", "c2", "main", T("北岸 · 摩天轮下 23:40", "North shore · under the wheel, 23:40"), [
    bg("ferris"),
    cg("cg_f_bench"),
    say("gran", "来早了。还有十八分钟。喝吗？", "You're early. Eighteen minutes. Beer?"),
    me("打完再说。", "After."),
    say("gran", "也是。不管谁赢。", "Fair. Whoever wins."),
    *iff(F("flag.talked_down"), say("gran", "昨晚那句话，我想了一整天。今天还是要打。", "I thought about what you said all day. We still fight.", face="serious")),
    cg("cg_f_summon"),
    say("sword", "在呢。", "Here.", face="battle"),
    nar("他动了。块头大，却快得像一辆没开灯的货车。断剑横扫，铁栏杆一节一节散开——不是被切断，是“连结”没了。", "He moves. Big, but fast as an unlit truck. The Sword sweeps; the railings come apart—not cut, their connections simply gone."),
    cg("cg_f_rails"),
    nar("我蹲下去，手按在地上。断开的栏杆往回长。", "I crouch, palm to the ground. The severed railings grow back."),
    say("sword", "她接得比昨天还快。", "She's joining faster than yesterday."),
    cgoff(),
    show("gran", "battle", "left"),
    show("sword", "battle", "right"),
    nar("葛兰的目光越过我，落在我身后那座摩天轮上。", "Gran's eyes go past me, to the Ferris wheel at my back."),
], [
    choice("block", "strategy", T("抢先一步，挡在摩天轮的中心轴前面", "Get there first and stand in front of the hub"), [
        nar("我比他先到。我背靠着那根轴，把灯举在胸前。", "I get there first. Back to the hub, lamp at my chest."),
        me("你要砍它，就先砍我。可你不想要我的命，对吧？", "If you cut it, you cut me first. And you don't want my life, do you?"),
        say("gran", "……你知道我要砍什么。", "…You knew what I'd cut.", face="surprised"),
        say("sword", "哈。被看穿两次了，葛兰。", "Ha. Seen through twice now, Gran.", face="smile"),
        nar("剑尖停在我胸前三寸。他收了手。", "The point stops three inches from my chest. He pulls back."),
    ], [setv("flag.blocked_cut"), rel("gran", "esteem", 2), rel("gran", "trust", 1), add("light", 1)], values=["yong"], when=F("flag.know_cut")),
    choice("hold", "strategy", T("守住，等他露出破绽", "Hold, and wait for an opening"), [
        nar("我一直接，一直退。他一直砍。然后他转过身，朝摩天轮冲过去。", "I keep joining, keep backing away. He keeps cutting. Then he turns and charges the wheel."),
    ], [add("light", 1)], values=["shou"]),
], order=2, cast=["gran", "sword", "lamp"])

C2_WHEEL = scene("c2_wheel", "c2", "main", T("摩天轮下 · 断剑——斩", "Under the wheel · Sword—cut"), [
    bg("ferris"),
    *iff(NF("flag.blocked_cut"),
        cg("cg_cut"),
        say("gran", "断剑——", "Sword—", face="battle"),
        say("sword", "——斩！", "—cut!"),
        nar("没有声音。那一刀从上往下划过空气，摩天轮上几千个连结同时松开了。", "No sound. One stroke through the air, and thousands of links on the wheel let go at once."),
        nar("四十八个车厢在半空中晃了一下，然后一起往下掉。几十吨的钢铁，朝我头顶砸下来。", "Forty-eight cars sway in midair, then fall together. Tons of steel, straight at my head."),
        say("lamp", "你修不过来。除非你全力出手。", "You can't mend that in time. Not unless you go all out.", face="battle"),
        cgoff()),
    *iff(F("flag.blocked_cut"),
        nar("葛兰没有砍摩天轮。可他退开的时候，断剑擦过了底座——一根主辐条断了，整座轮子歪了一下。", "Gran never cuts the wheel. But as he pulls back, the Sword grazes the base—a main spoke snaps and the whole wheel lurches."),
        say("lamp", "只断了一根。你不用全力。", "Only one. You don't need to go all out.", face="normal")),
], [
    choice("full", "dilemma", T("“全部……修好！”——全力（会交出一段记忆）", "'Mend—all of it!'—all out (costs a memory)"), [
        cg("cg_restore"),
        nar("灯火炸开，像一个太阳。四千六百个断口在光里一颗一颗地亮起来，又熄灭。下坠的车厢停在了半空。", "The light bursts like a sun. Four thousand six hundred breaks light up one by one, then go dark. The falling cars stop in midair."),
        nar("那种被抽走的感觉，比昨天更重。台灯下拆开的闹钟。它重新走起来的时候，一只带着机油味的大手揉了揉我的头。“栖栖，你的手真巧。”", "The feeling of being emptied, heavier than yesterday. An alarm clock in pieces under a desk lamp. When it ticks again, a big hand smelling of machine oil ruffles my hair. 'Qiqi, your hands are so clever.'"),
        nar("那天晚上是什么时候？父亲说了什么来着？", "When was that night? What did Dad say?"),
        lamp_takes("第二段。第一次被父亲夸手巧的晚上。我收下了。", "The second. The night your father first praised your hands. I'll keep it."),
        cg("cg_wheel"),
        nar("然后，摩天轮开始转了。没有电，它就那样自己慢慢地转了起来。", "Then the wheel starts to turn. No power at all; it simply turns, slowly, on its own."),
        nar("那一下的光，整个北岸都看见了。海湾对面的渔船上，有人举起了手机。", "The whole north shore saw that flash. On a fishing boat across the bay, someone raised a phone."),
    ], [*forget("praise"), add("light", 1), add("notice", 2), setv("flag.wheel_full"), rel("gran", "esteem", 1)], values=["yong"], when=NF("flag.blocked_cut")),
    choice("hub", "strategy", T("只修中心轴——它是所有连结的根", "Mend only the hub—it is the root of every link"), [
        nar("我想起下午碰过的那根轴。所有的辐条、所有的车厢，都是从它那里伸出去的。", "I remember the hub I touched this afternoon. Every spoke, every car, reaches out from there."),
        me("不用修四千六百个。修一个就够了。", "I don't need to mend four thousand six hundred. Just one."),
        nar("白光只亮了一瞬，落在轴心上。轴想起了自己，辐条就想起了轴，车厢就想起了辐条。一个接一个，像一排倒回去的骨牌。", "The light flashes once, onto the hub. The hub remembers itself; the spokes remember the hub; the cars remember the spokes. One by one, like dominoes falling backward."),
        say("lamp", "……你没用全力。我什么都没拿。", "…You didn't go all out. I took nothing.", face="surprised"),
        cg("cg_wheel"),
        nar("摩天轮慢慢地转了起来。", "The wheel begins, slowly, to turn."),
    ], [setv("flag.hub_only"), add("light", 1), add("notice", 1), rel("lamp", "esteem", 1), rel("gran", "esteem", 2)], values=["xiu"], when=ANY(F("flag.scouted"), F("flag.blocked_cut"))),
    choice("dive", "strategy", T("扑进旁边的排水沟里躲开", "Dive into the drainage ditch"), [
        nar("我扑了出去。车厢砸下来的声音，像一整座城一起塌了。", "I throw myself aside. The cars crash down like a whole city collapsing."),
        nar("等我爬起来，腰上的灯不见了。葛兰站在废墟上，手里提着它。", "When I climb out, the lamp is gone from my belt. Gran stands on the wreckage, holding it."),
    ], [setv("flag.dead_wheel")], values=["shou"], ends=True, when=NF("flag.blocked_cut")),
], order=3, cast=["gran", "sword", "lamp"])

C2_AFTER = scene("c2_after", "c2", "main", T("摩天轮下 · 打完以后", "Under the wheel · afterward"), [
    bg("ferris"),
    show("gran", "normal", "left"),
    nar("葛兰仰着头，看了那座转着的摩天轮很久。", "Gran looks up at the turning wheel for a long time."),
    say("sword", "……她修好了。", "…She mended it."),
    say("gran", "嗯。", "Yeah."),
    say("gran", "我小时候来过这里。那时候它还亮着。", "I came here as a kid. It still lit up then.", face="sad"),
    *iff(FORGOT("praise"), think("我看着它转，心里空了一块。我不知道那一块原来放着什么。", "I watch it turn, and something in me is hollow. I don't know what used to be there.")),
], [
    choice("beer", "expression", T("接过那瓶没开的啤酒", "Take the unopened beer"), [
        say("gran", "说好了，打完再喝。", "Like we said. After."),
        nar("我们坐在长椅上，谁都没说话，看摩天轮转了一圈又一圈。", "We sit on the bench, saying nothing, watching it go round and round."),
        say("gran", "下回打架，叫上我。", "Next time there's a fight, call me."),
    ], [rel("gran", "trust", 2), rel("gran", "warmth", 1)], values=["xin"]),
    choice("ask", "expression", T("“你要遗器，是为了断剑吧？”", "'You want the relics for the Sword, don't you?'"), [
        say("gran", "……你读过我的那一夜。", "…You've read my night.", face="surprised"),
        say("gran", "她陪了我十年。她想要的东西，只有王冠给得了。", "She's been with me ten years. What she wants, only the Crown can give."),
        say("sword", "葛兰，别说了。", "Gran, that's enough.", face="sad"),
    ], [rel("gran", "trust", 3)], values=["ji"], when=F("flag.know_gran")),
    choice("leave", "expression", T("什么也不说，转身回家", "Say nothing and go home"), [
        nar("我走的时候，听见身后啤酒瓶盖被撬开的声音。", "As I leave, I hear a bottle cap pop behind me."),
    ], [], values=["shou"]),
], order=4, cast=["gran", "sword"])

CHAPTERS = [{"id": "c2", "title": T("第二章 · 摩天轮下", "Chapter 2 · Under the Ferris Wheel"), "intro": [P(T("第二夜。北岸，旧海滨游乐园。", "Night two. The north shore, the old seaside park."))],
             "offer": 2}]
NODES = [C2_SHOP, S2_LIGHT, S2_GRAN, C2_DUEL, C2_WHEEL, C2_AFTER]
DEAD = [
  {"id": "wheel", "flag": "flag.dead_wheel", "title": T("坏结局「星期」", "Bad End: Sunday"),
   "text": T("星期日乐园的招牌上，“日”字三十年前就掉了。那一夜以后，摩天轮底下又多了一堆废铁。你没有灯了。",
             "The 'Sunday' sign lost its last letters thirty years ago. After that night there's one more heap of scrap under the wheel. You no longer have a lamp."),
   "clinic": T("戴圆框眼镜的医生：“躲开没有用，那是几十吨的钢。要么全力，要么找到所有连结的根。下午去看过场地吗？”",
               "The doctor in round glasses: 'Dodging won't work; that's tons of steel. Go all out, or find the root of every link. Did you look at the ground that afternoon?'")},
]

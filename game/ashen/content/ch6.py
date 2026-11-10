"""第六章《地铁隧道》（小说第五章结尾、第六章）"""
from lib import *

BG = {"ward": T("中心医院 · 急诊观察室", "Central Hospital · observation ward"), "metro": T("〇号线废弃隧道", "Line Zero, the abandoned tunnel"),
      "train": T("停在隧道里的列车", "A train stopped in the tunnel")}
CG = {"cg_cradle": T("摇篮开口了", "The Cradle speaks"), "cg_t_ambush": T("双胞胎", "The twins"), "cg_t_stopped": T("〇号线", "Line Zero"),
      "cg_t_frozen": T("停住的车厢", "The frozen car"), "cg_t_beam": T("镜子里的白光", "White light from the mirror"),
      "cg_t_intercept": T("断剑斩光", "The Sword cuts the beam"), "cg_t_slow": T("蜂蜜一样的时间", "Time like honey"),
      "cg_t_reconnect": T("接上", "Rejoined"), "cg_t_blades": T("原版和复制品", "Original and copy"), "cg_t_rescue": T("让他睡", "Let him sleep"),
      "cg_t_watch": T("钟和弟弟", "The clock and the younger brother")}
FLAGS = [("flag.know_cradle", "读过急诊科那一夜", "Read the night in the emergency ward"), ("flag.know_twins", "读过雷恩兄弟", "Read the Rhine brothers"),
         ("flag.know_pride", "读过伊芙琳在北区屋顶", "Read Evelyn on the north-side rooftop"),
         ("flag.told_su", "把母亲的事告诉了苏蔓", "Told Su Man about Mum"), ("flag.mended_time", "修好了被拉长的时间", "Mended stretched time"),
         ("flag.tunnel_full", "隧道里全力出手", "Went all out in the tunnel"), ("flag.ben_leg", "全力保住了本的腿", "Saved Ben's leg, all out"),
         ("flag.su_cradle", "苏蔓用了摇篮", "Su Man used the Cradle"), ("flag.c6_done", "第六章走完", "Finished Chapter 6"),
         ("flag.dead_tunnel", "坏结局：〇号线", "Bad end: Line Zero")]

S6_CRADLE = scene("s6_cradle", "c6", "side", T("中心医院急诊科 · 凌晨 00:40（苏蔓）", "Central Hospital, emergency · 00:40 (Su Man)"), [
    bg("ward"),
    show("suman", "sad", "left"),
    nar("苏蔓这周上了六个夜班。消毒水的味道浓得能把鼻子腌透，她早就闻不出来了。", "Su Man has worked six night shifts this week. The disinfectant could pickle a nose; she stopped smelling it long ago."),
    nar("守秘局送来一个短头发的年轻女人，满身蓝色油漆，手里死死攥着一盏黄铜提灯，护士怎么掰都掰不开。", "The Bureau brings in a short-haired young woman covered in blue paint, a brass lamp clenched in her hand so tight the nurses can't pry it loose."),
    nar("三个月前，苏蔓在医院地下室捡到了一只木头摇篮。从那以后，一个戴面纱的女人跟着她，一言不发。", "Three months ago Su Man found a wooden cradle in the hospital basement. Since then a veiled woman has followed her, silent."),
    cg("cg_cradle"),
    show("cradle", "normal", "right"),
    say("cradle", "让她睡吧。她太累了。她已经失去了太多。只要你愿意，我可以让她一直睡下去，直到所有人都忘了她。", "Let her sleep. She's so tired. She has lost too much already. If you wish it, I can let her sleep until everyone forgets her."),
    say("suman", "不。我是医生。我的病人，要醒过来。痛不痛，要不要继续打，是她醒过来以后自己决定的。", "No. I'm a doctor. My patient wakes up. Whether it hurts, whether she keeps fighting—that's hers to decide when she's awake.", face="serious"),
    cgoff(),
    nar("她看着那盏灯。“小时候，我外婆家的阁楼上，挂过一盏一模一样的。”", "She looks at the lamp. 'When I was little, there was one exactly like it hanging in my grandmother's attic.'"),
], [choice("ok", "expression", T("（合上这一页）", "(Close this page)"), [], [setv("flag.know_cradle"), rel("suman", "esteem", 1)], values=["ji"])], salience=2, cast=["suman", "cradle"])

S6_TWINS = scene("s6_twins", "c6", "side", T("〇号线废弃隧道 · 21:00（雷恩兄弟）", "Line Zero tunnel · 21:00 (the Rhine brothers)"), [
    bg("metro"),
    cg("cg_t_ambush"),
    nar("雷恩兄弟出生的时候只隔了四分钟。十八岁那年他们黑进了银行，被抓了。哥哥亚当替弟弟扛下所有罪名，坐了三年牢。", "The Rhine brothers were born four minutes apart. At eighteen they hacked a bank and were caught. Adam, the elder, took the whole blame and served three years."),
    nar("出狱那天以后，亚当再没摘下过那副耳机，本再没摘下过那个口罩。", "Since the day he got out, Adam has never taken off his headphones, and Ben has never taken off his mask."),
    cgoff(),
    show("adam", "normal", "left"), show("ben", "normal", "right"),
    say("adam", "镜子照过她的修复术。修复的反面，就是拆解。只是威力只有原版的一半。", "The mirror caught her mending. The flip side of mending is unmaking. At half the strength of the original."),
    say("ben", "哥，我们为什么要打她？她手里只有一件。", "Why her, though? She's only got one."),
    say("adam", "因为打伊芙琳会死。打她，不会。", "Because fighting Evelyn gets us killed. Fighting her won't."),
    cg("cg_t_watch"),
    nar("本摸了摸脖子上的铜怀表。钟拿走的，是时间的顺序。他有时候分不清，哥哥是先坐牢，还是先出狱。", "Ben touches the brass pocket watch at his throat. The Clock takes the order of time. Some days he can't tell whether his brother went to prison first or came out first."),
    nar("他想要的那条规则，从来没告诉过亚当：他想让自己，可以不再是亚当的弟弟。", "The rule he wants, he has never told Adam: to no longer have to be Adam's little brother."),
    cgoff(),
], [choice("ok", "expression", T("（合上这一页）", "(Close this page)"), [], [setv("flag.know_twins"), rel("ben", "warmth", 1)], values=["ji"])], salience=1, cast=["adam", "ben"])

S6_KITE = scene("s6_kite", "c6", "side", T("北区 · 老公寓屋顶 23:40（伊芙琳）", "North side · an old rooftop, 23:40 (Evelyn)"), [
    bg("eiche_top"),
    show("evelyn", "serious", "left"),
    nar("战斗只持续了两分钟。“风筝的线，断。”一根细得像丝的荆棘，缠住了器灵和主人之间那根看不见的线。", "The fight lasts two minutes. 'Kite string. Break.' A thorn fine as silk catches the invisible line between spirit and holder."),
    show("kite", "normal", "right"),
    say("kite", "你要飞吗？", "Do you want to fly?"),
    say("evelyn", "不。我要赢。", "No. I want to win."),
    nar("少女握住了她戴着手套的手指。那种被抽走的感觉又来了，比刚才重一点。", "The girl takes her gloved fingers. The emptying comes again, heavier than before."),
    say("evelyn", "诗人。我刚才……是不是忘了什么？", "Poet. Did I just… forget something?", face="sad"),
    nar("她记得十八岁那年的考核，一百年来的最高分，所有考官都站起来看着她。可那种站在考场门口、胸口发烫的感觉——没有了。", "She remembers the exam at eighteen, the highest score in a century, every examiner on his feet. But that burning feeling at the door of the hall—gone."),
    nar("她手里握着三件遗器。她是这场仗里第一个手握三件的人。可她一点都不觉得骄傲。", "She holds three relics. The first in this war to hold three. And she feels no pride at all."),
], [choice("ok", "expression", T("（合上这一页）", "(Close this page)"), [], [setv("flag.know_pride"), rel("evelyn", "warmth", 1)], values=["ji"])], salience=1, cast=["evelyn", "kite"])

C6_WARD = scene("c6_ward", "c6", "main", T("中心医院 · 早晨 06:20", "Central Hospital · 06:20"), [
    bg("ward"),
    show("suman", "normal", "center"),
    *iff(F("flag.c5_hurt"), nar("我是被疼醒的。肚子，肋骨，头，手——手指僵得像木头，因为攥了一整夜的灯。", "Pain wakes me. Stomach, ribs, head, hands—my fingers stiff as wood from clutching the lamp all night.")),
    *iff(NF("flag.c5_hurt"), nar("我在走廊的长椅上坐了一夜。卡罗在里面缝针。天亮的时候，一个穿白大褂的女人在我旁边坐下了。", "I sit all night on a bench in the corridor while Carlo gets stitched. At dawn a woman in a white coat sits down beside me.")),
    say("suman", "我叫苏蔓，急诊科的医生。你的灯在睡觉。它自己在修。", "I'm Su Man, an emergency doctor. Your lamp is asleep. It's mending itself."),
    me("你怎么知道？", "How do you know?"),
    nar("她往旁边让了让。在她身后，站着一个戴面纱的女人。", "She shifts aside. Behind her stands a veiled woman."),
    show("cradle", "normal", "right"),
    say("suman", "我不想赢，也不想改写任何规则。我想阻止王冠被打开。六十年前有人改了一条规则，从那以后，每隔几年就会有人从世界上消失。不是死，是消失。", "I don't want to win or rewrite anything. I want to stop the Crown opening. Someone changed a rule sixty years ago, and since then, every few years, someone vanishes from the world. Not dies. Vanishes.", face="serious"),
], [
    choice("tell", "dilemma", T("“她叫林遥。十一年前，她消失了。只有我还记得。”", "'Her name is Lin Yao. She vanished eleven years ago. Only I remember.'"), [
        say("suman", "你昏迷的时候一直在叫妈妈。可你的病历上，母亲那一栏写的是“信息缺失”。", "You kept calling for your mum while you were out. But on your chart, the mother field says 'information missing'.", face="sad"),
        say("suman", "我外婆阁楼上有一盏和你这个一模一样的灯。她擦了四十年，却说不出那是谁的。", "My grandmother's attic had a lamp just like yours. She polished it for forty years and could never say whose it was."),
        say("suman", "我的电话。下次你再被人打成这样，直接打给我，别等守秘局。他们太慢了。", "My number. Next time someone does this to you, call me directly. The Bureau is too slow.", face="smile"),
    ], [setv("flag.told_su"), rel("suman", "trust", 2), rel("suman", "warmth", 1)], values=["xin"]),
    choice("keep", "strategy", T("“谢谢你治我。别的，我还不能说。”", "'Thank you for treating me. The rest I can't say yet.'"), [
        say("suman", "随你。你需要休息至少两周。但我猜你不会听我的。", "Suit yourself. You need two weeks' rest at least. But I doubt you'll listen."),
    ], [rel("suman", "esteem", 1)], values=["shou"]),
], order=1, cast=["suman", "cradle"])

C6_TRAIN = scene("c6_train", "c6", "main", T("〇号线隧道 · 21:24", "Line Zero tunnel · 21:24"), [
    bg("train"),
    say("suman", "对了。你出院以后，最好别坐地铁。昨晚有人入侵了地铁的调度系统，是一对双胞胎干的。", "One more thing. After you leave, don't take the metro. Someone broke into the metro dispatch last night. A pair of twins.", face="serious"),
    hide("suman"),
    cg("cg_t_stopped"),
    nar("列车在隧道里突然停下了。窗外的墙太旧了，水泥上长满青苔，墙上是褪色的标识：〇号线。", "The train stops dead in the tunnel. The walls outside are too old, moss on the concrete, a faded sign: Line Zero."),
    cg("cg_t_frozen"),
    nar("所有的门同时打开。车厢里的人一个接一个地停住了，像被按了暂停键的录像。只有我还能动。", "Every door opens at once. One by one the passengers stop, like a paused recording. Only I can move."),
    say("ben", "时间减速，一百倍。普通人感觉不到。", "Time slowed a hundredfold. Ordinary people won't notice."),
    say("adam", "林栖小姐。我们是雷恩兄弟。我们要你的灯。", "Miss Lin. We're the Rhine brothers. We want your lamp."),
    cg("cg_t_beam"),
    nar("镜面上白光一闪——是我自己在摩天轮下的修复术。光照在车厢壁上，钢板变回了铁锭，玻璃变回了沙子。", "White light flashes on the mirror—my own mending from under the wheel. It hits the car wall: steel back to ingots, glass back to sand."),
    say("adam", "修复的反面，就是拆解。你自己不知道吧？包括人。", "The flip side of mending is unmaking. Didn't know that, did you? People included."),
    cg("cg_t_intercept"),
    nar("那道光对准我胸口的瞬间，一道冷白色的刃从隧道深处劈过来，把它斩成了两截。", "As the beam swings to my chest, a cold white blade cuts in from deeper in the tunnel and severs it in two."),
    cgoff(),
    show("gran", "battle", "center"),
    say("gran", "闭嘴，躲好。你现在这个样子，一碰就碎。", "Shut up and get behind me. In your state, one touch and you'll shatter."),
    say("gran", "我是来抢灯的。我要从她手里抢，不是从你们手里。", "I'm here for the lamp. I'll take it from her—not from you."),
    cg("cg_t_slow"),
    say("ben", "哥，我减速他。", "I'll slow him."),
    nar("葛兰像掉进了一池子蜂蜜。镜子里，冷白色的光一闪——断剑斩摩天轮的那一刀，也被照下来了。", "Gran is suddenly wading through honey. In the mirror, a cold white flash—the stroke that cut the wheel, copied too."),
    say("adam", "斩断连结。你自己的能力，尝尝看。", "Severing. Have a taste of your own power."),
    cgoff(),
], [
    choice("time", "strategy", T("手按在葛兰背上——修好被拉长的时间", "Hand on Gran's back—mend the stretched time"), [
        think("镜子复制的修复术，是我修摩天轮的那一次。我修过东西，从来没有修过时间。镜子也没照过。", "The mending the mirror copied was the wheel. I've mended things, never time. The mirror has never seen that."),
        think("被拉长的时间像一根拉坏的弹簧。每一个点都想弹回去，都想起它原本的长度。", "Stretched time is like an overstretched spring. Every point wants to snap back, remembers its true length."),
        cg("cg_t_reconnect"),
        me("接上。", "Rejoin."),
        nar("时间弹了回去。葛兰的手臂一轻，断剑像一道闪电劈了出去。", "Time springs back. Gran's arm goes light; the Sword flies out like lightning."),
        cg("cg_t_blades"),
        nar("原版和复制品撞在一起。复制品碎了。亚当被震得撞在墙上，镜子从手里脱出去，在地上滑出好远。", "Original meets copy. The copy shatters. Adam slams into the wall; the mirror skids away across the ground."),
        say("lamp", "……你没用全力。你修好了一样它没见过的东西。", "…You didn't go all out. You mended something it had never seen.", face="surprised"),
        cgoff(),
    ], [setv("flag.mended_time"), add("light", 1), rel("gran", "trust", 2), rel("gran", "esteem", 1), rel("lamp", "esteem", 1)], values=["xiu"],
       when=ANY(F("flag.know_twins"), V("light", ">=", 2))),
    choice("full", "dilemma", T("全力，把镜子里的光整个修回去（会交出一段记忆）", "All out—mend every copied light back into the mirror (costs a memory)"), [
        nar("灯火从我的掌心里涌出来，把整条隧道照成了白天。镜子里所有的光，被一道一道地按了回去。", "Light floods out of my palm and turns the tunnel to day. Every light in the mirror is pressed back in, one after another."),
        nar("那种被抽走的感觉。很咸的番茄蛋汤，每次都咸，她自己从来不觉得。是什么味道来着？", "The emptying. Too-salty tomato-and-egg soup, salty every time, and she never noticed. What did it taste like?"),
        lamp_takes("第四段。那碗很咸的汤。我收下了。", "The fourth. That too-salty soup. I'll keep it."),
        cg("cg_t_blades"),
        nar("葛兰的刃劈出去，复制品碎了。镜子从亚当手里飞出去，在地上滑出好远。", "Gran's blade lands; the copy shatters. The mirror flies from Adam's hand and skids across the ground."),
        cgoff(),
    ], [*forget("soup"), setv("flag.tunnel_full"), add("light", 1), rel("gran", "esteem", 1), rel("lamp", "trust", -1)], values=["yong"]),
    choice("run", "strategy", T("趁葛兰拖住他们，从另一头跑出去", "While Gran holds them, run out the other end"), [
        nar("我跑进了黑暗里。身后，冷白色的刃落下来——是镜子里的那一刀。", "I run into the dark. Behind me the cold white blade falls—the copy from the mirror."),
        nar("这一次，没有人站在我前面。", "This time no one stands in front of me."),
    ], [setv("flag.dead_tunnel")], values=["shou"], ends=True),
], order=2, cast=["gran", "adam", "ben", "lamp"])

C6_BEN = scene("c6_ben", "c6", "main", T("〇号线隧道 · 21:31", "Line Zero tunnel · 21:31"), [
    bg("metro"),
    say("ben", "哥！", "Adam!"),
    nar("本扑过去，举起怀表——他不是要攻击，他是要把哥哥周围的时间停下来，伤就不会恶化。可那面镜子掉在地上，镜面朝上，正对着他。", "Ben lunges, raising the watch—not to attack. To stop time around his brother, so the wound won't worsen. But the mirror lies face up on the ground, right in his path."),
    nar("镜子里还残留着一道光。最后一道：我的拆解。", "One light is left in the mirror. The last: my unmaking."),
    nar("他的左腿，从膝盖往下，开始像沙子一样往下掉。", "His left leg, from the knee down, begins to fall away like sand."),
    show("adam", "sad", "left"), show("ben", "sad", "right"),
    say("adam", "本——！", "Ben—!"),
    nar("我扑过去，手按在他膝盖上。太快了。那是我自己的力量，失去了控制。我修好一寸，它就拆掉两寸。", "I throw myself down, hands on his knee. Too fast. My own power, out of control. For every inch I mend it unmakes two."),
    say("lamp", "林栖，你要是全力出手，我会拿走很重的东西。也许是她。", "Lin, if you go all out, I'll take something heavy. Maybe her.", face="sad"),
    say("ben", "哥……对不起……", "Adam… sorry…"),
], [
    choice("take", "dilemma", T("“……提灯。拿吧。”（会交出关于妈妈的一段记忆）", "'…Lamp. Take it.' (costs a memory of Mum)"), [
        think("洗得发白的蓝外套，袖口的补丁。我想，如果我忘了，那个本子还在。如果我不出手，这个人会失去一条腿。", "The washed-out blue coat, the patch on the cuff. If I forget, the notebook will still be there. If I don't do this, he loses a leg."),
        nar("灯火灌进他的腿里。拆解停住了，然后往回长：骨，肉，皮。", "The light pours into his leg. The unmaking stops, then grows back: bone, flesh, skin."),
        nar("我的手在一个冬天里。有人把它揣进一只口袋，口袋是暖的。是谁的口袋？", "My hand is in a winter. Someone tucks it into a pocket, and the pocket is warm. Whose pocket?"),
        lamp_takes("第五段。妈妈的蓝外套。……对不起，林栖。我收下了。", "The fifth. Mum's blue coat. …I'm sorry, Lin. I'll keep it."),
        *iff(F("flag.told_su"), show("suman", "serious", "center"), say("suman", "……我来晚了。你已经做了。", "…I'm too late. You've already done it.", face="sad")),
    ], [*forget("coat"), setv("flag.ben_leg"), rel("adam", "trust", 3), rel("ben", "trust", 3), rel("lamp", "warmth", -1), add("notice", 1)], values=["xiu"]),
    choice("su", "strategy", T("给苏蔓打电话——摇篮能让伤口睡着", "Call Su Man—the Cradle can put a wound to sleep"), [
        nar("我拨了那个号码。她接得很快，像一直醒着。", "I dial the number. She answers fast, as if she'd been awake all along."),
        cg("cg_t_rescue"),
        show("suman", "serious", "center"),
        say("suman", "别动。交给我。摇篮，让他睡。", "Don't move. Leave it to me. Cradle, let him sleep."),
        nar("一种很温柔的感觉，像一首很久以前听过的摇篮曲。拆解停住了——不是被修好，是睡着了。", "Something very gentle, like a lullaby heard long ago. The unmaking stops—not mended. Asleep."),
        say("suman", "我本来下个月要去南边的海岛晒太阳，订好了机票。现在我想不起来，我为什么想去了。", "I was going south next month to lie in the sun on an island. Tickets booked. Now I can't remember why I wanted to go.", face="sad"),
        say("cradle", "对未来的期待。我收下了。", "Her hope for what's ahead. I have taken it."),
        cgoff(),
    ], [setv("flag.su_cradle"), rel("suman", "trust", 2), rel("adam", "trust", 2), rel("ben", "trust", 1)], values=["xin"], when=ANY(F("flag.told_su"), F("flag.know_cradle"))),
    choice("hold", "expression", T("按住他的腿，能修多少修多少，不交出去", "Hold his leg and mend what I can—without giving anything up"), [
        nar("我修了一寸，又一寸。拆解停在大腿根的时候，我也停了，因为我已经没有力气了。", "I mend an inch, then another. When the unmaking stops at his thigh, so do I. I have nothing left."),
        say("adam", "……谢谢。", "…Thank you.", face="sad"),
        nar("他背起弟弟，走进了隧道的黑暗里。本的左腿，从大腿往下，空空荡荡。", "He hoists his brother on his back and walks into the dark. Below the thigh, Ben's left leg is gone."),
    ], [add("light", -1), rel("adam", "trust", 1), rel("ben", "trust", 1)], values=["shou"]),
], order=3, cast=["adam", "ben", "lamp"])

C6_AFTER = scene("c6_after", "c6", "main", T("〇号线隧道 · 打完以后", "Line Zero tunnel · afterward"), [
    bg("metro"),
    nar("列车里，时间重新开始流动。车门关上了，列车缓缓开走，朝着有光的地方。隧道里只剩下我和葛兰。", "In the train, time flows again. The doors close and it pulls away slowly, toward the light. Only Gran and I are left in the tunnel."),
    show("gran", "normal", "center"),
    say("gran", "你刚才，为了一个刚刚要杀你的人，打算全力出手。", "Just now you were ready to go all out for someone who'd just tried to kill you."),
    say("gran", "六十年前的事，我不在乎了。断剑说，她想死。我要赢，是为了替她说那句话。", "I'm done caring about sixty years ago. The Sword says she wants to die. I'm winning so I can say that for her."),
    me("那我们是敌人。", "Then we're enemies."),
    say("gran", "是敌人。", "Enemies."),
    me("那你刚才为什么救我？", "Then why did you save me?"),
    *iff(AT("gran", "trust", 2), say("gran", "……因为你在涂鸦街说，你怕忘了你妈。我祖父忘了断剑，擦了二十年空匣子。", "…Because on Mural Street you said you were afraid of forgetting your mum. My grandfather forgot the Sword and polished an empty case for twenty years.", face="sad")),
    nar("他没回答完。他站起来，往隧道深处走，走了几步，从兜里掏出一样东西往后一扔。是一瓶没开的啤酒。", "He doesn't finish. He gets up, walks deeper into the tunnel, and a few steps on tosses something back over his shoulder. An unopened beer."),
    say("gran", "打完再喝。不管谁赢。", "Drink it when it's over. Whoever wins."),
    say("lamp", "……你交朋友的方式真奇怪。", "…You make friends in the strangest way.", face="smile"),
    me("他不是朋友。", "He's not a friend."),
    say("lamp", "嗯。敌人。", "Mm. An enemy."),
], [choice("keep", "expression", T("把啤酒揣进风衣口袋", "Tuck the beer into my coat pocket"), [], [setv("flag.c6_done"), rel("gran", "warmth", 1)], values=["xin"])], order=4, cast=["gran", "lamp"])

CHAPTERS = [{"id": "c6", "title": T("第六章 · 地铁隧道", "Chapter 6 · The Metro Tunnel"), "intro": [P(T("同一夜，然后是下一天。", "The same night, and then the next day."))], "offer": 3}]
NODES = [S6_CRADLE, S6_TWINS, S6_KITE, C6_WARD, C6_TRAIN, C6_BEN, C6_AFTER]
DEAD = [
  {"id": "tunnel", "flag": "flag.dead_tunnel", "title": T("坏结局「〇号线」", "Bad End: Line Zero"), "cg": "cg_t_ambush",
   "text": T("〇号线又封上了。守秘局的报告里写着：信号故障，无人受伤。提灯那一栏，持有者变成了“雷恩，A.”。",
             "Line Zero is sealed again. The Bureau report reads: signal fault, no injuries. On the Lamp's line, the holder now reads 'Rhine, A.'"),
   "clinic": T("戴圆框眼镜的医生：“镜子只会照它见过的东西。你修过什么，它没见过？——还有，那两兄弟，读过他们的那一夜吗？”",
               "The doctor in round glasses: 'The mirror can only copy what it has seen. What could you mend that it has never seen? And those brothers—did you read their night?'")},
]

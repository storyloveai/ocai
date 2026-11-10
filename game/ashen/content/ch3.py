"""第三章《守秘局》"""
from lib import *

BG = {"shop_night": T("林记修复 · 凌晨", "Lin's Repairs · small hours"), "teahouse": T("听潮茶楼三楼", "Tidelistening Teahouse, third floor"),
      "harbor_street": T("老城区坡道 · 清晨", "Old-town slope · early morning")}
CG = {"cg_register": T("登记表上的空白", "The blank on the register"), "cg_scales": T("平了的天平", "The scales come level")}
FLAGS = [("flag.notebook", "开始写母亲的本子", "Began the notebook about Mum"), ("flag.registered", "在守秘局登了记", "Registered with the Bureau"),
         ("flag.lied", "对监督官撒了谎", "Lied to the supervisor"), ("flag.showed_photo", "给监督官看了那张照片", "Showed the supervisor the photo"),
         ("flag.questioned", "被外勤上门盘问过", "Questioned at the door by field agents"),
         ("flag.know_baiqiu", "读过白秋的那个下午", "Read Bai Qiu's afternoon"), ("flag.saw_chess", "读过钟楼上的棋盘", "Read the chessboard on the tower"),
         ("flag.met_baiqiu", "见过白秋", "Met Bai Qiu"), ("flag.heard_sword", "听到断剑断口的来历", "Heard how the Sword broke"),
         ("flag.heard_ink", "听到伊芙琳的下一个目标", "Heard Evelyn's next target"), ("flag.fixed_scales", "修好了天平", "Mended the Scales"),
         ("flag.c3_done", "第三章走完", "Finished Chapter 3"), ("flag.dead_exposed", "坏结局：燃气检测", "Bad end: Gas inspection")]

C3_NOTE = scene("c3_note", "c3", "main", T("林记修复 · 凌晨 02:10", "Lin's Repairs · 02:10"), [
    bg("shop_night"),
    nar("我没有开大灯，只拧开了台灯。拉开抽屉，摸出一个硬皮笔记本。", "I don't turn on the main light, only the desk lamp. From the drawer, a hardback notebook."),
    think("在提灯拿走更多东西之前，把她写下来。", "Before the Lamp takes any more, I'll write her down."),
    nar("我的母亲叫林遥。", "My mother's name is Lin Yao."),
    *iff(REMEMBERS("coat"), nar("她穿一件洗得发白的蓝外套，左边袖口有一块补丁，针脚歪歪扭扭。", "She wears a washed-out blue coat with a crooked patch on the left cuff.")),
    *iff(REMEMBERS("soup"), nar("她做的番茄蛋汤很咸，每次都咸，可她自己从来不觉得。", "Her tomato-and-egg soup is salty, every time, and she never notices.")),
    nar("她不会骑自行车。", "She can't ride a bike."),
    *iff(FORGOT("ride"),
        think("……这句话是怎么冒出来的？如果她不会骑，那个下午扶着车座的人，就不是她。那是谁？", "…Where did that come from? If she couldn't ride, then whoever held the seat that afternoon wasn't her. Then who?"),
        show("lamp", "sad", "center"),
        say("lamp", "这就是代价最可怕的地方。不是忘掉，是你再也分不清，剩下的哪些是真的。", "That's the worst of the price. Not forgetting—never again being sure which of what's left is true.")),
    *iff(REMEMBERS("ride"),
        think("我记得那个下午。扶车座的是……我还记得。所以我知道她不会骑。", "I remember that afternoon. The one holding the seat was… I still remember. That's how I know she couldn't ride.")),
    nar("卷帘门外面，有人敲了三下。很有礼貌，间隔均匀，像是用尺子量过的。", "Three knocks on the shutter. Polite, evenly spaced, as if measured with a ruler."),
], [choice("open", "expression", T("把本子合上，去开门", "Close the notebook and open the door"), [], [setv("flag.notebook")], values=["ji"])], order=1, cast=["lamp"])

S3_BAIQIU = scene("s3_baiqiu", "c3", "side", T("听潮茶楼三楼 · 下午三点（白秋）", "Tidelistening Teahouse · 3 p.m. (Bai Qiu)"), [
    bg("teahouse"),
    show("baiqiu", "smile", "center"),
    nar("白秋喜欢下午三点。不早不晚，正好够她听见想听的话。", "Bai Qiu likes three in the afternoon. Not early, not late; just right for hearing what she wants to hear."),
    nar("天平拿走的，是她做选择时的犹豫。所以五年来，她做什么决定都很快，快到自己都害怕。", "What the Scales take is her hesitation. So for five years she has decided everything fast, so fast it frightens her."),
    say("baiqiu", "我想要一个没有代价的世界。如果魔法不再拿走任何东西，就不会再有人那样死去了。", "I want a world without a price. If magic stopped taking things, no one would die like that again.", face="sad"),
    nar("“这是个好愿望。”白衣的女孩说。“这是个坏愿望。”黑衣的女孩说。", "'That's a good wish,' says the girl in white. 'That's a bad wish,' says the girl in black."),
], [choice("ok", "expression", T("（合上这一页）", "(Close this page)"), [], [setv("flag.know_baiqiu"), rel("baiqiu", "esteem", 1)], values=["ji"])], salience=2, cast=["baiqiu"])

S3_CHESS = scene("s3_chess", "c3", "side", T("钟楼顶层（撑黑伞的人）", "The clock tower (the man with the umbrella)"), [
    bg("clocktower"),
    nar("撑黑伞的男人还站在栏杆边。棋盘上，白色的骑士往前走了一格。", "The man with the black umbrella still stands at the rail. On the board, the white knight moves one square."),
    nar("“修灯的那个，”棋盘说，“第二次没有全力，也修好了。”", "'The lamp-mender,' says the chessboard, 'mended it the second time without going all out.'"),
    nar("男人没有说话。他看着那枚白骑士，看了很久。", "The man says nothing. He looks at the white knight for a long time."),
], [choice("ok", "expression", T("（合上这一页）", "(Close this page)"), [], [setv("flag.saw_chess")], values=["ji"])], salience=1, when=F("flag.hub_only"))

S3_CHESS_B = scene("s3_chess_b", "c3", "side", T("钟楼顶层（撑黑伞的人）", "The clock tower (the man with the umbrella)"), [
    bg("clocktower"),
    nar("撑黑伞的男人还站在栏杆边。棋盘上，白色的骑士往前走了一格。", "The man with the black umbrella still stands at the rail. On the board, the white knight moves one square."),
    nar("“修灯的那个，”棋盘说，“已经交出去两段了。”", "'The lamp-mender,' says the chessboard, 'has given up two already.'"),
    nar("“六十年前，”男人说，“也是从第二段开始，她就不回头了。”", "'Sixty years ago,' the man says, 'it was after the second that she stopped looking back.'"),
], [choice("ok", "expression", T("（合上这一页）", "(Close this page)"), [], [setv("flag.saw_chess")], values=["ji"])], salience=1, when=NF("flag.hub_only"))

C3_AUGUST = scene("c3_august", "c3", "main", T("林记修复 · 凌晨 03:05", "Lin's Repairs · 03:05"), [
    bg("shop_night"),
    show("august", "normal", "center"),
    say("august", "深夜打扰。我是守秘局的监督官，奥古斯特·莱恩。今晚，我替您收拾了一座摩天轮。", "Forgive the hour. I'm a supervisor with the Secrecy Bureau, August Lane. Tonight I tidied up a Ferris wheel for you."),
    say("august", "守秘局在王冠之争里保持中立。我们只管一件事：普通人不应该知道魔法的存在。", "The Bureau is neutral in the Crown war. We see to one thing only: ordinary people must not learn that magic exists."),
    cg("cg_register"),
    nar("他推过来一张表：第七次灰烬王冠之争·遗器持有者登记。十二行。最后一行，钥匙那一栏，什么都没有写——不是“空”，也不是“未登记”，就只是一片空白。", "He slides a form across: Seventh Ashen Crown War · Relic Holder Register. Twelve lines. The last, for the Key, is empty—not 'none', not 'unregistered', just blank."),
    say("august", "四百二十年来，钥匙那一栏从来没有填过。可是每一次王冠打开，都需要用到它。", "In four hundred and twenty years, no one has ever filled in the Key. Yet every time the Crown opens, it is used."),
    cgoff(),
    say("august", "请在这里签字。规则三条：不许在普通人面前使用遗器；不许伤害与王冠之争无关的人；王冠打开以后，结果由王冠决定。", "Sign here. Three rules: no relics before ordinary people; no harm to anyone outside the war; once the Crown opens, the Crown decides."),
], [
    choice("sign", "expression", T("签字，照实说摩天轮是我修的", "Sign, and admit the wheel was mine"), [
        say("august", "谢谢您的诚实。我明天会去申请一份“旧乐园改造项目试运营”的许可。", "Thank you for your honesty. Tomorrow I'll file for an 'old park refurbishment trial run' permit."),
    ], [setv("flag.registered"), rel("august", "trust", 1)], values=["xin"]),
    choice("photo", "dilemma", T("签字，然后把那张照片推到他面前", "Sign, then slide the photo across to him"), [
        nar("缺了门牙的小女孩举着手，身边是一片完整得过分的空白。", "A gap-toothed girl reaching up, beside her a blank far too complete."),
        me("十一年前，她从所有人的记忆里消失了。只有我还记得。", "Eleven years ago she vanished from everyone's memory. Only I remember."),
        say("august", "十一年前？不是六十年前？……那就不对了。", "Eleven years ago? Not sixty? …Then something's wrong.", face="surprised"),
        say("august", "或者说，上一次王冠改写的那条规则，到现在还在起作用。", "Or else the rule the Crown rewrote last time is still working, even now.", face="serious"),
    ], [setv("flag.registered"), setv("flag.showed_photo"), rel("august", "trust", 2), rel("august", "warmth", 1)], values=["ji"]),
    choice("lie", "strategy", T("签字，但说摩天轮不是我修的", "Sign, but say the wheel wasn't you"), [
        say("august", "……是吗。", "…Is that so.", face="serious"),
        nar("他推了推老花镜，在表格的空白处写了一行很小的字。", "He nudges his reading glasses and writes a tiny line in the margin."),
    ], [setv("flag.registered"), setv("flag.lied"), add("notice", 2), rel("august", "trust", -1)], values=["duo"]),
], order=2, cast=["august"])

X_NOTICE = scene("x_notice", "*", "interrupt", T("凌晨一点 · 坡底", "1 a.m. · foot of the slope"), [
    bg("harbor_street"),
    nar("回家的路上，坡底停着两辆没有标志的车。两个穿黑西装的人拦住我：“您好，市政燃气检测。这一带刚才有点异常。”", "On the way home, two unmarked cars wait at the foot of the slope. Two men in black suits stop me. 'Good evening, city gas inspection. Something odd around here just now.'"),
    nar("他们不看燃气表。他们一直在看我腰上的灯。", "They don't look at any meter. They keep looking at the lamp on my belt."),
], [
    choice("cooperate", "expression", T("站在路灯底下，问什么答什么", "Stand under the streetlight and answer everything"), [
        nar("问了二十分钟。走的时候，其中一个说：监督官晚点会去您铺子里。请说实话，省大家的事。", "Twenty minutes of questions. Leaving, one says: the supervisor will call at your shop later. Please tell him the truth; it saves everyone trouble."),
    ], [setv("flag.questioned"), add("notice", -1)], values=["xin"]),
    choice("refuse", "strategy", T("“我只是路过。”绕开他们走", "'Just passing.' Walk around them"), [
        nar("他们没有追。可是那两辆车的灯，一直跟到了我铺子门口。", "They don't follow on foot. But the cars' headlights follow me all the way to my shutter."),
    ], [setv("flag.questioned"), add("notice", 1)], values=["shou"]),
], order=-1, when=V("notice", ">=", 2))

C3_TEA = scene("c3_tea", "c3", "main", T("听潮茶楼三楼 · 15:12", "Tidelistening Teahouse · 15:12"), [
    bg("teahouse"),
    nar("门缝里塞着一张纸条：你昨晚被人照了镜子。想知道是谁，下午三点，听潮茶楼三楼。署名是一架小小的天平。", "A note under the door: Someone held a mirror to you last night. If you want to know who, 3 p.m., third floor of the Tidelistening Teahouse. Signed with a tiny pair of scales."),
    show("baiqiu", "smile", "center"),
    say("baiqiu", "请坐，林小姐。茶刚泡好。", "Have a seat, Miss Lin. The tea's just made."),
    nar("“喝茶吗？”白衣的说。“别喝茶。”黑衣的说。", "'Some tea?' says the one in white. 'Don't drink the tea,' says the one in black."),
    say("baiqiu", "我手里有三条情报，都和你有关。换你修一样东西。", "I have three pieces of information, all about you. In exchange, you mend one thing for me."),
    nar("她把一架巴掌大的黄铜天平放在桌上。左边秤盘边缘有一道裂纹，一直裂到中心。", "She sets a palm-sized brass scale on the table. A crack runs from the left pan's rim to the center."),
    say("baiqiu", "第一条：昨晚你修摩天轮的时候，有人在灯塔上看着。第二条：伊芙琳的下一个目标，是卡罗·文斯的墨水瓶。", "One: while you mended the wheel last night, someone watched from the lighthouse. Two: Evelyn's next target is Carlo Vince's Inkwell."),
    say("baiqiu", "第三条：断剑的那道断口，是六十年前断的。断剑当时的主人，在钟楼上被一盏灯拦住了——你的那盏灯。提灯的上一任主人，亲手折断了断剑。", "Three: the Sword broke sixty years ago. Its holder was stopped on the clock tower by a lamp—your lamp. The Lamp's last holder broke the Sword with her own hands.", face="serious"),
    nar("“是真的。”白衣的说。“是假的。”黑衣的说。两个声音完全重叠。", "'It's true,' says the one in white. 'It's false,' says the one in black. Their voices overlap exactly."),
], [
    choice("mend", "dilemma", T("“我修。”——把手放在那道裂纹上", "'I'll mend it.'—lay a hand on the crack"), [
        nar("裂纹很细，很深，从秤盘边缘一直延伸到中心。像是被什么太重的东西压裂的。", "The crack is fine and deep, from rim to center. As if something far too heavy pressed it."),
        cg("cg_scales"),
        nar("我一点一点地，让它想起原来的样子。两只秤盘晃了晃，停在了同一个高度。平了。", "Bit by bit I let it remember what it was. The pans sway and settle at the same height. Level."),
        say("baiqiu", "……三年了。", "…Three years.", face="surprised"),
        cgoff(),
    ], [setv("flag.met_baiqiu"), setv("flag.heard_sword"), setv("flag.heard_ink"), setv("flag.fixed_scales"), rel("baiqiu", "trust", 2), add("light", 1)], values=["xiu"]),
    choice("wish", "expression", T("“你想要一个没有代价的世界，对吧？”", "'You want a world without a price, don't you?'"), [
        say("baiqiu", "……你从哪里听来的？", "…Where did you hear that?", face="surprised"),
        me("我修好它，但你得告诉我：压裂它的，是什么？", "I'll mend it, but tell me: what cracked it?"),
        say("baiqiu", "那是第四条情报。……好吧。是一个人的命。总有一天告诉你。", "That's a fourth piece. …Fine. A life. I'll tell you one day.", face="sad"),
        cg("cg_scales"),
        nar("秤盘平了。", "The pans come level."),
        cgoff(),
    ], [setv("flag.met_baiqiu"), setv("flag.heard_sword"), setv("flag.heard_ink"), setv("flag.fixed_scales"), rel("baiqiu", "trust", 3), rel("baiqiu", "esteem", 1)], values=["ji"], when=F("flag.know_baiqiu")),
    choice("decline", "strategy", T("“情报我听了。东西，不修。”", "'I heard your information. I won't mend it.'"), [
        say("baiqiu", "也好。你只要相信你自己的判断就好。", "Fair enough. Trust your own judgment.", face="smile"),
    ], [setv("flag.met_baiqiu"), setv("flag.heard_sword"), setv("flag.heard_ink")], values=["shou"]),
], order=3, cast=["baiqiu"])

C3_END = scene("c3_end", "c3", "main", T("老城区坡道 · 夜", "The old-town slope · night"), [
    bg("shop_night"),
    show("lamp", "normal", "center"),
    me("提灯。白秋说的是真的吗？六十年前，你的上一任主人折断了断剑？", "Lamp. Was Bai Qiu telling the truth? Did your last holder break the Sword sixty years ago?"),
    say("lamp", "……我不记得了。王冠改写规则的时候，会把“改之前是什么样”从所有人的记忆里一起抹掉。连我们也一样。", "…I don't remember. When the Crown rewrites a rule, it wipes what came before from everyone's memory. Us too.", face="sad"),
    *iff(F("flag.saw_initials"), me("灯座底下那两个字母，M. 和 S.，是谁？", "The two letters under your base, M. and S.—who are they?"), say("lamp", "……不知道。可是每次你问，我这里就有一点疼。", "…I don't know. But every time you ask, it hurts a little here.")),
    nar("钟楼敲了十二下。", "The clock tower strikes twelve."),
], [choice("sleep", "expression", T("把灯挂回腰上，拉下卷帘门", "Hang the lamp back on my belt and pull down the shutter"), [], [setv("flag.c3_done")], values=["ji"])], order=4, cast=["lamp"])

CHAPTERS = [{"id": "c3", "title": T("第三章 · 守秘局", "Chapter 3 · The Secrecy Bureau"), "intro": [P(T("第三天。凌晨两点，雨停了。", "Day three. Two a.m.; the rain has stopped."))],
             "offer": 2}]
NODES = [C3_NOTE, S3_BAIQIU, S3_CHESS, S3_CHESS_B, C3_AUGUST, X_NOTICE, C3_TEA, C3_END]
DEAD = []

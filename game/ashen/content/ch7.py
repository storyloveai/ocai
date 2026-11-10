"""第七章《钟楼之下》（小说第七章《提灯的秘密》、第八章《金色的十一月》）。卷一《灯火》到这里结束。"""
from lib import *

BG = {"clock_plaza": T("钟楼广场 · 午夜", "Clock-tower plaza · midnight"), "lamp_inside": T("提灯里面", "Inside the Lamp")}
CG = {"cg_plaza": T("荆棘王冠", "The crown of thorns")}
FLAGS = [("flag.saw_chess_grey", "读过灰色的棋子", "Read the grey chess piece"), ("flag.know_invite", "读过那一行字是怎么写的", "Read how the invitation was written"),
         ("flag.touched_lock", "碰了锁着的那盏灯", "Touched the locked lantern"), ("flag.vow_friends", "决定不再全力，去交朋友", "Decided: no more going all out; make friends"),
         ("flag.vow_win", "决定只要能赢就全力", "Decided: go all out if it wins"), ("flag.evelyn_falter", "伊芙琳在广场上答不上来", "Evelyn couldn't answer in the plaza"),
         ("flag.c7_done", "卷一走完", "Finished Volume 1")]

S7_CHESS = scene("s7_chess", "c7", "side", T("钟楼顶层 · 23:00（撑黑伞的人）", "Top of the clock tower · 23:00 (the man with the umbrella)"), [
    bg("clocktower"),
    show("merlo", "serious", "center"),
    nar("棋盘上，白色的骑士和黑色的车，原本隔着整个棋盘对峙。现在它们挨在了一起，面对着那枚金红色的皇后。", "On the board the white knight and the black rook used to face each other across the whole board. Now they stand side by side, facing the red-gold queen."),
    nar("棋盘最底下一行，最角落的格子里，一枚他从来没有摆过的棋子自己立了起来。灰色的，像是用灰烬捏成的，没有形状。", "In the bottom row, in the corner square, a piece he never placed stands up by itself. Grey, as if pressed out of ash, without a shape."),
    nar("棋盘开口了。可那不是棋盘的声音。是一个女孩的声音，很轻，在笑。", "The board speaks. But it isn't the board's voice. It is a girl's, light, laughing."),
    nar("“梅洛，你还记得你答应过我什么吗？”", "'Merlo, do you remember what you promised me?'"),
    say("merlo", "……我答应过什么？", "…What did I promise?", face="sad"),
    nar("钟楼的钟敲响了十一点。他想不起来。他什么都想不起来。", "The tower strikes eleven. He can't remember. He can't remember anything."),
], [choice("ok", "expression", T("（合上这一页）", "(Close this page)"), [], [setv("flag.saw_chess_grey")], values=["ji"])], salience=2, cast=["merlo"])

S7_INK = scene("s7_ink", "c7", "side", T("艾希大厦楼下 · 黄昏（伊芙琳）", "Below Eiche Tower · dusk (Evelyn)"), [
    bg("eiche_top"),
    show("evelyn", "normal", "left"), show("ink", "normal", "right"),
    nar("墨水瓶写下了一行字，墨迹还没有干：明晚十二点，钟楼之下。所有遗器持有者，来见我。", "The Inkwell has written a line, the ink still wet: Midnight tomorrow, beneath the clock tower. Every relic holder, come and see me."),
    say("poet", "您确定吗，我的小姐？这是宣战。现在宣战，所有人都会联合起来对付您。", "Are you sure, my lady? This is a declaration of war. Declare now and everyone will unite against you."),
    say("evelyn", "那就让他们来。我要所有人都看着。看着我赢。", "Then let them. I want everyone watching. Watching me win.", face="serious"),
    nar("诗人没有告诉她：她说出“我要所有人都看着”的时候，荆棘冠又悄悄拿走了一点东西。她已经快不记得，自己为什么想让所有人看着了。", "The poet doesn't tell her: as she said 'I want everyone watching', the Crown quietly took a little more. She can barely remember why she wants anyone to watch."),
], [choice("ok", "expression", T("（合上这一页）", "(Close this page)"), [], [setv("flag.know_invite"), rel("evelyn", "esteem", 1)], values=["ji"])], salience=1, cast=["evelyn", "ink", "poet"])

C7_LAMP = scene("c7_lamp", "c7", "main", T("林记修复 · 周日 10:20", "Lin's Repairs · Sunday, 10:20"), [
    bg("shop_day"),
    *iff(F("flag.ben_leg"), nar("苏蔓打电话来：“本醒了。腿是好的。他哥哥守在床边，三天没合眼。本醒过来，第一句话是问他哥哥吃饭了没有。”", "Su Man calls: 'Ben's awake. The leg is fine. His brother hasn't slept in three days. The first thing Ben asked was whether his brother had eaten.'")),
    *iff(NF("flag.ben_leg"), nar("苏蔓打电话来：“本醒了。左腿没了。本醒过来，第一句话是问他哥哥吃饭了没有。……林栖，那不是你的错。”", "Su Man calls: 'Ben's awake. The left leg is gone. The first thing he asked was whether his brother had eaten. …Lin, it isn't your fault.'")),
    cg("cg_mend_lamp"),
    nar("灯芯上的火苗小得像一粒米。我用软布擦着黄铜的框架，擦到灯座底下的时候，手指摸到了一道刻痕。", "The flame on the wick is the size of a grain of rice. I polish the brass frame with a soft cloth, and under the base my finger finds a groove."),
    nar("灯座底下，刻得很潦草：M. & S.", "Under the base, scratched in a hurry: M. & S."),
    nar("我闭上眼睛，用修复术去“看”那盏灯的里面。我这辈子从来没有这样做过。", "I close my eyes and use the mending to look inside the lamp. I've never done that in my life."),
    cgoff(),
    bg("lamp_inside"),
    cg("cg_lamp_lit"),
    nar("无边无际的黑暗里，飘着一盏一盏的灯，像一片倒过来的星空。每一盏灯里面，都有画面在流动。被提灯收下的、所有主人的、所有温暖的记忆。", "In boundless dark float lanterns, one after another, like an upside-down sky. Pictures move inside each. Every warm memory the Lamp has ever taken from every holder."),
    *iff(FORGOT("ride"), nar("离我最近的一盏：梧桐树，天蓝色的小自行车。扶着车座跑的是一个戴黑框眼镜、穿着沾了机油的工作服的男人。“栖栖，看前面！爸爸不松手——”", "The nearest: the plane tree, the little sky-blue bike. The one running behind is a man in black-framed glasses and an oil-stained work shirt. 'Qiqi, look ahead! Daddy won't let go—'"),
        think("是父亲。不是母亲。我看见了，可心里什么都没有。像在看一部别人的电影。", "Dad. Not Mum. I can see it, and feel nothing. Like watching someone else's film.")),
    *iff(FORGOT("praise"), nar("一盏灯里是拆开的闹钟和一只大手。", "In one lantern, a clock in pieces and a big hand.")),
    *iff(FORGOT("musicbox"), nar("一盏灯里是梧桐树底下的八音盒。", "In one, a music box under the plane tree.")),
    *iff(FORGOT("soup"), nar("一盏灯里冒着热气，是一碗汤。", "In one, steam rising from a bowl of soup.")),
    *iff(FORGOT("coat"), nar("一盏灯里是一只蓝色的口袋，口袋里揣着一只小手。", "In one, a blue pocket with a small hand tucked inside.")),
    nar("黑暗最深的地方，悬着一盏被锁住的灯。四周缠着一圈一圈白色的光带。缝隙里漏出蓝色的光。", "In the deepest dark hangs one lantern, locked. White bands wrap it round and round. Blue light leaks through the gaps."),
    nar("我从缝隙里看见了一只袖子。洗得发白的蓝外套，左边袖口一块补丁。一只手握着笔，在一本很厚很厚的本子上写字。", "Through a gap I see a sleeve. A washed-out blue coat, a patch on the left cuff. A hand holding a pen, writing in a very thick notebook."),
    me("……妈妈？", "…Mum?"),
    show("lamp", "sad", "center"),
    say("lamp", "别碰。林栖，求你了。", "Don't touch it. Lin, please.", face="sad"),
], [
    choice("touch", "dilemma", T("伸手去拨开那些光带", "Reach out and part the bands"), [
        nar("光带烫得像烙铁。我拨开了一条——只看见本子封皮上的一行字：给六十年后，那个比我更勇敢的人。", "The bands burn like irons. I part one—and see only a line on the notebook's cover: To the one, sixty years on, who is braver than I was."),
        nar("然后光带合上了，把我推了出来。", "Then the bands close, and push me out."),
        say("lamp", "……她让我答应她两件事。替她保管好，一直到最后。还有，不要让你看见。", "…She made me promise two things. Keep it safe until the end. And don't let you see.", face="sad"),
    ], [setv("flag.touched_lock"), setv("flag.saw_initials"), rel("lamp", "trust", -2), add("light", -1)], values=["duo"]),
    choice("stop", "expression", T("把手收回来", "Draw my hand back"), [
        nar("我把手收了回来。光带上的白光一明一暗，像在呼吸。", "I draw my hand back. The white bands brighten and dim, as if breathing."),
        say("lamp", "……谢谢。", "…Thank you."),
    ], [setv("flag.saw_initials"), rel("lamp", "trust", 2)], values=["shou"]),
], order=1, cast=["lamp"])

C7_TALK = scene("c7_talk", "c7", "main", T("林记修复 · 黄昏 18:30", "Lin's Repairs · dusk, 18:30"), [
    bg("shop_night"),
    show("lamp", "sad", "center"),
    me("那盏被锁起来的灯里面，是我妈妈。你为什么有她的记忆？她也是你的主人？", "The locked lantern has my mother inside. Why do you have her memories? Was she your holder too?"),
    say("lamp", "我答应过她。她说，你看见了，就会去找她。她不想让你去找她。", "I promised her. She said if you saw, you'd go looking for her. She didn't want you to."),
    me("……她还活着吗？我只问这一个。", "…Is she alive? That's all I'm asking."),
    say("lamp", "我不知道。她把东西交给我，然后就不见了。我和你一样，林栖。我只记得她，却不知道她去了哪里。", "I don't know. She gave it to me, and then she was gone. I'm like you, Lin. I remember her and don't know where she went."),
    say("lamp", "等你站在王冠面前，我就把它还给你。", "When you stand before the Crown, I'll give it back to you."),
    nar("我拿出那个硬皮本子。第一页写着：我的母亲叫林遥。", "I take out the hardback notebook. Page one: My mother's name is Lin Yao."),
    *iff(FORGOT("ride"), nar("我把“她不会骑自行车”那一行划掉，在下面写：扶我学骑车的，是爸爸。我已经不记得了。但是提灯替我记得。", "I strike out 'She can't ride a bike' and write beneath: The one who taught me to ride was Dad. I don't remember anymore. But the Lamp remembers for me.")),
], [
    choice("friends", "expression", T("“我不会再全力出手了。我去交朋友。”", "'I won't go all out anymore. I'll make friends.'"), [
        nar("我把那瓶没开的啤酒放在柜台上。", "I set the unopened beer on the counter."),
        say("lamp", "这是灰烬王冠之争。十二件遗器，五个家族，所有人都想赢。没有人会跟你交朋友。", "This is the Ashen Crown war. Twelve relics, five families, everyone wants to win. No one will be your friend."),
        me("葛兰会。苏蔓会。也许白秋也会，只要我能弄清楚她要什么。伊芙琳不知道自己要什么。我想帮她想出来。", "Gran will. Su Man will. Maybe Bai Qiu too, once I figure out what she wants. Evelyn doesn't know what she wants. I'd like to help her find out."),
        nar("我伸出手，摸了摸他透明的、银白色的头发。就像很多年前，有人摸我的头那样。", "I reach out and touch his transparent silver hair. The way someone touched mine, many years ago."),
        me("我不恨你。你替我记着那个下午，替我记着爸爸，替我记着妈妈。谢谢你，提灯。", "I don't hate you. You remember that afternoon for me, and Dad, and Mum. Thank you, Lamp."),
        nar("灯芯上那粒米大的火苗，忽然跳了起来。很轻，很慢，像一个人在黑暗里，深深地吸了一口气。", "The rice-grain flame on the wick suddenly rises. Lightly, slowly, like someone in the dark drawing a deep breath."),
    ], [setv("flag.vow_friends"), rel("lamp", "warmth", 2), rel("lamp", "trust", 1), add("light", 1)], values=["xin"]),
    choice("win", "strategy", T("“我要赢。只要能走到王冠面前，你拿什么都行。”", "'I'm going to win. If it gets me to the Crown, take whatever you want.'"), [
        say("lamp", "……你知道我为什么只拿温暖的记忆吗？因为最不舍得。我拿得越重，你就越恨我。你越恨我，我就越不用……", "…Do you know why I only take warm memories? Because they're the hardest to give. The heavier I take, the more you'll hate me. The more you hate me, the less I have to…", face="sad"),
        me("越不用什么？", "The less you have to what?"),
        nar("他低下头，没有回答。", "He lowers his head and doesn't answer."),
    ], [setv("flag.vow_win"), add("light", 2), rel("lamp", "trust", -1)], values=["duo"]),
], order=2, cast=["lamp"])

C7_PLAZA = scene("c7_plaza", "c7", "main", T("钟楼广场 · 周二 23:59", "Clock-tower plaza · Tuesday, 23:59"), [
    bg("clock_plaza"),
    nar("那一行字出现在了啤酒瓶的标签上。原本印着“维斯特林精酿”的地方：明晚十二点，钟楼之下。所有遗器持有者，来见我。", "The line appeared on the beer bottle's label, where it used to say 'Westerling Craft': Midnight tomorrow, beneath the clock tower. Every relic holder, come and see me."),
    nar("广场被清空了：“钟楼夜间检修”。白秋和她的双生子，葛兰和断剑，苏蔓和摇篮，戴耳机的亚当，两手空空的卡罗。还有扣着最上面一颗扣子的奥古斯特。", "The plaza has been cleared: 'Clock tower closed for night maintenance'. Bai Qiu and her twins, Gran and the Sword, Su Man and the Cradle, Adam in his headphones, Carlo with empty hands. And August, buttoned to the top."),
    show("gran", "normal", "left"),
    *iff(AT("gran", "trust", 2), say("sword", "你紧张什么？你烟都快被你嚼烂了。", "What are you nervous about? You've chewed that cigarette to pulp.", face="smile")),
    nar("葛兰隔着半个广场看了我一眼，把那支被嚼烂的烟扔进了垃圾桶，别过了脸。", "Across half the plaza Gran glances at me, tosses the chewed cigarette in the bin and looks away."),
    hide("gran"),
    nar("钟楼的钟敲响了十二点。", "The clock tower strikes twelve."),
    cg("cg_plaza"),
    nar("第一声钟响，伊芙琳从钟楼顶上走了下来。不是走楼梯，是走在荆棘交织成的阶梯上。光着脚的长发少女在她身后飞；戴眼镜的书记员写下一行字：钟楼，停。", "On the first stroke Evelyn descends from the top of the tower—not by stairs, but down a stair of woven thorns. A barefoot girl with long hair flies behind her; a bespectacled clerk writes a line: Clock, stop."),
    say("evelyn", "我会赢。", "I will win.", face="serious"),
    nar("那四个字变成了四根古树一样的巨大荆棘，撞碎了广场的石板，长到钟楼的高度，在尖顶上空交织成了一顶漆黑的、带刺的冠冕。", "Those words become four thorns as thick as ancient trees. They shatter the paving, grow to the height of the tower and weave above the spire into a black crown of thorns."),
    cgoff(),
    show("evelyn", "normal", "center"),
    say("lamp", "她每一次出手，荆棘冠都会拿走她的骄傲。她现在用得这么狠，应该已经没剩多少了。", "Every time she strikes, the Crown takes her pride. Using it this hard, she can't have much left."),
], [
    choice("pride", "dilemma", T("“你已经想不起来，为什么要让所有人看着你了，对吧？”", "'You can't remember anymore why you want everyone watching, can you?'"), [
        say("evelyn", "……这和你没关系。", "…That's none of your business."),
        me("你叫我们所有人来，让我们看着你赢。赢了以后呢？你为什么要让所有人看着？", "You called us all here to watch you win. After that? Why do you need everyone watching?"),
        nar("她的手指在手套里蜷了一下。她想说“因为我要让他们承认我”，可这句话到了嘴边，变得很陌生，像一句别人说过的话。", "Her fingers curl inside her gloves. She wants to say 'because I want them to acknowledge me', but at her lips it turns strange, like something someone else once said."),
        say("evelyn", "……修灯的。你很烦。", "…Lamp-mender. You're a nuisance.", face="sad"),
        me("我知道。很多人都这么说。", "I know. A lot of people say so."),
    ], [setv("flag.evelyn_falter"), rel("evelyn", "trust", 2), rel("evelyn", "warmth", 1)], values=["ji"], when=ANY(F("flag.know_pride"), F("flag.know_invite"))),
    choice("again", "expression", T("“你上次说还没想好要改什么。现在想好了吗？”", "'Last time you hadn't decided what to change. Have you now?'"), [
        say("evelyn", "赢了以后，我再想。", "I'll think about it after I win."),
        me("那你现在为什么要让所有人看着？", "Then why do you need everyone watching now?"),
        say("evelyn", "……修灯的，你很烦。", "…Lamp-mender, you're a nuisance.", face="serious"),
    ], [rel("evelyn", "trust", 1), rel("evelyn", "esteem", 1)], values=["xin"], when=F("flag.asked_evelyn")),
    choice("look", "expression", T("什么都不说，抬头看那顶荆棘王冠", "Say nothing; look up at the crown of thorns"), [
        nar("月光从荆棘的缝隙里漏下来，在广场上投下一片斑驳的、带刺的影子。所有人都仰着头。", "Moonlight leaks through the thorns and throws a dappled, spiked shadow across the plaza. Everyone is looking up."),
    ], [rel("evelyn", "esteem", 1)], values=["shou"]),
], order=3, cast=["evelyn", "lamp", "gran"])

C7_END = scene("c7_end", "c7", "main", T("钟楼广场 · 00:09", "Clock-tower plaza · 00:09"), [
    bg("clock_plaza"),
    show("august", "serious", "left"),
    nar("奥古斯特·莱恩感觉到西装内袋里多了一样东西。一个牛皮纸信封。里面是一张泛黄的纸：", "August Lane feels something new in his inside pocket. A brown envelope. Inside, a yellowed page:"),
    nar("第六次灰烬王冠之争，胜者：梅洛。改写的规则：（此处字迹被抹去）。规则生效后，确认被遗忘者名单如下——", "Sixth Ashen Crown War. Victor: Merlo. Rule rewritten: (this line erased). Confirmed forgotten after the rule took effect:"),
    nar("7. 苏（姓氏不详）——提灯持有者。……最后一个名字，墨迹比其他的都新：林遥——十一年前。", "7. Su (surname unknown)—holder of the Lamp. …The last name, in fresher ink than the rest: Lin Yao—eleven years ago."),
    *iff(F("flag.showed_photo"), nar("他抬起头，隔着整个广场，看向我。他找了四十一年的东西，就这样，被人塞进了他的口袋里。", "He looks up, across the whole plaza, at me. What he spent forty-one years looking for has simply been slipped into his pocket.")),
    hide("august"),
    show("evelyn", "normal", "center"),
    nar("伊芙琳打了一个响指。钟楼的指针重新开始走了。只有那顶荆棘王冠还悬在夜空里。", "Evelyn snaps her fingers. The clock hands move again. Only the crown of thorns still hangs in the night sky."),
    say("evelyn", "诸位，我给大家七天的时间。七天以后，我会从你们每一个人手里，把遗器拿过来。一个一个地，按我的顺序。", "Everyone, I give you seven days. In seven days I will take your relics from each of you. One by one, in my order."),
    say("evelyn", "修灯的，你是第一个。", "Lamp-mender. You're first."),
    nar("我的手慢慢地握住了腰上的提灯。灯是暖的。", "My hand slowly closes on the lamp at my belt. It's warm."),
], [choice("wait", "expression", T("“我等你。”", "'I'll be waiting.'"), [
        nar("钟楼的钟敲响了十二点十分。那一声很长，很长，在维斯特林的上空回荡了很久。像是一场漫长的战争，终于真正地，开始了。", "The tower strikes ten past twelve. The note is long, so long, ringing over Westerling for a great while. As if a long war has finally, truly begun."),
    ], [setv("flag.c7_done")], values=["yong"])], order=4, cast=["evelyn", "august"])

CHAPTERS = [{"id": "c7", "title": T("第七章 · 钟楼之下", "Chapter 7 · Beneath the Clock Tower"), "intro": [P(T("周日，然后是周二的午夜。", "Sunday, and then Tuesday midnight."))], "offer": 2}]
NODES = [S7_CHESS, S7_INK, C7_LAMP, C7_TALK, C7_PLAZA, C7_END]
DEAD = []

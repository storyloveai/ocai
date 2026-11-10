"""序章、第一章《修灯的人》"""
from lib import *

BG = {"clocktower": T("钟楼顶层 · 雨夜", "Clock tower top · rainy night"), "shop_rain": T("林记修复 · 雨夜", "Lin's Repairs · rainy night"),
      "oldhouse": T("林家祖宅 · 客厅", "The Lin house · parlor"), "basement": T("祖宅地下室", "The basement workshop"),
      "bar": T("锚链酒吧", "The Anchor Chain bar"), "eiche_top": T("艾希大厦顶层", "Top of the Eiche Tower")}
CG = {"cg_photo": T("港口的照片", "The harbor photo"), "cg_mend_lamp": T("修灯", "Mending the lamp"), "cg_bar_pov": T("锚链酒吧的两个人", "Two at the Anchor Chain"), "cg_lamp_lit": T("灯亮了", "The lamp lights"), "cg_reconnect": T("接上！", "Reconnect!")}
FLAGS = [("flag.tools", "带上了父亲的工具包", "Brought Dad's toolkit"), ("flag.contract", "和提灯结了契", "Bound to the Lamp"),
         ("flag.met_gran", "见过葛兰和断剑", "Met Gran and the Sword"), ("flag.know_gran", "读过葛兰的那一夜", "Read Gran's night"),
         ("flag.know_evelyn", "读过伊芙琳的那一夜", "Read Evelyn's night"), ("flag.saw_initials", "看见灯座底下的字母", "Saw the letters under the base"),
         ("flag.talked_down", "没用全力，用一句话拦住了葛兰", "Stopped Gran with words, not power"),
         ("flag.dead_refuse", "坏结局：地下室的灰", "Bad end: Ash in the basement"), ("flag.dead_cut", "坏结局：断线", "Bad end: Severed")]

PROLOGUE = scene("p_tower", "p", "main", T("序章 · 第六十年的灰", "Prologue · Ash of the Sixtieth Year"), [
    bg("clocktower"),
    nar("六十年前的十一月。维斯特林的钟楼顶上，有两个人。", "November, sixty years ago. Two people stand at the top of Westerling's clock tower."),
    nar("一个扎马尾的女孩，穿着一件很旧的毛衣。一个戴单片眼镜的年轻人，一直在说话：别去了。我们换一个办法。", "A girl with a ponytail in an old sweater. A young man with a monocle who keeps talking: don't. We'll find another way."),
    nar("女孩没有回头。", "The girl doesn't look back."),
    nar("钟楼上空亮起一顶灰色的冠冕。第二天早上，城里没有一个人记得她。", "A grey crown lights the sky above the tower. By morning no one in the city remembers her."),
    nar("——六十年后。", "—Sixty years later."),
    nar("同一座钟楼，一个撑黑伞的男人站在栏杆边，看着一张自己会走的棋盘。", "The same tower. A man with a black umbrella stands at the rail, watching a chessboard that moves by itself."),
    nar("“第一盏灯，”他说，“今晚会亮。”", "'The first lamp,' he says, 'lights tonight.'"),
], [choice("go", "expression", T("（翻开第一章）", "(Turn to Chapter 1)"), [])], order=1)

C1_SHOP = scene("c1_shop", "c1", "main", T("林记修复 · 夜 22:40", "Lin's Repairs · 22:40"), [
    bg("shop_rain"),
    nar("维斯特林下雨的时候，整座城都像一块泡在水里的旧怀表。", "When it rains in Westerling, the whole city is like an old pocket watch soaking in water."),
    me("好了。换了两个电容，调谐轮的齿也补了。别再拿它砸核桃。", "Done. Two new capacitors, and I patched the tuning wheel. Stop cracking walnuts with it."),
    nar("老头抱着收音机出了门。铺子重新安静下来，只剩满墙待修的东西。", "The old man carries his radio out. The shop goes quiet, just walls of things waiting to be fixed."),
    think("坏掉的东西不会骗人。哪里断了，哪里锈了，你只要认真看，它就全告诉你。不像人。", "Broken things don't lie. Where it snapped, where it rusted—look hard and it tells you everything. Not like people."),
    cg("cg_photo"),
    nar("抽屉最里面有一张照片：十五年前的港口，一个缺了门牙的小女孩举着手去够海鸥。她身边，是一片空白。", "At the back of the drawer, a photo: the harbor fifteen years ago, a gap-toothed girl reaching for a gull. Beside her, a blank."),
    think("我记得那里站着她。蓝外套，袖口一块补丁。她叫林遥。可这个世界上，除了我，没有一个人记得。", "I remember she stood there. A blue coat, a patch on the cuff. Her name was Lin Yao. And no one in this world remembers her but me."),
    nar("照片背面是母亲的字：栖栖，如果有一天你发现只有你还记得我，去祖宅的地下室。把那盏灯修好。", "On the back, Mum's handwriting: Qiqi, if one day you find you're the only one who remembers me, go to the basement of the old house. Fix the lamp."),
    cgoff(),
    think("十一年了，我一次也没有去过。", "Eleven years, and I've never gone."),
], [
    choice("tools", "strategy", T("把父亲留下的工具包也带上", "Take Dad's old toolkit too"), [
        nar("柜台底下那只帆布包，拉链已经不太好拉了。镊子、锉刀、焊锡、一卷黄铜丝。", "The canvas bag under the counter; its zip sticks. Tweezers, files, solder, a roll of brass wire."),
        think("修东西之前，先把工具摆齐。有人这么教过我。", "Before you fix anything, lay out your tools. Someone taught me that."),
    ], [setv("flag.tools"), add("light", 1)], values=["xiu"]),
    choice("go", "expression", T("什么都不带，现在就去", "Take nothing; go now"), [
        think("再想下去，我又要等一个十一年。", "If I think any longer, I'll wait another eleven years."),
    ], [], values=["yong"]),
], order=1, cast=[])

S1_BAR = scene("s1_bar", "c1", "side", T("旧港 · 锚链酒吧（葛兰）", "Old harbor · the Anchor Chain (Gran)"), [
    bg("bar"),
    nar("葛兰·霍克这辈子写坏过三百一十七张符纸。是他父亲替他数的。", "Gran Hawke has botched three hundred and seventeen talismans in his life. His father counted them for him."),
    show("sword", "smile", "right"),
    say("sword", "葛兰——再来一杯！", "Gran—another!", face="smile"),
    show("gran", "normal", "left"),
    say("gran", "你今晚已经喝了七杯了。", "That's seven tonight."),
    say("sword", "我是剑，喝不醉。喝的时候，我会觉得自己像个活人。", "I'm a sword. I don't get drunk. When I drink, I feel like I'm alive."),
    cg("cg_bar_pov"),
    nar("十年前，他在码头的淤泥里捞起一截断剑。她醒了一半，说：等到第六十年，帮我一个忙。", "Ten years ago he pulled a broken sword out of the harbor mud. She half-woke and said: in the sixtieth year, do me a favor."),
    cgoff(),
    say("sword", "灯亮了。老城区，坡顶。", "A lamp just lit. Old town, top of the hill.", face="normal"),
    say("gran", "……那就去拿。", "…Then let's go take it."),
    think("他不是为了自己要遗器。是为了她。", "He doesn't want relics for himself. He wants them for her."),
], [choice("ok", "expression", T("（合上这一页）", "(Close this page)"), [], [setv("flag.know_gran")], values=["ji"])], salience=2, cast=["gran", "sword"])

S1_EICHE = scene("s1_eiche", "c1", "side", T("填海新区 · 艾希大厦顶层（伊芙琳）", "The reclaimed district · top of the Eiche Tower (Evelyn)"), [
    bg("eiche_top"),
    nar("伊芙琳·冯·艾希从来没有输过。可二十岁那年，父亲宣布的继承人是姐姐。", "Evelyn von Eiche has never lost. Yet when she was twenty, her father named her sister heir."),
    show("evelyn", "normal", "center"),
    say("evelyn", "第一盏灯亮了。老城区，林家。一个没落了五十年的家族。", "The first lamp is lit. Old town, the Lin house. A family fallen for fifty years."),
    nar("她身后，一个黑发的男人捧着一本没有字的书。他念一个字，她手里那顶荆棘冠就亮一下。", "Behind her, a dark-haired man holds a book with no words. Each word he reads makes the thorn crown in her hand glow."),
    say("evelyn", "正好拿来开刀。第一个倒下的人，要让所有人都看清楚。", "Then she's the one to start with. The first to fall should be seen by everyone.", face="serious"),
    nar("她戴上荆棘冠。尖刺扎进额角，渗出一滴血。她没有擦。", "She puts on the crown. A thorn pricks her temple; a drop of blood runs down. She doesn't wipe it."),
], [choice("ok", "expression", T("（合上这一页）", "(Close this page)"), [], [setv("flag.know_evelyn")], values=["ji"])], salience=1, cast=["evelyn"])

C1_BASEMENT = scene("c1_basement", "c1", "main", T("林家祖宅 · 地下室", "The Lin house · the basement"), [
    bg("oldhouse"),
    nar("客厅里，墙上一排相框全是空的。玻璃完好，里面只有发黄的衬纸。", "In the parlor every frame on the wall is empty. The glass is intact; only yellowed backing inside."),
    nar("地下室的门上，有一道粉笔画的符号：一个圆，里面一簇小小的火苗。我碰了一下，它亮了，门自己开了。", "On the basement door, a chalk sign: a circle with a small flame inside. I touch it; it glows; the door opens."),
    bg("basement"),
    nar("石砌的拱顶，四壁的书架，长桌上的天平和坩埚。长桌尽头，放着一盏摔坏的提灯。", "A stone vault, shelves on every wall, scales and crucibles on a long table. At its end, a broken lamp."),
    *iff(F("flag.tools"),
        nar("我把父亲的工具一样一样摆出来，像在手术台边摆器械。", "I lay out Dad's tools one by one, like instruments beside an operating table.")),
    nar("灯座底下刻着两个很潦草的字母：M. & S.", "Scratched under the base, two scrawled letters: M. & S."),
    cg("cg_mend_lamp"),
    nar("磨锈，掰正，点焊，换玻璃。最后是灯芯。我捏着那一小截焦黑的棉线，闭上眼睛——", "Sand the rust, straighten the frame, solder, new glass. Last, the wick. I pinch the scorched stub and close my eyes—"),
    nar("有什么东西在灯的深处醒了，一把抓住我，往里拉。成千上万盏灯，浮在黑暗里。", "Something deep in the lamp wakes and pulls me in. Thousands of lamps, floating in the dark."),
    cg("cg_lamp_lit"),
    show("lamp", "smile", "center"),
    say("lamp", "你修得真好。上一次有人把我修得这么好，还是很久以前的事。", "You mended me beautifully. The last time anyone did, it was a long time ago.", face="smile"),
    say("lamp", "我是这盏灯。十二件遗器之一，每六十年醒一次。今年是第六十年。", "I'm this lamp. One of twelve relics. I wake every sixty years. This is the sixtieth."),
    say("lamp", "谁先把五件握在手里，谁就能打开灰烬王冠，改写世界的一条规则。比如，让某个人从所有人的记忆里——", "Whoever holds five first can open the Ashen Crown and rewrite one rule of the world. Say, make someone vanish from everyone's—"),
    cgoff(),
    me("……消失。", "…memory."),
    say("lamp", "和我结契，我借你力量。你每一次用尽全力，我就从你那里拿走一段记忆。拿哪一段，由我挑。", "Bind yourself to me and I'll lend you power. Each time you go all out, I take one memory. I choose which.", face="serious"),
    say("lamp", "我只拿温暖的那些。", "I only take the warm ones."),
    nar("拱顶闷响了一声。石缝里漏下一线冷光。上面有个女人在笑：找到了——小灯笼。", "The vault booms. Cold light leaks through a crack. Above, a woman laughs: found you—little lantern."),
], [
    choice("accept", "dilemma", T("“我叫林栖。条件我接受。”", "'My name is Lin Qi. I accept.'"), [
        nar("黄铜的把手在我掌心发烫，像一颗心脏。白色的光顺着手臂往上爬。", "The brass handle burns in my palm like a heart. White light climbs my arm."),
        say("lamp", "契约成立。欢迎来到灰烬王冠之争，林栖。", "The pact is made. Welcome to the Ashen Crown war, Lin Qi."),
        nar("拱顶整块塌了下来。我把灯往上一举——光像一把伞撑开，碎石倒着飞了回去。", "The vault caves in. I lift the lamp—light opens like an umbrella, and the rubble flies back up."),
    ], [setv("flag.contract"), setv("flag.saw_initials"), rel("lamp", "trust", 1)], values=["yong"]),
    choice("refuse", "dilemma", T("“我不跟你做这种交易。”", "'I won't make that deal.'"), [
        say("lamp", "……那你今晚会死的。", "…Then you die tonight.", face="sad"),
        nar("拱顶塌下来的时候，我抱着那盏没有亮的灯，想起照片背面那行字。", "When the vault comes down, I'm holding the unlit lamp, thinking of the words on the back of the photo."),
    ], [setv("flag.dead_refuse")], values=["shou"], ends=True),
], order=2, cast=["lamp"])

C1_FIGHT = scene("c1_fight", "c1", "main", T("地下室 · 断剑", "The basement · the Broken Sword"), [
    bg("basement"),
    nar("皮靴踩着碎木头下楼。先下来的是一个很高的男人，络腮胡，酒保背心，两只拳头缠着绷带。", "Boots on splintered wood. First down is a very tall man: beard, bartender's vest, both fists taped."),
    show("gran", "normal", "left"),
    say("gran", "葛兰·霍克。在码头开酒吧，偶尔接点打架的活。", "Gran Hawke. Run a bar by the docks; take the odd fighting job."),
    show("sword", "smile", "right"),
    say("sword", "嗨，小灯笼。这就是你新挑的主人？一个修收音机的？", "Hi, little lantern. This is your new holder? A radio repairer?", face="smile"),
    say("gran", "把灯交出来，你回去修你的收音机，忘了今晚的事。", "Hand over the lamp. Go back to your radios and forget tonight."),
    me("不。", "No."),
    say("gran", "……断剑。", "…Sword.", face="serious"),
    nar("红发的女人一步跨出来，半截断剑划出一道冷白色的弧线。我手臂上的光纹一暗——有一根看不见的线被剪断了。", "The red-haired woman steps out; half a sword draws a cold white arc. The light-lines on my arm dim—an invisible thread has been cut."),
    say("lamp", "她能斩断连结。我们之间的线，她刚刚砍了一刀。", "She cuts connections. She just cut ours.", face="battle"),
    nar("断剑已经到了眼前。", "The blade is already in my face."),
], [
    choice("reconnect", "dilemma", T("看清断口，把线接回去——全力（会交出一段记忆）", "Find the break and join it—all out (costs a memory)"), [
        cg("cg_reconnect"),
        me("——接上！", "—Reconnect!"),
        nar("灯火炸开。有什么东西从我身体里被抽走了，很轻，很快，像风吹走一片叶子。", "Light bursts. Something is drawn out of me, light and quick, like wind taking a leaf."),
        nar("一个夏天的下午。院子里的梧桐树，一辆天蓝色的小自行车。有个人在后面扶着车座跟着我跑……那个人是谁？", "A summer afternoon. The plane tree, a little sky-blue bike. Someone running behind, holding the seat… who was it?"),
        lamp_takes("第一段。学骑车的下午。我收下了。", "The first. The afternoon you learned to ride. I'll keep it."),
        cgoff(),
        nar("断剑的刃停在我手腕上方一寸，被一层白光挡住了。", "The blade stops an inch above my wrist, held by a sheet of white light."),
        say("gran", "第一次就舍得交这么好的东西。小姑娘，你很想赢啊。明晚十二点，海滨游乐园，摩天轮底下。", "Giving up something that good your first time. You really want to win. Tomorrow at midnight, the seaside park, under the Ferris wheel.", face="serious"),
    ], [*forget("ride"), add("light", 1), setv("flag.met_gran"), rel("gran", "esteem", 1)], values=["yong"]),
    choice("talk", "strategy", T("“你不是为了自己要灯。你是为了她。”", "'You don't want the lamp for yourself. You want it for her.'"), [
        nar("刃停在半空。红发的女人愣了一下，回头看葛兰。", "The blade halts in midair. The red-haired woman freezes and looks back at Gran."),
        say("gran", "……你怎么知道？", "…How do you know that?", face="surprised"),
        me("你看她的眼神，和我看那张照片的眼神一样。", "You look at her the way I look at a photo."),
        say("sword", "哈。被一个修收音机的看穿了。", "Ha. Seen through by a radio repairer.", face="smile"),
        say("gran", "今晚不打了。明晚十二点，海滨游乐园，摩天轮底下。我们好好打一场。", "No fight tonight. Tomorrow at midnight, the seaside park, under the Ferris wheel. We'll do it properly."),
        say("lamp", "……你没用全力。我什么都没拿。", "…You didn't go all out. I took nothing.", face="surprised"),
    ], [setv("flag.met_gran"), setv("flag.talked_down"), rel("gran", "trust", 2), rel("lamp", "esteem", 1)], values=["xin"], when=F("flag.know_gran")),
    choice("shield", "strategy", T("不接线，把灯横过来硬挡", "Don't reconnect; block with the lamp itself"), [
        nar("断剑砍在灯上。灯没有碎，碎的是灯和我之间剩下的那一点连结。", "The sword strikes the lamp. The lamp doesn't break; what's left of the link between us does."),
        say("lamp", "林栖——", "Lin Qi—", face="sad"),
        nar("光灭了。地下室重新黑下来，只剩下皮靴踩在碎木头上的声音。", "The light goes out. The basement is dark again, only boots on splintered wood."),
    ], [setv("flag.dead_cut"), setv("flag.met_gran")], values=["shou"], ends=True),
], order=3, cast=["gran", "sword", "lamp"])

CHAPTERS = [
    {"id": "p", "title": T("序章", "Prologue"), "intro": [P(T("维斯特林，钟楼。", "Westerling, the clock tower."))], "offer": 0},
    {"id": "c1", "title": T("第一章 · 修灯的人", "Chapter 1 · The Lamp-Mender"), "intro": [P(T("第七次灰烬王冠之争，第一夜。", "The seventh Ashen Crown war, night one."))],
     "offer": 2},
]
NODES = [PROLOGUE, C1_SHOP, S1_BAR, S1_EICHE, C1_BASEMENT, C1_FIGHT]
DEAD = [
  {"id": "refuse", "flag": "flag.dead_refuse", "title": T("坏结局「地下室的灰」", "Bad End: Ash in the Basement"),
   "text": T("拱顶塌下来。第二天，林记修复的卷帘门没有拉开。没有人记得那家铺子原本是谁开的。", "The vault falls. Next day Lin's Repairs doesn't open. No one remembers who used to run it."),
   "clinic": T("灰色诊所里，戴圆框眼镜的医生推了推眼镜：“拒绝契约没有错，错在时机。那一晚，断剑已经找上门了。先活下来，代价以后再谈。——回到地下室，接受契约。”",
               "In the grey clinic, the doctor in round glasses pushes them up: 'Refusing the pact isn't wrong; the timing is. That night the Sword was already at the door. Live first; argue about the price later. —Go back to the basement and accept.'")},
  {"id": "cut", "flag": "flag.dead_cut", "title": T("坏结局「断线」", "Bad End: Severed"),
   "text": T("灯还在，契约断了。葛兰拎走了提灯。你回到铺子里，想不起来自己为什么要去祖宅。", "The lamp survives; the pact doesn't. Gran takes the Lamp. Back at the shop you can't remember why you went to the old house."),
   "clinic": T("穿蓝外套的女人坐在诊所的柜台后面：“断剑斩的是连结，挡是挡不住的。要么接回去，要么让她不想砍。你读过葛兰那一夜吗？”",
               "A woman in a blue coat sits behind the clinic counter: 'The Sword cuts connections; you can't block that. Either join it again, or make her not want to cut. Did you read Gran's night?'")},
]

"""第四章《断剑的愿望》（小说第四章，第五章开头）"""
from lib import *

BG = {"mural_alley": T("旧港区 · 涂鸦街", "Old harbor · Mural Street"), "hawke_study": T("霍克宅 · 书房", "Hawke house · the study")}
CG = {"cg_sealed": T("墨绿色的信", "The dark-green letter")}
FLAGS = [("flag.warned_carlo", "周五之前去找过卡罗", "Found Carlo before Friday"), ("flag.know_ink_rule", "知道墨水瓶要先写才成真", "Knows the Inkwell must write first"),
         ("flag.know_wish", "读过断剑的愿望", "Read the Sword's wish"), ("flag.know_hawke", "读过霍克宅那一夜", "Read the night at the Hawke house"),
         ("flag.go_early", "周五早一点去涂鸦街", "Went to Mural Street early on Friday"), ("flag.c4_done", "第四章走完", "Finished Chapter 4")]

S4_BAR = scene("s4_bar", "c4", "side", T("锚链酒吧 · 17:30（葛兰）", "The Anchor Chain · 17:30 (Gran)"), [
    bg("bar"),
    nar("葛兰擦同一张桌子擦了三遍。断剑坐在吧台尽头她的老位置上，面前一杯朗姆，一口没动。", "Gran wipes the same table three times. The Sword sits in her old seat at the end of the bar, a rum in front of her, untouched."),
    show("gran", "serious", "left"), show("sword", "sad", "right"),
    say("gran", "说吧。昨晚你为什么放水。", "Out with it. Why did you go easy last night?"),
    say("sword", "葛兰，你知道遗器会不会死吗？我们会被打碎，会被埋在泥里，会被忘掉几百年。可我们不会死。", "Gran, do you know if relics can die? We get smashed, buried in mud, forgotten for centuries. But we don't die."),
    say("sword", "我换过十一个主人。十一个人，每一个都在我身上交出了他们的恨。没有一个赢过。", "I've had eleven holders. Eleven people, and each of them handed me their hatred. Not one of them ever won."),
    say("sword", "我想死。不是被打碎，不是睡过去。是真正地死。能改写世界规则的东西，只有王冠。", "I want to die. Not smashed, not asleep. Really die. Only one thing can rewrite the world's rules: the Crown.", face="sad"),
    say("gran", "那你为什么不直接去求那个修灯的？", "Then why not just ask the lamp-mender?"),
    say("sword", "因为我更想让你赢。十一个主人，没有一个问过我想要什么。你是第一个给我倒酒的人。", "Because I'd rather you won. Eleven holders, and not one asked what I wanted. You're the first who ever poured me a drink.", face="smile"),
    nar("葛兰的喉咙一下子堵住了。", "Something catches in Gran's throat."),
], [choice("ok", "expression", T("（合上这一页）", "(Close this page)"), [], [setv("flag.know_wish"), rel("sword", "warmth", 1)], values=["ji"])], salience=2, cast=["gran", "sword"])

S4_HAWKE = scene("s4_hawke", "c4", "side", T("老城区 · 霍克宅 20:15（葛兰）", "Old town · the Hawke house, 20:15 (Gran)"), [
    bg("hawke_study"),
    nar("十五年前，他就是从这扇门里被赶出去的。书桌后面的皮椅上，坐着一个瘦得像干柴的老人。只有那双眼睛没变。", "Fifteen years ago he was thrown out through this door. In the leather chair behind the desk sits an old man, thin as kindling. Only the eyes haven't changed."),
    show("gran", "serious", "center"),
    nar("书架最上面一层，一个长条形的木匣子。盖子上刻着：霍克家第七代家主 · 阿尔伯特 · 断剑之主。", "On the top shelf, a long wooden case. Carved on the lid: Albert, Seventh Head of the House of Hawke · Master of the Broken Sword."),
    nar("匣子里铺着深红色的天鹅绒，绒面上有一道剑形的凹痕。凹痕里什么都没有。", "Inside, dark-red velvet pressed with the shape of a sword. The hollow is empty."),
    nar("“他输了，回来以后什么都不记得。他坐在窗前二十年，每天从这个匣子里‘拿出’一把剑来擦。临死前，他抓着我的手说：告诉她，对不起。”", "'He lost, and came home remembering nothing. He sat at that window twenty years, taking a sword out of this case every morning to polish. Before he died he gripped my hand and said: tell her I'm sorry.'"),
    say("gran", "我不是去跟他们打。我是去送一个朋友。一个喝了十年酒、从来没喝醉过的朋友。", "I'm not going to fight them. I'm going to see a friend off. One who's been drinking for ten years and never once got drunk."),
    nar("他走到门口。身后，父亲的声音很低：“三百一十七张。那天晚上，我数的是三百一十七张。那些符纸，我都留着。”", "At the door, his father's voice, very low: 'Three hundred and seventeen. That night I counted three hundred and seventeen. I kept every one of them.'"),
    nar("葛兰没有回头。他怕自己一看，就再也走不动了。", "Gran doesn't turn around. He's afraid that if he looks, he'll never be able to leave."),
    cg("cg_sealed"),
    nar("回到酒吧门口，一个报童模样的人递给他一个墨绿色的信封，蜡封上印着一架小小的天平：六十年前折断断剑的，是提灯的上一任主人。这一任提灯的主人，周五晚上会出现在旧港区的涂鸦街。", "Back at the bar, someone dressed as a paperboy hands him a dark-green envelope, sealed with a tiny pair of scales: The Lamp's last holder broke the Sword sixty years ago. Its current holder will be on Mural Street in the old harbor on Friday night."),
    cgoff(),
], [choice("ok", "expression", T("（合上这一页）", "(Close this page)"), [], [setv("flag.know_hawke"), rel("gran", "esteem", 1)], values=["ji"])], salience=1, cast=["gran"])

C4_SHOP = scene("c4_shop", "c4", "main", T("林记修复 · 第四天 14:00", "Lin's Repairs · day four, 14:00"), [
    bg("shop_day"),
    show("lamp", "normal", "center"),
    nar("下午的铺子很安静。我把一台收音机的后盖拆下来，又装回去，什么都没修。", "The shop is quiet in the afternoon. I take the back off a radio, put it on again, mend nothing."),
    say("lamp", "你在想白秋说的事。伊芙琳的下一个目标，是卡罗·文斯的墨水瓶。", "You're thinking about what Bai Qiu said. Evelyn's next target is Carlo Vince's Inkwell."),
    me("周五晚上。还有三天。", "Friday night. Three days."),
    say("lamp", "那不是你的仗。", "That isn't your fight."),
    me("如果她拿到第二件，就会去拿第三件。迟早轮到我。", "If she gets a second, she'll go for a third. Sooner or later it's me."),
], [
    choice("warn", "strategy", T("去旧港区找卡罗，提醒他", "Go to the old harbor and warn Carlo"), [
        bg("mural_alley"),
        show("carlo", "normal", "center"),
        nar("涂鸦街的尽头，一个荧光绿头发的年轻人蹲在脚手架上，往一面三层楼高的砖墙上喷鲸鱼的轮廓。", "At the end of Mural Street a young man with neon-green hair crouches on scaffolding, spraying the outline of a whale onto a three-story brick wall."),
        me("伊芙琳·冯·艾希周五会来拿你的墨水瓶。", "Evelyn von Eiche is coming for your Inkwell on Friday."),
        say("carlo", "让她来。周五我要让这条鲸鱼游出来，让整条街的人都看见。魔法师们藏了几百年，凭什么？", "Let her. On Friday this whale swims off the wall and the whole street sees it. Wizards have hidden for centuries. Why should they?", face="smile"),
        nar("他身边，一个戴眼镜的书记员从墨水瓶里探出半个身子，推了推眼镜。", "Beside him, a bespectacled clerk leans halfway out of an inkwell and pushes up his glasses."),
        say("ink", "写下来的东西会暂时成真。不过，得先写。", "What is written comes true for a while. But it has to be written first."),
        think("先写。写要时间，要手，要看得见写在哪里。", "Written first. Writing takes time, a hand, and somewhere to see it land."),
        me("那就别等她开口。先把字写好。", "Then don't wait for her to speak. Have your words ready."),
        say("carlo", "……你这人真奇怪。周五来看吧，修灯的。", "…You're a strange one. Come and watch on Friday, lamp-mender.", face="normal"),
    ], [setv("flag.warned_carlo"), setv("flag.know_ink_rule"), rel("lamp", "trust", 1)], values=["xin"]),
    choice("rest", "expression", T("留在铺子里，把身体和灯都养好", "Stay in the shop; let both body and lamp recover"), [
        nar("我把灯放在柜台上，用软布擦了一下午。灯芯的火苗慢慢站直了。", "I set the lamp on the counter and polish it all afternoon. The flame on the wick slowly straightens."),
        say("lamp", "……谢谢。很舒服。", "…Thanks. That's nice.", face="smile"),
    ], [add("light", 1), rel("lamp", "warmth", 1)], values=["shou"]),
], order=1, cast=["lamp"])

C4_NIGHT = scene("c4_night", "c4", "main", T("林记修复 · 周五 21:30", "Lin's Repairs · Friday, 21:30"), [
    bg("shop_night"),
    show("lamp", "normal", "center"),
    nar("周五。我把风衣穿上，把灯挂在腰上。", "Friday. I put on my coat and hang the lamp from my belt."),
    *iff(F("flag.warned_carlo"), nar("手机上有一条短信，号码不认识：今晚十点半，最大的那条。——卡罗", "A text from a number I don't know: Ten thirty tonight. The biggest one. —Carlo")),
    say("lamp", "林栖。如果今晚你要全力出手，告诉我一声。我好挑。", "Lin. If you go all out tonight, warn me. So I can choose.", face="sad"),
    me("挑什么？", "Choose what?"),
    say("lamp", "挑一段你最不会想念的。……虽然没有这种东西。", "One you'd miss least. …Though there's no such thing."),
], [
    choice("early", "strategy", T("早点出门，十点半之前到涂鸦街", "Leave early; reach Mural Street before ten thirty"), [
        nar("我抄近路下了坡。港口的风里有油漆味。", "I take the shortcut down the slope. The harbor wind smells of paint."),
    ], [setv("flag.go_early"), setv("flag.c4_done")], values=["yong"], when=F("flag.warned_carlo")),
    choice("late", "expression", T("等灯再亮一点再走", "Wait until the lamp is a little brighter"), [
        nar("等我出门，已经快十一点了。", "By the time I leave it's nearly eleven."),
    ], [add("light", 1), setv("flag.c4_done")], values=["shou"]),
], order=2, cast=["lamp"])

CHAPTERS = [{"id": "c4", "title": T("第四章 · 断剑的愿望", "Chapter 4 · The Sword's Wish"), "intro": [P(T("第四天。周五还有三天。", "Day four. Three days until Friday."))], "offer": 2}]
NODES = [S4_BAR, S4_HAWKE, C4_SHOP, C4_NIGHT]
DEAD = []

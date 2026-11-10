"""卷一《血字的研究》：霍普的供述（第二部“圣徒之国”由他亲口讲出来）、尾声。
第二部原著里的教团写法有偏见，这里只说“盐湖谷的那个教团”和“长老们”，不点真实教派和真实人物的名字（决策记录 v0.5）。
露西·费里尔只在霍普的讲述里出现，不画立绘，不写年龄。"""
from lib import *

CHAPTERS = [
    {"id": "c7", "title": T("第七章 · 圣徒之国", "Chapter 7 · The Country of the Saints"), "intro": [P(T("警察局，夜里。", "The police station, at night."))], "offer": 0, "main_first": True},
    {"id": "c8", "title": T("尾声", "Epilogue"), "intro": [P(T("几天以后。", "A few days later."))], "offer": 0, "main_first": True},
]

C7_HEART = scene("c7_heart", "c7", "main", T("车夫", "The Cabman"), [
    bg("station"),
    show("hope", "normal", "center"),
    say("hope", "我有话要说。你们这几位先生，是我的朋友也好，是我的对头也好，我都想让你们知道这件事是怎么回事。", "I've got a good deal to say. I want to tell you gentlemen all about it.", face="normal"),
    say("hope", "你们不用急着把我送上法庭。我活不到那一天了。……你是医生吧？", "You needn't be in such a hurry about a trial. I may never be tried. You're a medical man, aren't you?", face="normal"),
    me("是的。", "I am."),
    say("hope", "那你把手放在这儿。", "Then put your hand here.", face="normal"),
    nar("我把手放在他胸口。里面像是有一台破机器在猛烈地震动、嗡鸣。", "I did so, and became at once conscious of an extraordinary throbbing and commotion going on inside."),
], [
    choice("tell", "expression", T("告诉他实话：“主动脉瘤。随时会破。”", "Tell him the truth: \"An aortic aneurism. It may burst at any moment.\""), [
        say("hope", "我就知道。所以我想在死前把话说完，不想被人当成一个普通的杀人犯。", "That's it. So I want to leave some account of the business behind me. I don't want to be remembered as a common cut-throat.", face="sad"),
    ], [rel("hope", "trust", 1)], values=["zhen"]),
    choice("soften", "expression", T("“你需要休息。先别说太多。”", "\"You need rest. Don't say too much now.\""), [
        say("hope", "我休息得够久了，医生。二十年。", "I've rested long enough, Doctor. Twenty years.", face="sad"),
    ], [rel("hope", "warmth", 1)], values=["qing"]),
], order=1, cast=["hope", "holmes", "lestrade"])

C7_UTAH = scene("c7_utah", "c7", "main", T("盐湖谷", "The Valley of Salt"), [
    bg("utah"),
    say("hope", "很多年前，在北美的大荒原上，一个叫约翰·费里尔的人带着一个小女孩，快要渴死了。一个从东边迁来的教团救了他们，条件是入他们的教。", "Many years ago, out on the great alkali plain, a man named John Ferrier and a little girl were dying of thirst. A band of pilgrims bound for the West took them in — on condition that they joined their faith.", face="normal"),
    say("hope", "那个小女孩叫露西。他们在盐湖谷住了下来。露西长大了，成了那片山谷里最美的花。", "The little girl was Lucy. They settled in the valley of the great salt lake, and Lucy grew to be the flower of that valley.", face="normal"),
    say("hope", "我是在山路上遇见她的。她的马被牛群冲惊了，我把她拉了出来。……后来，我们订了婚。", "I met her on the mountain road, when her horse bolted among a drove of cattle and I pulled her clear. …Later, we were promised to each other.", face="smile"),
    say("hope", "可教团的长老们不准。他们要她嫁给教里的人：德雷伯家的儿子，或者斯坦格森家的儿子。限期一个月。", "But the Elders would not have it. She must marry within the faith: the son of Drebber or the son of Stangerson. They gave her a month.", face="angry"),
    say("hope", "我带他们父女连夜逃进山里。我出去找吃的，回来的时候，费里尔已经死了。露西被他们带走，嫁给了德雷伯。", "I got them away into the mountains by night. I went out to find food, and when I came back Ferrier was dead and Lucy was gone — carried back and married to Drebber.", face="sad"),
    say("hope", "不到一个月，她就死了。下葬的前一夜，我闯进去，从她手上取下了这枚戒指。我对着她发誓：他们欠的，要一个一个还。", "In less than a month she was dead. The night before the burial I broke in and took this ring from her finger. And I swore over her that they would pay.", face="angry"),
], [
    choice("sorry", "expression", T("“……我很遗憾。”", "\"…I am sorry.\""), [say("hope", "不必，医生。我要的不是可怜。", "Don't be, Doctor. It isn't pity I'm after.", face="sad")], [rel("hope", "warmth", 1)], values=["qing"]),
    choice("law", "dilemma", T("“可是，杀人就是杀人。”", "\"Still — murder is murder.\""), [say("hope", "你说得对。所以我把选择交给了上帝。", "You're right. That's why I left the choice to God.", face="normal")], [rel("hope", "esteem", 1)], values=["yi"]),
], order=2, cast=["hope"])

C7_NIGHT = scene("c7_night", "c7", "main", T("那一夜", "That Night"), [
    bg("lauriston_in"),
    say("hope", "我跟着他们追了二十年，从美国追到欧洲，钱用完了，就在伦敦赶马车。", "I followed them for twenty years, from America to Europe. When my money ran out I took to driving a cab in London.", face="normal"),
    say("hope", "那天夜里，德雷伯喝得烂醉，上了我的车。我把他拉到那座空屋，点上蜡烛，把露西的戒指举到他眼前。", "That night Drebber came out drunk and got into my cab. I drove him to the empty house, lit the candle, and held Lucy's ring before his eyes.", face="angry"),
    say("hope", "我拿出两颗药丸：一颗致命，一颗无害。我让他先挑，剩下那颗我吃。世上若有公道，就让上帝来裁决。", "I took out two pills: one death, one harmless. I made him choose, and I took the other. If there was any justice in the world, let God decide between us.", face="normal"),
    say("hope", "他挑错了。……我鼻子流血流得厉害，就蘸着血在墙上写了那个词，想让警察往秘密会社那边想。", "He chose wrong. …My nose was bleeding hard, and I wrote that word on the wall with it, to put the police on the wrong track — secret societies.", face="normal"),
    say("hope", "走出去才发现戒指丢了。我装成醉汉回去找，撞上了那个警察。来取戒指的“老太太”，是我的一个朋友。我不会说他是谁。", "Outside I found I'd lost the ring. I went back pretending to be drunk and ran into the constable. The 'old woman' who came for it was a friend of mine. I won't tell you who.", face="smile"),
], [
    choice("ask_friend", "expression", T("“你那位朋友，我们不会去找他。”", "\"We won't go looking for your friend.\""), [say("hope", "谢谢你，医生。", "Thank you, Doctor.", face="smile")], [rel("hope", "trust", 1)], values=["qing"]),
    choice("nothing", "expression", T("不说话，把他的话一字一句记下来。", "Say nothing. Write down every word."), [think("这些话，总得有人记下来。", "Someone had to write these words down.")], [setv("flag.notebook")], values=["ren"]),
], order=3, cast=["hope"])

C8_END = scene("c8_end", "c8", "main", T("倒着推理", "Reasoning Backwards"), [
    bg("baker_night"),
    nar("那天夜里，杰弗逊·霍普的动脉瘤破了。第二天早上，人们发现他躺在牢房的地板上，脸上带着平静的笑。", "That very night the aneurism burst, and Jefferson Hope was found in the morning stretched upon the floor of the cell, with a placid smile upon his face."),
    show("holmes", "normal", "center"),
    say("holmes", "解这类问题，最要紧的是能倒着推理。这本事很有用，也很简单，可人们很少练。", "In solving a problem of this sort, the grand thing is to be able to reason backwards. That is a very useful accomplishment, and a very easy one, but people do not practise it much.", face="normal"),
    say("holmes", "你看看这个。", "Look at this.", face="smile"),
    nar("他递给我一份《回声报》：“……这次破案，全靠苏格兰场的雷斯垂德和葛莱森两位探长精明能干……一位叫歇洛克·福尔摩斯的业余人士也提供了些许协助。”", "He handed me the Echo: '…the credit of the capture belongs entirely to the well-known Scotland Yard officials, Messrs Lestrade and Gregson… an amateur, one Mr Sherlock Holmes, has also shown some talent…'"),
    say("holmes", "这就是我们这项血字研究的结果：给他们挣了一份表彰！", "That's the result of all our Study in Scarlet: to get them a testimonial!", face="smile"),
], [
    choice("journal", "dilemma", T("“没关系。事情的经过都在我的日记里，大家总会知道的。”", "\"Never mind. I have all the facts in my journal, and the public shall know them.\""), [
        say("holmes", "……随你吧，医生。", "…Do as you please, Doctor.", face="smile"),
        cg("cg_journal"),
        think("就这样，我开始写下我和歇洛克·福尔摩斯的故事。", "And so I began to write down my adventures with Sherlock Holmes."),
    ], [setv("flag.journal"), rel("holmes", "warmth", 1)], values=["zhen"], ends=True),
    choice("laugh", "expression", T("“你一点也不在乎？”", "\"You don't mind at all?\""), [
        say("holmes", "我在乎的是案子本身。名声？让他们拿去吧。", "What I care for is the problem itself. The credit? Let them have it.", face="normal"),
    ], [rel("holmes", "trust", 1)], values=["ren"], ends=True),
], order=1, cast=["holmes"])

NODES = [C7_HEART, C7_UTAH, C7_NIGHT, C8_END]
FLAGS = [("flag.journal", "决定把案子写下来", "Decided to write the case down")]

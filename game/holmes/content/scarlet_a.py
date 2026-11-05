"""卷一《血字的研究》第一部分：序章、初见、演绎法。英文台词取原著原句（第一部第 1、2 章）。"""
from lib import *

CHAPTERS = [
    {"id": "p", "title": T("序章 · 伦敦", "Prologue · London"), "intro": [P(T("1881 年，伦敦。", "London, 1881."))], "offer": 0, "main_first": True},
    {"id": "c1", "title": T("第一章 · 歇洛克·福尔摩斯先生", "Chapter 1 · Mr Sherlock Holmes"), "intro": [P(T("圣巴托罗缪医院。", "St Bartholomew's Hospital."))], "offer": 0, "main_first": True},
    {"id": "c2", "title": T("第二章 · 演绎法", "Chapter 2 · The Science of Deduction"), "intro": [P(T("贝克街 221B。", "221B Baker Street."))], "offer": 0, "main_first": True},
]

P_RETURN = scene("p_return", "p", "main", T("序章 · 回到伦敦", "Prologue · Back in London"), [
    bg("street_fog"),
    nar("1878 年，我在伦敦大学拿到医学博士学位，随后作为军医去了阿富汗。", "In the year 1878 I took my degree of Doctor of Medicine of the University of London, and went out to Afghanistan as an army surgeon."),
    nar("迈万德一战，一颗子弹打碎了我的肩胛骨。后来又染上伤寒，几个月里生死难料。", "At the fatal battle of Maiwand I was struck on the shoulder by a Jezail bullet. Then came enteric fever, and for months my life was despaired of."),
    nar("军方给了我九个月的病假，送我回国。我在世界上无亲无故，就像所有闲人一样，被冲进了伦敦这个大污水坑。", "I was sent home with nine months' leave. Having neither kith nor kin in England, I naturally gravitated to London, that great cesspool into which all the loungers and idlers of the Empire are irresistibly drained."),
    think("钱快花光了。要么离开伦敦，要么换个便宜点的住处。", "My money is nearly gone. Either I leave London, or I find cheaper lodgings."),
    nar("就在我下定决心的那天，有人在克里特利安酒吧拍了拍我的肩。是小斯坦福，以前在巴茨医院给我当过助手。", "On the very day I made up my mind, someone tapped me on the shoulder at the Criterion Bar. It was young Stamford, who had been a dresser under me at Barts."),
    say("stamford", "华生，你这阵子都干什么去了？瘦得像根竹竿，黑得像颗栗子。", "Whatever have you been doing with yourself, Watson? You are as thin as a lath and as brown as a nut."),
    me("在找住处。想弄明白，在伦敦能不能用合理的价钱租到舒服的房间。", "Looking for lodgings. Trying to solve the problem as to whether it is possible to get comfortable rooms at a reasonable price."),
    say("stamford", "怪了，你是今天第二个跟我说这话的人。", "That's a strange thing. You are the second man to-day that has used that expression to me."),
    say("stamford", "医院化学实验室有个人，找到了一套好房子，可一个人付不起，正发愁找不到人合租。", "A fellow who is working at the chemical laboratory up at the hospital. He could not get someone to go halves with him in some nice rooms which he had found."),
    say("stamford", "不过……你还不认识歇洛克·福尔摩斯。他做长期室友，你未必受得了。", "You don't know Sherlock Holmes yet. Perhaps you would not care for him as a constant companion."),
], [
    choice("eager", "expression", T("“就是我了。我宁可有个伴，也不想一个人住。”", "\"I am the very man for him. I should prefer having a partner to being alone.\""), [
        say("stamford", "那好。不过以后合不来，可别怪我。", "Very well. But you mustn't blame me if you don't get on with him."),
    ], [], values=["qing"]),
    choice("ask", "expression", T("“他有什么毛病？别吞吞吐吐的。”", "\"What is there against him? Don't be mealy-mouthed about it.\""), [
        say("stamford", "他太讲科学了，近乎冷血。我能想象他给朋友下一小撮最新的植物碱——不是出于恶意，只是想弄清楚效果。", "Holmes is a little too scientific for my tastes — it approaches to cold-bloodedness. I could imagine his giving a friend a little pinch of the latest vegetable alkaloid, not out of malevolence, but simply out of a spirit of inquiry."),
        say("stamford", "我还亲眼见过他在解剖室里用棍子打尸体，为了看人死后还会不会出淤青。", "When it comes to beating the subjects in the dissecting-rooms with a stick… to verify how far bruises may be produced after death. I saw him at it with my own eyes."),
        think("……这倒让我更想见见他了。", "…That only makes me want to meet him more."),
    ], [setv("flag.heard_stick")], values=["zhen"]),
], order=1)

C1_LAB = scene("c1_lab", "c1", "main", T("“我找到了！”", "\"I've Found It!\""), [
    bg("lab"),
    nar("实验室又高又大，四壁摆满了瓶瓶罐罐。桌上是曲颈瓶、试管和冒着蓝色火苗的本生灯。", "It was a lofty chamber, lined and littered with countless bottles. Broad, low tables bristled with retorts, test-tubes, and little Bunsen lamps with their blue flickering flames."),
    nar("屋里只有一个人。听见脚步声，他回头一看，高兴地跳了起来。", "There was only one student in the room. At the sound of our steps he glanced round and sprang to his feet with a cry of pleasure."),
    show("holmes", "smile", "center"),
    say("holmes", "我找到了！我找到了！一种只和血红蛋白起反应的试剂，别的什么都不行！", "I've found it! I've found it! I have found a re-agent which is precipitated by haemoglobin, and by nothing else.", face="smile"),
    say("stamford", "华生医生，这位是歇洛克·福尔摩斯先生。", "Dr Watson, Mr Sherlock Holmes."),
    say("holmes", "你好。我看得出，你到过阿富汗。", "How are you? You have been in Afghanistan, I perceive.", face="normal"),
    me("你怎么知道的？", "How on earth did you know that?"),
    say("holmes", "不用管它。眼下的问题是血红蛋白。", "Never mind. The question now is about haemoglobin.", face="smile"),
    nar("他刺破自己的手指，把一滴血滴进一升清水，又撒进几粒白色晶体。水立刻变成了暗红褐色。", "He pricked his own finger, let a drop of blood fall into a litre of water, and threw in a few white crystals. In an instant the contents assumed a dull mahogany colour."),
    say("holmes", "有了这个检验法，世上不知多少逍遥法外的人早该伏法了。现在有了“福尔摩斯检验法”，以后就不难了。", "Had this test been invented, there are hundreds of men now walking the earth who would long ago have paid the penalty of their crimes. Now we have the Sherlock Holmes test, and there will no longer be any difficulty.", face="smile"),
    say("holmes", "我在贝克街看中了一套房子。你不介意浓烈的烟草味吧？我常摆弄化学药品，有时还做实验。我心情不好时会一连几天不开口。你有什么要坦白的？", "I have my eye on a suite in Baker Street. You don't mind the smell of strong tobacco, I hope? I generally have chemicals about, and occasionally do experiments. I get in the dumps at times, and don't open my mouth for days on end. What have you to confess now?", face="normal"),
], [
    choice("confess", "expression", T("老实说：“我养了只小斗牛犬，怕吵，起得没准，而且非常懒。”", "Be honest: \"I keep a bull pup, I object to rows, I get up at all sorts of ungodly hours, and I am extremely lazy.\""), [
        say("holmes", "你把拉小提琴也算在“吵”里吗？", "Do you include violin playing in your category of rows?", face="surprised"),
        me("那要看谁拉。拉得好是天上的享受，拉得不好……", "It depends on the player. A well-played violin is a treat for the gods — a badly-played one—"),
        say("holmes", "哦，那就没问题了。我想这事就算定了。", "Oh, that's all right. I think we may consider the thing as settled.", face="smile"),
    ], [rel("holmes", "warmth", 1)], values=["zhen"]),
    choice("guess", "dilemma", T("先别谈房子：“你是怎么看出阿富汗的？让我猜猜——”", "Not the rooms yet: \"How did you know about Afghanistan? Let me guess—\""), [
        me("是斯坦福告诉你的？", "Stamford told you?"),
        say("holmes", "斯坦福什么也没说。你回头自己想想。", "Stamford said nothing. Think it over for yourself.", face="smile"),
        think("他在考我。", "He is testing me."),
    ], [rel("holmes", "esteem", 1), setv("flag.asked_afghan")], values=["zhen"]),
    choice("cool", "expression", T("有所保留：“我们先看看房子再说。”", "Reserved: \"Let us see the rooms first.\""), [
        say("holmes", "明天中午来这里找我，一起去把事情定下来。", "Call for me here at noon to-morrow, and we'll go together and settle everything.", face="normal"),
    ], [rel("holmes", "trust", 1)], values=["ren"]),
], order=1, cast=["holmes"])

C2_BAKER = scene("c2_baker", "c2", "main", T("生活之书", "The Book of Life"), [
    bg("baker_day"),
    nar("贝克街 221B：两间舒适的卧室，一间宽敞通风的起居室，两扇大窗。我们当天就搬了进去。", "221B Baker Street: a couple of comfortable bedrooms and a single large airy sitting-room, illuminated by two broad windows. We moved in that very day."),
    show("hudson", "normal", "left"),
    say("hudson", "早饭在桌上了，医生。福尔摩斯先生天不亮就出去了。", "Breakfast is on the table, Doctor. Mr Holmes was out before it was light.", face="normal"),
    hide("hudson"),
    nar("几个星期过去，我对这位室友越来越好奇。他懂的东西多得惊人，不懂的东西也多得惊人。", "As the weeks went by, my curiosity about my companion deepened. His ignorance was as remarkable as his knowledge."),
    think("他竟然不知道地球绕着太阳转。他说知道了也会尽量把它忘掉——脑子是一间小阁楼，只该放有用的家具。", "He did not know that the earth travelled round the sun — and said he would do his best to forget it. A man's brain, to him, is a little empty attic, to be stocked only with useful furniture."),
    nar("一天早上，我拿起一本杂志，读到一篇叫《生活之书》的文章：观察入微的人，凭一个人的指甲、袖口、靴子，就能看出他的身世和职业。", "One morning I picked up a magazine and read an article entitled 'The Book of Life': by a man's finger-nails, by his coat-sleeve, by his boot, a man's calling is plainly revealed."),
    me("一派胡言！我这辈子没读过这么荒唐的东西。", "What ineffable twaddle! I never read such rubbish in my life."),
    show("holmes", "normal", "center"),
    say("holmes", "那篇文章是我写的。", "I wrote the article myself.", face="normal"),
    say("holmes", "我有一门自己的职业。我想全世界只有我一个干这一行——我是咨询侦探。", "I have a trade of my own. I suppose I am the only one in the world. I'm a consulting detective.", face="normal"),
    say("holmes", "你刚到时我说你从阿富汗来，你很吃惊。其实我一眼就知道：一位医务界的绅士，却有军人气概——军医。脸黑，手腕白，刚从热带回来。面容憔悴，吃过苦、生过病。左臂受过伤，动作僵硬。英国军医在热带吃苦受伤，还能在哪儿？阿富汗。", "Here is a gentleman of a medical type, but with the air of a military man. Clearly an army doctor, then. He has just come from the tropics, for his face is dark, and that is not the natural tint of his skin, for his wrists are fair. He has undergone hardship and sickness, as his haggard face says clearly. His left arm has been injured. Where in the tropics could an English army doctor have seen much hardship and got his arm wounded? Clearly in Afghanistan.", face="smile"),
    iff(F("flag.asked_afghan"), think("原来如此。我那天猜的是斯坦福，差得远了。", "So that was it. I had guessed Stamford. I was nowhere near.")),
    nar("我走到窗前。街对面，一个穿着朴素、身材魁梧的人拿着一个蓝色大信封，正一边走一边看门牌号。", "I walked over to the window. Across the street a stalwart, plainly-dressed man with a large blue envelope was walking slowly, looking anxiously at the numbers."),
    me("不知道那个人在找什么。", "I wonder what that fellow is looking for?"),
    say("holmes", "你是说那位退伍的海军陆战队中士？", "You mean the retired sergeant of Marines?", face="normal"),
    think("吹牛。他知道我没法核实。", "Brag and bounce! He knows that I cannot verify his guess."),
], [
    choice("test", "dilemma", T("等那人上楼，当面问他是干什么的。", "When the man comes up, ask him his trade to his face."), [
        nar("敲门声，楼梯上沉重的脚步。那人把信递给福尔摩斯。", "A loud knock, heavy steps on the stair. The man handed my friend the letter."),
        me("请问，伙计，你是干哪一行的？", "May I ask, my lad, what your trade may be?"),
        say(None, "当差的，先生。制服送去修了。以前是皇家海军陆战队轻步兵的中士，先生。", "Commissionaire, sir. Uniform away for repairs. A sergeant, sir, Royal Marine Light Infantry, sir."),
        nar("他立正、敬礼，走了。", "He clicked his heels together, raised his hand in a salute, and was gone."),
        say("holmes", "你也看见了，华生：手背上的锚形刺青，军人的姿态和络腮胡，中年人的端正和威严。", "You saw it yourself, Watson: a great blue anchor tattooed on the back of his hand, the military carriage, regulation side whiskers, a man of some self-importance and a certain air of command.", face="smile"),
        think("我服了。", "I was won over."),
    ], [rel("holmes", "esteem", 1), rel("holmes", "warmth", 1), setv("flag.saw_sergeant")], values=["zhen"]),
    choice("say", "expression", T("直说：“你那是瞎猜，谁都没法证实。”", "Say it: \"That is a random shot. No one can check it.\""), [
        say("holmes", "那就等他上来，你自己问。", "Then wait until he comes up, and ask him yourself.", face="smile"),
        nar("那人果然是退伍的海军陆战队中士。福尔摩斯什么也没说，只是把信拆开了。", "He was indeed a retired sergeant of Marines. Holmes said nothing; he only opened the letter."),
        think("……我输了，输得很难看。", "…I had lost, and lost badly."),
    ], [rel("holmes", "esteem", -1), rel("holmes", "trust", 1)], values=["zhen"]),
    choice("look", "expression", T("不说话，自己仔细看那个人。", "Say nothing. Study the man yourself."), [
        think("步子很稳，背挺得很直。手背上……那是个刺青吗？", "A steady stride, a very straight back. On the back of his hand… is that a tattoo?"),
        nar("那人上楼送信，说自己是退伍的海军陆战队中士。我看了福尔摩斯一眼，他也正看着我。", "He came up with the letter and said he was a retired sergeant of Marines. I glanced at Holmes; he was looking at me."),
        say("holmes", "你看见锚了。很好，华生。你看了，而且开始观察了。", "You saw the anchor. Good, Watson. You see, and you are beginning to observe.", face="smile"),
    ], [rel("holmes", "esteem", 1), add("deduce", 1), setv("flag.saw_sergeant")], values=["ren"]),
], order=1, cast=["holmes", "hudson"])

NODES = [P_RETURN, C1_LAB, C2_BAKER]
FLAGS = [("flag.heard_stick", "听斯坦福讲过福尔摩斯打尸体", "Heard Stamford's story of the stick"),
         ("flag.asked_afghan", "当面问过阿富汗是怎么看出来的", "Asked Holmes how he knew about Afghanistan"),
         ("flag.saw_sergeant", "亲眼看清了那位海军陆战队中士", "Saw the sergeant of Marines for himself")]

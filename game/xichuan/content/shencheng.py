"""沈澄线：第五至七章（决策记录 v0.8）。前夜去了海堤（flag.route_shencheng）才会进；和夏知遥线共用第五至七章的章节，各自的场景只在自己的线里出现。
她是留下来的人，你是走掉的人。这条线的结是：老房子卖不卖——你是不是又要走。
第五章 第一排：七年前的约兑现了；散场后她说“两清了”，又问你是不是要卖老房子。
第六章 七封信：收拾咖啡馆时掉出一个旧可可罐，里面是七个信封，一年一封，从没寄出；这一周和她做一件事（三选一）。
第七章 第七个春天：买家来签字的那天；夜里的海堤，第七个信封。
好结局「第八封信」：好感 ≥8、信任 ≥4、没有卖房子（flag.c_keep）。三样都到，海堤上才出现“这一封我们一起写”；否则她把信全给你，从此不再写（普通结局「没有寄出的信」）。"""
from lib import *

ON = F("flag.route_shencheng")
GOOD = ALL(AT("shencheng", "intimacy", 4), AT("shencheng", "trust", 2), F("flag.c_keep"))

# ---------------- 第五章 · 第一排 ----------------
C5_FRONT = scene("c5_front", "c5", "main", T("第一排", "The Front Row"), [
    bg("cinema_night"),
    nar("最后一场。铁椅子坐满了，后来的人站到了海堤上。", "The last show. Every iron seat is taken; latecomers stand along the seawall."),
    nar("第一排最左边的两个位置，椅背上用粉笔写着：“留座”。", "On the two seats at the far left of the front row, someone has chalked on the backs: 'Reserved.'"),
    show("shencheng", "normal", "center"),
    say("shencheng", "……别看了。是我写的。", "…Stop staring. I wrote it.", face="shy"),
    say("shencheng", "七年前，我们就坐在这两个位置。", "Seven years ago, these were our seats.", face="normal"),
    cg("cg_front_row"),
    nar("电影开始了。放到一半，我的肩膀一沉——是她的头。她没睡着，眼睛睁着，看着银幕。", "The film begins. Halfway through, my shoulder grows heavy—her head. She isn't asleep. Her eyes are open, on the screen."),
    say("shencheng", "（小声）七年前那天，你在这里睡着了。我哭了。", "(quietly) Seven years ago, you fell asleep right here. And I cried.", face="sad"),
    say("shencheng", "你知道我为什么哭吗？", "Do you know why I cried?", face="normal"),
    cgoff(),
], [
    choice("leaving", "dilemma", T("“因为第二天，我就要走了。”", "\"Because the next day, I was leaving.\""), [
        say("shencheng", "……原来你知道。", "…So you did know.", face="surprised"),
        say("shencheng", "你那天睡得那么香。我一边看电影，一边想：明天开始，这个人就不在了。", "You were sleeping so soundly. And I sat there watching the film, thinking: starting tomorrow, he won't be here.", face="sad"),
    ], [rel("shencheng", "trust", 1), rel("shencheng", "intimacy", 1)], values=["ti"]),
    choice("ask", "dilemma", T("“我不知道。你告诉我。”", "\"I don't know. Tell me.\""), [
        say("shencheng", "……说出来，就不算了。", "…If I say it, it won't count.", face="sad"),
        say("shencheng", "不过今天的电影放完了，约也兑现了。那就说吧。", "But today's film is nearly over, and the promise has been kept. So I'll say it.", face="normal"),
        say("shencheng", "因为我一直以为，你会回来。可是看着你睡着的样子，我突然知道，你不会了。", "Because I'd always believed you'd come back. But watching you sleep, I suddenly knew you wouldn't.", face="sad"),
    ], [rel("shencheng", "intimacy", 2), setv("flag.c_asked")], values=["cheng"]),
    choice("film", "expression", T("“因为电影太难过了吧。”", "\"Because the film was sad, I guess.\""), [
        say("shencheng", "……嗯。就当是吧。", "…Mm. Let's say that.", face="normal"),
        nar("她把头从我肩膀上抬起来，坐直了。", "She lifts her head from my shoulder and sits up straight."),
    ], [rel("shencheng", "warmth", -1)], values=["xi"]),
], order=1, when=ON, cast=["shencheng"])

C5_EVEN = scene("c5_even", "c5", "main", T("两清", "Even"), [
    bg("street"),
    nar("散场后，我送她回咖啡馆。和七年前一样的路。", "After the show I walk her back to the café. The same road as seven years ago."),
    show("shencheng", "normal", "center"),
    say("shencheng", "约兑现了。陆远，我们两清了。", "The promise is kept. Lu Yuan, we're even now.", face="smile"),
    say("shencheng", "……下午有个中介来店里，问你那栋老房子什么时候能看。", "…A real estate agent came by the café this afternoon. Asked when they could view that old house of yours.", face="normal"),
    think("城里的公司只给了我两个月假。回来之前，我是打算把房子卖掉的。", "My company in the city only gave me two months' leave. Before I came back, I'd planned to sell the house."),
    say("shencheng", "要卖了，对吧。看完影院最后一场，你就又要走了。", "You're selling, aren't you. Once you've seen the cinema's last show, you'll leave again.", face="sad"),
], [
    choice("undecided", "dilemma", T("“我还没想好。……这是实话。”", "\"I haven't decided. …That's the truth.\""), [
        say("shencheng", "嗯。你没摸耳朵。", "Mm. You didn't touch your ear.", face="normal"),
        say("shencheng", "那等你想好了，第一个告诉我。别让我从中介嘴里听到。", "Then when you've decided, tell me first. Don't let me hear it from some agent.", face="sad"),
    ], [rel("shencheng", "trust", 1), setv("flag.c_honest")], values=["cheng"]),
    choice("promise", "dilemma", T("“不卖了。我不走了。”", "\"I'm not selling. I'm not leaving.\""), [
        say("shencheng", "……不卖了？", "…You're not selling?", face="surprised"),
        say("shencheng", "七年前，你也说过你会回来。", "Seven years ago, you said you'd come back, too.", face="sad"),
        say("shencheng", "别随口答应我。我已经不是会相信这种话的小孩了。", "Don't promise me things off the cuff. I'm not a kid who believes that kind of thing anymore.", face="angry"),
    ], [rel("shencheng", "intimacy", 1), setv("flag.c_rash")], values=["yong"]),
    choice("visit", "expression", T("“卖了以后，我也会常回来看你。”", "\"Even if I sell, I'll come back to see you often.\""), [
        say("shencheng", "……常回来。", "…'Often.'", face="normal"),
        say("shencheng", "晚安，陆远。", "Good night, Lu Yuan.", face="smile"),
        nar("风铃响了一下，门关上了。", "The wind chime rings once, and the door closes."),
    ], [rel("shencheng", "intimacy", -1), rel("shencheng", "trust", -1), setv("flag.c_cold")], values=["xi"]),
], order=2, when=ON, cast=["shencheng"])

# ---------------- 第六章 · 七封信 ----------------
C6_TIN = scene("c6_tin", "c6", "main", T("可可罐", "The Cocoa Tin"), [
    bg("cafe"),
    nar("影院开拆那周，沈澄的咖啡馆也要重新装修。打烊以后，我留下来帮她搬柜子。", "The week the cinema comes down, Shen Cheng's café is being renovated too. After closing I stay to help her move the cabinets."),
    show("shencheng", "normal", "right"),
    iff(F("flag.c_cold"), nar("那天晚上以后，她给我端咖啡，只说一句“请慢用”。和对任何一个客人都一样。", "Since that night, when she brings me coffee she says only 'Enjoy.' The same as with any other customer.")),
    nar("最上面一格，掉下来一个旧可可罐，盖子摔开了。里面是一叠信封。", "From the top shelf an old cocoa tin falls, and the lid pops off. Inside is a stack of envelopes."),
    nar("七个。每一个上面写着一行字：“第一个春天”“第二个春天”……一直到“第七个春天”。最后一个，是空的，没有封口。", "Seven of them. Each one bears a single line: 'The first spring,' 'The second spring'… all the way to 'The seventh spring.' The last one is empty, and unsealed."),
    nar("收信人那一栏，写的都是我的名字。没有地址。", "In the space for the addressee, every one has my name. No address."),
    show("shencheng", "surprised", "right"),
    say("shencheng", "……别看。", "…Don't look.", face="surprised"),
], [
    choice("wait", "dilemma", T("一封也不打开，把它们一个个捡起来放回罐子里，等她开口。", "Open none of them. Pick them up one by one, put them back in the tin, and wait for her to speak."), [
        nar("我把盖子盖好，递给她。她接过去，抱在怀里，很久没说话。", "I put the lid back on and hand it to her. She takes it and holds it against her chest, silent for a long time."),
        say("shencheng", "……每年春天，影院开始放电影的那天，我写一封。", "…Every spring, on the day the cinema started showing films again, I wrote one.", face="sad"),
        say("shencheng", "不知道寄到哪里。所以就放在这里。", "I didn't know where to send them. So I kept them here.", face="normal"),
        say("shencheng", "今年的那一封……还没写。", "This year's… I haven't written yet.", face="shy"),
    ], [rel("shencheng", "trust", 1), rel("shencheng", "intimacy", 1), setv("flag.c_letters")], values=["ti"]),
    choice("ask", "dilemma", T("“这些……是写给我的？”", "\"Are these… for me?\""), [
        say("shencheng", "……是。", "…Yes.", face="shy"),
        say("shencheng", "可是不给你看。一封都不给。", "But you're not reading them. Not a single one.", face="angry"),
        say("shencheng", "里面有骂你的，有……别的。总之不给。", "Some of them call you names. Some of them are… other things. Anyway, no.", face="shy"),
    ], [rel("shencheng", "intimacy", 2), setv("flag.c_letters")], values=["cheng"]),
    choice("read", "expression", T("捡起“第一个春天”那一封，拆开。", "Pick up 'The first spring' and open it."), [
        say("shencheng", "陆远！", "Lu Yuan!", face="angry"),
        nar("她一把夺了过去。信封的一角，被撕开了一道口子。", "She snatches it out of my hand. One corner of the envelope is torn."),
        say("shencheng", "……你走吧。今天不用帮忙了。", "…Go. You don't need to help tonight.", face="sad"),
    ], [rel("shencheng", "trust", -2), setv("flag.c_tore")], values=["xi"]),
], order=1, when=ON, cast=["shencheng"])

S6_CATS = scene("c6_cats", "c6", "side", T("三花的孙子", "The Calico's Grandkits"), [
    bg("seawall_night"),
    nar("海堤上，那只最小的猫一直跟着沈澄走。", "On the seawall, the smallest of the cats keeps following Shen Cheng."),
    show("shencheng", "normal", "center"),
    say("shencheng", "装修的时候，店里不能养。可是不管它，它活不过这个夏天。", "I can't keep it at the café during the renovation. But if no one takes it, it won't make it through the summer.", face="sad"),
], [
    choice("adopt", "dilemma", T("“放我那里吧。老房子有院子。”", "\"Let it stay with me. The old house has a yard.\""), [
        say("shencheng", "……你那里？", "…With you?", face="surprised"),
        say("shencheng", "养猫要很久的。十几年。你想好了？", "A cat is a long time. Over ten years. Have you thought this through?", face="normal"),
        say("shencheng", "……那我每天去喂。你不在的时候也去。", "…Then I'll come feed it every day. Even when you're not around.", face="smile"),
    ], [rel("shencheng", "intimacy", 1), rel("shencheng", "trust", 1), setv("flag.c_cat")], values=["gu"]),
    choice("name", "expression", T("“先给它起个名字。叫‘七’怎么样？”", "\"Let's name it first. How about 'Seven'?\""), [
        say("shencheng", "……七。", "…Seven.", face="normal"),
        say("shencheng", "好听。可是名字起了，就得负责了。", "It's a nice name. But once you've named it, you're responsible for it.", face="sad"),
    ], [rel("shencheng", "intimacy", 1)], values=["xi"]),
], order=1, salience=1, when=ON, cast=["shencheng"])

S6_HOUSE = scene("c6_house", "c6", "side", T("老房子的阁楼", "The Attic of the Old House"), [
    bg("oldhouse"),
    nar("中介要来看房，我只好收拾老房子。沈澄提着水桶来了，说是“顺路”。", "The agent is coming to view the place, so I have to clean up the old house. Shen Cheng turns up with a bucket, says she was 'passing by.'"),
    show("shencheng", "normal", "center"),
    nar("阁楼的箱子里，有一把小小的黄色雨伞。伞柄上贴着一张褪色的贴纸：一只三花猫。", "In a box in the attic there's a small yellow umbrella. On the handle, a faded sticker: a calico cat."),
    say("shencheng", "……这是我的。你走的那天下雨，我把伞给你了。", "…That's mine. It rained the day you left, so I gave you my umbrella.", face="surprised"),
], [
    choice("return", "dilemma", T("“七年了。现在还给你。”", "\"Seven years late. I'm giving it back.\""), [
        say("shencheng", "……不要。", "…I don't want it.", face="sad"),
        say("shencheng", "还给我了，就真的两清了。你留着。", "If you give it back, we really will be even. You keep it.", face="shy"),
    ], [rel("shencheng", "intimacy", 2), setv("flag.c_umbrella")], values=["cheng"]),
    choice("keep", "expression", T("把伞放回箱子里：“这个，不卖。”", "Put the umbrella back in the box: \"This isn't for sale.\""), [
        say("shencheng", "那房子呢？", "And the house?", face="normal"),
        think("我没有回答。她也没有再问。", "I don't answer. She doesn't ask again."),
    ], [rel("shencheng", "intimacy", 1), rel("shencheng", "trust", 1), setv("flag.c_umbrella")], values=["ti"]),
], order=2, salience=1, when=ON, cast=["shencheng"])

S6_COCOA = scene("c6_cocoa", "c6", "side", T("一块棉花糖", "One Marshmallow"), [
    bg("cafe"),
    nar("装修前的最后一天营业。沈澄说，要教我做那杯热可可。", "The café's last day of business before the renovation. Shen Cheng says she'll teach me how to make that hot cocoa."),
    show("shencheng", "smile", "center"),
    say("shencheng", "可可粉两勺，牛奶别煮开。棉花糖最后放。", "Two spoons of cocoa, and don't let the milk boil. The marshmallow goes in last.", face="smile"),
    iff(F("flag.cheng_coffee"), say("shencheng", "你回来那天点的时候，我手都在抖。七年没人点过了。", "The day you came back and ordered it, my hands were shaking. No one had ordered it in seven years.", face="shy")),
], [
    choice("two", "dilemma", T("做好以后，放两块棉花糖，推到她面前。", "When it's done, put in two marshmallows and slide it across to her."), [
        say("shencheng", "……给我的？", "…For me?", face="surprised"),
        say("shencheng", "我从来没喝过自己做的。……甜死了。", "I've never had one I made myself. …It's sickeningly sweet.", face="shy"),
        nar("她一口一口，全喝完了。", "She drinks every last sip."),
    ], [rel("shencheng", "intimacy", 2)], values=["wen"]),
    choice("menu", "strategy", T("“装修以后，把它写进菜单吧。”", "\"After the renovation, put it on the menu.\""), [
        say("shencheng", "写什么名字？", "What would we call it?", face="normal"),
        me("就叫“第一排”。", "Call it 'The Front Row.'"),
        say("shencheng", "……俗。不过，可以。", "…Corny. But fine.", face="smile"),
    ], [rel("shencheng", "trust", 1), rel("shencheng", "esteem", 1), rel("shencheng", "intimacy", 1)], values=["gu"]),
], order=3, salience=1, when=ON, cast=["shencheng"])

# ---------------- 第七章 · 第七个春天 ----------------
C7_SIGN = scene("c7_sign", "c7", "main", T("签字的那天", "The Day of the Signing"), [
    bg("oldhouse"),
    nar("周五下午，中介带着买家来了。合同摊在院子里的石桌上，枇杷树的影子落在纸上。", "Friday afternoon, the agent brings the buyer. The contract is laid out on the stone table in the yard, the loquat tree's shadow falling across the page."),
    nar("“签了字，下个月就能过户。”中介把笔递给我。", "'Sign here, and the transfer goes through next month.' The agent holds out a pen."),
    iff(F("flag.c_cat"), nar("院子角落里，那只叫“七”的小猫正在睡觉。", "In a corner of the yard, the little cat called Seven is asleep.")),
    iff(F("flag.c_umbrella"), think("阁楼的箱子里，还有一把黄色的伞。", "Up in the attic, in a box, there's still a yellow umbrella.")),
    iff(F("flag.c_rash"), think("那天晚上，我随口说过“不卖了”。她说她不信。", "That night I said 'I'm not selling' without thinking. She said she didn't believe me.")),
    iff(F("flag.c_honest"), think("她说过：想好了，第一个告诉她。", "She said: when you've decided, tell me first.")),
    think("沈澄没有来。她说今天店里忙。", "Shen Cheng didn't come. She said the café was busy today."),
], [
    choice("keep", "dilemma", T("把笔还给中介：“对不起。不卖了。”", "Hand the pen back to the agent: \"I'm sorry. I'm not selling.\""), [
        nar("买家骂了几句，走了。中介摇着头，把合同收回了包里。", "The buyer grumbles a few words and leaves. The agent shakes his head and puts the contract back in his bag."),
        nar("我给城里的公司发了一封辞职信。发完以后，手机在手里攥了很久。", "I send my resignation to the company in the city. Afterward, I hold the phone in my hand for a long time."),
        iff(F("flag.c_honest"), think("然后，我拨了她的号码。答应过的：第一个告诉她。", "Then I dial her number. I promised: she'd be the first to know.")),
    ], [rel("shencheng", "trust", 1), setv("flag.c_keep")], values=["gu"]),
    choice("later", "strategy", T("“再给我一周。”", "\"Give me another week.\""), [
        nar("中介答应了，脸色不太好看。买家说，一周以后不签，他就买别家的。", "The agent agrees, though he doesn't look pleased. The buyer says if it isn't signed in a week, he'll buy elsewhere."),
    ], [rel("shencheng", "trust", -1)], values=["ti"]),
    choice("sign", "expression", T("签字。", "Sign."), [
        nar("我签了名字。笔尖划过纸的声音，比想象中响。", "I sign my name. The scratch of the nib across the paper is louder than I expected."),
    ], [setv("flag.c_sold"), rel("shencheng", "intimacy", -1)], values=["xi"]),
], order=1, when=ON, cast=["shencheng"])

C7_LETTER = scene("c7_letter", "c7", "main", T("第七个信封", "The Seventh Envelope"), [
    bg("seawall_night"),
    nar("夜里，沈澄在海堤上等我。手里拿着那个可可罐。", "That night, Shen Cheng waits for me on the seawall, the cocoa tin in her hands."),
    show("shencheng", "normal", "center"),
    iff(F("flag.c_keep"), say("shencheng", "中介来店里了，说你把买家气走了。……笨蛋。", "The agent came by the café. Said you drove the buyer off. …Idiot.", face="shy")),
    iff(F("flag.c_sold"), say("shencheng", "听说签了。……挺好的。城里的工作，不能丢。", "I heard you signed. …That's good. You can't lose that job in the city.", face="smile")),
    iff(ALL(NF("flag.c_keep"), NF("flag.c_sold")), say("shencheng", "听说你让人家再等一周。……你总是让人等。", "I heard you asked them to wait another week. …You're always making people wait.", face="sad")),
    say("shencheng", "这七封信，我想了很久要怎么办。", "I've thought for a long time about what to do with these seven letters.", face="normal"),
    iff(F("flag.c_letters"), say("shencheng", "那天你一封都没拆。……谢谢。", "That day you didn't open a single one. …Thank you.", face="shy")),
    iff(F("flag.c_tore"), say("shencheng", "被你撕开的那一封，我用胶带粘好了。", "The one you tore open—I taped it back together.", face="sad")),
    iff(F("flag.c_asked"), say("shencheng", "第一排那晚，你问我为什么哭。我只说了一半。另一半，都在这里面。", "That night in the front row, you asked why I cried. I only told you half. The other half is all in here.", face="normal")),
    say("shencheng", "第七个信封是空的。今年，我写不出来了。", "The seventh envelope is empty. This year, I couldn't write it.", face="sad"),
], [
    choice("together", "dilemma", T("“那第七封，我们一起写。写好了，寄到老房子去。”", "\"Then we'll write the seventh one together. And mail it to the old house.\""), [
        say("shencheng", "……寄到老房子？", "…To the old house?", face="surprised"),
        say("shencheng", "寄信要走七百米，送信的会骂人的。", "That's seven hundred meters for the mailman. He'll curse us.", face="smile"),
        cg("cg_seawall"),
        nar("她打开罐子，把空的那个信封拿出来，和笔一起放在我手里。", "She opens the tin, takes out the empty envelope, and puts it in my hand together with a pen."),
        say("shencheng", "第一句，你写。我等了七年，就等这一句。", "You write the first line. I've waited seven years for that line.", face="shy"),
        me("“我回来了。这次，不走了。”", "'I'm back. This time, I'm staying.'"),
        say("shencheng", "……嗯。", "…Mm.", face="smile"),
        say("shencheng", "欢迎回来，阿远。", "Welcome back, Yuan.", face="smile"),
        nar("那是七年来，她第一次叫我的小名。", "It's the first time in seven years she's called me by my childhood name."),
        cgoff(),
    ], [setv("flag.c_good"), rel("shencheng", "intimacy", 1)], values=["cheng"], when=GOOD),
    choice("take", "expression", T("接过可可罐。", "Take the cocoa tin."), [
        say("shencheng", "都给你。……从今往后，我不写了。", "They're all yours. …From now on, I won't write any more.", face="smile"),
        say("shencheng", "一路顺风，陆远。", "Safe travels, Lu Yuan.", face="normal"),
        nar("她转身走了。海风很大，罐子在我手里很轻。", "She turns and walks away. The sea wind is strong, and the tin is very light in my hands."),
    ], [setv("flag.c_normal")]),
], order=2, when=ON, cast=["shencheng"])

NODES = [C5_FRONT, C5_EVEN, C6_TIN, S6_CATS, S6_HOUSE, S6_COCOA, C7_SIGN, C7_LETTER]
FLAGS = [("flag.c_asked", "问她七年前为什么哭", "Asked why she cried seven years ago"), ("flag.c_honest", "说“我还没想好”", "Said 'I haven't decided'"),
         ("flag.c_rash", "随口说“不卖了”", "Said 'I'm not selling' off the cuff"), ("flag.c_cold", "说卖了也会常回来", "Said he'd visit often even after selling"),
         ("flag.c_letters", "没有拆她的信", "Didn't open her letters"), ("flag.c_tore", "撕开了一封信", "Tore open one of her letters"), ("flag.c_cat", "收养了小猫“七”", "Took in the kitten Seven"),
         ("flag.c_umbrella", "找到了那把黄色的伞", "Found the yellow umbrella"), ("flag.c_keep", "没有卖老房子", "Didn't sell the old house"),
         ("flag.c_sold", "卖了老房子", "Sold the old house"), ("flag.c_good", "和她一起写第七封信", "Wrote the seventh letter with her"),
         ("flag.c_normal", "接过了可可罐", "Took the cocoa tin")]
CG = {"cg_front_row": T("第一排", "The front row"), "cg_seawall": T("第七封信", "The seventh letter")}
ENDINGS = [
    {"id": "shencheng_good", "title": T("沈澄 · 好结局「第八封信」", "Shen Cheng · Good Ending: The Eighth Letter"),
     "text": T("第二年春天，咖啡馆重新开张，菜单最上面多了一行：“第一排——热可可，一块棉花糖”。可可罐还在柜子最高的那一格，里面有八个信封。第八封寄出去了，走了七百米，从咖啡馆到老房子。上面只写了一句：“今天也在。”",
               "The next spring the café reopens, with a new line at the top of the menu: 'The Front Row—hot cocoa, one marshmallow.' The cocoa tin still sits on the highest shelf, and now it holds eight envelopes. The eighth one was actually mailed: seven hundred meters, from the café to the old house. It says only: 'Still here today.'"),
     "when": F("flag.c_good")},
    {"id": "shencheng_normal", "title": T("沈澄 · 普通结局「没有寄出的信」", "Shen Cheng · Normal Ending: Letters Never Sent"),
     "text": T("回到城里以后，我把七封信一封一封读完了。骂我的那些，骂得很准；别的那些，我读了很多遍。第二年春天，我收到一张明信片，背面是汐川的海，没有署名。我知道是谁。可是这一次，她没有写“等你”。",
               "Back in the city, I read the seven letters, one after another. The ones that call me names are accurate. The others, I read many times. The next spring, a postcard arrives: the sea at Xichuan on the front, no signature. I know who it's from. But this time, she didn't write 'waiting for you.'"),
     "when": F("flag.c_normal")},
]

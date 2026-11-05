"""共通线第二至第四章（决策记录 v0.4）。第四章末“最后一场放映的前夜”按好感分歧。"""
from lib import *

WARM = lambda c: AT(c, "intimacy", 1)          # 在意以上（好感 ≥ 2）
ROUTE = lambda c: AT(c, "intimacy", 2)         # 进她的线要「心动」以上（好感 ≥ 4）

# ---------------- 第二章 · 第一场放映 ----------------
C2_SCREEN = scene("c2_screening", "c2", "main", T("第一场放映", "The First Screening"), [
    bg("cinema_dusk"),
    iff(NF("flag.joined_club"), nar("那天之后，我还是去填了表。夏知遥在教学楼门口堵了我三天。", "In the end I filled in the form anyway. Xia Zhiyao staked out the lecture building for three days straight.")),
    nar("周六傍晚。潮声影院的铁椅子被我们擦了一下午，还是锈的。", "Saturday evening. We spent the whole afternoon wiping down the Tidesound's iron chairs. They're still rusty."),
    show("zhou", "normal", "left"),
    say("zhou", "你就是老陆的孙子？长得不像他。眼睛像。", "So you're old Lu's grandson? You don't look like him. The eyes, maybe.", face="normal"),
    say("zhou", "放映室的钥匙，你爷爷说过，哪天你回来了就给你。……喏。", "Your grandfather said if you ever came back, I was to give you the booth key. …Here.", face="smile"),
    hide("zhou"),
    nar("七点。来的人一共五个：两对情侣，一个遛狗的大爷。", "Seven o'clock. Five people come in all: two couples and an old man walking his dog."),
    show("zhiyao", "smile", "center"),
    say("zhiyao", "五个人也是观众！春季放映会，第一场，开始！", "Five people is still an audience! The Spring Screenings, first night—let's begin!", face="smile"),
    show("shencheng", "normal", "right"),
    say("shencheng", "……我妈让我送的。热饮，给看电影的人。", "…My mom told me to bring these. Hot drinks, for the audience.", face="normal"),
    iff(F("flag.cheng_coffee"), say("shencheng", "热可可也有。棉花糖，只放了一块。", "There's cocoa too. Only one marshmallow this time.", face="shy")),
    hide("shencheng"),
    cg("cg_first_screening"),
    nar("银幕亮了。海风把光吹得有点晃。放到一半，放映室那边传来一声闷响——画面停住，烧出一个白洞。", "The screen lights up. The sea wind makes the light waver a little. Halfway through, a dull snap comes from the booth—the picture freezes and a white hole burns through it."),
    cgoff(),
    show("zhiyao", "surprised", "center"),
    say("zhiyao", "断片了……", "The film broke…", face="surprised"),
], [
    choice("splice", "dilemma", T("跑去放映室，帮季白接片。", "Run to the booth and help Ji Bai splice the film."), [
        bg("projection"), show("jibai", "normal", "center"),
        say("jibai", "按住这里。对，别抖。", "Hold it here. Yes. Don't shake.", face="normal"),
        nar("她的手很稳。三分钟后，银幕重新亮了起来。", "Her hands are steady. Three minutes later the screen lights up again."),
        say("jibai", "……你的手，比我想的稳。", "…Your hands are steadier than I expected.", face="smile"),
    ], [rel("jibai", "intimacy", 1), rel("jibai", "esteem", 1)], values=["ti"]),
    choice("stage", "dilemma", T("跳上台，陪夏知遥对观众说话救场。", "Jump onto the stage and help Zhiyao keep the audience."), [
        show("zhiyao", "surprised", "center"),
        me("各位，趁换片的时间，我们社长讲讲这部电影的幕后故事。", "Everyone—while we change the reel, our president will tell you the story behind this film."),
        say("zhiyao", "我？！……好、好吧！这部片子拍的时候，导演其实——", "Me?! …O-okay! When they shot this one, the director actually—", face="shy"),
        nar("她讲得磕磕绊绊，可五个观众，一个都没走。", "She stumbles through it, but of the five people watching, not one leaves."),
        say("zhiyao", "（小声）……谢了。", "(quietly) …Thanks.", face="smile"),
    ], [rel("zhiyao", "intimacy", 1), rel("zhiyao", "trust", 1)], values=["yong"]),
    choice("walk", "dilemma", T("看见沈澄提着空保温桶往外走，追上去送她回家。", "See Shen Cheng leaving with the empty flask, and walk her home."), [
        bg("street"), show("shencheng", "normal", "center"),
        say("shencheng", "不看完？", "Not staying to the end?", face="surprised"),
        me("断片了。正好。", "The film broke. Good timing."),
        say("shencheng", "……你小时候，也总是电影放到一半就跑出来找我。", "…When we were kids, you'd always run out halfway through a film to come find me.", face="sad"),
        nar("一路上她没再说话。到了店门口，她说了声“晚安”，声音比白天软一点。", "She doesn't say another word the whole way. At the café door she says 'good night,' a little softer than by day."),
    ], [rel("shencheng", "intimacy", 1), rel("shencheng", "warmth", 1), add("rumor", 1)], values=["wen"]),
], order=1, cast=["zhiyao", "shencheng", "jibai", "zhou"])

S2_ZHIYAO = scene("c2_ledger", "c2", "side", T("社团活动室", "The Club Room"), [
    bg("clubroom"),
    nar("活动室里，夏知遥对着一本账本算了很久。", "In the club room, Xia Zhiyao has been staring at a ledger for a long time."),
    show("zhiyao", "sad", "center"),
    say("zhiyao", "租发电机、买胶片、印海报……最后一场想放得像样，至少要三千。", "Generator rental, film stock, posters… if the last screening's going to look decent, we need three thousand at least.", face="sad"),
    nar("她的手机响了。她看了一眼，按掉了。", "Her phone rings. She glances at it and declines the call."),
    say("zhiyao", "……推销电话。", "…Telemarketer.", face="normal"),
    think("那个备注，写的是“妈”。", "The contact name said 'Mom.'"),
], [
    choice("money", "strategy", T("“三千块，我们一起想办法。”", "\"Three thousand. We'll figure it out together.\""), [
        say("zhiyao", "你有办法？", "You have a plan?", face="surprised"),
        me("老周说，放映室里有我爷爷的旧海报。拿去义卖。", "Old Zhou says the booth is full of my grandfather's old posters. We sell them for charity."),
        say("zhiyao", "……陆远，你偶尔还挺靠得住的嘛。", "…Lu Yuan, you're actually reliable sometimes.", face="smile"),
    ], [rel("zhiyao", "esteem", 1), rel("zhiyao", "intimacy", 1), setv("flag.poster_sale")], values=["yong"]),
    choice("call", "dilemma", T("“刚才那个电话，是你妈妈吧？”", "\"That call just now—that was your mom, wasn't it?\""), [
        say("zhiyao", "……啊。", "…Oh.", face="surprised"),
        say("zhiyao", "你眼睛真尖。没事，她就是想问我吃饭了没。", "You've got sharp eyes. It's nothing. She just wanted to know if I'd eaten.", face="sad"),
        nar("她把手机屏幕朝下扣在了桌上。", "She sets the phone face down on the table."),
    ], [rel("zhiyao", "trust", 1), setv("flag.knows_mom")], values=["cheng"]),
], order=1, salience=1, cast=["zhiyao"])

S2_CHENG = scene("c2_seawall", "c2", "side", T("海堤上的猫", "Cats on the Seawall"), [
    bg("seawall_night"),
    nar("夜里的海堤上，沈澄蹲着喂几只流浪猫。", "On the seawall at night, Shen Cheng is crouched, feeding a few stray cats."),
    show("shencheng", "normal", "center"),
    say("shencheng", "它们是那只三花的孙子辈。你走的那年，它刚生。", "They're the grandkids of that calico. The year you left, she'd just had her litter.", face="normal"),
    say("shencheng", "……你走的那天，你说过一句话。你还记得吗？", "…The day you left, you said something to me. Do you remember?", face="sad"),
    think("我拼命地想。只想得起那天下雨，站台上很多人。", "I search my memory as hard as I can. All I recall is that it rained, and the platform was crowded."),
], [
    choice("honest", "dilemma", T("“……对不起，我想不起来。”", "\"…I'm sorry. I can't remember.\""), [
        say("shencheng", "嗯。我猜也是。", "Mm. I figured.", face="sad"),
        say("shencheng", "没关系。想不起来的话，就别硬想。……说出来就不算了。", "It's fine. If you can't remember, don't force it. …If I tell you, it won't count.", face="normal"),
    ], [rel("shencheng", "trust", 1), rel("shencheng", "intimacy", 1)], values=["cheng"]),
    choice("bluff", "expression", T("“当然记得。”", "\"Of course I remember.\""), [
        say("shencheng", "是吗。那你说说看。", "Really? Then tell me.", face="angry"),
        nar("我说不出来。她站起来，拍了拍裙子上的灰。", "I can't. She stands up and brushes the dust off her skirt."),
        say("shencheng", "撒谎的时候，你还是会摸耳朵。", "You still touch your ear when you lie.", face="sad"),
    ], [rel("shencheng", "trust", -1), add("rumor", 1)], values=["xi"]),
], order=2, salience=1, cast=["shencheng"])

S2_JIBAI = scene("c2_library", "c2", "side", T("图书馆的角落", "A Corner of the Library"), [
    bg("library"),
    nar("图书馆三楼最里面，季白在翻一本很旧的胶片修复手册。", "On the library's third floor, in the farthest corner, Ji Bai is leafing through a very old film-restoration manual."),
    show("jibai", "normal", "center"),
    say("jibai", "陆同学。你祖父……是个什么样的人？", "Mr. Lu. What was your grandfather like?", face="normal"),
    say("jibai", "我修他的胶片两年了。每一盘的接缝都整整齐齐，只有一盘，接得乱七八糟。像是手在抖。", "I've been restoring his film for two years. Every splice is perfectly neat—except on one reel. That one's a mess. As if his hands were shaking.", face="sad"),
    iff(F("flag.saw_reel"), think("第七卷。那盘没有标签的。", "Reel seven. The one with no label.")),
], [
    choice("tell", "expression", T("讲小时候爷爷带你在放映室过夜的事。", "Tell her how your grandfather let you spend nights in the booth as a kid."), [
        say("jibai", "……原来放映室那张小床，是给你的。", "…So the little cot in the booth was for you.", face="surprised"),
        say("jibai", "我一直以为，是给他自己的。", "I always assumed it was his.", face="smile"),
    ], [rel("jibai", "intimacy", 1), rel("jibai", "warmth", 1)], values=["wen"]),
    choice("ask", "dilemma", T("“你为什么这么在意那盘胶片？”", "\"Why do you care so much about that reel?\""), [
        say("jibai", "……因为它是唯一一盘，我不知道里面是什么的。", "…Because it's the only reel I don't know the contents of.", face="normal"),
        say("jibai", "修胶片的人，最怕的就是这个。", "For someone who restores film, that's the most frightening thing there is.", face="shy"),
    ], [rel("jibai", "trust", 1)], values=["cheng"]),
], order=3, salience=1, cast=["jibai"])

# ---------------- 第三章 · 第三个社员 ----------------
C3_MEMBER = scene("c3_member", "c3", "main", T("第三个社员", "The Third Member"), [
    bg("office"),
    nar("四月初，学生处来了通知：电影社月底前凑不齐三个人，就撤销，影院的场地使用证明也一起作废。", "Early April, a notice from Student Affairs: if the film club doesn't have three members by month's end, it's dissolved—and its permit to use the cinema goes with it."),
    show("zhiyao", "sad", "center"),
    say("zhiyao", "还差一个。就差一个。", "One more. Just one more.", face="sad"),
    iff(F("flag.poster_sale"), say("zhiyao", "义卖的钱够了，可是没有人，钱也没用。", "The poster sale raised the money—but without members, money's no use.", face="sad")),
    say("zhiyao", "陆远，你帮我去问一个人。谁都行。", "Lu Yuan, go ask someone for me. Anyone.", face="normal"),
], [
    choice("jibai", "dilemma", T("去放映室问季白。", "Go ask Ji Bai in the booth."), [
        bg("projection"), show("jibai", "surprised", "center"),
        say("jibai", "我？我说过，我不是社员。", "Me? I told you, I'm not a member.", face="surprised"),
        me("现在开始是。你修了两年它的胶片，它的最后一场，你不在名单上，说不过去。", "Starting now, you are. You've spent two years restoring its film. It wouldn't be right if your name wasn't on the list for its last show."),
        say("jibai", "……你很会说话。", "…You're good with words.", face="shy"),
        say("jibai", "好。不过放映员的活儿，我照样要拿工钱。", "Fine. But I still expect to be paid for the projection work.", face="smile"),
    ], [rel("jibai", "intimacy", 1), rel("jibai", "trust", 1), setv("flag.third_jibai")], values=["cheng"]),
    choice("cheng", "dilemma", T("去咖啡馆问沈澄。", "Go ask Shen Cheng at the café."), [
        bg("cafe"), show("shencheng", "normal", "center"),
        say("shencheng", "电影社？", "The film club?", face="surprised"),
        say("shencheng", "……潮声影院的最后一场，我本来就要去的。", "…I was going to be at the Tidesound's last show anyway.", face="sad"),
        say("shencheng", "表给我。", "Give me the form.", face="normal"),
        think("她填表的时候，把我的名字那一栏看了很久。", "As she fills it in, she looks at the line with my name on it for a long time."),
    ], [rel("shencheng", "intimacy", 1), setv("flag.third_cheng")], values=["ti"], req=AT("shencheng", "trust", 1), hint=T("她现在还不肯理你", "She won't give you the time of day yet")),
    choice("hang", "expression", T("拉室友程航来凑数。", "Drag your roommate Cheng Hang in to make up the numbers."), [
        bg("campus"), show("chenghang", "smile", "center"),
        say("chenghang", "电影社？女生多吗？——三个？！而且都……兄弟，我入了！", "The film club? Lots of girls?—Three of them?! And they're all… Buddy, I'm in!", face="smile"),
        show("zhiyao", "angry", "left"),
        say("zhiyao", "……陆远，你就找了这么个人？", "…Lu Yuan, this is who you found?", face="angry"),
        say("zhiyao", "算了，能签字就行。", "Fine. As long as he can sign his name.", face="normal"),
    ], [rel("zhiyao", "esteem", -1), rel("chenghang", "warmth", 1), setv("flag.third_hang")], values=["xi"]),
], order=1, cast=["zhiyao", "jibai", "shencheng", "chenghang"])

S3_ZHIYAO = scene("c3_rooftop", "c3", "side", T("天台的午饭", "Lunch on the Roof"), [
    bg("rooftop"),
    nar("中午，夏知遥拉我上了教学楼天台。她带了两个饭团。", "At noon Xia Zhiyao drags me up to the roof of the teaching building. She's brought two rice balls."),
    show("zhiyao", "smile", "center"),
    say("zhiyao", "从这里能看见潮声影院的银幕。看，那个白点。", "You can see the Tidesound's screen from here. Look—that white dot.", face="smile"),
    say("zhiyao", "……陆远，毕业以后，你会留在汐川吗？", "…Lu Yuan, after graduation—will you stay in Xichuan?", face="normal"),
    iff(F("flag.knows_mom"), think("我想起那个被她按掉的电话。", "I think of the call she declined.")),
], [
    choice("ask_back", "dilemma", T("“那你呢？”", "\"What about you?\""), [
        say("zhiyao", "我啊……", "Me…", face="sad"),
        say("zhiyao", "我要回家了。我妈一个人，身体不太好。", "I'm going home. My mom's on her own, and her health isn't great.", face="sad"),
        say("zhiyao", "所以影院的最后一场，也是我的最后一场。……别告诉别人。", "So the cinema's last show is my last show too. …Don't tell anyone.", face="normal"),
    ], [rel("zhiyao", "intimacy", 1), rel("zhiyao", "trust", 1), setv("flag.zhiyao_secret")], values=["cheng"]),
    choice("joke", "expression", T("“看你留不留。”", "\"Depends on whether you do.\""), [
        say("zhiyao", "……哼。", "…Hmph.", face="shy"),
        say("zhiyao", "笨蛋。饭团要掉了。", "Idiot. You're about to drop your rice ball.", face="shy"),
    ], [rel("zhiyao", "intimacy", 1)], values=["xi"]),
], order=1, salience=1, cast=["zhiyao"])

S3_CHENG = scene("c3_photo", "c3", "side", T("打烊以后", "After Closing"), [
    bg("cafe"),
    nar("打烊以后，沈澄把一张照片推到我面前。照片上是两个小孩，坐在潮声影院的第一排。", "After closing, Shen Cheng slides a photo across to me. Two kids, sitting in the front row of the Tidesound."),
    show("shencheng", "normal", "center"),
    say("shencheng", "这是你走之前一个月拍的。你爷爷拍的。", "This was taken a month before you left. Your grandfather took it.", face="normal"),
    cg("cg_photo"),
    think("我想起来了。那天放的是一部很老的片子，我睡着了，醒来的时候，她在哭。", "I remember now. They were showing a very old film, I fell asleep, and when I woke up she was crying."),
    cgoff(),
    say("shencheng", "你那天说：“等这座影院要关的时候，最后一场，我一定回来陪你看。”", "That day you said: 'When this cinema closes, I'll come back for its last show. I'll watch it with you. I promise.'", face="sad"),
], [
    choice("keep", "dilemma", T("“这一次，我说话算数。”", "\"This time, I'll keep my word.\""), [
        say("shencheng", "……七年才兑现的约，算吗？", "…Does a promise count if it takes seven years?", face="sad"),
        say("shencheng", "算吧。", "I suppose it does.", face="smile"),
    ], [rel("shencheng", "intimacy", 2), setv("flag.cheng_promise")], values=["cheng"]),
    choice("sorry", "expression", T("“对不起，让你等了这么久。”", "\"I'm sorry I made you wait so long.\""), [
        say("shencheng", "我没在等。", "I wasn't waiting.", face="angry"),
        say("shencheng", "……只是每年春天，都会去看一眼影院还在不在。", "…I just went to check every spring whether the cinema was still there.", face="shy"),
    ], [rel("shencheng", "intimacy", 1), rel("shencheng", "warmth", 1)], values=["wen"]),
], order=2, salience=1, cast=["shencheng"], when=AT("shencheng", "trust", 1))

S3_JIBAI = scene("c3_storeroom", "c3", "side", T("第七个架子", "The Seventh Shelf"), [
    bg("storeroom"),
    nar("影院仓库里很暗。季白站在第七个架子前面，手里拿着那盘胶片。", "The cinema's storeroom is dark. Ji Bai stands before the seventh shelf with the reel in her hands."),
    show("jibai", "sad", "center"),
    say("jibai", "影院拆了，这盘胶片就没有地方放了。", "Once the cinema's gone, there'll be nowhere left to run this reel.", face="sad"),
    say("jibai", "陆同学，你是他的孙子。放不放，应该你来定。", "Mr. Lu, you're his grandson. Whether it gets run should be your decision.", face="normal"),
], [
    choice("together", "dilemma", T("“最后一场之前，我们一起看。”", "\"Before the last show, we'll watch it together.\""), [
        say("jibai", "……一起？", "…Together?", face="surprised"),
        say("jibai", "好。那我先把它修好。一格都不会少。", "All right. Then I'll restore it first. Not a single frame missing.", face="smile"),
    ], [rel("jibai", "intimacy", 2), setv("flag.reel_together")], values=["yong"]),
    choice("leave", "expression", T("“他说别放，那就别放吧。”", "\"He said not to run it. So let's not.\""), [
        say("jibai", "……嗯。", "…Mm.", face="sad"),
        nar("她把胶片放回了架子上，动作很轻，像放下一个睡着的人。", "She sets the reel back on the shelf, gently, like laying down someone asleep."),
    ], [rel("jibai", "trust", 1)], values=["ti"]),
], order=3, salience=1, cast=["jibai"])

# ---------------- 第四章 · 前夜 ----------------
C4_EVE = scene("c4_eve", "c4", "main", T("最后一场放映的前夜", "The Night Before the Last Show"), [
    bg("cinema_night"),
    nar("四月最后一个周五。明天，是潮声影院的最后一场放映。下周一，拆迁队就会进场。", "The last Friday of April. Tomorrow is the Tidesound Cinema's final screening. Next Monday, the demolition crew moves in."),
    nar("海报贴满了半个汐川。夏知遥说，明天至少会来两百个人。", "Posters cover half of Xichuan. Zhiyao says at least two hundred people will come tomorrow."),
    iff(F("flag.saw_last_spring"), nar("海报最上面印着一行字：“来看它最后一个春天。”——是我第一天在这里说的话。", "Across the top of every poster is one line: 'Come see its last spring.' The words I said here on my first day.")),
    iff(F("flag.third_hang"), show("chenghang", "smile", "right"), say("chenghang", "两百个？我在论坛上发了帖，保底三百。别谢我，谢我的号召力。", "Two hundred? I posted on the forum. Three hundred, minimum. Don't thank me—thank my reach.", face="smile"), hide("chenghang")),
    show("zhou", "normal", "center"),
    say("zhou", "你爷爷要是看见了，得哭。", "If your grandfather could see this, he'd cry.", face="smile"),
    say("zhou", "去吧。今晚，总有人在等你。", "Go on. Tonight, someone's bound to be waiting for you.", face="normal"),
    hide("zhou"),
    think("今晚，我想去见的是——", "Tonight, the one I want to see is—"),
], [
    choice("zhiyao", "dilemma", T("去银幕下面。夏知遥一定还在排练。", "Go to the stage below the screen. Zhiyao will still be rehearsing."), [
        show("zhiyao", "sad", "center"),
        say("zhiyao", "……你来了。", "…You came.", face="sad"),
        say("zhiyao", "我一个人练了一晚上开场白。每次念到“最后一季”，就念不下去。", "I've been practicing the opening speech all night on my own. Every time I get to 'final season,' I can't go on.", face="sad"),
        iff(F("flag.zhiyao_secret"), say("zhiyao", "你知道的。这也是我的最后一季。", "You know why. It's my final season too.", face="sad")),
    ], [setv("flag.route_zhiyao"), rel("zhiyao", "intimacy", 1)], when=ROUTE("zhiyao")),
    choice("shencheng", "dilemma", T("去海堤。沈澄说过，她每年春天都会去看影院还在不在。", "Go to the seawall. Shen Cheng said she checks every spring that the cinema's still there."), [
        show("shencheng", "normal", "center"),
        say("shencheng", "……我就知道。", "…I knew it.", face="smile"),
        iff(F("flag.cheng_promise"), say("shencheng", "明天。七年前你说的那一场，就是明天。", "Tomorrow. The show you promised seven years ago—it's tomorrow.", face="shy")),
        iff(F("flag.third_cheng"), say("shencheng", "社员证我带着。明天我坐第一排，你别想跑。", "I've got my membership card. I'm sitting in the front row tomorrow, so don't you dare run off.", face="smile")),
    ], [setv("flag.route_shencheng"), rel("shencheng", "intimacy", 1)], when=ROUTE("shencheng")),
    choice("jibai", "dilemma", T("去放映室。灯还亮着。", "Go to the booth. The light's still on."), [
        show("jibai", "normal", "center"),
        say("jibai", "我修好了。第七卷。……要看吗？", "I've finished it. Reel seven. …Do you want to see it?", face="normal"),
        iff(F("flag.reel_together"), say("jibai", "你说过，要一起看。我一个人的时候，一格都没看。", "You said we'd watch it together. On my own, I haven't looked at a single frame.", face="shy")),
        iff(F("flag.third_jibai"), say("jibai", "做了社员以后，我第一次有了放映室的钥匙。……今晚，我想用它。", "Since becoming a member, I have my own key to the booth for the first time. …Tonight I wanted to use it.", face="smile")),
    ], [setv("flag.route_jibai"), rel("jibai", "intimacy", 1)], when=ROUTE("jibai")),
    choice("alone", "expression", T("回老房子。明天还要早起。", "Go back to the old house. It's an early start tomorrow."), [
        bg("oldhouse"),
        nar("院子里的枇杷树沙沙地响。我躺在小时候的床上，听了一夜的海。", "The loquat tree rustles in the yard. I lie in my childhood bed and listen to the sea all night."),
    ], [setv("flag.route_none")]),
], order=1, cast=["zhou", "zhiyao", "shencheng", "jibai"])

CHAPTERS = [
    {"id": "c2", "title": T("第二章 · 第一场放映", "Chapter 2 · The First Screening"), "intro": [P(T("三月第二周。", "The second week of March."))], "offer": 3, "main_first": True},
    {"id": "c3", "title": T("第三章 · 第三个社员", "Chapter 3 · The Third Member"), "intro": [P(T("四月。", "April."))], "offer": 3, "main_first": True},
    {"id": "c4", "title": T("第四章 · 前夜", "Chapter 4 · The Eve"), "intro": [P(T("四月最后一周。", "The last week of April."))], "offer": 0},
]
NODES = [C2_SCREEN, S2_ZHIYAO, S2_CHENG, S2_JIBAI, C3_MEMBER, S3_ZHIYAO, S3_CHENG, S3_JIBAI, C4_EVE]
FLAGS = [("flag.poster_sale", "用爷爷的旧海报义卖", "Sold grandfather's old posters for charity"), ("flag.knows_mom", "知道了知遥妈妈的事", "Learned about Zhiyao's mother"),
         ("flag.third_jibai", "季白成了第三个社员", "Ji Bai became the third member"), ("flag.third_cheng", "沈澄成了第三个社员", "Shen Cheng became the third member"),
         ("flag.third_hang", "程航成了第三个社员", "Cheng Hang became the third member"), ("flag.zhiyao_secret", "知道知遥毕业要回家", "Knows Zhiyao is going home after graduation"),
         ("flag.cheng_promise", "想起了七年前的约定", "Remembered the promise from seven years ago"), ("flag.reel_together", "答应和季白一起看第七卷", "Promised to watch reel seven with Ji Bai"),
         ("flag.route_zhiyao", "进入夏知遥线", "Entered Zhiyao's route"), ("flag.route_shencheng", "进入沈澄线", "Entered Shen Cheng's route"),
         ("flag.route_jibai", "进入季白线", "Entered Ji Bai's route"), ("flag.route_none", "前夜一个人回家", "Went home alone on the eve")]
BG = {"street": T("夜里的海边街道", "Seaside street at night"), "clubroom": T("社团活动室", "Club room"), "seawall_night": T("夜里的海堤", "The seawall at night"),
      "library": T("图书馆三楼", "Library, third floor"), "office": T("学生处", "Student Affairs office"), "rooftop": T("教学楼天台", "Rooftop"),
      "storeroom": T("影院仓库", "Cinema storeroom"), "cinema_night": T("潮声影院 · 夜", "Tidesound Cinema · night")}
CG = {"cg_first_screening": T("第一场放映", "The first screening"), "cg_photo": T("那张旧照片", "The old photo")}

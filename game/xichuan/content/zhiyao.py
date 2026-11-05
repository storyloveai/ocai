"""夏知遥线：第五至七章（决策记录 v0.7）。只有前夜选了“去银幕下面”（flag.route_zhiyao）才会进；其他人这三章的场景都不出现，直接到结局。
第五章 最后一场：开场白念不下去时你怎么帮她；散场后她说出要走，你怎么接。
第六章 七天：拆迁那天剪下一块银幕；这一周和她去做一件事（三选一）。
第七章 第七个春天：走前一夜的雨；早上的站台。
好结局要三样都到：好感「倾心」（≥8）、信任「可托」（≥4）、雨夜说了“我留下来”。告白的选项只在三样都到时出现，不到就只能挥手（普通结局）。"""
from lib import *

ON = F("flag.route_zhiyao")
GOOD = ALL(AT("zhiyao", "intimacy", 4), AT("zhiyao", "trust", 2), F("flag.z_stay"))

# ---------------- 第五章 · 最后一场 ----------------
C5_LAST = scene("c5_last", "c5", "main", T("最后一场", "The Last Show"), [
    bg("cinema_night"),
    nar("晚上六点半，铁椅子坐满了。后来的人站在最后一排后面，再后来的人，坐到了海堤上。", "Six-thirty in the evening, and every iron seat is taken. Latecomers stand behind the back row; the ones after them sit along the seawall."),
    iff(F("flag.third_hang"), show("chenghang", "smile", "right"), say("chenghang", "三百二十七个。我数了两遍。", "Three hundred and twenty-seven. I counted twice.", face="smile"), hide("chenghang")),
    nar("老周坐在第一排正中间。那是爷爷以前的位置。", "Old Zhou sits dead center in the front row. It used to be my grandfather's seat."),
    nar("七点整。夏知遥走上台，拿起话筒。", "Seven o'clock sharp. Xia Zhiyao walks onto the stage and picks up the microphone."),
    show("zhiyao", "normal", "center"),
    say("zhiyao", "各位晚上好。欢迎来到潮声影院，春季放映会——", "Good evening, everyone. Welcome to the Tidesound Cinema, and to the Spring Screenings—", face="normal"),
    say("zhiyao", "……最后、", "…final—", face="sad"),
    nar("她停住了。三百个人在等。海风把她手里的稿子吹得哗哗响。", "She stops. Three hundred people wait. The sea wind rattles the pages in her hand."),
    iff(F("flag.zhiyao_secret"), think("我知道她为什么念不下去。这是影院的最后一季，也是她的。", "I know why she can't go on. It's the cinema's final season, and hers too.")),
    think("得做点什么。", "I have to do something."),
], [
    choice("stand", "dilemma", T("走上台，站到她旁边。", "Walk up onto the stage and stand beside her."), [
        say("zhiyao", "……陆远？", "…Lu Yuan?", face="surprised"),
        me("我们社长有点激动。下面这句，我们一起念。", "Our president's a little emotional. We'll say this next part together."),
        nar("她看了我一眼，深吸一口气。", "She glances at me and takes a deep breath."),
        say("zhiyao", "……春季放映会，最后一季。第一部——开始！", "…The Spring Screenings, final season. Our first film—let's begin!", face="smile"),
        nar("台下的掌声，比海浪还响。", "The applause is louder than the waves."),
    ], [rel("zhiyao", "intimacy", 1), rel("zhiyao", "esteem", 1), setv("flag.z_stage")], values=["yong"]),
    choice("echo", "dilemma", T("在台下，把她第一天说的那句话喊回给她。", "From the crowd, shout her own words from that first day back at her."), [
        me("社长！五个人也是观众——今天有三百个！", "President! Five people is still an audience—tonight there are three hundred!"),
        nar("台下哄地笑了。有人跟着喊：“开始！开始！”", "The crowd bursts out laughing. Someone starts chanting: 'Begin! Begin!'"),
        say("zhiyao", "……笨蛋。", "…Idiot.", face="shy"),
        say("zhiyao", "那就——春季放映会，最后一季，开始！", "Then—the Spring Screenings, final season, let's begin!", face="smile"),
    ], [rel("zhiyao", "intimacy", 1), rel("zhiyao", "trust", 1), setv("flag.z_echo")], values=["wen"]),
    choice("booth", "strategy", T("跑去放映室，让季白先开机，用画面替她解围。", "Run to the booth and have Ji Bai start the projector, to get her off the hook."), [
        hide("zhiyao"),
        nar("光从我头顶射出去，银幕亮了。台下安静下来。", "Light shoots out over my head and the screen comes alive. The crowd falls quiet."),
        nar("等我回到台下，夏知遥已经不在台上了。她坐在最边上的位置，一直看着银幕，没有看我。", "By the time I get back down, Zhiyao has left the stage. She's sitting in the seat at the very end of a row, eyes fixed on the screen. She doesn't look at me."),
    ], [rel("zhiyao", "esteem", 1)], values=["ti"]),
], order=1, when=ON, cast=["zhiyao", "chenghang"])

C5_AFTER = scene("c5_after", "c5", "main", T("散场以后", "After the Crowd Leaves"), [
    bg("cinema_night"),
    cg("cg_last_screening"),
    nar("最后一部电影的最后一个镜头，是一片海。银幕上的海，和银幕后面的海，连在了一起。", "The last shot of the last film is the sea. The sea on the screen and the sea behind it run together into one."),
    cgoff(),
    nar("人走光了。夏知遥坐在台边，两只脚悬在半空。", "Everyone has gone. Zhiyao sits on the edge of the stage, feet dangling over the side."),
    show("zhiyao", "smile", "center"),
    say("zhiyao", "三百二十七个人。……我也数了。", "Three hundred and twenty-seven people. …I counted too.", face="smile"),
    say("zhiyao", "陆远。下周六，我坐早上那班车回家。", "Lu Yuan. Next Saturday I'm taking the morning train home.", face="sad"),
    iff(NF("flag.zhiyao_secret"), say("zhiyao", "我妈下个月做手术。家里只有她一个人。……这件事，我一直没跟社里说。", "My mom has surgery next month. She's on her own at home. …I never told anyone in the club.", face="sad")),
    iff(F("flag.zhiyao_secret"), say("zhiyao", "你早就知道了。那天在天台上，我只告诉了你一个人。", "You knew already. That day on the roof, you were the only one I told.", face="normal")),
    say("zhiyao", "所以啊，这一周，你别对我太好。不然我走的时候，会哭得很难看的。", "So this week—don't be too nice to me. Otherwise when I leave, I'll cry, and it won't be pretty.", face="smile"),
], [
    choice("week", "dilemma", T("“那这一周，你想做的事，我们全做完。”", "\"Then this week, everything you want to do—we'll do it all.\""), [
        say("zhiyao", "……你是听不懂人话吗。", "…Do you not understand plain words?", face="angry"),
        say("zhiyao", "毕业前想做的事，我列过一张单子。十件。……你可别后悔。", "I made a list once. Things to do before graduating. Ten of them. …Don't you dare regret this.", face="smile"),
    ], [rel("zhiyao", "intimacy", 2), setv("flag.z_week")], values=["cheng"]),
    choice("follow", "dilemma", T("“那我跟你一起回去。”", "\"Then I'll go back with you.\""), [
        say("zhiyao", "……你说什么傻话。", "…What kind of stupid thing is that to say?", face="surprised"),
        say("zhiyao", "你才刚回到汐川。老房子、影院、你爷爷留下的东西……你又要为了别人，走一次？", "You've only just come back to Xichuan. The old house, the cinema, everything your grandfather left… and you'd leave again, for someone else?", face="angry"),
        nar("她跳下台，往门口走。走到一半，停了一下。", "She hops down from the stage and heads for the gate. Halfway there, she stops."),
        say("zhiyao", "……谢谢。可是不行。", "…Thank you. But no.", face="sad"),
    ], [rel("zhiyao", "intimacy", 1), rel("zhiyao", "trust", -1), setv("flag.z_rash")], values=["yong"]),
    choice("nod", "expression", T("“……我知道了。”", "\"…All right.\""), [
        say("zhiyao", "嗯。这样最好。", "Mm. It's better this way.", face="smile"),
        nar("她笑得很好看。好看得不像真的。", "Her smile is lovely. Too lovely to be real."),
    ], [rel("zhiyao", "intimacy", -1), setv("flag.z_distance")], values=["ti"]),
], order=2, when=ON, cast=["zhiyao"])

# ---------------- 第六章 · 七天 ----------------
C6_SCREEN = scene("c6_screen", "c6", "main", T("拆迁的早上", "The Morning of the Demolition"), [
    bg("cinema_dusk"),
    nar("周一早上，挖掘机停在了影院门口。工人们先拆的是铁椅子，一排一排，叮叮当当。", "Monday morning, an excavator pulls up at the cinema gate. The workers take the iron seats out first, row by row, clanging."),
    show("zhou", "normal", "left"),
    say("zhou", "银幕留到最后拆。那块布，是你爷爷一针一针缝的。", "The screen comes down last. Your grandfather sewed that canvas himself, stitch by stitch.", face="sad"),
    hide("zhou"),
    iff(F("flag.z_week"), show("zhiyao", "smile", "center"), say("zhiyao", "单子上第一件：从银幕上剪一块布带走。工人叔叔同意了，就一小块。", "First thing on the list: cut a piece off the screen to take with me. The workers said yes—just a small piece.", face="smile")),
    iff(F("flag.z_rash"), show("zhiyao", "angry", "center"), say("zhiyao", "……那天晚上的话，我就当没听见。", "…What you said that night—I'm pretending I didn't hear it.", face="angry")),
    iff(F("flag.z_distance"), show("zhiyao", "normal", "center"), say("zhiyao", "陆远。早。", "Lu Yuan. Morning.", face="normal")),
    iff(ALL(NF("flag.z_week"), NF("flag.z_rash"), NF("flag.z_distance")), show("zhiyao", "normal", "center")),
    say("zhiyao", "我想要一小块银幕。带回家，挂在我妈的病房里。她第一次看电影，也是在这里。", "I want a little piece of the screen. To take home and hang in my mom's hospital room. The first film she ever saw was here, too.", face="sad"),
], [
    choice("cut", "dilemma", T("爬上架子，帮她剪下右下角那一块。", "Climb the scaffold and cut the bottom-right corner for her."), [
        nar("银幕的布比想象中厚。剪下来的那一块上，有一道淡淡的水渍，像一朵云。", "The canvas is thicker than I expected. On the piece that comes away there's a faint water stain, shaped like a cloud."),
        say("zhiyao", "……这是我大一第一次来的时候，下雨淋的。我记得。", "…That's from the rain the first time I came here, freshman year. I remember.", face="sad"),
        say("zhiyao", "谢谢你。偏偏是这一块。", "Thank you. Of all the pieces, it was this one.", face="smile"),
    ], [rel("zhiyao", "intimacy", 1), setv("flag.z_screen")], values=["yong"]),
    choice("sign", "dilemma", T("“剪下来以后，社员都在背面签个名。”", "\"Once it's cut, let's have every member sign the back.\""), [
        nar("背面是灰色的。我们用马克笔，一个一个签上去。", "The back is grey. We sign it one by one, in marker."),
        iff(F("flag.third_jibai"), nar("季白签得最工整，像印上去的。", "Ji Bai's signature is the neatest, as if it were printed.")),
        iff(F("flag.third_cheng"), nar("沈澄签完，在旁边画了一只三花猫。", "Shen Cheng signs, then draws a calico cat beside her name.")),
        iff(F("flag.third_hang"), nar("程航签了一个最大的名字，占了半块布。", "Cheng Hang signs the biggest name of all. It takes up half the cloth.")),
        say("zhiyao", "好丑。", "It's hideous.", face="smile"),
        say("zhiyao", "……我会好好挂起来的。", "…I'll hang it up properly.", face="shy"),
    ], [rel("zhiyao", "intimacy", 1), rel("zhiyao", "trust", 1), setv("flag.z_screen"), setv("flag.z_signed")], values=["wen"]),
    choice("delay", "strategy", T("“我去和拆迁队商量，银幕晚两天再拆。”", "\"I'll talk to the demolition crew. Get them to leave the screen two more days.\""), [
        say("zhiyao", "……你这个人，总想把什么都留住。", "…You always want to hold on to everything, don't you.", face="sad"),
        say("zhiyao", "可是留不住的。早一天，晚一天，都一样。", "But you can't. A day earlier, a day later—it's all the same.", face="normal"),
    ], [rel("zhiyao", "esteem", 1), rel("zhiyao", "trust", 1)], values=["gu"]),
], order=1, when=ON, cast=["zhiyao", "zhou"])

S6_BEACH = scene("c6_beach", "c6", "side", T("单子上的第七件", "Number Seven on the List"), [
    bg("beach"),
    nar("周三下午，没有课。夏知遥拉我到了海边，手里攥着那张单子。", "Wednesday afternoon, no classes. Zhiyao drags me down to the beach, the list clutched in her hand."),
    show("zhiyao", "smile", "center"),
    say("zhiyao", "第七件：对着海，喊一句平时不敢说的话。", "Number seven: shout something at the sea that you'd never dare say out loud.", face="smile"),
    iff(NF("flag.z_week"), say("zhiyao", "……单子是我自己的。今天突然想做，就叫上你了。", "…It's my own list. I just felt like doing it today, so I called you.", face="shy")),
    say("zhiyao", "你先。", "You first.", face="normal"),
], [
    choice("shout", "dilemma", T("对着海喊：“汐川——我回来了！”", "Shout at the sea: \"Xichuan—I'm back!\""), [
        nar("喊完，嗓子都哑了。几只海鸥被吓飞了。", "When I'm done my throat is raw. A few gulls take off in fright."),
        say("zhiyao", "到我了。", "My turn.", face="normal"),
        cg("cg_shout"),
        say("zhiyao", "我——不——想——走——！", "I—don't—want—to—go!", face="sad"),
        nar("海浪把她的声音卷走了。她站了很久，然后转过身来，眼睛红红的，笑了。", "The waves carry her voice away. She stands there a long time, then turns around, eyes red, and smiles."),
        say("zhiyao", "……好了。说完了。你就当没听见。", "…There. Done. Pretend you didn't hear that.", face="smile"),
        cgoff(),
    ], [rel("zhiyao", "intimacy", 2), setv("flag.z_shout")], values=["yong"]),
    choice("skip", "expression", T("“第七件就算了吧，太傻了。”", "\"Let's skip number seven. It's silly.\""), [
        say("zhiyao", "……也是。", "…I guess.", face="sad"),
        nar("她把单子折起来，放回口袋。那天下午，我们只是沿着海边走了一圈。", "She folds the list and puts it back in her pocket. That afternoon, we just walk the length of the shore."),
    ], [rel("zhiyao", "warmth", -1)], values=["xi"]),
], order=1, salience=1, when=ON, cast=["zhiyao"])

S6_CALL = scene("c6_call", "c6", "side", T("视频电话", "The Video Call"), [
    bg("clubroom"),
    nar("活动室已经空了一半。夏知遥一边装箱，一边接起了视频电话。这一次，她没有按掉。", "The club room is half empty. Zhiyao is packing boxes when a video call comes in. This time, she doesn't decline it."),
    show("zhiyao", "shy", "center"),
    say("zhiyao", "妈。嗯，吃了。……这个？这是社员。", "Mom. Yeah, I ate. …Him? He's a club member.", face="shy"),
    nar("她把手机转过来对着我。屏幕里的阿姨很瘦，笑起来和她一模一样。", "She turns the phone toward me. The woman on the screen is very thin, and when she smiles she looks exactly like her daughter."),
], [
    choice("tell", "dilemma", T("跟阿姨讲周六那晚，她在三百个人面前念开场白。", "Tell her mother about Saturday night—her daughter's opening speech in front of three hundred people."), [
        nar("我讲完，屏幕那头安静了一会儿。", "When I finish, the other end of the line is quiet for a moment."),
        nar("“她小时候就爱站在台上。”阿姨说，“我生病以后，她就不站了。谢谢你，让她又站上去了。”", "'She always loved being on a stage when she was little,' her mother says. 'After I got sick, she stopped. Thank you for getting her back up there.'"),
        say("zhiyao", "妈！……你别乱说。", "Mom! …Don't say things like that.", face="shy"),
    ], [rel("zhiyao", "intimacy", 2), setv("flag.z_mom")], values=["wen"]),
    choice("greet", "expression", T("规规矩矩地问好，说社团会把那块银幕寄到医院。", "Greet her politely, and say the club will send the piece of screen to the hospital."), [
        nar("“这孩子真懂事。”阿姨说，“知遥这个人嘴硬，你多担待。”", "'What a thoughtful young man,' her mother says. 'Zhiyao's all bark—be patient with her.'"),
        say("zhiyao", "……我挂了！", "…I'm hanging up!", face="angry"),
    ], [rel("zhiyao", "trust", 1), rel("zhiyao", "intimacy", 1), setv("flag.z_mom")], values=["ti"]),
], order=2, salience=1, when=ALL(ON, ANY(F("flag.knows_mom"), F("flag.zhiyao_secret"))), cast=["zhiyao"])

S6_ROOF = scene("c6_roof", "c6", "side", T("天台上看不见的白点", "The White Dot That Isn't There"), [
    bg("rooftop"),
    nar("中午，我们又上了天台。她还是带了两个饭团。", "At noon we go up to the roof again. She's brought two rice balls, as always."),
    show("zhiyao", "normal", "center"),
    say("zhiyao", "你看，那个白点不见了。", "Look. The white dot's gone.", face="sad"),
    say("zhiyao", "以后我在家里，往南边看，什么都看不见了。", "When I'm home, I'll look south and there'll be nothing to see.", face="sad"),
], [
    choice("photo", "strategy", T("“那我每周六拍一张汐川的海，发给你。”", "\"Then every Saturday I'll take a photo of the sea here and send it to you.\""), [
        say("zhiyao", "……每周？", "…Every week?", face="surprised"),
        say("zhiyao", "说好了。少一周，我就把你从社员名单上删掉。", "It's a deal. Miss one week and I'm striking you off the membership list.", face="smile"),
    ], [rel("zhiyao", "intimacy", 1), rel("zhiyao", "trust", 1), setv("flag.z_photo")], values=["gu"]),
    choice("quiet", "expression", T("什么也不说，陪她坐着，把饭团吃完。", "Say nothing. Sit with her and finish the rice balls."), [
        cg("cg_shoulder"),
        nar("风很大。吃到一半，她把头轻轻靠在了我的肩膀上。", "It's windy. Halfway through, she leans her head lightly against my shoulder."),
        say("zhiyao", "……就一会儿。", "…Just for a minute.", face="shy"),
        cgoff(),
    ], [rel("zhiyao", "intimacy", 2)], values=["ti"]),
], order=3, salience=1, when=ON, cast=["zhiyao"])

# ---------------- 第七章 · 第七个春天 ----------------
C7_RAIN = scene("c7_rain", "c7", "main", T("雨夜", "The Rainy Night"), [
    bg("rain_street"),
    nar("她走的前一晚，下雨了。夏知遥抱着一个纸箱，站在校门口的公交站下面。", "The night before she leaves, it rains. Zhiyao stands under the bus shelter by the school gate, hugging a cardboard box."),
    show("zhiyao", "normal", "center"),
    iff(F("flag.z_distance"), say("zhiyao", "这一周，你真的没来找我。……我是不是很奇怪，明明是我让你别来的。", "You really didn't come looking for me all week. …Isn't it strange? I'm the one who told you not to.", face="sad")),
    say("zhiyao", "社团的东西，都在这里了。钥匙给你。", "Everything from the club is in here. Here's the key.", face="normal"),
    say("zhiyao", "陆远，电影社以后就是你的了。", "Lu Yuan, the film club's yours now.", face="smile"),
    say("zhiyao", "……其实我一直想问。你说回汐川，是为了看它最后一个春天。那看完了以后呢？", "…There's something I've always wanted to ask. You said you came back to Xichuan to see its last spring. What about after?", face="normal"),
], [
    choice("stay", "dilemma", T("“我留下来。明年春天，我在汐川重新放电影。”", "\"I'm staying. Next spring, I'll start showing films in Xichuan again.\""), [
        say("zhiyao", "……没有影院了。", "…There's no cinema anymore.", face="surprised"),
        me("有海堤。有银幕。季白说，那台旧放映机还能转。", "There's the seawall. There's a screen. Ji Bai says the old projector still runs."),
        iff(F("flag.z_screen"), me("银幕少了右下角一块。正好，等它回来补上。", "The screen's missing its bottom-right corner. Fine. It can be stitched back in when it comes home.")),
        iff(F("flag.z_signed"), say("zhiyao", "……背面还有大家的名字呢。可不许弄丢。", "…It's got everyone's names on the back. Don't you dare lose it.", face="sad")),
        say("zhiyao", "……那你给我留个位置。", "…Then save me a seat.", face="sad"),
        say("zhiyao", "第一排。正中间。", "Front row. Dead center.", face="smile"),
    ], [rel("zhiyao", "intimacy", 1), rel("zhiyao", "trust", 1), setv("flag.z_stay")], values=["gu"]),
    choice("umbrella", "expression", T("把伞给她，陪她走回宿舍。", "Give her your umbrella and walk her back to her dorm."), [
        nar("伞不大。我们一路没说话，雨落在我的半边肩膀上。", "The umbrella isn't big. We don't say a word the whole way, and the rain falls on one of my shoulders."),
        say("zhiyao", "……你半边都湿了，笨蛋。", "…Half of you is soaked, you idiot.", face="shy"),
    ], [rel("zhiyao", "intimacy", 1)], values=["wen"]),
    choice("letgo", "expression", T("“回去照顾好阿姨。别回头。”", "\"Go home and take care of your mom. Don't look back.\""), [
        say("zhiyao", "……嗯。", "…Mm.", face="sad"),
        nar("车来了。她抱着纸箱上了车，真的一次也没有回头。", "The bus comes. She climbs on with the box in her arms, and she really doesn't look back, not once."),
    ], [rel("zhiyao", "intimacy", -1), setv("flag.z_letgo")], values=["ti"]),
], order=1, when=ON, cast=["zhiyao"])

C7_STATION = scene("c7_station", "c7", "main", T("站台", "The Platform"), [
    bg("station"),
    nar("早上七点的汐川站，只有一个站台。和我回来的那天一样。", "Seven in the morning, and Xichuan Station has only one platform. Just like the day I came back."),
    nar("花已经谢了。树上全是新叶子。", "The blossoms have fallen. The trees are all new leaves."),
    show("zhiyao", "normal", "center"),
    iff(F("flag.z_letgo"), say("zhiyao", "……你来了。我以为你不会来。", "…You came. I thought you wouldn't.", face="surprised")),
    iff(NF("flag.z_letgo"), say("zhiyao", "喂。来送我啊？", "Hey. Come to see me off?", face="smile")),
    iff(F("flag.z_screen"), say("zhiyao", "那块银幕，我放在箱子最上面了。", "That piece of screen—I put it right on top in my suitcase.", face="normal")),
    iff(F("flag.z_mom"), say("zhiyao", "我妈说，下次让你去家里吃饭。……你别当真啊！", "My mom says you should come over for dinner sometime. …Don't take that seriously!", face="shy")),
    iff(F("flag.z_shout"), say("zhiyao", "那天在海边喊的那句，你就当没听见。……听见了也不许说。", "What I shouted at the sea that day—pretend you didn't hear. …And if you did, don't you dare say so.", face="shy")),
    iff(F("flag.z_stage"), say("zhiyao", "那天你上台的时候，腿一直在抖。我站在旁边，看得清清楚楚。", "That night you came up on stage, your legs were shaking the whole time. I was right next to you. I saw everything.", face="smile")),
    iff(F("flag.z_echo"), say("zhiyao", "“五个人也是观众”——那句明明是我的台词，被你抢走了。", "'Five people is still an audience'—that was my line, and you stole it.", face="smile")),
    iff(F("flag.z_photo"), say("zhiyao", "这周六的照片，别忘了。", "Don't forget this Saturday's photo.", face="smile")),
    nar("广播响了。列车进站。", "The announcement sounds. The train pulls in."),
    think("七年前，我从这个站台离开，什么都没来得及说。", "Seven years ago I left from this platform without getting a single word out."),
], [
    choice("confess", "dilemma", T("“夏知遥。我喜欢你。……所以明年春天，回来看我放的第一场。”", "\"Xia Zhiyao. I like you. …So next spring, come back and watch my first show.\""), [
        say("zhiyao", "……诶？", "…Huh?", face="surprised"),
        say("zhiyao", "笨蛋。为什么偏偏现在才说。", "Idiot. Why did you have to wait until now to say it?", face="sad"),
        cg("cg_platform"),
        nar("她跳上车门的台阶，又转过身来。眼泪掉下来了，可她在笑。", "She steps up into the doorway of the train, then turns back. The tears are falling, but she's smiling."),
        say("zhiyao", "……我也是。第一排，给我留着。", "…Me too. Save me that front-row seat.", face="smile"),
        nar("车门关上了。列车开走的时候，她一直把手贴在窗户上。", "The doors close. As the train pulls away, she keeps her hand pressed to the window."),
        cgoff(),
    ], [setv("flag.z_good"), rel("zhiyao", "intimacy", 1)], values=["cheng"], when=GOOD),
    choice("wave", "expression", T("挥挥手：“一路顺风。”", "Wave: \"Have a safe trip.\""), [
        say("zhiyao", "嗯。你也是。", "Mm. You too.", face="smile"),
        nar("她笑着挥手，上了车。列车拐过海湾，看不见了。", "She waves, smiling, and boards. The train rounds the bay and is gone."),
        think("直到那时我才想起来：七年前，我也是这样，什么都没说。", "Only then does it hit me: seven years ago, I said nothing either. Just like this."),
    ], [setv("flag.z_normal")]),
], order=2, when=ON, cast=["zhiyao"])

CHAPTERS = [
    {"id": "c5", "title": T("第五章 · 最后一场", "Chapter 5 · The Last Show"), "intro": [P(T("四月最后一个周六。", "The last Saturday of April."))], "offer": 0},
    {"id": "c6", "title": T("第六章 · 七天", "Chapter 6 · Seven Days"), "intro": [P(T("五月第一周。拆迁队进场了。", "The first week of May. The demolition crew moves in."))], "offer": 3,
     "main_first": True, "side_prompt": T("这一周，你和她去了……", "This week, you and she…")},
    {"id": "c7", "title": T("第七章 · 第七个春天", "Chapter 7 · The Seventh Spring"), "intro": [P(T("五月第一个周五。", "The first Friday of May."))], "offer": 0},
]
NODES = [C5_LAST, C5_AFTER, C6_SCREEN, S6_BEACH, S6_CALL, S6_ROOF, C7_RAIN, C7_STATION]
FLAGS = [("flag.z_stage", "上台陪她念开场白", "Went on stage to say the opening with her"), ("flag.z_echo", "把“五个人也是观众”喊回给她", "Shouted 'five people is still an audience' back at her"),
         ("flag.z_week", "答应陪她做完单子上的事", "Promised to do everything on her list"), ("flag.z_rash", "说要跟她一起回去", "Said he'd go home with her"),
         ("flag.z_distance", "散场后和她保持距离", "Kept his distance after the show"), ("flag.z_screen", "剪下了一块银幕", "Cut a piece from the screen"),
         ("flag.z_signed", "社员在银幕背面签了名", "The members signed the back of the screen"), ("flag.z_shout", "在海边听见她喊“我不想走”", "Heard her shout 'I don't want to go' at the sea"),
         ("flag.z_mom", "和她妈妈视频过", "Talked with her mother on a video call"), ("flag.z_photo", "约好每周六发一张海的照片", "Promised a photo of the sea every Saturday"),
         ("flag.z_stay", "雨夜说“我留下来”", "Said 'I'm staying' on the rainy night"), ("flag.z_letgo", "雨夜让她别回头", "Told her not to look back on the rainy night"),
         ("flag.z_good", "在站台上告白", "Confessed on the platform"), ("flag.z_normal", "在站台上只挥了手", "Only waved on the platform")]
BG = {"beach": T("海边的沙滩", "The beach")}
CG = {"cg_end_zhiyao_good": T("第八个春天", "The eighth spring"), "cg_end_zhiyao_normal": T("空着的第一排", "The empty front row"), "cg_shout": T("对着海喊", "Shouting at the sea"), "cg_shoulder": T("天台上的肩膀", "A shoulder on the roof"), "cg_last_screening": T("最后一场", "The last show"), "cg_platform": T("站台", "The platform")}
ENDINGS = [
    {"id": "zhiyao_good", "cg": "cg_end_zhiyao_good", "title": T("夏知遥 · 好结局「第八个春天」", "Xia Zhiyao · Good Ending: The Eighth Spring"),
     "text": T("第二年三月，汐川的海堤上挂起了一块缝补过的白布，右下角的颜色和别处不一样。来了四十三个人。开场前五分钟，最早那班车进站了。一个扎着侧马尾的女孩拖着箱子一路跑过来，坐进了第一排正中间。“社长，你迟到了。”“……闭嘴。开始吧。”",
               "The next March, a patched white canvas goes up on the Xichuan seawall; its bottom-right corner is a different shade from the rest. Forty-three people come. Five minutes before the show, the first train of the morning pulls in. A girl with a side ponytail comes running all the way from the station, dragging a suitcase, and drops into the front row, dead center. 'You're late, President.' '…Shut up. Let's begin.'"),
     "when": F("flag.z_good")},
    {"id": "zhiyao_normal", "cg": "cg_end_zhiyao_normal", "title": T("夏知遥 · 普通结局「春天过去了」", "Xia Zhiyao · Normal Ending: And Spring Passed"),
     "text": T("一开始，她每周都会发来照片：老家的天空，医院窗外的树。后来，照片越来越少。第二年春天，我在海堤上放了一场电影，第一排的那个位置空着。散场的时候我才明白，有些话，在站台上不说，就再也说不出口了。",
               "At first she sends photos every week: the sky back home, the tree outside the hospital window. Then fewer, and fewer. The next spring I hold a screening on the seawall, and that front-row seat stays empty. Only as the crowd leaves do I understand: some words, if you don't say them on the platform, you never get to say at all."),
     "when": F("flag.z_normal")},
]

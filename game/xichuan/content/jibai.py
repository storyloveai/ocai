"""季白线：第五至七章（决策记录 v0.9）。前夜去了放映室（flag.route_jibai）才会进；和另外两条线共用第五至七章的章节。
她修别人的电影，却从来不看最后一卷：看了，就结束了。这条线的结是：第七卷被剪掉的结尾，和那台要被当废铁卖掉的放映机。
第五章 第七卷：零点以后，你们第一次放第七卷——爷爷拍的汐川，最后一段被剪掉了；最后一场，她在放映室里，要不要看完最后一卷。
第六章 废铁：影院开拆，放映机要当废铁卖；她收到了资料馆的聘书。这一周和她做一件事（三选一）。
第七章 第七个春天：老房子的阁楼里，找到被剪掉的那一段；夜里的海堤，把第七卷完整地放一遍。
好结局「没有影院的电影院」：好感 ≥8、信任 ≥4、留下了放映机（flag.j_projector）。否则她去了资料馆，第七卷也跟着去了（普通结局「片尾字幕」）。"""
from lib import *

ON = F("flag.route_jibai")
GOOD = ALL(AT("jibai", "intimacy", 4), AT("jibai", "trust", 2), F("flag.j_projector"))

# ---------------- 第五章 · 第七卷 ----------------
C5_REEL = scene("c5_reel", "c5", "main", T("第七卷", "Reel Seven"), [
    bg("projection"),
    nar("零点过后。放映室里只开了一盏灯。季白把第七卷装上放映机，手停在开关上。", "Past midnight. A single lamp is lit in the booth. Ji Bai threads reel seven onto the projector, and her hand stops on the switch."),
    show("jibai", "normal", "center"),
    say("jibai", "我修好了，可是一格都没看。……你来开。", "I've restored it, but I haven't watched a single frame. …You turn it on.", face="normal"),
    cg("cg_booth"),
    nar("第一格，是一片海。然后是潮声影院，刚刷过漆的银幕。再然后，是放映室里那张小床——床上睡着一个小孩。", "The first frame is the sea. Then the Tidesound, its screen freshly painted. Then the little cot in the booth—and a child asleep on it."),
    think("是我。", "It's me."),
    nar("画面里有很多个春天：银幕补了又补，椅子换了一排又一排，第一排有个小女孩在哭。最后，是空荡荡的座位，和一行手写的字幕：“第七个春天”。", "There are many springs on the film: the screen patched again and again, the seats replaced row by row, a little girl crying in the front row. And at the end, empty seats, and one handwritten title card: 'The Seventh Spring.'"),
    nar("然后，画面断了。只剩一道歪歪扭扭的接缝。", "Then the picture cuts off. All that's left is a crooked splice."),
    cgoff(),
    say("jibai", "……后面被剪掉了。剪得很急。他的手在抖。", "…The rest has been cut. In a hurry. His hands were shaking.", face="sad"),
], [
    choice("find", "dilemma", T("“剪掉的那一段，我们把它找回来。”", "\"Whatever he cut out—we'll find it.\""), [
        say("jibai", "……找？", "…Find it?", face="surprised"),
        say("jibai", "胶片是会坏的。剪下来放了七年，可能已经粘成一团了。", "Film decays. If it's been sitting cut loose for seven years, it may have fused into a lump.", face="normal"),
        say("jibai", "不过，修胶片的人，最喜欢的就是这种事。", "But for someone who restores film, that's exactly the kind of job we love.", face="smile"),
    ], [rel("jibai", "intimacy", 1), rel("jibai", "trust", 1), setv("flag.j_search")], values=["yong"]),
    choice("cot", "expression", T("“那张床……我小时候真的在这里睡过很多次。”", "\"That cot… I really did sleep here, lots of times, as a kid.\""), [
        say("jibai", "他拍了你很多次。每一次，镜头都很稳。", "He filmed you over and over. Every time, the camera was steady.", face="normal"),
        say("jibai", "陆同学，他很想你。胶片不会说谎。", "Mr. Lu, he missed you. Film doesn't lie.", face="sad"),
    ], [rel("jibai", "intimacy", 2)], values=["wen"]),
    choice("leave", "expression", T("“他剪掉，就是不想让人看。算了吧。”", "\"If he cut it, he didn't want it seen. Let it go.\""), [
        say("jibai", "……嗯。", "…Mm.", face="sad"),
        nar("她把胶片倒回去，放进铁盒，在盖子上贴了一张新标签：“第七卷（不完整）”。", "She rewinds the film, puts it back in its tin, and sticks a new label on the lid: 'Reel 7 (incomplete).'"),
    ], [rel("jibai", "trust", 1)], values=["ti"]),
], order=1, when=ON, cast=["jibai"])

C5_LASTREEL = scene("c5_lastreel", "c5", "main", T("最后一卷", "The Final Reel"), [
    bg("projection"),
    nar("晚上，最后一场。三百多人坐在下面，我和季白在放映室里。从小窗望出去，银幕亮得像一扇门。", "Evening, the last show. Over three hundred people below; Ji Bai and I up in the booth. Through the little window, the screen glows like a doorway."),
    show("jibai", "normal", "center"),
    say("jibai", "还有一卷就放完了。", "One more reel and it's over.", face="normal"),
    nar("她把最后一卷装上机器，然后转过身，背对着小窗坐下了。", "She threads the final reel onto the machine, then turns around and sits down with her back to the window."),
    say("jibai", "我从来不看最后一卷。每一部都是。只看焦点，不看故事。", "I never watch the final reel. Not of any film. I check the focus, I don't watch the story.", face="sad"),
    say("jibai", "看了，就结束了。", "If I watch it, it's over.", face="sad"),
], [
    choice("watch", "dilemma", T("“今天，我们一起看完。”", "\"Tonight, we'll watch it to the end. Together.\""), [
        say("jibai", "……一起？", "…Together?", face="surprised"),
        nar("她慢慢转过身来。我们挤在那扇小窗前面，肩膀挨着肩膀。", "Slowly, she turns around. We squeeze in front of the little window, shoulder to shoulder."),
        nar("片尾字幕升起来的时候，下面的三百个人一起鼓掌。季白没有鼓掌。她在哭，哭得很安静。", "As the end credits rise, the three hundred people below applaud together. Ji Bai doesn't clap. She's crying, very quietly."),
        say("jibai", "……原来结束是这个样子的。也不是很可怕。", "…So this is what an ending looks like. It isn't all that frightening.", face="smile"),
    ], [rel("jibai", "intimacy", 2), setv("flag.j_watched")], values=["yong"]),
    choice("narrate", "dilemma", T("“那我替你看。我讲给你听。”", "\"Then I'll watch it for you. I'll tell you what happens.\""), [
        nar("我站在小窗前，一句一句地讲。她背对着银幕，闭着眼睛听。", "I stand at the window and describe it line by line. She sits with her back to the screen, eyes closed, listening."),
        say("jibai", "……你讲得比电影好。", "…You tell it better than the film does.", face="smile"),
    ], [rel("jibai", "intimacy", 1), rel("jibai", "trust", 1)], values=["wen"]),
    choice("let", "expression", T("什么也不说，陪她背对着坐下。", "Say nothing. Sit down beside her, back to the window."), [
        nar("我们背对着银幕坐了一卷的时间。放映机嗒嗒地响，像一只很大的钟。", "We sit with our backs to the screen for the length of a reel. The projector clatters away like a very large clock."),
    ], [rel("jibai", "trust", 1)], values=["ti"]),
], order=2, when=ON, cast=["jibai"])

# ---------------- 第六章 · 废铁 ----------------
C6_SCRAP = scene("c6_scrap", "c6", "main", T("废铁", "Scrap Metal"), [
    bg("cinema_dusk"),
    nar("周一，拆迁队进场。收废品的三轮车停在放映室楼下。", "Monday, the demolition crew moves in. A scrap collector's tricycle is parked below the booth."),
    show("zhou", "sad", "left"),
    say("zhou", "放映机……按斤称。两台，八百。", "The projectors… go by weight. The pair of them, eight hundred.", face="sad"),
    hide("zhou"),
    show("jibai", "normal", "center"),
    say("jibai", "陆同学，有件事我还没说。", "Mr. Lu, there's something I haven't told you.", face="normal"),
    say("jibai", "北京的电影资料馆要我去修片子。七月报到。……他们说，第七卷也可以一起带去，好好保存。", "The National Film Archive in Beijing wants me to restore films for them. I start in July. …They say reel seven can come too, to be properly preserved.", face="sad"),
    say("jibai", "影院没了，放映机也没了。我在汐川，已经没有可以放电影的地方了。", "The cinema's gone. The projectors will be gone. There's nowhere left in Xichuan for me to run a film.", face="sad"),
], [
    choice("buy", "dilemma", T("“八百块，那台小的我买了。”", "\"Eight hundred? I'll buy the small one.\""), [
        iff(F("flag.poster_sale"), nar("义卖海报剩下的钱，正好够。", "What's left from the poster sale covers it exactly.")),
        iff(NF("flag.poster_sale"), nar("我把钱包里的钱全掏了出来，还差两百。老周骂了一句，替我补上了。", "I empty my wallet and come up two hundred short. Old Zhou swears once and makes up the difference.")),
        say("jibai", "……你买放映机做什么？你又不会放。", "…What do you want with a projector? You don't know how to run one.", face="surprised"),
        me("你会。", "You do."),
        say("jibai", "……这是我听过最不讲道理的话。", "…That's the most unreasonable thing I've ever heard.", face="shy"),
    ], [rel("jibai", "intimacy", 1), rel("jibai", "trust", 1), setv("flag.j_projector")], values=["gu"]),
    choice("archive", "strategy", T("“资料馆是好地方。第七卷在那里，不会再坏了。”", "\"The archive's a good place. Reel seven would never decay there.\""), [
        say("jibai", "……嗯。你说得对。", "…Mm. You're right.", face="normal"),
        say("jibai", "修胶片的人，本来就应该去那种地方。", "People who restore film belong in places like that.", face="sad"),
    ], [rel("jibai", "esteem", 1)], values=["cheng"]),
    choice("ask", "dilemma", T("“你想去吗？”", "\"Do you want to go?\""), [
        say("jibai", "……没有人问过我这个。", "…No one's ever asked me that.", face="surprised"),
        say("jibai", "我不知道。我只知道，影院拆了以后，我每天晚上都会醒，以为放映机还在转。", "I don't know. I only know that since they started tearing the cinema down, I wake up every night thinking the projector's still running.", face="sad"),
    ], [rel("jibai", "trust", 1), rel("jibai", "intimacy", 1)], values=["ti"]),
], order=1, when=ON, cast=["jibai", "zhou"])

S6_PAPER = scene("c6_paper", "c6", "side", T("十四年前的报纸", "A Newspaper from Fourteen Years Ago"), [
    bg("library"),
    nar("图书馆三楼，季白翻出了一摞旧报纸。", "On the library's third floor, Ji Bai has dug out a stack of old newspapers."),
    show("jibai", "normal", "center"),
    say("jibai", "找到了。十四年前的汐川晚报。“潮声影院的放映员老陆，在拍一部关于小城的电影。”", "Found it. The Xichuan Evening News, fourteen years ago. 'Old Lu, projectionist at the Tidesound, is making a film about our little town.'", face="smile"),
    say("jibai", "片名叫《第七个春天》。他说，要拍七个春天，拍完了，只放一次。", "It's called The Seventh Spring. He said he'd shoot it over seven springs, and when it was done, it would be shown only once.", face="normal"),
], [
    choice("once", "dilemma", T("“只放一次……那一次，他想放给谁看？”", "\"Only once… Who did he want to show it to?\""), [
        say("jibai", "……陆同学。", "…Mr. Lu.", face="sad"),
        say("jibai", "你在问一个答案很明显的问题。", "You're asking a question with a very obvious answer.", face="sad"),
    ], [rel("jibai", "intimacy", 1), rel("jibai", "trust", 1), setv("flag.j_once")], values=["cheng"]),
    choice("copy", "strategy", T("把那篇报道复印下来，夹进第七卷的铁盒里。", "Photocopy the article and tuck it into reel seven's tin."), [
        say("jibai", "好主意。片子和说明书，放在一起。", "Good idea. The film and its notes, kept together.", face="smile"),
    ], [rel("jibai", "esteem", 1), rel("jibai", "intimacy", 1)], values=["gu"]),
], order=1, salience=1, when=ON, cast=["jibai"])

S6_COT = scene("c6_cot", "c6", "side", T("放映室的小床", "The Cot in the Booth"), [
    bg("projection"),
    nar("放映室明天就要拆了。季白在打包最后一箱胶片，我坐在那张小床上。床太小了，腿伸不直。", "The booth comes down tomorrow. Ji Bai is packing the last box of film; I'm sitting on the little cot. It's too small now. My legs won't stretch out."),
    show("jibai", "normal", "center"),
    say("jibai", "这两年，我修片修到太晚，就在这张床上睡。", "These two years, whenever I worked too late, I slept on that cot.", face="shy"),
    say("jibai", "……原来，我一直睡在你的床上。", "…So all this time, I've been sleeping in your bed.", face="shy"),
], [
    choice("nap", "expression", T("“那今天，你再睡最后一次。我替你守着。”", "\"Then sleep there one last time today. I'll keep watch.\""), [
        cg("cg_cot"),
        nar("她蜷在小床上，很快就睡着了。我坐在放映机旁边，听了一下午的海。", "She curls up on the cot and falls asleep almost at once. I sit by the projector and listen to the sea all afternoon."),
        say("jibai", "（醒来）……你一直在？", "(waking) …You stayed the whole time?", face="surprised"),
        cgoff(),
    ], [rel("jibai", "intimacy", 2)], values=["ti"]),
    choice("sign", "dilemma", T("在床板背面刻下两个人的名字。", "Carve both your names into the underside of the cot."), [
        say("jibai", "……你在破坏文物。", "…You're vandalizing a historical artifact.", face="surprised"),
        nar("她嘴上这么说，还是接过小刀，在我的名字旁边，一笔一画地刻上了“季白”。", "She says that, but she takes the knife anyway and, stroke by careful stroke, carves 'Ji Bai' beside my name."),
    ], [rel("jibai", "intimacy", 1), rel("jibai", "trust", 1)], values=["xi"]),
], order=2, salience=1, when=ON, cast=["jibai"])

S6_SHELF = scene("c6_shelf", "c6", "side", T("第七个架子的背面", "Behind the Seventh Shelf"), [
    bg("storeroom"),
    nar("仓库要清空了。我们把第七个架子搬开，后面的墙上，用图钉钉着一张便签。", "The storeroom is being cleared. We move the seventh shelf aside; on the wall behind it, a note is pinned up with a thumbtack."),
    show("jibai", "surprised", "center"),
    nar("是爷爷的字：“剩下的，在家里。”", "It's my grandfather's handwriting: 'The rest is at home.'"),
    say("jibai", "……家里。陆同学，是你家。", "…At home. Mr. Lu, that means your house.", face="surprised"),
], [
    choice("tonight", "dilemma", T("“今晚就去找。”", "\"We'll look tonight.\""), [
        say("jibai", "好。我带手套。胶片不能用手直接碰。", "All right. I'll bring gloves. You can't touch film with bare hands.", face="smile"),
    ], [rel("jibai", "intimacy", 1), setv("flag.j_clue")], values=["yong"]),
    choice("keep", "expression", T("把便签小心取下来，夹进第七卷的铁盒里。", "Take the note down carefully and tuck it into reel seven's tin."), [
        say("jibai", "……你开始像个修胶片的人了。", "…You're starting to act like a film restorer.", face="smile"),
    ], [rel("jibai", "trust", 1), rel("jibai", "esteem", 1), setv("flag.j_clue")], values=["ti"]),
], order=3, salience=1, when=ON, cast=["jibai"])

# ---------------- 第七章 · 第七个春天 ----------------
C7_ATTIC = scene("c7_attic", "c7", "main", T("给远", "For Yuan"), [
    bg("oldhouse"),
    iff(F("flag.j_clue"), nar("“剩下的，在家里。”我们从晚上找到半夜，最后在阁楼的樟木箱底下，找到了一个很小的铁盒。", "'The rest is at home.' We search from evening until midnight, and at last, at the bottom of a camphor chest in the attic, we find a very small tin.")),
    iff(NF("flag.j_clue"), nar("收拾阁楼的时候，樟木箱底下掉出来一个很小的铁盒。", "While clearing out the attic, a very small tin drops from the bottom of a camphor chest.")),
    nar("盒盖上贴着一张纸：“给远”。", "There's a slip of paper taped to the lid: 'For Yuan.'"),
    show("jibai", "surprised", "center"),
    say("jibai", "……就是它。第七卷剪掉的那一段。", "…This is it. The part cut from reel seven.", face="surprised"),
    iff(F("flag.j_search"), say("jibai", "你说过要找回来。……你真的找到了。", "You said we'd find it. …And you actually did.", face="smile")),
    say("jibai", "胶片还好。他存得很仔细。", "The film's in good shape. He stored it very carefully.", face="normal"),
], [
    choice("together", "dilemma", T("“把它接回去。明天晚上，我们把第七卷完整地放一遍。”", "\"Splice it back in. Tomorrow night, we'll run reel seven all the way through.\""), [
        say("jibai", "放在哪里？影院已经没有了。", "Where? There's no cinema anymore.", face="sad"),
        iff(F("flag.j_projector"), me("放映机在我这里。银幕的话——海堤上，挂一块白布就够了。", "I've got the projector. As for a screen—on the seawall, a white sheet will do.")),
        iff(NF("flag.j_projector"), me("我去借。学校的、文化馆的，总有一台还能转。", "I'll borrow one. The university's, the community center's—one of them must still run.")),
        say("jibai", "……好。今晚我不睡了。一格都不会接错。", "…All right. I won't sleep tonight. Not a single frame will be out of place.", face="smile"),
    ], [rel("jibai", "intimacy", 1), rel("jibai", "trust", 1), setv("flag.j_whole")], values=["yong"]),
    choice("alone", "expression", T("“是给我的。……我想先一个人看。”", "\"It's for me. …I'd like to watch it alone first.\""), [
        say("jibai", "……嗯。应该的。", "…Mm. Of course.", face="sad"),
        nar("她把铁盒递给我，脱下白手套，放在铁盒上面，自己下楼去了。", "She hands me the tin, takes off her white gloves, lays them on top of it, and goes downstairs alone."),
    ], [rel("jibai", "intimacy", -1)], values=["cheng"]),
], order=1, when=ON, cast=["jibai"])

C7_RUN = scene("c7_run", "c7", "main", T("海堤上的放映", "A Screening on the Seawall"), [
    bg("seawall_night"),
    nar("海堤上挂起了一块白布。来的人不多：老周，程航，几个路过的学生，还有一只猫。", "A white sheet hangs on the seawall. Not many come: Old Zhou, Cheng Hang, a few passing students, and a cat."),
    show("jibai", "normal", "center"),
    iff(NF("flag.j_whole"), nar("那一段，我一个人看完以后，还是交给了她。她接得很整齐，看不出接缝。", "After I watched that section alone, I gave it to her in the end. She spliced it so neatly you can't see the join.")),
    iff(F("flag.j_once"), think("报纸上说，这部片子只放一次。今晚，就是那一次。", "The newspaper said this film would be shown only once. Tonight is that once.")),
    nar("放映机转起来了。第一格，是一片海。", "The projector starts to turn. The first frame is the sea."),
    cg("cg_grandpa"),
    nar("所有的春天放完以后，接缝过去，画面上出现了一个人。是爷爷。他坐在放映室的小床旁边，对着镜头，有点不好意思。", "After all the springs have played, the splice goes by, and a man appears on screen. It's my grandfather. He's sitting beside the cot in the booth, facing the camera, a little embarrassed."),
    nar("“远。你要是看到这个，说明你回来了。那年你爸带你走，我没有留你。对不起。”", "'Yuan. If you're watching this, it means you came back. The year your dad took you away, I didn't ask you to stay. I'm sorry.'"),
    nar("“这部片子，我只想放一次。最后一场，留给你放。”", "'I only ever wanted this film shown once. The last show is yours to run.'"),
    nar("画面暗了。海堤上，没有人说话。", "The picture fades. On the seawall, no one speaks."),
    cgoff(),
    iff(F("flag.j_watched"), nar("季白一直看到了最后一格。这一次，她没有转过身去。", "Ji Bai watched all the way to the last frame. This time, she didn't turn away.")),
    say("jibai", "……陆同学。他说，最后一场，留给你放。", "…Mr. Lu. He said the last show is yours to run.", face="sad"),
    say("jibai", "那我呢？七月以后，我去哪里放？", "And what about me? After July, where do I run films?", face="sad"),
], [
    choice("stay", "dilemma", T("“留在汐川。我们开一家没有影院的电影院。每个周六，海堤上，放一场。”", "\"Stay in Xichuan. We'll open a cinema without a cinema. Every Saturday, on the seawall, one show.\""), [
        say("jibai", "……这是我听过最不合理的提议。没有座位，没有屋顶，下雨就要停。", "…That's the least reasonable proposal I've ever heard. No seats, no roof, and every rain cancels the show.", face="surprised"),
        cg("cg_seawall_screen"),
        say("jibai", "可是，你说的时候，没有一点要结束的样子。", "But when you say it, there's nothing about it that sounds like an ending.", face="shy"),
        say("jibai", "……陆远。我留下来。放映员，和你。", "…Lu Yuan. I'll stay. As the projectionist—and with you.", face="smile"),
        nar("那是她第一次，叫我的名字。", "It's the first time she's called me by my name."),
        cgoff(),
    ], [setv("flag.j_good"), rel("jibai", "intimacy", 1)], values=["yong"], when=GOOD),
    choice("go", "expression", T("“去资料馆吧。那里，什么都不会结束。”", "\"Go to the archive. Nothing ever has to end there.\""), [
        say("jibai", "……嗯。", "…Mm.", face="sad"),
        say("jibai", "谢谢你，陆同学。第七卷，我会照顾好它。", "Thank you, Mr. Lu. I'll take good care of reel seven.", face="smile"),
    ], [setv("flag.j_normal")]),
], order=2, when=ON, cast=["jibai", "zhou", "chenghang"])

NODES = [C5_REEL, C5_LASTREEL, C6_SCRAP, S6_PAPER, S6_COT, S6_SHELF, C7_ATTIC, C7_RUN]
FLAGS = [("flag.j_search", "答应找回剪掉的那一段", "Promised to find the missing footage"), ("flag.j_watched", "陪她看完了最后一卷", "Watched the final reel with her"),
         ("flag.j_projector", "买下了放映机", "Bought the projector"), ("flag.j_once", "知道了那部片子只放一次", "Learned the film was meant to be shown once"),
         ("flag.j_clue", "找到了“剩下的，在家里”", "Found 'The rest is at home'"), ("flag.j_whole", "把第七卷接完整", "Restored reel seven in full"),
         ("flag.j_good", "海堤上，她留下来", "On the seawall, she stayed"), ("flag.j_normal", "让她去资料馆", "Told her to go to the archive")]
CG = {"cg_end_jibai_good": T("没有影院的电影院", "A cinema without a cinema"), "cg_end_jibai_normal": T("片尾字幕", "End credits"), "cg_cot": T("放映室的午睡", "A nap in the booth"), "cg_grandpa": T("给远", "For Yuan"), "cg_booth": T("第七卷", "Reel seven"), "cg_seawall_screen": T("海堤上的银幕", "The screen on the seawall")}
ENDINGS = [
    {"id": "jibai_good", "cg": "cg_end_jibai_good", "title": T("季白 · 好结局「没有影院的电影院」", "Ji Bai · Good Ending: A Cinema Without a Cinema"),
     "text": T("后来，汐川的海堤上每个周六都放电影，下雨就停。放映员是个戴圆眼镜的研究生，她现在会看完每一部片子的最后一卷，看完了，就去找坐在第一排的那个人。第七卷没有再放过。它说过只放一次，我们答应了它。",
               "After that, there's a film on the Xichuan seawall every Saturday, cancelled only by rain. The projectionist is a graduate student in round glasses. These days she watches the final reel of every film, and when it's over, she goes to find the person sitting in the front row. Reel seven is never shown again. It said it would be shown only once, and we promised."),
     "when": F("flag.j_good")},
    {"id": "jibai_normal", "cg": "cg_end_jibai_normal", "title": T("季白 · 普通结局「片尾字幕」", "Ji Bai · Normal Ending: End Credits"),
     "text": T("七月，季白去了北京。第七卷跟着她，住进了恒温恒湿的库房。秋天，她寄来一张照片：她站在一排排胶片架中间，笑得很安静。照片背面写着：“这里的每一部，我都会看完。”我把照片夹进了爷爷的报纸里。",
               "In July, Ji Bai left for Beijing. Reel seven went with her, into a vault kept at constant temperature and humidity. In autumn she sent a photo: standing among rows and rows of film racks, smiling quietly. On the back: 'Every film here, I'll watch to the end.' I tucked the photo into my grandfather's newspaper."),
     "when": F("flag.j_normal")},
]

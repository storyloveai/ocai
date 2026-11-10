"""第五章《荆棘的诗》（小说第五章）"""
from lib import *

BG = {}
CG = {"cg_m_paint": T("最后一笔", "The last stroke"), "cg_m_whale": T("鲸鱼游出来了", "The whale swims free"),
      "cg_m_challenge": T("红大衣", "The red coat"), "cg_m_thorn": T("荆棘缠住鲸鱼", "Thorns bind the whale"),
      "cg_m_spilled": T("一地蓝色", "A street of blue"), "cg_m_inkfire": T("写出来的火", "Written fire"),
      "cg_m_after": T("墨水瓶", "The Inkwell")}
FLAGS = [("flag.know_carlo", "读过卡罗的鲸鱼", "Read Carlo's whale"), ("flag.know_evelyn_why", "读过伊芙琳出门前", "Read Evelyn before she set out"),
         ("flag.helped_carlo", "替卡罗抢到了先手", "Won Carlo the first move"), ("flag.saw_evelyn_win", "看着伊芙琳赢了", "Watched Evelyn win"),
         ("flag.asked_evelyn", "问过伊芙琳为什么想赢", "Asked Evelyn why she wants to win"),
         ("flag.c5_full", "涂鸦街全力出手", "Went all out on Mural Street"), ("flag.guarded_line", "护住了和提灯之间的线", "Guarded the line to the Lamp"),
         ("flag.c5_hurt", "被葛兰打进了医院", "Put in hospital by Gran"), ("flag.told_gran_mum", "告诉葛兰怕忘了妈妈", "Told Gran you fear forgetting Mum"),
         ("flag.c5_done", "第五章走完", "Finished Chapter 5"), ("flag.dead_alley", "坏结局：涂鸦街", "Bad end: Mural Street")]

S5_CARLO = scene("s5_carlo", "c5", "side", T("涂鸦街 · 22:30（卡罗）", "Mural Street · 22:30 (Carlo)"), [
    bg("mural_alley"),
    show("carlo", "normal", "center"),
    nar("卡罗·文斯画过整座维斯特林。每一幅画，第二天早上都会被市政的人刷掉。他被抓过十一次，罚过三十多次款。", "Carlo Vince has painted all of Westerling. Every piece is scrubbed off by the city by morning. Arrested eleven times, fined more than thirty."),
    nar("只有一个小女孩看过他的鲸鱼以后，问他：叔叔，它会游走吗？那天晚上，他在旧货市场买到了一个墨水瓶。", "Only one little girl ever looked at his whale and asked: will it swim away? That night he bought an inkwell at a flea market."),
    cg("cg_m_paint"),
    say("ink", "写什么？", "What shall I write?"),
    say("carlo", "老样子。让它游。", "Same as always. Let it swim.", face="smile"),
    cg("cg_m_whale"),
    nar("鲸鱼眨了一下眼睛，从墙上游了出来。肚子上的星星一颗一颗地亮起来，把整条街照成了深蓝色的海底。窗户里，有人探出了头。", "The whale blinks and swims out of the wall. The stars on its belly light one by one, turning the street into a deep-blue seabed. Heads lean out of windows."),
    say("carlo", "他们只是没有机会知道，世界可以比他们以为的更大。", "They've just never had the chance to learn the world could be bigger than they thought."),
    cgoff(),
], [choice("ok", "expression", T("（合上这一页）", "(Close this page)"), [], [setv("flag.know_carlo"), rel("carlo", "warmth", 1)], values=["ji"])], salience=2, cast=["carlo"])

S5_EVELYN = scene("s5_evelyn", "c5", "side", T("艾希大厦顶层 · 21:50（伊芙琳）", "Eiche Tower, top floor · 21:50 (Evelyn)"), [
    bg("eiche_top"),
    show("evelyn", "normal", "left"), show("poet", "normal", "right"),
    nar("伊芙琳·冯·艾希对打架没有兴趣。她对“赢”有兴趣。打架只是赢的一种方式，而且是最笨的一种。", "Evelyn von Eiche has no interest in fighting. She is interested in winning. Fighting is just one way to win, and the stupidest."),
    say("poet", "我的小姐，您还没告诉我，您为什么想赢。", "My lady, you still haven't told me why you want to win."),
    say("evelyn", "赢了以后再想。", "I'll think about it after I win.", face="serious"),
    say("poet", "荆棘冠每次替您开口，都会收下一点东西。关于您自己的骄傲。", "Every time the Crown speaks for you, it keeps something. A little of your pride in yourself.", face="serious"),
    say("evelyn", "那就收。我本来也不需要那个。", "Let it. I never needed that anyway."),
    nar("诗人深深地鞠了一躬，嘴角微微翘了起来。", "The poet bows deeply; the corner of his mouth lifts."),
], [choice("ok", "expression", T("（合上这一页）", "(Close this page)"), [], [setv("flag.know_evelyn_why"), rel("evelyn", "esteem", 1)], values=["ji"])], salience=1, cast=["evelyn", "poet"])

C5_ALLEY = scene("c5_alley", "c5", "main", T("涂鸦街 · 22:41", "Mural Street · 22:41"), [
    bg("mural_alley"),
    *iff(F("flag.go_early"),
        nar("我赶到的时候，鲸鱼还在半空中游。街口站着一个穿红大衣的女人。", "When I arrive the whale is still swimming in midair. A woman in a red coat stands at the mouth of the street."),
        cg("cg_m_challenge"),
        say("evelyn", "卡罗·文斯。你在普通人面前使用遗器。守秘局那个老古董太慢了，我替他收。", "Carlo Vince. You used a relic in front of ordinary people. The Bureau's old relic is too slow; I'll collect for him."),
        cg("cg_m_thorn"),
        say("evelyn", "鲸鱼，落下来。", "Whale. Fall.", face="serious"),
        nar("她说出的每一个字，都在半空中变成了一根带刺的藤。蓝色的颜料像血一样往下淌。", "Every word she speaks becomes a thorned vine in the air. Blue paint drips like blood."),
        cgoff()),
    *iff(NF("flag.go_early"),
        cg("cg_m_spilled"),
        nar("我赶到的时候，一切都结束了。满地都是蓝色的油漆，像一条被打碎的河。卡罗跪在中间，手腕、眼睛和嘴上缠着黑色的荆棘。", "When I arrive it's all over. Blue paint everywhere, like a shattered river. Carlo kneels in the middle, black thorns around his wrists, his eyes, his mouth."),
        cgoff(),
        show("evelyn", "normal", "center"),
        say("evelyn", "修灯的。你来晚了。不过也没关系，你来早了也拦不住我。", "Lamp-mender. You're late. Not that it matters; you couldn't have stopped me early either.")),
], [
    choice("first", "strategy", T("冲卡罗喊：“现在就写！别等她开口！”", "Shout to Carlo: 'Write it now! Don't wait for her to speak!'"), [
        me("卡罗！先写！", "Carlo! Write first!"),
        nar("羽毛笔在空中飞快地写了一行红字：荆棘烧尽。", "The quill races through the air in red: Thorns, burn."),
        cg("cg_m_inkfire"),
        nar("红色的字迹变成了火，顺着荆棘一路烧过去。伊芙琳往后退了一步，大衣的下摆着了火。", "The red letters become fire, running along the thorns. Evelyn steps back; the hem of her coat catches."),
        say("evelyn", "……你看出来了。写比说慢。所以要先写。", "…You saw it. Writing is slower than speech. So you write first.", face="surprised"),
        say("evelyn", "那就让他写不出来。卡罗，你的手。", "Then he won't write at all. Carlo, your hands.", face="serious"),
        nar("两个字，变成两根荆棘，在下一行字落下之前缠住了他的手腕。羽毛笔掉在地上。", "Two words, two thorns, around his wrists before the next line can fall. The quill drops."),
        nar("可她没有再封他的眼睛和嘴。她弯腰捡起墨水瓶的时候，看了我一眼。", "But she doesn't bind his eyes or mouth. Bending to pick up the Inkwell, she glances at me."),
        cgoff(),
    ], [setv("flag.helped_carlo"), setv("flag.saw_evelyn_win"), rel("carlo", "trust", 2), rel("evelyn", "esteem", 2)], values=["yong"], when=ALL(F("flag.go_early"), F("flag.know_ink_rule"))),
    choice("watch", "expression", T("看着。记住她每一句话变成什么", "Watch. Remember what each of her words becomes"), [
        nar("“你的手。你的眼睛。你的嘴。”三句话，三根荆棘。说比写快，快很多。", "'Your hands. Your eyes. Your mouth.' Three sentences, three thorns. Speech is faster than writing. Much faster."),
        think("她每一次都先说要缠住什么。她得说出来。", "Every time, she names what to bind first. She has to say it."),
    ], [setv("flag.saw_evelyn_win"), rel("evelyn", "esteem", 1)], values=["ji"], when=F("flag.go_early")),
    choice("free", "expression", T("“他已经输了。放开他。”", "'He's already lost. Let him go.'"), [
        say("evelyn", "他输了。", "He lost."),
        me("所以你不需要再绑着他。", "So you don't need to keep him bound."),
        nar("她看了我一眼，像是有点意外。然后抬了抬手指，荆棘一根一根枯萎，化成了黑色的灰。", "She looks at me as if mildly surprised. Then she lifts a finger, and the thorns wither one by one into black ash."),
    ], [rel("carlo", "trust", 1), rel("evelyn", "esteem", 1)], values=["xiu"], when=NF("flag.go_early")),
], order=1, cast=["evelyn", "carlo"])

C5_ASK = scene("c5_ask", "c5", "main", T("涂鸦街 · 22:56", "Mural Street · 22:56"), [
    bg("mural_alley"),
    cg("cg_m_after"),
    nar("我扶住卡罗，用指尖碰了碰他手腕上的伤口。伤口在指尖下慢慢合拢了。伊芙琳把深蓝色的墨水瓶举在路灯下看。", "I hold Carlo up and touch the cut on his wrist. It closes under my fingertip. Evelyn holds the dark-blue Inkwell up to the streetlight."),
    say("evelyn", "你很喜欢修东西。那就别做别的。回家去，修你的收音机。这场仗不适合你。", "You like mending things. So don't do anything else. Go home and fix your radios. This war isn't for you."),
    cgoff(),
    show("evelyn", "normal", "center"),
], [
    choice("why", "expression", T("“你为什么想赢？”", "'Why do you want to win?'"), [
        me("你赢了，会改写一条规则。会影响所有人，包括他，包括那些刚刚关上窗户的人。我想知道你要改什么。", "If you win you'll rewrite a rule. It touches everyone—him, the people who just shut their windows. I want to know what you'll change."),
        say("evelyn", "……我还没想好。", "…I haven't decided.", face="sad"),
        me("没想好就去打仗？", "You go to war without deciding?"),
        say("evelyn", "没想好，也可以先赢。", "You can win first and decide after."),
        *iff(F("flag.know_evelyn_why"), think("“赢了以后再想。”她对诗人也是这么说的。一字不差。", "'I'll think about it after I win.' Word for word what she told the poet.")),
    ], [setv("flag.asked_evelyn"), rel("evelyn", "trust", 1), rel("evelyn", "esteem", 1)], values=["xin"]),
    choice("quiet", "strategy", T("什么都不说，只是看着她的手", "Say nothing; just watch her hands"), [
        nar("她握墨水瓶的手，在手套里轻轻蜷了一下。像是有什么东西被抽走了，很轻，很快。", "The hand holding the Inkwell curls slightly inside its glove. As if something were drawn out of her, light and quick."),
    ], [rel("evelyn", "esteem", 1)], values=["shou"]),
], order=2, cast=["evelyn"])

C5_GRAN = scene("c5_gran", "c5", "main", T("涂鸦街 · 23:02", "Mural Street · 23:02"), [
    bg("mural_alley"),
    say("evelyn", "修灯的，你后面有人。", "Lamp-mender. Someone's behind you."),
    show("gran", "battle", "center"),
    nar("涂鸦街的另一头，站着葛兰。拳头上缠着白色的绷带，手里拎着半截发着冷光的断剑。他的脸上什么表情都没有，像一块石头。", "At the other end of the street stands Gran. White bandages on his fists, the half-sword glowing cold in his hand. His face shows nothing at all, like stone."),
    say("gran", "六十年前，是你那盏灯的上一任主人，折断了断剑。", "Sixty years ago, your lamp's last holder broke the Sword."),
    *iff(F("flag.know_hawke"), think("墨绿色的信，天平的蜡封。白秋也给他送了一份。", "A dark-green letter with a scales seal. Bai Qiu sent him one too.")),
    say("gran", "我不在乎六十年前发生了什么。我只在乎一件事：我要赢。", "I don't care what happened sixty years ago. I care about one thing: winning."),
    nar("他冲了过来。我伸手去摘腰上的灯——手停住了。如果我再全力出手一次，提灯会拿走什么？", "He charges. I reach for the lamp at my belt—and my hand stops. If I go all out again, what will the Lamp take?"),
    *iff(F("flag.know_wish"), think("“我想让我的最后一个主人，是给我倒酒的那个。”他是在替她打。", "'I want my last holder to be the one who poured me a drink.' He's fighting for her.")),
], [
    choice("guard", "strategy", T("他要砍的不是我——两只手握住我和提灯之间的那根线", "It isn't me he'll cut—grip the line between me and the Lamp with both hands"), [
        think("摩天轮底下，他砍的是连结。今晚也一样。他要先断我的灯。", "Under the wheel, he cut links. Tonight is no different. He'll sever my lamp first."),
        nar("我没有摘灯。我闭上眼，用修复术去“握”住胸口那根看不见的弦。", "I don't unhook the lamp. I close my eyes and use the mending to hold the invisible string in my chest."),
        nar("断剑落下来，砍在弦上。弦嗡的一声，弯了——没有断。我一直在修它，他砍一寸，我接一寸。", "The Sword comes down on the string. It thrums and bends—and holds. I keep mending it; for every inch he cuts, I join one."),
        say("sword", "……葛兰。她第三次看穿你了。", "…Gran. That's the third time she's read you.", face="smile"),
        say("gran", "你为什么不用全力？", "Why won't you go all out?", face="serious"),
        me("我怕忘了她。我妈妈。", "I'm afraid of forgetting her. My mum."),
        nar("葛兰的手指在剑柄上收紧了。远处，警笛声越来越近。", "Gran's fingers tighten on the hilt. In the distance, sirens getting closer."),
        say("gran", "下一次，你要是还不用全力，我就真的砍你了。", "Next time, if you still won't go all out, I really will cut you."),
    ], [setv("flag.guarded_line"), setv("flag.told_gran_mum"), rel("gran", "esteem", 2), rel("gran", "trust", 1), rel("lamp", "trust", 1)], values=["shou"],
       when=ANY(F("flag.know_cut"), F("flag.blocked_cut"))),
    choice("full", "dilemma", T("“提灯——”全力（会交出一段记忆）", "'Lamp—' all out (costs a memory)"), [
        nar("灯火炸开。断剑砍在白光里，像砍进了一面墙。葛兰被光推出去七八米，靠在一面画满鲸鱼的墙上。", "The light bursts. The Sword strikes into the white like striking a wall. Gran is shoved back seven or eight meters against a wall of painted whales."),
        nar("那种被抽走的感觉来了。五岁，梧桐树底下，一只八音盒。妈妈叫我吃饭，我说它现在就坏着，它现在就难受。", "The emptying comes. Five years old, under the plane tree, a music box. Mum calls me in to eat; I say it's broken right now, it hurts right now."),
        lamp_takes("第三段。你第一次修好的八音盒。我收下了。", "The third. The first music box you ever mended. I'll keep it."),
        nar("整条涂鸦街都被照亮了。街两边的窗户里，有人尖叫。", "The whole of Mural Street lights up. In the windows on either side, someone screams."),
        say("gran", "……这才像样。", "…That's more like it.", face="battle"),
        say("sword", "葛兰，走吧。守秘局的人马上就到。", "Gran, let's go. The Bureau's almost here.", face="sad"),
    ], [*forget("musicbox"), setv("flag.c5_full"), add("notice", 2), add("light", 1), rel("gran", "esteem", 1), rel("lamp", "trust", -1)], values=["yong"]),
    choice("hesitate", "expression", T("（手在抖）", "(My hands are shaking)"), [
        nar("就这一瞬间的犹豫，葛兰已经到了面前。断剑没有砍我，它砍的是我和提灯之间的那根线。腰上的灯一下子变得冰凉。", "In that one moment of hesitation Gran is on me. The Sword doesn't cut me; it cuts the line between me and the Lamp. The lamp at my belt goes cold."),
        say("lamp", "接上！", "Rejoin it!"),
        nar("我抓了两次，都没有抓住。缠着绷带的拳头，正正地砸在我的腹部。我撞在墙上，又摔进了满地的蓝色油漆里。", "I grab twice and miss both times. A bandaged fist lands square in my stomach. I hit the wall and slide down into the blue paint."),
        say("sword", "葛兰，够了。她不想打。你看不出来吗？她怕再交出去什么。", "Gran, enough. She doesn't want to fight. Can't you see? She's afraid of giving up anything else.", face="sad"),
        say("gran", "你为什么不用全力？", "Why won't you go all out?", face="serious"),
        me("……我怕忘了她。我妈妈。", "…I'm afraid of forgetting her. My mum."),
        say("gran", "下一次，你要是还不用全力，我就真的砍你了。", "Next time, if you still won't go all out, I really will cut you."),
        nar("他走了。夜空被两边的楼夹成一条细缝，缝里有一颗很淡的星星。腰上的灯没有温度。我闭上了眼睛。", "He leaves. The sky is a thin slit between the buildings, with one faint star in it. The lamp at my belt has no warmth. I close my eyes."),
    ], [setv("flag.c5_hurt"), setv("flag.told_gran_mum"), add("light", -1), rel("gran", "warmth", 1), rel("sword", "warmth", 1)], values=["xin"]),
    choice("chase", "strategy", T("不理他，转身去追伊芙琳的墨水瓶", "Ignore him and turn to chase Evelyn and the Inkwell"), [
        nar("我背对着他跑出去三步。第四步的时候，胸口那根弦断了，断得干干净净。", "I run three steps with my back to him. On the fourth, the string in my chest snaps, cleanly."),
        nar("这一次，没有人喊“接上”。", "This time no one shouts 'Rejoin it'."),
    ], [setv("flag.dead_alley")], values=["duo"], ends=True),
], order=3, cast=["gran", "sword", "lamp"])

C5_END = scene("c5_end", "c5", "main", T("涂鸦街口 · 23:20", "Mouth of Mural Street · 23:20"), [
    bg("mural_alley"),
    show("august", "normal", "center"),
    nar("守秘局的车开进了街口。一个西装扣子扣到最上面一颗的老人走过来，看了看满地的蓝色，又看了看我。", "Bureau cars pull into the street. An old man with his jacket buttoned to the top walks over, looks at the blue everywhere, then at me."),
    *iff(F("flag.c5_full"), say("august", "林小姐。整条街的人都看见了。我需要一个晚上，和很多燃气公司的通知单。", "Miss Lin. The whole street saw that. I'll need a night and a great many gas-company notices.", face="serious")),
    *iff(F("flag.c5_hurt"), say("august", "别说话。我送您去医院。那里有一位医生，不问问题。", "Don't talk. I'll take you to hospital. There's a doctor there who doesn't ask questions.")),
    *iff(ALL(NF("flag.c5_full"), NF("flag.c5_hurt")), say("august", "您没受伤？……那请帮我扶一下文斯先生。他得去医院。", "You're not hurt? …Then please help me with Mr. Vince. He needs a hospital.")),
], [choice("go", "expression", T("上车", "Get in the car"), [], [setv("flag.c5_done")], values=["xin"])], order=4, cast=["august"])

CHAPTERS = [{"id": "c5", "title": T("第五章 · 荆棘的诗", "Chapter 5 · The Thorn's Poem"), "intro": [P(T("周五，夜。旧港区，涂鸦街。", "Friday night. The old harbor, Mural Street."))], "offer": 2}]
NODES = [S5_CARLO, S5_EVELYN, C5_ALLEY, C5_ASK, C5_GRAN, C5_END]
DEAD = [
  {"id": "alley", "flag": "flag.dead_alley", "title": T("坏结局「背后」", "Bad End: Behind You"), "cg": "cg_m_spilled",
   "text": T("线断了。灯落进蓝色的油漆里，再也没有亮。那一夜以后，你又变回了一个只会修收音机的人。",
             "The line is cut. The lamp falls into the blue paint and never lights again. After that night you're just someone who fixes radios."),
   "clinic": T("戴圆框眼镜的医生：“断剑砍的是连结。把背留给他，就是把线留给他。你见过他砍摩天轮——他从来先砍什么？”",
               "The doctor in round glasses: 'The Sword cuts links. Turn your back on him and you hand him the line. You saw him at the wheel—what does he always cut first?'")},
]

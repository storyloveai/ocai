"""三国·谋士 卷四（荆州之殇，第74–77回）。

接着卷三：同名变量（关系、名声、剧情标记）由上一卷带来；没玩过卷三的玩家从“前情”开始。
卷三结尾在关羽身边的（回了荆州，或自请送印去了荆州），这一卷在樊城前线（荆州线）；其余的在成都（成都线）。
成都线第三章可以自请去荆州；留在成都的，第五章去上庸催刘封发兵，第六章可以赶到麦城。两条线在麦城汇合。
关羽能不能活下来（2026-10-27 定，见决策记录）：荆州一定丢；关羽本人可以活着退回西川，门槛很高——
要他肯听你的，再加上至少两条“活路”：留兵守后方、糜芳的报信、上庸的援兵、早一步派人求救、早就劝主公派兵接应。
原著引文只取公版原文，并已核对（见 sources）；其余叙述和英文都是我们自己写的。细纲见 docs/全书规划.md。
"""
import json, pathlib, sys
HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE.parent))
from lib import *
import speech, values
from talks import topic, talk_node
from asks import ans
import people_v4 as P4

V3 = json.loads((HERE.parent / "v3" / "campaign_v3.json").read_text())

def flag(label, carry=True):
    d = {"type": "flag", "init": False, "label": label}
    if not carry: d["carry"] = False
    return d
def I(c, k, op, v): return V(f"imp.{c}.{k}", op, v)

# where you are: beside Guan Yu if Volume III ended with you in Jingzhou; otherwise Chengdu
JING = ANY(F("flag.post_jingzhou"), F("flag.v3_to_jing"))
TO_JING = F("flag.v4_to_jing")           # a Chengdu player who rides to Jingzhou at the end of chapter 3
AT_JING = ANY(JING, TO_JING)
CD = ALL(NF("flag.post_jingzhou"), NF("flag.v3_to_jing"), NF("flag.v4_to_jing"))
RIDE = F("flag.v4_ride")                 # a Chengdu player who rides from Shangyong to Maicheng in chapter 5
AT_GUAN = ANY(AT_JING, RIDE)
HOME = ALL(CD, NF("flag.v4_ride"))       # still in Chengdu at the end
AWAY = ANY(F("prev.ended_early"), V("track", "==", "cao"))
STAYING = ALL(NF("flag.v4_hermit"), NF("flag.v4_left"), NF("flag.v4_exposed"))
WZ_J = F("flag.wz_jingzhou")
WZ_W = F("flag.wz_west")
WZ = ANY(WZ_J, WZ_W)
WZ_NEAR = ANY(ALL(AT_JING, WZ_J), ALL(CD, WZ_W))
WZ_FAR = ALL(WZ, ANY(ALL(AT_JING, WZ_W), ALL(CD, WZ_J)))

# the ways out of Maicheng; Guan Yu can live only if he listens to you and at least two of them are open
L1, L2, L3, L4, L5 = F("flag.v4_kept_rear"), F("flag.v4_mf_path"), F("flag.v4_relief"), F("flag.warned_jing"), F("flag.v4_early_call")
_L = [L1, L2, L3, L4, L5]
TWO = ANY(*[ALL(a, b) for i, a in enumerate(_L) for b in _L[i + 1:]])
LISTEN = ANY(AT("guanyu", "trust", 3), AT("guanyu", "warmth", 3), L3)
SAVE_HINT = T("需要关羽肯听你的（信任在「倚重」或交情在「交好」以上，或你带着援兵赶到），并且至少有两条活路：留兵守后方、糜芳的报信、上庸的援兵、早一步派人求救、早就劝主公派兵往上庸",
              "Needs Guan Yu to listen to you (trust at Relied on or friendship at Friends, or you arrive with relief troops) and at least two ways out: troops kept back in the rear, word from Mi Fang, relief from Shangyong, sending for help early, or the column you urged your lord to send toward Shangyong")

# ------------------------------------------------------------------ vars
# everything Volume III knew, with the same names, so it carries over; this volume's own state is added below
VARS = {k: v for k, v in json.loads(json.dumps(V3["vars"])).items() if not k.startswith(("heat.", "debt."))}
FLAGS = {
    "flag.v4_came_back": T("流落之后回到刘备身边", "Came back to Liu Bei after wandering"),
    "flag.v4_hermit": T("就此隐去", "Disappeared from the world"),
    "flag.pd_guard": T("替关羽掠阵", "Watched Guan Yu's back in the duel"),
    "flag.pd_bow": T("看破庞德的冷箭", "Saw Pang De's hidden arrow coming"),
    "flag.flood_plan": T("献计放水", "Proposed the flood"),
    "flag.flood_people": T("放水前先让下游百姓撤走", "Had the people downstream moved before the flood"),
    "flag.pd_spare": T("劝关羽留庞德一命", "Urged Guan Yu to spare Pang De"),
    "flag.pow_home": T("放于禁的降兵回家", "Let Yu Jin's surrendered men go home"),
    "flag.bone_rest": T("劝关羽回江陵养伤", "Urged Guan Yu to go back to Jiangling to heal"),
    "flag.wz_huatuo": T("温芷跟华佗走了", "Wen Zhi went with Hua Tuo"),
    "flag.v4_to_jing": T("自请去荆州", "Asked to go to Jingzhou"),
    "flag.v4_order": T("请汉中王给刘封下了令", "Had the King of Hanzhong send orders to Liu Feng"),
    "flag.v4_early_sy": T("先去了上庸", "Went to Shangyong ahead of time"),
    "flag.lx_warned": T("提醒关羽陆逊的信有诈", "Warned Guan Yu that Lu Xun's letter was a trick"),
    "flag.v4_kept_rear": T("劝关羽留兵守后方", "Persuaded Guan Yu to keep troops in the rear"),
    "flag.mf_kind": T("给糜芳写了安抚的信", "Wrote Mi Fang a letter to calm him"),
    "flag.mf_pressed": T("写信催糜芳送粮", "Wrote to Mi Fang demanding grain"),
    "flag.v4_mf_path": T("糜芳派人送来一句话", "Mi Fang sent you a word of warning"),
    "flag.v4_early_call": T("劝关羽及早向上庸、成都求救", "Urged Guan Yu to call for help from Shangyong and Chengdu early"),
    "flag.v4_relief": T("从上庸带来了援兵", "Brought relief troops from Shangyong"),
    "flag.v4_ride": T("从上庸赶往麦城", "Rode from Shangyong to Maicheng"),
    "flag.guan_alive": T("关羽活着退回了西川", "Guan Yu lived and fell back to the west"),
    "flag.v4_with_guan": T("随关羽走了临沮小路", "Went with Guan Yu down the Linju road"),
    "flag.v4_letter": T("带着关羽的信突围", "Broke out carrying Guan Yu's letter"),
    "flag.v4_counsel_wait": T("劝汉中王先别急着报仇", "Urged the King of Hanzhong not to rush into revenge"),
    "flag.v4_vow": T("请命为关羽报仇", "Asked to lead the revenge for Guan Yu"),
    "flag.v4_wz_letter": T("把给温芷的信揣在怀里", "Kept your letter to Wen Zhi to hand her yourself"),
    "flag.v4_left": T("被冷落后离开", "Left after being sidelined"),
    "flag.v4_exposed": T("妖人之名坐实", "Branded a sorcerer for good"),
}
for k, lab in FLAGS.items(): VARS[k] = flag(lab)

# ------------------------------------------------------------------ people
CHARS = json.loads(json.dumps(V3["chars"]))
for k, p in P4.PERSONA.items(): CHARS[k]["persona"] = p
DIMS = dict(V3["dims"])
for c in CHARS:
    if CHARS[c].get("heat"):
        VARS[f"heat.{c}"] = {"type": "num", "init": 0, "min": 0, "max": 5, "char": c, "show": False, "carry": False,
                             "label": T(CHARS[c]["name"]["zh"] + "·火气", CHARS[c]["name"]["en"] + " · Temper")}

# ------------------------------------------------------------------ echoes & debts
ECHOES = {
    "e_pd_guard": T("关羽和庞德交手时，你在阵前替他盯着", "When Guan Yu fought Pang De, you watched his back"),
    "e_pd_bow": T("你喊破了庞德的冷箭", "You shouted a warning about Pang De's hidden arrow"),
    "e_flood": T("放水淹七军，是你献的计", "The flood that drowned the seven armies was your plan"),
    "e_people": T("放水之前，你让下游的百姓先撤了", "Before the flood you had the people downstream moved"),
    "e_pow": T("你劝关羽放于禁的降兵回家", "You had Guan Yu let Yu Jin's men go home"),
    "e_bone": T("刮骨那天，你陪关羽下完了那盘棋", "The day of the bone-scraping, you finished that game of weiqi with Guan Yu"),
    "e_rest": T("你劝过关羽回江陵养伤", "You urged Guan Yu to go back to Jiangling and heal"),
    "e_lx": T("你说过陆逊那封信有诈", "You said Lu Xun's letter was a trick"),
    "e_rear": T("后方那几千兵，是你劝关羽留下的", "The few thousand men left in the rear were your doing"),
    "e_mf_kind": T("你给糜芳写过一封安抚的信", "You wrote Mi Fang a letter to calm him"),
    "e_mf_press": T("你写信催过糜芳的粮", "You wrote to Mi Fang demanding grain"),
    "e_call": T("你劝关羽早一步派人求救", "You urged Guan Yu to send for help early"),
    "e_sy": T("你在上庸跟刘封、孟达争过", "You argued with Liu Feng and Meng Da at Shangyong"),
}
DEBTS = {}

SIDE_PROMPT = T("这段日子，你只来得及做一件事。", "These days you only have time for one thing.")
CHAPTERS = [
    {"id": "c1", "title": T("抬榇", "The Coffin"), "year": T("建安二十四年（219）", "Jian'an 24 (219)"), "canon": T("第74回", "Ch. 74"), "offer": 2,
     "intro": [P(T("关羽围了樊城。曹操派于禁领七军来救，先锋是庞德。庞德出兵前，让人抬着一口棺材走在军前。", "Guan Yu has laid siege to Fancheng. Cao Cao sends Yu Jin with seven armies to relieve it, with Pang De in the vanguard. Before he marches, Pang De has a coffin carried at the head of his troops."), AT_JING),
               P(T("成都。荆州的捷报一封接一封。汉中王每封都要念两遍，念完了笑，笑完了又问：二弟那边，还缺什么？", "Chengdu. Victory dispatches arrive from Jingzhou one after another. The King of Hanzhong reads each one twice, laughs, and then asks: what else does my brother need?"), CD)]},
    {"id": "c2", "title": T("水淹七军", "The Flood"), "year": T("建安二十四年（219）", "Jian'an 24 (219)"), "canon": T("第74回", "Ch. 74"), "offer": 2,
     "intro": [P(T("八月，秋雨一连下了好些天。于禁把七军屯在樊城北面的山谷里。关羽骑马上了高处，看了很久。", "The eighth month. The autumn rain has fallen for days on end. Yu Jin has camped his seven armies in a valley north of Fancheng. Guan Yu rides up to high ground and looks for a long time."), AT_JING),
               P(T("成都也在下雨。荆州的信使已经三天没来了。", "It is raining in Chengdu too. No courier has come from Jingzhou in three days."), CD)]},
    {"id": "c3", "title": T("刮骨", "Scraping the Bone"), "year": T("建安二十四年（219）", "Jian'an 24 (219)"), "canon": T("第75回", "Ch. 75"), "offer": 2,
     "intro": [P(T("关羽威震华夏，许都人心惶惶。可他左臂上那支箭的毒，一直没有退。右臂能挥刀，左臂已经抬不起来了。", "Guan Yu's name shakes the realm, and Xuchang is in a panic. But the poison from the arrow in his left arm has never cleared. His right arm can still swing a blade; his left can no longer be raised."), AT_JING),
               P(T("成都。消息说：关将军箭伤未愈，东吴的吕蒙病了，回建业养病去了。诸葛亮把这两句话念了两遍。", "Chengdu. The news says General Guan's arrow wound hasn't healed, and Lü Meng of Wu has fallen ill and gone home to Jianye. Zhuge Liang reads those two lines twice."), CD)]},
    {"id": "c4", "title": T("白衣渡江", "Crossing in White"), "year": T("建安二十四年（219）", "Jian'an 24 (219)"), "canon": T("第75回", "Ch. 75"), "offer": 2,
     "intro": [P(T("接替吕蒙守陆口的，是一个叫陆逊的年轻书生。他派人送来一封信和一份厚礼，信里说的全是好话。", "The man who replaces Lü Meng at Lukou is a young scholar called Lu Xun. He sends a letter and a generous gift, and the letter is nothing but praise."), AT_JING),
               P(T("你刚到荆州，路上的尘土还没拍干净。", "You've only just reached Jingzhou, the dust of the road still on you."), TO_JING),
               P(T("成都。东吴换了守将的消息，比别的消息晚到了半个月。", "Chengdu. The news that Wu has changed its commander arrives half a month later than everything else."), CD)]},
    {"id": "c5", "title": T("败走", "Retreat"), "year": T("建安二十四年（219）", "Jian'an 24 (219)"), "canon": T("第76回", "Ch. 76"), "offer": 2,
     "intro": [P(T("曹操派徐晃来解樊城之围。同一个月，消息从南边传来：吕蒙的兵扮成商人，夜里渡江，烽火台一个火也没点起来。", "Cao Cao sends Xu Huang to break the siege of Fancheng. In the same month word comes up from the south: Lü Meng's men crossed the river at night disguised as merchants, and not one beacon tower was lit."), AT_JING),
               P(T("上庸。刘封、孟达守着这座山城，离荆州最近，离成都很远。", "Shangyong. Liu Feng and Meng Da hold this mountain town, the nearest to Jingzhou and a long way from Chengdu."), CD)]},
    {"id": "c6", "title": T("麦城", "Maicheng"), "year": T("建安二十四年冬（219）", "Winter, Jian'an 24 (219)"), "canon": T("第76–77回", "Ch. 76–77"), "offer": 1,
     "intro": [P(T("麦城很小，城墙不高。跟着关羽进城的，只剩三百多人。", "Maicheng is small, its walls low. Only some three hundred men followed Guan Yu inside."), AT_GUAN),
               P(T("成都。入冬以后，荆州那边再也没有信来。", "Chengdu. Since winter set in, no more letters have come from Jingzhou."), HOME)]},
]

# ------------------------------------------------------------------ nodes
N = []
def cast_(*ids): return [{"id": i} for i in ids]

# ---------- opening interlude: for anyone who left in an earlier volume ----------
N.append(node("x_return4", "*", "interrupt", T("故人来信", "A Letter from an Old Friend"), "free", T("原创", "original"),
    [P(T("你离开刘备已经好几年了。", "It has been several years since you left Liu Bei."), F("prev.ended_early")),
     P(T("你在北方住了好几年。曹操成了魏王，许都的人都在说，关羽要打过来了。", "You have lived in the north for years. Cao Cao is King of Wei now, and everyone in Xuchang says Guan Yu is coming."), V("track", "==", "cao")),
     P(T("一封信辗转送到你手里，是诸葛亮的字：『荆州要有大事。子衡兄若还记得当年，请来成都。』", "A letter reaches you by a winding road, in Zhuge Liang's hand: 'Something great is coming to Jingzhou. If you still remember the old days, come to Chengdu.'"))],
    [choice("back", "dilemma", T("动身去成都。", "Set out for Chengdu."),
            T("诸葛亮在城门口等你。他没多说，只把一叠荆州的战报交给你：『先看这些。』", "Zhuge Liang waits for you at the city gate. He says little; he just hands you a sheaf of reports from Jingzhou. 'Read these first.'"),
            [setv("flag.v4_came_back"), setv("track", "liu"), rel("liubei", "trust", -1), rel("zhuge", "esteem", 1)]),
     choice("hermit", "expression", T("把信收好，不去了。", "Put the letter away. You won't go."),
            T("你把信压在枕下。那年冬天，你在集市上听说了麦城。", "You put the letter under your pillow. That winter, in the market, you hear about Maicheng."),
            [setv("flag.v4_hermit")])],
    when=AWAY, order=-2))
N[-1]["choices"][1]["ends"] = True

# ---------- c1 抬榇 ----------
N.append(node("c1_pangde", "c1", "main", T("抬榇", "The Coffin"), "literal", T("第74回", "Ch. 74"),
    [P(T("庞德抬着棺材来到阵前，指名要关羽出来。两人一个舞刀一个舞刀，斗了一百多回合，不分胜负。第二天又战，庞德拖刀败走，关羽追了上去。", "Pang De brings his coffin to the front and calls for Guan Yu by name. Blade against blade, the two of them fight more than a hundred bouts with no winner. The next day they fight again; Pang De drags his blade and turns to flee, and Guan Yu gives chase.")),
     P(T("出阵前，关羽对你说：『一个老卒都斩得了夏侯渊，关某还斩不了一个庞德？』", "Before he rides out, Guan Yu says to you, 'If an old soldier can kill Xiahou Yuan, can't I kill one Pang De?'"), F("flag.fed_pride")),
     P(T("出阵前，关羽看了你一眼：『黄汉升斩了夏侯渊。今天，你看我的。』", "Before he rides out, Guan Yu glances at you. 'Huang Hansheng killed Xiahou Yuan. Today, watch me.'"), F("flag.praised_hz")),
     P(T("你在阵后看着。庞德的左手，一直没离开马鞍边的那张弓。", "You watch from behind the lines. Pang De's left hand never strays far from the bow at his saddle."))],
    [choice("guard", "dilemma", T("拍马跟上去，替他盯着庞德。", "Spur after him and keep your eyes on Pang De."),
            T("庞德回身一箭。你大喊一声，关羽一偏头，箭还是钉进了他的左臂。关平冲上来，和你一左一右把他护回营里。关羽咬着牙说：『子衡，你跑得倒快。』", "Pang De turns in the saddle and looses. You shout; Guan Yu twists his head aside, and the arrow still drives into his left arm. Guan Ping charges up, and between you, one on each side, you get him back to camp. Through his teeth Guan Yu says, 'You ride fast, Ziheng.'"),
            [setv("flag.pd_guard"), rel("guanyu", "warmth", 2), add("renown.loyal")], echo=["e_pd_guard"]),
     choice("bow", "strategy", T("让关平带几个弓手抄到侧面：庞德诈败，必有冷箭。", "Send Guan Ping round the flank with a few archers: Pang De is faking, there's an arrow coming."),
            T("关平刚绕过去，庞德就回身放了箭。关平大喊：『贼将休放冷箭！』箭射中了关羽的左臂，可庞德也不敢再追，被关平的弓手逼回了营。关羽回营后看了你很久：『你怎么知道？』", "Guan Ping has barely got round when Pang De turns and shoots. Guan Ping shouts a warning. The arrow takes Guan Yu in the left arm, but Pang De dares not follow up and is driven back to his camp by Guan Ping's archers. Back in camp Guan Yu looks at you a long time. 'How did you know?'"),
            [setv("flag.pd_bow"), rel("guanyu", "esteem", 1), add("uncanny")], foresight=True, echo=["e_pd_bow"]),
     choice("watch", "expression", T("什么也不做。关将军不用人帮。", "Do nothing. General Guan needs no help."),
            T("庞德回身一箭，正中关羽左臂。关平拼死把父亲救了回来。那天晚上，关羽的左臂肿得穿不上袖子。", "Pang De turns and shoots, and the arrow takes Guan Yu square in the left arm. Guan Ping fights his way to his father and brings him back. That night Guan Yu's arm is too swollen to fit his sleeve."),
            [rel("guanyu", "esteem", -1)])],
    quote=T("关平见庞德拖刀败走，恐关公追赶，乃大叫曰：“贼将休放冷箭！”",
            "Seeing Pang De drag his blade and flee, Guan Ping feared his father would give chase, and shouted, \"Traitor, no hidden arrows!\""),
    callbacks=[cb("e_dandao", T("关羽出阵前看了你一眼：『陆口那天你站我身后。今天也一样。』", "Before he rides out, Guan Yu glances at you. 'At Lukou you stood behind me. Same today.'"), F("flag.dd_guard")),
               cb("e_charge", T("你想起定军山上黄忠那一刀。庞德不是夏侯渊。", "You think of Huang Zhong's stroke on Mount Dingjun. Pang De is no Xiahou Yuan."), F("flag.dj_charge"))],
    when=ALL(AT_JING, NF("flag.v4_hermit")), order=10))

N.append(node("c1_chengdu", "c1", "main", T("捷报", "Good News"), "functional", T("第74回", "Ch. 74"),
    [P(T("汉中王把关羽的捷报拿给众人看，笑得合不拢嘴。散了席，诸葛亮把你留下：『子衡兄，樊城拿下之后呢？』", "The King of Hanzhong shows everyone Guan Yu's dispatch, grinning from ear to ear. When the feast is over, Zhuge Liang keeps you back. 'Ziheng, and after Fancheng falls?'")),
     P(T("你刚回来，帐里还没有你的位子。", "You've only just come back; there's no seat for you at council yet."), F("flag.v4_came_back")),
     P(T("你想起卷宗里那句话：往上庸去的那支兵，走得不算快。", "You think of that line in the files: the column sent toward Shangyong isn't moving fast."), F("flag.warned_jing"))],
    [choice("east", "strategy", T("说：樊城之后，要看东吴。请再派一支兵去上庸，离荆州近些。", "Say: after Fancheng, watch Wu. Send another column to Shangyong, closer to Jingzhou."),
            T("诸葛亮点头，去见了汉中王。汉中王有些不快：『二弟打得正顺，派兵去做什么？』最后还是派了，只是人不多。", "Zhuge Liang nods and goes to the King. The King is a little put out—'My brother is doing so well, why send troops?'—but in the end a column goes, a small one."),
            [setv("flag.warned_jing"), add("uncanny"), rel("zhuge", "esteem", 1), rel("liubei", "warmth", -1)], foresight=True),
     choice("north", "dilemma", T("说：樊城之后，正好两路北上。请主公从汉中出兵，和关将军遥相呼应。", "Say: after Fancheng, march north on two roads. Ask our lord to strike out from Hanzhong in step with General Guan."),
            T("诸葛亮摇着扇子想了很久：『汉中刚打下来，兵马疲惫……这话，亮替你转给主公。』汉中王听了很高兴，可兵马一直没动。", "Zhuge Liang fans himself a long while. 'Hanzhong has only just been won and the men are worn out… I'll pass this on to our lord.' The King is delighted to hear it, but the army never moves."),
            [rel("liubei", "esteem", 1), rel("zhuge", "esteem", -1)]),
     choice("trust", "expression", T("说：关将军自有分寸。", "Say: General Guan knows what he's doing."),
            T("诸葛亮没有接话，只是把扇子收了起来。", "Zhuge Liang doesn't answer. He just folds his fan away."), [rel("liubei", "warmth", 1)])],
    when=ALL(CD, NF("flag.v4_hermit")), order=10))

N.append(talk_node("c1_fazheng", "c1", T("夜谈·法正", "Night Talk: Fa Zheng"),
    T("法正病了，咳得一夜睡不着。你去看他的时候，他还在灯下看账。他摆摆手：『别劝我躺下。坐。』", "Fa Zheng is ill and coughs all night. When you go to see him, he is still going over accounts by the lamp. He waves a hand. 'Don't tell me to lie down. Sit.'"),
    "fazheng", 2,
    [topic("jing", T("问他怎么看荆州。", "Ask him what he makes of Jingzhou."),
           T("法正咳了两声：『关云长赢得太多了。赢得太多的人，后背就忘了。』他看着你，『这话我只跟你说。』", "Fa Zheng coughs twice. 'Guan Yunchang has won too much. A man who wins too much forgets his back.' He looks at you. 'I'm only saying this to you.'"),
           [rel("fazheng", "trust", 1)]),
     topic("ledger", T("问他：账本上，还记着谁？", "Ask him: who's still in the ledger?"),
           T("法正笑了：『人快死了，账就短了。』他把账本合上，『恩的那一页，你还在。』", "Fa Zheng smiles. 'When a man's near the end, the ledger gets shorter.' He closes it. 'You're still on the page for kindnesses.'"),
           [rel("fazheng", "warmth", 1)]),
     topic("rest", T("给他煎一碗药，看着他喝下去。", "Brew him a bowl of medicine and watch him drink it."),
           T("法正皱着眉喝完了：『苦。』过了一会儿又说：『谢谢。』", "Fa Zheng drinks it with a grimace. 'Bitter.' After a while he adds, 'Thank you.'"),
           [rel("fazheng", "warmth", 2)])],
    T("你走的时候，法正说：『子衡，荆州要是有事，你别只看着。』", "As you leave, Fa Zheng says, 'Ziheng, if something happens in Jingzhou, don't just watch.'"), when=ALL(CD, NF("flag.v4_hermit")), order=20))

N.append(node("c1_guanping", "c1", "side", T("关平", "Guan Ping"), "free", T("原创", "original"),
    T("夜里，关平来找你。他明天要替父亲出阵，手一直在抖：『先生，庞德那口棺材……是给我父亲预备的。』", "At night Guan Ping comes to find you. Tomorrow he means to fight in his father's place, and his hands won't stop shaking. 'Sir, that coffin of Pang De's… it's meant for my father.'"),
    [choice("steady", "dilemma", T("陪他坐一夜，教他怎么看庞德的刀路。", "Sit up with him all night and show him how to read Pang De's blade."),
            T("天亮时关平不抖了。他出阵和庞德斗了三十回合，没输。回来时他对你笑了一下，像个孩子。", "By dawn Guan Ping's hands are steady. He fights Pang De for thirty bouts and doesn't lose. Coming back he smiles at you, like a boy."),
            [rel("guanyu", "warmth", 1), rel("guanyu", "trust", 1)]),
     choice("father", "strategy", T("让他去跟父亲说实话。", "Tell him to say it straight to his father."),
            T("关平去了。你不知道他们父子说了什么，只看见第二天，关羽拍了拍关平的肩。", "Guan Ping goes. You never learn what father and son said, only that the next day Guan Yu claps Guan Ping on the shoulder."),
            [rel("guanyu", "esteem", 1)])],
    when=ALL(AT_JING, NF("flag.v4_hermit")), salience=2, order=1))
N[-1]["intro"].append(P(T("他手里还拿着你教他写的那几个字。", "He still has the characters you taught him to write in his hand."), F("flag.post_jingzhou")))

N.append(node("c1_wz", "c1", "side", T("药箱", "The Medicine Chest"), "free", T("原创人物", "original character"),
    [P(T("温芷在营里跟着军医们换药，三天没回住处。她找到你，只问一句：『关将军那支箭，有毒没有？』", "Wen Zhi has been changing dressings with the army physicians and hasn't been back to her lodging in three days. She finds you and asks just one thing. 'That arrow in General Guan—was it poisoned?'"), ALL(AT_JING, WZ_J)),
     P(T("温芷的医馆里来了几个从荆州回来的伤兵。她给你捎话：『荆州那边，缺一种治箭毒的药。』", "A few wounded men back from Jingzhou have turned up at Wen Zhi's clinic. She sends you word: 'Jingzhou is short of a medicine for arrow poison.'"), ALL(CD, WZ_W))],
    [choice("help", "dilemma", T("陪她去找药，一家一家地问。", "Go with her to find it, asking shop after shop."),
            T("你们跑了一整天，找到半箱。她把药包好，在每一包上都写了用法。", "You spend a whole day running about and find half a chest. She wraps each packet and writes the dosage on every one."),
            [rel("wenzhi", "warmth", 1), rel("wenzhi", "intimacy", 1)]),
     choice("plan", "strategy", T("帮她写信，请成都和江陵的药铺都留着这味药。", "Help her write to the herb shops in Chengdu and Jiangling to keep that medicine in stock."),
            T("回信一封封来了。温芷说：『你总想得比我远。』", "The replies come in one by one. Wen Zhi says, 'You always think further ahead than I do.'"),
            [rel("wenzhi", "trust", 1), rel("wenzhi", "esteem", 1)])],
    when=ALL(WZ_NEAR, NF("flag.v4_hermit")), salience=3, order=2))

# ---------- c2 水淹七军 ----------
N.append(node("c2_flood", "c2", "main", T("水淹七军", "The Flood"), "literal", T("第74回", "Ch. 74"),
    [P(T("关羽在高处指给你看：于禁的七军都扎在山谷的低处。『秋雨连绵，襄江的水必然要涨。』他转头问你：『你看呢？』", "From the high ground Guan Yu points it out to you: Yu Jin's seven armies are all camped in the low part of the valley. 'With rain like this, the Xiang will rise.' He turns to you. 'What do you think?'")),
     P(T("他左臂上的那道箭伤，还缠着布。", "His arrow wound is still bound in cloth."), F("flag.pd_guard"))],
    [choice("plan", "strategy", T("献计：先备船筏，堵住各处水口，等水涨起来，一齐放开。", "Propose it: ready boats and rafts, dam every outlet, and when the water is high, open them all at once."),
            T("关羽大笑：『正合我意！』那一夜风雨大作，水从四面八方灌进山谷。天亮时，七军都泡在水里。于禁跪着投降，庞德站在一条小船上，还在射箭。", "Guan Yu roars with laughter. 'Exactly what I had in mind!' That night the storm breaks, and water pours into the valley from every side. By dawn the seven armies are under water. Yu Jin kneels and surrenders; Pang De, standing in a little boat, is still shooting arrows."),
            [setv("flag.flood_plan"), rel("guanyu", "esteem", 2), add("renown.cunning")], echo=["e_flood"]),
     choice("people", "dilemma", T("说：可以放水。可下游还有村子，先派人让百姓上山。", "Say: the flood can be loosed. But there are villages downstream; send men to get the people up the hills first."),
            T("关羽皱眉：『消息走漏了怎么办？』你说只说是防秋汛。他想了想，准了。水放下来的时候，下游的山坡上站满了人，看着曹军的营寨一点点沉下去。", "Guan Yu frowns. 'And if word gets out?' Tell them it's for the autumn floods, you say. He thinks, and agrees. When the water comes down, the slopes downstream are crowded with people watching Cao's camps sink bit by bit."),
            [setv("flag.flood_people"), rel("guanyu", "trust", 1), add("renown.loyal")], echo=["e_people"]),
     choice("quiet", "expression", T("说：将军早有主意，子衡不必多言。", "Say: the general has already decided; I needn't say anything."),
            T("关羽看了你一眼，没说什么。那一夜，水淹了七军。", "Guan Yu glances at you and says nothing. That night the water drowns seven armies."),
            [rel("guanyu", "esteem", -1)])],
    quote=T("于禁七军不屯于广易之地，而聚于罾口川险隘之处；方今秋雨连绵，襄江之水必然泛涨。",
            "Yu Jin has not camped his seven armies on broad open ground but crowded them into the narrow pass at Zengkou; and with the autumn rains falling day after day, the Xiang River is bound to flood."),
    callbacks=[cb("e_pd_bow", T("关羽说：『你连庞德的箭都看得见，这场雨，你也该看得见。』", "Guan Yu says, 'You saw Pang De's arrow coming. You should be able to see this rain too.'"), F("flag.pd_bow"))],
    when=ALL(AT_JING, NF("flag.v4_hermit")), order=10))

N.append(node("c2_cd", "c2", "main", T("威震华夏", "The Realm Shakes"), "functional", T("第74–75回", "Ch. 74–75"),
    [P(T("捷报到了：关将军水淹七军，擒于禁，斩庞德。许都人心惶惶，听说曹操都想迁都避一避。汉中王当夜摆宴，喝得大醉。", "The dispatch arrives: General Guan has drowned seven armies, captured Yu Jin, beheaded Pang De. Xuchang is in a panic; they say Cao Cao is even thinking of moving the capital. That night the King of Hanzhong throws a feast and drinks himself senseless.")),
     P(T("席散了，诸葛亮没有喝醉。", "When the feast is over, Zhuge Liang is not drunk.")),
     P(T("五虎将那回，关羽的回信晚了一个月。这一回，捷报倒是来得很快。", "Over the Five Tigers, Guan Yu's reply came a month late. This time the victory dispatch came quickly enough."), F("flag.wh_ask")),
     P(T("杨修死后，诸葛亮每回问你话，都要先看你一眼。", "Since Yang Xiu's death, Zhuge Liang always looks at you before he asks you anything."), F("flag.jl_yangxiu"))],
    [choice("wu", "strategy", T("找诸葛亮：曹操要迁都，有人会劝他别迁，去找孙权。", "Go to Zhuge Liang: if Cao Cao talks of moving the capital, someone will tell him not to—and to go to Sun Quan instead."),
            T("诸葛亮的扇子停了：『曹操许孙权江南之地，孙权去打荆州……』他没说完，连夜写了一封信给关羽。信送到的时候，关羽正在给新得的降将摆酒。", "Zhuge Liang's fan stops. 'Cao Cao promises Sun Quan the south, and Sun Quan strikes at Jingzhou…' He doesn't finish. He writes to Guan Yu that same night. When the letter arrives, Guan Yu is giving a feast for his new prisoners."),
            [rel("zhuge", "esteem", 1), rel("zhuge", "trust", 1), add("uncanny")], foresight=True),
     choice("toast", "expression", T("陪汉中王喝到天亮。", "Drink with the King until dawn."),
            T("汉中王拉着你的手：『子衡，二弟这一仗，咱们离长安不远了。』你陪他喝了一杯又一杯。", "The King holds your hand. 'Ziheng, after this battle of my brother's, Chang'an isn't far.' You drink with him cup after cup."),
            [rel("liubei", "warmth", 1), rel("liubei", "trust", 1)]),
     choice("supply", "dilemma", T("上书：关将军得了几万降兵，粮一定不够。请从蜀中运粮去荆州。", "Submit a memorial: General Guan has tens of thousands of prisoners and can't have enough grain. Send grain from Shu to Jingzhou."),
            T("汉中王准了。运粮的车队走得很慢，蜀道太难。你算了算日子，心里发凉。", "The King approves it. The grain train moves slowly; the roads out of Shu are hard. You count the days and go cold."),
            [rel("liubei", "esteem", 1), add("renown.loyal")])],
    when=ALL(CD, NF("flag.v4_hermit")), order=10))

N.append(node("c2_pow", "c2", "side", T("降兵", "The Prisoners"), "free", T("第74回之后", "after Ch. 74"),
    T("于禁的降兵有好几万。关羽让人把他们都押回江陵。粮官来找你：江陵的粮，养自己的兵都紧，再添几万张嘴……", "Yu Jin's surrendered men number in the tens of thousands. Guan Yu has them all marched back to Jiangling. The grain officer comes to you: Jiangling's grain barely feeds our own men, and now tens of thousands more mouths…"),
    [choice("home", "dilemma", T("劝关羽：家在北方的，放他们回家。", "Urge Guan Yu: let the ones whose homes are in the north go home."),
            T("关羽不太情愿，还是放了一半人。那些人走的时候，有人回头冲着营门磕头。", "Guan Yu is reluctant, but lets half of them go. As they leave, some turn and bow to the ground toward the camp gate."),
            [setv("flag.pow_home"), rel("guanyu", "esteem", -1), add("renown.loyal")], echo=["e_pow"]),
     choice("work", "strategy", T("让降兵去修城、屯田，自己挣口粮。", "Put the prisoners to work on the walls and the fields to earn their keep."),
            T("江陵的城墙加高了一尺。粮官松了口气。", "Jiangling's walls rise by a foot. The grain officer breathes again."),
            [rel("guanyu", "esteem", 1), add("renown.cunning")])],
    when=ALL(AT_JING, NF("flag.v4_hermit")), salience=2, order=1))

N.append(node("c2_wz_note", "c2", "side", T("家书", "A Letter Home"), "free", T("原创人物", "original character"),
    [P(T("温芷托人捎来一封信：医馆一切都好，就是城里的人都在说荆州。最后一行写：『你答应过我的话，还记得吧。』", "Wen Zhi sends a letter: the clinic is fine, only everyone in town is talking about Jingzhou. On the last line: 'You remember what you promised me.'"), WZ_FAR),
     P(T("温芷就在营里，可你们已经好几天没说上话了。她让人带话：『晚上来，给你换药。』你身上没伤。", "Wen Zhi is right here in camp, but you haven't spoken in days. She sends word: 'Come tonight, I'll change your dressing.' You aren't wounded."), WZ_NEAR)],
    [choice("go", "dilemma", T("晚上去找她。", "Go to her tonight."),
            T("她真的给你换了药——手腕上一道你自己都没发现的划伤。换完了，她没让你走。", "She really does change a dressing—on a scratch on your wrist you hadn't even noticed. When she's done, she doesn't let you leave."),
            [rel("wenzhi", "intimacy", 1), rel("wenzhi", "warmth", 1)], when=WZ_NEAR),
     choice("write", "dilemma", T("回一封信：记得。", "Write back: I remember."),
            T("你只写了两个字。她回信说，这两个字她看了很多遍。", "You write just three words. She writes back that she has read them many times."),
            [rel("wenzhi", "intimacy", 1), rel("wenzhi", "trust", 1)], when=WZ_FAR),
     choice("later", "expression", T("等打完这一仗再说。", "Wait until this battle is over."),
            T("这一仗打完，还有下一仗。", "When this battle is over, there's another."), [rel("wenzhi", "warmth", -1)])],
    when=ALL(WZ, NF("flag.v4_hermit")), salience=3, order=2))

# ---------- c3 刮骨 ----------
N.append(node("c3_bone", "c3", "main", T("刮骨疗毒", "Scraping the Bone"), "literal", T("第75回", "Ch. 75"),
    [P(T("一个叫华佗的郎中驾着小船来了。他看了伤，说毒已入骨，要立一根柱子，把臂套在环里，用刀割开皮肉，把骨上的毒刮掉。关羽笑了：『何必柱环。』他叫人摆酒，伸出左臂，右手和马良下棋。", "A physician named Hua Tuo arrives by little boat. He looks at the wound and says the poison has reached the bone: a post must be set up and the arm fixed in a ring, the flesh cut open, and the poison scraped from the bone. Guan Yu laughs. 'Why bother with posts and rings?' He calls for wine, stretches out his left arm, and plays weiqi with Ma Liang with his right.")),
     P(T("温芷站在华佗身边，捧着药盘。", "Wen Zhi stands beside Hua Tuo, holding the tray of medicines."), ALL(WZ_J, NF("flag.wz_huatuo")))],
    [choice("game", "dilemma", T("马良的手在抖。你接过棋子，替他下完这盘棋。", "Ma Liang's hand is shaking. Take the stones from him and finish the game yourself."),
            T("刀刮在骨头上，帐里的人都捂住了眼。关羽一边喝酒一边落子，跟你说笑。最后一子落下，他赢了半目。华佗收了刀：『某为医一生，未尝见此。君侯真天神也！』关羽笑着对你说：『你让了我半目。』", "The blade scrapes on bone, and everyone in the tent covers their eyes. Guan Yu drinks and plays and jokes with you. When the last stone goes down he has won by half a point. Hua Tuo puts away his knife and declares he has never seen the like in all his years of healing. Guan Yu says to you, smiling, 'You let me have that half point.'"),
            [rel("guanyu", "warmth", 2), rel("guanyu", "trust", 1)], echo=["e_bone"]),
     choice("rest", "strategy", T("等华佗刮完，劝关羽：照华佗说的，百日之内不要动怒，回江陵去养伤。", "When Hua Tuo is done, urge Guan Yu to do as Hua Tuo says: no anger for a hundred days, and go back to Jiangling to heal."),
            T("关羽活动了一下左臂：『樊城就在眼前，回什么江陵。』可他答应你，后方的事多留心。华佗走时对你说：『将军的伤，好了七分。剩下三分，在他心里。』", "Guan Yu flexes his arm. 'Fancheng is right in front of me. Why go back to Jiangling?' But he promises to keep a closer eye on the rear. As he leaves, Hua Tuo tells you, 'The general's wound is seven parts healed. The other three are in his heart.'"),
            [setv("flag.bone_rest"), rel("guanyu", "esteem", 1), add("renown.cunning")], echo=["e_rest"]),
     choice("hold", "expression", T("上前按住他的肩。", "Step up and hold his shoulder."),
            T("关羽看了你一眼：『你怕什么？』可他没有甩开你的手。", "Guan Yu glances at you. 'What are you afraid of?' But he doesn't shake off your hand."),
            [rel("guanyu", "warmth", 1)])],
    quote=T("公饮酒食肉，谈笑弈棋，全无痛苦之色。……佗曰：“某为医一生，未尝见此。君侯真天神也！”",
            "The Lord drank wine and ate meat, chatting, laughing and playing weiqi, with no trace of pain. … Tuo said, \"In all my life as a physician I have never seen the like. My lord is truly a god!\""),
    when=ALL(AT_JING, NF("flag.v4_hermit")), order=10))

N.append(talk_node("c3_guanyu", "c3", T("夜谈·关羽", "Night Talk: Guan Yu"),
    [P(T("刮骨之后的那天夜里，关羽睡不着，叫你去帐里喝酒。他的左臂用布吊着，右手倒酒，一滴没洒。", "The night after the scraping, Guan Yu can't sleep and calls you to his tent for wine. His left arm is in a sling; he pours with his right and spills not a drop.")),
     P(T("你想起几年前他说过的那句话：『所以我不能丢。』", "You think of what he said years ago: 'That's why I can't lose it.'"), F("flag.guan_charge"))],
    "guanyu", 2,
    [topic("fame", T("说：如今天下都知道将军的名字了。", "Say: the whole realm knows your name now."),
           T("关羽眯着眼笑：『曹孟德要迁都。』笑完了，他又说，『名字大了，招的东西也多。』", "Guan Yu narrows his eyes and smiles. 'Cao Mengde wants to move his capital.' Then he adds, 'The bigger the name, the more it draws.'"),
           [rel("guanyu", "warmth", 1)]),
     topic("wu", T("说：吕蒙病得太巧了。", "Say: Lü Meng fell ill at a very convenient time."),
           T("关羽沉默了一会儿：『军师也写信来说这个。』他把酒杯放下，『东吴那些人，我看不上。可我不糊涂。』", "Guan Yu is silent a while. 'The strategist wrote to say the same.' He sets down his cup. 'I don't think much of those men in Wu. But I'm not a fool.'"),
           [rel("guanyu", "esteem", 1), rel("guanyu", "trust", 1)]),
     topic("brother", T("问他：想不想大哥？", "Ask him: do you miss your elder brother?"),
           T("关羽看着帐外：『桃园那年，我们三个都还年轻。』他没再说下去，给你倒满了酒。", "Guan Yu looks out of the tent. 'The year of the peach garden, the three of us were young.' He says no more, and fills your cup."),
           [rel("guanyu", "warmth", 2)]),
     topic("huarong", T("说起华容道。", "Bring up Huarong."),
           [P(T("『那一跪，我还记着。』关羽说，『如今我在打他的城。你说，那天放他，对还是不对？』", "'You knelt. I still remember.' Guan Yu says. 'Now I'm besieging his city. Tell me—was letting him go that day right or wrong?'"), F("flag.vouched_guan")),
            P(T("『那天你在道上求我。』关羽说，『如今我在打他的城。』他笑了一下，很淡。", "'That day you begged me on the road,' Guan Yu says. 'Now I'm besieging his city.' He smiles, faintly."), F("flag.pleaded_guan")),
            P(T("关羽摇摇头：『那件事，不提了。』", "Guan Yu shakes his head. 'Let's not speak of that.'"), ALL(NF("flag.vouched_guan"), NF("flag.pleaded_guan")))],
           [rel("guanyu", "warmth", 1)])],
    T("你走的时候，关羽说：『子衡，你在，我心里踏实些。』", "As you leave, Guan Yu says, 'With you here, Ziheng, I feel steadier.'"), when=ALL(AT_JING, NF("flag.v4_hermit")), order=20))
N[-1]["callbacks"] = [cb("e_pd_guard", T("关羽举起吊着的左臂：『这支箭，要不是你喊那一声，就钉在我脖子上了。』", "Guan Yu raises his slung arm. 'If you hadn't shouted, this arrow would have been in my neck.'"), F("flag.pd_guard")),
                      cb("e_flood", T("关羽说：『七军是你淹的，名字却记在我头上。』", "Guan Yu says, 'You drowned the seven armies, and my name gets the credit.'"), F("flag.flood_plan"))]

N.append(node("c3_wz_huatuo", "c3", "side", T("华佗", "Hua Tuo"), "free", T("原创人物", "original character"),
    T("华佗要走了。他看过温芷换药的手法，对她说：『姑娘若愿意，可以跟我走，我教你刮骨的刀法。』温芷来问你。", "Hua Tuo is leaving. He has watched Wen Zhi change dressings, and tells her, 'If you're willing, miss, come with me. I'll teach you how to cut to the bone.' Wen Zhi comes to ask you."),
    [choice("go", "dilemma", T("让她去：这样的机会，一辈子只有一次。", "Let her go: a chance like this comes once in a lifetime."),
            T("温芷背着药箱上了华佗的小船。船走出去很远，她还站在船尾。你不知道，这一走，她躲过了后来的事。", "Wen Zhi climbs into Hua Tuo's little boat with her medicine chest. Long after it has pulled away she is still standing at the stern. You don't know it yet, but going saves her from what comes next."),
            [setv("flag.wz_huatuo"), rel("wenzhi", "esteem", 2), rel("wenzhi", "trust", 1)]),
     choice("stay", "dilemma", T("留她：荆州的伤兵，离不开她。", "Keep her: Jingzhou's wounded can't do without her."),
            T("温芷谢过华佗，留了下来。她说：『刀法可以以后学。你在这里。』", "Wen Zhi thanks Hua Tuo and stays. 'I can learn the knife later,' she says. 'You're here.'"),
            [rel("wenzhi", "intimacy", 2)])],
    when=ALL(AT_JING, WZ_J, NF("flag.v4_hermit")), salience=4, order=1))

N.append(node("c3_cd", "c3", "main", T("吕蒙病了", "Lü Meng Is Ill"), "functional", T("第75回", "Ch. 75"),
    [P(T("诸葛亮把那两句消息摆在汉中王面前：关将军箭伤未愈；吕蒙病了。『主公，吕子明这病，来得太是时候。』汉中王转头问你。", "Zhuge Liang lays those two pieces of news before the King: General Guan's wound hasn't healed; Lü Meng is ill. 'My lord, Lü Ziming's illness has come at a very convenient time.' The King turns to you.")),
     P(T("法正在一旁咳了两声：『子衡，别只看着。』", "Fa Zheng coughs twice beside you. 'Ziheng, don't just watch.'"), AT("fazheng", "trust", 2))],
    [choice("go", "dilemma", T("自请去荆州，守在关将军身边。", "Ask to go to Jingzhou and stay at General Guan's side."),
            T("汉中王握着你的手，握了很久：『二弟脾气大，只有几个人的话他肯听。你去，我放心。』你当天就上了路。诸葛亮送你出城，只说了一句：『看住后方。』", "The King holds your hand a long time. 'My brother has a temper; there are only a few men he'll listen to. If you go, I can rest.' You set out that same day. Zhuge Liang sees you out of the city and says just one thing: 'Watch the rear.'"),
            [setv("flag.v4_to_jing"), KEY(rel("liubei", "trust", 1)), rel("guanyu", "warmth", 1), add("renown.loyal")]),
     choice("order", "strategy", T("请汉中王给上庸的刘封、孟达下令：荆州有急，即刻发兵，不必再问。", "Ask the King to send orders to Liu Feng and Meng Da at Shangyong: if Jingzhou is in trouble, march at once without waiting to ask."),
            T("汉中王写了令，盖了印。诸葛亮看着信使出城，低声说：『但愿用不上。』", "The King writes the order and seals it. Zhuge Liang watches the courier ride out and says quietly, 'Let's hope it isn't needed.'"),
            [setv("flag.v4_order"), rel("zhuge", "esteem", 1), add("renown.cunning")]),
     choice("calm", "expression", T("说：吕蒙病了，正是关将军的好时机。", "Say: with Lü Meng ill, it's General Guan's moment."),
            T("汉中王点头：『是这个理。』诸葛亮看着你，没说话。", "The King nods. 'That's right.' Zhuge Liang looks at you and says nothing."),
            [rel("liubei", "warmth", 1), rel("zhuge", "esteem", -1)])],
    when=ALL(CD, NF("flag.v4_hermit")), order=10))

# ---------- c4 白衣渡江 ----------
N.append(node("c4_luxun", "c4", "main", T("陆逊的信", "Lu Xun's Letter"), "functional", T("第75回", "Ch. 75"),
    [P(T("陆逊的信写得很恭敬：说将军威震华夏，说自己年轻无知，请将军多多指教。关羽看完，仰面大笑，把信递给你：『孙权用这样的孺子做将，江东无人了。』", "Lu Xun's letter is deeply respectful: the general's name shakes the realm, the writer is young and ignorant, and begs the general's guidance. Guan Yu reads it, throws back his head and laughs, and hands it to you. 'If Sun Quan has to put a child like this in command, there's no one left in the east.'")),
     P(T("他已经下了令：把江陵、公安留守的兵调一大半来樊城。", "He has already given the order: most of the troops left to hold Jiangling and Gong'an are to come north to Fancheng.")),
     P(T("孙权求亲那回，是你替关羽挡下了难听的话。东吴没有当场动怒——可这封信，客气得过了头。", "When Sun Quan proposed the match, it was you who kept Guan Yu from saying something ugly. Wu didn't flare up at the time—but this letter is too polite by half."), F("flag.hn_soft")),
     P(T("你想起诸葛瑾的回信：吴侯的脸，不是一封信能补的。", "You remember Zhuge Jin's reply: the Marquis's face can't be mended with a letter."), F("flag.hn_apology")),
     P(T("诸葛瑾被骂走以后，东吴就再没派人来过。直到今天。", "Since Zhuge Jin was cursed out of the hall, Wu hasn't sent anyone. Until today."), ALL(F("flag.hn_canon"), NF("flag.hn_apology"))),
     P(T("他跟你说过：后方的事，多留心。", "He did promise you to keep a closer eye on the rear."), F("flag.bone_rest"))],
    [choice("keep", "dilemma", T("拦住传令的人，跟关羽说：兵可以调，烽火台的人一个也不能少，江陵、公安至少留一半。", "Stop the messenger and tell Guan Yu: move the troops if you must, but not one man off the beacon towers, and leave at least half in Jiangling and Gong'an."),
            T("关羽盯着你，盯了很久：『你就这么不放心东吴？』他把令改了。你知道，这改不了什么大局——可要是真有那一天，后方还有几千人能撤出来。", "Guan Yu stares at you for a long time. 'You trust Wu that little?' He changes the order. You know it won't change how things go—but if that day comes, there will still be a few thousand men in the rear who can get out."),
            [setv("flag.v4_kept_rear"), KEY(rel("guanyu", "trust", 1)), rel("guanyu", "warmth", -1), add("deviation")], echo=["e_rear"],
            req=ANY(AT("guanyu", "trust", 3), AT("guanyu", "esteem", 3), F("flag.bone_rest")),
            hint=T("需要关羽肯听你的：信任在「倚重」、看重在「推崇」以上，或刮骨后劝过他留心后方", "Needs Guan Yu to listen to you: trust at Relied on, esteem at Admired or above, or you urged him to mind the rear after the bone-scraping")),
     choice("warn", "strategy", T("说：一个书生写这样的信，是要将军把后背露出来。", "Say: when a scholar writes a letter like this, he wants the general to turn his back."),
            T("关羽笑了：『你和军师一样，见什么都怕。』兵还是调走了。", "Guan Yu laughs. 'You're like the strategist—afraid of everything.' The troops go north all the same."),
            [setv("flag.lx_warned"), add("uncanny"), rel("guanyu", "esteem", 1)], foresight=True, echo=["e_lx"]),
     choice("canon", "expression", T("说：陆逊确实是个书生。", "Say: Lu Xun is just a scholar, true enough."),
            T("关羽收了礼物，打发使者回去。那天晚上，江陵、公安的兵开始往北走。", "Guan Yu accepts the gifts and sends the envoy home. That night the troops of Jiangling and Gong'an begin marching north."),
            [rel("guanyu", "warmth", 1)])],
    quote=T("关公览毕，仰面大笑，令左右收了礼物，发付使者回去。",
            "When the Lord had read it, he threw back his head and laughed, had his attendants take the gifts, and sent the envoy back."),
    callbacks=[cb("e_rest", T("关羽把信放下：『你上回让我留心后方。』他想了想，没有马上下令。", "Guan Yu puts the letter down. 'Last time you told me to mind the rear.' He thinks, and doesn't give the order at once."), F("flag.bone_rest"))],
    when=ALL(AT_JING, NF("flag.v4_hermit")), order=10))

N.append(node("c4_mifang", "c4", "main", T("给糜芳的信", "A Letter to Mi Fang"), "functional", T("第75回", "Ch. 75"),
    [P(T("樊城前线缺粮。关羽让人去江陵、公安催粮，话说得很重：『粮不到，回来再与你们算账。』糜芳守江陵，傅士仁守公安。传令的人要走了，你还来得及捎一封信。", "The front at Fancheng is short of grain. Guan Yu sends to Jiangling and Gong'an to hurry it, in harsh words: 'If the grain doesn't come, I'll settle with you when I get back.' Mi Fang holds Jiangling, Fu Shiren holds Gong'an. The messenger is about to leave; you still have time to send a letter with him.")),
     P(T("你想起糜芳红着眼说：『这些年，只有你把我当自己人。』", "You remember Mi Fang, red-eyed, saying, 'All these years, you're the only one who's treated me as one of us.'"), ALL(F("flag.mi_saved"), F("flag.mf_mended"))),
     P(T("糜芳挨的那四十棍，还没好利索。", "The forty strokes Mi Fang took haven't fully healed."), F("flag.fire_spared"))],
    [choice("kind", "dilemma", T("写信安抚他：粮能送多少送多少，等将军回来，你替他说话。", "Write to calm him: send what grain he can, and when the general comes back, you'll speak for him."),
            T("回信没有来。可后来你才知道，那封信糜芳看了很多遍。", "No reply comes. Only later do you learn that Mi Fang read the letter many times."),
            [setv("flag.mf_kind"), setv("flag.v4_mf_path"), rel("guanyu", "esteem", -1)], echo=["e_mf_kind"],
            when=ANY(F("flag.mf_mended"), F("flag.fire_spared"))),
     choice("kind2", "dilemma", T("写信安抚他：粮能送多少送多少，等将军回来，你替他说话。", "Write to calm him: send what grain he can, and when the general comes back, you'll speak for him."),
            T("回信没有来。你和糜芳，到底没有那么熟。", "No reply comes. You and Mi Fang were never really that close."),
            [setv("flag.mf_kind"), rel("guanyu", "esteem", -1)],
            when=ALL(NF("flag.mf_mended"), NF("flag.fire_spared"))),
     choice("press", "expression", T("照将军的意思，再催一遍。", "Write as the general wants: hurry him again."),
            T("信送走了。你听说糜芳看完，把信撕了。", "The letter goes. You hear that Mi Fang read it and tore it up."),
            [setv("flag.mf_pressed"), rel("guanyu", "trust", 1)], echo=["e_mf_press"]),
     choice("swap", "strategy", T("劝关羽：换一个人去守江陵。", "Urge Guan Yu: send someone else to hold Jiangling."),
            T("关羽把手里的笔放下：『临阵换将，前线的兵怎么想？』他没换。可他记住了你的话。", "Guan Yu puts down his brush. 'Change commanders mid-campaign? What will the men at the front think?' He doesn't. But he remembers what you said."),
            [rel("guanyu", "esteem", 1), add("uncanny")], foresight=True)],
    callbacks=[cb("e_pow", T("江陵城里，放回家的降兵空出来的营房，住进了从北边逃来的百姓。", "In Jiangling, the barracks left empty by the prisoners you sent home are full of refugees from the north."), F("flag.pow_home"))],
    when=ALL(AT_JING, NF("flag.v4_hermit")), order=20))
N[-1]["intro"].append(P(T("糜芳从关羽帐里出来那天，看见了站在门口的你。", "The day Mi Fang came out of Guan Yu's tent, he saw you standing at the door."), F("flag.mf_told")))

N.append(node("c4_cd", "c4", "main", T("迟到的消息", "Late News"), "functional", T("第75回", "Ch. 75"),
    [P(T("东吴换了守将，接替吕蒙的是个书生，叫陆逊。消息晚到了半个月。诸葛亮说：『半个月，够做很多事了。』汉中王问你该怎么办。", "Wu has changed commanders; Lü Meng's replacement is a scholar named Lu Xun. The news is half a month late. Zhuge Liang says, 'Half a month is long enough for a great deal to happen.' The King asks you what to do.")),
     P(T("给刘封的令，已经送到上庸了。", "The order to Liu Feng has already reached Shangyong."), F("flag.v4_order"))],
    [choice("early", "dilemma", T("自请先去上庸：刘封、孟达那里，得有人盯着。", "Ask to go to Shangyong ahead of time: someone needs to keep an eye on Liu Feng and Meng Da."),
            T("你骑马出了成都，一路往东北去。蜀道难，你走了二十多天。", "You ride out of Chengdu, northeast. The roads out of Shu are hard; it takes you more than twenty days."),
            [setv("flag.v4_early_sy"), rel("liubei", "trust", 1), add("renown.loyal")]),
     choice("letter", "strategy", T("连夜写信给关羽：陆逊不是书生。", "Write to Guan Yu that same night: Lu Xun is no mere scholar."),
            T("信走了。你知道它会到得太晚。", "The letter goes. You know it will arrive too late."),
            [rel("guanyu", "trust", 1), add("uncanny")], foresight=True),
     choice("wait", "expression", T("说：关将军不会上这种当。", "Say: General Guan won't fall for that."),
            T("汉中王点头。诸葛亮看着窗外，一句话也没说。", "The King nods. Zhuge Liang looks out of the window and says nothing at all."), [rel("liubei", "warmth", 1)])],
    when=ALL(CD, NF("flag.v4_hermit")), order=10))

N.append(talk_node("c4_zhuge", "c4", T("夜谈·诸葛亮", "Night Talk: Zhuge Liang"),
    T("诸葛亮一个人在书房里，墙上挂着一张旧地图，是隆中那年画的。他听见你进来：『子衡兄，坐。亮今晚不想一个人。』", "Zhuge Liang sits alone in his study. On the wall hangs an old map, drawn the year at Longzhong. He hears you come in. 'Sit, Ziheng. I'd rather not be alone tonight.'"),
    "zhuge", 2,
    [topic("plan", T("问他：隆中那年说的“跨有荆、益”，还算数吗？", "Ask him: what you said at Longzhong—hold both Jing and Yi—does it still stand?"),
           T("诸葛亮看着地图，很久才说：『荆州一失，那张图就只剩一半。』他把扇子放在图上，正好盖住荆州。", "Zhuge Liang looks at the map a long time before he speaks. 'If Jingzhou is lost, that map is only half a map.' He lays his fan on it, right over Jingzhou."),
           [rel("zhuge", "trust", 1)]),
     topic("guan", T("问他：为什么不亲自去荆州？", "Ask him: why not go to Jingzhou yourself?"),
           T("诸葛亮苦笑：『主公在汉中，成都要人守。云长……也未必愿意亮去。』", "Zhuge Liang smiles bitterly. 'Our lord is at Hanzhong, and Chengdu needs holding. And Yunchang… might not want me there.'"),
           [rel("zhuge", "warmth", 1)]),
     topic("sleep", T("劝他去睡。", "Tell him to go to bed."),
           T("诸葛亮笑了：『子衡兄也睡不着，才来的吧。』你们就这样坐到了天亮。", "Zhuge Liang smiles. 'You came because you couldn't sleep either, didn't you?' And so you sit together until dawn."),
           [rel("zhuge", "warmth", 2)])],
    T("天亮时，诸葛亮说：『荆州要是有事，上庸是最近的一步棋。』", "At dawn Zhuge Liang says, 'If anything happens in Jingzhou, Shangyong is the nearest move on the board.'"), when=ALL(CD, NF("flag.v4_hermit")), order=20))

# ---------- c5 败走 ----------
N.append(node("c5_retreat", "c5", "main", T("败走", "Retreat"), "functional", T("第76回", "Ch. 76"),
    [P(T("徐晃攻破了围樊城的营寨，关羽带伤上马，箭疮又迸裂了。退兵的路上，消息一个接一个：烽火台被白衣人取了；傅士仁献了公安；糜芳开了江陵的城门。关羽在马上回头看你：『悔不听足下之言，今日果有此事！』", "Xu Huang breaks the siege lines at Fancheng. Guan Yu mounts with his wound still open, and it splits again. On the road back the news comes in blow after blow: the beacon towers were taken by men in white; Fu Shiren has given up Gong'an; Mi Fang has opened the gates of Jiangling. Guan Yu turns in the saddle to look at you."),
       ANY(F("flag.lx_warned"), F("flag.v4_kept_rear"))),
     P(T("徐晃攻破了围樊城的营寨，关羽带伤上马，箭疮又迸裂了。退兵的路上，消息一个接一个：烽火台被白衣人取了；傅士仁献了公安；糜芳开了江陵的城门。", "Xu Huang breaks the siege lines at Fancheng. Guan Yu mounts with his wound still open, and it splits again. On the road back the news comes in blow after blow: the beacon towers were taken by men in white; Fu Shiren has given up Gong'an; Mi Fang has opened the gates of Jiangling."),
       ALL(NF("flag.lx_warned"), NF("flag.v4_kept_rear"))),
     P(T("吕蒙进了江陵，不许兵士骚扰随军将士的家小，按月送粮，有病的派医生去看。消息传到军中，兵士们都没了战心，夜里一拨一拨地往南逃。", "Lü Meng has entered Jiangling and forbidden his men to touch the families of the soldiers in Guan Yu's army; he sends them grain every month, and doctors to the sick. When the news reaches the camp, the men lose all will to fight, and slip away south by night in batches.")),
     P(T("你劝关羽留下的那几千兵，从江陵撤出来了，正在路上等你们。", "The few thousand men you persuaded Guan Yu to leave behind got out of Jiangling and are waiting for you on the road."), F("flag.v4_kept_rear"))],
    [choice("call", "strategy", T("劝关羽：现在就派人去上庸、去成都求救，一刻也别等。", "Urge Guan Yu: send for help to Shangyong and Chengdu right now. Don't wait a moment."),
            T("关羽派了廖化去上庸。你写了一封给成都的信，交给一个最快的骑兵。廖化比原来早走了三天——孟达的推辞，还没想好。", "Guan Yu sends Liao Hua to Shangyong. You write a letter to Chengdu and give it to the fastest rider you have. Liao Hua leaves three days earlier than he would have—before Meng Da has his excuses ready."),
            [setv("flag.v4_early_call"), rel("guanyu", "trust", 1)], echo=["e_call"]),
     choice("men", "dilemma", T("劝关羽：想走的，让他们走。家在江陵，谁不想回去？", "Urge Guan Yu: let the ones who want to go, go. Their families are in Jiangling—who wouldn't want to go back?"),
            T("关羽沉默了很久，下了令。那一夜走了一大半。剩下的人，再也没有一个逃的。", "Guan Yu is silent a long time, then gives the order. More than half leave that night. Of those who remain, not one more deserts."),
            [rel("guanyu", "warmth", 1), rel("guanyu", "esteem", 1), add("renown.loyal")]),
     choice("west", "dilemma", T("劝他别回江陵，往西走，退回西川再说。", "Urge him not to turn back for Jiangling: go west, back to Shu, and think again there."),
            T("关羽勒住马：『荆州是大哥交给我的。我丢了它，有什么脸往西走？』他掉转马头，往南去了。", "Guan Yu reins in. 'Jingzhou was my brother's charge to me. I lost it. With what face do I go west?' He turns his horse south."),
            [rel("guanyu", "esteem", -1), rel("guanyu", "trust", 1)])],
    quote=T("公顾谓司马王甫曰：“悔不听足下之言，今日果有此事！”",
            "The Lord turned to his marshal Wang Fu and said, \"I regret not heeding your words. Now it has come to this!\""),
    callbacks=[cb("e_mf_press", T("后来有人告诉你：糜芳开城之前，把你那封催粮的信又看了一遍。", "Later someone tells you that before he opened the gates, Mi Fang read your letter demanding grain one more time."), F("flag.mf_pressed")),
               cb("e_people", T("路边有百姓给你们送水。有人认出了你：『放水那天，是先生让我们上的山。』", "People at the roadside bring you water. One of them recognizes you. 'The day of the flood, it was you who sent us up the hills, sir.'"), F("flag.flood_people")),
               cb("e_lx", T("关羽在马上对你说：『陆逊那封信，你说对了。』", "From the saddle Guan Yu says to you, 'Lu Xun's letter—you were right.'"), F("flag.lx_warned"))],
    when=ALL(AT_JING, NF("flag.v4_hermit")), order=10))

N.append(node("c5_shangyong", "c5", "main", T("上庸", "Shangyong"), "literal", T("第76回", "Ch. 76"),
    [P(T("廖化杀出重围，到了上庸，跪着求刘封发兵救麦城。刘封犹豫，孟达在一旁说：『将军以关公为叔，恐关公未必以将军为侄也。』又说山城初附，人心未定，不敢轻动。", "Liao Hua cuts his way out and reaches Shangyong, and on his knees begs Liu Feng to send troops to Maicheng. Liu Feng hesitates. Beside him Meng Da says Liu Feng may count Guan Yu as his uncle, but Guan Yu may not count him as a nephew; besides, this mountain town has only just come over and can't be stirred lightly.")),
     P(T("你早几天就到了上庸，孟达的话，你已经听过一遍了。", "You reached Shangyong days ago; you've heard Meng Da say this once already."), F("flag.v4_early_sy")),
     P(T("汉中王的令就摆在刘封的案上：荆州有急，即刻发兵。", "The King's order lies on Liu Feng's desk: if Jingzhou is in trouble, march at once."), F("flag.v4_order")),
     P(T("诸葛亮当年派往上庸的那支兵，就驻在城外。", "The column Zhuge Liang sent toward Shangyong back then is camped outside the walls."), F("flag.warned_jing"))],
    [choice("order", "dilemma", T("当着孟达的面，对刘封说：你父王的令在这里。你不去，我替你去。", "In front of Meng Da, tell Liu Feng: your royal father's order is right here. If you won't go, I'll go in your place."),
            T("刘封的脸白了。孟达还要说话，刘封一拍桌子：『点兵！』他给了你两千人。你带着他们连夜往麦城去，廖化在马上哭了。", "Liu Feng goes white. Meng Da starts to speak, and Liu Feng slams the desk. 'Muster the men!' He gives you two thousand. You lead them toward Maicheng that same night; in the saddle, Liao Hua weeps."),
            [setv("flag.v4_relief"), setv("flag.v4_ride"), KEY(rel("liubei", "trust", 1)), add("renown.loyal"), add("deviation", 2)], echo=["e_sy"],
            req=ANY(AT("liubei", "trust", 3), F("flag.v4_order"), F("flag.v4_early_sy")),
            hint=T("需要你说话有分量：刘备的信任在「倚重」以上，或带着汉中王的令，或早几天就到了上庸", "Needs your word to carry weight: Liu Bei's trust at Relied on or above, or the King's written order, or arriving at Shangyong days early")),
     choice("ride", "dilemma", T("不跟他们争了。跟廖化要一匹马，自己去麦城。", "Stop arguing with them. Get a horse from Liao Hua and go to Maicheng yourself."),
            T("刘封没有拦你。孟达送你出城，说：『先生是聪明人，何必呢。』你没回头。", "Liu Feng doesn't stop you. Meng Da sees you out of the gate. 'You're a clever man, sir. Why do this?' You don't look back."),
            [setv("flag.v4_ride"), add("renown.loyal"), rel("guanyu", "warmth", 1)]),
     choice("back", "strategy", T("和廖化一起回成都求救。", "Go back to Chengdu with Liao Hua to ask for help."),
            T("你们日夜不停地赶路。到成都的时候，你知道已经晚了。", "You ride day and night. By the time you reach Chengdu, you know it is too late."),
            [rel("liubei", "trust", 1)])],
    quote=T("将军以关公为叔，恐关公未必以将军为侄也。",
            "General, you count the Lord Guan as your uncle; I fear the Lord Guan may not count you as his nephew."),
    when=ALL(CD, NF("flag.v4_hermit")), order=10))

N.append(node("c5_wz_jiangling", "c5", "side", T("江陵来信", "A Letter from Jiangling"), "free", T("原创人物", "original character"),
    T("一个从江陵逃出来的兵，给你带来温芷的一封信：『吴兵进城了，没有为难医馆，还派人守着门。我很好。你别回来。』", "A soldier who slipped out of Jiangling brings you a letter from Wen Zhi. 'Wu's soldiers have come into the city. They haven't troubled the clinic; they've even put a guard on the door. I'm well. Don't come back.'"),
    [choice("reply", "dilemma", T("托那个兵带一封回信：等我。", "Give the soldier a reply to carry back: wait for me."),
            T("那个兵把信揣在怀里，又往南去了。你不知道信送没送到。", "The soldier tucks the letter inside his coat and heads south again. You don't know whether it ever arrived."),
            [rel("wenzhi", "intimacy", 1), rel("wenzhi", "trust", 1)]),
     choice("west", "strategy", T("回信让她想办法去成都，别等你。", "Write back telling her to find a way to Chengdu and not wait for you."),
            T("你在信里写了一条路，从哪里过江，找谁。写完了，你又加了一句：『活着。』", "You write out a route—where to cross, whom to find. When it's done you add one more word: 'Live.'"),
            [rel("wenzhi", "trust", 1), rel("wenzhi", "esteem", 1)])],
    when=ALL(AT_JING, WZ_J, NF("flag.wz_huatuo"), NF("flag.v4_hermit")), salience=4, order=1))

# ---------- c6 麦城 ----------
N.append(node("c6_maicheng", "c6", "main", T("走麦城", "Out of Maicheng"), "functional", T("第76–77回", "Ch. 76–77"),
    [P(T("诸葛瑾进了麦城，劝关羽投降。关羽说：玉可碎而不可改其白，竹可焚而不可毁其节。诸葛瑾满脸羞惭地走了。", "Zhuge Jin comes into Maicheng to urge Guan Yu to surrender. Guan Yu tells him that jade may be shattered but not robbed of its whiteness, bamboo burned but not robbed of its joints. Zhuge Jin leaves, his face burning.")),
     P(T("诸葛瑾看见你，苦笑了一下：『又是你。』", "Zhuge Jin sees you and smiles ruefully. 'You again.'"), ANY(F("flag.jin_trick"), F("flag.xiang_letter"))),
     P(T("你想起那夜在他房里坐到三更，他说：『明天我就受印。』那时候，他还肯听人把话说完。", "You remember sitting in his room until the third watch, and him saying, 'I'll take the seal tomorrow.' He still let people finish what they were saying, then."), F("flag.fs_private")),
     P(T("那天夜里，关羽要突围往西川去。北门外有一条大路，一条小路。王甫说小路有埋伏，可走大路。关羽说：『虽有埋伏，吾何惧哉！』他转头看你。", "That night Guan Yu means to break out and make for the west. Outside the north gate there's a main road and a small one. Wang Fu says there will be an ambush on the small road; take the main road. Guan Yu says he fears no ambush. He turns to look at you.")),
     P(T("你带来的两千上庸兵，就在城外五里。", "The two thousand men you brought from Shangyong are five li outside the walls."), F("flag.v4_relief")),
     P(T("你一个人骑马赶到了麦城。关羽看见你，愣了一下，笑了：『你来做什么？』", "You've ridden to Maicheng alone. Guan Yu sees you, starts, then smiles. 'What are you doing here?'"), ALL(RIDE, NF("flag.v4_relief"))),
     P(T("糜芳开城那天夜里，托人从小路给你送来一句话：『临沮的小路，别走。』", "On the night he opened the gates, Mi Fang sent a man to you by back roads with a single line: 'Don't take the Linju road.'"), F("flag.v4_mf_path")),
     P(T("从江陵撤出来的那几千兵，守着往西的大路。", "The few thousand men who got out of Jiangling are holding the main road west."), F("flag.v4_kept_rear")),
     P(T("廖化早走了三天。他从上庸回来没有，还没人知道。", "Liao Hua left three days early. Whether he's come back from Shangyong, no one knows yet."), F("flag.v4_early_call")),
     P(T("诸葛亮当年派往上庸的那支兵，听说已经过了房陵。", "The column Zhuge Liang sent toward Shangyong long ago is said to be past Fangling already."), F("flag.warned_jing"))],
    [choice("save", "dilemma", T("拉住他的马：『走大路。等援兵。子衡求将军这一回。』", "Seize his bridle. 'Take the main road. Wait for help. Ziheng begs you, General—this once.'"),
            [P(T("关羽看着你，看了很久。他慢慢松开了缰绳：『好。这一回，听你的。』", "Guan Yu looks at you for a long, long time. Slowly he lets go of the reins. 'All right. This once, I'll listen to you.'")),
             P(T("你们走了大路。天快亮的时候，前面的山口亮起了火把——是自己人。", "You take the main road. Near dawn, torches flare at the pass ahead—your own men."), ANY(L1, L4)),
             P(T("上庸的两千人从侧面杀出来，冲散了追兵。", "The two thousand from Shangyong come in from the flank and scatter the pursuit."), L3),
             P(T("刘封派出来的一千人，在西边的山口接住了你们。廖化骑在最前面。", "A thousand men sent out by Liu Feng meet you at the western pass, Liao Hua riding at their head."), ALL(L5, NF("flag.v4_relief"))),
             P(T("后来你听说，那一夜，吕蒙的伏兵在临沮的小路上等了一整夜。", "Later you hear that on that night, Lü Meng's ambush waited on the Linju road until morning."), L2),
             P(T("荆州丢了。关羽、关平、周仓，一个都没丢。往西的路上，关羽一直没说话。过了秭归，他忽然说：『子衡，我欠你一条命。』", "Jingzhou is lost. Guan Yu, Guan Ping, Zhou Cang—not one of them is. On the road west Guan Yu says nothing at all. Past Zigui he suddenly says, 'Ziheng, I owe you a life.'"))],
            [setv("flag.guan_alive"), KEY(rel("guanyu", "trust", 2)), rel("guanyu", "warmth", 2), add("deviation", 4), add("renown.loyal", 2)],
            req=ALL(LISTEN, TWO), hint=SAVE_HINT),
     choice("follow", "dilemma", T("他要走小路，你就跟着他走小路。", "If he takes the small road, you go down it with him."),
            T("小路上果然有伏兵。绊马索一起，关羽从马上摔下来。被押走之前，他回头找到你，只说了一句：『子衡，替我跟大哥说，云长没有降。』后来，孙权没有杀你。他说：留着，让刘备知道。", "There is an ambush on the small road, as Wang Fu said. The tripwires spring and Guan Yu is thrown from his horse. Before they lead him away he looks back, finds you, and says only, 'Ziheng, tell my brother: Yunchang did not surrender.' Afterward Sun Quan does not kill you. Keep him, he says. Let Liu Bei know."),
            [setv("flag.v4_with_guan"), rel("guanyu", "warmth", 2), add("renown.loyal", 2)]),
     choice("letter", "strategy", T("请他写一封信，你从南门突围，去成都。", "Ask him to write a letter; you'll break out by the south gate and make for Chengdu."),
            T("关羽在灯下写了很久，写完封好，交到你手里：『这封信，替我交给大哥。』你从南门杀出去的时候，北门那边的火把已经远了。", "Guan Yu writes a long time by the lamp, seals it, and puts it in your hands. 'Give this to my brother for me.' As you fight your way out of the south gate, the torches by the north gate are already far away."),
            [setv("flag.v4_letter"), rel("guanyu", "trust", 1), rel("liubei", "trust", 1)])],
    quote=T("玉可碎而不可改其白，竹可焚而不可毁其节。……公曰：“虽有埋伏，吾何惧哉！”",
            "\"Jade may be shattered, but its whiteness cannot be changed; bamboo may be burned, but its joints cannot be broken.\" … The Lord said, \"Ambush or no ambush, what have I to fear?\""),
    callbacks=[cb("e_bone", T("关羽笑了笑：『刮骨那天，你让了我半目。今天别让了。』", "Guan Yu smiles a little. 'The day of the scraping, you let me have half a point. Don't let me have anything today.'"), None),
               cb("e_rear", T("关羽说：『那几千人，是你替我留的。』", "Guan Yu says, 'Those few thousand men—you kept them for me.'"), F("flag.v4_kept_rear")),
               cb("e_call", T("关羽说：『早三天派廖化，是你的主意。』", "Guan Yu says, 'Sending Liao Hua three days early was your idea.'"), F("flag.v4_early_call")),
               cb("e_sy", T("廖化在你身边，手里还攥着刘封的兵符。", "Liao Hua is beside you, Liu Feng's tally still clenched in his fist."), F("flag.v4_relief")),
               cb("e_mf_kind", T("你想起写给糜芳的那封信。他到底还是开了城门。可他也没忘了你。", "You think of your letter to Mi Fang. He opened the gates in the end. But he didn't forget you."), F("flag.v4_mf_path"))],
    when=ALL(AT_GUAN, NF("flag.v4_hermit")), order=10))

N.append(node("c6_west", "c6", "main", T("入川", "Into the West"), "free", T("原创", "original"),
    T("成都在望的那天，关羽在马上停了很久：『荆州丢了。我拿什么脸去见大哥？』", "The day Chengdu comes into sight, Guan Yu sits his horse a long while. 'I lost Jingzhou. With what face do I see my brother?'"),
    [choice("brother", "dilemma", T("说：主公要的是二弟，不是荆州。", "Say: our lord wants his brother, not Jingzhou."),
            T("关羽没说话，下了马，牵着走完了最后一段路。城门口，刘备没有穿鞋就跑了出来。", "Guan Yu says nothing. He dismounts and leads his horse the last stretch. At the gate Liu Bei comes running out without his shoes."),
            [rel("guanyu", "warmth", 1), rel("liubei", "warmth", 1)]),
     choice("truth", "strategy", T("说：丢了，就再拿回来。可这一回，要先和东吴算清楚。", "Say: what's lost can be taken back. But this time, settle accounts with Wu first."),
            T("关羽看着东边，很久才点头：『这笔账，我记着。』你知道，这句话以后会有很多人记着。", "Guan Yu looks east for a long time before he nods. 'I'll remember this account.' You know a great many people will remember those words."),
            [rel("guanyu", "esteem", 1), rel("guanyu", "trust", 1)]),
     choice("quiet", "expression", T("什么也不说，陪他站着。", "Say nothing. Stand beside him."),
            T("风从东边吹过来。关羽说：『走吧。』", "The wind comes from the east. Guan Yu says, 'Let's go.'"), [rel("guanyu", "warmth", 1)])],
    when=ALL(F("flag.guan_alive"), NF("flag.v4_hermit")), order=20))

N.append(node("c6_news", "c6", "main", T("噩耗", "The News"), "functional", T("第77回", "Ch. 77"),
    [P(T("消息是在一个早上到的：关羽父子在临沮被擒，不肯投降，遇害了。汉中王听完，大叫一声，昏了过去。醒来以后，他第一句话是：『孤与东吴，誓不两立！』", "The news arrives one morning: Guan Yu and his son were taken at Linju, would not surrender, and were killed. The King of Hanzhong cries out and falls senseless. When he comes to, his first words are that he and Wu cannot live under the same sky.")),
     P(T("你手里还拿着关羽托你带来的那封信。", "You still have the letter Guan Yu gave you to carry."), F("flag.v4_letter")),
     P(T("你没能带兵回来。廖化跪在殿上，哭着说了上庸的事。", "You couldn't bring troops back. Liao Hua kneels in the hall and, weeping, tells what happened at Shangyong."), NF("flag.v4_letter"))],
    [choice("wait", "dilemma", T("劝汉中王：仇要报，可不是现在。先稳住，曹丕、孙权都在等我们乱。", "Urge the King: there must be revenge, but not now. Steady first—Cao and Sun are both waiting for us to fall apart."),
            T("汉中王瞪着你，眼睛通红：『二弟的仇，等？』诸葛亮在一旁说：『子衡兄说得对。』汉中王没有再说话，可你知道，他没有听进去。", "The King glares at you, eyes red. 'Wait—for my brother's revenge?' Zhuge Liang says beside you, 'Ziheng is right.' The King says nothing more, but you know he hasn't heard."),
            [setv("flag.v4_counsel_wait"), rel("liubei", "warmth", -1), rel("zhuge", "esteem", 1), rel("zhuge", "trust", 1)]),
     choice("vow", "dilemma", T("跪下请命：愿随主公伐吴。", "Kneel and ask for a command: you will follow your lord against Wu."),
            T("汉中王扶起你，握着你的手哭了：『好，好。』诸葛亮转过身去。", "The King raises you up, holds your hands, and weeps. 'Good. Good.' Zhuge Liang turns away."),
            [setv("flag.v4_vow"), rel("liubei", "warmth", 2), rel("liubei", "trust", 1), rel("zhuge", "esteem", -1)]),
     choice("stay", "expression", T("什么也不说，守在他床边。", "Say nothing. Stay by his bed."),
            T("汉中王三天没吃东西。你守了三天。第四天，他说：『子衡，你也去睡吧。』", "The King eats nothing for three days. You keep watch for three days. On the fourth, he says, 'Ziheng, you go and sleep too.'"),
            [rel("liubei", "warmth", 1)])],
    callbacks=[],
    when=ALL(ANY(HOME, F("flag.v4_letter")), NF("flag.guan_alive"), NF("flag.v4_hermit")), order=30))

N.append(node("c6_wz", "c6", "side", T("最后一封信", "The Last Letter"), "free", T("原创人物", "original character"),
    [P(T("出城之前，你借着灯写了一封信给温芷。写完不知道该交给谁。", "Before the breakout you write a letter to Wen Zhi by lamplight. When it's finished you don't know whom to give it to."), AT_GUAN),
     P(T("你把麦城的消息写进给温芷的信里，写了又划掉。", "You write the news from Maicheng into a letter to Wen Zhi, then strike it out."), HOME)],
    [choice("keep", "dilemma", T("把信揣在怀里：亲手交给她。", "Tuck it inside your coat: you'll hand it to her yourself."),
            T("那封信在你怀里揣了很久。", "That letter stays inside your coat a long time."),
            [setv("flag.v4_wz_letter"), rel("wenzhi", "intimacy", 2)]),
     choice("send", "strategy", T("托一个往南走的商人送去。", "Give it to a merchant heading south."),
            T("信送到了。她的回信只有一行：『我等你。』", "The letter arrives. Her reply is a single line: 'I'm waiting for you.'"),
            [rel("wenzhi", "intimacy", 1), rel("wenzhi", "trust", 1)])],
    when=ALL(WZ, NF("flag.v4_hermit")), salience=4, order=1))
N[-1]["intro"].append(P(T("赤壁江边你说过的那句话，她一直记着。", "She has never forgotten what you said by the river after Red Cliffs."), F("flag.confessed")))

# ---------- crises (any chapter) ----------
def crisis(id, title, intro, choices, when, order):
    return node(id, "*", "interrupt", title, "free", T("原创危机", "original crisis"), intro, choices, when=when, order=order)
N.append(crisis("x_cold4", T("冷落", "Sidelined"),
    T("汉中王已经很久没有问过你了。诸葛亮私下对你说：『子衡兄，主公心里有个结。』", "It's been a long time since the King asked your opinion. Zhuge Liang tells you privately, 'Ziheng, our lord has a knot in his heart.'"),
    [choice("mend", "strategy", T("去找汉中王，把话说开。", "Go to the King and talk it through."),
            T("你们谈了一夜。天亮时，汉中王说：『是孤多心了。』", "You talk all night. At dawn the King says, 'I've been too suspicious.'"), [rel("liubei", "trust", 2), add("renown.loyal")],
            req=ANY(AT("zhuge", "esteem", 2), AT("zhaoyun", "trust", 2), AT("fazheng", "esteem", 2)), hint=T("需要诸葛亮的看重在「器重」以上、赵云的信任在「可托」以上，或法正的看重在「器重」以上，才有人替你说一句话", "Needs Zhuge Liang's esteem at Valued or above, Zhao Yun's trust at Reliable or above, or Fa Zheng's esteem at Valued or above, for someone to put in a word for you")),
     choice("wait", "expression", T("等。做好手上的事。", "Wait. Do the work in front of you."), T("议事时，你的位子挪到了后排。", "At council your seat has moved to the back row."), [rel("liubei", "trust", 1), setv("flag.sidelined")]),
     choice("go", "dilemma", T("告辞。", "Take your leave."), T("汉中王没有留你。", "The King doesn't ask you to stay."), [setv("flag.v4_left")])],
    ALL(CD, UPTO("liubei", "trust", 0), NF("flag.v4_hermit")), 3))
N[-1]["choices"][2]["ends"] = True
N.append(crisis("x_guan_cold4", T("关羽不理你", "Guan Yu Won't See You"),
    T("关羽已经好些天没叫你进帐了。关平悄悄对你说：『父亲说，你的话太多。』", "Guan Yu hasn't called you into his tent for days. Guan Ping tells you quietly, 'Father says you talk too much.'"),
    [choice("apologize", "strategy", T("去他帐前，当面认个错。", "Go to his tent and apologize to his face."),
            T("关羽让你在帐外站了一个时辰，才叫你进去。他没提那些话，只给你倒了一杯酒。", "Guan Yu leaves you standing outside for an hour before calling you in. He doesn't mention what was said; he just pours you a cup."),
            [rel("guanyu", "warmth", 2), add("imp.guanyu.offended", -1)]),
     choice("wait", "expression", T("等他消气。", "Wait for him to cool off."), T("过了些天，关羽在营门口遇见你，点了点头。仅此而已。", "Some days later Guan Yu passes you at the camp gate and nods. That's all."), [rel("guanyu", "warmth", 1), setv("flag.sidelined")]),
     choice("go", "dilemma", T("请调回成都。", "Ask to be sent back to Chengdu."), T("关羽批了。你走的那天，他没有出来送。", "Guan Yu approves it. The day you leave, he doesn't come out to see you off."), [setv("flag.v4_left")])],
    ALL(AT_JING, ANY(I("guanyu", "offended", ">=", 3), ALL(UPTO("guanyu", "warmth", 0), UPTO("guanyu", "esteem", 1))), NF("flag.v4_hermit")), 3))
N[-1]["choices"][2]["ends"] = True
N.append(crisis("x_uncanny4", T("妖人", "Sorcerer"),
    T("你说中的事情太多了。连东吴都有人在传：刘备手下有个能知未来的人。诸葛亮来找你：『子衡兄，亮不问你从哪里知道的。可孙权会问。』", "You've been right about too many things. Even in Wu people are saying Liu Bei has a man who knows the future. Zhuge Liang comes to you. 'I won't ask how you know, Ziheng. But Sun Quan will.'"),
    [choice("hide", "strategy", T("从此闭口：只说眼前的事。", "Hold your tongue from now on: speak only of what's in front of you."), T("你很久没有再说过一句准话。人们慢慢忘了。", "For a long time you say nothing that comes true. People slowly forget."), [add("uncanny", -2), rel("zhuge", "trust", 1)]),
     choice("trust", "dilemma", T("把实话告诉诸葛亮一个人。", "Tell Zhuge Liang alone the truth."), T("诸葛亮听完，很久没说话。最后他说：『那么荆州……你早就知道。』", "Zhuge Liang hears you out and is silent a long time. At last he says, 'Then Jingzhou… you knew all along.'"),
            [rel("zhuge", "esteem", 2), rel("zhuge", "trust", -2), add("uncanny", -1)], req=AT("zhuge", "esteem", 2), hint=T("需要诸葛亮的看重在「器重」以上", "Needs Zhuge Liang's esteem at Valued or above")),
     choice("leave", "dilemma", T("离开，免得连累主公。", "Leave, so your lord isn't tainted by you."), T("你在一个雨夜出了城。", "You leave the city one rainy night."), [setv("flag.v4_exposed")])],
    ALL(V("uncanny", ">=", 6), NF("flag.v4_hermit")), 2))
N[-1]["choices"][2]["ends"] = True
N.append(crisis("x_loose4", T("失言", "A Slip of the Tongue"),
    T("你说过的那些话，有人一句句抄了下来，送到了上面。", "Someone has copied down the things you've said, line by line, and sent them up."),
    [choice("own", "strategy", T("认：话说过了头。", "Own it: you spoke out of turn."), T("没有人罚你。只有一句：『先生是聪明人，聪明人最该管住嘴。』", "No one punishes you. Just one remark: 'You're a clever man. Clever men should mind their tongues most of all.'"), [add("renown.rash", -3), rel("liubei", "trust", -1)]),
     choice("argue", "dilemma", T("辩：句句是真话。", "Argue: every word was true."), T("『有些真话，要挑时候说。』", "'Some truths need the right moment.'"), [add("renown.rash", -1), rel("liubei", "trust", -1), rel("zhuge", "esteem", 1)])],
    ALL(V("renown.rash", ">=", 6), NF("flag.v4_hermit")), 4))

N.append(node("x_guan_rage4", "*", "flash", T("关羽拍案", "Guan Yu Slams the Table"), "free", T("原创", "original"),
    T("关羽一掌拍在案上，酒杯跳了起来：『你再说一遍！』周仓已经按住了刀。", "Guan Yu slams his palm on the table and the cups jump. 'Say that again!' Zhou Cang already has his hand on his blade."),
    [choice("bow", "expression", T("拱手赔罪。", "Bow and apologize."), T("关羽哼了一声，挥手让你下去。", "Guan Yu snorts and waves you away."), [rel("guanyu", "esteem", -1), add("renown.rash")]),
     choice("stand", "dilemma", T("不退：『子衡说的，是为将军好。』", "Don't back down: 'What I said, I said for your good, General.'"),
            T("关羽盯着你看了很久，把手从案上收了回去：『下去吧。』第二天，他派人给你送了一坛酒。", "Guan Yu stares at you a long time, then takes his hand off the table. 'Go.' The next day he sends you a jar of wine."),
            [rel("guanyu", "esteem", 1), rel("guanyu", "warmth", -1), add("renown.rash", 2)])]))

# ------------------------------------------------------------------ open questions
ASKS = {
  "c2_flood": {"who": "guanyu", "fallback": "dodge",
    "q": T("水退以后，于禁跪着求饶，庞德站着不跪，骂不绝口。关羽回头问你：『你说，这个人，杀还是留？』", "When the water goes down, Yu Jin kneels and begs; Pang De stands and won't kneel, cursing without pause. Guan Yu turns to you. 'Well—this one. Kill him or keep him?'"),
    "answers": [
      ans("spare", T("劝他留庞德一命", "urges him to spare Pang De"), T("关羽想了想，又问了庞德一遍。庞德说：『吾宁死于刀下，岂降汝耶！』关羽叹了口气，挥了挥手，命人好好葬他。", "Guan Yu considers and asks Pang De once more. Pang De says he would rather die under the blade than surrender. Guan Yu sighs, waves his hand, and orders him decently buried."), [setv("flag.pd_spare"), rel("guanyu", "esteem", 1)], match=r"留|放|饶|别杀|不杀|义士|忠|spare|keep him|let him live|loyal|don't kill", mood="neutral"),
      ans("kill", T("说杀", "says kill him"), T("关羽点点头：『成全他。』", "Guan Yu nods. 'Give him what he wants.'"), [rel("guanyu", "trust", 1)], match=r"杀|斩|成全|kill|execute|behead", mood="neutral"),
      ans("bury", T("说杀可以，要厚葬", "says kill him, but bury him with honor"), T("关羽看了你一眼：『你倒懂他。』庞德被葬在樊城外的山坡上。", "Guan Yu glances at you. 'You understand him.' Pang De is buried on a hillside outside Fancheng."), [rel("guanyu", "esteem", 1), rel("guanyu", "warmth", 1)], match=r"厚葬|葬|尊重|敬|honou?r|bury|respect", mood="warm"),
      ans("rude", T("嘲笑庞德或于禁", "mocks Pang De or Yu Jin"), T("关羽皱起眉：『阵前之人，不必羞辱。』", "Guan Yu frowns. 'No need to shame a man taken in battle.'"), [rel("guanyu", "esteem", -1), add("renown.rash")], match=r"废物|懦夫|狗|笑话|coward|dog|pathetic", mood="cold"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("关羽没再问你，自己下了令。", "Guan Yu doesn't ask again; he gives the order himself."), [], match=r"不知|不好说|将军定|can't say|don't know|your call", mood="neutral"),
    ]},
  "c3_cd": {"who": "liubei", "fallback": "dodge",
    "q": T("散了议，汉中王一个人留下，问你：『子衡，你说实话——二弟那边，守得住吗？』", "When the council breaks up, the King stays behind and asks you, 'Ziheng, tell me the truth—can my brother hold out there?'"),
    "answers": [
      ans("no", T("说守不住，得早做准备", "says no—prepare now"), T("汉中王的脸白了一下，又笑了：『你和孔明一样，总往坏处想。』他笑得很勉强。", "The King goes pale, then laughs. 'You're like Kongming, always thinking the worst.' The laugh is forced."), [rel("liubei", "esteem", 1), rel("liubei", "warmth", -1), add("uncanny")], match=r"守不住|危险|难|东吴|吕蒙|后方|早做|can't|won't hold|danger|wu|prepare", mood="cold"),
      ans("yes", T("说守得住", "says yes"), T("汉中王松了一口气：『那就好。』", "The King breathes out. 'Good.'"), [rel("liubei", "warmth", 1)], match=r"守得住|能|放心|没事|yes|he can|he will|don't worry", mood="warm"),
      ans("depends", T("说要看关将军肯不肯防东吴", "says it depends on whether he guards against Wu"), T("汉中王沉默了：『二弟的脾气……孤知道。』他提笔写了一封信。", "The King falls silent. 'My brother's temper… I know.' He takes up his brush and writes a letter."), [rel("liubei", "trust", 1), rel("guanyu", "trust", 1)], match=r"看|取决|要是|如果|肯不肯|depends|if he|whether", mood="neutral"),
      ans("rude", T("说关羽骄傲自大", "calls Guan Yu arrogant"), T("汉中王的脸沉了下来：『那是孤的兄弟。』", "The King's face darkens. 'That is my brother.'"), [add("heat.liubei", 2), rel("liubei", "trust", -1), add("renown.rash")], match=r"骄傲|自大|狂|傲|arrogant|proud|vain", mood="cold"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("汉中王拍了拍你的肩，没有再问。", "The King pats your shoulder and doesn't ask again."), [], match=r"不知|不好说|can't say|don't know", mood="neutral"),
    ]},
  "c6_maicheng": {"who": "guanyu", "fallback": "dodge",
    "q": T("出城之前，关羽坐在灯下擦刀，忽然问你：『子衡，你说实话——我错在哪里？』", "Before the breakout Guan Yu sits by the lamp cleaning his blade, and suddenly asks, 'Ziheng, tell me the truth—where did I go wrong?'"),
    "answers": [
      ans("pride", T("说错在太骄傲、看轻了东吴", "says pride—he looked down on Wu"), T("关羽擦刀的手停了。过了很久，他说：『这话，只有你敢说。』", "The hand cleaning the blade stops. After a long time he says, 'You're the only one who'd dare say that.'"), [rel("guanyu", "trust", 1), rel("guanyu", "esteem", 1)], match=r"骄|傲|轻视|看轻|看不起|东吴|吕蒙|陆逊|pride|proud|arrogan|looked down|underestimat|wu", mood="sad"),
      ans("people", T("说错在用人：糜芳、傅士仁", "says the men he trusted: Mi Fang and Fu Shiren"), T("关羽冷笑：『那两个人……』笑到一半停住了，『是我把他们逼到那一步的。』", "Guan Yu laughs coldly. 'Those two…' He stops halfway. 'I drove them to it.'"), [rel("guanyu", "esteem", 1)], match=r"糜芳|傅士仁|用人|部下|mi fang|fu shiren|men|officers", mood="sad"),
      ans("none", T("说将军没有错", "says he did nothing wrong"), T("关羽看了你一眼：『你在安慰我。』他把刀插回鞘里，『谢了。』", "Guan Yu glances at you. 'You're comforting me.' He sheathes the blade. 'Thank you.'"), [rel("guanyu", "warmth", 1)], match=r"没错|没有错|不怪|不是你|天意|nothing wrong|not your fault|fate|no fault", mood="warm"),
      ans("rude", T("当面指责他", "berates him"), T("关羽一言不发，提刀出去了。", "Guan Yu says nothing, takes up his blade and walks out."), [add("heat.guanyu", 2), rel("guanyu", "warmth", -1)], match=r"活该|蠢|自找|报应|deserve|stupid|your own fault", mood="cold"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("关羽没有追问，只是说：『也是，现在说这些没用了。』", "Guan Yu doesn't press. 'True. No use talking about it now.'"), [], match=r"不知|不好说|现在不说|can't say|don't know|not now", mood="neutral"),
    ]},
}
ASK_ORDER = {"c2_flood": ["rude", "spare", "bury", "kill", "dodge"], "c3_cd": ["rude", "no", "depends", "yes", "dodge"], "c6_maicheng": ["rude", "pride", "people", "none", "dodge"]}
# callbacks to an earlier volume can't use this volume's echo register; they become intro lines gated on the carried flag
CROSS = {"e_dandao", "e_charge"}
for n in N:
    keep = []
    for c in n.get("callbacks", []):
        if c["pays"] in CROSS: n["intro"].append(P(c["text"], c["when"]))
        else: keep.append(c)
    if "callbacks" in n:
        if keep: n["callbacks"] = keep
        else: del n["callbacks"]

V4_TAGS = {
    ("x_return4", "back"): ["yi"],
    ("c1_pangde", "guard"): ["yong", "yi"], ("c1_pangde", "bow"): ["zhi"],
    ("c1_chengdu", "east"): ["zhi", "cheng"], ("c1_chengdu", "north"): ["yong"],
    ("c1_guanping", "steady"): ["ren"], ("c1_wz", "help"): ["ren"], ("c1_wz", "plan"): ["zhi"],
    ("c2_flood", "plan"): ["zhi"], ("c2_flood", "people"): ["ren", "zhi"],
    ("c2_cd", "wu"): ["zhi", "cheng"], ("c2_cd", "supply"): ["yi"],
    ("c2_pow", "home"): ["ren"], ("c2_pow", "work"): ["zhi"],
    ("c3_bone", "game"): ["yong", "yi"], ("c3_bone", "rest"): ["zhi", "cheng"],
    ("c3_cd", "go"): ["yi", "yong"], ("c3_cd", "order"): ["zhi"],
    ("c4_luxun", "keep"): ["zhi", "cheng"], ("c4_luxun", "warn"): ["cheng"],
    ("c4_mifang", "kind"): ["ren"], ("c4_mifang", "kind2"): ["ren"], ("c4_mifang", "press"): ["li"], ("c4_mifang", "swap"): ["zhi"],
    ("c4_cd", "early"): ["yi"], ("c4_cd", "letter"): ["cheng"],
    ("c5_retreat", "call"): ["zhi"], ("c5_retreat", "men"): ["ren"], ("c5_retreat", "west"): ["zhi"],
    ("c5_shangyong", "order"): ["yi", "yong"], ("c5_shangyong", "ride"): ["yi", "yong"],
    ("c6_maicheng", "save"): ["yi", "cheng"], ("c6_maicheng", "follow"): ["yi", "yong"], ("c6_maicheng", "letter"): ["zhi"],
    ("c6_news", "wait"): ["zhi", "cheng"], ("c6_news", "vow"): ["yi"],
    ("x_guan_rage4", "stand"): ["yong"],
}
values.VALUES.setdefault("fazheng", {"zhi": ["esteem", 1], "yong": ["esteem", 1], "li": ["warmth", 1], "ren": ["esteem", -1]})
values.VALUES.setdefault("huangzhong", {"yong": ["esteem", 1], "yi": ["warmth", 1], "cheng": ["trust", 1], "li": ["esteem", -1]})
values.apply(N, CHARS, V4_TAGS)
byid = {n["id"]: n for n in N}
for nid, a in ASKS.items():
    a["answers"].sort(key=lambda x: ASK_ORDER[nid].index(x["id"]))
    byid[nid]["ask"] = a

# ------------------------------------------------------------------ cast, art, places
CAST = {
    "x_return4": cast_("zhuge"), "x_cold4": cast_("liubei", "zhuge"), "x_guan_cold4": cast_("guanyu"), "x_uncanny4": cast_("zhuge"), "x_loose4": cast_("liubei"), "x_guan_rage4": cast_("guanyu"),
    "c1_pangde": cast_("guanyu"), "c1_chengdu": cast_("zhuge", "liubei"), "c1_fazheng": cast_("fazheng"), "c1_guanping": cast_("guanyu"), "c1_wz": cast_("wenzhi"),
    "c2_flood": cast_("guanyu"), "c2_cd": cast_("liubei", "zhuge"), "c2_pow": cast_("guanyu"), "c2_wz_note": cast_("wenzhi"),
    "c3_bone": cast_("guanyu"), "c3_guanyu": cast_("guanyu"), "c3_wz_huatuo": cast_("wenzhi"), "c3_cd": cast_("liubei", "zhuge"),
    "c4_luxun": cast_("guanyu"), "c4_mifang": cast_("guanyu"), "c4_cd": cast_("liubei", "zhuge"), "c4_zhuge": cast_("zhuge"),
    "c5_retreat": cast_("guanyu"), "c5_shangyong": [], "c5_wz_jiangling": cast_("wenzhi"),
    "c6_maicheng": cast_("guanyu"), "c6_west": cast_("guanyu", "liubei"), "c6_news": cast_("liubei", "zhuge"), "c6_wz": cast_("wenzhi"),
}
def lay(id, when=None, choice=None):
    d = {"id": id}
    if when: d["when"] = when
    if choice: d["choice"] = choice
    return d
# (ink scene, ink layers, map place, illustration for the illustrated edition — v4_* still to be drawn, the ink picture stands in)
ART = {
    "x_return4": ("letter", [], None, "v3_letter"), "x_cold4": ("lamp", [], None, "g_cold"), "x_guan_cold4": ("lamp", [], None, "v3_guanping"), "x_uncanny4": ("lamp", [], None, "g_uncanny"),
    "x_loose4": ("letter", [], None, "g_cold"), "x_guan_rage4": ("hall", [], None, "v3_guan_hall"),
    "c1_pangde": ("camp", [lay("rider")], "fancheng", "v4_pangde"), "c1_chengdu": ("hall", [], "chengdu", "v3_far"), "c1_fazheng": ("lamp", [], "chengdu", "v3_fazheng_night"),
    "c1_guanping": ("campfire", [], "fancheng", "v3_guanping"), "c1_wz": ("herbs", [lay("two")], None, "g_wounded"),
    "c2_flood": ("bigriver", [], "fancheng", "v4_flood"), "c2_cd": ("hall", [lay("crowd")], "chengdu", "v4_feast"), "c2_pow": ("camp", [], "fancheng", "v4_pow"),
    "c2_wz_note": ("letter", [lay("window")], None, "v3_letter"),
    "c3_bone": ("camp", [], "fancheng", "v4_bone"), "c3_guanyu": ("campfire", [lay("blade")], "fancheng", "v3_guanyu_night"), "c3_wz_huatuo": ("riverbank", [], "fancheng", "v4_huatuo"),
    "c3_cd": ("hall", [], "chengdu", "v3_council"),
    "c4_luxun": ("letter", [lay("seal")], "fancheng", "v4_luxun"), "c4_mifang": ("letter", [], "fancheng", "v3_mifang"), "c4_cd": ("letter", [lay("window")], "chengdu", "v3_far"),
    "c4_zhuge": ("lamp", [], "chengdu", "v4_zhuge_night"),
    "c5_retreat": ("road", [lay("rider")], "fancheng", "v4_retreat"), "c5_shangyong": ("citywall", [], "shangyong", "v4_shangyong"), "c5_wz_jiangling": ("letter", [], None, "v4_wz_letter"),
    "c6_maicheng": ("citywall", [lay("dusk")], "maicheng", "v4_maicheng"), "c6_west": ("road", [], "zigui", "v4_west"), "c6_news": ("hall", [], "chengdu", "v4_news"),
    "c6_wz": ("lamp", [], None, "v4_wz_letter"),
}
for n in N:
    sc, ls, place, illus = ART[n["id"]]
    n["art"] = {"scene": sc, "layers": ls}
    if illus: n["art"]["illus"] = illus
    if place: n["place"] = place
    if n["id"] in CAST: n["cast"] = CAST[n["id"]]
PLACE_AFTER = {("c3_cd", "go"): "jiangling", ("x_return4", "back"): "chengdu", ("c5_retreat", "*"): "maicheng",
               ("c5_shangyong", "order"): "maicheng", ("c5_shangyong", "ride"): "maicheng", ("c5_shangyong", "back"): "chengdu",
               ("c6_maicheng", "save"): "zigui", ("c6_maicheng", "letter"): "chengdu", ("c4_cd", "early"): "shangyong"}
for n in N:
    for c in n["choices"]:
        pa = PLACE_AFTER.get((n["id"], c["id"])) or PLACE_AFTER.get((n["id"], "*"))
        if pa and pa != n.get("place"): c["place"] = pa

import moves_v4
CAMP_MOVES = moves_v4.extend(N)

PLACES = {k: V3["places"][k] for k in ("chengdu", "hanzhong", "jiangling", "lukou", "fancheng")}
PLACES.update({
    "gongan": {"x": 590, "y": 340, "rx": 556, "ry": 516, "zh": "公安", "en": "Gong'an"},
    "maicheng": {"x": 520, "y": 255, "rx": 528, "ry": 478, "zh": "麦城", "en": "Maicheng"},
    "shangyong": {"x": 470, "y": 140, "rx": 470, "ry": 410, "zh": "上庸", "en": "Shangyong"},
    "zigui": {"x": 430, "y": 300, "rx": 470, "ry": 495, "zh": "秭归", "en": "Zigui"},
})
RIVERS = V3["rivers"]

FUTURE = [(T("水淹七军", "the flooding of the seven armies"), "c2"), (T("刮骨", "scraping the bone"), "c3"), (T("白衣渡江", "crossing the river in white"), "c5"),
          (T("麦城", "Maicheng"), "c5"), (T("临沮", "Linju"), "c6"),
          (T("夷陵", "Yiling"), "v5"), (T("白帝", "Baidi"), "v5"), (T("托孤", "entrusting the heir"), "v5"), (T("七擒", "seven captures"), "v6"),
          (T("出师表", "the Memorial on Going to War"), "v7"), (T("街亭", "Jieting"), "v7"), (T("空城计", "the empty fort"), "v7"), (T("五丈原", "Wuzhang Plains"), "v7")]

# ------------------------------------------------------------------ endings
def frag(id, text, when=None, mood=None):
    d = {"id": id, "text": text}
    if when: d["when"] = when
    if mood: d["mood"] = mood
    return d
LIU = ALL(V("track", "==", "liu"), STAYING)
ALIVE = F("flag.guan_alive")
ENDINGS = [
    {"id": "g_side", "title": T("去处", "Where You Ended Up"), "fragments": [
        frag("hermit", T("你没有去成都。麦城的事，是从集市上听来的。", "You never went to Chengdu. You heard about Maicheng in the market."), F("flag.v4_hermit")),
        frag("exposed", T("你在一个雨夜出了城。蜀中又多了一个关于妖人的故事。", "You left the city one rainy night. Shu gained another story about a sorcerer."), F("flag.v4_exposed")),
        frag("left", T("你离开了。荆州的结局，你是在路上听说的。", "You left. You heard how Jingzhou ended while you were on the road."), F("flag.v4_left")),
        frag("west", T("你和关羽一起回到了成都。荆州丢了，人都在。", "You came back to Chengdu with Guan Yu. Jingzhou was lost; the people were not."), ALL(ALIVE, STAYING)),
        frag("with", T("临沮的小路上，你一直在他身边。", "On the Linju road, you were at his side to the end."), F("flag.v4_with_guan")),
        frag("letter", T("你从麦城南门杀了出来，怀里揣着一封信。", "You fought your way out of Maicheng's south gate with a letter inside your coat."), F("flag.v4_letter")),
        frag("chengdu", T("你在成都。荆州的消息，你是最后几个知道的。", "You were in Chengdu. You were among the last to hear what happened in Jingzhou."), LIU)]},
    {"id": "g_guanyu", "title": T("关羽", "Guan Yu"), "fragments": [
        frag("alive", T("关羽活着回到了西川。他再也没提过荆州。只有一次，喝醉了，他对你说：『那天你要是没拉住我的马……』", "Guan Yu came back to the west alive. He never spoke of Jingzhou again—except once, drunk, when he said to you, 'If you hadn't caught my bridle that day…'"), ALIVE, "warm"),
        frag("with", T("关羽最后一句话是对你说的：『替我跟大哥说，云长没有降。』你说到了。", "Guan Yu's last words were to you: 'Tell my brother Yunchang did not surrender.' You told him."), F("flag.v4_with_guan"), "sad"),
        frag("letter", T("关羽的信，刘备看了一夜。信里写了什么，他谁也没告诉。", "Liu Bei read Guan Yu's letter all night. What it said, he told no one."), F("flag.v4_letter"), "sad"),
        frag("canon", T("关羽父子死在临沮。玉泉山上的老僧普静说：『昔非今是，一切休论，后果前因，彼此不爽。』", "Guan Yu and his son died at Linju. On Mount Yuquan the old monk Pujing said: past wrong and present right—speak no more of them; causes and their effects never miss."), NF("flag.guan_alive"), "sad")]},
    {"id": "g_lord", "title": T("汉中王", "The King of Hanzhong"), "fragments": [
        frag("vow", T("汉中王说要伐吴，你是第一个跪下请命的。", "When the King spoke of war on Wu, you were the first to kneel and ask for a command."), F("flag.v4_vow")),
        frag("wait", T("你劝汉中王先别报仇。他没听进去，可他记住了是谁劝的。", "You urged the King not to rush into revenge. He didn't listen, but he remembered who had said it."), F("flag.v4_counsel_wait")),
        frag("brother", T("汉中王没穿鞋就跑出了城门。那天他抱着关羽，哭得像个孩子。", "The King ran out of the gate without his shoes. That day he held Guan Yu and wept like a child."), ALIVE),
        frag("high", T("汉中王最难的那些夜里，叫的是你的名字。", "On the King's hardest nights, it was your name he called."), ALL(LIU, AT("liubei", "trust", 4))),
        frag("low", T("汉中王待你客气。荆州的事以后，他对谁都客气。", "The King is courteous to you. Since Jingzhou he has been courteous to everyone."), LIU)]},
    {"id": "g_jingzhou", "title": T("荆州", "Jingzhou"), "fragments": [
        frag("rear", T("荆州还是丢了。可你劝关羽留下的那几千人，一个个都走回了西川。", "Jingzhou was lost all the same. But the few thousand men you had Guan Yu keep in the rear walked back to the west, every one."), F("flag.v4_kept_rear")),
        frag("mifang", T("糜芳开了江陵的城门，也托人给你送了一句话。他这辈子，只欠过你一个人的情。", "Mi Fang opened the gates of Jiangling, and he also sent you a word of warning. In all his life, you were the only one he owed."), F("flag.v4_mf_path")),
        frag("call", T("廖化早走的那三天，后来被人说成是关羽的福气。只有关羽知道，那是谁的主意。", "Those three days Liao Hua gained were later called Guan Yu's luck. Only Guan Yu knew whose idea it had been."), ALL(F("flag.v4_early_call"), ALIVE)),
        frag("relief", T("刘封给你的两千人，是那一年唯一从上庸出去的兵。", "The two thousand men Liu Feng gave you were the only troops to leave Shangyong that year."), F("flag.v4_relief")),
        frag("people", T("放水那年让你送上山的百姓，后来年年在山上烧一炷香。", "The people you sent up the hills before the flood burn incense on that hill every year."), F("flag.flood_people")),
        frag("canon", T("吕蒙白衣渡江，荆州一夜易手。烽火台上的火，一个都没有点起来。", "Lü Meng crossed in white, and Jingzhou changed hands in a night. Not one beacon fire was lit."))]},
    {"id": "g_wenzhi", "title": T("温芷", "Wen Zhi"), "fragments": [
        frag("huatuo", T("温芷跟着华佗学刀法。荆州出事那年，她不在荆州。后来她给你写信说：我学会了。", "Wen Zhi went to learn the knife from Hua Tuo. The year Jingzhou fell, she wasn't there. Later she wrote to you: I've learned it."), F("flag.wz_huatuo"), "warm"),
        frag("jiangling", T("吴兵在温芷的医馆门口守了一个冬天。开春，她背着药箱，一路走到了成都。", "Wu soldiers guarded the door of Wen Zhi's clinic all winter. In spring she shouldered her medicine chest and walked all the way to Chengdu."), ALL(WZ_J, NF("flag.wz_huatuo"))),
        frag("letter", T("那封信，你后来亲手交给了她。她看完，没有哭，只是抱住了你。", "That letter—later you put it in her hands yourself. She read it and didn't cry; she just held you."), ALL(F("flag.v4_wz_letter"), STAYING), "romance"),
        frag("child", T("成都城西的小院里，温芷种的当归又开了花。她说，等你回来，就不种药了，种点别的。", "In the little yard on the west side of Chengdu, Wen Zhi's angelica has flowered again. She says when you come home she'll stop growing medicine and grow something else."), ALL(F("flag.wz_child"), WZ_W), "romance"),
        frag("west", T("温芷在成都的医馆里，收了很多从荆州逃回来的伤兵。", "In her Chengdu clinic, Wen Zhi took in many wounded men who had made it back from Jingzhou."), WZ_W),
        frag("far", T("你很久没有温芷的消息了。", "You haven't heard from Wen Zhi in a long time."))]},
    {"id": "g_lives", "title": T("因你而不同的人", "Lives You Changed"), "mode": "all", "fragments": [
        frag("guanping", T("关平活了下来。他后来教自己的孩子写字，从《春秋》抄起。", "Guan Ping lived. Later he taught his own children to write, starting with the Spring and Autumn Annals."), ALIVE),
        frag("pangde", T("庞德被葬在樊城外的山坡上。是你劝关羽厚葬的。", "Pang De lies on a hillside outside Fancheng. You were the one who had him buried with honor."), F("flag.pd_spare")),
        frag("pow", T("放回家的降兵里，有人后来托人带话：家里的地，种上了。", "Of the prisoners sent home, one sent word later: the family fields are planted again."), F("flag.pow_home")),
        frag("fazheng", T("法正的账本，最后一页写着你的名字，在“恩”那一边。", "On the last page of Fa Zheng's ledger is your name, on the side of kindnesses."), AT("fazheng", "warmth", 3)),
        frag("liaohua", T("廖化记得上庸那天，是你第一个拍了桌子。", "Liao Hua remembers that at Shangyong, you were the first to slam the table."), F("flag.v4_relief"))]},
    {"id": "g_name", "title": T("名声", "Your Name"), "fragments": [
        frag("uncanny", T("蜀中有人说：荆州的事，子衡早就知道。", "In Shu some say Ziheng knew all along what would happen to Jingzhou."), V("uncanny", ">=", 4)),
        frag("rash", T("人说子衡口无遮拦。喜欢你的人说你真，怕你的人说你狂。", "People say Ziheng can't hold his tongue. Those who like you call it honesty; those who fear you call it madness."), V("renown.rash", ">=", 4)),
        frag("loyal", T("人说子衡重义。", "People say Ziheng keeps faith."), V("renown.loyal", ">", "@renown.cunning")),
        frag("cunning", T("人说子衡多智，也说子衡心深。", "People say Ziheng is clever, and that his mind runs deep."), V("renown.cunning", ">", "@renown.loyal")),
        frag("none", T("史书里没有你的传，只有几处『或曰』。", "The histories give you no biography—just a few lines beginning 'some say.'"))]},
    {"id": "g_history", "title": T("天下", "The Realm"), "fragments": [
        frag("alive", T("说书人讲到麦城，讲不下去了：那一夜，关羽走的是大路。", "When storytellers reach Maicheng, they can't go on: that night, Guan Yu took the main road."), ALIVE),
        frag("far", T("说书人讲到荆州，有好几处讲不顺——那几处，都是你。", "When storytellers reach Jingzhou, several places never quite fit. Those places are you."), V("deviation", ">=", 6)),
        frag("plain", T("荆州归了东吴。刘家离天下最近的那几年，过去了。", "Jingzhou went to Wu. The years when the house of Liu came closest to the realm were over."))]},
]
FRAG_FACE = {"g_guanyu": {"alive": ("guanyu", "warm"), "with": ("guanyu", "sad"), "letter": ("liubei", "sad"), "canon": ("guanyu", "sad")},
             "g_lord": {"vow": ("liubei", "warm"), "wait": ("liubei", "cold"), "brother": ("liubei", "warm"), "high": ("liubei", "warm"), "low": ("liubei", "neutral")},
             "g_wenzhi": {"huatuo": ("wenzhi", "warm"), "letter": ("wenzhi", "shy"), "jiangling": ("wenzhi", "sad"), "west": ("wenzhi", "warm"), "far": ("wenzhi", "sad")}}
ENDING_ART = {"scene": "ending", "layers": [{"id": "city", "when": HOME}, {"id": "home", "when": ALL(WZ, AT("wenzhi", "intimacy", 3))},
                                            {"id": "lone", "when": ANY(F("flag.v4_hermit"), F("flag.v4_left"), F("flag.v4_exposed"), F("flag.v4_with_guan"))},
                                            {"id": "sail", "when": ALIVE}]}

# ------------------------------------------------------------------ realm
def _ctl(**kw):
    base = {"liang": "cao", "bing": "cao", "you": "cao", "ji": "cao", "qing": "cao", "sili": "cao", "yan": "cao", "yu": "cao", "xu": "cao",
            "jing": ["liubei", "sun"], "yang": "sun", "yi": "liubei", "jiao": "sun"}
    base.update(kw); return base
REALM = json.loads(json.dumps(V3["realm"]))
REALM["control"] = {f"c{i}": _ctl() for i in range(1, 7)}
REALM["control"]["c5"] = _ctl(jing=["sun", "liubei"]); REALM["control"]["c6"] = _ctl(jing="sun")
REALM["captions"] = {"c1": T("关羽北攻樊城，于禁、庞德来救", "Guan Yu besieges Fancheng; Yu Jin and Pang De come to relieve it"),
                     "c2": T("水淹七军，威震华夏", "Seven armies drowned; the realm shakes"),
                     "c3": T("关羽箭伤未愈，吕蒙称病", "Guan Yu's wound won't heal; Lü Meng claims illness"),
                     "c4": T("陆逊接替吕蒙守陆口", "Lu Xun replaces Lü Meng at Lukou"),
                     "c5": T("吕蒙白衣渡江，荆州易手", "Lü Meng crosses in white; Jingzhou changes hands"),
                     "c6": T("建安二十四年冬：荆州归吴", "Winter 219: Jingzhou falls to Wu")}

COMMIT_RULES = speech.commit_rules()
ART_PROMPTS = dict(V3["art_prompts"])
PORTRAIT_PROMPTS = dict(V3["portrait_prompts"])
PRESETS = json.loads((HERE / "presets.json").read_text()) if (HERE / "presets.json").exists() else []

CAMPAIGN = {
    "spec": SPEC,
    "tiers": TIERS(),
    "hard_tiers": {"rel.liubei.trust": 3},
    "pack": PACK("history-strategy"),
    "resources": {"reputation": ["renown.loyal", "renown.cunning"], "risk": ["uncanny", "renown.rash"], "drift": ["deviation"]},
    "carry_compress": {"pivot": 4, "k": 0.5},
    "id": "sanguo_strategist_v4",
    "prev": "sanguo_strategist_v3",
    "title": T("三国·谋士", "Three Kingdoms: The Strategist"),
    "volume": T("卷四 · 荆州之殇", "Volume IV · The Fall of Jingzhou"),
    "rights": {"source": "《三国演义》（罗贯中，明代），公版", "quotes": "中文原文直接引用；英文为本项目自译", "original_characters": ["子衡（玩家）", "温芷"]},
    "player": {"name": T("子衡", "Ziheng")},
    "side_prompt": SIDE_PROMPT,
    "vars": VARS, "chars": CHARS, "dims": DIMS, "echoes": ECHOES, "debts": DEBTS,
    "chapters": CHAPTERS, "nodes": {n["id"]: n for n in N}, "endings": ENDINGS,
    "future_terms": [{"term": t, "from": c} for t, c in FUTURE],
    "ending_art": ENDING_ART, "art_prompts": ART_PROMPTS, "frag_face": FRAG_FACE, "portrait_prompts": PORTRAIT_PROMPTS, "cg_captions": V3["cg_captions"], "realm": REALM,
    "react_patterns": V3["react_patterns"], "value_tags": values.TAGS, "commit_rules": COMMIT_RULES,
    "flash": [{"char": "guanyu", "node": "x_guan_rage4", "resume": True}], "moves": CAMP_MOVES,
    "witness": [{"who": "zhuge", "to": "liubei", "labels": ["rude", "threat"], "effects": [rel("zhuge", "trust", -1)]}],
    "places": PLACES, "rivers": RIVERS,
    "meters": {"uncanny": T("到 6：被当作妖人", "At 6: branded a sorcerer"), "rash": T("到 6：有人会把你的话报上去", "At 6: someone reports what you've said")},
    "presets": PRESETS,
    "sources": [{"what": "中文引文核对底本", "url": "https://www.ntdtv.com/gb/2009/12/03/a381137.html", "checked": "2026-10-27", "note": "第74回（庞德抬榇、冷箭、水淹七军、庞德不降）"},
                {"what": "中文引文核对底本", "url": "https://www.ntdtv.com/gb/2009/12/08/a381596.html", "checked": "2026-10-27", "note": "第75回（刮骨疗毒、陆逊书、白衣渡江）"},
                {"what": "中文引文核对底本", "url": "https://www.ntdtv.com/gb/2009/12/11/a382223.html", "checked": "2026-10-27", "note": "第76回（悔不听足下之言、孟达语、玉可碎竹可焚）"},
                {"what": "中文引文核对底本", "url": "https://www.ntdtv.com/gb/2009/12/14/a382338.html", "checked": "2026-10-27", "note": "第77回（虽有埋伏吾何惧哉、普静语；此本作“普静”，照录）"}],
    "end_note": T("卷四终。卷五《夷陵与白帝》尚未开放。", "End of Volume IV. Volume V (Yiling and Baidi) is not yet open."),
}

if __name__ == "__main__":
    out = HERE / "campaign_v4.json"
    dump(CAMPAIGN, out)
    print("nodes", len(N), "->", out)

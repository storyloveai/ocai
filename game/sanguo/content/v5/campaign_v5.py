"""三国·谋士 卷五（夷陵与白帝，第78–85回）。

接着卷四：同名变量由上一卷带来；没玩过卷四的玩家从“前情”开始。卷四结束时还在刘备这边的人，这一卷都在成都开局。
2026-10-27 定（见决策记录 v2.11）：东征劝不住，你能改的是代价——带多少人、营扎在哪、救下谁、败得多惨。
卷四救下关羽的，关羽当东征的前锋，生死看你；张飞能救，门槛高；刘备对你的信任到「心腹」，白帝城托孤给你。
为以后加“改写历史”的分支留了接口：条件都够、只是剧情不让劝住东征时，记一笔 flag.v5_nearly。
原著引文只取公版原文，并已核对（见 sources）；其余叙述和英文都是我们自己写的。细纲见 docs/全书规划.md。
"""
import json, pathlib, sys
HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE.parent))
from lib import *
import situations
import speech, values
from talks import topic, talk_node
from asks import ans
import people_v5 as P5

V4 = json.loads((HERE.parent / "v4" / "campaign_v4.json").read_text())

def flag(label, carry=True):
    d = {"type": "flag", "init": False, "label": label}
    if not carry: d["carry"] = False
    return d
def I(c, k, op, v): return V(f"imp.{c}.{k}", op, v)
def twin(cond, a, b):
    """the same option written twice: `a` shows when cond holds, `b` otherwise (effects can't be conditional)"""
    a["when"] = cond; b["when"] = _neg(cond); b["id"] = a["id"] + "_2"
    return [a, b]
def _neg(c):
    # negate a condition built from F/NF/AT/ALL/ANY
    if "all" in c: return ANY(*[_neg(x) for x in c["all"]])
    if "any" in c: return ALL(*[_neg(x) for x in c["any"]])
    if c["op"] == ">=": return {**c, "op": "<=", "val": c["val"] - 1}   # tier boundaries stay on boundaries
    if c["op"] == "<=": return {**c, "op": ">=", "val": c["val"] + 1}
    return {**c, "op": {"==": "!=", "!=": "=="}[c["op"]]}

AWAY = ANY(F("prev.ended_early"), V("track", "==", "cao"))
GUAN = F("flag.guan_alive")
NOGUAN = NF("flag.guan_alive")
FEI = F("flag.fei_alive")
LANG = F("flag.v5_langzhong")
STAY = NF("flag.v5_hermit")
STAYING = ALL(NF("flag.v5_hermit"), NF("flag.v5_left"), NF("flag.v5_exposed"))
WZ = ANY(F("flag.wz_west"), F("flag.wz_jingzhou"), F("flag.wz_huatuo"))
WZ_HT = F("flag.wz_huatuo")
TRUST4 = AT("liubei", "trust", 4)
FEI_SAVE = ANY(F("flag.wakou_go"), F("flag.v5_fei_letter"))
NEARLY = ALL(AT("liubei", "trust", 3), ANY(AT("zhuge", "esteem", 3), AT("zhaoyun", "trust", 3)))

# ------------------------------------------------------------------ vars
VARS = {k: v for k, v in json.loads(json.dumps(V4["vars"])).items() if not k.startswith(("heat.", "debt."))}
FLAGS = {
    "flag.v5_came_back": T("流落之后回到刘备身边", "Came back to Liu Bei after wandering"),
    "flag.v5_hermit": T("就此隐去", "Disappeared from the world"),
    "flag.v5_north": T("劝刘备趁曹操新丧北伐", "Urged Liu Bei north while Cao Cao's death was fresh"),
    "flag.wz_qingnang": T("温芷抄下了华佗的几页医书", "Wen Zhi copied out some pages of Hua Tuo's book"),
    "flag.liufeng_spared": T("刘封没有死", "Liu Feng was spared"),
    "flag.v5_mengda": T("说中了孟达会投魏", "Foretold Meng Da's defection"),
    "flag.v5_fei_letter": T("写信劝张飞少喝酒、别打士卒", "Wrote to Zhang Fei to drink less and stop flogging his men"),
    "flag.v5_fei_vow": T("答应张飞一起报仇", "Promised Zhang Fei you'd avenge his brother together"),
    "flag.v5_zhaoyun": T("东征之议，站在赵云一边", "Sided with Zhao Yun against the eastern war"),
    "flag.v5_nearly": T("差一点劝住了东征", "Very nearly talked Liu Bei out of the eastern war"),
    "flag.v5_langzhong": T("随张飞去了阆中", "Went to Langzhong with Zhang Fei"),
    "flag.v5_fei_warned": T("请刘备当面嘱咐张飞", "Asked Liu Bei to warn Zhang Fei to his face"),
    "flag.fei_alive": T("张飞没有死在阆中", "Zhang Fei did not die at Langzhong"),
    "flag.v5_fei_night": T("张飞遇害那一夜，你在阆中", "You were at Langzhong the night Zhang Fei was killed"),
    "flag.v5_peace": T("劝刘备答应东吴的求和", "Urged Liu Bei to accept Wu's offer of peace"),
    "flag.v5_hz_ride": T("陪黄忠出了最后一阵", "Rode out with Huang Zhong on his last charge"),
    "flag.v5_hz_word": T("请刘备收回那句“老将无用”", "Asked Liu Bei to take back 'the old generals are useless'"),
    "flag.v5_firebreak": T("劝刘备在营间留出防火的空地", "Persuaded Liu Bei to leave firebreaks between the camps"),
    "flag.v5_map": T("和马良一起把营图送到成都", "Took the camp map to Chengdu with Ma Liang"),
    "flag.v5_rear": T("回去救后营", "Went back for the rear camps"),
    "flag.v5_guard": T("护着刘备退到白帝城", "Brought Liu Bei back to Baidi"),
    "flag.v5_guan_last": T("陪关羽断后", "Held the rear with Guan Yu"),
    "flag.v5_entrusted": T("白帝城受托孤", "Received the dying emperor's charge at Baidi"),
    "flag.v5_masu": T("记下了刘备对马谡的话", "Remembered what Liu Bei said about Ma Su"),
    "flag.wz_wed": T("和温芷说定了成亲", "Promised to marry Wen Zhi"),
    "flag.v5_left": T("被冷落后离开", "Left after being sidelined"),
    "flag.v5_exposed": T("妖人之名坐实", "Branded a sorcerer for good"),
}
for k, lab in FLAGS.items(): VARS[k] = flag(lab)

# ------------------------------------------------------------------ people
CHARS = json.loads(json.dumps(V4["chars"]))
for k, p in P5.PERSONA.items(): CHARS[k]["persona"] = p
DIMS = dict(V4["dims"])
for c in CHARS:
    if CHARS[c].get("heat"):
        VARS[f"heat.{c}"] = {"type": "num", "init": 0, "min": 0, "max": 5, "char": c, "show": False, "carry": False,
                             "label": T(CHARS[c]["name"]["zh"] + "·火气", CHARS[c]["name"]["en"] + " · Temper")}

ECHOES = {
    "e_north": T("曹操死的那年，你劝过刘备北伐", "The year Cao Cao died, you urged Liu Bei north"),
    "e_liufeng": T("你替刘封求过情", "You pleaded for Liu Feng"),
    "e_fei_letter": T("你写信劝过张飞别打士卒", "You wrote to Zhang Fei to stop flogging his men"),
    "e_fei_vow": T("你答应过张飞一起报仇", "You promised Zhang Fei you'd avenge his brother together"),
    "e_zy": T("东征之议，你站在赵云一边", "At the war council you stood with Zhao Yun"),
    "e_peace": T("你劝刘备答应求和", "You urged Liu Bei to accept peace"),
    "e_hz": T("你陪黄忠出了最后一阵", "You rode out on Huang Zhong's last charge"),
    "e_firebreak": T("营与营之间的空地，是你劝着留的", "The firebreaks between the camps were your doing"),
    "e_map": T("你和马良把营图送去了成都", "You took the camp map to Chengdu with Ma Liang"),
    "e_guard": T("火起那夜，你一直在刘备身边", "On the night of the fire you never left Liu Bei's side"),
}
DEBTS = {}

SIDE_PROMPT = T("这段日子，你只来得及做一件事。", "These days you only have time for one thing.")
CHAPTERS = [
    {"id": "c1", "title": T("华佗", "Hua Tuo"), "year": T("建安二十五年（220）", "Jian'an 25 (220)"), "canon": T("第78回", "Ch. 78"), "offer": 2,
     "intro": [P(T("成都入了春。从北边传来消息：曹操病重，杀了一个叫华佗的郎中，没过多久，自己也死了。他的儿子曹丕做了魏王。", "Spring comes to Chengdu. News arrives from the north: Cao Cao, gravely ill, had a physician named Hua Tuo put to death, and not long afterward died himself. His son Cao Pi is King of Wei now.")),
               P(T("关羽回到成都已经一个冬天了。左臂抬不过肩，他每天还是在院子里练刀。", "Guan Yu has been back in Chengdu a whole winter. His left arm won't rise above the shoulder, but every day he still drills with the blade in the courtyard."), GUAN),
               P(T("孙权放你回来的那天，什么也没说，只给了你一匹马。你一路走回成都，把关羽那句话带给了刘备。", "The day Sun Quan let you go, he said nothing; he just gave you a horse. You rode all the way back to Chengdu and gave Liu Bei Guan Yu's last words."), F("flag.v4_with_guan"))]},
    {"id": "c2", "title": T("刘封", "Liu Feng"), "year": T("建安二十五年（220）", "Jian'an 25 (220)"), "canon": T("第79回", "Ch. 79"), "offer": 2,
     "intro": [P(T("孟达投了魏。刘封丢了上庸，一个人逃回成都。", "Meng Da has gone over to Wei. Liu Feng has lost Shangyong and fled back to Chengdu alone."))]},
    {"id": "c3", "title": T("称帝", "Emperor"), "year": T("章武元年（221）", "Zhangwu 1 (221)"), "canon": T("第80–81回", "Ch. 80–81"), "offer": 2,
     "intro": [P(T("曹丕废了汉献帝，自己做了皇帝。成都传说献帝已经遇害，汉中王痛哭了一整天。", "Cao Pi has deposed Emperor Xian and taken the throne himself. Rumor in Chengdu says the Emperor has been murdered, and the King of Hanzhong weeps for a whole day."))]},
    {"id": "c4", "title": T("阆中", "Langzhong"), "year": T("章武元年（221）", "Zhangwu 1 (221)"), "canon": T("第81回", "Ch. 81"), "offer": 1,
     "intro": [P(T("阆中。张飞回来以后，每天喝酒，每天骂人。帐下的人走路都踮着脚。", "Langzhong. Since he came back, Zhang Fei drinks every day and curses every day. The men in his headquarters walk on tiptoe."), LANG),
               P(T("成都。东征的兵马一天天聚起来。陛下说，等翼德从阆中来了就动身。", "Chengdu. The army for the east gathers day by day. His Majesty says they will march as soon as Yide arrives from Langzhong."), NF("flag.v5_langzhong"))]},
    {"id": "c5", "title": T("东征", "The March East"), "year": T("章武二年（222）", "Zhangwu 2 (222)"), "canon": T("第82–83回", "Ch. 82–83"), "offer": 2,
     "intro": [P(T("七十多万大军出了三峡，一路打到秭归。孙权慌了。", "An army said to be seven hundred thousand strong comes down the Three Gorges and fights its way to Zigui. Sun Quan panics.")),
               P(T("关羽骑在前锋的马上，左手用布缠在缰绳上。", "Guan Yu rides with the vanguard, his left hand bound to the reins with cloth."), GUAN),
               P(T("张飞骑在前锋的马上，嗓门比谁都大。", "Zhang Fei rides with the vanguard, louder than anyone."), FEI)]},
    {"id": "c6", "title": T("连营", "The Long Camp"), "year": T("章武二年（222）", "Zhangwu 2 (222)"), "canon": T("第83–84回", "Ch. 83–84"), "offer": 2,
     "intro": [P(T("夏天到了。陆逊守着不出战。蜀军从猇亭一直扎营到川口，前后七百里。天太热，陛下下令把营移到树林里、溪水边。", "Summer comes. Lu Xun holds fast and won't come out. The Shu camps stretch from Xiaoting all the way to the river mouth, seven hundred li end to end. It is very hot, and His Majesty orders the camps moved into the woods, beside the streams."))]},
    {"id": "c7", "title": T("火烧连营", "The Fire"), "year": T("章武二年（222）", "Zhangwu 2 (222)"), "canon": T("第84回", "Ch. 84"), "offer": 1,
     "intro": [P(T("那天夜里起了东南风。", "That night the wind comes up from the southeast."))]},
    {"id": "c8", "title": T("托孤", "The Charge"), "year": T("章武三年（223）", "Zhangwu 3 (223)"), "canon": T("第85回", "Ch. 85"), "offer": 2,
     "intro": [P(T("陛下退到白帝城，住进了永安宫，没有回成都。第二年春天，他病倒了。", "His Majesty has fallen back to Baidi and moved into the Palace of Enduring Peace; he has not gone back to Chengdu. The next spring he falls ill."))]},
]

N = []
def cast_(*ids): return [{"id": i} for i in ids]

# ---------- interlude ----------
N.append(node("x_return5", "*", "interrupt", T("故人来信", "A Letter from an Old Friend"), "free", T("原创", "original"),
    [P(T("你离开刘备已经好几年了。", "It has been years since you left Liu Bei."), F("prev.ended_early")),
     P(T("你在北方住了很多年。曹操死了，曹丕做了皇帝。", "You have lived in the north for many years. Cao Cao is dead, and Cao Pi is emperor."), V("track", "==", "cao")),
     P(T("诸葛亮的信只有一句：『主上要东征。子衡兄若还念旧，请来成都。』", "Zhuge Liang's letter is one line long: 'Our lord means to march east. If you still remember the old days, Ziheng, come to Chengdu.'"))],
    [choice("back", "dilemma", T("动身去成都。", "Set out for Chengdu."),
            T("诸葛亮在城门口等你，比上回见老了很多。他说：『来得正好，也来得晚了。』", "Zhuge Liang waits at the gate, much older than when you last saw him. 'You've come just in time,' he says, 'and too late.'"),
            [setv("flag.v5_came_back"), setv("track", "liu"), rel("liubei", "trust", -1), rel("zhuge", "esteem", 1)]),
     choice("hermit", "expression", T("把信收好，不去了。", "Put the letter away. You won't go."),
            T("那年秋天，你听说蜀军出了三峡。", "That autumn you hear the Shu army has come down the Gorges."), [setv("flag.v5_hermit")])],
    when=AWAY, order=-2))
N[-1]["choices"][1]["ends"] = True

# ---------- c1 华佗 ----------
N.append(node("c1_caodeath", "c1", "main", T("奸雄数终", "The End of Cao Cao"), "functional", T("第78回", "Ch. 78"),
    [P(T("汉中王召集众人：曹操死了，曹丕刚刚继位，人心未定。该怎么办？他看向你。", "The King of Hanzhong summons everyone: Cao Cao is dead, Cao Pi has only just succeeded, and men's loyalties are unsettled. What now? He looks at you.")),
     P(T("关羽坐在下首，吊着左臂。他只说了两个字：『荆州。』", "Guan Yu sits in a lower seat, his left arm in a sling. He says just one word: 'Jingzhou.'"), GUAN)],
    [choice("north", "strategy", T("说：趁曹丕新立，出汉中，取关中。", "Say: while Cao Pi is new to his seat, strike out from Hanzhong and take the land within the passes."),
            T("汉中王点头，又摇头：『二弟的仇……』话没说完。诸葛亮看了你一眼，眼里有一点亮光。", "The King nods, then shakes his head. 'My brother's revenge…' He doesn't finish. Zhuge Liang glances at you, and something brightens in his eyes."),
            [setv("flag.v5_north"), rel("zhuge", "esteem", 1), rel("zhaoyun", "esteem", 1), rel("liubei", "warmth", -1)], echo=["e_north"]),
     choice("east", "dilemma", T("说：先拿回荆州。荆州不在手，北伐也走不远。", "Say: take back Jingzhou first. Without Jingzhou the north is out of reach."),
            T("汉中王一拍案：『正合孤意！』关羽、张飞的旧部都站了起来。诸葛亮低下了头。", "The King slams the table. 'Just what I think!' Guan Yu's and Zhang Fei's old officers rise to their feet. Zhuge Liang lowers his eyes."),
            [rel("liubei", "warmth", 1), rel("liubei", "trust", 1), rel("zhuge", "esteem", -1)]),
     choice("wait", "expression", T("说：先等等，看曹丕怎么坐稳。", "Say: wait a while and see how Cao Pi settles in."),
            T("汉中王没说话。散了议，他一个人在殿上坐到天黑。", "The King says nothing. When the council breaks up, he sits alone in the hall until dark."), [rel("liubei", "esteem", 1)])],
    when=STAY, order=10))

N.append(talk_node("c1_fazheng_end", "c1", T("夜谈·法正", "Night Talk: Fa Zheng"),
    T("法正病得下不了床了。他让人把你请去，屋里一股药味。他看见你，笑了一下：『子衡，最后一回了。』", "Fa Zheng can no longer leave his bed. He sends for you; the room smells of medicine. He sees you and smiles a little. 'Ziheng. The last time.'"),
    "fazheng", 2,
    [topic("east", T("问他：主公要是东征，该怎么劝？", "Ask him: if our lord marches east, how do we talk him out of it?"),
           T("法正闭着眼睛想了很久：『我要是还在，也许劝得住。就算劝不住，也能让他输得不那么惨。』他睁开眼，『现在，这事归你了。』", "Fa Zheng lies with his eyes closed a long while. 'If I were still here, maybe I could stop him. Even if I couldn't, I could make sure he didn't lose so badly.' He opens his eyes. 'Now that's yours.'"),
           [rel("fazheng", "trust", 1), rel("liubei", "esteem", 1)]),
     topic("ledger", T("问他：账本呢？", "Ask him: and the ledger?"),
           T("『烧了。』法正说，『人要走了，还记那些做什么。』他咳了几声，『你的名字，我没舍得烧。撕下来了，在枕头底下。』", "'Burned it,' Fa Zheng says. 'When you're going, why keep all that?' He coughs. 'I couldn't bring myself to burn your name. I tore it out. It's under my pillow.'"),
           [rel("fazheng", "warmth", 2)]),
     topic("hand", T("什么也不说，握住他的手。", "Say nothing. Take his hand."),
           T("法正的手很凉。他没有抽回去。", "Fa Zheng's hand is cold. He doesn't pull it away."), [rel("fazheng", "warmth", 1)])],
    T("那年冬天，法正死了，四十五岁。汉中王哭了好几天。", "That winter Fa Zheng dies, aged forty-five. The King of Hanzhong weeps for days."), when=STAY, order=20))

N.append(node("c1_wz_huatuo", "c1", "side", T("青囊", "The Blue Bag"), "free", T("原创人物", "original character"),
    T("温芷从许都托人捎来一封信，字写得很乱：华佗先生下了狱。他在狱里写了一部医书，说要交给看守。温芷进不去，只能隔着墙递药。", "A letter comes from Wen Zhi in Xuchang, the handwriting ragged: Master Hua Tuo has been thrown in prison. In his cell he has written a book of medicine and means to give it to his jailer. Wen Zhi can't get in; she can only pass medicine through the wall."),
    [choice("copy", "dilemma", T("回信：想办法去见那个看守，能抄几页是几页。", "Write back: find a way to the jailer, and copy whatever pages you can."),
            T("几个月后，温芷回到成都，背着药箱，怀里揣着一叠抄得歪歪扭扭的纸。她说：『看守的老婆把书烧了。我只抄下来十一页。』", "Months later Wen Zhi comes back to Chengdu with her medicine chest and a sheaf of crooked handwriting inside her robe. 'The jailer's wife burned the book,' she says. 'I only copied eleven pages.'"),
            [setv("flag.wz_qingnang"), rel("wenzhi", "esteem", 2), rel("wenzhi", "trust", 1)]),
     choice("home", "strategy", T("回信：马上回蜀，许都不是久留的地方。", "Write back: come back to Shu at once. Xuchang is no place to stay."),
            T("温芷回来了。她说，走的那天，华佗先生隔着墙对她说了一句：『回去吧，有人在等你。』", "Wen Zhi comes home. On the day she left, she says, Master Hua said to her through the wall, 'Go home. Someone's waiting for you.'"),
            [rel("wenzhi", "intimacy", 2), rel("wenzhi", "trust", 1)])],
    quote=T("某有一法：先饮麻肺汤，然后用利斧砍开脑袋，取出风涎，方可除根。",
            "I have one method: first drink a numbing draught, then open the skull with a sharp axe and take out the wind-phlegm. Only so can the root be removed."),
    when=ALL(WZ_HT, STAY), salience=4, order=1))

N.append(node("c1_wz_clinic", "c1", "side", T("医馆", "The Clinic"), "free", T("原创人物", "original character"),
    T("温芷的医馆里住满了从荆州逃回来的伤兵。她一个人忙不过来，看见你，第一句话是：『来了就别站着。』", "Wen Zhi's clinic is full of wounded men who made it back from Jingzhou. She can't manage alone, and the first thing she says when she sees you is, 'If you're here, don't just stand there.'"),
    [choice("help", "dilemma", T("挽起袖子帮她。", "Roll up your sleeves and help."),
            T("忙到半夜，她给你端来一碗粥，坐在你旁边，一句话也没说。", "At midnight she brings you a bowl of porridge and sits beside you without a word."),
            [rel("wenzhi", "intimacy", 1), rel("wenzhi", "warmth", 1)]),
     choice("men", "strategy", T("去找丞相，调几个人、一批药来。", "Go to the Chancellor for men and a load of medicine."),
            T("第二天，药和人都到了。温芷说：『你说话，比我管用。』", "The next day the medicine and the men arrive. Wen Zhi says, 'Your word carries further than mine.'"),
            [rel("wenzhi", "trust", 1), rel("zhuge", "warmth", 1)])],
    when=ALL(WZ, NF("flag.wz_huatuo"), STAY), salience=3, order=2))

# ---------- c2 刘封 ----------
N.append(node("c2_liufeng", "c2", "main", T("刘封", "Liu Feng"), "functional", T("第79回", "Ch. 79"),
    [P(T("刘封跪在殿下。汉中王指着他：『辱子有何面目复来见吾！』刘封哭着说：『叔父之难，非儿不救，因孟达谏阻故耳。』汉中王更怒了，要推出去斩。满殿的人都看你。", "Liu Feng kneels below the throne. The King points at him, asking how the disgrace dares show his face again. Weeping, Liu Feng says it wasn't that he wouldn't save his uncle—Meng Da talked him out of it. That only makes the King angrier, and he orders him taken out and beheaded. Every eye in the hall turns to you.")),
     P(T("你在上庸跟刘封、孟达争过。那天刘封给了你两千人。", "You argued with Liu Feng and Meng Da at Shangyong. That day Liu Feng gave you two thousand men."), F("flag.v4_relief"))],
    twin(F("flag.v4_relief"),
         choice("plead", "dilemma", T("出班跪下：上庸那天，刘封给过臣两千人。救人的兵，是他发的。", "Step forward and kneel: that day at Shangyong, Liu Feng gave me two thousand men. The troops that went to the rescue were his."),
                T("汉中王愣住了。他看着刘封，又看着你，很久才挥了挥手：『削去官职，回去种地吧。』刘封磕了三个头，出去的时候没敢看你。", "The King is taken aback. He looks at Liu Feng, then at you, and at last waves a hand. 'Strip him of his posts. Let him go and farm.' Liu Feng knocks his head three times and leaves without daring to look at you."),
                [setv("flag.liufeng_spared"), rel("liubei", "esteem", 1), add("deviation", 2)], echo=["e_liufeng"]),
         choice("plead", "dilemma", T("出班跪下，替刘封求情：他是陛下的养子，罪在孟达。", "Step forward and kneel for Liu Feng: he is your adopted son; the crime is Meng Da's."),
                T("汉中王没有听。刘封被推了出去。后来汉中王听说，孟达写信招降刘封，刘封撕了信、斩了来使。他心里后悔，好几天没有说话。", "The King won't hear it. Liu Feng is taken out. Later the King learns that Meng Da wrote inviting Liu Feng to defect, and Liu Feng tore up the letter and beheaded the messenger. He regrets it, and for days says nothing."),
                [rel("liubei", "warmth", -1), add("renown.loyal")], echo=["e_liufeng"])) +
    [choice("mengda", "strategy", T("说：孟达才是祸首。他投了魏，还会写信来招降刘封。", "Say: Meng Da is the real culprit. He's gone to Wei, and he'll write to lure Liu Feng over too."),
            T("没过几天，果然有人从魏营来，送来孟达的信。刘封已经死了。汉中王看着那封信，又看你：『你怎么知道？』", "Within days, someone does come from the Wei camp with a letter from Meng Da. Liu Feng is already dead. The King looks at the letter, then at you. 'How did you know?'"),
            [setv("flag.v5_mengda"), add("uncanny"), rel("liubei", "esteem", 1)], foresight=True),
     choice("silent", "expression", T("不说话。", "Say nothing."),
            T("刘封被推了出去。汉中王后来知道了实情，心里后悔，可人已经没了。", "Liu Feng is taken out. Later the King learns the truth and regrets it, but the man is gone."), [])],
    quote=T("叔父之难，非儿不救，因孟达谏阻故耳。", "It was not that I would not save my uncle; Meng Da talked me out of it, that is all."),
    when=STAY, order=10))

N.append(node("c2_fei_letter", "c2", "side", T("张飞的信", "A Letter from Zhang Fei"), "free", T("原创", "original"),
    T("张飞从阆中派人送来一封信，墨迹东一块西一块，看得出是喝醉了写的：『二哥的仇，先生帮不帮俺？』", "Zhang Fei sends a letter from Langzhong, ink blotted everywhere—plainly written drunk. 'My second brother's revenge—will you help me, sir?'"),
    [choice("advise", "strategy", T("回信：仇要报，先把酒放下。还有，别再打帐下的人。", "Write back: there'll be revenge, but put down the wine first. And stop flogging your men."),
            T("张飞的回信只有四个字，写得很大：『俺知道了。』", "Zhang Fei's reply is three words, written very large: 'I hear you.'"),
            [setv("flag.v5_fei_letter"), add("renown.loyal")], echo=["e_fei_letter"]),
     choice("vow", "dilemma", T("回信：帮。三将军去哪，子衡去哪。", "Write back: yes. Wherever the Third General goes, Ziheng goes."),
            T("张飞的回信更乱了，只看得清一句：『先生是好汉！』", "Zhang Fei's reply is even messier. All you can make out is: 'You're a real man, sir!'"),
            [setv("flag.v5_fei_vow"), add("renown.rash")], echo=["e_fei_vow"])],
    when=STAY, salience=3, order=1))
N[-1]["intro"].append(P(T("你想起瓦口那七天，瓮里一半是水。", "You remember those seven days at Wakou, every jar half water."), F("flag.wakou_go")))
N[-1]["intro"].append(P(T("信是写给关羽的，他让人转给了你：『三弟的事，你回吧。』", "The letter was addressed to Guan Yu; he has had it passed to you. 'It's about my third brother. You answer it.'"), GUAN))
N[-1]["intro"][0] = P(T("张飞从阆中派人送来一封信，墨迹东一块西一块，看得出是喝醉了写的：『二哥的仇，先生帮不帮俺？』", "Zhang Fei sends a letter from Langzhong, ink blotted everywhere—plainly written drunk. 'My second brother's revenge—will you help me, sir?'"), NOGUAN)
N[-1]["intro"].insert(1, P(T("张飞从阆中派人送来一封信，墨迹东一块西一块，看得出是喝醉了写的：『荆州，先生帮不帮俺们拿回来？』", "Zhang Fei sends a letter from Langzhong, ink blotted everywhere—plainly written drunk. 'Jingzhou—will you help us take it back, sir?'"), GUAN))

N.append(node("c2_guan", "c2", "side", T("左臂", "The Left Arm"), "free", T("原创", "original"),
    T("关羽在院子里练刀。左手握不住刀柄，刀两次脱了手。他看见你，把刀插回架上：『你来看我的笑话？』", "Guan Yu is drilling in the courtyard. His left hand can't keep its grip; twice the blade slips. He sees you and racks it. 'Come to laugh at me?'"),
    [choice("train", "dilemma", T("拿起一根木棍：『将军用右手。我陪你练。』", "Pick up a staff. 'Use your right hand, General. I'll practise with you.'"),
            T("你挨了七八下，最后一下打在肩上，你坐在地上起不来。关羽伸出右手把你拉起来，笑了，那是他回成都以后第一次笑。", "You take seven or eight blows; the last one lands on your shoulder and puts you on the ground. Guan Yu reaches down with his right hand and hauls you up, and he laughs—the first time since he came back to Chengdu."),
            [rel("guanyu", "warmth", 2), rel("guanyu", "trust", 1)]),
     choice("rest", "strategy", T("说：将军的仗，不一定要用刀打。", "Say: the General's battles don't all have to be fought with a blade."),
            T("关羽看了你很久：『你是说，让我坐在后面看着？』他没再说话，可第二天，他找你要了一份荆州的地图。", "Guan Yu looks at you a long time. 'You mean I should sit at the back and watch?' He says no more, but the next day he asks you for a map of Jingzhou."),
            [rel("guanyu", "esteem", 1)])],
    when=ALL(GUAN, STAY), salience=4, order=2))

# ---------- c3 称帝 ----------
N.append(node("c3_emperor", "c3", "main", T("国贼是曹", "The Usurper Is Cao"), "literal", T("第80–81回", "Ch. 80–81"),
    [P(T("诸葛亮率百官劝进：『今大王名正言顺，有何可议？』汉中王登坛即位，改元章武。三天以后，新天子在殿上说：起兵伐吴。", "Zhuge Liang leads the officials in urging him to the throne: his title is right and his claim plain—what is there to debate? The King mounts the altar, takes the throne, and names the era Zhangwu. Three days later the new Son of Heaven announces in the hall: we march on Wu.")),
     P(T("赵云出班：『国贼乃曹操，非孙权也。今曹丕篡汉，神人共怒。陛下可早图关中……若舍魏以伐吴，兵势一交岂能骤解？』陛下说：『朕不为弟报仇，虽有万里江山，何足为贵？』", "Zhao Yun steps forward. The usurper is Cao, he says, not Sun Quan; Cao Pi has stolen the Han and gods and men alike are enraged; take the land within the passes first. Once you are locked in war with Wu, it won't come undone. His Majesty answers: if he does not avenge his brother, what is ten thousand li of empire worth?"), NOGUAN),
     P(T("赵云出班：国贼是曹丕，不是孙权。关将军就坐在殿上：『荆州是我丢的，我要亲手拿回来。』陛下说：『二弟的荆州，朕替你夺回来。』", "Zhao Yun steps forward: the usurper is Cao Pi, not Sun Quan. Guan Yu is sitting right there in the hall. 'I lost Jingzhou. I'll take it back with my own hands.' His Majesty says, 'Your Jingzhou, brother—I'll win it back for you.'"), GUAN),
     P(T("满殿的人，都在等你开口。", "The whole hall waits for you to speak."))],
    twin(NEARLY,
         choice("zhaoyun", "dilemma", T("站到赵云旁边：『子龙说得对。』", "Go and stand beside Zhao Yun. 'Zilong is right.'"),
                T("陛下看着你，看了很久。殿上没有一点声音。他张了张嘴，你以为他要说“罢了”——可他说的是：『朕意已决。』你走出殿门的时候，诸葛亮低声说：『差一点。』", "His Majesty looks at you for a long time. There isn't a sound in the hall. He opens his mouth, and you think he's going to say 'Enough'—but what he says is, 'Our mind is made up.' As you leave the hall, Zhuge Liang says quietly, 'So close.'"),
                [setv("flag.v5_zhaoyun"), setv("flag.v5_nearly"), rel("zhaoyun", "trust", 2), rel("zhuge", "esteem", 1), rel("liubei", "warmth", -1)], echo=["e_zy"]),
         choice("zhaoyun", "dilemma", T("站到赵云旁边：『子龙说得对。』", "Go and stand beside Zhao Yun. 'Zilong is right.'"),
                T("陛下的脸沉了下来：『你也这么说？』他没再看你。赵云出殿时，对你点了点头。", "His Majesty's face darkens. 'You too?' He doesn't look at you again. As Zhao Yun leaves the hall, he nods to you."),
                [setv("flag.v5_zhaoyun"), rel("zhaoyun", "trust", 2), rel("liubei", "warmth", -1), rel("liubei", "trust", -1)], echo=["e_zy"])) +
    [choice("limit", "strategy", T("说：要打，只打到荆州为止。拿回荆州，就和东吴讲和。", "Say: if we fight, fight only as far as Jingzhou. Take it back, then make peace with Wu."),
            T("陛下想了想：『先拿回荆州再说。』他没有答应讲和，可也没有说不。", "His Majesty thinks. 'Jingzhou first; we'll see after.' He doesn't agree to peace, but he doesn't refuse either."),
            [rel("liubei", "esteem", 1), rel("zhuge", "esteem", 1), add("renown.cunning")]),
     choice("follow", "expression", T("跪下请命：臣愿随陛下东征。", "Kneel and ask: let me march east with Your Majesty."),
            T("陛下扶起你：『好！』诸葛亮转过脸去。", "His Majesty raises you up. 'Good!' Zhuge Liang turns his face away."),
            [rel("liubei", "warmth", 2), rel("liubei", "trust", 1), rel("zhuge", "esteem", -1)])],
    quote=T("国贼乃曹操，非孙权也。……朕不为弟报仇，虽有万里江山，何足为贵？",
            "\"The usurper is Cao Cao, not Sun Quan.\" … \"If We do not avenge Our brother, then though We had ten thousand li of empire, what would it be worth?\""),
    callbacks=[cb("e_north", T("赵云看了你一眼：『先生当初也这么说过。』", "Zhao Yun glances at you. 'You said the same thing before, sir.'"), F("flag.v5_north"))],
    when=STAY, order=10))

N.append(node("c3_fei", "c3", "main", T("翼德", "Yide"), "functional", T("第81回", "Ch. 81"),
    [P(T("张飞从阆中赶来，一进殿就跪在陛下脚边，抱着陛下的腿哭。他起来以后，红着眼睛找到你：『先生，跟俺回阆中，帮俺备兵。』", "Zhang Fei rides in from Langzhong, and the moment he enters the hall he falls at His Majesty's feet and weeps, clutching his legs. When he gets up he finds you, red-eyed. 'Sir, come back to Langzhong with me and help me get the men ready.'"), NOGUAN),
     P(T("张飞从阆中赶来，一进殿就抱住了关羽，两个人都没说话。他起来以后找到你：『先生，跟俺回阆中，帮俺备兵。』", "Zhang Fei rides in from Langzhong and the moment he enters the hall he throws his arms around Guan Yu; neither of them says a word. Afterward he finds you. 'Sir, come back to Langzhong with me and help me get the men ready.'"), GUAN),
     P(T("你在信里答应过他：三将军去哪，子衡去哪。", "You promised him in your letter: wherever the Third General goes, Ziheng goes."), F("flag.v5_fei_vow"))],
    [choice("go", "dilemma", T("跟他回阆中。", "Go back to Langzhong with him."),
            T("张飞一巴掌拍在你背上：『好！』", "Zhang Fei slaps you on the back. 'Good!'"), [setv("flag.v5_langzhong"), add("renown.loyal")]),
     choice("warn", "strategy", T("去见陛下：请陛下当面嘱咐三将军，酒后别打帐下的人。", "Go to His Majesty: ask him to warn the Third General to his face not to beat his men when he's drunk."),
            T("陛下把张飞叫到跟前，说：朕素知你酒后暴怒，鞭打健儿，又让他们留在左右，这是取祸之道。张飞磕头说记下了。你看着他出了宫门，心里还是不踏实。", "His Majesty calls Zhang Fei before him: he has long known Yide turns violent in drink, flogs his men, and then keeps them close—that is the road to disaster. Zhang Fei knocks his head and says he'll remember. You watch him leave the palace and still don't feel easy."),
            [setv("flag.v5_fei_warned"), rel("liubei", "trust", 1)]),
     choice("stay", "expression", T("说你得留在成都备粮草。", "Say you must stay in Chengdu to see to the supplies."),
            T("张飞没多说，骑上马走了。", "Zhang Fei says no more; he mounts and rides away."), [rel("liubei", "esteem", 1)])],
    when=STAY, order=20))

N.append(talk_node("c3_zhaoyun", "c3", T("夜谈·赵云", "Night Talk: Zhao Yun"),
    T("赵云被派去江州督后军，明天就走。他在营里收拾行装，看见你进来，停了手：『先生坐。』", "Zhao Yun has been sent to Jiangzhou to command the rear, and leaves tomorrow. He's packing in his quarters; when you come in he stops. 'Sit, Master.'"),
    "zhaoyun", 2,
    [topic("why", T("问他：为什么只有你敢说？", "Ask him: why were you the only one who dared?"),
           T("赵云想了想：『长坂坡那天，我抱着阿斗冲出来。陛下把孩子往地上一扔，说为了这孺子，几损我一员大将。从那天起，我就知道，我说什么，他都不会杀我。』", "Zhao Yun thinks. 'The day at Changban, I fought my way out with A Dou in my arms. His Majesty threw the child down and said, for this brat I nearly lost a great general. From that day I've known that whatever I say, he won't kill me for it.'"),
           [rel("zhaoyun", "warmth", 1), rel("zhaoyun", "trust", 1)]),
     topic("rear", T("问他：后军，能接应得上吗？", "Ask him: can the rear reach the front in time?"),
           T("赵云摇头：『七百里。』他把一张地图推给你，指着江州到白帝那一段，『真有那一天，我只能守住这里。』", "Zhao Yun shakes his head. 'Seven hundred li.' He pushes a map across to you and points at the stretch from Jiangzhou to Baidi. 'If that day comes, this is all I can hold.'"),
           [rel("zhaoyun", "esteem", 1)]),
     topic("old", T("说：子龙也老了。", "Say: you've grown old too, Zilong."),
           T("赵云笑了：『先生也是。』", "Zhao Yun smiles. 'So have you, Master.'"), [rel("zhaoyun", "warmth", 2)])],
    T("你走的时候，赵云说：『先生在前面，替我看着陛下。』", "As you leave, Zhao Yun says, 'You'll be at the front, Master. Watch over His Majesty for me.'"), when=STAY, order=30))

# ---------- c4 阆中 ----------
N.append(node("c4_langzhong", "c4", "main", T("白旗白甲", "White Banners, White Armor"), "literal", T("第81回", "Ch. 81"),
    [P(T("张飞下令：限三日内制白旗白甲，三军挂孝伐吴。末将范疆、张达说，三天办不齐。张飞大怒，把两人绑在树上，各打了五十鞭。那天夜里，张飞又喝醉了，倒在帐里。", "Zhang Fei orders white banners and white armor made within three days, so the whole army can march on Wu in mourning. Two officers, Fan Jiang and Zhang Da, say it can't be done in three days. Zhang Fei flies into a rage, has them tied to a tree, and gives each fifty lashes. That night he is drunk again and passes out in his tent.")),
     P(T("你看见范疆和张达在营门口说话，声音压得很低。", "You see Fan Jiang and Zhang Da talking at the camp gate, their voices very low."))],
    [choice("save", "dilemma", T("去张飞帐里把他摇醒，再替那两人求三天宽限；然后你自己守在帐外。", "Go into Zhang Fei's tent and shake him awake, beg three more days' grace for the two men—then keep watch outside his tent yourself."),
            [P(T("张飞迷迷糊糊地骂了你一句，还是准了。半夜，帐外有脚步声。你站起来，喊了一声“谁”。两个人影扔下刀就跑，一直跑过了江，投了东吴。", "Half-asleep, Zhang Fei curses you, but grants it. In the middle of the night there are footsteps outside. You stand and call, 'Who's there?' Two shadows drop their knives and run, all the way across the river to Wu.")),
             P(T("天亮时张飞看见地上的两把刀，酒全醒了。他什么也没说，过了很久，抱了抱你。", "At dawn Zhang Fei sees the two knives on the ground and is suddenly stone sober. He says nothing for a long time; then he puts his arms around you."))],
            [setv("flag.fei_alive"), add("deviation", 3), add("renown.loyal", 2), rel("liubei", "warmth", 1)],
            req=FEI_SAVE, hint=T("需要张飞肯听你的：卷三在瓦口陪他喝过“酒”，或这一卷写信劝过他别打士卒", "Needs Zhang Fei to listen to you: you drank his 'wine' at Wakou in Volume III, or wrote this volume urging him to stop flogging his men")),
     choice("drink", "expression", T("进帐陪他喝一杯，劝他早点睡。", "Go in, drink a cup with him, and urge him to sleep."),
            T("你走的时候，他已经睡着了。半夜营里乱了起来：范疆、张达摸进了帐。飞大叫一声而亡。时年五十五岁。两人提着首级，连夜投了东吴。", "When you leave he's already asleep. In the middle of the night the camp erupts: Fan Jiang and Zhang Da have crept into the tent. Zhang Fei gives one great cry and dies, aged fifty-five. The two of them flee to Wu that same night with his head."),
            [setv("flag.v5_fei_night"), rel("liubei", "trust", 1)]),
     choice("ride", "strategy", T("连夜回成都，请陛下下旨，把范疆、张达调走。", "Ride for Chengdu that night and ask His Majesty for an order transferring Fan Jiang and Zhang Da."),
            T("你在半路上，遇到了从阆中来报丧的人。", "Halfway there, you meet the rider coming from Langzhong with news of the death."), [rel("liubei", "esteem", 1)], foresight=True)],
    quote=T("限三日内制白旗白甲，三军挂孝伐吴。……飞大叫一声而亡。时年五十五岁。",
            "\"White banners and white armor within three days; the whole army will march on Wu in mourning.\" … Fei gave one great cry and died. He was fifty-five."),
    callbacks=[cb("e_fei_letter", T("张飞看了你一眼，把酒碗放下了一半，又端了起来。", "Zhang Fei glances at you, puts the bowl halfway down, then picks it up again."), F("flag.v5_fei_letter")),
               cb("e_fei_vow", T("张飞拍着你的肩：『先生说话算话，跟俺来了！』", "Zhang Fei claps your shoulder. 'You kept your word, sir—you came!'"), F("flag.v5_fei_vow"))],
    when=ALL(LANG, STAY), order=10))
N[-1]["intro"].append(P(T("你想起瓦口那七天。他说过：先生陪俺演得好。", "You think of those seven days at Wakou. 'You played your part well, sir,' he said."), F("flag.wakou_go")))

N.append(node("c4_news", "c4", "main", T("阆中来人", "A Rider from Langzhong"), "literal", T("第81回", "Ch. 81"),
    [P(T("陛下正要动身，阆中来了人。陛下还没拆开奏表，先问：『噫！三弟休矣！』拆开一看，果然：范疆、张达刺杀了张飞，提着首级投了东吴。飞大叫一声而亡。时年五十五岁。陛下放声大哭，昏了过去。", "His Majesty is about to set out when a rider arrives from Langzhong. Before he even opens the memorial, His Majesty cries out that his third brother is gone. He opens it, and it is so: Fan Jiang and Zhang Da murdered Zhang Fei and fled to Wu with his head. Fei gave one great cry and died, aged fifty-five. His Majesty wails aloud and falls senseless.")),
     P(T("陛下嘱咐过他。他磕头说记下了。", "His Majesty warned him. He knocked his head and said he'd remember."), F("flag.v5_fei_warned")),
     P(T("关羽站在殿上，一动不动。过了很久，他转身出去了。", "Guan Yu stands in the hall without moving. After a long time he turns and walks out."), GUAN)],
    [choice("comfort", "dilemma", T("守着陛下，等他醒来。", "Stay by His Majesty until he wakes."),
            T("陛下醒来，抓着你的手：『子衡，桃园三个人，就剩……』他没说下去。", "When His Majesty wakes he grips your hand. 'Ziheng, of the three from the peach garden, only…' He doesn't finish."),
            [rel("liubei", "warmth", 2)]),
     choice("pause", "strategy", T("等陛下醒了，劝他：翼德刚走，军心不稳，东征缓一缓。", "When His Majesty wakes, urge him: Yide is barely gone, the army is shaken—delay the march."),
            T("陛下摇头：『再缓，朕就没有兄弟了。』", "His Majesty shakes his head. 'Delay any longer and We'll have no brothers left.'"), [rel("liubei", "esteem", 1), rel("zhuge", "esteem", 1)]),
     choice("vanguard", "expression", T("请命：臣去阆中，替三将军把兵带来。", "Ask for the charge: let me go to Langzhong and bring the Third General's men."),
            T("陛下准了。你在阆中看见张苞，十几岁的孩子，穿着白甲，眼睛和他父亲一样圆。", "His Majesty agrees. At Langzhong you see Zhang Bao in white armor, his eyes as round as his father's."),
            [rel("liubei", "trust", 1), add("renown.loyal")])],
    when=ALL(NF("flag.v5_langzhong"), STAY), order=10))

N.append(node("c4_wz", "c4", "side", T("要走了", "Leaving"), "free", T("原创人物", "original character"),
    T("你要随军东去了。温芷收拾好一个包袱放在你门口，人没进来。你出去的时候，她站在院子里：『我跟着军医营走。你别说不行。』", "You're marching east. Wen Zhi leaves a bundle at your door without coming in. When you step out she's standing in the yard. 'I'm going with the army physicians. Don't tell me no.'"),
    [choice("yes", "dilemma", T("说：好。", "Say: all right."),
            T("她点了点头，把包袱背在了自己身上。", "She nods and shoulders the bundle herself."), [rel("wenzhi", "intimacy", 2), rel("wenzhi", "trust", 1)]),
     choice("no", "strategy", T("说：留在成都。这一仗，不会好。", "Say: stay in Chengdu. This war won't go well."),
            T("她看了你很久：『那你答应我，活着回来，回来就……』她没说完，转身回屋了。", "She looks at you a long while. 'Then promise me you'll come back alive, and when you do…' She doesn't finish; she turns and goes back inside."),
            [rel("wenzhi", "esteem", 1), rel("wenzhi", "intimacy", 1)], foresight=True)],
    when=ALL(WZ, STAY), salience=4, order=1))

# ---------- c5 东征 ----------
N.append(node("c5_jin", "c5", "main", T("求和", "Wu Sues for Peace"), "functional", T("第82–83回", "Ch. 82–83"),
    [P(T("孙权派诸葛瑾来求和：送还孙夫人，绑还降将，交还荆州，两家永结盟好。陛下大怒，要斩来使，被众人拦下。诸葛瑾退下以后，陛下问你：『他的话，你怎么看？』", "Sun Quan sends Zhuge Jin to sue for peace: Lady Sun returned, the turncoat generals handed over in chains, Jingzhou given back, the two houses allied forever. His Majesty, enraged, wants the envoy beheaded and is held back. When Zhuge Jin has withdrawn, His Majesty asks you, 'What do you make of his words?'")),
     P(T("关羽在一旁说：『荆州，要拿回来，不要送回来。』", "Guan Yu, beside him, says, 'Jingzhou is to be taken back, not handed back.'"), GUAN)],
    [choice("peace", "dilemma", T("说：答应他。荆州回来了，仇人也送来了，这一仗，已经赢了。", "Say: accept. Jingzhou returned and the guilty men delivered—this war is already won."),
            [P(T("陛下盯着你。你看见他的手在抖。可他还是说：『吴狗的话，朕一个字也不信。』", "His Majesty stares at you. You see his hands trembling. But still he says, 'We believe not one word from the curs of Wu.'")),
             P(T("诸葛瑾走的时候，回头看了你一眼。他知道你是真心的。", "As Zhuge Jin leaves, he looks back at you. He knows you meant it."), F("flag.v5_nearly"))],
            [setv("flag.v5_peace"), rel("liubei", "warmth", -1), rel("zhuge", "esteem", 1), add("renown.loyal")], echo=["e_peace"]),
     choice("traitors", "strategy", T("说：只要糜芳、傅士仁、范疆、张达的人头。别的，打下来再谈。", "Say: ask only for the heads of Mi Fang, Fu Shiren, Fan Jiang and Zhang Da. The rest we discuss once we've won it."),
            T("陛下冷笑：『他们的头，朕自己去取。』", "His Majesty laughs coldly. 'Their heads We'll take Ourselves.'"), [rel("liubei", "esteem", 1), add("renown.cunning")]),
     choice("war", "expression", T("说：陛下的仇，不能这样就算了。", "Say: Your Majesty's grievance can't be settled like this."),
            T("陛下点头。诸葛瑾被赶了出去。", "His Majesty nods. Zhuge Jin is driven out."), [rel("liubei", "warmth", 1), rel("liubei", "trust", 1)])],
    callbacks=[cb("e_zy", T("陛下看了你一眼：『你在殿上站到子龙那边去了。今天，你又要站到东吴那边？』", "His Majesty glances at you. 'In the hall you went and stood with Zilong. Today will you stand with Wu?'"), F("flag.v5_zhaoyun"))],
    when=STAY, order=10))

N.append(node("c5_oldgeneral", "c5", "main", T("老将", "The Old General"), "literal", T("第83回", "Ch. 83"),
    [P(T("关兴、张苞连打了几个胜仗。陛下在帐里叹气：『昔日从朕诸将，皆老迈无用矣。』这话传到黄忠耳朵里。黄忠一言不发，带着几个亲兵，骑马出营去了。", "Guan Xing and Zhang Bao win battle after battle. In his tent His Majesty sighs that the generals who followed him in the old days are all old now and useless. Word reaches Huang Zhong. Without a word he takes a few of his guards, mounts, and rides out of camp."), NOGUAN),
     P(T("关羽、张飞、关兴、张苞连打了几个胜仗。陛下在帐里笑：『年轻的上来了。』这话传到黄忠耳朵里。黄忠一言不发，带着几个亲兵，骑马出营去了。", "Guan Yu, Zhang Fei, Guan Xing and Zhang Bao win battle after battle. In his tent His Majesty laughs: the young ones are coming up. Word reaches Huang Zhong. Without a word he takes a few of his guards, mounts, and rides out of camp."), ALL(GUAN, FEI)),
     P(T("关羽、关兴、张苞连打了几个胜仗。陛下在帐里笑：『年轻的上来了。』这话传到黄忠耳朵里。黄忠一言不发，带着几个亲兵，骑马出营去了。", "Guan Yu, Guan Xing and Zhang Bao win battle after battle. In his tent His Majesty laughs: the young ones are coming up. Word reaches Huang Zhong. Without a word he takes a few of his guards, mounts, and rides out of camp."), ALL(GUAN, NF("flag.fei_alive"))),
     P(T("张飞、关兴、张苞连打了几个胜仗。陛下在帐里笑：『年轻的上来了。』这话传到黄忠耳朵里。黄忠一言不发，带着几个亲兵，骑马出营去了。", "Zhang Fei, Guan Xing and Zhang Bao win battle after battle. In his tent His Majesty laughs: the young ones are coming up. Word reaches Huang Zhong. Without a word he takes a few of his guards, mounts, and rides out of camp."), ALL(NOGUAN, FEI))],
    [choice("ride", "dilemma", T("拍马追上去，跟他一起冲阵。", "Spur after him and charge with him."),
            T("他斩了史迹，又追潘璋，一直追进了伏兵里。一支箭射中了他的肩窝。你和关兴把他抢了回来。他躺在帐里，拉着陛下的手：『臣乃一武夫耳，幸遇陛下。臣今年七十有五，寿亦足矣。望陛下善保龙体，以图中原！』那天夜里，他走了。他最后看的人是你：『先生……又陪老夫冲了一回。』", "He cuts down Shi Ji, chases Pan Zhang, and rides straight into an ambush. An arrow takes him below the shoulder. You and Guan Xing drag him back. Lying in the tent, he holds His Majesty's hand: he was only a soldier, lucky to have found such a lord; he is seventy-five, enough years for any man; let His Majesty guard his health and win back the heartland. That night he dies. The last person he looks at is you. 'Sir… you charged with the old man one more time.'"),
            [setv("flag.v5_hz_ride"), rel("huangzhong", "warmth", 2), add("renown.loyal")], echo=["e_hz"]),
     choice("word", "strategy", T("去见陛下：请陛下收回那句话，派人把黄老将军追回来。", "Go to His Majesty: ask him to take back what he said and send someone after old General Huang."),
            T("陛下愣了一下，脸红了：『朕失言了。』派去的人追到时，黄忠已经中了箭。他躺在帐里，听陛下说了一句“朕失言”，笑了：『臣乃一武夫耳，幸遇陛下。臣今年七十有五，寿亦足矣。』那天夜里，他走了。走的时候，脸上还带着笑。", "His Majesty starts and flushes. 'We spoke wrongly.' By the time the riders reach Huang Zhong, he already has an arrow in him. Lying in the tent he hears His Majesty say 'We spoke wrongly,' and smiles: he was only a soldier, lucky to have such a lord; seventy-five is enough. That night he dies, still smiling."),
            [setv("flag.v5_hz_word"), rel("liubei", "esteem", 1), rel("huangzhong", "warmth", 1)]),
     choice("let", "expression", T("由他去。老将军的脾气，谁也拦不住。", "Let him go. No one has ever stopped the old general."),
            T("黄忠中箭回营，第二天夜里死了，七十五岁。陛下哭得很伤心。", "Huang Zhong comes back with an arrow in him and dies the next night, aged seventy-five. His Majesty weeps bitterly."), [])],
    quote=T("臣乃一武夫耳，幸遇陛下。臣今年七十有五，寿亦足矣。望陛下善保龙体，以图中原！",
            "I am only a soldier, and was fortunate to meet Your Majesty. I am seventy-five this year; it is long enough. I pray Your Majesty will guard your health, and win back the heartland!"),
    callbacks=[],
    when=STAY, order=20))
N[-1]["intro"].append(P(T("你想起定军山。他冲下山前回头喊：先生看好了。", "You remember Mount Dingjun, and how he looked back before the charge and shouted for you to watch."), ANY(F("flag.dj_charge"), F("flag.hz_goaded"))))

N.append(node("c5_mifang", "c5", "side", T("糜芳", "Mi Fang"), "free", T("第83回", "Ch. 83"),
    T("糜芳、傅士仁杀了东吴的马忠，提着人头来投降。陛下不看他们：『推出去，祭云长。』糜芳被押出去的时候，在人群里找到了你。", "Mi Fang and Fu Shiren have killed Ma Zhong of Wu and come with his head to surrender. His Majesty won't look at them. 'Take them out. Let them be offered to Yunchang.' As Mi Fang is led out, he finds you in the crowd."),
    [choice("see", "dilemma", T("跟出去，陪他走最后一段。", "Follow him out and walk the last stretch with him."),
            T("糜芳说：『那封信，我看了很多遍。』他没再说别的。", "Mi Fang says, 'That letter—I read it many times.' He says nothing else."), [add("renown.loyal")]),
     choice("plead", "strategy", T("求陛下：他开城前，给臣送过一句话。", "Plead with His Majesty: before he opened the gates, he sent me a word of warning."),
            T("陛下沉默了很久：『一句话，抵不了荆州。』", "His Majesty is silent a long time. 'One word doesn't pay for Jingzhou.'"), [rel("liubei", "esteem", 1)])],
    when=ALL(ANY(F("flag.v4_mf_path"), F("flag.mf_kind"), F("flag.mf_mended")), NOGUAN, STAY), salience=3, order=1))
N.append(node("c5_guan", "c5", "side", T("前锋", "The Vanguard"), "free", T("原创", "original"),
    T("关羽亲自带着前锋，打回了荆州的边上。站在秭归城头，他指着东边对你说：『过了那座山，就是江陵。』他的左手还缠在缰绳上。", "Guan Yu leads the vanguard himself, back to the edge of Jingzhou. From the walls of Zigui he points east and tells you, 'Beyond that mountain is Jiangling.' His left hand is still bound to the reins."),
    [choice("slow", "strategy", T("说：将军，前锋走得太快，后面跟不上。", "Say: General, the vanguard is moving too fast; the rest can't keep up."),
            T("关羽皱眉，还是让前锋停了两天。你知道陛下会不高兴。可后面的营寨，总算连上了。", "Guan Yu frowns, but halts the vanguard for two days. You know His Majesty won't like it. But the camps behind finally close up."),
            [rel("guanyu", "esteem", 1), rel("guanyu", "trust", 1)]),
     choice("with", "dilemma", T("说：将军去哪，我去哪。", "Say: wherever you go, General, I go."),
            T("关羽看了你一眼：『麦城那回，你也是这么说的。』", "Guan Yu glances at you. 'You said that at Maicheng too.'"), [rel("guanyu", "warmth", 2)])],
    when=ALL(GUAN, STAY), salience=4, order=2))

# ---------- c6 连营 ----------
N.append(node("c6_camps", "c6", "main", T("连营七百里", "Seven Hundred Li of Camps"), "literal", T("第84回", "Ch. 84"),
    [P(T("营寨从猇亭一直排到川口，接连七百里，前后四十营，白天旌旗遮天，夜里火光照地。马良说，该画一张图送去成都，请丞相看看。陛下说：『朕亦颇知兵法，何必又问丞相？』", "The camps run from Xiaoting all the way to the river mouth, seven hundred li without a break, forty stockades in all; by day the banners hide the sun, by night the fires light the ground. Ma Liang says a map should be drawn and sent to Chengdu for the Chancellor to see. His Majesty says he knows something of war himself—why ask the Chancellor?")),
     P(T("营一座座搬进了树林，挨着溪水。天太热，兵士们都说好。", "One by one the camps move into the woods, beside the streams. It's very hot; the men are glad of it."))],
    [choice("break", "dilemma", T("去见陛下：营可以进林子，可每两座营之间，砍出一片空地。", "Go to His Majesty: let the camps go into the woods, but clear a strip of open ground between every two of them."),
            T("陛下不太耐烦，还是准了一半。兵士们骂骂咧咧地砍了半个月的树。", "His Majesty is impatient, but agrees to half of it. The men curse their way through half a month of tree-felling."),
            [setv("flag.v5_firebreak"), KEY(rel("liubei", "trust", 1)), add("deviation")], echo=["e_firebreak"],
            req=ANY(AT("liubei", "trust", 3), F("flag.v5_hz_word")),
            hint=T("需要陛下肯听你的：刘备的信任在「倚重」以上，或你劝他收回过那句“老将无用”", "Needs His Majesty to listen: Liu Bei's trust at Relied on or above, or you got him to take back 'the old generals are useless'")),
     choice("map", "strategy", T("自请和马良一起，把营图送到成都。", "Ask to take the map to Chengdu with Ma Liang."),
            T("丞相看了图，拍案叫苦：『包原隰险阻而结营，此兵家之大忌。倘彼用火攻，何以解救？又岂有连营七百里而可拒敌乎？祸不远矣！』他让你们连夜赶回去，又让赵云从江州往白帝靠。", "The Chancellor looks at the map and strikes the table in dismay: to camp on low, broken, wooded ground is the first thing every manual forbids; if they use fire, what then? Who ever held off an enemy with seven hundred li of camps? Disaster is close. He sends you back that same night, and orders Zhao Yun to move from Jiangzhou toward Baidi."),
            [setv("flag.v5_map"), rel("zhuge", "esteem", 1), rel("zhuge", "trust", 1)], echo=["e_map"]),
     choice("fast", "expression", T("劝陛下：拖不得，逼陆逊出来决战。", "Urge His Majesty: we can't wait—force Lu Xun out to fight."),
            T("陛下派人到吴营前骂了好几天。陆逊不出来。", "His Majesty sends men to curse before the Wu camp for days on end. Lu Xun doesn't come out."), [rel("liubei", "warmth", 1)])],
    quote=T("先主自猇亭布列军马，直至川口，接连七百里，前后四十营寨，昼则旌旗蔽日，夜则火光耀天。",
            "From Xiaoting the First Lord ranged his army all the way to the river mouth, seven hundred li without a break, forty stockades in all; by day the banners shut out the sun, by night the fires lit up the sky."),
    callbacks=[cb("e_hz", T("营图上有一处空着。那是黄忠的营。", "One place on the map is empty. It was Huang Zhong's camp."), None),
               cb("e_peace", T("陛下看着营图，忽然问你：『诸葛瑾那天的话……』他没问完。", "His Majesty looks at the camp map and suddenly asks, 'What Zhuge Jin said that day…' He doesn't finish."), F("flag.v5_peace"))],
    when=STAY, order=10))

N.append(talk_node("c6_liubei", "c6", T("夜谈·刘备", "Night Talk: Liu Bei"),
    T("夜里太热，陛下睡不着，叫你到帐外的溪水边坐。他脱了靴子，把脚泡在水里：『子衡，坐。今晚不说军务。』", "The night is too hot for sleep. His Majesty calls you to sit by the stream outside his tent. He takes off his boots and puts his feet in the water. 'Sit, Ziheng. No affairs of war tonight.'"),
    "liubei", 2,
    [topic("peach", T("问他：桃园那年，是什么样子？", "Ask him: what was it like, the year of the peach garden?"),
           [P(T("陛下笑了：『翼德杀了一口猪，云长不肯吃，说要斋戒。翼德说他装模作样……』他笑着笑着，不笑了。", "His Majesty laughs. 'Yide slaughtered a pig and Yunchang wouldn't eat it—said he was fasting. Yide said he was putting on airs…' He laughs and laughs, and then stops."), NOGUAN),
            P(T("陛下笑了：『那年三个人，加起来没有一百岁。如今……』他回头看了看关羽的营帐，灯还亮着。", "His Majesty laughs. 'That year the three of us together weren't a hundred years old. Now…' He looks back at Guan Yu's tent. The lamp is still lit."), GUAN)],
           [rel("liubei", "warmth", 2)]),
     topic("why", T("问他：一定要打这一仗吗？", "Ask him: must this war be fought?"),
           T("陛下看着溪水：『朕知道丞相不愿意，子龙不愿意，你也不愿意。』他停了很久，『可朕要是不来，朕这辈子，就只剩一个皇帝了。』", "His Majesty looks into the water. 'We know the Chancellor doesn't want this, nor Zilong, nor you.' A long pause. 'But if We hadn't come, all that would be left of Our life is an emperor.'"),
           [rel("liubei", "trust", 1)]),
     topic("adou", T("说起太子。", "Speak of the Crown Prince."),
           T("陛下叹气：『阿斗……心不坏。』他转过头看你，『将来，你们多担待他。』", "His Majesty sighs. 'A Dou… his heart isn't bad.' He turns to look at you. 'Later on, all of you—bear with him.'"),
           [rel("liubei", "trust", 1), rel("liubei", "warmth", 1)])],
    T("回帐的时候，陛下说：『子衡，你跟了朕多少年了？』你说二十多年。他说：『够久了。』", "Going back to the tent, His Majesty asks, 'How many years have you followed Us, Ziheng?' Twenty-some, you say. 'Long enough,' he says."), when=STAY, order=20))

N.append(node("c6_xing", "c6", "side", T("青龙刀", "The Green Dragon Blade"), "free", T("第83回", "Ch. 83"),
    T("关兴找到你，手里捧着一把刀：他在猇亭杀了潘璋，从潘璋手里夺回了父亲的青龙偃月刀。他说：『先生，您认得这把刀。』", "Guan Xing finds you with a blade in his hands: at Xiaoting he killed Pan Zhang and took back his father's Green Dragon glaive. 'Sir,' he says, 'you know this blade.'"),
    [choice("touch", "dilemma", T("伸手摸了摸刀柄。", "Reach out and touch the hilt."),
            T("刀柄上的缠绳，还是你在樊城见过的那一副。关兴跪下来哭了。", "The binding on the hilt is the same you saw at Fancheng. Guan Xing kneels and weeps."), [add("renown.loyal")]),
     choice("advise", "strategy", T("说：刀是你的了。别学你父亲看不起人。", "Say: the blade is yours now. Don't learn your father's way of looking down on people."),
            T("关兴愣了一下，点了点头：『先生是唯一一个敢这么说的人。』", "Guan Xing starts, then nods. 'You're the only one who'd dare say that, sir.'"), [add("renown.rash")])],
    quote=T("兴得了父亲的青龙偃月刀，却将潘璋首级，擐于马项之下……", "Xing had won back his father's Green Dragon glaive, and hung Pan Zhang's head from his horse's neck…"),
    when=ALL(NOGUAN, STAY), salience=3, order=1))

# ---------- c7 火烧连营 ----------
N.append(node("c7_burn", "c7", "main", T("火烧连营", "The Burning Camps"), "literal", T("第84回", "Ch. 84"),
    [P(T("陆逊的兵每人手执茅草一把，内藏硫黄焰硝，各带火种，一齐而上。东南风一吹，火从第一座营烧起，顺着林子往西，一座接着一座。", "Lu Xun's men each carry a bundle of thatch packed with sulfur and saltpeter, and fire with them, and come on all together. The southeast wind does the rest: the fire takes the first camp and runs west through the trees, camp after camp.")),
     P(T("营与营之间砍出来的空地，把火拦住了好几处。", "The cleared ground between the camps stops the fire in several places."), F("flag.v5_firebreak")),
     P(T("你和马良赶回来的时候，火已经起了。丞相的话，晚了一天。", "When you and Ma Liang get back, the fire has already started. The Chancellor's warning is a day too late."), F("flag.v5_map"))],
    [choice("guard", "dilemma", T("护着陛下往西走。", "Get His Majesty out to the west."),
            [P(T("一路上全是火和喊声。到了马鞍山，追兵围上来，你把自己的马让给了陛下。天快亮时，前面来了一支兵——是赵云。云曰：『敌军在后，不可久迟。陛下且入白帝城歇息，臣再引兵去救应诸将。』", "The whole road is fire and screaming. At Saddle Hill the pursuit closes in, and you give His Majesty your own horse. Near dawn a column appears ahead—Zhao Yun. The enemy is close behind, he says; His Majesty must not linger—let him rest in Baidi, and Zhao Yun will go back for the others.")),
             P(T("赵云是丞相早几天调过来的，比原来近了一百里。", "Zhao Yun was moved up days ago on the Chancellor's orders—a hundred li closer than he would have been."), F("flag.v5_map"))],
            [setv("flag.v5_guard"), KEY(rel("liubei", "trust", 1)), rel("liubei", "warmth", 2), rel("zhaoyun", "trust", 1)], echo=["e_guard"]),
     choice("rear", "dilemma", T("回头去后营，能救一个是一个。", "Turn back for the rear camps; save whoever you can."),
            [P(T("你带着几十个人冲回火里，把一营没来得及跑的兵带了出来。马良没能出来。你在火边站了很久。", "You lead a few dozen men back into the fire and bring out one camp's worth of soldiers who never got away. Ma Liang doesn't come out. You stand by the flames a long time.")),
             P(T("有空地拦着，后面好几座营的人都撤出来了。", "With the cleared ground holding the fire, the men from several of the rear camps get out."), F("flag.v5_firebreak"))],
            [setv("flag.v5_rear"), add("renown.loyal", 2), rel("zhaoyun", "esteem", 1)]),
     choice("stones", "strategy", T("往鱼腹浦那边引追兵：丞相入川那年，在那里摆过一片石头。", "Draw the pursuit toward Yufu Shore: the year the Chancellor came west, he laid out a field of stones there."),
            T("你带着追兵绕进了江边那片乱石。起了一阵怪风，石头好像在动。追兵乱了，陆逊大惊：『吾中诸葛之计也！』他没敢再追。你从石阵另一头出来，一路走到了白帝城。", "You lead the pursuit round into the jumble of stones by the river. A strange wind rises and the stones seem to move. The pursuers fall into confusion; Lu Xun cries that he has walked into Zhuge Liang's trap. He dares not follow. You come out the other side and walk all the way to Baidi."),
            [add("uncanny", 2), rel("zhuge", "esteem", 1)], foresight=True)],
    quote=T("每人手执茅草一把，内藏硫黄焰硝，各带火种，各执枪刀，一齐而上。",
            "Each man carried a bundle of thatch packed with sulfur and saltpeter, and fire, and spear or blade, and they went up all together."),
    callbacks=[cb("e_firebreak", T("你看着火在那片空地前停了下来，想起砍树那半个月兵士们的骂声。", "You watch the fire stop at the edge of the cleared ground and remember the men cursing through those weeks of tree-felling."), F("flag.v5_firebreak")),
               cb("e_map", T("你想起丞相看图时拍的那一下桌子。", "You remember how the Chancellor struck the table when he saw the map."), F("flag.v5_map"))],
    when=STAY, order=10))

N.append(node("c7_guan", "c7", "main", T("断后", "The Rear Guard"), "free", T("原创", "original"),
    T("关羽勒住马，对你说：『你护着大哥走。陆逊，我来挡。』他身边只剩几百人，左手还缠在缰绳上。", "Guan Yu reins in and says to you, 'Get my brother out. I'll hold Lu Xun.' He has only a few hundred men left, his left hand still bound to the reins."),
    [choice("escort", "dilemma", T("抓住他的缰绳：『大哥要的是你，不是这一仗。一起走。』", "Seize his reins. 'Your brother wants you, not this battle. We go together.'"),
            T("关羽看着你，像在麦城那天一样。他调转马头，跟上了陛下。后来有人说，关云长一生只退过两次，两次都是被同一个人拉走的。", "Guan Yu looks at you as he did that day at Maicheng. He turns his horse and follows His Majesty. Later people say Guan Yunchang retreated only twice in his life, and both times the same man pulled him away."),
            [rel("guanyu", "warmth", 2), add("deviation", 2)],
            req=ANY(AT("guanyu", "trust", 3), AT("guanyu", "warmth", 3)),
            hint=T("需要关羽肯听你的：信任在「倚重」或交情在「交好」以上", "Needs Guan Yu to listen: trust at Relied on or friendship at Friends or above")),
     choice("stay", "dilemma", T("留下来，陪他断后。", "Stay and hold the rear with him."),
            T("你们守了大半夜。天亮前，关羽让人把你架上马：『回去告诉大哥，云长这回没有退。』你回头的时候，看见他一个人站在火光里。", "You hold through most of the night. Before dawn Guan Yu has men lift you onto a horse. 'Go back and tell my brother: this time Yunchang did not retreat.' When you look back, you see him standing alone in the firelight."),
            [setv("flag.v5_guan_last"), setv("flag.guan_alive", False), rel("guanyu", "warmth", 2), add("renown.loyal", 2)]),
     choice("go", "expression", T("听他的，护着陛下走。", "Do as he says. Get His Majesty out."),
            T("你们走出很远，身后的喊杀声还没停。第二天，关兴找到了他父亲。", "You are far away and still the shouting behind you hasn't stopped. The next day Guan Xing finds his father."),
            [setv("flag.guan_alive", False), rel("liubei", "trust", 1)])],
    when=ALL(GUAN, STAY), order=20))

# ---------- c8 托孤 ----------
N.append(node("c8_tuogu", "c8", "main", T("白帝托孤", "The Charge at Baidi"), "literal", T("第85回", "Ch. 85"),
    [P(T("丞相从成都赶来。陛下让他坐在床边，拉着他的手：『君才十倍曹丕，必能安邦定国，终定大事。若嗣子可辅，则辅之；如其不才，君可自为成都之主。』丞相跪在地上，哭着叩头：『臣安敢不竭股肱之力，效忠贞之节，继之以死乎！』", "The Chancellor hurries from Chengdu. His Majesty has him sit by the bed and takes his hand: his talent is ten times Cao Pi's; he will surely bring peace to the land and finish the great work. If the heir can be helped, help him; if he is unfit, let the Chancellor himself be master of Chengdu. The Chancellor kneels and, weeping, knocks his head on the floor: how could he not give his every strength and loyalty, unto death?")),
     P(T("陛下的眼睛，在找你。", "His Majesty's eyes are looking for you."))],
    twin(TRUST4,
         choice("charge", "dilemma", T("跪到床前。", "Kneel at the bedside."),
                T("陛下把你的手和丞相的手放在一起：『子衡跟了朕二十多年，从许都的青梅，到白帝城。太子，交给你们。』你什么也说不出来，只是叩头。", "His Majesty lays your hand together with the Chancellor's. 'Ziheng has followed Us more than twenty years, from the green plums of Xuchang to Baidi. The Crown Prince is in your hands.' You can't say a word. You only bow your head to the floor."),
                [setv("flag.v5_entrusted"), rel("zhuge", "trust", 2), rel("zhuge", "warmth", 1)]),
         choice("charge", "dilemma", T("跪到床前。", "Kneel at the bedside."),
                T("陛下拍了拍你的手：『子衡，你也辛苦了。』他转过头，又对丞相说了很久的话。", "His Majesty pats your hand. 'You've worked hard too, Ziheng.' He turns back and talks with the Chancellor a long time."),
                [rel("liubei", "warmth", 1)])) +
    [choice("east", "strategy", T("说：陛下，东征的事，臣没能劝住。", "Say: Your Majesty, I couldn't talk you out of the war in the east."),
            [P(T("陛下笑了笑：『你劝过。是朕不听。』", "His Majesty smiles a little. 'You tried. It was We who wouldn't listen.'"), ANY(F("flag.v5_zhaoyun"), F("flag.v5_peace"))),
             P(T("陛下摇摇头：『你没劝过。可朕也不会听。』", "His Majesty shakes his head. 'You never tried. But We wouldn't have listened.'"), ALL(NF("flag.v5_zhaoyun"), NF("flag.v5_peace")))],
            [rel("liubei", "trust", 1)])],
    quote=T("君才十倍曹丕，必能安邦定国，终定大事。若嗣子可辅，则辅之；如其不才，君可自为成都之主。……勿以恶小而为之，勿以善小而不为。",
            "Your talent is ten times Cao Pi's; you will surely bring peace to the land and finish the great work. If the heir can be helped, help him; if he is unfit, you may be master of Chengdu yourself. … Do no evil because it is small; leave no good undone because it is small."),
    callbacks=[cb("e_guard", T("陛下说：『那夜你把马让给了朕。朕记着。』", "His Majesty says, 'That night you gave Us your horse. We remember.'"), F("flag.v5_guard")),
               cb("e_liufeng", T("陛下说：『刘封的事，朕后悔过。那天殿上，只有你开了口。』", "His Majesty says, 'We regretted Liu Feng. That day in the hall, you were the only one who spoke.'"), None),
               cb("e_north", T("陛下说：『曹操死的那年，你劝朕北伐。朕要是听了……』", "His Majesty says, 'The year Cao Cao died, you urged Us north. If We had listened…'"), F("flag.v5_north"))],
    when=STAY, order=10))
N[-1]["intro"].append(P(T("关羽坐在床的另一边，一直握着大哥的手。", "Guan Yu sits on the other side of the bed, holding his brother's hand the whole time."), GUAN))
N[-1]["intro"].append(P(T("张飞跪在床前，哭得像个孩子。", "Zhang Fei kneels by the bed, weeping like a child."), FEI))

N.append(node("c8_masu", "c8", "side", T("马谡", "Ma Su"), "free", T("第85回", "Ch. 85"),
    T("丞相出去以后，陛下把你叫到床边，声音很低：『马谡这个人，你看如何？』没等你回答，他自己说了：『朕观此人，言过其实，不可大用。丞相宜深察之。你替朕记着。』", "When the Chancellor has stepped out, His Majesty calls you to the bed and speaks very low. 'What do you make of Ma Su?' Before you can answer, he answers himself: in his judgment, the man's words outrun his worth; he must not be given great charge; the Chancellor should look closely. 'Remember that for Us.'"),
    [choice("keep", "dilemma", T("说：臣记下了。", "Say: I'll remember."),
            T("陛下点点头，闭上了眼睛。", "His Majesty nods and closes his eyes."), [setv("flag.v5_masu"), rel("liubei", "trust", 1)]),
     choice("defend", "strategy", T("替马谡说一句：他读的兵书，比谁都多。", "Put in a word for Ma Su: he's read more books on war than anyone."),
            T("陛下摇头：『读得多，所以说得多。』", "His Majesty shakes his head. 'He's read a lot, so he says a lot.'"), [rel("liubei", "esteem", -1)])],
    quote=T("朕观此人，言过其实，不可大用。", "In Our judgment the man's words outrun his worth; he must not be given great charge."),
    when=STAY, salience=3, order=1))

N.append(node("c8_wz", "c8", "side", T("回去以后", "When We Get Back"), "free", T("原创人物", "original character"),
    T("温芷在永安宫的偏殿煎药，守了好些天。你过去的时候，她把扇子放下：『等这些事过去……』她看着你，没往下说。", "Wen Zhi has been brewing medicine in a side hall of the Palace of Enduring Peace for days. When you go to her, she sets down her fan. 'When all this is over…' She looks at you and doesn't go on."),
    [choice("wed", "dilemma", T("替她说完：『我们成亲。』", "Finish it for her: 'We'll marry.'"),
            T("她低下头，过了很久，嗯了一声。药罐里的水开了，她也没去管。", "She lowers her head, and after a long while murmurs yes. The water in the medicine pot boils over and she leaves it."),
            [setv("flag.wz_wed"), rel("wenzhi", "intimacy", 2)]),
     choice("wait", "expression", T("说：等回了成都再说。", "Say: let's talk when we're back in Chengdu."),
            T("她笑了笑，又拿起了扇子。", "She smiles a little and picks up the fan again."), [rel("wenzhi", "warmth", 1)])],
    when=ALL(WZ, AT("wenzhi", "intimacy", 3), STAY), salience=5, order=2))
N[-1]["intro"].append(P(T("她身上还带着那几页华佗的医书。", "She still carries those few pages of Hua Tuo's book."), F("flag.wz_qingnang")))

# ---------- crises ----------
def crisis(id, title, intro, choices, when, order):
    return node(id, "*", "interrupt", title, "free", T("原创危机", "original crisis"), intro, choices, when=when, order=order)
N.append(crisis("x_cold5", T("冷落", "Sidelined"),
    T("陛下已经很久没有问过你了。丞相私下对你说：『子衡兄，陛下心里有个结。』", "His Majesty hasn't asked your opinion in a long time. The Chancellor tells you privately, 'Ziheng, His Majesty has a knot in his heart.'"),
    [choice("mend", "strategy", T("去见陛下，把话说开。", "Go to His Majesty and talk it through."),
            T("你们谈了一夜。天亮时，陛下说：『是朕多心了。』", "You talk all night. At dawn His Majesty says, 'We've been too suspicious.'"), [rel("liubei", "trust", 2), add("renown.loyal")],
            req=ANY(AT("zhuge", "esteem", 2), AT("zhaoyun", "trust", 2)), hint=T("需要诸葛亮的看重在「器重」以上，或赵云的信任在「可托」以上，才有人替你说一句话", "Needs Zhuge Liang's esteem at Valued or above, or Zhao Yun's trust at Reliable or above, for someone to put in a word for you")),
     choice("wait", "expression", T("等。做好手上的事。", "Wait. Do the work in front of you."), T("议事时，你的位子挪到了后排。", "At council your seat has moved to the back row."), [rel("liubei", "trust", 1), setv("flag.sidelined")]),
     choice("go", "dilemma", T("告辞。", "Take your leave."), T("陛下没有留你。", "His Majesty doesn't ask you to stay."), [setv("flag.v5_left")])],
    ALL(UPTO("liubei", "trust", 0), STAY), 3))
N[-1]["choices"][2]["ends"] = True
N.append(crisis("x_uncanny5", T("妖人", "Sorcerer"),
    T("你说中的事情太多了。东吴、魏国都有人在传：蜀中有个能知未来的人。丞相来找你：『子衡兄，亮不问你从哪里知道的。』", "You've been right too often. In Wu and in Wei people say there's a man in Shu who knows the future. The Chancellor comes to you. 'I won't ask how you know, Ziheng.'"),
    [choice("hide", "strategy", T("从此闭口：只说眼前的事。", "Hold your tongue from now on."), T("人们慢慢忘了。", "People slowly forget."), [add("uncanny", -2), rel("zhuge", "trust", 1)]),
     choice("leave", "dilemma", T("离开，免得连累陛下。", "Leave, so His Majesty isn't tainted by you."), T("你在一个雨夜出了城。", "You leave the city one rainy night."), [setv("flag.v5_exposed")])],
    ALL(V("uncanny", ">=", 7), STAY), 2))
N[-1]["choices"][1]["ends"] = True
N.append(crisis("x_loose5", T("失言", "A Slip of the Tongue"),
    T("你说过的那些话，有人抄了下来，送到了陛下案头。", "Someone has copied down things you've said and put them on His Majesty's desk."),
    [choice("own", "strategy", T("认：话说过了头。", "Own it: you spoke out of turn."), T("陛下没有罚你：『先生是聪明人，聪明人最该管住嘴。』", "His Majesty doesn't punish you. 'You're a clever man. Clever men should mind their tongues most of all.'"), [add("renown.rash", -3), rel("liubei", "trust", -1)]),
     choice("argue", "dilemma", T("辩：句句是真话。", "Argue: every word was true."), T("『有些真话，要挑时候说。』", "'Some truths need the right moment.'"), [add("renown.rash", -1), rel("liubei", "trust", -1), rel("zhuge", "esteem", 1)])],
    ALL(V("renown.rash", ">=", 6), STAY), 4))
# ------------------------------------------------------------------ open questions
ASKS = {
  "c3_emperor": {"who": "zhaoyun", "fallback": "dodge",
    "q": T("散了朝，赵云在殿外拦住你：『先生，你说实话——陛下这一去，能赢吗？』", "After court, Zhao Yun stops you outside the hall. 'Master, tell me the truth—can His Majesty win this?'"),
    "answers": [
      ans("no", T("说赢不了", "says no"), T("赵云点点头，像是早就知道：『那我守好后路。』", "Zhao Yun nods as if he'd known all along. 'Then I'll hold the road back.'"), [rel("zhaoyun", "trust", 1), add("uncanny")], match=r"赢不了|不能|输|败|火|陆逊|危险|no|can't|lose|defeat|fire|danger", mood="sad"),
      ans("jing", T("说能拿回荆州，再往前就难", "says Jingzhou yes, beyond it no"), T("赵云想了想：『那就只盼陛下拿回荆州就停。』", "Zhao Yun thinks. 'Then let's hope he stops at Jingzhou.'"), [rel("zhaoyun", "esteem", 1)], match=r"荆州|一半|拿回|停|jingzhou|halfway|stop|only", mood="neutral"),
      ans("yes", T("说能赢", "says yes"), T("赵云没接话，拱了拱手走了。", "Zhao Yun doesn't answer; he bows and leaves."), [rel("zhaoyun", "esteem", -1)], match=r"能赢|能|必胜|一定|yes|we can|will win|sure", mood="cold"),
      ans("rude", T("说他不该顶撞陛下", "says he shouldn't have defied His Majesty"), T("赵云看了你一眼：『先生也这么想？』", "Zhao Yun looks at you. 'You think so too, Master?'"), [rel("zhaoyun", "trust", -1), add("renown.rash")], match=r"顶撞|多嘴|不该说|放肆|defied|shouldn't have|out of line", mood="cold"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("赵云叹了口气，没有再问。", "Zhao Yun sighs and doesn't ask again."), [], match=r"不知|不好说|看天意|can't say|don't know", mood="neutral"),
    ]},
  "c5_oldgeneral": {"who": "huangzhong", "fallback": "dodge",
    "q": T("出营之前，黄忠在马上回头问你：『先生，你说，老夫是不是真老了？』", "Before he rides out, Huang Zhong turns in the saddle. 'Sir, tell me—am I really old?'"),
    "answers": [
      ans("no", T("说不老", "says no"), T("黄忠哈哈大笑：『先生懂我！』", "Huang Zhong roars with laughter. 'You understand me, sir!'"), [rel("huangzhong", "warmth", 1)], match=r"不老|没老|老当益壮|宝刀|not old|still strong|never", mood="warm"),
      ans("yes", T("说老了，该歇歇了", "says yes—time to rest"), T("黄忠的笑僵在脸上，一抖缰绳，走了。", "The laugh freezes on Huang Zhong's face. He shakes the reins and goes."), [rel("huangzhong", "warmth", -1), add("renown.rash")], match=r"老了|歇|养老|回去|old|rest|retire|go home", mood="cold"),
      ans("both", T("说老了，可还是当年那个黄汉升", "says old, but still the same Huang Hansheng"), T("黄忠愣了一下，眼眶红了：『这话，比陛下说得好。』", "Huang Zhong starts, and his eyes redden. 'That's better said than His Majesty's.'"), [rel("huangzhong", "warmth", 2), rel("huangzhong", "esteem", 1)], match=r"还是|当年|一样|老了.*(也|但|可)|still|same|as ever|but", mood="warm"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("黄忠没等你说完，已经走远了。", "Huang Zhong is gone before you finish."), [], match=r"不知|不好说|can't say|don't know", mood="neutral"),
    ]},
  "c8_tuogu": {"who": "liubei", "fallback": "dodge",
    "q": T("丞相出去以后，陛下望着帐顶，问你：『子衡，你说，朕这一生，值不值？』", "When the Chancellor has stepped out, His Majesty stares at the canopy and asks you, 'Ziheng, tell me—was it worth it, this life of Ours?'"),
    "answers": [
      ans("yes", T("说值", "says yes"), T("陛下笑了，笑得很轻：『有你这句话……』", "His Majesty smiles, very faintly. 'If you say so…'"), [rel("liubei", "warmth", 1)], match=r"值|不枉|对得起|无悔|worth|yes|no regret", mood="warm"),
      ans("brothers", T("说值在兄弟，不在天下", "says the brothers were worth it, not the realm"), T("陛下的眼泪流了下来：『是。是。』", "Tears run down His Majesty's face. 'Yes. Yes.'"), [rel("liubei", "warmth", 2), rel("liubei", "trust", 1)], match=r"兄弟|桃园|关羽|张飞|云长|翼德|brother|peach|guan|zhang", mood="sad"),
      ans("east", T("说不该东征", "says he shouldn't have marched east"), T("陛下闭上眼：『朕知道。』", "His Majesty closes his eyes. 'We know.'"), [rel("liubei", "esteem", 1), rel("liubei", "warmth", -1)], match=r"东征|不该|伐吴|夷陵|火|shouldn't|the war|wu|yiling", mood="sad"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("陛下没有再问。", "His Majesty doesn't ask again."), [], match=r"不知|不好说|can't say|don't know", mood="neutral"),
    ]},
}
ASK_ORDER = {"c3_emperor": ["rude", "no", "jing", "yes", "dodge"], "c5_oldgeneral": ["yes", "both", "no", "dodge"], "c8_tuogu": ["brothers", "east", "yes", "dodge"]}
CROSS = set()

V5_TAGS = {
    ("x_return5", "back"): ["yi"],
    ("c1_caodeath", "north"): ["zhi"], ("c1_caodeath", "east"): ["yi"],
    ("c1_wz_huatuo", "copy"): ["ren", "zhi"], ("c1_wz_clinic", "help"): ["ren"], ("c1_wz_clinic", "men"): ["zhi"],
    ("c2_liufeng", "plead"): ["ren", "cheng"], ("c2_liufeng", "plead_2"): ["ren", "cheng"], ("c2_liufeng", "mengda"): ["zhi"],
    ("c2_fei_letter", "advise"): ["cheng", "ren"], ("c2_fei_letter", "vow"): ["yi"],
    ("c2_guan", "train"): ["yi", "yong"], ("c2_guan", "rest"): ["zhi"],
    ("c3_emperor", "zhaoyun"): ["cheng", "zhi"], ("c3_emperor", "zhaoyun_2"): ["cheng", "zhi"], ("c3_emperor", "limit"): ["zhi"], ("c3_emperor", "follow"): ["yi"],
    ("c3_fei", "go"): ["yi"], ("c3_fei", "warn"): ["zhi", "cheng"],
    ("c4_langzhong", "save"): ["ren", "yi"], ("c4_langzhong", "ride"): ["zhi"],
    ("c4_news", "pause"): ["zhi", "cheng"], ("c4_news", "vanguard"): ["yi"],
    ("c4_wz", "yes"): ["cheng"], ("c4_wz", "no"): ["ren"],
    ("c5_jin", "peace"): ["cheng", "ren"], ("c5_jin", "traitors"): ["zhi"], ("c5_jin", "war"): ["yi"],
    ("c5_oldgeneral", "ride"): ["yong", "yi"], ("c5_oldgeneral", "word"): ["cheng", "ren"],
    ("c5_mifang", "see"): ["ren"], ("c5_guan", "slow"): ["zhi"], ("c5_guan", "with"): ["yi"],
    ("c6_camps", "break"): ["zhi", "cheng"], ("c6_camps", "map"): ["zhi"], ("c6_camps", "fast"): ["yong"],
    ("c6_xing", "advise"): ["cheng"],
    ("c7_burn", "guard"): ["yi", "yong"], ("c7_burn", "rear"): ["ren", "yong"], ("c7_burn", "stones"): ["zhi"],
    ("c7_guan", "escort"): ["ren", "cheng"], ("c7_guan", "stay"): ["yi", "yong"],
    ("c8_tuogu", "charge"): ["yi"], ("c8_tuogu", "charge_2"): ["yi"], ("c8_tuogu", "east"): ["cheng"], ("c8_masu", "keep"): ["cheng"],
}
values.VALUES.setdefault("fazheng", {"zhi": ["esteem", 1], "yong": ["esteem", 1], "li": ["warmth", 1], "ren": ["esteem", -1]})
values.VALUES.setdefault("huangzhong", {"yong": ["esteem", 1], "yi": ["warmth", 1], "cheng": ["trust", 1], "li": ["esteem", -1]})
values.apply(N, CHARS, V5_TAGS)
byid = {n["id"]: n for n in N}
for nid, a in ASKS.items():
    a["answers"].sort(key=lambda x: ASK_ORDER[nid].index(x["id"]))
    byid[nid]["ask"] = a

# ------------------------------------------------------------------ cast, art, places
CAST = {
    "x_return5": cast_("zhuge"), "x_cold5": cast_("liubei", "zhuge"), "x_uncanny5": cast_("zhuge"), "x_loose5": cast_("liubei"),
    "c1_caodeath": cast_("liubei", "zhuge"), "c1_fazheng_end": cast_("fazheng"), "c1_wz_huatuo": cast_("wenzhi"), "c1_wz_clinic": cast_("wenzhi"),
    "c2_liufeng": cast_("liubei"), "c2_fei_letter": [], "c2_guan": cast_("guanyu"),
    "c3_emperor": cast_("liubei", "zhaoyun", "zhuge"), "c3_fei": cast_("liubei"), "c3_zhaoyun": cast_("zhaoyun"),
    "c4_langzhong": [], "c4_news": cast_("liubei"), "c4_wz": cast_("wenzhi"),
    "c5_jin": cast_("liubei"), "c5_oldgeneral": cast_("huangzhong", "liubei"), "c5_mifang": cast_("liubei"), "c5_guan": cast_("guanyu"),
    "c6_camps": cast_("liubei"), "c6_liubei": cast_("liubei"), "c6_xing": [],
    "c7_burn": cast_("liubei", "zhaoyun"), "c7_guan": cast_("guanyu"),
    "c8_tuogu": cast_("liubei", "zhuge"), "c8_masu": cast_("liubei"), "c8_wz": cast_("wenzhi"),
}
for nid in ("c1_caodeath", "c3_emperor", "c5_jin", "c8_tuogu"):
    pass
def lay(id, when=None, choice=None):
    d = {"id": id}
    if when: d["when"] = when
    if choice: d["choice"] = choice
    return d
# (ink scene, ink layers, map place, illustration — v5_* still to be drawn; the ink picture stands in)
ART = {
    "x_return5": ("letter", [], None, "v3_letter"), "x_cold5": ("lamp", [], None, "g_cold"), "x_uncanny5": ("lamp", [], None, "g_uncanny"),
    "x_loose5": ("letter", [], None, "g_cold"),
    "c1_caodeath": ("hall", [], "chengdu", "v3_council"), "c1_fazheng_end": ("lamp", [], "chengdu", "v5_fazheng"), "c1_wz_huatuo": ("letter", [lay("window")], None, "v4_wz_letter"),
    "c1_wz_clinic": ("herbs", [lay("two")], "chengdu", "v3_clinic"),
    "c2_liufeng": ("hall", [], "chengdu", "v5_liufeng"), "c2_fei_letter": ("letter", [], "chengdu", "v3_letter"), "c2_guan": ("garden", [], "chengdu", "v5_guan_arm"),
    "c3_emperor": ("hall", [lay("crowd")], "chengdu", "v5_emperor"), "c3_fei": ("hall", [], "chengdu", "v5_fei"), "c3_zhaoyun": ("lamp", [], "chengdu", "v2_zhaoyun_night"),
    "c4_langzhong": ("camp", [], "langzhong", "v5_langzhong"), "c4_news": ("mourning", [], "chengdu", "v5_mourning"), "c4_wz": ("road", [], "chengdu", "v3_wz_road"),
    "c5_jin": ("camp", [], "zigui", "v5_jin"), "c5_oldgeneral": ("camp", [lay("rider")], "xiaoting", "v5_huangzhong"), "c5_mifang": ("camp", [], "xiaoting", "v3_mifang"),
    "c5_guan": ("citywall", [lay("dusk")], "zigui", "v5_vanguard"),
    "c6_camps": ("hill", [], "xiaoting", "v5_camps"), "c6_liubei": ("riverbank", [], "xiaoting", "v5_stream"), "c6_xing": ("camp", [], "xiaoting", "v5_blade"),
    "c7_burn": ("fire", [lay("burning")], "xiaoting", "v5_fire"), "c7_guan": ("fire", [lay("burning")], "xiaoting", "v5_rearguard"),
    "c8_tuogu": ("lamp", [], "baidi", "v5_tuogu"), "c8_masu": ("lamp", [], "baidi", "v5_tuogu"), "c8_wz": ("herbs", [], "baidi", "v5_wz"),
}
for n in N:
    sc, ls, place, illus = ART[n["id"]]
    n["art"] = {"scene": sc, "layers": ls}
    if illus: n["art"]["illus"] = illus
    if place: n["place"] = place
    if n["id"] in CAST: n["cast"] = CAST[n["id"]]
PLACE_AFTER = {("c3_fei", "go"): "langzhong", ("x_return5", "back"): "chengdu", ("c6_camps", "map"): "chengdu", ("c7_burn", "*"): "baidi", ("c7_guan", "*"): "baidi"}
for n in N:
    for c in n["choices"]:
        pa = PLACE_AFTER.get((n["id"], c["id"])) or PLACE_AFTER.get((n["id"], "*"))
        if pa and pa != n.get("place"): c["place"] = pa

import moves_v5
CAMP_MOVES = moves_v5.extend(N, VARS)

PLACES = {k: V4["places"][k] for k in ("chengdu", "zigui", "jiangling", "hanzhong")}
PLACES.update({
    "langzhong": {"x": 190, "y": 220, "rx": 290, "ry": 450, "zh": "阆中", "en": "Langzhong"},
    "xiaoting": {"x": 470, "y": 318, "rx": 492, "ry": 500, "zh": "猇亭", "en": "Xiaoting"},
    "baidi": {"x": 380, "y": 298, "rx": 440, "ry": 492, "zh": "白帝城", "en": "Baidi"},
})
RIVERS = V4["rivers"]

FUTURE = [(T("称帝", "taking the throne"), "c3"), (T("火烧连营", "the burning camps"), "c7"), (T("白帝", "Baidi"), "c7"), (T("托孤", "entrusting the heir"), "c8"),
          (T("七擒", "seven captures"), "v6"), (T("孟获", "Meng Huo"), "v6"),
          (T("出师表", "the Memorial on Going to War"), "v7"), (T("街亭", "Jieting"), "v7"), (T("空城计", "the empty fort"), "v7"), (T("五丈原", "Wuzhang Plains"), "v7")]

# ------------------------------------------------------------------ endings
def frag(id, text, when=None, mood=None):
    d = {"id": id, "text": text}
    if when: d["when"] = when
    if mood: d["mood"] = mood
    return d
LIU = ALL(V("track", "==", "liu"), STAYING)
ENDINGS = [
    {"id": "g_side", "title": T("去处", "Where You Ended Up"), "fragments": [
        frag("hermit", T("你没有去成都。白帝城的事，是从集市上听来的。", "You never went to Chengdu. You heard about Baidi in the market."), F("flag.v5_hermit")),
        frag("exposed", T("你在一个雨夜出了城。蜀中又多了一个关于妖人的故事。", "You left the city one rainy night. Shu gained another story about a sorcerer."), F("flag.v5_exposed")),
        frag("left", T("你离开了。陛下驾崩的消息，你是在路上听到的。", "You left. You heard of His Majesty's death on the road."), F("flag.v5_left")),
        frag("charge", T("白帝城里，陛下把你的手和丞相的手放在了一起。", "In Baidi, His Majesty laid your hand together with the Chancellor's."), ALL(F("flag.v5_entrusted"), STAYING), "warm"),
        frag("baidi", T("你在白帝城，送走了陛下。", "At Baidi you saw His Majesty off."), LIU)]},
    {"id": "g_brothers", "title": T("兄弟", "The Brothers"), "fragments": [
        frag("both", T("桃园三个人，活着两个。白帝城的床边，一边坐着关羽，一边跪着张飞。", "Of the three from the peach garden, two outlived the war. At the bedside in Baidi, Guan Yu sat on one side and Zhang Fei knelt on the other."), ALL(F("flag.guan_alive"), F("flag.fei_alive")), "warm"),
        frag("guan", T("关羽活着。他一生只退过两次，两次都是被你拉走的。", "Guan Yu lived. He retreated only twice in his life, and both times it was you who pulled him away."), F("flag.guan_alive"), "warm"),
        frag("guan_last", T("“云长这回没有退。”这句话，是你带回来的。", "'This time Yunchang did not retreat.' You were the one who carried those words back."), F("flag.v5_guan_last"), "sad"),
        frag("fei", T("范疆、张达扔下刀跑了。张飞活着，后来再也没在酒后打过人。", "Fan Jiang and Zhang Da dropped their knives and ran. Zhang Fei lived, and never again struck a man in drink."), F("flag.fei_alive"), "warm"),
        frag("fei_night", T("张飞遇害那一夜，你就在阆中。你一直没原谅自己走得太早。", "On the night Zhang Fei was killed, you were at Langzhong. You never forgave yourself for leaving his tent too early."), F("flag.v5_fei_night"), "sad"),
        frag("canon", T("桃园三个人，最后只剩下一个，死在白帝城。", "Of the three from the peach garden, in the end only one was left, and he died at Baidi."), None, "sad")]},
    {"id": "g_yiling", "title": T("夷陵", "Yiling"), "fragments": [
        frag("break", T("营与营之间的空地拦住了火。那一仗还是输了，可回来的人，比说书人讲的多一倍。", "The cleared ground between the camps stopped the fire. The battle was still lost, but twice as many men came home as the storytellers say."), F("flag.v5_firebreak")),
        frag("rear", T("你从火里带出来一营兵。他们后来跟着丞相去了南中。", "You brought a whole camp out of the fire. Later they went south with the Chancellor."), F("flag.v5_rear")),
        frag("guard", T("马鞍山那夜，你把马让给了陛下。", "That night at Saddle Hill you gave His Majesty your horse."), F("flag.v5_guard")),
        frag("stones", T("陆逊在鱼腹浦的石阵前停了下来。后来有人问他为什么没追，他不说。", "Lu Xun stopped at the stones of Yufu Shore. When people later asked why he didn't pursue, he wouldn't say."), V("uncanny", ">=", 4)),
        frag("canon", T("七百里连营，一夜烧尽。", "Seven hundred li of camps burned in a single night."))]},
    {"id": "g_wenzhi", "title": T("温芷", "Wen Zhi"), "fragments": [
        frag("wed", T("回了成都，你们成了亲。没有请什么人，丞相送来一对灯笼。", "Back in Chengdu, the two of you married. You asked hardly anyone; the Chancellor sent a pair of lanterns."), F("flag.wz_wed"), "romance"),
        frag("book", T("温芷把华佗那十一页医书，又抄了十份，分给了蜀中的医馆。", "Wen Zhi copied Hua Tuo's eleven pages ten more times and gave them to the clinics of Shu."), F("flag.wz_qingnang")),
        frag("near", T("温芷在永安宫煎了一个月的药。", "Wen Zhi brewed medicine in the Palace of Enduring Peace for a month."), WZ),
        frag("far", T("你很久没有温芷的消息了。", "You haven't heard from Wen Zhi in a long time."))]},
    {"id": "g_lives", "title": T("因你而不同的人", "Lives You Changed"), "mode": "all", "fragments": [
        frag("liufeng", T("刘封没有死。他在汉中种地，每年托人往成都送一车粮。", "Liu Feng didn't die. He farms in Hanzhong and every year sends a cart of grain to Chengdu."), F("flag.liufeng_spared")),
        frag("hz", T("黄忠最后一次冲阵，你在他旁边。", "On Huang Zhong's last charge, you were at his side."), F("flag.v5_hz_ride")),
        frag("hz_word", T("黄忠死的时候在笑。陛下收回了那句话。", "Huang Zhong died smiling. His Majesty had taken back what he said."), F("flag.v5_hz_word")),
        frag("fazheng", T("法正枕头底下那一页，写着你的名字。", "Under Fa Zheng's pillow was a page with your name on it."), AT("fazheng", "warmth", 3)),
        frag("masu", T("陛下说马谡言过其实。你记下了。", "His Majesty said Ma Su's words outran his worth. You remembered."), F("flag.v5_masu"))]},
    {"id": "g_name", "title": T("名声", "Your Name"), "fragments": [
        frag("nearly", T("有人说，那天殿上，陛下差一点就听了子衡的。", "Some say that in the hall that day, His Majesty very nearly listened to Ziheng."), F("flag.v5_nearly")),
        frag("uncanny", T("吴人说，蜀中有个人知道鱼腹浦的石头会动。", "In Wu they say there's a man in Shu who knew the stones of Yufu Shore would move."), V("uncanny", ">=", 5)),
        frag("loyal", T("人说子衡重义。", "People say Ziheng keeps faith."), V("renown.loyal", ">", "@renown.cunning")),
        frag("cunning", T("人说子衡多智，也说子衡心深。", "People say Ziheng is clever, and that his mind runs deep."), V("renown.cunning", ">", "@renown.loyal")),
        frag("none", T("史书里没有你的传，只有几处『或曰』。", "The histories give you no biography—just a few lines beginning 'some say.'"))]},
    {"id": "g_history", "title": T("天下", "The Realm"), "fragments": [
        frag("far", T("说书人讲到夷陵，有好几处讲不顺——那几处，都是你。", "When storytellers reach Yiling, several places never quite fit. Those places are you."), V("deviation", ">=", 8)),
        frag("plain", T("章武三年四月，昭烈皇帝崩于永安宫，年六十三。太子刘禅即位，丞相开府治事。", "In the fourth month of Zhangwu 3, the Zhaolie Emperor died in the Palace of Enduring Peace, aged sixty-three. The Crown Prince Liu Shan took the throne, and the Chancellor took up the government."))]},
]
FRAG_FACE = {"g_brothers": {"both": ("guanyu", "warm"), "guan": ("guanyu", "warm"), "guan_last": ("guanyu", "sad"), "canon": ("liubei", "sad")},
             "g_wenzhi": {"wed": ("wenzhi", "shy"), "book": ("wenzhi", "warm"), "near": ("wenzhi", "sad"), "far": ("wenzhi", "sad")}}
ENDING_ART = {"scene": "ending", "layers": [{"id": "city", "when": STAYING}, {"id": "home", "when": F("flag.wz_wed")},
                                            {"id": "lone", "when": ANY(F("flag.v5_hermit"), F("flag.v5_left"), F("flag.v5_exposed"))}]}

def _ctl(**kw):
    base = {"liang": "cao", "bing": "cao", "you": "cao", "ji": "cao", "qing": "cao", "sili": "cao", "yan": "cao", "yu": "cao", "xu": "cao",
            "jing": "sun", "yang": "sun", "yi": "liubei", "jiao": "sun"}
    base.update(kw); return base
REALM = json.loads(json.dumps(V4["realm"]))
REALM["control"] = {f"c{i}": _ctl() for i in range(1, 9)}
REALM["control"]["c5"] = _ctl(jing=["sun", "liubei"]); REALM["control"]["c6"] = _ctl(jing=["sun", "liubei"])
REALM["captions"] = {"c1": T("曹操去世，曹丕继位", "Cao Cao dies; Cao Pi succeeds"), "c2": T("孟达降魏，上庸失守", "Meng Da goes over to Wei; Shangyong is lost"),
                     "c3": T("曹丕篡汉；刘备在成都称帝", "Cao Pi takes the Han throne; Liu Bei declares himself emperor in Chengdu"),
                     "c4": T("东征在即，张飞在阆中", "The eastern war is near; Zhang Fei at Langzhong"), "c5": T("蜀军出三峡，打到秭归", "The Shu army comes down the Gorges to Zigui"),
                     "c6": T("猇亭至川口，连营七百里", "Seven hundred li of camps from Xiaoting to the river mouth"), "c7": T("陆逊火烧连营，刘备退守白帝", "Lu Xun burns the camps; Liu Bei falls back to Baidi"),
                     "c8": T("章武三年：白帝城托孤", "223: the charge at Baidi")}

COMMIT_RULES = speech.commit_rules()
ART_PROMPTS = dict(V4["art_prompts"])
PORTRAIT_PROMPTS = dict(V4["portrait_prompts"])
PRESETS = json.loads((HERE / "presets.json").read_text()) if (HERE / "presets.json").exists() else []

CAMPAIGN = {
    "spec": SPEC, "tiers": TIERS(), "hard_tiers": {"rel.liubei.trust": 3}, "pack": PACK("history-strategy"),
    "resources": {"reputation": ["renown.loyal", "renown.cunning"], "risk": ["uncanny", "renown.rash"], "drift": ["deviation"]},
    "carry_compress": {"pivot": 4, "k": 0.5},
    "id": "sanguo_strategist_v5", "prev": "sanguo_strategist_v4",
    "title": T("三国·谋士", "Three Kingdoms: The Strategist"), "volume": T("卷五 · 夷陵与白帝", "Volume V · Yiling and Baidi"),
    "rights": {"source": "《三国演义》（罗贯中，明代），公版", "quotes": "中文原文直接引用；英文为本项目自译", "original_characters": ["子衡（玩家）", "温芷"]},
    "player": {"name": T("子衡", "Ziheng")}, "side_prompt": SIDE_PROMPT,
    "vars": VARS, "chars": CHARS, "dims": DIMS, "echoes": ECHOES, "debts": DEBTS,
    "chapters": CHAPTERS, "nodes": {n["id"]: n for n in N}, "endings": ENDINGS, "situations": situations.volume(N, VARS), "moves": CAMP_MOVES,
    "future_terms": [{"term": t, "from": c} for t, c in FUTURE],
    "ending_art": ENDING_ART, "art_prompts": ART_PROMPTS, "frag_face": FRAG_FACE, "portrait_prompts": PORTRAIT_PROMPTS, "cg_captions": V4["cg_captions"], "realm": REALM,
    "react_patterns": V4["react_patterns"], "value_tags": values.TAGS, "commit_rules": COMMIT_RULES,
    "witness": [{"who": "zhuge", "to": "liubei", "labels": ["rude", "threat"], "effects": [rel("zhuge", "trust", -1)]},
                {"who": "zhaoyun", "to": "liubei", "labels": ["rude", "threat"], "effects": [rel("zhaoyun", "trust", -1)]}],
    "places": PLACES, "rivers": RIVERS,
    "meters": {"uncanny": T("到 7：被当作妖人", "At 7: branded a sorcerer"), "rash": T("到 6：有人会把你的话报上去", "At 6: someone reports what you've said")},
    "presets": PRESETS,
    "sources": [{"what": "中文引文核对底本", "url": "https://www.ntdtv.com/gb/2009/12/16/a382772.html", "checked": "2026-10-27", "note": "第78回（华佗）"},
                {"what": "中文引文核对底本", "url": "https://www.ntdtv.com/gb/2009/12/20/a383089.html", "checked": "2026-10-27", "note": "第79回（刘封）"},
                {"what": "中文引文核对底本", "url": "https://www.ntdtv.com/gb/2009/12/22/a383416.html", "checked": "2026-10-27", "note": "第80回（称帝）"},
                {"what": "中文引文核对底本", "url": "https://www.ntdtv.com/gb/2009/12/24/a383572.html", "checked": "2026-10-27", "note": "第81回（赵云谏、张飞遇害）"},
                {"what": "中文引文核对底本", "url": "https://www.ntdtv.com/b5/2009/12/28/a384128.html", "checked": "2026-10-27", "note": "第83回（黄忠、关兴、七百里连营），繁体转简体"},
                {"what": "中文引文核对底本", "url": "https://www.ntdtv.com/gb/2009/12/29/a384517.html", "checked": "2026-10-27", "note": "第84回（马良图本、火攻、赵云接应、八阵图）"},
                {"what": "中文引文核对底本", "url": "https://www.ntdtv.com/gb/2009/12/30/a384636.html", "checked": "2026-10-27", "note": "第85回（托孤、遗诏、马谡）"}],
    "end_note": T("卷五终。卷六《南中》尚未开放。", "End of Volume V. Volume VI (The South) is not yet open."),
}

if __name__ == "__main__":
    out = HERE / "campaign_v5.json"
    dump(CAMPAIGN, out)
    print("nodes", len(N), "->", out)

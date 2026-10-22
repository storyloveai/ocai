"""三国·谋士 卷三（汉中，第66–73回）。

接着卷二：同名变量（关系、名声、剧情标记）由上一卷带来；没玩过卷二的玩家从“前情”开始。
卷二结尾的去留决定这一卷看哪一边：回了荆州的在关羽身边（荆州线），其余的随刘备在成都、汉中（成都线）。
两条线共享每章的主线名场面，支线和对话按所在的一边分开。细纲见 docs/全书规划.md。
原著引文只取公版原文，并已核对（见 sources）；其余叙述和英文都是我们自己写的。
"""
import json, pathlib, sys
HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE.parent))
from lib import *
import speech, values
from talks import topic, talk_node
from asks import ans
import people_v3 as P3

V2 = json.loads((HERE.parent / "v2" / "campaign_v2.json").read_text())

def num(init, lo, hi, label, show=True, group=None, carry=True):
    d = {"type": "num", "init": init, "min": lo, "max": hi, "label": label, "show": show}
    if group: d["group"] = group
    if not carry: d["carry"] = False
    return d
def flag(label, carry=True):
    d = {"type": "flag", "init": False, "label": label}
    if not carry: d["carry"] = False
    return d
def I(c, k, op, v): return V(f"imp.{c}.{k}", op, v)
def DEBT(i, state="open"): return V(f"debt.{i}", "==", state)

# where you are this volume: Jingzhou (beside Guan Yu) if you went back there at the end of Volume II; otherwise with Liu Bei
JING = F("flag.post_jingzhou")
CD = NF("flag.post_jingzhou")
TO_JING = F("flag.v3_to_jing")          # a Chengdu player who rides to Jingzhou in chapter 7
AT_JING = ANY(JING, TO_JING)
WZ = ANY(F("flag.wz_west"), F("flag.wz_jingzhou"))
WZ_NEAR = ANY(ALL(JING, F("flag.wz_jingzhou")), ALL(CD, F("flag.wz_west")))   # she is in the same city as you
WZ_FAR = ALL(WZ, ANY(ALL(JING, F("flag.wz_west")), ALL(CD, F("flag.wz_jingzhou"))))
AWAY = ANY(F("prev.ended_early"), V("track", "==", "cao"))
STAYING = ALL(NF("flag.v3_hermit"), NF("flag.v3_left"), NF("flag.v3_exposed"))

# ------------------------------------------------------------------ vars
VARS = {
    "track": {"type": "enum", "init": "liu", "values": ["liu", "cao"], "label": T("效力", "Serving")},
    "renown.loyal": num(0, 0, 10, T("名声·忠义", "Name for loyalty"), group="renown"),
    "renown.cunning": num(0, 0, 10, T("名声·权谋", "Name for cunning"), group="renown"),
    "uncanny": num(0, 0, 10, T("异名（先见被人察觉）", "Uncanny (foresight noticed)"), group="renown"),
    "deviation": num(0, 0, 30, T("偏离原著", "Departures from the novel"), show=False),
    "prev.ended_early": flag(T("上一卷提前收场", "The previous volume ended early")),
    "renown.rash": num(0, 0, 10, T("名声·口无遮拦", "Name for loose talk"), group="renown"),
}
# what Volume II (and through it Volume I) may hand over; same names as before
CARRIED = {
    "flag.mi_saved": T("救下糜夫人", "Saved Lady Mi"), "flag.wenzhi_with_you": T("赤壁夜接回温芷", "Brought Wen Zhi back on the night of the fire"),
    "flag.confessed": T("江边对温芷说出心意", "Told Wen Zhi how you feel by the river"),
    "flag.vouched_guan": T("为关羽作保", "Vouched for Guan Yu"), "flag.pleaded_guan": T("在华容道求关羽", "Pleaded with Guan Yu at Huarong"),
    "flag.promised_return": T("与鲁肃立约归还荆州", "Signed a promise to return Jingzhou to Lu Su"),
    "flag.liuqi_pretext": T("以刘琦之名推托鲁肃", "Put Lu Su off in Liu Qi's name"),
    "flag.pleaded_weiyan": T("为魏延求情", "Pleaded for Wei Yan"), "flag.foresaw_weiyan": T("预言魏延日后", "Foretold Wei Yan's future"),
    "flag.zy_refused": T("支持赵云拒婚", "Backed Zhao Yun's refusal of the marriage"), "flag.adou_kept": T("截江夺回阿斗", "Took A Dou back on the river"),
    "flag.wz_west": T("温芷随军入川", "Wen Zhi went west with the army"), "flag.wz_jingzhou": T("温芷留在荆州", "Wen Zhi stayed in Jingzhou"),
    "flag.wz_child": T("和温芷说起将来的孩子", "Talked with Wen Zhi about a child"),
    "flag.pt_alive": T("庞统没有死在落凤坡", "Pang Tong did not die at Fallen Phoenix Slope"),
    "flag.post_chengdu": T("留在成都", "Stayed in Chengdu"), "flag.post_jingzhou": T("回荆州，在关羽身边", "Went back to Jingzhou, beside Guan Yu"),
    "flag.post_none": T("什么都不要", "Asked for nothing"), "flag.guan_charge": T("关羽托付了你一句话", "Guan Yu entrusted you with a word"),
}
for k, lab in CARRIED.items(): VARS[k] = flag(lab)

FLAGS = {
    "flag.v3_came_back": T("流落之后回到刘备身边", "Came back to Liu Bei after wandering"),
    "flag.v3_hermit": T("就此隐去", "Disappeared from the world"),
    "flag.dd_guard": T("随关羽单刀赴会", "Went with Guan Yu to the meeting"),
    "flag.dd_lusu": T("赴会前私下见了鲁肃", "Saw Lu Su privately before the meeting"),
    "flag.jin_trick": T("献计应付诸葛瑾", "Helped trick Zhuge Jin"),
    "flag.jin_honest": T("劝主公真还三郡", "Urged your lord to truly return three commanderies"),
    "flag.xiang_envoy": T("献计以三郡换东吴出兵合肥", "Proposed trading three commanderies for a Wu attack on Hefei"),
    "flag.xiang_hold": T("劝主公一寸地也不让", "Urged your lord to give up no land at all"),
    "flag.xiang_obey": T("劝关羽遵令割让三郡", "Persuaded Guan Yu to cede the three commanderies"),
    "flag.xiang_bargain": T("帮关羽少割一郡", "Helped Guan Yu cede one commandery less"),
    "flag.xiang_letter": T("写信请主公收回成命", "Wrote to ask your lord to withdraw the order"),
    "flag.wakou_go": T("自请去瓦口陪着张飞", "Asked to go to Wakou with Zhang Fei"),
    "flag.hz_goaded": T("跟着诸葛亮激黄忠", "Joined Zhuge Liang in goading Huang Zhong"),
    "flag.hz_backed": T("替黄忠说话", "Spoke up for Huang Zhong"),
    "flag.dj_flags": T("在法正身边看旗", "Watched the flags beside Fa Zheng"),
    "flag.dj_charge": T("随黄忠冲下定军山", "Charged down Mount Dingjun with Huang Zhong"),
    "flag.fed_pride": T("附和关羽看轻黄忠", "Agreed with Guan Yu's scorn for Huang Zhong"),
    "flag.praised_hz": T("当着关羽夸黄忠", "Praised Huang Zhong in front of Guan Yu"),
    "flag.hs_open": T("劝赵云大开寨门", "Urged Zhao Yun to throw open the camp gates"),
    "flag.jl_chase": T("从“鸡肋”看出曹操要退", "Read Cao Cao's retreat in 'chicken rib'"),
    "flag.jl_yangxiu": T("预言杨修之死", "Foretold Yang Xiu's death"),
    "flag.mf_mended": T("替糜芳在关羽面前说话", "Spoke for Mi Fang to Guan Yu"),
    "flag.mf_warned": T("劝糜芳收敛", "Told Mi Fang to watch himself"),
    "flag.mf_told": T("把糜芳的怨言告诉关羽", "Told Guan Yu what Mi Fang said"),
    "flag.wh_ask": T("劝先问过关羽再定五虎将", "Urged asking Guan Yu before naming the Five Tigers"),
    "flag.v3_to_jing": T("自请去荆州", "Asked to go to Jingzhou"),
    "flag.fs_helped": T("帮费诗劝关羽受印", "Helped Fei Shi persuade Guan Yu to accept the seal"),
    "flag.fs_private": T("先附和关羽，私下再劝", "Agreed with Guan Yu first, then persuaded him privately"),
    "flag.fs_pushed": T("拿主公压关羽", "Leaned on Guan Yu with your lord's name"),
    "flag.hn_soft": T("劝关羽婉拒孙权的亲事", "Persuaded Guan Yu to decline Sun Quan's proposal gently"),
    "flag.hn_canon": T("关羽骂走了诸葛瑾", "Guan Yu drove Zhuge Jin out with insults"),
    "flag.hn_apology": T("替关羽向东吴赔了礼", "Apologized to Wu on Guan Yu's behalf"),
    "flag.fire_spared": T("劝关羽从轻发落糜芳、傅士仁", "Urged Guan Yu to go easy on Mi Fang and Fu Shiren"),
    "flag.warned_jing": T("劝主公派兵接应荆州", "Urged your lord to send troops to back up Jingzhou"),
    "flag.v3_left": T("被冷落后离开", "Left after being sidelined"),
    "flag.v3_exposed": T("妖人之名坐实", "Branded a sorcerer for good"),
    "flag.sidelined": T("被冷落", "Sidelined"),
}
for k, lab in FLAGS.items(): VARS[k] = flag(lab)

# ------------------------------------------------------------------ people
CHARS = {}
for k in ("liubei", "caocao", "guanyu", "zhuge", "wenzhi", "zhaoyun", "lusu", "pangtong"):
    CHARS[k] = json.loads(json.dumps(V2["chars"][k])); CHARS[k].pop("from_chapter", None)
for k, d in P3.NEW_CHARS.items():
    CHARS[k] = dict(d); CHARS[k]["romance"] = False; CHARS[k]["react"] = P3.REACT[k]; CHARS[k]["persona"] = P3.PERSONA[k]
    if k in P3.OPENERS: CHARS[k]["openers"] = P3.OPENERS[k]
    CHARS[k]["heat"] = P3.HEAT[k]
CHARS["liubei"]["persona"] = T("刘备：五十多岁，已据有荆、益二州，这一卷里称汉中王；仍然宽厚、能忍，但离天下越近，越显出急切。称玩家“子衡”。",
                               "Liu Bei: in his fifties, now holding Jing and Yi, and in this volume King of Hanzhong; still kind and patient, but the nearer the realm comes, the more urgent he grows. Calls the player Ziheng.")
CHARS["guanyu"]["persona"] = T("关羽：五十多岁，独镇荆州，威震华夏前夜；忠义、刚烈、极重名节，看不起东吴，也看不起出身不如他的人。称玩家“子衡”。",
                               "Guan Yu: in his fifties, holding Jingzhou alone on the eve of his greatest fame; loyal, fierce, jealous of his honor, scornful of Wu and of anyone he thinks beneath him. Calls the player Ziheng.")
CHARS["zhuge"]["persona"] = T("诸葛亮：三十多岁，坐镇成都，总揽军国大事；从容、机敏、谦和而难以看透，喜欢用反问试探人。称玩家“子衡兄”。",
                              "Zhuge Liang: in his thirties, running the realm from Chengdu; composed, quick, courteous and hard to read; tests people with questions. Calls the player Ziheng.")
DIMS = dict(V2["dims"])
def dim_label(c, dim): return (CHARS[c].get("lens") or {}).get(dim) or DIMS[dim]
for c, d in CHARS.items():
    for dim, (init, lo, hi) in d["dims"].items():
        VARS[f"rel.{c}.{dim}"] = {"type": "num", "init": init, "min": lo, "max": hi,
                                  "label": T(d["name"]["zh"] + "·" + dim_label(c, dim)["zh"], d["name"]["en"] + " · " + dim_label(c, dim)["en"]), "char": c, "dim": dim}
for c, k, lab in [("guanyu", "offended", T("被冒犯", "Offended")), ("liubei", "offended", T("被冒犯", "Offended")), ("fazheng", "offended", T("被冒犯", "Offended")),
                  ("huangzhong", "offended", T("被冒犯", "Offended")), ("lusu", "offended", T("被冒犯", "Offended"))]:
    VARS[f"imp.{c}.{k}"] = {"type": "num", "init": 0, "min": 0, "max": 5, "label": T(CHARS[c]["name"]["zh"] + "·" + lab["zh"], CHARS[c]["name"]["en"] + " · " + lab["en"]), "char": c, "imp": k, "show": False}
for c in CHARS:
    if CHARS[c].get("heat"):
        VARS[f"heat.{c}"] = {"type": "num", "init": 0, "min": 0, "max": 5, "char": c, "show": False, "carry": False,
                             "label": T(CHARS[c]["name"]["zh"] + "·火气", CHARS[c]["name"]["en"] + " · Temper")}

# ------------------------------------------------------------------ echoes & debts
ECHOES = {
    "e_dandao": T("单刀会上，你按剑站在关羽身后", "At the meeting you stood behind Guan Yu with your hand on your sword"),
    "e_lusu3": T("赴会前，你私下和鲁肃把话说开了", "Before the meeting you talked things through with Lu Su in private"),
    "e_jin": T("你献计应付了诸葛瑾", "You helped trick Zhuge Jin"),
    "e_three": T("你劝主公真把三郡还给了东吴", "You had your lord truly hand three commanderies back to Wu"),
    "e_xiang": T("湘水分界，是你劝下来的", "The Xiang River line was your doing"),
    "e_wakou": T("你在瓦口陪着张飞喝酒", "You drank with Zhang Fei at Wakou"),
    "e_hz": T("你在诸葛亮面前替黄忠说过话", "You spoke up for Huang Zhong in front of Zhuge Liang"),
    "e_goad": T("你跟着诸葛亮激过黄忠", "You joined Zhuge Liang in goading Huang Zhong"),
    "e_charge": T("你随黄忠冲下了定军山", "You charged down Mount Dingjun with Huang Zhong"),
    "e_flags": T("定军山上，你在法正身边看旗", "On Mount Dingjun you watched the flags beside Fa Zheng"),
    "e_pride": T("你附和过关羽看轻黄忠", "You went along with Guan Yu's scorn for Huang Zhong"),
    "e_praise_hz": T("你当着关羽夸过黄忠", "You praised Huang Zhong to Guan Yu's face"),
    "e_hanshui": T("汉水边，你劝赵云大开寨门", "By the Han River you urged Zhao Yun to throw open the gates"),
    "e_jilei": T("你从“鸡肋”两个字里听出了退兵", "You heard a retreat in the words 'chicken rib'"),
    "e_yangxiu": T("你说过：那句口令会要了一个人的命", "You said that password would cost a man his life"),
    "e_mifang": T("你在关羽面前替糜芳说过话", "You spoke for Mi Fang to Guan Yu"),
    "e_mf_told": T("你把糜芳的怨言告诉了关羽", "You told Guan Yu what Mi Fang had said"),
    "e_tiger": T("五虎将的名单，你劝过先问关羽", "You urged that Guan Yu be asked before the Five Tigers were named"),
    "e_envoy": T("你替汉中王把印送到了荆州", "You carried the King of Hanzhong's seal to Jingzhou"),
    "e_seal": T("你帮费诗劝关羽受了印", "You helped Fei Shi persuade Guan Yu to take the seal"),
    "e_soft": T("孙权求亲，你劝关羽婉拒", "When Sun Quan asked for the match, you had Guan Yu decline gently"),
    "e_apology": T("你替关羽给东吴赔了礼", "You apologized to Wu for Guan Yu"),
}
DEBTS = {
    "d_xiang": {"title": T("湘水之约", "The Xiang River Line"), "lock": "functional",
                "broken": T("三郡没有割给东吴，孙权没有理由替刘备去打合肥。", "No commanderies went to Wu, so Sun Quan has no reason to strike at Hefei for Liu Bei."),
                "function": T("孙权北攻合肥，曹操顾不上西川", "Sun Quan marches on Hefei and Cao Cao can't turn on the west")},
    "d_tiger": {"title": T("五虎上将", "The Five Tigers"), "lock": "functional",
                "broken": T("黄忠没有和关羽同列，五虎将还缺一个。", "Huang Zhong isn't ranked with Guan Yu, and the Five Tigers are one short."),
                "function": T("关羽、张飞、赵云、马超、黄忠，五虎上将同列", "Guan Yu, Zhang Fei, Zhao Yun, Ma Chao and Huang Zhong ranked together as the Five Tigers")},
}

SIDE_PROMPT = T("这段日子，你只来得及做一件事。", "These days you only have time for one thing.")
CHAPTERS = [
    {"id": "c1", "title": T("讨荆州", "The Claim on Jingzhou"), "year": T("建安二十年（215）", "Jian'an 20 (215)"), "canon": T("第66回", "Ch. 66"), "offer": 2,
     "intro": [P(T("刘备得了西川，东吴来讨荆州了。诸葛亮的哥哥诸葛瑾带着家小的性命，一路哭到了成都。", "Liu Bei has the west, and now Wu wants Jingzhou back. Zhuge Liang's elder brother, Zhuge Jin, comes all the way to Chengdu in tears, his family's lives held hostage to the answer."), CD),
               P(T("荆州。东吴的鲁肃派人送来请帖，请关将军过江赴宴。关羽看完，把请帖递给了你。", "Jingzhou. Lu Su of Wu has sent an invitation: General Guan is asked across the river to a feast. Guan Yu reads it and hands it to you."), JING)]},
    {"id": "c2", "title": T("得陇望蜀", "Longing for Shu"), "year": T("建安二十年（215）", "Jian'an 20 (215)"), "canon": T("第67回", "Ch. 67"), "offer": 2,
     "intro": [P(T("曹操亲征汉中，张鲁投降。汉中一失，西川的门就开了一半。成都一夕数惊。", "Cao Cao marches on Hanzhong himself, and Zhang Lu surrenders. With Hanzhong gone, the door to the west stands half open. Chengdu panics several times in a single night."))]},
    {"id": "c3", "title": T("瓦口", "Wakou Pass"), "year": T("建安二十二年（217）", "Jian'an 22 (217)"), "canon": T("第70回", "Ch. 70"), "offer": 2,
     "intro": [P(T("曹操回了邺城，留张郃守巴西，夏侯渊守汉中。刘备决意北取汉中。张飞在瓦口关前，天天喝酒。", "Cao Cao has gone back to Ye, leaving Zhang He to hold Baxi and Xiahou Yuan to hold Hanzhong. Liu Bei resolves to take Hanzhong. At Wakou Pass, Zhang Fei drinks every day."))]},
    {"id": "c4", "title": T("定军山", "Mount Dingjun"), "year": T("建安二十四年（219）", "Jian'an 24 (219)"), "canon": T("第70–71回", "Ch. 70–71"), "offer": 2,
     "intro": [P(T("黄忠斩了韩浩、夏侯德，一路杀到定军山下。法正说：夏侯渊轻而寡谋，可以诱他出来。", "Huang Zhong has cut down Han Hao and Xiahou De and fought his way to the foot of Mount Dingjun. Fa Zheng says: Xiahou Yuan is rash and short on strategy; he can be drawn out."), CD),
               P(T("汉中的战报一封接一封送到荆州。关羽每封都看，看完都不说话。", "One war report after another arrives in Jingzhou from Hanzhong. Guan Yu reads every one, and says nothing after any of them."), JING)]},
    {"id": "c5", "title": T("汉水", "The Han River"), "year": T("建安二十四年（219）", "Jian'an 24 (219)"), "canon": T("第71回", "Ch. 71"), "offer": 2,
     "intro": [P(T("夏侯渊死了。曹操亲率大军来报仇，粮草都囤在北山脚下。黄忠要去劫粮，赵云守着汉水边的营寨。", "Xiahou Yuan is dead. Cao Cao comes in person with a great army to avenge him, his grain piled at the foot of the northern hill. Huang Zhong means to raid it; Zhao Yun holds the camp on the Han River."), CD),
               P(T("夏侯渊的死讯传到荆州那天，关羽一个人在江边站了很久。", "The day word of Xiahou Yuan's death reaches Jingzhou, Guan Yu stands alone by the river for a long time."), JING)]},
    {"id": "c6", "title": T("鸡肋", "Chicken Rib"), "year": T("建安二十四年（219）", "Jian'an 24 (219)"), "canon": T("第72回", "Ch. 72"), "offer": 2,
     "intro": [P(T("曹操屯兵斜谷，进不能胜，退恐人笑。两军相持了好些日子。", "Cao Cao has camped his army at Xie Valley. He can't win by pressing on and fears ridicule if he pulls back. The two armies have faced each other for days."), CD),
               P(T("荆州。糜芳守江陵，傅士仁守公安。两人都是关羽的部下，也都怕他。", "Jingzhou. Mi Fang holds Jiangling, Fu Shiren holds Gong'an. Both serve under Guan Yu, and both fear him."), JING)]},
    {"id": "c7", "title": T("汉中王", "King of Hanzhong"), "year": T("建安二十四年（219）", "Jian'an 24 (219)"), "canon": T("第73回", "Ch. 73"), "offer": 2,
     "intro": [P(T("曹操退出汉中。众人劝刘备进位，刘备推了几次，终于在沔阳设坛，称汉中王。", "Cao Cao has abandoned Hanzhong. Everyone urges Liu Bei to take a higher title; he refuses several times, and at last builds an altar at Mianyang and becomes King of Hanzhong."), CD),
               P(T("汉中王的使者费诗到了荆州，带着前将军的印。关羽问：『五虎将是哪五个？』", "The King of Hanzhong's envoy, Fei Shi, arrives in Jingzhou with the seal of General of the Vanguard. Guan Yu asks, 'Who are the Five Tigers?'"), JING)]},
    {"id": "c8", "title": T("虎女犬子", "A Tiger's Daughter"), "year": T("建安二十四年（219）", "Jian'an 24 (219)"), "canon": T("第73回", "Ch. 73"), "offer": 2,
     "intro": [P(T("曹操和孙权都坐不住了。曹操派人去江东，约孙权夹攻荆州；孙权先派诸葛瑾去荆州，替自己的儿子求亲。", "Neither Cao Cao nor Sun Quan can sit still now. Cao sends to the east, proposing that Sun Quan join him against Jingzhou; Sun Quan first sends Zhuge Jin to Jingzhou to ask for a marriage for his son."))]},
]

# ------------------------------------------------------------------ nodes
N = []
def cast_(*ids): return [{"id": i} for i in ids]

# ---------- opening interlude: for anyone who left in an earlier volume ----------
N.append(node("x_return3", "*", "interrupt", T("故人来信", "A Letter from an Old Friend"), "free", T("原创", "original"),
    [P(T("你离开刘备已经好几年了。", "It has been several years since you left Liu Bei."), F("prev.ended_early")),
     P(T("你在北方住了好几年。曹操封了魏公，又封了魏王。", "You have lived in the north for several years. Cao Cao has been made Duke of Wei, and then King of Wei."), V("track", "==", "cao")),
     P(T("一天，一封信辗转送到你手里，字是诸葛亮的：『汉中将有大战。子衡兄若还记得许都的青梅，请来成都。』", "One day a letter reaches you by a winding road, in Zhuge Liang's hand: 'There will be a great battle at Hanzhong. If you still remember the green plums of Xuchang, come to Chengdu.'"))],
    [choice("back", "dilemma", T("动身去成都。", "Set out for Chengdu."),
            T("刘备在城门口等你，头发白了一半。他拉着你的手，只说：『回来就好。』", "Liu Bei waits for you at the city gate, his hair half grey. He takes your hand and says only, 'You're back. Good.'"),
            [setv("flag.v3_came_back"), setv("track", "liu"), rel("liubei", "trust", -1), rel("zhuge", "esteem", 1)]),
     choice("hermit", "expression", T("把信收好，不去了。", "Put the letter away. You won't go."),
            T("你把信压在枕下。那年冬天，你在集市上听说，刘备打下了汉中。", "You put the letter under your pillow. That winter, in the market, you hear that Liu Bei has taken Hanzhong."),
            [setv("flag.v3_hermit")])],
    when=AWAY, order=-2))
N[-1]["choices"][1]["ends"] = True

# ---------- c1 讨荆州 ----------
N.append(node("c1_jin", "c1", "main", T("诸葛瑾哭诉", "Zhuge Jin's Tears"), "functional", T("第66回", "Ch. 66"),
    [P(T("诸葛瑾跪在弟弟面前哭：孙权把他一家老小都关了起来，讨不回荆州，全家就没命了。诸葛亮也哭了，转身去求刘备。散了帐，诸葛亮把你留下：『子衡兄，这件事，你怎么看？』",
         "Zhuge Jin kneels before his brother and weeps: Sun Quan has locked up his whole family, and if he can't bring Jingzhou back they all die. Zhuge Liang weeps too, and goes to plead with Liu Bei. After the council he keeps you back. 'Ziheng, what do you make of this?'")),
     P(T("你刚回来，帐里的人还在看你会站在哪一边。", "You've only just come back, and the tent is still watching to see which side you'll take."), F("flag.v3_came_back")),
     P(T("你在成都城西的小院里住了一年，这是第一次被留下来议这么大的事。", "You've lived a year in your little house on the west side of Chengdu; this is the first time you've been kept back for something this big."), F("flag.post_chengdu")),
     P(T("当年你什么都没要。刘备记着，所以这一回，他第一个想到的是你。", "Back then you asked for nothing. Liu Bei remembers, and so this time you're the first one he thinks of."), F("flag.post_none"))],
    [choice("trick", "strategy", T("献计：答应先还长沙、零陵、桂阳三郡，写信给关将军——关将军不认，东吴也说不出什么。", "Propose a trick: agree to return Changsha, Lingling and Guiyang, and write to General Guan about it. If General Guan refuses, Wu can hardly complain."),
            T("诸葛亮笑了：『和亮想的一样。』诸葛瑾拿着刘备的信去了荆州，被关羽骂了回来，又回成都，刘备又写信……来回几趟，孙权明白了，诸葛瑾也明白了。他走的时候没有看你。",
              "Zhuge Liang smiles. 'Exactly what I had in mind.' Zhuge Jin takes Liu Bei's letter to Jingzhou and is cursed out by Guan Yu; back to Chengdu, another letter… After a few rounds Sun Quan understands, and so does Zhuge Jin. He doesn't look at you as he leaves."),
            [setv("flag.jin_trick"), rel("zhuge", "esteem", 1), rel("lusu", "trust", -1), add("renown.cunning")], echo=["e_jin"]),
     choice("honest", "dilemma", T("劝主公真还三郡：西川到手了，荆州的约该守了。", "Urge your lord to truly hand back three commanderies: we have the west now, and the Jingzhou agreement should be kept."),
            T("刘备犹豫了很久，最后亲笔写了交割文书，让关平护送诸葛瑾去荆州。关羽看着文书，把它拍在案上：『大哥既然答应了，关某照办。』东吴的人这回是笑着走的。",
              "Liu Bei hesitates a long time, then writes the transfer documents in his own hand and has Guan Ping escort Zhuge Jin to Jingzhou. Guan Yu looks at the papers and slaps them on the table. 'If my brother has agreed, I'll do it.' This time Wu's men leave smiling."),
            [setv("flag.jin_honest"), rel("lusu", "trust", 2), rel("guanyu", "esteem", -1), rel("liubei", "trust", 1), add("renown.loyal"), add("deviation")], echo=["e_three"]),
     choice("plain", "strategy", T("直说：荆州迟早要出事。与其拖着，不如现在就和东吴划清地界。", "Say it plainly: Jingzhou will cause trouble sooner or later. Better to draw a clear line with Wu now than drag it out."),
            T("诸葛亮的扇子停了：『迟早要出事——子衡兄指的是哪一件？』你没有回答。他也没有再问。", "Zhuge Liang's fan stops. 'Trouble sooner or later—which trouble do you mean, Ziheng?' You don't answer. He doesn't ask again."),
            [add("uncanny"), rel("zhuge", "trust", -1), rel("zhuge", "esteem", 1)], foresight=True)],
    callbacks=[cb("e_lusu", T("你想起那张约。鲁肃一直留着它。", "You think of that agreement. Lu Su has kept it all this time."), F("flag.promised_return")),
               cb("e_liuqi", T("诸葛瑾说：『当年说荆州归刘琦公子。公子不在已经好几年了。』", "Zhuge Jin says, 'Back then you said Jingzhou belonged to the young lord Liu Qi. He has been gone for years.'"), F("flag.liuqi_pretext"))],
    when=ALL(CD, NF("flag.v3_hermit")), order=10))

N.append(node("c1_dandao", "c1", "main", T("单刀赴会", "The Meeting with a Single Sword"), "literal", T("第66回", "Ch. 66"),
    [P(T("鲁肃在陆口设宴，请关羽过江。人人都说这是鸿门宴。关羽只带了周仓和十几个随从，一口青龙刀，一叶小舟。", "Lu Su lays a feast at Lukou and invites Guan Yu across the river. Everyone says it's a trap. Guan Yu takes only Zhou Cang and a dozen attendants, his Green Dragon blade, and one small boat.")),
     P(T("临行前一夜，关羽来问你：『你说，鲁子敬会不会真动手？』", "The night before, Guan Yu comes to ask you, 'Do you think Lu Zijing will really try it?'")),
     P(T("你上回在鲁肃面前说的话，东吴那边传得很难听。", "What you said to Lu Su last time has been repeated in Wu, and not kindly."), I("lusu", "offended", ">=", 1))],
    [choice("guard", "dilemma", T("随他同去，按剑站在他身后。", "Go with him and stand behind him with your hand on your sword."),
            T("席上，鲁肃说起荆州，越说越急。关羽只是喝酒。周仓在阶下大喝一声，关羽夺过他手里的刀，喝他出去，又一手拉住鲁肃，装醉一路走到江边。东吴的伏兵怕伤了鲁肃，没有一个敢动。你跟着上了船，背上全是汗。关羽在船头大笑：『子衡，好胆！』",
              "At the feast Lu Su raises Jingzhou and grows more and more urgent. Guan Yu just drinks. Zhou Cang shouts from below the steps; Guan Yu snatches the blade from him, orders him out, then takes Lu Su by the hand and, playing drunk, walks him all the way to the river. Wu's hidden troops are afraid of hurting Lu Su, and not one of them moves. You follow onto the boat, your back soaked with sweat. At the prow Guan Yu roars with laughter. 'Ziheng, you've got nerve!'"),
            [setv("flag.dd_guard"), rel("guanyu", "warmth", 2), rel("guanyu", "esteem", 1), rel("lusu", "trust", -1), add("renown.loyal")], echo=["e_dandao"]),
     choice("lusu", "strategy", T("先过江一步，私下见鲁肃：荆州的事，在酒席上谈不出结果，何必逼关将军。", "Cross the river ahead of him and see Lu Su privately: nothing about Jingzhou will be settled over wine, so why corner General Guan?"),
            T("鲁肃叹气：『子衡，肃也不想这样。可吴侯天天问。』那天的宴席照旧剑拔弩张，可东吴的伏兵始终没有出来。鲁肃送关羽上船时，对你点了点头。",
              "Lu Su sighs. 'Ziheng, I don't want this either. But the Marquis asks me every day.' The feast is as tense as ever, but Wu's hidden troops never come out. When Lu Su sees Guan Yu to his boat, he nods to you."),
            [setv("flag.dd_lusu"), rel("lusu", "trust", 2), rel("lusu", "warmth", 1), rel("guanyu", "esteem", -1), add("renown.cunning")], echo=["e_lusu3"]),
     choice("warn", "expression", T("劝他不去：宴无好宴。", "Urge him not to go: no feast like this is meant kindly."),
            T("关羽捋着胡须笑了：『吾于千枪万刃之中、矢石交攻之际，匹马纵横，如入无人之境；岂忧江东群鼠乎！』他还是去了，也平安回来了。回来后，他没提你劝过他。", "Guan Yu strokes his beard and laughs: he has ridden alone through ten thousand spears and a hail of arrows as if no one were there; why should he fear the rats of the east? He goes anyway, and comes back safe. Afterward he never mentions that you tried to stop him."),
            [rel("guanyu", "esteem", -1), rel("guanyu", "warmth", 1)])],
    quote=T("酒至半酣，肃曰：“有一言诉与君侯，幸垂听焉。昔日令兄皇叔，使肃于吾主之前，保借荆州暂住，约于取西川之后归还。",
            "When the wine was half drunk, Su said, \"There is something I must say to you, my lord; I beg you to hear it. Your elder brother, the Imperial Uncle, once had me stand surety before my master for the loan of Jingzhou, to be returned once he had taken the west.\""),
    callbacks=[cb("e_lusu", T("鲁肃从怀里摸出那张约，放在席上，又收了回去。", "Lu Su takes the agreement out of his robe, lays it on the table, then puts it away again."), F("flag.promised_return")),
               cb("e_pleaded", T("关羽看了你一眼：『华容道上你求过我。今天，换我护着你。』", "Guan Yu glances at you. 'On the Huarong road you begged me. Today, I look after you.'"), F("flag.pleaded_guan"))],
    when=JING, order=10))

N.append(node("c1_clinic", "c1", "side", T("医馆", "The Clinic"), "free", T("原创人物", "original character"),
    [P(T("温芷在成都城西开了一间医馆。来看病的人越来越多，有一半付不起药钱。她问你：药铺的账，该怎么算？", "Wen Zhi has opened a clinic on the west side of Chengdu. More patients come every day, and half of them can't pay. She asks you how the accounts should be kept."), F("flag.wz_west")),
     P(T("温芷在关羽的营里做军医。最近伤兵不多，她在江陵城里开了一间小医馆。来看病的人越来越多，有一半付不起药钱。她问你：药铺的账，该怎么算？", "Wen Zhi is physician to Guan Yu's army. With few wounded lately, she has opened a small clinic in Jiangling. More patients come every day, and half of them can't pay. She asks you how the accounts should be kept."), F("flag.wz_jingzhou"))],
    [choice("free", "dilemma", T("穷人不收钱，缺的你来补。", "Charge the poor nothing; you'll make up the difference."),
            T("温芷看着你，好一会儿才说：『你的俸禄，够补吗？』你说够。其实不够。她后来知道了，也没说破。", "Wen Zhi looks at you for a long moment. 'Is your stipend enough to cover it?' You say yes. It isn't. She finds out later, and never says so."),
            [rel("wenzhi", "warmth", 1), rel("wenzhi", "intimacy", 1), add("renown.loyal")]),
     choice("ledger", "strategy", T("帮她立个规矩：药材按本钱收，诊金不收。", "Help her set a rule: charge for herbs at cost, nothing for the consultation."),
            T("医馆撑下来了。温芷在账本第一页写了你的名字，说是“立规矩的人”。", "The clinic keeps going. On the first page of the ledger, Wen Zhi writes your name: 'the one who made the rules.'"),
            [rel("wenzhi", "trust", 1), rel("wenzhi", "esteem", 1)]),
     choice("busy", "expression", T("说你最近太忙，让她自己拿主意。", "Say you're too busy lately; let her decide."),
            T("温芷点点头，没再问。", "Wen Zhi nods and doesn't ask again."), [rel("wenzhi", "warmth", -1)])],
    when=ANY(F("flag.wz_west"), F("flag.wz_jingzhou")), salience=3, order=1))
N[-1]["intro"].append(P(T("从赤壁那一夜起，她就没再离开过你身边的那座城。", "Since that night at Red Cliffs, she has never been far from whatever city you're in."), F("flag.wenzhi_with_you")))

N.append(node("c1_lusu_letter", "c1", "side", T("鲁肃的信", "A Letter from Lu Su"), "free", T("原创", "original"),
    T("单刀会之后，鲁肃托过江的商人给你捎来一封信，只有一句：『荆州的事，肃还想谈，只是不想在刀边上谈。』",
      "After the meeting, Lu Su sends you a letter by a merchant crossing the river. Just one line: 'I still want to talk about Jingzhou—only not at sword's edge.'"),
    [choice("reply", "strategy", T("回信：秋后你过江，私下谈。", "Write back: after the autumn you'll cross the river and talk privately."),
            T("鲁肃回了一个字：『好。』可那年秋天以后，你再也没收到过他的信。", "Lu Su replies with a single word: 'Good.' But after that autumn you never get another letter from him."),
            [rel("lusu", "trust", 1), rel("lusu", "warmth", 1)]),
     choice("show", "dilemma", T("把信拿给关羽看。", "Show the letter to Guan Yu."),
            T("关羽看完，把信扔进了火盆：『东吴的人，说话从来不算数。』", "Guan Yu reads it and tosses it into the brazier. 'Wu never keeps its word.'"),
            [rel("guanyu", "trust", 1), rel("lusu", "trust", -1)])],
    when=JING, salience=2, order=2))

# ---------- c2 得陇望蜀 ----------
N.append(node("c2_hanzhong", "c2", "main", T("汉中失守", "Hanzhong Falls"), "functional", T("第67回", "Ch. 67"),
    [P(T("刘备召集文武问计：曹操得了汉中，会不会乘势取西川？", "Liu Bei calls his officers together: now that Cao Cao has Hanzhong, will he press on into the west?")),
     P(T("法正站在你旁边，低声说：『主公在看你。』", "Fa Zheng, standing next to you, says quietly, 'Our lord is looking at you.'"))],
    [choice("envoy", "strategy", T("献计：派人去东吴，割江夏、长沙、桂阳三郡给孙权，请他出兵合肥，拖住曹操。", "Propose: send an envoy to Wu and cede Jiangxia, Changsha and Guiyang to Sun Quan, asking him to strike at Hefei and pin Cao Cao down."),
            T("伊籍去了江东。孙权果然得了三郡，北攻合肥。曹操回师救合肥，西川的围就解了。诸葛亮说：『子衡兄这一步，走得比亮还快。』",
              "Yi Ji goes east. Sun Quan takes the three commanderies and marches north on Hefei. Cao Cao turns back to save Hefei, and the threat to the west lifts. Zhuge Liang says, 'You moved faster than I did, Ziheng.'"),
            [setv("flag.xiang_envoy"), rel("zhuge", "esteem", 1), rel("liubei", "esteem", 1), rel("fazheng", "esteem", 1), add("renown.cunning")], echo=["e_xiang"]),
     choice("hold", "dilemma", T("劝主公一寸地也不让：曹操不会来。", "Urge your lord to give up no land at all: Cao Cao won't come."),
            T("刘备没有让地。曹操确实没来。可孙权也没有北上，荆州那边，东吴的兵船一天比一天多。", "Liu Bei cedes nothing. Cao Cao does not come. But neither does Sun Quan march north, and across from Jingzhou, Wu's warships grow more numerous every day."),
            [setv("flag.xiang_hold"), add("uncanny"), rel("fazheng", "esteem", 1), rel("zhuge", "trust", -1), add("deviation")], debt=["d_xiang"], foresight=True),
     choice("zhangfei", "strategy", T("劝主公先派张飞守住巴西，再议割地。", "Urge your lord to send Zhang Fei to hold Baxi first, and talk of ceding land later."),
            T("张飞领兵去了巴西。诸葛亮还是派了伊籍去江东：两手都要。你这一手，至少让成都睡了几天安稳觉。", "Zhang Fei leads troops to Baxi. Zhuge Liang still sends Yi Ji east: both hands at once. Your hand, at least, lets Chengdu sleep easy for a few nights."),
            [rel("liubei", "trust", 1), rel("zhuge", "esteem", 1)])],
    callbacks=[cb("e_three", T("东吴拿到了三郡，这回来的使者说话客气了许多。可孙权还是想要整个荆州。", "Wu has its three commanderies, and this time the envoy speaks politely. But Sun Quan still wants all of Jingzhou."), F("flag.jin_honest")),
               cb("e_jin", T("诸葛瑾那一趟白跑了。孙权正在气头上，三郡的事，只能拿别的来换了。", "Zhuge Jin's journey came to nothing. Sun Quan is furious; the three commanderies will have to be bought with something else."), F("flag.jin_trick"))],
    when=ALL(CD, NF("flag.v3_hermit")), order=10))

N.append(node("c2_xiang", "c2", "main", T("湘水分界", "The Xiang River Line"), "functional", T("第67回", "Ch. 67"),
    T("成都来了命令：长沙、江夏、桂阳三郡割给东吴，以湘水为界。关羽把命令看了三遍，问你：『大哥这是什么意思？』",
      "Orders arrive from Chengdu: Changsha, Jiangxia and Guiyang are to be ceded to Wu, with the Xiang River as the border. Guan Yu reads the order three times and asks you, 'What does my brother mean by this?'"),
    [choice("obey", "dilemma", T("劝他遵令：曹操得了汉中，西川要紧，得请东吴出兵合肥。", "Urge him to obey: Cao Cao has Hanzhong, the west is in danger, and Wu must be brought to strike at Hefei."),
            T("关羽沉着脸交割了三郡。孙权北攻合肥，曹操果然回师。关羽对你说：『这一次，听你的。下一次，未必。』", "Guan Yu hands over the three commanderies with a grim face. Sun Quan marches on Hefei, and Cao Cao turns back as expected. Guan Yu tells you, 'This time I listened to you. Next time, maybe not.'"),
            [setv("flag.xiang_obey"), rel("guanyu", "esteem", -1), rel("guanyu", "trust", 1), rel("liubei", "trust", 1)], echo=["e_xiang"]),
     choice("bargain", "strategy", T("帮他据理力争：江夏本是刘琦的，不在其中。少割一郡。", "Help him argue it: Jiangxia was Liu Qi's and shouldn't be on the list. Cede one less."),
            T("诸葛瑾争了三天，最后只拿走了长沙、桂阳。关羽很满意。东吴不太满意。", "Zhuge Jin argues for three days and in the end takes only Changsha and Guiyang. Guan Yu is pleased. Wu is not."),
            [setv("flag.xiang_bargain"), rel("guanyu", "esteem", 1), rel("lusu", "trust", -1), add("renown.cunning")]),
     choice("letter", "dilemma", T("替他写信给主公，请收回成命。", "Write to your lord on his behalf and ask that the order be withdrawn."),
            T("刘备的回信很短：『二弟所言亦是。』三郡没有割。关羽拍着你的肩膀：『还是你懂我。』江对岸，东吴的兵船越来越多。", "Liu Bei's reply is short: 'My brother has a point.' The commanderies stay. Guan Yu slaps your shoulder. 'You're the one who understands me.' Across the river, Wu's warships grow more numerous."),
            [setv("flag.xiang_letter"), rel("guanyu", "warmth", 2), rel("liubei", "trust", -1), add("deviation")], debt=["d_xiang"])],
    when=JING, order=10))

N.append(node("c2_fazheng", "c2", "side", T("法孝直的账", "Fa Xiaozhi's Accounts"), "free", T("第65回之后", "after Ch. 65"),
    T("法正做了蜀郡太守，当年得罪过他的人，一个个被他找了出来。有人来求你，请你劝劝法正。",
      "Fa Zheng has been made governor of Shu commandery, and one by one he is hunting down everyone who once wronged him. Someone comes to you and begs you to talk to him."),
    [choice("talk", "dilemma", T("去劝法正：主公刚得西川，人心未定。", "Go and reason with Fa Zheng: our lord has only just won the west, and people's hearts are not yet settled."),
            T("法正听完，笑了笑：『子衡说得对。』那天以后，他收敛了些。可你知道，那本账他还记着。", "Fa Zheng hears you out and smiles. 'You're right, Ziheng.' After that he eases off somewhat. But you know he still keeps the ledger."),
            [rel("fazheng", "trust", 1), rel("fazheng", "warmth", 1), add("renown.loyal")]),
     choice("zhuge", "strategy", T("去找诸葛亮，请军师出面。", "Go to Zhuge Liang and ask him to step in."),
            T("诸葛亮摇摇头：『孝直于主公有大功，亮不便多说。』这件事最后不了了之。法正知道你去找过军师。", "Zhuge Liang shakes his head. 'Xiaozhi has done our lord great service. It's not for me to say.' The matter is dropped. Fa Zheng knows you went to the strategist."),
            [rel("fazheng", "trust", -1), rel("zhuge", "trust", 1)]),
     choice("leave", "expression", T("不管。这是他的事。", "Stay out of it. It's his business."),
            T("求你的人走了。后来你听说，他也被法正找了出来。", "The man who begged you leaves. Later you hear that Fa Zheng found him too."), [rel("fazheng", "esteem", 1)])],
    when=CD, salience=2, order=1))

N.append(node("c2_wz_letter", "c2", "side", T("家书", "A Letter Home"), "free", T("原创人物", "original character"),
    [P(T("温芷托人捎来一封信。信里说医馆的事、说药价、说那边的雨，最后一行写：『你那边冷，多穿件衣服。』", "Wen Zhi sends a letter. It talks about the clinic, the price of herbs, the rain where she is, and on the last line: 'It's cold where you are. Wear something warm.'"), WZ_FAR),
     P(T("温芷就在城里，可最近你们见面的时候不多。她托人给你捎来一句话：『晚上来吃饭。』", "Wen Zhi is right here in the city, but you've hardly seen each other lately. She sends a message: 'Come to dinner tonight.'"), WZ_NEAR)],
    [choice("go", "dilemma", T("放下手上的事，去见她。", "Put down what you're doing and go to her."),
            T("你在她的灯下坐到半夜。她什么也没问，你也什么都没说。走的时候，她把一包药塞进你袖子里。", "You sit under her lamp until midnight. She asks nothing; you say nothing. As you leave, she tucks a packet of medicine into your sleeve."),
            [rel("wenzhi", "intimacy", 1), rel("wenzhi", "warmth", 1)], when=WZ_NEAR),
     choice("write", "dilemma", T("给她回一封长信。", "Write her a long letter back."),
            T("你写了三页，撕了两页。寄出去的那一页，只说了你这边的雨。", "You write three pages and tear up two. The page you send talks only about the rain where you are."),
            [rel("wenzhi", "intimacy", 1), rel("wenzhi", "trust", 1)], when=WZ_FAR),
     choice("later", "expression", T("等忙完这阵子再说。", "Wait until things are less busy."),
            T("这阵子一直没有忙完。", "Things never get less busy."), [rel("wenzhi", "warmth", -1)])],
    when=WZ, salience=3, order=2))

# ---------- c3 瓦口 ----------
N.append(node("c3_wakou", "c3", "main", T("瓦口", "Wakou Pass"), "functional", T("第70回", "Ch. 70"),
    [P(T("前方来报：张飞在瓦口关前天天喝酒，喝醉了还在阵前骂张郃。刘备大惊，要罢他的兵。诸葛亮却笑着让人送去五十瓮好酒，旗上写着“军前公用美酒”。刘备转头问你。",
         "Word comes from the front: at Wakou Pass, Zhang Fei drinks every day and, drunk, curses Zhang He before the lines. Liu Bei is alarmed and wants to relieve him. Zhuge Liang, smiling, has fifty jars of good wine sent to him under a banner reading 'Fine Wine for the Army.' Liu Bei turns to you.")),
     P(T("你记得张飞以前喝醉误过事。你也记得，他后来学会了用计。", "You remember Zhang Fei losing a city once when he was drunk. You also remember that he learned, later, to use tricks."), V("uncanny", ">=", 2))],
    [choice("calm", "strategy", T("请主公放心：翼德这是诈醉，是在诱张郃出来。", "Tell your lord not to worry: Yide is pretending, to lure Zhang He out."),
            T("几天后战报到了：张飞假装酒醉，张郃果然夜里来劫寨，中了埋伏，丢了瓦口关。刘备大喜，说：『子衡和军师，一个看透了翼德，一个看透了张郃。』",
              "A few days later the report arrives: Zhang Fei played drunk, Zhang He came to raid his camp by night, walked into the ambush, and lost Wakou Pass. Liu Bei is delighted. 'Ziheng and the strategist—one saw through Yide, the other saw through Zhang He.'"),
            [rel("zhuge", "esteem", 1), rel("liubei", "esteem", 1)]),
     choice("go", "dilemma", T("自请去瓦口，陪着张飞。", "Ask to go to Wakou and stay with Zhang Fei."),
            T("你在瓦口陪张飞喝了七天的“酒”——瓮里一半是水。第八天夜里，张郃来了。张飞骑在马上冲你大笑：『先生陪俺演得好！』",
              "You spend seven days 'drinking' with Zhang Fei at Wakou—half of every jar is water. On the eighth night Zhang He comes. Zhang Fei, on horseback, roars at you with laughter. 'You played your part well, sir!'"),
            [setv("flag.wakou_go"), rel("liubei", "trust", 1), add("renown.loyal")], echo=["e_wakou"]),
     choice("agree", "expression", T("附和主公：阵前醉酒，不可不防。", "Agree with your lord: drunkenness at the front must be guarded against."),
            T("诸葛亮看了你一眼，没说话。几天后瓦口的捷报传来，刘备笑着摇头：『是我们多虑了。』", "Zhuge Liang glances at you and says nothing. A few days later news of the victory at Wakou arrives, and Liu Bei shakes his head, smiling. 'We worried for nothing.'"),
            [rel("zhuge", "esteem", -1)])],
    callbacks=[cb("e_xiang", T("孙权在合肥吃了大亏，可三郡到手，他没有怨言。诸葛亮说：『这一步，子衡兄走对了。』", "Sun Quan took a beating at Hefei, but with the three commanderies in hand he has no complaints. Zhuge Liang says, 'That move of yours was right, Ziheng.'"), F("flag.xiang_envoy"))],
    on_enter=[{"when": DEBT("d_xiang"), "effects": [], "resolve": [("d_xiang", "reroute")],
               "text": T("三郡没有割。可孙权还是北上合肥了——曹操得了汉中，他怕下一个就是江东。逍遥津一战，张辽杀得东吴人心惊胆战，曹操也顾不上西川了。",
                         "The commanderies were never ceded. But Sun Quan marches on Hefei anyway: with Hanzhong in Cao's hands, he fears the east is next. At Xiaoyao Ford Zhang Liao fills Wu with terror, and Cao Cao has no attention to spare for the west.")}],
    when=ALL(CD, NF("flag.v3_hermit")), order=10))

N.append(node("c3_report", "c3", "main", T("成都来的战报", "News from the West"), "free", T("第70回", "Ch. 70"),
    [P(T("战报说：张飞假装喝醉，赚得张郃丢了瓦口关；黄忠、严颜两个老将，夺了天荡山。关羽看完，先是大笑，笑着笑着停了下来。",
         "The report says Zhang Fei played drunk and tricked Zhang He out of Wakou Pass; and two old generals, Huang Zhong and Yan Yan, have taken Mount Tiandang. Guan Yu reads it and laughs aloud—then, mid-laugh, stops.")),
     P(T("他把战报递给你，指着黄忠的名字。", "He hands you the report and points at Huang Zhong's name."))],
    [choice("laugh", "expression", T("跟着他笑张飞：三将军也会用计了。", "Laugh with him about Zhang Fei: even the Third General uses tricks now."),
            T("关羽笑道：『翼德粗中有细，我一向知道。』他把战报收起来，没再提黄忠。", "Guan Yu laughs. 'Yide was never as crude as he looks; I've always known it.' He puts the report away and doesn't mention Huang Zhong again."),
            [rel("guanyu", "warmth", 1)]),
     choice("old", "dilemma", T("说：黄将军七十岁还能开二石弓，难得。", "Say: General Huang still draws a heavy bow at seventy. That's rare."),
            T("关羽看了你一眼：『你倒很看得起他。』他没再说什么。", "Guan Yu looks at you. 'You think a great deal of him.' He says nothing more."),
            [rel("guanyu", "esteem", -1), rel("huangzhong", "esteem", 1)]),
     choice("north", "strategy", T("把话头引到北边：汉中打得热闹，曹仁在樊城会不会动。", "Turn the talk north: with Hanzhong in an uproar, will Cao Ren move at Fancheng?"),
            T("关羽的眼睛亮了：『你也想到樊城了？』那天晚上，他把襄樊的地图摊开看到半夜。", "Guan Yu's eyes light up. 'You've thought of Fancheng too?' That night he spreads out the map of Xiangyang and Fancheng and studies it until midnight."),
            [rel("guanyu", "esteem", 1), add("renown.cunning")])],
    callbacks=[cb("e_xiang", T("关羽指着战报上“合肥”两个字：『三郡换来的。』他没说值不值。", "Guan Yu points at the word 'Hefei' in the report. 'That's what the three commanderies bought.' He doesn't say whether it was worth it."), ANY(F("flag.xiang_obey"), F("flag.xiang_bargain")))],
    on_enter=[{"when": DEBT("d_xiang"), "effects": [], "resolve": [("d_xiang", "reroute")],
               "text": T("三郡没有割。可孙权还是北上合肥了——曹操得了汉中，他怕下一个就是江东。逍遥津一战，张辽杀得东吴人心惊胆战。江对岸的兵船少了一半。",
                         "The commanderies were never ceded. But Sun Quan marches on Hefei anyway: with Hanzhong in Cao's hands, he fears the east is next. At Xiaoyao Ford Zhang Liao fills Wu with terror. Across the river, half the warships are gone.")}],
    when=JING, order=10))

N.append(node("c3_goad", "c3", "side", T("激将", "Goading the Old General"), "functional", T("第70回", "Ch. 70"),
    T("张郃又来攻葭萌关。黄忠请战，诸葛亮却说：『老将军年纪大了，恐怕不是张郃的对手。』黄忠气得须发直竖。诸葛亮朝你使了个眼色。",
      "Zhang He attacks Jiameng Pass again. Huang Zhong asks to fight, and Zhuge Liang says, 'You're old, General. I fear you're no match for Zhang He.' Huang Zhong's hair and beard bristle with rage. Zhuge Liang gives you a look."),
    [choice("goad", "strategy", T("接着军师的话说：老将军还是在家养养身子。", "Pick up where the strategist left off: the old general should rest at home."),
            T("黄忠当场拉断了两张硬弓，提刀就走，连夜斩了韩浩、夏侯德。回来时他瞪了你一眼：『先生，老夫这身子，养好了没有？』诸葛亮笑得扇子都拿不稳。",
              "Huang Zhong snaps two stiff bows on the spot, takes up his blade and goes, and by morning has cut down Han Hao and Xiahou De. On his return he glares at you. 'Well, sir—is my health restored?' Zhuge Liang laughs so hard he can barely hold his fan."),
            [setv("flag.hz_goaded"), rel("huangzhong", "esteem", 1), rel("huangzhong", "warmth", -1), rel("zhuge", "esteem", 1)], echo=["e_goad"]),
     choice("back", "dilemma", T("替黄忠说话：廉颇八十，尚食斗米。", "Speak up for Huang Zhong: Lian Po could still eat a peck of rice at eighty."),
            T("黄忠一把抓住你的手：『先生知我！』他还是去了，还是赢了。诸葛亮事后摇头：『子衡兄，你把亮的激将法拆了。』", "Huang Zhong grabs your hand. 'You understand me, sir!' He goes anyway, and wins anyway. Afterward Zhuge Liang shakes his head. 'Ziheng, you've spoiled my goading.'"),
            [setv("flag.hz_backed"), rel("huangzhong", "warmth", 2), rel("huangzhong", "trust", 1), rel("zhuge", "esteem", -1)], echo=["e_hz"])],
    when=CD, salience=2, order=1))

N.append(node("c3_guanping", "c3", "side", T("关平习字", "Guan Ping's Calligraphy"), "free", T("原创", "original"),
    T("关羽的儿子关平找到你，请你教他写字：『父亲说，先生的字比军中所有人都好。』",
      "Guan Yu's son Guan Ping comes to you and asks you to teach him calligraphy. 'Father says your hand is better than anyone's in the army.'"),
    [choice("teach", "dilemma", T("教他。从《春秋》抄起。", "Teach him. Start by copying the Spring and Autumn Annals."),
            T("关平学得很认真。关羽有一次路过，站在门外看了很久，没有进来。", "Guan Ping studies hard. Once Guan Yu passes by and stands outside the door watching for a long time, without coming in."),
            [rel("guanyu", "warmth", 2), rel("guanyu", "trust", 1)]),
     choice("art_of_war", "strategy", T("不教写字，教他读兵书。", "Teach him the art of war instead of calligraphy."),
            T("关平学得飞快。关羽知道了，说：『也好。字写得再好，守不住城。』", "Guan Ping learns fast. When Guan Yu hears, he says, 'Fine. The finest hand in the world won't hold a city.'"),
            [rel("guanyu", "esteem", 1), add("renown.cunning")])],
    when=JING, salience=1, order=2))

# ---------- c4 定军山 ----------
N.append(node("c4_dingjun", "c4", "main", T("定军山", "Mount Dingjun"), "literal", T("第71回", "Ch. 71"),
    [P(T("法正占了定军山西边的对山，从山上能看清夏侯渊营里的一举一动。他对黄忠说：我举白旗，你按兵不动；等他们倦了，我举红旗，你就冲下去。你跟着上了对山。",
         "Fa Zheng has taken the hill facing Mount Dingjun from the west; from there every movement in Xiahou Yuan's camp is plain to see. He tells Huang Zhong: while I raise the white flag, hold still; when they tire, I'll raise the red, and you charge. You go up the hill with them.")),
     P(T("黄忠看见你，笑了：『先生又来看老夫养身子？』", "Huang Zhong sees you and grins. 'Come to see if the old man's resting, sir?'"), F("flag.hz_goaded")),
     P(T("黄忠拍着你的肩膀：『先生在，老夫心里踏实。』", "Huang Zhong claps your shoulder. 'With you here, sir, I feel steady.'"), F("flag.hz_backed")),
     P(T("法正看见你，脸色淡淡的。你上回的话，他记在账上了。", "Fa Zheng's face is cool when he sees you. What you said last time has gone into his ledger."), I("fazheng", "offended", ">=", 1))],
    [choice("flags", "strategy", T("留在法正身边，替他看着夏侯渊的营。", "Stay beside Fa Zheng and watch Xiahou Yuan's camp for him."),
            T("从清早骂到午后，曹兵骂累了，下马坐在地上。你碰了碰法正的袖子。法正举起红旗，黄忠一马当先冲下山去，一刀把夏侯渊砍成两段。法正回头看你：『你的眼睛，比我的准。』",
              "From dawn to afternoon the Cao men shout insults, until, worn out, they dismount and sit on the ground. You touch Fa Zheng's sleeve. He raises the red flag; Huang Zhong charges down the slope at the head of his men and cuts Xiahou Yuan in two with a single stroke. Fa Zheng turns to you. 'Your eyes are better than mine.'"),
            [setv("flag.dj_flags"), rel("fazheng", "esteem", 2), rel("fazheng", "trust", 1), rel("huangzhong", "esteem", 1)], echo=["e_flags"]),
     choice("charge", "dilemma", T("跟黄忠一起冲下山。", "Charge down the hill with Huang Zhong."),
            T("红旗一举，你跟着黄忠冲进了曹营。乱军中一支箭擦着你的头盔飞过。等你回过神来，夏侯渊已经倒在地上，黄忠的刀还在滴血。他大笑着把你拉上马：『先生不怕死，老夫喜欢！』",
              "When the red flag goes up you charge into Cao's camp behind Huang Zhong. In the melee an arrow grazes your helmet. By the time you come to yourself Xiahou Yuan is on the ground and Huang Zhong's blade is dripping. Laughing, he hauls you up onto his horse. 'You're not afraid to die, sir. I like that!'"),
            [setv("flag.dj_charge"), rel("huangzhong", "warmth", 2), rel("huangzhong", "esteem", 2), KEY(rel("liubei", "trust", 1)), add("renown.loyal")], echo=["e_charge"]),
     choice("wait", "expression", T("劝黄忠再等一等：夏侯渊还没真倦。", "Urge Huang Zhong to wait a little longer: Xiahou Yuan isn't truly tired yet."),
            T("黄忠急得直跺脚。法正没有听你的，照旧举了红旗。夏侯渊还是死在了那一刀下。黄忠后来跟人说：『那个先生，胆子小了点。』",
              "Huang Zhong stamps with impatience. Fa Zheng doesn't listen to you, and raises the red flag as planned. Xiahou Yuan still dies under that blade. Afterward Huang Zhong tells people, 'That gentleman's a bit timid.'"),
            [rel("huangzhong", "esteem", -1), rel("fazheng", "esteem", -1)])],
    quote=T("法正在山上举起白旗；任从夏侯渊百般辱骂，黄忠只不出战。……黄忠宝刀已落，连头带肩，砍为两段。",
            "Fa Zheng raised the white flag on the hill; however Xiahou Yuan cursed and taunted, Huang Zhong would not come out. … Huang Zhong's blade came down, and cut him through head and shoulder, in two."),
    callbacks=[cb("e_goad", T("黄忠冲下山前回头冲你喊了一声：『先生看好了！』", "Before he charges, Huang Zhong looks back and shouts, 'Watch closely, sir!'"), F("flag.hz_goaded")),
               cb("e_wakou", T("张飞从瓦口派人送来一坛酒，坛上写着：“给先生，这回是真酒。”", "Zhang Fei sends a jar of wine from Wakou, labeled: 'For the gentleman. Real wine this time.'"), F("flag.wakou_go")),
               cb("e_weiyan", T("魏延也在阵中。他看见你，远远抱了抱拳。", "Wei Yan is in the line too. Seeing you, he clasps his hands to you from afar."), F("flag.pleaded_weiyan"))],
    when=ALL(CD, NF("flag.v3_hermit")), order=10))

N.append(node("c4_laozu", "c4", "main", T("老卒", "An Old Soldier"), "functional", T("第71回之后", "after Ch. 71"),
    [P(T("黄忠斩了夏侯渊，蜀中人人都说他老当益壮。消息传到荆州，关羽正在宴客。席上有人跟着夸黄忠，关羽把酒杯放下了。", "Huang Zhong has killed Xiahou Yuan, and all Shu is saying he's as fierce as a young man. When the news reaches Jingzhou, Guan Yu is giving a banquet. Someone at the table joins in praising Huang Zhong, and Guan Yu puts down his cup.")),
     P(T("满座的人都看着你。", "The whole table is looking at you."))],
    [choice("praise", "dilemma", T("照实说：黄将军这一刀，确实了得。", "Say it straight: General Huang's stroke was truly something."),
            T("关羽冷冷地看着你：『你在荆州吃饭，倒替汉中的人说话。』散席后他没让你送。", "Guan Yu looks at you coldly. 'You eat in Jingzhou and speak for Hanzhong.' When the party breaks up, he doesn't let you see him out."),
            [setv("flag.praised_hz"), rel("guanyu", "warmth", -1), add("imp.guanyu.offended"), rel("huangzhong", "esteem", 1)], echo=["e_praise_hz"]),
     choice("agree", "expression", T("附和他：一个老卒，碰巧罢了。", "Go along with him: an old soldier who got lucky, that's all."),
            T("关羽大笑，举杯敬你。你喝下那杯酒的时候，想起了“骄”这个字。", "Guan Yu laughs and raises his cup to you. As you drink, you think of the word 'pride.'"),
            [setv("flag.fed_pride"), rel("guanyu", "warmth", 1), add("renown.rash")], echo=["e_pride"]),
     choice("turn", "strategy", T("把话岔开：汉中打得热闹，正是荆州的机会。", "Change the subject: with Hanzhong in an uproar, this is Jingzhou's chance."),
            T("关羽的眉头松开了：『你说得对。』席上的话题转到了樊城。", "Guan Yu's brow eases. 'You're right.' The talk at the table turns to Fancheng."),
            [rel("guanyu", "esteem", 1)])],
    when=JING, order=10))

N.append(talk_node("c4_fazheng", "c4", T("夜谈·法正", "Night Talk: Fa Zheng"),
    T("定军山下的营里，法正一个人在灯下看地图。他听见你进来，没抬头：『坐。』", "In the camp below Mount Dingjun, Fa Zheng studies a map alone by lamplight. Hearing you come in, he doesn't look up. 'Sit.'"),
    "fazheng", 2,
    [topic("debt", T("问他：当年得罪过你的人，你都记着？", "Ask him: do you remember everyone who ever wronged you?"),
           T("法正笑了：『一个都没忘。帮过我的人，我也一个都没忘。』他看了你一眼，『子衡，你是哪一种？』", "Fa Zheng smiles. 'Not one. And not one of those who helped me, either.' He glances at you. 'Which kind are you, Ziheng?'"),
           [rel("fazheng", "warmth", 1)]),
     topic("hanzhong", T("问他：拿下汉中之后呢？", "Ask him: after Hanzhong, what then?"),
           T("法正用指头在地图上从汉中划到长安：『这一步走成了，就是高祖的路。』他的手停在长安，没有再往前。", "Fa Zheng traces a line on the map from Hanzhong to Chang'an. 'Get this step right, and it's the road the Founder took.' His finger stops at Chang'an and goes no further."),
           [rel("fazheng", "esteem", 1)]),
     topic("health", T("劝他保重身体：你的咳嗽一直没好。", "Tell him to look after himself: that cough of his has never gone away."),
           T("法正愣了一下，摆摆手：『打完这一仗再说。』他咳了两声，又低头看地图。", "Fa Zheng pauses, then waves it off. 'After this battle.' He coughs twice and goes back to his map."),
           [rel("fazheng", "warmth", 1), rel("fazheng", "trust", 1)])],
    T("法正送你到帐门口：『明天在山上，你站我旁边。』", "Fa Zheng walks you to the tent flap. 'Tomorrow on the hill, stand beside me.'"), when=CD, order=5))

N.append(node("c4_wz_wounded", "c4", "side", T("伤兵营", "The Wounded"), "free", T("原创人物", "original character"),
    [P(T("定军山之战后，伤兵一车一车地运回来。温芷三天没合眼。", "After the battle at Dingjun the wounded come back by the cartload. Wen Zhi hasn't closed her eyes in three days."), F("flag.wz_west")),
     P(T("关羽在江陵练兵，伤了不少人。温芷三天没合眼。", "Guan Yu's drills in Jiangling have injured a good many men. Wen Zhi hasn't closed her eyes in three days."), F("flag.wz_jingzhou"))],
    [choice("help", "dilemma", T("脱了外袍，帮她烧水、递药。", "Take off your outer robe and help her: boil water, hand her medicines."),
            T("你笨手笨脚，碰翻了一回药罐。温芷没骂你，只是在天亮时靠着你的肩膀睡着了一会儿。", "You're clumsy and knock over a medicine jar once. Wen Zhi doesn't scold you. Near dawn she falls asleep for a little while against your shoulder."),
            [rel("wenzhi", "intimacy", 1), rel("wenzhi", "warmth", 1)]),
     choice("rest", "strategy", T("去找主将，从军中调几个人来帮她。", "Go to the commander and get a few men assigned to help her."),
            T("第二天来了十个兵。温芷终于睡了一觉。醒来她说：『你总是这样，替我把事情安排好。』", "Ten soldiers arrive the next day. Wen Zhi finally sleeps. When she wakes she says, 'You always do this—arrange things for me.'"),
            [rel("wenzhi", "trust", 1), rel("wenzhi", "esteem", 1)])],
    when=ANY(F("flag.wz_west"), F("flag.wz_jingzhou")), salience=3, order=1))

# ---------- c5 汉水 ----------
N.append(node("c5_hanshui", "c5", "main", T("一身是胆", "All Courage"), "literal", T("第71回", "Ch. 71"),
    [P(T("黄忠去北山劫粮，过了约定的时辰还没回来。赵云带兵去接应，在乱军中救出了黄忠，一路杀回汉水边的营寨。曹操亲率大军追到寨前。你在寨里。",
         "Huang Zhong has gone to raid the grain at the northern hill and is long overdue. Zhao Yun rides out to bring him back, cuts him free in the thick of the fighting, and fights his way back to the camp on the Han River. Cao Cao himself pursues with his main army to the camp's very gate. You are inside.")),
     P(T("张翼要关寨门。赵云看着你。", "Zhang Yi wants to shut the gates. Zhao Yun looks at you."))],
    [choice("open", "strategy", T("劝赵云：大开寨门，偃旗息鼓。曹操多疑，必不敢进。", "Urge Zhao Yun: throw the gates open, lower the banners, silence the drums. Cao Cao is suspicious; he won't dare come in."),
            T("赵云一个人一杆枪立在寨门外。曹兵到了，看见寨门大开，不敢前进。一声梆子响，伏在壕里的弓弩齐发，曹兵自相践踏，退到汉水边，淹死无数。刘备第二天来看战场，说：『子龙一身都是胆也！』赵云说：『先生的主意。』",
              "Zhao Yun stands alone outside the open gate with his spear. Cao's men arrive, see the gate wide open, and dare not advance. A clapper sounds; the crossbowmen hidden in the trench loose together, and Cao's men trample one another in the retreat to the Han River, where countless drown. Next day Liu Bei comes to see the field. 'Zilong is all courage!' Zhao Yun says, 'It was the master's idea.'"),
            [setv("flag.hs_open"), rel("zhaoyun", "trust", 2), rel("zhaoyun", "esteem", 1), rel("liubei", "esteem", 1)], echo=["e_hanshui"]),
     choice("shut", "dilemma", T("劝赵云关门死守。", "Urge Zhao Yun to shut the gates and hold."),
            T("寨门关了。曹兵攻了一夜，没有攻破，也伤了不少人。天亮时赵云说：『先生稳妥。』他嘴上这么说，你看得出他另有主意。", "The gates close. Cao's men attack all night without breaking in, and plenty are hurt on both sides. At dawn Zhao Yun says, 'A safe choice, sir.' But you can tell he had a different idea."),
            [rel("zhaoyun", "esteem", -1)]),
     choice("trust", "expression", T("什么也不说：子龙自有主张。", "Say nothing: Zilong knows his own mind."),
            T("赵云大开寨门，单枪匹马立在门外。曹兵不敢前进，退的时候自相践踏。他回来时看了你一眼：『先生信我。』", "Zhao Yun throws the gate open and stands alone outside it. Cao's men dare not advance, and trample one another in the retreat. Coming back in, he looks at you. 'You trusted me, sir.'"),
            [rel("zhaoyun", "trust", 1)])],
    quote=T("寨门大开，二将不敢前进……玄德曰：“子龙一身都是胆也！”",
            "The camp gate stood wide open, and the two generals dared not advance. … Xuande said, \"Zilong is all courage!\""),
    callbacks=[cb("e_zy", T("赵云在寨门口低声对你说：『桂阳那回，先生懂我。这回，也请先生懂我。』", "At the gate Zhao Yun says quietly, 'At Guiyang you understood me. Understand me this time too.'"), F("flag.zy_refused")),
               cb("e_charge", T("黄忠被抬进寨里时还在笑：『定军山那回先生跟着我冲，这回换子龙了。』", "Carried into the camp, Huang Zhong is still laughing. 'At Dingjun you charged with me, sir. This time it's Zilong's turn.'"), F("flag.dj_charge"))],
    when=ALL(CD, NF("flag.v3_hermit")), order=10))

N.append(talk_node("c5_huangzhong", "c5", T("夜谈·黄忠", "Night Talk: Huang Zhong"),
    [P(T("汉水边的营里，黄忠的腿上缠着布，正在火边磨刀。他看见你，往旁边挪了挪。", "In the camp by the Han River, Huang Zhong sits by the fire sharpening his blade, his leg bound in cloth. Seeing you, he shifts aside to make room.")),
     P(T("他没抬头。你前些天的话，他还没消气。", "He doesn't look up. He's still sore about what you said the other day."), I("huangzhong", "offended", ">=", 1))],
    "huangzhong", 2,
    [topic("age", T("问他：七十岁了，还图什么？", "Ask him: at seventy, what are you still fighting for?"),
           T("黄忠想了很久：『图个名字。长沙城里的人都说我老了，我偏要让他们看看。』他摸着刀，『也图主公待我好。』", "Huang Zhong thinks a long time. 'For my name. In Changsha they all said I was finished. I mean to show them.' He strokes his blade. 'And because our lord treats me well.'"),
           [rel("huangzhong", "warmth", 1)]),
     topic("guan", T("说起关将军：他未必服你。", "Bring up General Guan: he may not think much of you."),
           T("黄忠哼了一声：『长沙城下，他放过我一回。我欠他的。他服不服我，不要紧。』", "Huang Zhong snorts. 'Under the walls of Changsha he spared me once. I owe him. Whether he rates me doesn't matter.'"),
           [rel("huangzhong", "esteem", 1), rel("huangzhong", "trust", 1)]),
     topic("bow", T("请他教你拉弓。", "Ask him to teach you to draw a bow."),
           T("黄忠哈哈大笑，把弓塞到你手里。你拉了三次，弓弦纹丝不动。他笑得眼泪都出来了：『先生还是拿笔吧！』", "Huang Zhong roars with laughter and pushes his bow into your hands. Three times you pull, and the string doesn't budge. He laughs until he cries. 'Stick to the brush, sir!'"),
           [rel("huangzhong", "warmth", 2)])],
    T("黄忠送你走时说：『先生，老夫这条命，打完汉中，就交给主公了。』", "As you leave, Huang Zhong says, 'Sir, once Hanzhong is won, this old life belongs to our lord.'"), when=CD, order=20))

N.append(talk_node("c5_guanyu", "c5", T("夜谈·关羽", "Night Talk: Guan Yu"),
    [P(T("江陵城头，关羽一个人看着北边。樊城的方向，有几点灯火。他听见你的脚步：『睡不着？我也是。』", "On the walls of Jiangling, Guan Yu stands alone looking north. Toward Fancheng there are a few points of light. He hears your step. 'Can't sleep? Nor can I.'")),
     P(T("你想起几年前他说过的那句话：『所以我不能丢。』", "You think of what he said years ago: 'That's why I can't lose it.'"), F("flag.guan_charge"))],
    "guanyu", 2,
    [topic("north", T("问他：想打樊城？", "Ask him: you want to take Fancheng?"),
           T("关羽没有否认：『大哥在汉中打得那么好。我在荆州，总不能一直守着。』", "Guan Yu doesn't deny it. 'My brother is doing so well at Hanzhong. I can't just keep watch in Jingzhou forever.'"),
           [rel("guanyu", "trust", 1)]),
     topic("east", T("提醒他：北伐之前，先稳住东吴。", "Warn him: before going north, make sure of Wu."),
           T("关羽皱眉：『军师也是这么说的。东和孙权，北拒曹操。』他沉默了一会儿，『这八个字，我记着。』", "Guan Yu frowns. 'The strategist said the same. Ally with Sun Quan in the east, hold off Cao Cao in the north.' He is silent a moment. 'I remember those eight characters.'"),
           [rel("guanyu", "esteem", 1)]),
     topic("daughter", T("问起他的女儿。", "Ask about his daughter."),
           T("关羽难得笑了：『像她娘，脾气倔。』他顿了顿，『将来要嫁人，也得嫁个配得上的。』", "Guan Yu smiles, which is rare. 'Takes after her mother. Stubborn.' A pause. 'When she marries, it'll have to be someone worthy of her.'"),
           [rel("guanyu", "warmth", 1)]),
     topic("huarong", T("说起华容道。", "Bring up Huarong."),
           [P(T("『那一跪，』关羽说，『我还记着。』他给你斟满了酒。", "'You knelt,' Guan Yu says. 'I still remember.' He fills your cup."), F("flag.vouched_guan")),
            P(T("『那一天你在道上求我，』关羽说，『我放了他。他如今是魏王了。』", "'That day on the road you begged me,' Guan Yu says, 'and I let him go. Now he's King of Wei.'"), F("flag.pleaded_guan")),
            P(T("关羽摇摇头：『那件事，不提了。』", "Guan Yu shakes his head. 'Let's not speak of that.'"), ALL(NF("flag.vouched_guan"), NF("flag.pleaded_guan")))],
           [rel("guanyu", "warmth", 1)])],
    T("关羽送你下了城楼：『荆州有你，我放心些。』", "Guan Yu walks you down from the wall. 'With you in Jingzhou, I rest a little easier.'"), when=JING, order=10))
N[-1]["callbacks"] = [cb("e_dandao", T("关羽说：『陆口那天，你站在我身后。我知道。』", "Guan Yu says, 'That day at Lukou, you stood behind me. I knew.'"), F("flag.dd_guard")),
                      cb("e_pride", T("关羽说：『那天席上你说得对。一个老卒罢了。』你没有接话。", "Guan Yu says, 'You were right that night at the feast. Just an old soldier.' You don't answer."), F("flag.fed_pride")),
                      cb("e_praise_hz", T("关羽说：『那天席上你夸黄忠，我心里不痛快。可你没说错。』", "Guan Yu says, 'When you praised Huang Zhong at the feast, I didn't like it. But you weren't wrong.'"), F("flag.praised_hz"))]

# ---------- c6 鸡肋 ----------
N.append(node("c6_jilei", "c6", "main", T("鸡肋", "Chicken Rib"), "literal", T("第72回", "Ch. 72"),
    [P(T("探子回报：曹营昨夜的口令，是“鸡肋”两个字。接着又报：曹营里有人在收拾行装。刘备问众人这是什么意思。",
         "Scouts report that last night's password in Cao's camp was two words: 'chicken rib.' Then another report: men in Cao's camp are packing their baggage. Liu Bei asks everyone what it means.")),
     P(T("魏延在帐下，等着请战。", "Wei Yan waits below the dais, ready to ask for battle."), F("flag.pleaded_weiyan"))],
    [choice("chase", "strategy", T("说：鸡肋者，食之无味，弃之可惜。曹操要退了，请派魏延追击。", "Say: a chicken rib has no meat worth eating and is a pity to throw away. Cao Cao means to retreat. Send Wei Yan after him."),
            T("魏延领兵追到斜谷，一箭射中曹操的人中，折了两颗门牙。曹操退兵时，身后的火光一直烧到天亮。刘备说：『子衡这两个字，听得比曹操自己还明白。』",
              "Wei Yan pursues to Xie Valley and puts an arrow into Cao Cao's face, knocking out two of his front teeth. As Cao withdraws, the fires behind him burn until dawn. Liu Bei says, 'Ziheng understood those two words better than Cao Cao did.'"),
            [setv("flag.jl_chase"), rel("liubei", "esteem", 1), rel("fazheng", "esteem", 1), add("renown.cunning")], echo=["e_jilei"]),
     choice("yangxiu", "dilemma", T("说：曹操要退。可这两个字，会要了一个人的命。", "Say: Cao Cao means to retreat. But these two words will cost a man his life."),
            T("众人面面相觑。几天后消息传来：曹操的主簿杨修，因为私下解说“鸡肋”，被曹操以惑乱军心的罪名斩了。诸葛亮看着你，什么也没说。",
              "Everyone looks at one another. A few days later news arrives: Cao Cao's secretary, Yang Xiu, has been executed for spreading his reading of 'chicken rib' and so unsettling the army. Zhuge Liang looks at you and says nothing."),
            [setv("flag.jl_yangxiu"), add("uncanny", 2), rel("zhuge", "trust", -1)], foresight=True, echo=["e_yangxiu"]),
     choice("careful", "expression", T("劝主公稳住：曹操诡计多端，不可轻追。", "Urge your lord to stay put: Cao Cao is full of tricks; don't pursue rashly."),
            T("刘备点头。可魏延等不及，自己领兵追了出去，射落了曹操两颗门牙。回来后，他看你的眼神有点得意。", "Liu Bei nods. But Wei Yan can't wait; he takes his own men in pursuit and shoots out two of Cao Cao's teeth. When he comes back, the look he gives you is a little smug."),
            [rel("liubei", "trust", 0)])],
    quote=T("正沉吟间，夏侯惇入帐，禀请夜间口号。操随口曰：“鸡肋！鸡肋！”……修曰：“鸡肋者，食之无味，弃之可惜。”",
            "As he pondered, Xiahou Dun came in to ask for the night's password. Cao said without thinking, \"Chicken rib! Chicken rib!\" … Xiu said, \"A chicken rib: there's no flavor in eating it, and it's a pity to throw it away.\""),
    callbacks=[cb("e_weiyan", T("魏延回来，在帐外对你说：『长沙那天先生替我说话。今天这一箭，算我还的。』", "Back from the pursuit, Wei Yan says to you outside the tent, 'At Changsha you spoke for me, sir. Today's arrow is my repayment.'"), F("flag.pleaded_weiyan")),
               cb("e_weiyan", T("你想起诸葛亮在长沙之后的安排：魏延每次出战，后面都多一支兵。今天也是。", "You remember Zhuge Liang's rule after Changsha: whenever Wei Yan goes out, another column follows. Today too."), F("flag.foresaw_weiyan"))],
    when=ALL(CD, NF("flag.v3_hermit")), order=10))

N.append(node("c6_mifang", "c6", "main", T("糜芳的酒", "Mi Fang's Wine"), "free", T("第73回之前", "before Ch. 73"),
    [P(T("糜芳请你喝酒。几杯下肚，他就开始抱怨：关将军从来看不起他，说他是靠着妹妹才有今天。", "Mi Fang invites you for a drink. A few cups in, he starts complaining: General Guan has always looked down on him, says he only got where he is because of his sister.")),
     P(T("他红着眼睛说：『我妹妹……是你在长坂坡救下来的。这些年，只有你把我当自己人。』", "Red-eyed, he says, 'My sister… it was you who saved her at Changban. All these years, you're the only one who's treated me as one of us.'"), F("flag.mi_saved")),
     P(T("他红着眼睛说：『我妹妹死在长坂坡那口井里。我们糜家把家产都给了主公，换来的是什么？』", "Red-eyed, he says, 'My sister died in that well at Changban. We Mi gave our whole fortune to our lord, and what did we get for it?'"), NF("flag.mi_saved"))],
    [choice("mend", "dilemma", T("答应他：找机会在关将军面前替他说话。", "Promise him you'll find a moment to speak for him to General Guan."),
            T("你找了个机会，跟关羽说糜芳守江陵有功。关羽淡淡地说：『他？』可那以后，关羽对糜芳说话，客气了一些。糜芳知道是你说的。",
              "You find a moment to tell Guan Yu that Mi Fang has done good work holding Jiangling. Guan Yu says coolly, 'Him?' But after that he speaks to Mi Fang a little more civilly. Mi Fang knows it was you."),
            [setv("flag.mf_mended"), rel("guanyu", "esteem", -1), add("renown.loyal")], echo=["e_mifang"]),
     choice("warn", "strategy", T("劝他收敛：这些话，在荆州不能说。", "Tell him to watch himself: in Jingzhou, he can't say these things."),
            T("糜芳酒醒了一半，连连点头。可他看你的眼神，像是看一个关羽那边的人。", "Mi Fang sobers up halfway and nods again and again. But the way he looks at you now, it's as if you're on Guan Yu's side."),
            [setv("flag.mf_warned"), add("renown.loyal")]),
     choice("tell", "dilemma", T("回去把这番话告诉关羽。", "Go back and tell Guan Yu what he said."),
            T("关羽听完，冷笑一声：『他也配有怨言？』第二天，他当众把糜芳骂了一顿。糜芳从帐里出来，看见了站在门口的你。",
              "Guan Yu hears you out and laughs coldly. 'He's entitled to complain?' The next day he berates Mi Fang in front of everyone. Coming out of the tent, Mi Fang sees you standing by the door."),
            [setv("flag.mf_told"), rel("guanyu", "trust", 1), add("renown.cunning")], echo=["e_mf_told"])],
    when=JING, order=10))

N.append(node("c6_zhaoyun", "c6", "side", T("子龙的家书", "Zilong's Letter"), "free", T("原创", "original"),
    T("赵云托你替他写一封家书——他不识几个字，又不愿让别人知道。", "Zhao Yun asks you to write a letter home for him—he can't write much and doesn't want anyone else to know."),
    [choice("write", "dilemma", T("照他说的，一字一字写。", "Write it word for word as he says it."),
            T("信很短：『家中一切安好否？子龙在汉中，平安。』写完，赵云把信折好，揣进了怀里。他说：『这件事，先生别跟人说。』", "The letter is short: 'Is all well at home? Zilong is at Hanzhong, and safe.' When it's done, Zhao Yun folds it and tucks it inside his armor. 'Don't tell anyone about this, sir.'"),
            [rel("zhaoyun", "warmth", 2), rel("zhaoyun", "trust", 1)]),
     choice("teach", "strategy", T("教他自己写。", "Teach him to write it himself."),
            T("赵云学得很慢，一封信写了三个晚上。写完，他看着自己的字笑了：『比枪难多了。』", "Zhao Yun learns slowly; the letter takes three evenings. When it's done he looks at his own writing and smiles. 'Much harder than a spear.'"),
            [rel("zhaoyun", "esteem", 1), rel("zhaoyun", "warmth", 1)])],
    when=CD, salience=1, order=1))

# ---------- c7 汉中王 ----------
N.append(node("c7_wang", "c7", "main", T("汉中王", "King of Hanzhong"), "functional", T("第73回", "Ch. 73"),
    [P(T("沔阳设坛，刘备即汉中王位。封赏完毕，诸葛亮把一份名单递给刘备：关羽、张飞、赵云、马超、黄忠，为五虎大将。刘备看了一遍，递给了你。",
         "An altar is built at Mianyang and Liu Bei takes the throne as King of Hanzhong. When the honors have been handed out, Zhuge Liang gives Liu Bei a list: Guan Yu, Zhang Fei, Zhao Yun, Ma Chao and Huang Zhong, the Five Tiger Generals. Liu Bei reads it and passes it to you.")),
     P(T("你看见黄忠的名字时，想起了关羽。", "When you see Huang Zhong's name, you think of Guan Yu.")),
     P(T("刘禅被立为王世子。他在人群里认出了你——截江那天，抱着他的人是你。", "Liu Shan is named Crown Prince. In the crowd he recognizes you: on the river that day, it was you who held him."), F("flag.adou_kept")),
     P(T("刘备看你的眼神有些淡。你说过的那些话，他还记着。", "Liu Bei's eyes are a little cool when they rest on you. He still remembers some of the things you've said."), I("liubei", "offended", ">=", 2))],
    [choice("list", "strategy", T("说：黄将军斩夏侯渊，当得起。", "Say: General Huang killed Xiahou Yuan. He has earned it."),
            T("刘备点头，名单就这么定了。诸葛亮说：『云长那边，得派个会说话的人去。』", "Liu Bei nods, and the list stands. Zhuge Liang says, 'We'll need to send someone with a gift for words to Yunchang.'"),
            [rel("huangzhong", "esteem", 1), rel("zhuge", "esteem", 1)]),
     choice("ask", "dilemma", T("劝主公先写信问过关将军，再定名单。", "Urge your lord to write to General Guan first, and settle the list after."),
            T("诸葛亮的扇子停了：『子衡兄想得周到。可王位已定，名单拖着，旁人会怎么想？』刘备还是听了你的，名单暂不公布。黄忠什么也没说，只是那几天话少了。",
              "Zhuge Liang's fan stops. 'Thoughtful of you, Ziheng. But the throne is already taken; if the list is held back, what will people think?' Liu Bei listens to you all the same, and the list is not announced. Huang Zhong says nothing, though for a few days he speaks less than usual."),
            [setv("flag.wh_ask"), rel("guanyu", "trust", 1), rel("huangzhong", "warmth", -1), rel("zhuge", "esteem", -1), add("deviation")], debt=["d_tiger"], echo=["e_tiger"]),
     choice("go", "dilemma", T("自请和费诗同去荆州送印。", "Ask to go to Jingzhou with Fei Shi to deliver the seal."),
            T("刘备看了你很久：『二弟最听你的。你去，我放心。』他把印绶亲手交给你。临行前，诸葛亮送到城门口：『子衡兄，荆州的事，多费心。』",
              "Liu Bei looks at you a long time. 'My brother listens to you more than anyone. If you go, I can rest easy.' He hands you the seal and ribbon himself. As you set out, Zhuge Liang walks you to the gate. 'Ziheng, take good care of Jingzhou.'"),
            [setv("flag.v3_to_jing"), KEY(rel("liubei", "trust", 1)), rel("guanyu", "warmth", 1), add("renown.loyal")], echo=["e_envoy"])],
    callbacks=[cb("e_hz", T("黄忠看见你，在人群里冲你咧嘴一笑。", "Huang Zhong spots you in the crowd and grins."), F("flag.hz_backed")),
               cb("e_flags", T("法正在你身边低声说：『定军山那面红旗，有你一半。』", "Fa Zheng says quietly at your side, 'Half that red flag on Mount Dingjun was yours.'"), F("flag.dj_flags")),
               cb("e_hanshui", T("赵云站在五虎将的位置上，朝你微微点了点头。", "Standing in his place among the Five Tigers, Zhao Yun gives you the slightest nod."), F("flag.hs_open")),
               cb("e_jilei", T("魏延捂着腮帮子笑：『曹贼那两颗门牙，先生也有份。』", "Wei Yan grins, a hand to his jaw. 'You had a share in those two teeth of Cao's, sir.'"), F("flag.jl_chase")),
               cb("e_yangxiu", T("有人说起杨修的死。诸葛亮朝你看了一眼。", "Someone mentions Yang Xiu's death. Zhuge Liang glances your way."), F("flag.jl_yangxiu"))],
    when=ALL(CD, NF("flag.v3_hermit")), order=10))

N.append(node("c7_feishi", "c7", "main", T("老卒为伍", "Ranked with an Old Soldier"), "literal", T("第73回", "Ch. 73"),
    [P(T("费诗说了五虎将的名字。关羽的脸色一下子变了，把印推了回去。", "Fei Shi names the Five Tigers. Guan Yu's face changes at once, and he pushes the seal back across the table.")),
     P(T("费诗朝你看了一眼。他知道你在这里。", "Fei Shi glances at you. He knows you're here."))],
    [choice("help", "strategy", T("帮费诗说话：萧何、曹参与高祖最亲，韩信是楚国的降将，却封王在他们之上。", "Back Fei Shi up: Xiao He and Cao Can were closest to the Founder, and Han Xin was a general who came over from Chu—yet he was made a king above them."),
            T("关羽沉默了很久，站起来接过了印：『若不是你们两个，几误大事。』费诗走的时候，偷偷对你作了个揖。", "Guan Yu is silent a long time, then stands and accepts the seal. 'If not for the two of you, I'd nearly have ruined things.' As Fei Shi leaves, he gives you a quiet bow."),
            [setv("flag.fs_helped"), rel("guanyu", "esteem", 1), KEY(rel("liubei", "trust", 1)), add("renown.loyal")], echo=["e_seal"]),
     choice("private", "dilemma", T("先附和关羽，散了席再私下劝。", "Agree with Guan Yu for now, and persuade him privately once the feast is over."),
            T("那天晚上你在关羽房里坐到三更。他终于叹了口气：『明天我就受印。』费诗等了一夜，第二天看见你，满眼血丝地笑了。", "That night you sit in Guan Yu's room until the third watch. At last he sighs. 'I'll take the seal tomorrow.' Fei Shi has waited up all night; seeing you the next morning, he smiles through bloodshot eyes."),
            [setv("flag.fs_private"), rel("guanyu", "warmth", 2), rel("guanyu", "trust", 1)], echo=["e_seal"]),
     choice("push", "dilemma", T("说：将军若不受，主公在汉中，怎么做人？", "Say: if you won't accept, how will our lord in Hanzhong face anyone?"),
            T("关羽的胡子抖了一下：『你拿大哥来压我？』他还是受了印，可从那以后，有好几天没跟你说话。", "Guan Yu's beard trembles. 'You use my brother against me?' He accepts the seal, but for several days afterward he doesn't speak to you."),
            [setv("flag.fs_pushed"), rel("guanyu", "warmth", -2), add("imp.guanyu.offended"), rel("liubei", "trust", 1)])],
    quote=T("云长怒曰：“翼德吾弟也；孟起世代名家；子龙久随吾兄，即吾弟也：位与吾相并，可也。黄忠何等人，敢与吾同列！大丈夫终不与老卒为伍！”遂不肯受印。",
            "Yunchang said angrily, \"Yide is my brother; Mengqi is of a great family; Zilong has followed my brother so long he is my brother too: for them to stand level with me is fair. But what sort of man is Huang Zhong, to be ranked with me? A real man will never stand in line with an old soldier!\" And he would not take the seal."),
    callbacks=[cb("e_pride", T("你想起那天席上说的“一个老卒罢了”。这句话，现在从关羽嘴里出来了。", "You remember saying, at that feast, 'an old soldier, that's all.' Now the words are coming out of Guan Yu's mouth."), F("flag.fed_pride")),
               cb("e_praise_hz", T("关羽瞥了你一眼：『你上回就替他说话。』", "Guan Yu glances at you. 'You spoke for him last time too.'"), F("flag.praised_hz"))],
    when=JING, order=10))

N.append(node("c8_wz_road", "c8", "side", T("温芷要来荆州", "Wen Zhi Means to Come"), "free", T("原创人物", "original character"),
    T("温芷听说你要去荆州，收拾了药箱：『荆州要打仗了，那边缺大夫。』",
      "Wen Zhi hears you're going to Jingzhou and packs her medicine chest. 'There'll be fighting in Jingzhou. They need physicians there.'"),
    [choice("come", "dilemma", T("留她在身边。", "Keep her with you."),
            T("她把药箱放在你的住处。夜里她说：『这次，你走到哪里，我就到哪里。』", "She sets her medicine chest down in your lodging. That night she says, 'This time, wherever you go, I go.'"),
            [setv("flag.wz_jingzhou"), setv("flag.wz_west", False), rel("wenzhi", "intimacy", 2)]),
     choice("stay", "strategy", T("劝她回成都：荆州太险。", "Urge her to go back to Chengdu: Jingzhou is too dangerous."),
            T("温芷看了你很久，背起了药箱：『那你答应我，活着回来。』", "Wen Zhi looks at you a long time, then shoulders her chest again. 'Then promise me you'll come back alive.'"),
            [rel("wenzhi", "trust", 1)])],
    when=ALL(TO_JING, F("flag.wz_west")), salience=4, order=1))
N[-1]["intro"] = [P(T("温芷听说你要留在荆州，从成都赶来了，药箱还背在身上：『荆州要打仗了，那边缺大夫。』", "Wen Zhi hears you're staying in Jingzhou and comes all the way from Chengdu, her medicine chest still on her back. 'There'll be fighting in Jingzhou. They need physicians.'"))]

N.append(node("c7_wz_jing", "c7", "side", T("城头的灯", "A Lamp on the Wall"), "free", T("原创人物", "original character"),
    T("温芷在城头给守夜的兵送药。你上去的时候，她正望着北边。", "Wen Zhi is taking medicine up to the night watch on the walls. When you come up, she's looking north."),
    [choice("stay", "dilemma", T("陪她站一会儿。", "Stand with her a while."),
            [P(T("她说：『关将军要北伐了，是不是？』你没说话。她把手放进你的手里。", "She says, 'General Guan is going north, isn't he?' You don't answer. She puts her hand in yours."), JING),
             P(T("她说：『汉中王了。你说，这一回，是不是快太平了？』你没说话。她把手放进你的手里。", "She says, 'A king now. Do you think peace is close this time?' You don't answer. She puts her hand in yours."), CD)],
            [rel("wenzhi", "intimacy", 1), rel("wenzhi", "warmth", 1)]),
     choice("tell", "strategy", T("跟她说实话：仗还要打很久。", "Tell her the truth: the fighting will go on a long time."),
            T("温芷摇摇头：『伤兵在哪里，大夫就在哪里。』", "Wen Zhi shakes her head. 'Where the wounded are, the physician is.'"),
            [rel("wenzhi", "esteem", 1), rel("wenzhi", "trust", 1)])],
    when=WZ_NEAR, salience=4, order=1))
N[-1]["intro"].append(P(T("赤壁江边你说过的那句话，她一直没有回答过。也一直没有忘。", "What you said to her by the river after Red Cliffs, she has never answered. Nor forgotten."), F("flag.confessed")))

# ---------- c8 虎女犬子 ----------
N.append(node("c8_huniu", "c8", "main", T("虎女犬子", "A Tiger's Daughter"), "literal", T("第73回", "Ch. 73"),
    [P(T("诸葛瑾到了荆州，说孙权有个儿子，听说关将军有个女儿，愿结两家之好，并力破曹。关羽的脸沉了下来。", "Zhuge Jin arrives in Jingzhou: Sun Quan has a son, he says, and has heard General Guan has a daughter; he would join the two houses and together break Cao Cao. Guan Yu's face darkens.")),
     P(T("你刚从成都赶到，汉中王的嘱咐还在耳边。", "You've only just arrived from Chengdu, the King of Hanzhong's instructions still in your ears."), TO_JING),
     P(T("诸葛瑾看见你，苦笑了一下：『又是你。』", "Zhuge Jin sees you and smiles ruefully. 'You again.'"), F("flag.xiang_letter")),
     P(T("诸葛瑾提起湘水分界：『那三郡，关将军守约了。吴侯记着。』", "Zhuge Jin mentions the Xiang River line. 'General Guan kept the agreement on the three commanderies. The Marquis remembers.'"), ANY(F("flag.xiang_obey"), F("flag.xiang_envoy"))),
     P(T("诸葛瑾提起湘水分界：『少了江夏，吴侯到现在还不痛快。』", "Zhuge Jin mentions the Xiang River line. 'Losing Jiangxia still rankles with the Marquis.'"), F("flag.xiang_bargain")),
     P(T("关羽受印那天的事，他还没完全放下。你替主公压过他一回。", "He hasn't quite let go of the day he took the seal. You leaned on him once in your lord's name."), F("flag.fs_pushed"))],
    [choice("soft", "dilemma", T("抢在关羽开口之前：『小女年幼，将军还要问过汉中王。』", "Speak before Guan Yu can: 'The girl is young; the general must first ask the King of Hanzhong.'"),
            T("关羽瞪了你一眼，可那句骂人的话终究没有出口。诸葛瑾松了一口气，回去复命。孙权听了，只说：『关羽不肯。』没有动怒。",
              "Guan Yu glares at you, but the insult he was about to hurl never leaves his mouth. Zhuge Jin breathes out and goes back to report. Sun Quan, hearing it, says only, 'Guan Yu won't.' He isn't enraged."),
            [setv("flag.hn_soft"), rel("guanyu", "esteem", -1), rel("guanyu", "trust", 1), add("deviation", 2)], echo=["e_soft"],
            req=ANY(AT("guanyu", "trust", 3), AT("guanyu", "warmth", 3), AT("guanyu", "esteem", 3)),
            hint=T("需要关羽肯听你的：信任在「倚重」、交情在「交好」或看重在「推崇」以上", "Needs Guan Yu to listen to you: trust at Relied on, friendship at Close, or esteem at Admired or above")),
     choice("canon", "expression", T("不劝。由他说。", "Don't intervene. Let him speak."),
            T("关羽勃然大怒，把诸葛瑾骂了出去。诸葛瑾回到江东，一五一十地说了。孙权大怒：『何太无礼耶！』当即召张昭等人，商议取荆州。",
              "Guan Yu flies into a rage and drives Zhuge Jin out with curses. Back in the east, Zhuge Jin repeats every word. Sun Quan is furious—such insolence!—and at once summons Zhang Zhao and the others to plan the taking of Jingzhou."),
            [setv("flag.hn_canon"), rel("guanyu", "warmth", 1)]),
     choice("apology", "strategy", T("由他骂。事后你连夜写信给诸葛瑾，替关将军赔礼。", "Let him rage. Afterward, that same night, write to Zhuge Jin and apologize on the general's behalf."),
            T("诸葛瑾回信说：『子衡的心意，瑾收下了。可吴侯的脸，不是一封信能补的。』关羽后来知道了这封信，问你：『你替我赔什么礼？』",
              "Zhuge Jin writes back: 'I accept your goodwill, Ziheng. But the Marquis's face can't be mended with a letter.' Guan Yu learns of the letter later and asks you, 'What were you apologizing for, on my behalf?'"),
            [setv("flag.hn_canon"), setv("flag.hn_apology"), rel("guanyu", "trust", -1), add("renown.cunning")], echo=["e_apology"])],
    quote=T("云长勃然大怒曰：“吾虎女安肯犬子乎！不看汝弟之面，力斩汝首！再休多言！”遂唤左右逐出。",
            "Yunchang flew into a rage: \"Would my tigress take a dog for a husband? If not for your brother's sake I would have your head! Not another word!\" And he had his men throw him out."),
    callbacks=[cb("e_envoy", T("关羽对诸葛瑾说：『汉中王派来送印的人就在这里。有什么话，当着他说。』", "Guan Yu tells Zhuge Jin, 'The man the King of Hanzhong sent with my seal is right here. Whatever you have to say, say it in front of him.'"), F("flag.v3_to_jing")),
               cb("e_jin", T("诸葛瑾看见你，苦笑了一下：『成都那一趟，瑾记着。』", "Zhuge Jin sees you and smiles ruefully. 'I remember that trip to Chengdu.'"), F("flag.jin_trick")),
               cb("e_seal", T("关羽受了印，心情正好。可诸葛瑾一开口，他的脸色就变了。", "Guan Yu has taken the seal and is in good spirits. But the moment Zhuge Jin opens his mouth, his face changes."), F("flag.fs_helped")),
               cb("e_dandao", T("诸葛瑾说：『陆口那天站在关将军身后的，就是你吧。』", "Zhuge Jin says, 'You were the one standing behind General Guan that day at Lukou, weren't you?'"), F("flag.dd_guard")),
               cb("e_lusu3", T("诸葛瑾说：『子敬生前常提起你。』你这才知道，鲁肃已经不在了。", "Zhuge Jin says, 'Zijing often spoke of you before he died.' Only then do you learn that Lu Su is gone."), F("flag.dd_lusu")),
               cb("e_mifang", T("糜芳在席末，看了你一眼，又低下头去。", "Mi Fang, at the foot of the table, glances at you, then looks down again."), F("flag.mf_mended"))],
    on_enter=[{"when": DEBT("d_tiger"), "effects": [], "resolve": [("d_tiger", "reroute")],
               "text": T("关羽给汉中王回了信：『汉升老当益壮，可与吾同列。』五虎将还是五个。只是这封信，来得比别人以为的晚了一个月。",
                         "Guan Yu writes back to the King of Hanzhong: 'Hansheng is as strong as ever in his old age; he may stand with me.' The Five Tigers are five after all. It's just that the letter arrives a month later than anyone expected.")}],
    when=ALL(AT_JING, NF("flag.v3_hermit")), order=10))

N.append(node("c8_fire", "c8", "main", T("北伐", "Marching North"), "functional", T("第73回", "Ch. 73"),
    [P(T("关羽起兵攻樊城，命糜芳、傅士仁为先锋。出兵前夜，城中失火，烧了军器粮草。关羽大怒，要斩二人。", "Guan Yu raises his army against Fancheng, with Mi Fang and Fu Shiren as vanguard. On the night before the march a fire breaks out in the city and burns weapons and grain. Guan Yu is enraged and means to behead them both.")),
     P(T("糜芳跪在地上，回头看你。", "Mi Fang, on his knees, looks back at you."), F("flag.mf_mended")),
     P(T("糜芳跪在地上，偷偷看了你一眼。你劝过他收敛，他到底没收敛住。", "Mi Fang, on his knees, steals a glance at you. You told him to watch himself; he couldn't."), F("flag.mf_warned")),
     ],
    [choice("spare", "dilemma", T("求关羽从轻：大战在即，先斩大将，不吉。", "Beg Guan Yu for leniency: to behead generals on the eve of battle bodes ill."),
            T("关羽打了二人四十棍，夺了先锋印，让糜芳回南郡、傅士仁回公安守城。他说：『等我得胜回来，再与你们算账。』你知道这句话，他们会记很久。",
              "Guan Yu has them each given forty strokes, strips them of the vanguard seal, and sends Mi Fang back to hold Nanjun and Fu Shiren to hold Gong'an. 'When I come back victorious,' he says, 'we'll settle this.' You know they'll remember those words for a long time."),
            [setv("flag.fire_spared"), rel("guanyu", "esteem", -1)]),
     choice("silent", "expression", T("不说话。军法如此。", "Say nothing. Military law is military law."),
            T("费诗出来求情，关羽打了二人四十棍，赶回去守城。你看着糜芳一瘸一拐地走出辕门。", "Fei Shi pleads for them; Guan Yu has them given forty strokes and sends them back to hold their cities. You watch Mi Fang limp out through the camp gate.")),
     choice("replace", "strategy", T("劝关羽：既然不用他们打仗，也别让他们守后方。", "Urge Guan Yu: if they're not fit to fight, don't leave them guarding the rear either."),
            T("关羽想了想：『荆州还有谁可用？』你答不上来。最后，糜芳还是回了南郡，傅士仁还是回了公安。关羽说：『你这句话，我记着。』",
              "Guan Yu thinks. 'Who else in Jingzhou is there?' You can't answer. In the end Mi Fang goes back to Nanjun and Fu Shiren to Gong'an all the same. Guan Yu says, 'I'll remember you said that.'"),
            [rel("guanyu", "esteem", 1), add("uncanny")], foresight=True)],
    callbacks=[cb("e_mf_told", T("糜芳跪在地上，看都不看你一眼。", "Mi Fang, on his knees, won't even look at you."), F("flag.mf_told")),
               cb("e_soft", T("出兵前，关羽对你说：『东吴那门亲，你替我挡下了。也好，省得我说出难听的话。』", "Before the march Guan Yu tells you, 'You turned that Wu match aside for me. Just as well—it saved me saying something ugly.'"), F("flag.hn_soft")),
               cb("e_apology", T("关羽出兵前对你说：『你那封赔礼的信，以后别写了。』", "Before the march Guan Yu tells you, 'That apology letter of yours—don't write another.'"), F("flag.hn_apology"))],
    when=ALL(AT_JING, NF("flag.v3_hermit")), order=20))

N.append(node("c8_far", "c8", "main", T("远处的消息", "News from Far Away"), "functional", T("第73回", "Ch. 73"),
    [P(T("消息一封接一封传到成都：关羽骂走了东吴的使者；关羽起兵攻打樊城；曹仁闭城不出。诸葛亮把战报看了很久，问你：『子衡兄，你怎么看？』",
         "News reaches Chengdu dispatch after dispatch: Guan Yu has driven off Wu's envoy with insults; Guan Yu has marched on Fancheng; Cao Ren has shut himself inside the walls. Zhuge Liang studies the reports a long time and asks you, 'Ziheng, what do you make of it?'"))],
    [choice("warn", "dilemma", T("劝主公派兵接应荆州：东吴不会坐视。", "Urge your lord to send troops to back up Jingzhou: Wu won't sit idle."),
            T("刘备犹豫了：『二弟打得正顺……』诸葛亮却点了头，调了一支兵往上庸。你不知道这够不够。", "Liu Bei hesitates. 'My brother is doing so well…' But Zhuge Liang nods, and a column is sent toward Shangyong. You don't know if it will be enough."),
            [setv("flag.warned_jing"), add("uncanny"), rel("zhuge", "esteem", 1), add("deviation")], foresight=True),
     choice("trust", "expression", T("说：关将军威震华夏，不必担心。", "Say: General Guan's name shakes the whole realm. There's no need to worry."),
            T("刘备笑了：『你也这么想。』诸葛亮没有笑。", "Liu Bei smiles. 'So you think so too.' Zhuge Liang doesn't smile."), [rel("liubei", "warmth", 1)]),
     choice("letter", "strategy", T("给关羽写信：北伐之前，先稳住东吴。", "Write to Guan Yu: before going north, make sure of Wu."),
            T("你的信走了半个月。关羽的回信只有一句：『已知。』", "Your letter takes half a month to arrive. Guan Yu's reply is a single line: 'Noted.'"),
            [rel("guanyu", "trust", 1)])],
    on_enter=[{"when": DEBT("d_tiger"), "effects": [], "resolve": [("d_tiger", "reroute")],
               "text": T("关羽给汉中王回了信：『汉升老当益壮，可与吾同列。』五虎将还是五个。只是这封信，来得比别人以为的晚了一个月。",
                         "Guan Yu writes back to the King of Hanzhong: 'Hansheng is as strong as ever in his old age; he may stand with me.' The Five Tigers are five after all. It's just that the letter arrives a month later than anyone expected.")}],
    callbacks=[cb("e_tiger", T("你想起那份五虎将的名单。关羽的回信，终究还是来了。", "You think of that list of the Five Tigers. Guan Yu's letter did come in the end."), F("flag.wh_ask")),
               cb("e_charge", T("黄忠来找你喝酒，说：『等荆州的仗打完，老夫去樊城给云长帮把手。』", "Huang Zhong comes to drink with you. 'Once the fighting in Jingzhou is done, I'll go to Fancheng and give Yunchang a hand.'"), F("flag.dj_charge"))],
    when=ALL(CD, NF("flag.v3_to_jing"), NF("flag.v3_hermit")), order=10))

# ---------- crises (any chapter) ----------
def crisis(id, title, intro, choices, when, order):
    return node(id, "*", "interrupt", title, "free", T("原创危机", "original crisis"), intro, choices, when=when, order=order)
N.append(crisis("x_cold3", T("冷落", "Sidelined"),
    T("议事时，刘备已经很久没有问过你了。诸葛亮私下对你说：『子衡兄，主公心里有个结。』", "It's been a long time since Liu Bei asked your opinion at council. Zhuge Liang tells you privately, 'Ziheng, our lord has a knot in his heart.'"),
    [choice("mend", "strategy", T("去找主公，把话说开。", "Go to your lord and talk it through."),
            T("你们谈了一夜。天亮时，刘备说：『是我多心了。』", "You talk all night. At dawn Liu Bei says, 'I've been too suspicious.'"), [rel("liubei", "trust", 2), add("renown.loyal")],
            req=ANY(AT("zhuge", "esteem", 2), AT("zhaoyun", "trust", 2), AT("fazheng", "esteem", 2)), hint=T("需要诸葛亮的看重在「器重」以上、赵云的信任在「可托」以上，或法正的看重在「器重」以上，才有人替你说一句话", "Needs Zhuge Liang's esteem at Valued or above, Zhao Yun's trust at Reliable or above, or Fa Zheng's esteem at Valued or above, for someone to put in a word for you")),
     choice("wait", "expression", T("等。做好手上的事。", "Wait. Do the work in front of you."), T("日子过得很慢。议事时，你的位子挪到了后排。", "The days pass slowly. At council your seat has moved to the back row."), [rel("liubei", "trust", 1), setv("flag.sidelined")]),
     choice("go", "dilemma", T("告辞。", "Take your leave."), T("刘备没有留你。", "Liu Bei doesn't ask you to stay."), [setv("flag.v3_left")])],
    ALL(CD, UPTO("liubei", "trust", 0), NF("flag.v3_hermit")), 3))
N[-1]["choices"][2]["ends"] = True
N.append(crisis("x_guan_cold", T("关羽不理你", "Guan Yu Won't See You"),
    T("关羽已经好些天没叫你议事了。关平悄悄对你说：『父亲说，你的话太多。』", "Guan Yu hasn't called you to council for days. Guan Ping tells you quietly, 'Father says you talk too much.'"),
    [choice("apologize", "strategy", T("去关羽府上，当面认个错。", "Go to Guan Yu's residence and apologize to his face."),
            T("关羽让你在门外站了一个时辰，才叫你进去。他没提那些话，只是给你倒了一杯酒。", "Guan Yu leaves you standing outside for an hour before calling you in. He doesn't mention what was said; he just pours you a cup of wine."),
            [rel("guanyu", "warmth", 2), add("imp.guanyu.offended", -1)]),
     choice("wait", "expression", T("等他消气。", "Wait for him to cool off."), T("一个月后，关羽在城头遇见你，点了点头。仅此而已。", "A month later Guan Yu passes you on the wall and nods. That's all."), [rel("guanyu", "warmth", 1), setv("flag.sidelined")]),
     choice("go", "dilemma", T("请调回成都。", "Ask to be transferred back to Chengdu."), T("关羽批了。你走的那天，他没有出来送。", "Guan Yu approves it. The day you leave, he doesn't come out to see you off."), [setv("flag.v3_left")])],
    ALL(JING, ANY(I("guanyu", "offended", ">=", 3), ALL(UPTO("guanyu", "warmth", 0), UPTO("guanyu", "esteem", 1))), NF("flag.v3_hermit")), 3))
N[-1]["choices"][2]["ends"] = True
N.append(crisis("x_uncanny3", T("妖人", "Sorcerer"),
    T("你说中的事情太多了。连东吴都有人在传：刘备手下有个能知未来的人。诸葛亮来找你：『子衡兄，亮不问你从哪里知道的。可曹操和孙权都会问。』", "You've been right about too many things. Even in Wu people are saying Liu Bei has a man who knows the future. Zhuge Liang comes to you. 'I won't ask how you know, Ziheng. But Cao Cao and Sun Quan will.'"),
    [choice("hide", "strategy", T("从此闭口：只说眼前的事。", "Hold your tongue from now on: speak only of what's in front of you."), T("你很久没有再说过一句准话。人们慢慢忘了。", "For a long time you say nothing that comes true. People slowly forget."), [add("uncanny", -2), rel("zhuge", "trust", 1)]),
     choice("trust", "dilemma", T("把实话告诉诸葛亮一个人。", "Tell Zhuge Liang alone the truth."), T("诸葛亮听完，摇着扇子笑了很久：『原来如此。那亮以后，要多问问子衡兄了。』", "Zhuge Liang hears you out and laughs a long while behind his fan. 'So that's it. Then I shall have to ask you more often.'"),
            [rel("zhuge", "esteem", 2), rel("zhuge", "trust", -2), add("uncanny", -1)], req=AT("zhuge", "esteem", 2), hint=T("需要诸葛亮的看重在「器重」以上", "Needs Zhuge Liang's esteem at Valued or above")),
     choice("leave", "dilemma", T("离开，免得连累主公。", "Leave, so your lord isn't tainted by you."), T("你在一个雨夜出了城。", "You leave the city one rainy night."), [setv("flag.v3_exposed")])],
    ALL(V("uncanny", ">=", 6), NF("flag.v3_hermit")), 2))
N[-1]["choices"][2]["ends"] = True
N.append(crisis("x_loose3", T("失言", "A Slip of the Tongue"),
    T("你说过的那些话，有人一句句抄了下来，送到了主公案头。", "Someone has copied down the things you've said, line by line, and put them on your lord's desk."),
    [choice("own", "strategy", T("认：话说过了头。", "Own it: you spoke out of turn."), T("主公没有罚你：『先生是聪明人，聪明人最该管住嘴。』", "Your lord doesn't punish you. 'You're a clever man. Clever men should mind their tongues most of all.'"), [add("renown.rash", -3), rel("liubei", "trust", -1)]),
     choice("argue", "dilemma", T("辩：句句是真话。", "Argue: every word was true."), T("主公听完：『有些真话，要挑时候说。』", "Your lord hears you out. 'Some truths need the right moment.'"), [add("renown.rash", -1), rel("liubei", "trust", -1), rel("zhuge", "esteem", 1)])],
    ALL(V("renown.rash", ">=", 6), NF("flag.v3_hermit")), 4))

# Guan Yu loses his temper on the spot
N.append(node("x_guan_rage", "*", "flash", T("关羽拍案", "Guan Yu Slams the Table"), "free", T("原创", "original"),
    T("关羽一掌拍在案上，酒杯跳了起来：『你再说一遍！』周仓已经按住了刀。", "Guan Yu slams his palm on the table and the cups jump. 'Say that again!' Zhou Cang already has his hand on his blade."),
    [choice("bow", "expression", T("拱手赔罪。", "Bow and apologize."), T("关羽哼了一声，挥手让你下去。", "Guan Yu snorts and waves you away."), [rel("guanyu", "esteem", -1), add("renown.rash")]),
     choice("stand", "dilemma", T("不退：『子衡说的，是为将军好。』", "Don't back down: 'What I said, I said for your good, General.'"),
            T("关羽盯着你看了很久，把手从案上收了回去：『下去吧。』第二天，他派人给你送了一坛酒。", "Guan Yu stares at you a long time, then takes his hand off the table. 'Go.' The next day he sends you a jar of wine."),
            [rel("guanyu", "esteem", 1), rel("guanyu", "warmth", -1), add("renown.rash", 2)])]))

# ------------------------------------------------------------------ open questions
ASKS = {
  "c1_dandao": {"who": "lusu", "fallback": "dodge",
    "q": T("散席时鲁肃追到江边，拉住你：『子衡，你是明白人。你说，荆州到底该不该还？』", "As the feast breaks up, Lu Su catches you at the river's edge. 'Ziheng, you're a sensible man. Tell me—should Jingzhou be returned or not?'"),
    "answers": [
      ans("yes", T("说该还", "says it should be returned"), T("鲁肃眼睛一亮，又暗了下去：『这话，你敢在关将军面前说吗？』", "Lu Su's eyes light up, then dim. 'Would you dare say that in front of General Guan?'"), [rel("lusu", "trust", 1), rel("guanyu", "trust", -1)], match=r"该还|应该还|还给|还吧|守约|should|give it back|return it|keep the promise", mood="warm"),
      ans("no", T("说不该还", "says it shouldn't"), T("鲁肃叹了口气：『那这仗，迟早要打。』", "Lu Su sighs. 'Then there'll be a war, sooner or later.'"), [rel("lusu", "trust", -1), rel("guanyu", "esteem", 1)], match=r"不该|不还|不能还|凭什么|shouldn't|no|never", mood="sad"),
      ans("later", T("说等取了凉州再还", "says after Liang province is taken"), T("鲁肃苦笑：『取了西川还西川，取了凉州还凉州。荆州是还不回来了。』", "Lu Su smiles bitterly. 'After the west, it was the west; after Liang, it'll be Liang. Jingzhou is never coming back.'"), [rel("lusu", "trust", -1), add("renown.cunning")], match=r"凉州|以后|将来|等|再说|later|after|someday|liang", mood="neutral"),
      ans("rude", T("冒犯鲁肃或东吴", "insults Lu Su or Wu"), T("鲁肃的脸红到了脖子：『先生……告辞。』", "Lu Su flushes to the neck. 'Sir… good night.'"), [add("heat.lusu"), rel("lusu", "trust", -2), add("renown.rash")], match=r"鼠辈|小人|无耻|不要脸|贼|rats|thief|shameless", mood="cold"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("鲁肃松开了手：『你也难做。』", "Lu Su lets go of your sleeve. 'It's hard for you too.'"), [], match=r"不知|不好说|问主公|can't say|ask my lord", mood="neutral"),
    ]},
  "c1_jin": {"who": "zhuge", "fallback": "dodge",
    "q": T("诸葛瑾走后，诸葛亮一个人坐着。过了很久，他问你：『子衡兄，亮这样对自己的哥哥，是不是太过了？』", "After Zhuge Jin has gone, Zhuge Liang sits alone. After a long time he asks you, 'Ziheng, was I too hard on my own brother?'"),
    "answers": [
      ans("yes", T("说是有些过了", "says yes, a little"), T("诸葛亮点点头：『亮也这么想。可各为其主，没有办法。』", "Zhuge Liang nods. 'I think so too. But each of us serves his own lord. There's nothing to be done.'"), [rel("zhuge", "trust", 1), rel("zhuge", "warmth", 1)], match=r"过了|太过|狠|心狠|对不起|too hard|harsh|cruel|yes", mood="sad"),
      ans("no", T("说没有，各为其主", "says no—each serves his lord"), T("诸葛亮笑了笑：『子衡兄这样说，亮心里好受些。』", "Zhuge Liang smiles a little. 'Hearing you say that makes it easier.'"), [rel("zhuge", "warmth", 1)], match=r"各为其主|没有|不过|应该|公事|each serves|no|duty|had to", mood="warm"),
      ans("rude", T("讥讽诸葛亮", "mocks Zhuge Liang"), T("诸葛亮的扇子停了：『子衡兄说得是。』他没再说一句话。", "Zhuge Liang's fan stops. 'You're quite right, Ziheng.' He doesn't say another word."), [add("heat.zhuge"), rel("zhuge", "trust", -1), add("renown.rash")], match=r"虚伪|假哭|演戏|装|hypocrite|fake|acting", mood="cold"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("诸葛亮没有追问。", "Zhuge Liang doesn't press."), [], match=r"不知|不好说|can't say|don't know", mood="neutral"),
    ]},
  "c4_dingjun": {"who": "fazheng", "fallback": "dodge",
    "q": T("冲锋之前，法正忽然问你：『子衡，你说——一饭之恩，睚眦之怨，我该不该都报？』", "Just before the charge, Fa Zheng suddenly asks you, 'Ziheng, tell me—a meal's kindness, a glare's offense: should I repay them all?'"),
    "answers": [
      ans("both", T("说恩怨都该报", "says repay both"), T("法正大笑：『痛快！子衡懂我。』", "Fa Zheng laughs aloud. 'Well said! You understand me, Ziheng.'"), [rel("fazheng", "warmth", 1), rel("fazheng", "esteem", 1)], match=r"都报|都该|恩怨分明|当然|both|repay them all|of course|yes", mood="warm"),
      ans("kind", T("说报恩就好，怨可以放下", "says repay kindness, let grudges go"), T("法正想了想：『放下……主公也这么劝过我。』他望着山下，没再说话。", "Fa Zheng considers. 'Let go… our lord has told me the same.' He looks down the mountain and says no more."), [rel("fazheng", "trust", 1)], match=r"放下|算了|宽|饶|报恩|let go|forgive|kindness only|mercy", mood="neutral"),
      ans("rude", T("骂他心胸狭窄", "calls him petty"), T("法正的笑容一点点收了：『子衡，这句我记下了。』", "Fa Zheng's smile fades bit by bit. 'Ziheng, I'll remember that.'"), [add("heat.fazheng"), rel("fazheng", "warmth", -2), add("renown.rash")], match=r"小气|狭窄|小人|记仇|petty|small|vindictive", mood="cold"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("法正耸耸肩：『看旗吧。』", "Fa Zheng shrugs. 'Watch the flags.'"), [], match=r"不知|不好说|can't say|don't know", mood="neutral"),
    ]},
  "c4_laozu": {"who": "guanyu", "fallback": "dodge",
    "q": T("散席后，关羽叫住你，借着酒意问：『你说实话——黄忠那老卒，配和我并列吗？』", "After the feast, Guan Yu calls you back and, warm with wine, asks, 'Tell me the truth—is that old soldier Huang Zhong fit to stand level with me?'"),
    "answers": [
      ans("yes", T("说配", "says yes"), T("关羽的脸沉了下来，半晌才说：『你倒是敢说。』", "Guan Yu's face darkens. After a long moment he says, 'You've got nerve.'"), [rel("guanyu", "esteem", 1), rel("guanyu", "warmth", -1)], match=r"配|当得起|够格|也是英雄|yes|worthy|he is|deserves", mood="cold"),
      ans("no", T("说不配", "says no"), T("关羽满意地捋了捋胡子：『我就知道。』", "Guan Yu strokes his beard, satisfied. 'I knew it.'"), [rel("guanyu", "warmth", 1), add("renown.rash")], match=r"不配|不够|比不上|差远|no\b|not worthy|can't compare", mood="warm"),
      ans("brother", T("说你们是兄弟，他是部将，本就不同", "says you're brothers; he's a general—it's different"), T("关羽想了想，点点头：『这话说得在理。』", "Guan Yu thinks it over and nods. 'That makes sense.'"), [rel("guanyu", "esteem", 1), rel("guanyu", "trust", 1)], match=r"兄弟|结义|不一样|不同|主公|brother|different|sworn", mood="warm"),
      ans("rude", T("顶撞关羽、说他骄傲", "calls him arrogant"), T("关羽一拍桌子：『你说什么？』", "Guan Yu slams the table. 'What did you say?'"), [add("heat.guanyu", 2), rel("guanyu", "esteem", -1)], match=r"骄傲|自大|傲|看不起人|狂|arrogant|proud|vain", mood="cold"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("关羽看了你一会儿，挥手让你走了。", "Guan Yu looks at you a while, then waves you off."), [], match=r"不知|不好说|can't say|don't know", mood="neutral"),
    ]},
  "c7_wang": {"who": "liubei", "fallback": "dodge",
    "q": T("大典之后，刘备拉着你走到坛下，低声问：『子衡，孤今日称王——你说，是对得起汉室，还是对不起？』", "After the ceremony Liu Bei draws you down from the altar and asks quietly, 'Ziheng, today I took the title of king. Tell me—have I kept faith with the Han, or broken it?'"),
    "answers": [
      ans("keep", T("说对得起：为了兴复汉室", "says he has kept faith—to restore the Han"), T("刘备握住你的手，很久才松开：『但愿如此。』", "Liu Bei grips your hand and holds it a long time. 'Let's hope so.'"), [rel("liubei", "trust", 1), rel("liubei", "warmth", 1)], match=r"对得起|兴复|为了汉室|天下|名正言顺|kept faith|restore|the han|rightful", mood="warm"),
      ans("doubt", T("说有人会说对不起", "says some will say he broke it"), T("刘备沉默了：『是。曹操也会这么说孤。』", "Liu Bei is silent. 'Yes. Cao Cao will say so of me.'"), [rel("liubei", "esteem", 1)], match=r"有人会说|难说|未必|僭越|曹操|some will say|not sure|usurp", mood="sad"),
      ans("rude", T("讥讽刘备", "mocks Liu Bei"), T("刘备的脸色变了，转身走回了坛上。", "Liu Bei's face changes, and he turns and climbs back up to the altar."), [add("heat.liubei", 2), rel("liubei", "trust", -1), add("renown.rash")], match=r"野心|篡|伪|贼|想当皇帝|ambition|usurper|fake|wants the throne", mood="cold"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("刘备拍了拍你的肩，没有再问。", "Liu Bei pats your shoulder and doesn't ask again."), [], match=r"不知|不好说|can't say|don't know", mood="neutral"),
    ]},
  "c8_huniu": {"who": "guanyu", "fallback": "dodge",
    "q": T("诸葛瑾走后，关羽余怒未消，问你：『孙权那碧眼小儿，也配和关某结亲？你说！』", "After Zhuge Jin has gone, Guan Yu is still fuming. 'That green-eyed brat Sun Quan—is he fit to join his house to mine? Tell me!'"),
    "answers": [
      ans("no", T("说不配", "says no"), T("关羽哈哈大笑：『说得好！』", "Guan Yu roars with laughter. 'Well said!'"), [rel("guanyu", "warmth", 1), add("renown.rash")], match=r"不配|配不上|小儿|no\b|not worthy|never", mood="warm"),
      ans("ally", T("说结亲是为了联吴抗曹", "says the match would have held the alliance against Cao"), T("关羽的笑容收了：『军师那八个字，我知道。』他没有再说下去。", "Guan Yu's smile fades. 'I know the strategist's eight characters.' He says no more."), [rel("guanyu", "esteem", 1), rel("guanyu", "warmth", -1)], match=r"联吴|抗曹|盟|大局|东和|alliance|against cao|the bigger picture|ally", mood="neutral"),
      ans("danger", T("说骂走来使会惹祸", "warns that insulting the envoy will bring trouble"), T("关羽看着你，过了很久才说：『你怕东吴？』", "Guan Yu looks at you a long time. 'You're afraid of Wu?'"), [rel("guanyu", "trust", 1), add("uncanny")], match=r"祸|危险|报复|偷袭|后方|麦城|trouble|danger|revenge|attack|behind", mood="cold"),
      ans("dodge", T("推辞、不正面回答", "evades"), T("关羽冷哼一声，提刀出去了。", "Guan Yu snorts, takes up his blade and walks out."), [], match=r"不知|不好说|can't say|don't know", mood="neutral"),
    ]},
}
ASK_ORDER = {"c1_dandao": ["rude", "yes", "no", "later", "dodge"], "c1_jin": ["rude", "yes", "no", "dodge"], "c4_dingjun": ["rude", "both", "kind", "dodge"],
             "c4_laozu": ["rude", "yes", "no", "brother", "dodge"], "c7_wang": ["rude", "keep", "doubt", "dodge"], "c8_huniu": ["danger", "no", "ally", "dodge"]}
# Callbacks to things done in an earlier volume can't use this volume's echo register (echoes don't carry over);
# they become intro lines gated on the carried flag instead.
CROSS = {"e_lusu", "e_liuqi", "e_pleaded", "e_weiyan", "e_zy"}
for n in N:
    keep = []
    for c in n.get("callbacks", []):
        if c["pays"] in CROSS: n["intro"].append(P(c["text"], c["when"]))
        else: keep.append(c)
    if "callbacks" in n:
        if keep: n["callbacks"] = keep
        else: del n["callbacks"]

V3_TAGS = {
    ("x_return3", "back"): ["yi"],
    ("c1_jin", "trick"): ["zhi", "li"], ("c1_jin", "honest"): ["cheng", "yi"], ("c1_jin", "plain"): ["cheng"],
    ("c1_dandao", "guard"): ["yong", "yi"], ("c1_dandao", "lusu"): ["zhi", "cheng"],
    ("c1_clinic", "free"): ["ren"], ("c1_clinic", "ledger"): ["zhi"],
    ("c2_hanzhong", "envoy"): ["zhi"], ("c2_hanzhong", "hold"): ["yong"], ("c2_hanzhong", "zhangfei"): ["zhi"],
    ("c2_xiang", "obey"): ["yi"], ("c2_xiang", "bargain"): ["zhi"], ("c2_xiang", "letter"): ["yi"],
    ("c2_fazheng", "talk"): ["ren"], ("c3_wakou", "calm"): ["zhi"], ("c3_wakou", "go"): ["yi", "yong"],
    ("c3_goad", "goad"): ["zhi"], ("c3_goad", "back"): ["ren", "cheng"],
    ("c4_dingjun", "flags"): ["zhi"], ("c4_dingjun", "charge"): ["yong", "yi"],
    ("c4_laozu", "praise"): ["cheng"], ("c4_laozu", "agree"): ["li"], ("c4_laozu", "turn"): ["zhi"],
    ("c5_hanshui", "open"): ["zhi", "yong"], ("c6_jilei", "chase"): ["zhi"], ("c6_jilei", "yangxiu"): ["cheng"],
    ("c6_mifang", "mend"): ["ren"], ("c6_mifang", "tell"): ["li"],
    ("c7_wang", "list"): ["cheng"], ("c7_wang", "ask"): ["zhi"], ("c7_wang", "go"): ["yi"],
    ("c7_feishi", "help"): ["zhi", "yi"], ("c7_feishi", "private"): ["ren"], ("c7_feishi", "push"): ["li"],
    ("c8_huniu", "soft"): ["zhi"], ("c8_huniu", "apology"): ["cheng"],
    ("c8_fire", "spare"): ["ren"], ("c8_fire", "replace"): ["zhi"], ("c8_far", "warn"): ["zhi", "cheng"], ("c8_far", "letter"): ["cheng"],
    ("x_guan_rage", "stand"): ["yong"],
}
values.VALUES.setdefault("fazheng", {"zhi": ["esteem", 1], "yong": ["esteem", 1], "li": ["warmth", 1], "ren": ["esteem", -1]})
values.VALUES.setdefault("huangzhong", {"yong": ["esteem", 1], "yi": ["warmth", 1], "cheng": ["trust", 1], "li": ["esteem", -1]})
values.apply(N, CHARS, V3_TAGS)
byid = {n["id"]: n for n in N}
for nid, a in ASKS.items():
    a["answers"].sort(key=lambda x: ASK_ORDER[nid].index(x["id"]))
    byid[nid]["ask"] = a

# ------------------------------------------------------------------ cast, art, places
CAST = {
    "x_return3": cast_("zhuge"), "x_cold3": cast_("liubei", "zhuge"), "x_guan_cold": cast_("guanyu"), "x_uncanny3": cast_("zhuge"), "x_loose3": cast_("liubei"), "x_guan_rage": cast_("guanyu"),
    "c1_jin": cast_("zhuge", "liubei"), "c1_dandao": cast_("guanyu", "lusu"), "c1_clinic": cast_("wenzhi"), "c1_lusu_letter": cast_("lusu", "guanyu"),
    "c2_hanzhong": cast_("liubei", "fazheng", "zhuge"), "c2_xiang": cast_("guanyu"), "c2_fazheng": cast_("fazheng"), "c2_wz_letter": cast_("wenzhi"),
    "c3_wakou": cast_("liubei", "zhuge"), "c3_report": cast_("guanyu"), "c3_goad": cast_("huangzhong", "zhuge"), "c3_guanping": cast_("guanyu"),
    "c4_dingjun": cast_("fazheng", "huangzhong"), "c4_laozu": cast_("guanyu"), "c4_wz_wounded": cast_("wenzhi"),
    "c5_hanshui": cast_("zhaoyun", "huangzhong"),
    "c6_jilei": cast_("liubei", "fazheng"), "c6_mifang": [], "c6_zhaoyun": cast_("zhaoyun"),
    "c7_wang": cast_("liubei", "zhuge", "huangzhong"), "c7_feishi": cast_("guanyu"), "c8_wz_road": cast_("wenzhi"), "c7_wz_jing": cast_("wenzhi"),
    "c8_huniu": cast_("guanyu"), "c8_fire": cast_("guanyu"), "c8_far": cast_("zhuge", "liubei"),
}
def lay(id, when=None, choice=None):
    d = {"id": id}
    if when: d["when"] = when
    if choice: d["choice"] = choice
    return d
# (ink scene, ink layers, map place, illustration for the illustrated edition)
ART = {
    "x_return3": ("letter", [], None, "v3_letter"), "x_cold3": ("lamp", [], None, None), "x_guan_cold": ("lamp", [], None, None), "x_uncanny3": ("lamp", [], None, None),
    "x_loose3": ("letter", [], None, None), "x_guan_rage": ("hall", [], None, "v3_guan_hall"),
    "c1_jin": ("hall", [], "chengdu", "v3_jin"), "c1_dandao": ("bigriver", [lay("wu_ships")], "lukou", "v3_dandao"), "c1_clinic": ("herbs", [lay("two")], None, "v3_clinic"),
    "c1_lusu_letter": ("letter", [lay("window")], "jiangling", None),
    "c2_hanzhong": ("hall", [], "chengdu", "v3_council"), "c2_xiang": ("letter", [lay("seal")], "jiangling", "v3_xiang"), "c2_fazheng": ("lamp", [], "chengdu", None),
    "c2_wz_letter": ("letter", [lay("window")], None, None),
    "c3_wakou": ("ravine", [], "wakou", "v3_wakou"), "c3_report": ("hall", [], "jiangling", None), "c3_goad": ("camp", [], "jiameng", "v3_goad"), "c3_guanping": ("lamp", [], "jiangling", None),
    "c4_dingjun": ("hill", [], "dingjun", "v3_dingjun"), "c4_laozu": ("hall", [], "jiangling", "v3_laozu"), "c4_fazheng": ("campfire", [], "dingjun", "v3_fazheng_night"),
    "c4_wz_wounded": ("herbs", [lay("two")], None, None),
    "c5_hanshui": ("citywall", [lay("open"), lay("rider")], "hanshui", "v3_hanshui"), "c5_huangzhong": ("campfire", [lay("blade")], "hanshui", "v3_huangzhong_night"),
    "c5_guanyu": ("campfire", [lay("wall"), lay("blade")], "jiangling", "v3_guanyu_night"),
    "c6_jilei": ("camp", [], "hanzhong", "v3_jilei"), "c6_mifang": ("lamp", [], "jiangling", "v3_mifang"), "c6_zhaoyun": ("letter", [], "hanzhong", None),
    "c7_wang": ("citywall", [lay("crowd"), lay("flag_liu")], "mianyang", "v3_wang"), "c7_feishi": ("hall", [], "jiangling", "v3_feishi"),
    "c8_wz_road": ("road", [], "jiangling", None), "c7_wz_jing": ("citywall", [lay("dusk")], None, None),
    "c8_huniu": ("hall", [], "jiangling", "v3_huniu"), "c8_fire": ("fire", [lay("burning")], "jiangling", "v3_fire"), "c8_far": ("letter", [lay("window")], "chengdu", "v3_far"),
}
for n in N:
    sc, ls, place, illus = ART[n["id"]]
    n["art"] = {"scene": sc, "layers": ls}
    if illus: n["art"]["illus"] = illus
    if place: n["place"] = place
    if n["id"] in CAST: n["cast"] = CAST[n["id"]]
PLACE_AFTER = {("c7_wang", "go"): "jiangling", ("x_return3", "back"): "chengdu", ("c8_fire", "*"): "fancheng"}
for n in N:
    for c in n["choices"]:
        pa = PLACE_AFTER.get((n["id"], c["id"])) or PLACE_AFTER.get((n["id"], "*"))
        if pa and pa != n.get("place"): c["place"] = pa

PLACES = {
    "chengdu": {"x": 85, "y": 310, "rx": 238, "ry": 492, "zh": "成都", "en": "Chengdu"}, "jiameng": {"x": 250, "y": 110, "rx": 330, "ry": 380, "zh": "葭萌", "en": "Jiameng"},
    "wakou": {"x": 215, "y": 175, "rx": 300, "ry": 425, "zh": "瓦口", "en": "Wakou"}, "dingjun": {"x": 300, "y": 60, "rx": 342, "ry": 352, "zh": "定军山", "en": "Mount Dingjun"},
    "hanshui": {"x": 345, "y": 55, "rx": 362, "ry": 350, "zh": "汉水", "en": "Han River"}, "hanzhong": {"x": 375, "y": 50, "rx": 372, "ry": 346, "zh": "汉中", "en": "Hanzhong"},
    "mianyang": {"x": 320, "y": 70, "rx": 350, "ry": 356, "zh": "沔阳", "en": "Mianyang"},
    "jiangling": {"x": 560, "y": 300, "rx": 540, "ry": 500, "zh": "江陵", "en": "Jiangling"}, "lukou": {"x": 735, "y": 320, "rx": 650, "ry": 540, "zh": "陆口", "en": "Lukou"},
    "fancheng": {"x": 600, "y": 185, "rx": 556, "ry": 440, "zh": "樊城", "en": "Fancheng"},
}
RIVERS = V2["rivers"]

FUTURE = [(T("水淹七军", "the flooding of the seven armies"), "v4"), (T("刮骨疗毒", "scraping the bone"), "v4"), (T("麦城", "Maicheng"), "v4"), (T("白衣渡江", "crossing the river in white"), "v4"),
          (T("夷陵", "Yiling"), "v5"), (T("白帝", "Baidi"), "v5"), (T("托孤", "entrusting the heir"), "v5"), (T("七擒", "seven captures"), "v6"),
          (T("出师表", "the Memorial on Going to War"), "v7"), (T("街亭", "Jieting"), "v7"), (T("空城计", "the empty fort"), "v7"), (T("五丈原", "Wuzhang Plains"), "v7"),
          (T("鸡肋", "chicken rib"), "c6"), (T("汉中王", "King of Hanzhong"), "c7"), (T("五虎", "Five Tigers"), "c7")]

# ------------------------------------------------------------------ endings
def frag(id, text, when=None, mood=None):
    d = {"id": id, "text": text}
    if when: d["when"] = when
    if mood: d["mood"] = mood
    return d
LIU = ALL(V("track", "==", "liu"), STAYING)
ENDINGS = [
    {"id": "g_side", "title": T("去处", "Where You Ended Up"), "fragments": [
        frag("hermit", T("你没有去成都。汉中的消息，是从集市上听来的。", "You never went to Chengdu. You heard about Hanzhong in the market."), F("flag.v3_hermit")),
        frag("exposed", T("你在一个雨夜出了城。蜀中又多了一个关于妖人的故事。", "You left the city one rainy night. Shu gained another story about a sorcerer."), F("flag.v3_exposed")),
        frag("left", T("你离开了。没有人留你，也没有人忘了你。", "You left. No one asked you to stay. No one forgot you either."), F("flag.v3_left")),
        frag("fancheng", T("关羽北攻樊城，你在中军帐里。身后的荆州，留给了糜芳和傅士仁。", "Guan Yu marches on Fancheng, and you're in his headquarters tent. Behind you, Jingzhou is left to Mi Fang and Fu Shiren."), ALL(AT_JING, STAYING)),
        frag("chengdu", T("你留在成都。荆州的战报一封一封地来，你每一封都看两遍。", "You stay in Chengdu. The reports from Jingzhou come one after another, and you read each one twice."), LIU)]},
    {"id": "g_lord", "title": T("汉中王", "The King of Hanzhong"), "fragments": [
        frag("high", T("汉中王称王那天，第一个拉住的人是诸葛亮，第二个是你。", "On the day he became king, the first person Liu Bei took by the hand was Zhuge Liang. The second was you."), ALL(LIU, AT("liubei", "trust", 4))),
        frag("mid", T("汉中王遇事会问你。你说的，他大多会听。", "The King of Hanzhong asks your opinion, and mostly takes it."), ALL(LIU, AT("liubei", "trust", 3))),
        frag("low", T("汉中王待你客气。你知道，客气就是隔着一层。", "The King of Hanzhong is courteous to you. You know courtesy is a kind of distance."), LIU)]},
    {"id": "g_guanyu", "title": T("关羽", "Guan Yu"), "fragments": [
        frag("soft", T("孙权的亲事被婉拒了。东吴没有动怒——至少，没有当场动怒。", "Sun Quan's proposal was declined gently. Wu didn't flare up—not on the spot, at least."), F("flag.hn_soft")),
        frag("apology", T("你替关羽赔了礼。诸葛瑾收下了信，孙权没有收下这口气。", "You apologized for Guan Yu. Zhuge Jin accepted the letter. Sun Quan didn't accept the insult."), F("flag.hn_apology")),
        frag("warned", T("你劝过刘备派兵接应荆州。往上庸去的那支兵，走得不算快。", "You urged Liu Bei to send troops to back up Jingzhou. The column toward Shangyong isn't moving fast."), F("flag.warned_jing")),
        frag("pride", T("“一个老卒罢了。”这句话是你先说的，后来关羽说了很多遍。", "'An old soldier, that's all.' You said it first. Guan Yu said it many times after."), F("flag.fed_pride")),
        frag("close", T("关羽说，荆州有你，他放心些。", "Guan Yu said that with you in Jingzhou, he rested a little easier."), ALL(AT_JING, ANY(AT("guanyu", "warmth", 3), F("flag.fs_private")))),
        frag("canon", T("关羽骂走了东吴的使者，北上樊城。威震华夏，就在眼前。孙权在江东，也在等。", "Guan Yu drove off Wu's envoy and marched north on Fancheng. Glory that would shake the realm was within reach. In the east, Sun Quan was waiting too."), F("flag.hn_canon")),
        frag("plain", T("关羽北上樊城。威震华夏，就在眼前。", "Guan Yu marched north on Fancheng. Glory that would shake the realm was within reach."), LIU)]},
    {"id": "g_dingjun", "title": T("定军山", "Mount Dingjun"), "fragments": [
        frag("charge", T("黄忠逢人便说：定军山上，有个读书人跟着老夫一起冲下来的。", "Huang Zhong tells everyone: on Mount Dingjun, a scholar charged down the hill right behind me."), F("flag.dj_charge")),
        frag("flags", T("法正说，定军山那面红旗，有你一半。", "Fa Zheng says half that red flag on Mount Dingjun was yours."), F("flag.dj_flags")),
        frag("hz", T("黄忠说：先生懂我。", "Huang Zhong says: the gentleman understands me."), AT("huangzhong", "warmth", 3)),
        frag("far", T("定军山的事，你是在荆州听说的。", "You heard about Mount Dingjun in Jingzhou."), JING),
        frag("plain", T("黄忠斩了夏侯渊。蜀中的孩子都会学那一刀。", "Huang Zhong killed Xiahou Yuan. Every child in Shu learned to mimic that stroke."), LIU)]},
    {"id": "g_wenzhi", "title": T("温芷", "Wen Zhi"), "fragments": [
        frag("together", T("温芷跟着你去了荆州。她说：这次，你走到哪里，我就到哪里。", "Wen Zhi went to Jingzhou with you. This time, she said, wherever you go, I go."), ALL(TO_JING, F("flag.wz_jingzhou")), "romance"),
        frag("child", T("成都城西的小院里，温芷种的当归又开了花。", "In the little yard on the west side of Chengdu, Wen Zhi's angelica has flowered again."), F("flag.wz_child"), "romance"),
        frag("jingzhou", T("温芷在江陵城头给守夜的兵送药。北边的灯火，一夜比一夜多。", "Wen Zhi carries medicine up to the night watch on the Jiangling walls. To the north, the lights grow more numerous each night."), F("flag.wz_jingzhou")),
        frag("west", T("温芷在成都开了一间医馆，穷人看病不收钱。", "Wen Zhi runs a clinic in Chengdu. The poor pay nothing."), F("flag.wz_west")),
        frag("far", T("你很久没有温芷的消息了。", "You haven't heard from Wen Zhi in a long time."))]},
    {"id": "g_lives", "title": T("因你而不同的人", "Lives You Changed"), "mode": "all", "fragments": [
        frag("mifang", T("糜芳记得，荆州只有一个人在关羽面前替他说过话。", "Mi Fang remembers that in all Jingzhou, only one man ever spoke for him to Guan Yu."), F("flag.mf_mended")),
        frag("spared", T("糜芳、傅士仁挨了四十棍，没有掉脑袋。他们会记得是谁求的情——也会记得那四十棍。", "Mi Fang and Fu Shiren took forty strokes and kept their heads. They'll remember who pleaded for them—and the forty strokes."), F("flag.fire_spared")),
        frag("mf_grudge", T("糜芳从关羽帐里出来的时候，看见了站在门口的你。他不会忘。", "When Mi Fang came out of Guan Yu's tent, he saw you standing by the door. He won't forget."), F("flag.mf_told")),
        frag("weiyan", T("魏延射落了曹操两颗门牙，说那一箭是还你的。", "Wei Yan shot out two of Cao Cao's teeth and said the arrow was his repayment to you."), ALL(F("flag.pleaded_weiyan"), CD)),
        frag("zhaoyun", T("赵云说：汉水边那扇门，是先生让开的。", "Zhao Yun says: it was the gentleman who had that gate opened by the Han River."), F("flag.hs_open")),
        frag("yangxiu", T("杨修死了。你说过那两个字会要人命。", "Yang Xiu is dead. You said those two words would cost a life."), F("flag.jl_yangxiu")),
        frag("fazheng", T("法正的账本上，你的名字写在“恩”那一页。", "In Fa Zheng's ledger, your name is on the page for kindnesses."), AT("fazheng", "warmth", 2)),
        frag("lusu", T("鲁肃死前，一直留着那张约。", "Until he died, Lu Su kept that agreement."), F("flag.promised_return")),
        frag("pangtong", T("庞统还活着，在汉中给法正出了不少主意，也跟他吵了不少架。", "Pang Tong is still alive; at Hanzhong he gave Fa Zheng plenty of advice, and picked plenty of fights with him."), F("flag.pt_alive"))]},
    {"id": "g_name", "title": T("名声", "Your Name"), "fragments": [
        frag("uncanny", T("蜀中有人叫你先生，有人叫你妖人。", "In Shu some call you Master; some call you sorcerer."), V("uncanny", ">=", 4)),
        frag("rash", T("人说子衡口无遮拦。喜欢你的人说你真，怕你的人说你狂。", "People say Ziheng can't hold his tongue. Those who like you call it honesty; those who fear you call it madness."), V("renown.rash", ">=", 4)),
        frag("loyal", T("人说子衡重义。", "People say Ziheng keeps faith."), V("renown.loyal", ">", "@renown.cunning")),
        frag("cunning", T("人说子衡多智，也说子衡心深。", "People say Ziheng is clever, and that his mind runs deep."), V("renown.cunning", ">", "@renown.loyal")),
        frag("none", T("史书里没有你的传，只有几处『或曰』。", "The histories give you no biography—just a few lines beginning 'some say.'"))]},
    {"id": "g_history", "title": T("天下", "The Realm"), "fragments": [
        frag("far", T("说书人讲到汉中和荆州，有好几处讲不顺——那几处，都是你。", "When storytellers reach Hanzhong and Jingzhou, several places never quite fit. Those places are you."), V("deviation", ">=", 5)),
        frag("hold", T("三郡没有割。孙权北上合肥吃了亏，回头看荆州的眼神，一年比一年冷。", "The commanderies were never ceded. Sun Quan was mauled at Hefei, and the way he looks at Jingzhou grows colder every year."), ANY(F("flag.xiang_hold"), F("flag.xiang_letter"))),
        frag("near", T("刘备称了汉中王，关羽北上樊城。刘家离天下，从来没有这么近过。", "Liu Bei is King of Hanzhong, and Guan Yu marches on Fancheng. The house of Liu has never been so close to the realm."))]},
]
FRAG_FACE = {"g_lord": {"high": ("liubei", "warm"), "mid": ("liubei", "neutral"), "low": ("liubei", "cold")},
             "g_guanyu": {"soft": ("guanyu", "neutral"), "apology": ("guanyu", "cold"), "pride": ("guanyu", "warm"), "close": ("guanyu", "warm"), "plain": ("guanyu", "neutral")},
             "g_dingjun": {"charge": ("huangzhong", "warm"), "flags": ("fazheng", "warm"), "hz": ("huangzhong", "warm"), "plain": ("huangzhong", "neutral")},
             "g_wenzhi": {"together": ("wenzhi", "shy"), "child": ("wenzhi", "shy"), "jingzhou": ("wenzhi", "sad"), "west": ("wenzhi", "warm"), "far": ("wenzhi", "sad")}}
ENDING_ART = {"scene": "ending", "layers": [{"id": "city", "when": ALL(CD, NF("flag.v3_to_jing"))}, {"id": "home", "when": ANY(F("flag.wz_child"), F("flag.wz_west"))},
                                            {"id": "lone", "when": ANY(F("flag.v3_hermit"), F("flag.v3_left"), F("flag.v3_exposed"))}, {"id": "sail", "when": AT_JING},
                                            {"id": "two_boat", "when": ALL(AT_JING, F("flag.wz_jingzhou"))}]}

# ------------------------------------------------------------------ realm
def _ctl(**kw):
    base = {"liang": "cao", "bing": "cao", "you": "cao", "ji": "cao", "qing": "cao", "sili": "cao", "yan": "cao", "yu": "cao", "xu": "cao",
            "jing": ["liubei", "sun"], "yang": "sun", "yi": "liubei", "jiao": "sun"}
    base.update(kw); return base
REALM = json.loads(json.dumps(V2["realm"]))
REALM["control"] = {f"c{i}": _ctl() for i in range(1, 9)}
REALM["control"]["c2"] = _ctl(yi=["liubei", "cao"]); REALM["control"]["c3"] = _ctl(yi=["liubei", "cao"])
REALM["control"]["c4"] = _ctl(yi=["liubei", "cao"]); REALM["control"]["c5"] = _ctl(yi=["liubei", "cao"])
REALM["captions"] = {"c1": T("刘备据荆、益二州，东吴讨还荆州", "Liu Bei holds Jing and Yi; Wu demands Jingzhou back"),
                     "c2": T("曹操取汉中，西川门户洞开；湘水分界，荆州一分为二", "Cao Cao takes Hanzhong and the west lies open; the Xiang River splits Jingzhou"),
                     "c3": T("刘备北争汉中", "Liu Bei pushes north for Hanzhong"),
                     "c4": T("定军山：夏侯渊战死", "Mount Dingjun: Xiahou Yuan falls"),
                     "c5": T("曹操亲征汉中", "Cao Cao comes to Hanzhong in person"),
                     "c6": T("曹操退出汉中", "Cao Cao abandons Hanzhong"),
                     "c7": T("建安二十四年：刘备称汉中王", "219: Liu Bei becomes King of Hanzhong"),
                     "c8": T("关羽北攻樊城，荆州后方空虚", "Guan Yu marches on Fancheng, leaving Jingzhou thinly held")}

COMMIT_RULES = speech.commit_rules()

ART_PROMPTS = dict(V2["art_prompts"])
PORTRAIT_PROMPTS = dict(V2["portrait_prompts"]); PORTRAIT_PROMPTS.update(P3.PORTRAIT_PROMPTS)

PRESETS = json.loads((HERE / "presets.json").read_text()) if (HERE / "presets.json").exists() else []

CAMPAIGN = {
    "spec": SPEC,
    "tiers": TIERS(),
    # 刘备的信任到「倚重」后，只有关键时刻（KEY）才能再往上走（2026-10-22 定，见决策记录 v2.6）
    "hard_tiers": {"rel.liubei.trust": 3},
    "pack": PACK("history-strategy"),
    "resources": {"reputation": ["renown.loyal", "renown.cunning"], "risk": ["uncanny", "renown.rash"], "drift": ["deviation"]},
    "carry_compress": {"pivot": 4, "k": 0.5},
    "id": "sanguo_strategist_v3",
    "prev": "sanguo_strategist_v2",
    "title": T("三国·谋士", "Three Kingdoms: The Strategist"),
    "volume": T("卷三 · 汉中", "Volume III · Hanzhong"),
    "rights": {"source": "《三国演义》（罗贯中，明代），公版", "quotes": "中文原文直接引用；英文为本项目自译", "original_characters": ["子衡（玩家）", "温芷"]},
    "player": {"name": T("子衡", "Ziheng")},
    "side_prompt": SIDE_PROMPT,
    "vars": VARS, "chars": CHARS, "dims": DIMS, "echoes": ECHOES, "debts": DEBTS,
    "chapters": CHAPTERS, "nodes": {n["id"]: n for n in N}, "endings": ENDINGS,
    "future_terms": [{"term": t, "from": c} for t, c in FUTURE],
    "ending_art": ENDING_ART, "art_prompts": ART_PROMPTS, "frag_face": FRAG_FACE, "portrait_prompts": PORTRAIT_PROMPTS, "cg_captions": V2["cg_captions"], "realm": REALM,
    "react_patterns": V2["react_patterns"], "value_tags": values.TAGS, "commit_rules": COMMIT_RULES,
    "flash": [{"char": "guanyu", "node": "x_guan_rage", "resume": True}],
    "witness": [{"who": "zhuge", "to": "liubei", "labels": ["rude", "threat"], "effects": [rel("zhuge", "trust", -1)]},
                {"who": "huangzhong", "to": "fazheng", "labels": ["rude", "threat"], "effects": [rel("huangzhong", "trust", -1)]}],
    "places": PLACES, "rivers": RIVERS,
    "meters": {"uncanny": T("到 6：被当作妖人", "At 6: branded a sorcerer"), "rash": T("到 6：有人会把你的话报上去", "At 6: someone reports what you've said")},
    "presets": PRESETS,
    "sources": [{"what": "中文引文核对底本", "url": "https://www.ntdtv.com/gb/2009/11/07/a377736.html", "checked": "2026-10-22", "note": "第66回（单刀赴会）"},
                {"what": "中文引文核对底本", "url": "https://www.ntdtv.com/gb/2009/11/22/a379106.html", "checked": "2026-10-22", "note": "第71回（定军山、汉水）"},
                {"what": "中文引文核对底本", "url": "https://www.ntdtv.com/b5/2009/11/26/a379642.html", "checked": "2026-10-22", "note": "第72回（鸡肋），繁体转简体"},
                {"what": "中文引文核对底本", "url": "https://www.ntdtv.com/gb/2009/12/01/a380624.html", "checked": "2026-10-22", "note": "第73回（关羽拒受印、拒婚）；此本作“吾虎女安肯犬子乎”，照录"}],
    "end_note": T("卷三终。卷四《荆州之殇》尚未开放。", "End of Volume III. Volume IV (The Fall of Jingzhou) is not yet open."),
}

if __name__ == "__main__":
    out = HERE / "campaign_v3.json"
    dump(CAMPAIGN, out)
    print("nodes", len(N), "->", out)

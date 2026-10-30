"""卷一试点：关系改变你能经历的事（决策记录 v2.21）。三层：
1. 当场改口：主要场景里，关键人物按你们的关系说不同的开场话（亲近 = 第三档“相熟/可托/器重”及以上；疏远 = 落到最低一档；
   开局就在最低档的关系不算“你弄坏的”，不出疏远的话）。关羽在卷一里交情、信任几乎不动，按敬重来读。
   段落带 rel = [人物, 关系轴, 档位]，页面在旁边标出“因为某某对你的某项已到「某档」/落到了「某档」”（写的是条件的那一档，不是现在的值）。
2. 主动找上门：关系到了某一步，那个人会在某章开头主动来找你（interrupt），给的东西后面用得上。
3. 同一个请求，结果不同：几个关键选项按对方信不信你分成两种结果，选项和结果上写明“因为……”。
数值和结果都由规则决定；台词都是我们自己写的。"""
import copy
from lib import *

def _flag(label): return {"type": "flag", "init": False, "label": label, "carry": False}
FLAGS = {
    "flag.guan_book": T("关羽送了你一卷他批注的《春秋》", "Guan Yu gave you his annotated Annals"),
    "flag.wz_pouch": T("温芷给了你一个药囊", "Wen Zhi gave you a medicine pouch"),
    "flag.cao_watched": T("曹操让程昱盯着你", "Cao Cao had Cheng Yu keep an eye on you"),
}

def RP(text, when, rel):   # a paragraph that only appears because of where a relationship stands
    p = P(text, when); p["rel"] = rel; return p

WARM, COLD, NOTWARM = (lambda c, d: AT(c, d, 2)), (lambda c, d: UPTO(c, d, 0)), (lambda c, d: UPTO(c, d, 1))
INTRO = {   # scene: (person, axis, warm line, cold line)
  "c2_xuchu": ("liubei", "trust",
     T("刘备在马上回头找你，把自己的备马让给了你：『子衡，跟紧我。』", "Liu Bei looks back for you from the saddle and gives you his spare horse. 'Ziheng, stay close.'"),
     T("刘备打马先走了。你跟在队伍后面，没有人回头等你。", "Liu Bei spurs ahead. You ride at the back of the column; no one turns to wait for you.")),
  "c3_terms": ("guanyu", "esteem",
     T("关羽没有看张辽，看的是你：『你说，怎么办。』", "Guan Yu doesn't look at Zhang Liao. He looks at you. 'You tell me. What now?'"),
     T("关羽只跟张辽说话。你站在一边，他一眼也没看你。", "Guan Yu speaks only to Zhang Liao. You stand to one side; he doesn't spare you a glance.")),
  "c4_seal": ("caocao", "esteem",
     T("曹操把你叫到一边：『云长要走，孤拦不住。你呢？』", "Cao Cao draws you aside. 'Yunchang is leaving, and I can't stop him. And you?'"),
     T("曹操从你身边走过，像没看见你。", "Cao Cao walks past you as if you weren't there.")),
  "c5_cottage": ("liubei", "trust",
     T("到了草堂外，刘备让关羽、张飞在柴门外等，只带你一个人进去。", "At the thatched cottage Liu Bei leaves Guan Yu and Zhang Fei at the gate and takes only you inside."),
     T("到了草堂外，刘备让你在柴门外牵马。", "At the thatched cottage Liu Bei leaves you at the gate to hold the horses.")),
  "c5_forge": ("caocao", "trust",
     T("程昱压低了声音：『丞相点名要你写。他说，这种事只信得过你。』", "Cheng Yu lowers his voice. 'The Chancellor asked for you by name. He says this is the kind of thing he trusts only you with.'"),
     T("程昱又补了一句：『丞相说，写得好，就当你是自己人了。』", "Cheng Yu adds, 'The Chancellor says: write it well, and he'll count you as one of his own.'")),
  "c6_slope": ("liubei", "trust",
     T("乱军里，刘备一把拉住你的缰绳：『子衡，你说怎么办，我听你的。』", "In the chaos Liu Bei grabs your reins. 'Ziheng, tell me what to do. I'll listen.'"),
     T("刘备身边围满了人，你挤不进去说话。", "Liu Bei is surrounded; you can't get close enough to speak.")),
  "c6_pursuit": ("caocao", "esteem",
     T("曹操把你叫到身边一起看：『子衡，你看此人如何？』", "Cao Cao calls you to his side to watch. 'Ziheng, what do you make of him?'"),
     T("曹操问话的时候没有看你，是对着众人问的。", "When Cao Cao asks, he isn't looking at you. He asks the room.")),
  "c7_fire": ("zhuge", "esteem",
     T("诸葛亮把令旗分给众将，最后一面递到你手里：『子衡兄，这一面，你看着用。』", "Zhuge Liang hands out the command flags to the generals and puts the last one in your hand. 'Brother Ziheng—use this one as you see fit.'"),
     T("诸葛亮分令旗的时候，没有叫到你的名字。", "When Zhuge Liang hands out the command flags, he doesn't call your name.")),
  "c7_chain": ("caocao", "esteem",
     T("曹操转过头来：『子衡，你也说说。』", "Cao Cao turns to you. 'Ziheng—your view?'"),
     T("众谋士一个个说完，曹操没有问你。", "One by one the advisers speak. Cao Cao doesn't ask you.")),
  "c8_huarong": ("guanyu", "esteem",
     T("关羽出帐前，在你肩上拍了一下，什么也没说。", "On his way out of the tent Guan Yu claps you on the shoulder and says nothing."),
     T("关羽出帐的时候，从你身边擦了过去。", "Guan Yu brushes past you on his way out of the tent.")),
  "c8_cao": ("guanyu", "esteem",
     T("关羽的目光越过曹操，落在你身上，停了很久。", "Guan Yu's gaze passes over Cao Cao and rests on you for a long time."),
     T("关羽看你的眼神，和看曹营里任何一个人没有分别。", "Guan Yu looks at you the way he looks at anyone else in Cao's camp.")),
}

def crisis(id, title, intro, choices, when, order):
    return node(id, "*", "interrupt", title, "free", T("原创", "original"), intro, choices, when=when, order=order)

EVENTS = [
  crisis("x_rel_guan", T("春秋", "The Annals"),
    [RP(T("夜里关羽来找你，手里是一卷翻得起了毛边的《春秋》，页边都是他的批注：『这一卷，我读了二十年。你拿着。』",
          "Guan Yu comes to you at night with a copy of the Spring and Autumn Annals, its edges worn soft, its margins full of his notes. 'I've read this for twenty years. You keep it.'"), None, ["guanyu", "esteem", 3])],
    [choice("take", "expression", T("收下，郑重拜谢。", "Accept it, and bow your thanks."), T("关羽点点头，转身走了。那卷书很沉。", "Guan Yu nods and leaves. The scroll is heavy."),
            [setv("flag.guan_book"), rel("guanyu", "warmth", 1)]),
     choice("lend", "expression", T("推辞：『将军的书，我不敢收。』", "Decline: 'I couldn't take your book, General.'"),
            T("关羽把书放在你案上：『那就算借你。总有一天，你还给我。』", "Guan Yu sets it on your desk. 'Then it's a loan. One day you'll give it back.'"),
            [setv("flag.guan_book"), rel("guanyu", "esteem", 1)])],
    ALL(ANY(LIU, F("flag.with_guanyu")), ANY(AT("guanyu", "warmth", 2), AT("guanyu", "esteem", 3))), 3),
  crisis("x_rel_wz", T("药囊", "The Pouch"),
    [RP(T("温芷托人捎来一个药囊，针脚密密的，里面是止血的药粉，还有一张字条：『别让我在伤兵堆里找到你。』",
          "Wen Zhi sends you a medicine pouch, closely stitched, full of powder to stop bleeding, with a note: 'Don't make me find you among the wounded.'"), None, ["wenzhi", "intimacy", 2])],
    [choice("keep", "expression", T("贴身收好。", "Keep it close, inside your robe."), T("你把药囊系在了腰带里侧。", "You tie the pouch to the inside of your belt."),
            [setv("flag.wz_pouch"), rel("wenzhi", "intimacy", 1)]),
     choice("reply", "expression", T("回一张字条：『你也是。』", "Send a note back: 'You too.'"), T("过了几天，字条又回来了，只多了两个字：『知道。』", "A few days later the note comes back with one word added: 'Understood.'"),
            [setv("flag.wz_pouch"), rel("wenzhi", "warmth", 1)])],
    ALL(AT("wenzhi", "intimacy", 2), NF("flag.wz_pouch")), 3),
  crisis("x_rel_cao", T("照看", "Looked After"),
    [RP(T("程昱来串门，坐了一盏茶的工夫，临走才说：『丞相让我多照看照看你。』从那天起，你出门，总觉得身后有人。",
          "Cheng Yu drops by and sits through a cup of tea. Only as he leaves does he say, 'The Chancellor asked me to look after you.' From that day on, whenever you go out, you feel someone behind you."), None, ["caocao", "trust", 0])],
    [choice("ignore", "expression", T("装作不知道。", "Pretend not to notice."), T("身后的人一直在。你学会了走路时不回头。", "The man behind you stays. You learn not to look back when you walk."), [setv("flag.cao_watched")]),
     choice("confront", "dilemma", T("去见曹操，把话说开：『丞相若信不过我，我走。』", "Go to Cao Cao and have it out: 'If you don't trust me, Chancellor, I'll go.'"),
            T("曹操大笑：『孤若信不过你，你早不在许都了。』第二天，身后的人不见了。", "Cao Cao roars with laughter. 'If I didn't trust you, you'd have left Xuchang long ago.' The next day the man behind you is gone."),
            [rel("caocao", "trust", 2)], req=AT("caocao", "esteem", 1), hint=T("需要曹操对你的赏识至少是「寻常」", "Needs Cao's regard at Ordinary or above"))],
    ALL(CAO, UPTO("caocao", "trust", 0), UPTO("caocao", "esteem", 1)), 3),
]

def _twin(n, cid, when_hi, when_lo, hi, lo=None):
    """split a choice in two by a condition: the 'hi' copy replaces out/effects/because as given; 'lo' likewise"""
    i = next(k for k, c in enumerate(n["choices"]) if c["id"] == cid)
    base = n["choices"][i]
    a, b = copy.deepcopy(base), copy.deepcopy(base)
    a["id"] = cid + "_r"; a["when"] = ALL(base["when"], when_hi) if base.get("when") else when_hi
    b["when"] = ALL(base["when"], when_lo) if base.get("when") else when_lo
    for c, spec in ((a, hi), (b, lo or {})):
        for k, v in spec.items(): c[k] = v
    n["choices"][i:i + 1] = [b, a]

def extend(N, VARS):
    for k, lab in FLAGS.items(): VARS[k] = _flag(lab)
    byid = {n["id"]: n for n in N}
    # 1. what people say to you depends on where you stand with them
    for nid, (c, d, warm, cold) in INTRO.items():
        init = VARS[f"rel.{c}.{d}"]["init"]
        extra = [RP(warm, WARM(c, d), [c, d, 2])] + ([RP(cold, COLD(c, d), [c, d, 0])] if init > TIER_END[0] else [])   # starts above the bottom tier, so reaching it means it fell
        byid[nid]["intro"] = list(byid[nid]["intro"]) + extra
    # 2. people who come to you, and what they gave you later
    for ev, (sc, who) in zip(EVENTS, (("lamp", "guanyu"), ("lamp", "wenzhi"), ("hall", "caocao"))):
        ev["art"] = {"scene": sc, "layers": []}; ev["cast"] = [{"id": who}]
    N.extend(EVENTS)
    hr = byid["c8_huarong"]; v = next(c for c in hr["choices"] if c["id"] == "vouch")
    bv = copy.deepcopy(v); bv.update({"id": "vouch_book", "label": T("把那卷《春秋》还给关羽：『将军，书还你。我替你作保。』", "Give Guan Yu back his Annals: 'Your book, General. I'll vouch for you.'"),
        "when": F("flag.guan_book"), "because": T("因为关羽送过你那卷《春秋》", "Because Guan Yu once gave you his Annals")})
    bv.pop("req", None); bv.pop("hint", None)
    v["when"] = ALL(v["when"], NF("flag.guan_book")) if v.get("when") else NF("flag.guan_book")
    hr["choices"].insert(hr["choices"].index(v) + 1, bv)
    cc = byid["c8_cao"]; pl = next(c for c in cc["choices"] if c["id"] == "plead")
    bp = copy.deepcopy(pl); bp.update({"id": "plead_book", "label": T("捧出关羽当年送你的那卷《春秋》。", "Hold up the Annals Guan Yu gave you long ago."),
        "out": [P(T("关羽看见那卷书，手里的刀慢慢垂了下来。他拨开马头：『书，你留着吧。』曹操走过去的时候，关羽看的是你。", "Guan Yu sees the scroll, and the blade in his hand slowly lowers. He turns his horse aside. 'Keep the book.' As Cao passes, Guan Yu is looking at you."))],
        "effects": pl["effects"] + [rel("guanyu", "warmth", 1)], "when": F("flag.guan_book"), "because": T("因为关羽送过你那卷《春秋》", "Because Guan Yu once gave you his Annals")})
    bp.pop("req", None); bp.pop("hint", None)
    cc["choices"].insert(cc["choices"].index(pl) + 1, bp)
    sl = byid["c6_slope"]; se = next(c for c in sl["choices"] if c["id"] == "search")
    sp = copy.deepcopy(se); sp.update({"id": "search_pouch", "when": ALL(se["when"], F("flag.wz_pouch")) if se.get("when") else F("flag.wz_pouch"),
        "out": [P(T("你们在一堵断墙后找到了糜夫人，她腿上中了枪，怀里抱着阿斗。赵云接过孩子，你扶夫人上了你的马。赵云单骑在前，怀抱阿斗冲出重围；你带着夫人从小路绕出来，左肩挨了一箭。你撕开温芷的药囊，按在伤口上，血止住了。",
                    "Behind a broken wall you find Lady Mi, a spear wound in her leg, the infant Adou in her arms. Zhao Yun takes the child; you lift the lady onto your horse. Zhao Yun rides out alone with Adou at his chest, while you take the lady out by a back path and catch an arrow in your left shoulder. You tear open Wen Zhi's pouch and press it to the wound, and the bleeding stops."))],
        "effects": [e for e in se["effects"] if e.get("set") != "flag.wounded"] + [rel("wenzhi", "intimacy", 1)],
        "because": T("因为温芷给过你那个药囊", "Because Wen Zhi gave you that pouch")})
    se["when"] = ALL(se["when"], NF("flag.wz_pouch")) if se.get("when") else NF("flag.wz_pouch")
    sl["choices"].insert(sl["choices"].index(se) + 1, sp)
    pu = byid["c6_pursuit"]; gp = next(c for c in pu["choices"] if c["id"] == "gap")
    gw = copy.deepcopy(gp); gw.update({"id": "gap_watched", "when": F("flag.cao_watched"),
        "out": [P(T("几辆车从你让开的缺口里逃了出去。当天夜里，程昱的人把这件事报了上去。曹操没有找你，只是第二天把你的差事交给了别人。", "A few carts escape through the gap you've opened. That night Cheng Yu's man reports it. Cao Cao doesn't summon you—he just gives your duties to someone else the next day."))],
        "effects": gp["effects"] + [rel("caocao", "trust", -2), rel("caocao", "esteem", -1)], "because": T("因为程昱的人一直盯着你", "Because Cheng Yu's man has been watching you")})
    gp["when"] = ALL(gp["when"], NF("flag.cao_watched")) if gp.get("when") else NF("flag.cao_watched")
    pu["choices"].insert(pu["choices"].index(gp) + 1, gw)
    # 3. the same request lands differently depending on whether they trust you
    _twin(byid["c6_slope"], "dust", WARM("liubei", "trust"), NOTWARM("liubei", "trust"),
          {"out": [P(T("刘备一点头，张飞就去了。", "Liu Bei nods, and Zhang Fei is already gone."))] + byid["c6_slope"]["choices"][[c["id"] for c in byid["c6_slope"]["choices"]].index("dust")]["out"],
           "effects": [rel("liubei", "trust", 1), add("renown.loyal"), add("renown.cunning")], "because": T("因为刘备信你，你的话当场就用上了", "Because Liu Bei trusts you, your plan is used on the spot")},
          {"out": [P(T("刘备犹豫了半刻才点头。张飞还是吼退了曹军，可桥西的百姓，没能全过来。", "Liu Bei hesitates a moment before he nods. Zhang Fei still roars Cao's army back, but not all the people west of the bridge make it across."))],
           "effects": [add("renown.loyal")], "because": T("因为刘备还不够信你，耽误了半刻", "Because Liu Bei doesn't trust you enough yet, a moment is lost")})
    sd = byid["c4_seal"]; fo = next(c for c in sd["choices"] if c["id"] == "follow")
    _twin(sd, "follow", WARM("guanyu", "esteem"), NOTWARM("guanyu", "esteem"),
          {"out": [P(T("关羽把护送两位嫂嫂的车交给了你：『车在，人在。』", "Guan Yu puts the ladies' carriage in your charge. 'As long as the carriage stands, so do you.'"))] + fo["out"],
           "effects": [rel("guanyu", "esteem", 2), add("renown.loyal"), rel("liubei", "trust", 1)], "because": T("因为关羽敬重你，把车交给了你", "Because Guan Yu respects you, he gives you the carriage")})
    ca = byid["c8_cao"]; cp = next(c for c in ca["choices"] if c["id"] == "cao_pleads")
    _twin(ca, "cao_pleads", WARM("guanyu", "esteem"), NOTWARM("guanyu", "esteem"),
          {"out": cp["out"] + [P(T("关羽让开路的时候，朝你点了一下头。", "As Guan Yu clears the way, he gives you a single nod."))],
           "effects": cp["effects"] + [rel("guanyu", "warmth", 1)], "because": T("因为关羽敬重你", "Because Guan Yu respects you")})

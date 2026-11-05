"""自由对话影响剧情（决策记录 v0.20）。玩家对女主说的话，AI 只判断“这是哪一种话”（语气标签，或下面的某条“走向”）；
走向带来的变化、旁白、剧情去哪里，都写死在这里。引擎复用三国的 move / grudge（campaign_core：CC.move、setGrudge）。

1. 决裂：对女主说下流、侮辱人格的话，当场决裂；已经伤过她（记仇 ≥1）还接着冒犯，也决裂。决裂以后她的线关上，
   她的支线不再出现，前夜不会去见她，主线里她躲着你，也不能再跟她说话。
2. 隐藏的门：有些事只有说出来才会发生，选项里没有。
   夏知遥：问起她毕业后的打算 / 家里（提前知道她妈妈的事）；答应最后一场站在她身边（承诺，最后一场会被检查）；
           告诉她第一次见她对着空椅子念宣传词的样子（结局多一句）。
   沈澄：说出“我想起来了，那天的约”或真心为不告而别道歉。季白：问她为什么从不看最后一卷。
3. 每幕最多说三句。"""
from lib import *

HEROINES = ("zhiyao", "shencheng", "jibai")
NAMES = {"zhiyao": T("夏知遥", "Xia Zhiyao"), "shencheng": T("沈澄", "Shen Cheng"), "jibai": T("季白", "Ji Bai")}

def mv(id, to, means, out, effects=(), labels=(), goto=None, when=None, nodes=None, match=None):
    d = {"id": id, "to": to, "means": means, "out": [P(out)] if isinstance(out, dict) else out, "effects": list(effects)}
    if labels: d["labels"] = list(labels)
    if goto: d["goto"] = goto; d["resume"] = False
    if when: d["when"] = when
    if nodes: d["nodes"] = nodes
    if match: d["match"] = match
    return d

BROKE = lambda h: F(f"flag.broken_{h}")
OK = lambda h: NF(f"flag.broken_{h}")

# ---------------- 决裂 ----------------
BREAK_LINES = {
  "zhiyao": [
    say("zhiyao", "……你再说一遍？", "…Say that again?", face="angry"),
    nar("她把手里的东西往桌上一放。声音不大，可周围的人都安静了。", "She sets down whatever she's holding. Her voice isn't loud, but everyone around goes quiet."),
    say("zhiyao", "我以为你跟别人不一样。是我看错了。", "I thought you were different from the others. I was wrong.", face="sad"),
    say("zhiyao", "电影社的事，以后你不用来了。", "You don't need to come to the film club anymore.", face="angry"),
  ],
  "shencheng": [
    nar("沈澄的脸一下子白了。", "The color drains from Shen Cheng's face."),
    say("shencheng", "七年。我等来的就是这个。", "Seven years. And this is what I waited for.", face="sad"),
    say("shencheng", "陆远，以后别来店里了。", "Lu Yuan, don't come to the café anymore.", face="angry"),
  ],
  "jibai": [
    nar("季白摘下眼镜，慢慢擦了擦，又戴上。", "Ji Bai takes off her glasses, wipes them slowly, and puts them back on."),
    say("jibai", "陆同学。有些话，说出来就剪不掉了。", "Mr. Lu. Some things, once they're said, can't be cut out.", face="sad"),
    say("jibai", "放映室的钥匙，请还给我。", "Please give me back the key to the booth.", face="angry"),
  ],
}

def break_node(h):
    sc = flat([BREAK_LINES[h]])
    effs = [setv(f"flag.broken_{h}"), rel(h, "intimacy", -10), rel(h, "trust", -3), rel(h, "warmth", -3)]
    return scene(f"x_break_{h}", "*", "flash", T("决裂", "The Break"), sc, [
        choice("sorry", "expression", T("“……对不起。”", "\"…I'm sorry.\""),
               [nar("她没有回头。", "She doesn't look back.")], effs),
        choice("let", "expression", T("看着她走远。", "Watch her walk away."),
               [nar("那天以后，我们在路上遇见，她都会绕开。", "From that day on, whenever we pass each other, she takes the long way around.")], effs),
    ], cast=[h])

MOVES = []
for h in HEROINES:
    MOVES.append(mv(f"crude_{h}", h, T(f"对{NAMES[h]['zh']}说下流、性暗示或侮辱人格的话", f"says something sexual, crude or degrading to {NAMES[h]['en']}"),
                    T("话一出口，空气就冷了下来。", "The moment the words are out, the air turns cold."), [], goto=f"x_break_{h}", when=OK(h)))
    MOVES.append(mv(f"again_{h}", h, T(f"已经伤过{NAMES[h]['zh']}，又一次嘲讽、辱骂或威胁她", f"insults, mocks or threatens {NAMES[h]['en']} again after already hurting her"),
                    T("这已经不是第一次了。", "It isn't the first time."), [], labels=["rude", "threat"], goto=f"x_break_{h}",
                    when=ALL(OK(h), V(f"grudge.{h}", ">=", 1))))

# ---------------- 隐藏的门 ----------------
MOVES += [
  mv("z_ask_home", "zhiyao", T("问起夏知遥毕业以后的打算、她的家里，或者那个被她按掉的电话", "asks Xia Zhiyao about her plans after graduation, her family, or the call she declined"),
     T("她安静了一会儿，才开口：“我妈一个人在家，身体不太好。毕业以后……我得回去。”说完她又笑了：“干嘛突然问这个，怪不好意思的。”",
       "She's quiet for a moment before she answers. 'My mom's on her own at home, and her health isn't great. After graduation… I have to go back.' Then she laughs. 'Why ask all of a sudden? It's embarrassing.'"),
     [setv("flag.knows_mom"), setv("flag.zhiyao_secret"), rel("zhiyao", "trust", 1)],
     when=ALL(OK("zhiyao"), NF("flag.zhiyao_secret"), AT("zhiyao", "trust", 1)), nodes=["c1_poster", "c2_ledger", "c2_screening", "c3_member"]),
  mv("z_promise", "zhiyao", T("向夏知遥承诺：最后一场放映，一定站在她身边 / 陪她把开场白念完", "promises Xia Zhiyao he'll stand beside her at the last screening / help her get through the opening"),
     T("她愣了一下，伸出小拇指：“拉钩。说话不算数的人，我会记一辈子。”", "She blinks, then holds out her little finger. 'Pinky swear. If you break your word, I'll remember it forever.'"),
     [setv("flag.z_promised"), rel("zhiyao", "intimacy", 1)],
     when=ALL(OK("zhiyao"), NF("flag.z_promised")), nodes=["c2_ledger", "c3_rooftop", "c3_member", "c4_eve", "c1_poster"]),
  mv("z_firstday", "zhiyao", T("告诉夏知遥，他记得第一天看见她一个人对着空椅子念宣传词的样子（并且觉得那样很好）", "tells Xia Zhiyao he remembers the first day he saw her reading the flyer aloud to empty seats (and that he liked it)"),
     T("她捂住了脸：“那是我人生最丢人的一天，你居然记得……”指缝里，她的耳朵红透了。", "She covers her face. 'That was the most embarrassing day of my life, and you remember it…' Between her fingers, her ears have gone bright red."),
     [setv("flag.z_firstday"), rel("zhiyao", "intimacy", 1)],
     when=ALL(OK("zhiyao"), NF("flag.z_firstday"), AT("zhiyao", "intimacy", 1))),
  mv("c_remember", "shencheng", T("对沈澄说他想起了七年前离开那天的约，或者真心为不告而别道歉", "tells Shen Cheng he remembers the promise from the day he left seven years ago, or sincerely apologizes for leaving without a word"),
     T("沈澄手里的杯子停在半空。过了很久，她才把它放下：“……七年了，你第一次说这句话。”", "The cup in Shen Cheng's hand stops in midair. A long while passes before she sets it down. '…Seven years, and that's the first time you've said it.'"),
     [setv("flag.c_talked_promise"), rel("shencheng", "trust", 1), rel("shencheng", "intimacy", 1)],
     when=ALL(OK("shencheng"), NF("flag.c_talked_promise"))),
  mv("j_ask_end", "jibai", T("问季白为什么害怕结束 / 为什么从不看电影的最后一卷", "asks Ji Bai why endings frighten her / why she never watches a film's final reel"),
     T("季白的手停在胶片上。“……因为看完了，就要承认它结束了。”她笑了笑，“你问了一个没人问过的问题，陆同学。”",
       "Ji Bai's hands still on the film. '…Because once you've watched it, you have to admit it's over.' She smiles faintly. 'You've asked something no one's ever asked me, Mr. Lu.'"),
     [setv("flag.j_asked_end"), rel("jibai", "trust", 1), rel("jibai", "intimacy", 1)],
     when=ALL(OK("jibai"), NF("flag.j_asked_end"))),
]

FLAGS = [(f"flag.broken_{h}", f"和{NAMES[h]['zh']}决裂", f"Broke with {NAMES[h]['en']}") for h in HEROINES] + [
    ("flag.z_promised", "答应夏知遥最后一场站在她身边", "Promised Zhiyao to stand beside her at the last show"),
    ("flag.z_broke_promise", "最后一场没有站在她身边", "Didn't stand beside her at the last show"),
    ("flag.z_firstday", "告诉夏知遥记得第一天见到她", "Told Zhiyao he remembers the first day he saw her"),
    ("flag.c_talked_promise", "对沈澄说起七年前的约", "Spoke to Shen Cheng about the promise from seven years ago"),
    ("flag.j_asked_end", "问季白为什么害怕结束", "Asked Ji Bai why endings frighten her"),
]

WORDS_ENDING = {"id": "g_words", "title": T("你说过的话", "Things you said"), "mode": "all", "fragments": [
    {"id": "firstday", "text": T("很久以后她才告诉你：那天对着空椅子念宣传词，是她最丢人的一天。也是她第一次觉得，有人在听。", "Much later she tells you: that day, reading the flyer to empty seats, was the most embarrassing day of her life. It was also the first time she felt someone was listening."), "when": ALL(F("flag.route_zhiyao"), F("flag.z_firstday"))},
    {"id": "promise", "text": T("拉过钩的事，你做到了。她说，这比那句告白还让她高兴。", "The pinky swear—you kept it. She says that made her happier than the confession."), "when": ALL(F("flag.z_promised"), NF("flag.z_broke_promise"), F("flag.z_good"))},
    {"id": "broke", "text": T("拉过钩的事，你没有做到。她一直记着。", "The pinky swear—you didn't keep it. She never forgot."), "when": F("flag.z_broke_promise")},
    {"id": "broken", "text": T("有些人，是你自己说走的。", "Some people, you drove away with your own words."), "when": ANY(*[BROKE(h) for h in HEROINES])},
]}

def extend(NODES, VARS, CAMPAIGN):
    for h in HEROINES:
        VARS[f"grudge.{h}"] = {"type": "num", "init": 0, "min": 0, "max": 10, "label": T(f"{NAMES[h]['zh']}·记仇", f"{NAMES[h]['en']} · grudge"), "carry": False}
    for f, zh, en in FLAGS: VARS[f] = {"type": "flag", "init": False, "label": T(zh, en)}
    byid = {n["id"]: n for n in NODES}
    for h in HEROINES: NODES.append(break_node(h))
    CAMPAIGN["moves"] = MOVES
    for n in NODES:
        if n["kind"] in ("main", "side"): n["free_scene"] = 3
        cast = [c["id"] for c in n.get("cast", [])]
        # 她的支线：决裂后不再出现
        if n["kind"] == "side":
            her = [h for h in HEROINES if h in cast]
            if len(her) == 1:
                n["when"] = ALL(n["when"], OK(her[0])) if n.get("when") else OK(her[0])
    # 前夜：决裂的人不会去见
    eve = byid["c4_eve"]
    for c in eve["choices"]:
        if c["id"] in HEROINES: c["when"] = ALL(c["when"], OK(c["id"]))
    # 主线里，决裂的人躲着你
    for nid, h, zh, en in (("c2_screening", "zhiyao", "夏知遥站在台上，从头到尾没有看你一眼。", "Zhiyao stands on the stage and doesn't look at you once."),
                           ("c3_member", "zhiyao", "她说话的时候，一直看着别处。", "The whole time she talks, she looks somewhere else."),
                           ("c2_screening", "shencheng", "沈澄把热饮放下就走了，没有跟你打招呼。", "Shen Cheng sets down the hot drinks and leaves without a word to you."),
                           ("c2_screening", "jibai", "放映室的门关着。季白没有出来。", "The booth door stays shut. Ji Bai doesn't come out.")):
        byid[nid]["script"] = byid[nid]["script"] + [{**nar(zh, en), "when": BROKE(h)}]
    # 承诺被检查：最后一场跑去放映室 = 没站在她身边
    last = byid["c5_last"]; booth = next(c for c in last["choices"] if c["id"] == "booth")
    broke = {**booth, "id": "booth_broke", "when": F("flag.z_promised"),
             "script": booth["script"] + [think("……我答应过她，要站在她身边的。", "…I promised her I'd stand beside her."),
                                           {**nar("散场的时候，她只说了一句：“拉过钩的。”", "When the show ends, she says only one thing: 'We pinky swore.'")}],
             "effects": booth["effects"] + [rel("zhiyao", "trust", -2), rel("zhiyao", "intimacy", -1), setv("flag.z_broke_promise")]}
    booth["when"] = NF("flag.z_promised")
    last["choices"].insert(last["choices"].index(booth) + 1, broke)
    stand = next(c for c in last["choices"] if c["id"] == "stand")
    stand["script"] = [{**say("zhiyao", "……你真的来了。拉过钩的。", "…You really came. We pinky swore.", face="shy"), "when": F("flag.z_promised")}] + stand["script"]
    # 说过的话，后面会被提起
    for nid, cond, line in (
        ("c7_station", F("flag.z_firstday"), say("zhiyao", "第一天在影院，你看见我对着空椅子念宣传词……你说你记得。我也记得你那天的表情。", "That first day at the cinema, you saw me reading to empty seats… you said you remembered. I remember your face that day, too.", face="shy")),
        ("c7_letter", F("flag.c_talked_promise"), say("shencheng", "那天你说你想起来了。……其实，我一直在等你说这句话。", "That day you said you remembered. …Honestly, I'd been waiting for you to say that.", face="sad")),
        ("c5_lastreel", F("flag.j_asked_end"), say("jibai", "你问过我，为什么害怕结束。今天，我想试试看完它。", "You asked me once why endings frighten me. Today, I want to try watching to the end.", face="normal"))):
        n = byid[nid]; i = next(k for k, op in enumerate(n["script"]) if op["op"] == "say" and op.get("who") not in (None, "me"))
        n["script"] = n["script"][:i + 1] + [{**line, "when": cond}] + n["script"][i + 1:]

"""v1.9: words land on the spot.

- heat: each person reads provocation their own way (CHARS[c]["heat"]: label -> heat added on the 1st, 2nd, 3rd... time).
  heat.<char> is this scene's tension with that person; the engine resets it when a new scene starts.
- line: when heat reaches it, the scene breaks right away. Cao Cao has an authored confrontation (a flash node);
  everyone else stops talking to you (walkout). At heat >= 2 a person no longer warms to you from the scene's choice.
- witness: the others present hear what you say to someone else.
- alt: a choice's effects can depend on what was said earlier in the same scene.
"""
from lib import *

def R(c, d, op, v): return V(f"rel.{c}.{d}", op, v)
def H(c, op, v): return V(f"heat.{c}", op, v)
NOT_CAO = V("track", "!=", "cao")

HEAT = {
    # Cao Cao: under his own roof, two provocations and he acts
    "caocao": {"rude": [1], "threat": [2], "nonsense": [0, 1], "romantic": [0, 1], "line": 2},
    "guanyu": {"rude": [1], "threat": [2], "nonsense": [0, 1], "romantic": [0, 1], "line": 3},
    "liubei": {"rude": [1], "threat": [2], "nonsense": [0, 0, 1], "line": 3},
    "zhuge":  {"rude": [1], "threat": [1], "nonsense": [0, 0, 1], "line": 4},
    "wenzhi": {"rude": [1], "threat": [2], "line": 3},
}

def extend(N, VARS, CHARS, ENDINGS_ADD):
    for c, tbl in HEAT.items():
        CHARS[c]["heat"] = tbl
        VARS[f"heat.{c}"] = {"type": "num", "init": 0, "min": 0, "max": 5, "char": c, "show": False,
                             "label": T(CHARS[c]["name"]["zh"] + "·火气", CHARS[c]["name"]["en"] + " · Temper")}
    VARS["flag.flogged"] = {"type": "flag", "init": False, "label": T("梅园挨了二十棍", "Flogged after the plum-wine meeting")}
    VARS["flag.cao_wary"] = {"type": "flag", "init": False, "label": T("曹操起了疑心", "Cao Cao grew suspicious")}
    VARS["flag.jailed"] = {"type": "flag", "init": False, "label": T("身在许都大牢", "In the Xuchang jail")}
    VARS["flag.was_jailed"] = {"type": "flag", "init": False, "label": T("坐过曹操的牢", "Did time in Cao Cao's jail")}
    VARS["flag.left_behind"] = {"type": "flag", "init": False, "label": T("刘备出城时你还在牢里", "Still in jail when Liu Bei left")}
    byid = {n["id"]: n for n in N}

    # ---------- the plum-wine meeting: Cao acts on the spot ----------
    def flash(id, title, intro, choices):
        n = node(id, "*", "flash", title, "free", T("原创", "original"), intro, choices)
        return n
    N.append(flash("x_plum_rage", T("梅园变色", "The Garden Turns Cold"),
        T("曹操把酒樽往案上一顿。笑意还挂在脸上，眼睛已经冷了：『玄德，你这位门客，是替你来试孤的？』廊下的甲士按着刀，往前走了一步。刘备离席，伏在地上不起来。",
          "Cao Cao sets his cup down hard. The smile is still on his face; his eyes have gone cold. 'Xuande—did you bring this guest of yours to test me?' The guards under the eaves step forward, hands on their swords. Liu Bei leaves his seat and goes down on the ground, and stays there."),
        [choice("take", "dilemma", T("一个人担下来：『狂言是我一人的，与刘使君无关。』", "Take it all on yourself: 'The wild talk was mine alone. Lord Liu had nothing to do with it.'"),
                T("曹操盯着你看了很久：『好，有担当。拖下去，打二十棍，扔出府门。』棍子落下来的时候，你听见刘备在席上替你求情。那天夜里，他亲自来给你上药，一句责备的话也没说。",
                  "Cao studies you for a long time. 'Good. A man who answers for himself. Take him out, twenty strokes, and throw him into the street.' As the rod comes down you hear Liu Bei pleading for you inside. That night he comes himself to dress your back, and says not one word of reproach."),
                [setv("flag.flogged"), setv("flag.cao_wary"), rel("liubei", "trust", 1), rel("caocao", "esteem", -2), add("renown.rash")]),
         choice("beg", "expression", T("跟着主公一起伏地请罪。", "Go down beside your lord and beg forgiveness."),
                T("刘备替你磕了三个头。曹操这才笑了：『醉话而已，玄德何必当真。』酒宴照旧。回去的路上，刘备说：『今天差一点，就是你我两条命。』",
                  "Liu Bei touches his head to the floor three times for you. Only then does Cao laugh. 'Drunken talk. Why take it so seriously, Xuande?' The feast goes on. On the way home Liu Bei says, 'Today it nearly cost us both our lives.'"),
                [setv("flag.cao_wary"), rel("liubei", "trust", -2), rel("caocao", "esteem", -1)]),
         choice("turn", "strategy", T("举杯转圜：把刚才的狂话，说成是替丞相不平——天下英雄，没人配与丞相对饮。", "Raise your cup and turn it: your wild words were outrage on the Chancellor's behalf—no one in the realm is fit to drink with him."),
                T("曹操盯着你，忽然大笑：『好一张嘴！』他亲自给你斟了一杯。酒宴照旧。只是从那天起，许都多了几双盯着刘备的眼睛。",
                  "Cao stares at you, then bursts out laughing. 'What a tongue!' He pours your cup himself. The feast goes on. But from that day, more eyes in Xuchang are watching Liu Bei."),
                [setv("flag.cao_wary"), rel("caocao", "esteem", 1), rel("liubei", "trust", -1), add("renown.cunning")],
                req=V("renown.cunning", ">=", 1), hint=T("需要“权谋”名声 ≥ 1：你得是个出了名会说话的人，曹操才肯接这个台阶", "Needs a name for cunning ≥ 1: Cao only takes the way out from a man known for his tongue")),
         choice("defy", "dilemma", T("梗着脖子，把话说完。", "Lift your chin and finish what you were saying."),
                T("曹操笑了：『好。孤成全你。』你被押进了许都大牢。刘备出城那天，你在牢里听见城外的马蹄声。",
                  "Cao smiles. 'Very well. You shall have what you want.' You are taken to the Xuchang jail. On the day Liu Bei rides out of the city, you hear the hooves from your cell."),
                [setv("flag.jailed"), setv("flag.left_behind"), setv("flag.cao_wary"), add("renown.rash", 2)])]))

    # ---------- fail forward: jail is a detour, not the end ----------
    N.append(node("x_jail", "*", "interrupt", T("许都大牢", "The Xuchang Jail"), "free", T("原创", "original"),
        T("你在墙上刻到第九十道的时候，外面的消息已经传遍了：刘备请命截击袁术，带着五万兵马出了城。没有人来接你。",
          "By the time you've scratched the ninetieth mark on the wall, the news is everywhere: Liu Bei volunteered to intercept Yuan Shu and rode out with fifty thousand men. No one came for you."),
        [choice("wait", "expression", T("等。", "Wait."),
                T("又过了一个月，狱卒打开门：『丞相说，放了。』没人告诉你为什么。你一路向东，在徐州城外追上了刘备。他看见你，下了马，什么也没说，把自己的斗篷披在你身上。",
                  "Another month passes. Then the jailer opens the door. 'The Chancellor says let him go.' No one tells you why. You head east and catch up with Liu Bei outside Xuzhou. When he sees you, he dismounts, says nothing, and puts his own cloak around your shoulders."),
                [setv("flag.jailed", False), setv("flag.was_jailed"), rel("liubei", "trust", 1), add("renown.rash", -1)]),
         choice("wenzhi", "strategy", T("托人给温芷带个话。", "Get word to Wen Zhi."),
                T("第七天，温芷提着药箱进了牢房，说是给犯人看病。她走后，你在药包底下摸到一张盖了印的路引。那天夜里，你出了许都。",
                  "On the seventh day Wen Zhi comes into the jail with her medicine chest, saying she's here to treat the prisoners. After she leaves, you find a stamped travel pass under the herbs. That night you are out of Xuchang."),
                [setv("flag.jailed", False), setv("flag.was_jailed"), rel("wenzhi", "intimacy", 1), rel("wenzhi", "trust", 1)],
                req=ANY(F("flag.asked_wenzhi"), AT("wenzhi", "intimacy", 1)), hint=T("需要和温芷走得足够近（亲近在「在意」以上，或托过她打听消息）", "Needs to be close to Wen Zhi (closeness at Caring or above, or have asked her for news)")),
         choice("recant", "dilemma", T("给曹操上书认错。", "Write to Cao Cao and recant."),
                T("曹操看完你的信，笑了：『早这样不就好了。』当天就放了你。可这封信后来传到了刘备耳朵里。他没提，你知道他听说了。",
                  "Cao reads your letter and laughs. 'Why not do this sooner?' You're released that day. But word of the letter reaches Liu Bei. He never mentions it. You know he's heard."),
                [setv("flag.jailed", False), setv("flag.was_jailed"), rel("caocao", "esteem", 1), rel("liubei", "trust", -1)])],
        when=F("flag.jailed"), order=-1))

    # the departure happens without you
    for nid in ("c2_note", "c2_pretext", "c2_xuchu"):
        nd = byid[nid]; nd["when"] = ALL(nd["when"], NF("flag.left_behind")) if nd.get("when") else NF("flag.left_behind")
    byid["c2_campfire"]["intro"].insert(0, P(T("关羽看见你手腕上的勒痕，没问是怎么来的，只往火边让了让。", "Guan Yu sees the rope marks on your wrists. He doesn't ask; he just makes room for you by the fire."), F("flag.left_behind")))

    # ---------- anywhere else Cao holds power over you ----------
    N.append(flash("x_cao_rage", T("曹操发作", "Cao Cao Loses Patience"),
        [P(T("曹操的脸色变了。『刘备的人，在孤面前也敢这样说话？』他抬了抬手，身后的人就把你按在了地上。", "Cao's face changes. 'One of Liu Bei's men, talking like that in front of me?' He lifts a hand, and the men behind him pin you to the floor."), NOT_CAO),
         P(T("曹操把手里的竹简往案上一摔：『孤给你脸，你偏不要。』许褚已经走到了你身后。", "Cao slams his bamboo slips onto the desk. 'I give you face, and you throw it back at me.' Xu Chu is already standing behind you."), V("track", "==", "cao"))],
        [choice("kneel", "expression", T("叩头请罪。", "Bow to the floor and beg his pardon."),
                T("曹操让你在地上跪了一个时辰，才挥了挥手：『滚。』", "Cao leaves you kneeling for an hour before he waves a hand. 'Get out.'"),
                [rel("caocao", "esteem", -2), add("renown.rash")]),
         choice("turn", "strategy", T("用一句妙语把话圆回来。", "Turn it with a well-placed line."),
                T("曹操愣了一下，大笑：『罢了！你这张嘴，迟早害死你。』", "Cao is caught off guard, then roars with laughter. 'Enough! That tongue of yours will be the death of you.'"),
                [rel("caocao", "esteem", -1)], req=AT("caocao", "esteem", 3), hint=T("需要曹操的赏识在「推崇」以上，他才肯听你圆", "Needs Cao's regard at Admired or above for him to let you talk your way out")),
         choice("defy", "dilemma", T("不跪。", "Refuse to kneel."),
                T("许褚的手按上你的肩。关羽站了起来：『此人是我兄长的人。要罚，连关某一起罚。』曹操看了关羽很久，挥了挥手。",
                  "Xu Chu's hand closes on your shoulder. Guan Yu rises. 'This man belongs to my brother. Punish him, and you punish me too.' Cao looks at Guan Yu a long time, then waves his hand."),
                [rel("caocao", "esteem", -2), rel("guanyu", "esteem", 1), add("renown.rash"), setv("flag.cao_wary")], when=NOT_CAO),
         choice("defy_cao", "dilemma", T("不跪。", "Refuse to kneel."),
                T("曹操说：『祢衡走过的路，你也走一遍吧。』第二天，你被送往荆州。", "Cao says, 'Mi Heng's road—you may walk it too.' The next day you are sent to Jingzhou."),
                [setv("flag.mi_heng"), setv("flag.exiled"), add("renown.rash", 2)], when=V("track", "==", "cao"))]))
    N[-1]["choices"][3]["ends"] = True

    # ---------- the plum-wine choice remembers what you said first ----------
    sp = next(c for c in byid["c1_plum"]["choices"] if c["id"] == "speak")
    sp["out"][0]["when"] = H("caocao", "<", 1)
    sp["out"].append(P(T("你把袁绍、刘表、孙策挨个评了一遍。曹操没有笑：『此子三番两次相激，是替谁来试孤的？』他看的是刘备。刘备替你告罪，回去的路上一句话也没说。",
                         "You take Yuan Shao, Liu Biao and Sun Ce apart one by one. Cao doesn't laugh. 'This one keeps baiting me. Who sent him to test me?' He is looking at Liu Bei. Liu Bei apologizes for you and says nothing the whole way home."), H("caocao", ">=", 1)))
    sp["alt"] = [{"when": H("caocao", ">=", 1), "effects": [rel("liubei", "trust", -2), add("renown.cunning"), setv("flag.spoke_at_plum"), setv("flag.cao_wary")]}]

    # ---------- what the confrontation leaves behind ----------
    x = byid["c2_xuchu"]
    x["intro"].append(P(T("许褚追得格外急。梅园那天之后，曹操就没再放心过刘备。", "Xu Chu rides harder than anyone. Since the day in the plum garden, Cao has never trusted Liu Bei."), ALL(F("flag.cao_wary"), NF("flag.fast_departure"))))
    x["intro"].append(P(T("你背上的棍伤还没好，马每颠一下都疼。", "The welts on your back haven't healed; every jolt of the saddle hurts."), F("flag.flogged")))
    t = next(c for c in x["choices"] if c["id"] == "talk")
    t["req"] = NF("flag.cao_wary")
    t["hint"] = T("许褚认得你——梅园那天之后，丞相府的人都认得你", "Xu Chu knows your face. Since the plum garden, everyone in the Chancellor's household does")

    ENDINGS_ADD.setdefault("g_lives", []).append({"id": "jail", "when": F("flag.was_jailed"),
        "text": T("你在许都的大牢里待过三个月。后来有人问起，你只说：那里很安静，适合想事情。", "You spent three months in the Xuchang jail. When people ask about it later, you say only: it was quiet, good for thinking.")})
    ENDINGS_ADD.setdefault("g_lives", []).append({"id": "flogged", "when": F("flag.flogged"),
        "text": T("梅园那二十棍，在你背上留了疤。刘备每次看见，都不说话。", "The twenty strokes from the plum garden left scars on your back. Whenever Liu Bei sees them, he says nothing.")})

# the others present hear it too (once per scene each)
WITNESS = [
    {"who": "liubei", "to": "caocao", "labels": ["rude", "threat", "nonsense"], "effects": [rel("liubei", "trust", -1)]},
    {"who": "zhuge", "to": "liubei", "labels": ["rude", "threat"], "effects": [rel("zhuge", "esteem", -1)]},
    {"who": "liubei", "to": "zhuge", "labels": ["rude", "threat"], "effects": [rel("liubei", "trust", -1)]},
]
FLASH = [
    {"char": "caocao", "node": "x_plum_rage", "nodes": ["c1_plum"]},
    # Cao only acts where he holds power over you; at Changban and Huarong he simply stops listening
    {"char": "caocao", "node": "x_cao_rage", "except": ["c1_plum", "c6_pursuit", "c8_cao"], "resume": True},
]

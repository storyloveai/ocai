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
    VARS["flag.jailed"] = {"type": "flag", "init": False, "label": T("被关进许都大牢", "Thrown into the Xuchang jail")}
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
                [setv("flag.flogged"), setv("flag.cao_wary"), rel("liubei", "trust", 1), rel("caocao", "regard", -2), add("renown.rash")]),
         choice("beg", "expression", T("跟着主公一起伏地请罪。", "Go down beside your lord and beg forgiveness."),
                T("刘备替你磕了三个头。曹操这才笑了：『醉话而已，玄德何必当真。』酒宴照旧。回去的路上，刘备说：『今天差一点，就是你我两条命。』",
                  "Liu Bei touches his head to the floor three times for you. Only then does Cao laugh. 'Drunken talk. Why take it so seriously, Xuande?' The feast goes on. On the way home Liu Bei says, 'Today it nearly cost us both our lives.'"),
                [setv("flag.cao_wary"), rel("liubei", "trust", -2), rel("caocao", "regard", -1)]),
         choice("turn", "strategy", T("举杯转圜：把刚才的狂话，说成是替丞相不平——天下英雄，没人配与丞相对饮。", "Raise your cup and turn it: your wild words were outrage on the Chancellor's behalf—no one in the realm is fit to drink with him."),
                T("曹操盯着你，忽然大笑：『好一张嘴！』他亲自给你斟了一杯。酒宴照旧。只是从那天起，许都多了几双盯着刘备的眼睛。",
                  "Cao stares at you, then bursts out laughing. 'What a tongue!' He pours your cup himself. The feast goes on. But from that day, more eyes in Xuchang are watching Liu Bei."),
                [setv("flag.cao_wary"), rel("caocao", "regard", 1), rel("liubei", "trust", -1), add("renown.cunning")],
                req=V("renown.cunning", ">=", 1), hint=T("需要“权谋”名声 ≥ 1：你得是个出了名会说话的人，曹操才肯接这个台阶", "Needs a name for cunning ≥ 1: Cao only takes the way out from a man known for his tongue")),
         choice("defy", "dilemma", T("梗着脖子，把话说完。", "Lift your chin and finish what you were saying."),
                T("曹操笑了：『好。孤成全你。』你被押进了许都大牢。刘备出城那天，你在牢里听见城外的马蹄声。没有人来接你。",
                  "Cao smiles. 'Very well. You shall have what you want.' You are taken to the Xuchang jail. On the day Liu Bei rides out of the city, you hear the hooves from your cell. No one comes for you."),
                [setv("flag.jailed"), setv("flag.exiled"), add("renown.rash", 2)])]))
    N[-1]["choices"][3]["ends"] = True

    # ---------- anywhere else Cao holds power over you ----------
    N.append(flash("x_cao_rage", T("曹操发作", "Cao Cao Loses Patience"),
        [P(T("曹操的脸色变了。『刘备的人，在孤面前也敢这样说话？』他抬了抬手，身后的人就把你按在了地上。", "Cao's face changes. 'One of Liu Bei's men, talking like that in front of me?' He lifts a hand, and the men behind him pin you to the floor."), NOT_CAO),
         P(T("曹操把手里的竹简往案上一摔：『孤给你脸，你偏不要。』许褚已经走到了你身后。", "Cao slams his bamboo slips onto the desk. 'I give you face, and you throw it back at me.' Xu Chu is already standing behind you."), V("track", "==", "cao"))],
        [choice("kneel", "expression", T("叩头请罪。", "Bow to the floor and beg his pardon."),
                T("曹操让你在地上跪了一个时辰，才挥了挥手：『滚。』", "Cao leaves you kneeling for an hour before he waves a hand. 'Get out.'"),
                [rel("caocao", "regard", -2), add("renown.rash")]),
         choice("turn", "strategy", T("用一句妙语把话圆回来。", "Turn it with a well-placed line."),
                T("曹操愣了一下，大笑：『罢了！你这张嘴，迟早害死你。』", "Cao is caught off guard, then roars with laughter. 'Enough! That tongue of yours will be the death of you.'"),
                [rel("caocao", "regard", -1)], req=R("caocao", "regard", ">=", 5), hint=T("需要曹操的赏识 ≥ 5，他才肯听你圆", "Needs Cao's regard ≥ 5 for him to let you talk your way out")),
         choice("defy", "dilemma", T("不跪。", "Refuse to kneel."),
                [P(T("曹操没有杀你，只是把你关了起来。等你出来，仗已经打完了。", "Cao doesn't kill you. He just locks you up. By the time you're let out, the war is over."), NOT_CAO),
                 P(T("曹操说：『祢衡走过的路，你也走一遍吧。』第二天，你被送往荆州。", "Cao says, 'Mi Heng's road—you may walk it too.' The next day you are sent to Jingzhou."), V("track", "==", "cao"))],
                [setv("flag.jailed"), setv("flag.exiled"), add("renown.rash", 2)])]))
    N[-1]["choices"][2]["ends"] = True
    N[-1]["choices"][2]["alt"] = [{"when": V("track", "==", "cao"), "effects": [setv("flag.mi_heng"), setv("flag.exiled"), add("renown.rash", 2)]}]

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

    ENDINGS_ADD.setdefault("g_side", []).insert(0, {"id": "jailed", "when": F("flag.jailed"),
        "text": T("你在许都的大牢里过完了那几年。出来时，天下已经换了样子。人们说起梅园煮酒，只记得刘备掉了筷子，没人记得席上还有一个狂生。",
                  "You spend those years in a Xuchang cell. When you come out, the realm has changed. When people talk about the plum-wine meeting, they remember Liu Bei dropping his chopsticks. No one remembers the madman at the table.")})
    ENDINGS_ADD.setdefault("g_lives", []).append({"id": "flogged", "when": F("flag.flogged"),
        "text": T("梅园那二十棍，在你背上留了疤。刘备每次看见，都不说话。", "The twenty strokes from the plum garden left scars on your back. Whenever Liu Bei sees them, he says nothing.")})

# the others present hear it too (once per scene each)
WITNESS = [
    {"who": "liubei", "to": "caocao", "labels": ["rude", "threat", "nonsense"], "effects": [rel("liubei", "trust", -1)]},
    {"who": "zhuge", "to": "liubei", "labels": ["rude", "threat"], "effects": [rel("zhuge", "respect", -1)]},
    {"who": "liubei", "to": "zhuge", "labels": ["rude", "threat"], "effects": [rel("liubei", "trust", -1)]},
]
FLASH = [
    {"char": "caocao", "node": "x_plum_rage", "nodes": ["c1_plum"]},
    # Cao only acts where he holds power over you; at Changban and Huarong he simply stops listening
    {"char": "caocao", "node": "x_cao_rage", "except": ["c1_plum", "c6_pursuit", "c8_cao"], "resume": True},
]

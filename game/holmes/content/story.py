#!/usr/bin/env python3
"""《贝克街》卷一《血字的研究》。玩家是华生。跑一遍生成 content/campaign.json：python3 game/holmes/content/story.py"""
import json, pathlib, sys
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from lib import *
import scarlet_a, scarlet_b, scarlet_c

def char(zh, en, dims, persona, values, main="trust"):
    return {"name": T(zh, en), "dims": {k: [v, 0, 10] for k, v in dims.items()}, "original": False, "main": main, "persona": persona, "values": values}

D = lambda w=2, t=2, e=2: {"warmth": w, "trust": t, "esteem": e}
CHARS = {
  "holmes": char("歇洛克·福尔摩斯", "Sherlock Holmes", D(2, 2, 2),
      T("歇洛克·福尔摩斯：27 岁，世界上唯一的咨询侦探。高瘦，目光锐利，热情起来像个孩子，消沉时几天不开口。只记对破案有用的知识（不知道地球绕太阳转）。看重观察力，讨厌瞎猜和自以为是。叫华生“华生”或“医生”。",
        "Sherlock Holmes, 27, the world's only consulting detective. Tall, lean, piercing eyes; childlike enthusiasm when working, days of silence when not. Keeps only knowledge useful to his work. Values observation; despises guessing and conceit. Calls the player 'Watson' or 'Doctor'."),
      {"zhen": ["esteem", 1], "ren": ["trust", 1], "qing": ["warmth", 1], "hen": ["warmth", -1], "li": ["esteem", -1]}, main="esteem"),
  "lestrade": char("雷斯垂德", "Inspector Lestrade", D(2, 2, 2),
      T("雷斯垂德：苏格兰场探长，瘦小、黄脸、精明又固执，和葛莱森互相嫉妒。爱抢功，但不坏。", "Lestrade: Scotland Yard inspector, small, sallow, shrewd and stubborn; jealous rival of Gregson. Likes credit, but not a bad man."),
      {"li": ["trust", 1], "zhen": ["esteem", 1], "hen": ["warmth", -1]}),
  "gregson": char("葛莱森", "Inspector Gregson", D(2, 2, 2),
      T("葛莱森：苏格兰场探长，高个、白脸、淡黄头发，精力旺盛，自以为是。", "Gregson: Scotland Yard inspector, tall, white-faced, flaxen-haired, energetic and self-satisfied."),
      {"li": ["warmth", 1], "zhen": ["esteem", 1], "hen": ["trust", -1]}),
  "hudson": char("哈德森太太", "Mrs Hudson", D(3, 2, 2), T("哈德森太太：贝克街 221B 的房东，和气、能干、耐心极好。", "Mrs Hudson: landlady of 221B Baker Street; kind, capable, endlessly patient."),
      {"qing": ["warmth", 1], "hen": ["warmth", -1]}, main="warmth"),
  "stamford": char("斯坦福", "Stamford", D(2, 2, 2), T("斯坦福：华生在巴茨医院的旧助手，年轻、爽快。", "Stamford: Watson's former dresser at Barts; young and friendly."), {"qing": ["warmth", 1]}, main="warmth"),
  "rance": char("约翰·兰斯", "Constable John Rance", D(1, 2, 2), T("约翰·兰斯：值夜班的警员，被从床上叫醒，不太高兴；给点好处话就多了。", "John Rance: the night constable, grumpy at being woken; loosens up for a coin."),
      {"li": ["warmth", 1], "hen": ["trust", -1]}, main="warmth"),
  "sawyer": char("索耶太太", "Mrs Sawyer", D(2, 1, 2), T("“索耶太太”：来认领戒指的老太太。其实是霍普的朋友，一个年轻男人假扮的。", "'Mrs Sawyer': the old woman who claims the ring — in fact a young friend of Hope's in disguise."), {"qing": ["warmth", 1]}),
  "hope": char("杰弗逊·霍普", "Jefferson Hope", D(1, 1, 2),
      T("杰弗逊·霍普：伦敦的马车夫，美国人。为死去的未婚妻露西追了仇人二十年。冷静、坦荡，知道自己快死了（主动脉瘤）。", "Jefferson Hope: an American cabman in London who hunted his dead fiancée's persecutors for twenty years. Calm and frank; knows he is dying (aortic aneurism)."),
      {"qing": ["warmth", 1], "yi": ["esteem", 1], "zhen": ["trust", 1]}),
}
PLAYER = T("华生", "Watson")
VARS = {}
for cid, c in CHARS.items():
    for dim, (init, lo, hi) in c["dims"].items():
        VARS[f"rel.{cid}.{dim}"] = {"type": "num", "init": init, "min": lo, "max": hi, "char": cid, "dim": dim, "label": T(f"{c['name']['zh']}·{dim}", f"{c['name']['en']} · {dim}")}
VARS["proof"] = {"type": "num", "init": 0, "min": 0, "max": 20, "label": T("线索", "Clues")}
VARS["alert"] = {"type": "num", "init": 0, "min": 0, "max": 3, "label": T("打草惊蛇", "Alarm")}
VARS["deduce"] = {"type": "num", "init": 0, "min": 0, "max": 10, "label": T("华生自己看穿的", "What Watson worked out himself")}
for cid, zh, en in scarlet_b.CLUES: VARS[f"clue.{cid}"] = {"type": "flag", "init": False, "label": T(zh, en), "clue": True}
for f, zh, en in scarlet_a.FLAGS + scarlet_b.FLAGS + scarlet_c.FLAGS: VARS[f] = {"type": "flag", "init": False, "label": T(zh, en)}

CHAPTERS = scarlet_a.CHAPTERS + scarlet_b.CHAPTERS + scarlet_c.CHAPTERS
NODES = scarlet_a.NODES + scarlet_b.NODES + scarlet_c.NODES

ENDINGS = [
  {"id": "g_rating", "title": T("这一案，华生看穿了多少", "How much Watson saw"), "fragments": [
    {"id": "ahead", "title": T("抢先看穿", "One Step Ahead"), "text": T("福尔摩斯揭晓之前，你已经说出了答案。他看了你很久，说：“华生，你在进步。”这是他第一次这么说。", "Before Holmes revealed it, you had already said it. He looked at you a long moment: 'Watson, you improve.' It was the first time he had said so."),
     "when": ALL(V("deduce", ">=", 4), V("proof", ">=", 4))},
    {"id": "kept_up", "title": T("跟上了", "Kept Up"), "text": T("真相揭开时，你没有太吃惊。有些环节你想到了，有些没有。", "When the truth came out, you were not too surprised. You had seen some links of the chain, if not all."),
     "when": ALL(V("deduce", ">=", 2), V("deduce", "<=", 3))},
    {"id": "in_dark", "title": T("被蒙在鼓里", "In the Dark"), "text": T("手铐咔嗒一声响的时候，你和两位探长一样目瞪口呆。“你看了，华生，可你没有观察。”", "When the handcuffs clicked, you were as dumbfounded as the two inspectors. 'You see, Watson, but you do not observe.'"),
     "when": V("deduce", "<=", 1)},
    {"id": "lucky", "title": T("猜中了", "A Lucky Guess"), "text": T("你说对了，可你手里的线索撑不起你的答案。福尔摩斯说：“猜测是个坏习惯。”", "You were right, but your clues could not carry your answer. 'Guessing is a shocking habit,' said Holmes."),
     "when": ALL(V("deduce", ">=", 4), V("proof", "<=", 3))}]},
  {"id": "g_holmes", "title": T("你和福尔摩斯", "You and Holmes"), "fragments": [
    {"id": "partner", "text": T("那以后，他出门查案，总会先问一句：“你来吗，华生？”", "After that, whenever he went out on a case, he would ask first: 'Are you coming, Watson?'"), "when": AT("holmes", "esteem", 3)},
    {"id": "lodger", "text": T("你们仍是合租的室友。他的案子，他愿意说就说。", "You remained fellow lodgers. Of his cases, he told you what he chose."), "when": UPTO("holmes", "esteem", 2)}]},
  {"id": "g_yard", "title": T("苏格兰场", "Scotland Yard"), "fragments": [
    {"id": "friend", "text": T("雷斯垂德下回来贝克街，先跟你打了招呼。", "Next time Lestrade came to Baker Street, he greeted you first."), "when": AT("lestrade", "trust", 2)},
    {"id": "sour", "text": T("雷斯垂德提起你时，嘴撇了一下。", "When Lestrade mentioned you, his mouth twisted."), "when": UPTO("lestrade", "warmth", 0)},
    {"id": "plain", "text": T("两位探长忙着领奖，没顾上看你一眼。", "The two inspectors were too busy with their testimonial to spare you a glance."), "when": ALL(UPTO("lestrade", "trust", 0), AT("lestrade", "warmth", 1))}]},
  {"id": "g_journal", "title": T("日记", "The Journal"), "fragments": [
    {"id": "write", "text": T("你的日记本上，第一页写着：《血字的研究》。", "On the first page of your journal you wrote: 'A Study in Scarlet'."), "when": F("flag.journal")},
    {"id": "nowrite", "text": T("这件案子，后来只有你们两个人记得。", "Afterwards, only the two of you remembered the case."), "when": NF("flag.journal")}]},
  {"id": "g_alert", "title": T("那个朋友", "The Friend"), "fragments": [
    {"id": "safe", "text": T("那个扮成老太太的年轻人，再也没有出现。", "The young man who played the old woman was never seen again."), "when": NF("flag.hope_warned")},
    {"id": "fled", "text": T("报纸登出消息的那天，有人看见一个年轻人匆匆上了去利物浦的火车。", "On the day the papers ran the story, a young man was seen hurrying onto the Liverpool train."), "when": F("flag.hope_warned")}]},
  {"id": "g_hope", "title": T("杰弗逊·霍普", "Jefferson Hope"), "fragments": [
    {"id": "heard", "text": T("你把霍普的话一字一句写了下来。他说，他不想被人当成一个普通的杀人犯。", "You wrote down Hope's words, every one. He did not want to be remembered as a common cut-throat."), "when": AT("hope", "trust", 1)},
    {"id": "judged", "text": T("霍普死在了法庭开庭之前。那个更高的法庭，已经审过他了。", "Hope died before his trial. A higher Judge had taken the case in hand."), "when": UPTO("hope", "trust", 0)}]},
]

ART = {
  "bg": {"street_fog": T("伦敦街道 · 雾", "London street · fog"), "lab": T("巴茨医院化学实验室", "Barts chemical laboratory"), "baker_day": T("贝克街 221B · 白天", "221B Baker Street · day"),
         "baker_night": T("贝克街 221B · 夜晚", "221B Baker Street · night"), "lauriston_out": T("劳瑞斯顿花园 3 号", "No. 3 Lauriston Gardens"),
         "lauriston_in": T("空屋前厅", "The empty front room"), "station": T("警察局", "Police station"), "utah": T("北美大荒原", "The great alkali plain")},
  "cg": {"cg_meet": T("“你到过阿富汗”", "'You have been in Afghanistan'"), "cg_rache": T("墙上的字", "The word on the wall"), "cg_lens": T("卷尺与放大镜", "Tape measure and lens"),
         "cg_arrest": T("杰弗逊·霍普落网", "The arrest of Jefferson Hope"), "cg_journal": T("日记", "The journal"), "title": T("标题", "Title")},
  "faces": {"normal": T("平常", "neutral"), "smile": T("笑", "smile"), "angry": T("生气", "angry"), "sad": T("难过", "sad"), "surprised": T("吃惊", "surprised")},
}

CAMPAIGN = {
  "spec": SPEC, "tiers": TIERS(), "pack": PACK("mystery-revenge"),
  "resources": {"proof": ["proof"], "risk": ["alert"]},
  "id": "bakerstreet_v1", "title": T("贝克街", "Baker Street"), "volume": T("卷一 · 血字的研究", "Volume 1 · A Study in Scarlet"),
  "rights": {"source": "柯南·道尔《血字的研究》（1887，公版）", "original_characters": []},
  "player": {"name": PLAYER}, "format": "vn",
  "vars": VARS, "chars": CHARS, "dims": {}, "echoes": {}, "debts": {},
  "chapters": CHAPTERS, "nodes": {n["id"]: n for n in NODES}, "endings": ENDINGS, "art": ART,
}
CAMPAIGN["value_tags"] = CAMPAIGN["pack"]["values"]

if __name__ == "__main__":
    out = HERE / "campaign.json"
    out.write_text(json.dumps(CAMPAIGN, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("nodes", len(NODES), "->", out)

#!/usr/bin/env python3
"""《灰烬王冠》galgame · 灯火线试样（序章、第一章到第三章）。原创作品，改编自 game/ashen/novel/ 里的同名小说。
所有角色都是成年人。玩法见 docs/游戏方案.md。
跑一遍生成 content/campaign.json：python3 game/ashen/content/story.py"""
import json, pathlib, sys
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from lib import *
import ch1, ch2, ch3

# ---------------- 人物（产品决定：目前没有可恋爱角色） ----------------
def char(zh, en, dims, persona, values, main="trust"):
    return {"name": T(zh, en), "dims": {k: [v, 0, 10] for k, v in dims.items()}, "original": True, "main": main,
            "persona": persona, "values": values}

CHARS = {
  "lamp": char("提灯", "Lamp", {"warmth": 2, "trust": 2, "esteem": 2},
      T("提灯：遗器“提灯”的器灵。看上去十八九岁的银发少年，白衬衫，眼睛像两簇烛火。说话轻飘飘的，替林栖全力出手时拿走一段温暖的记忆，由他挑。他不记得自己从前是谁。",
        "Lamp: the spirit of the relic 'the Lamp'. Looks like a silver-haired youth of about nineteen in a white shirt, eyes like two candle flames. Speaks lightly; whenever Lin goes all out he takes one warm memory, and he chooses which. He doesn't remember who he used to be."),
      {"xiu": ["warmth", 1], "ji": ["trust", 1], "xin": ["trust", 1]}),
  "gran": char("葛兰", "Gran", {"warmth": 0, "trust": 0, "esteem": 1},
      T("葛兰·霍克：34 岁，旧港锚链酒吧的老板，术式世家霍克家被赶出门的长子，断剑的持有者。打架的人，话少，心里压着对父亲的事。",
        "Gran Hawke: 34, owner of the Anchor Chain bar in the old harbor, the disowned eldest son of the Hawke spell-family, holder of the Broken Sword. A fighter, few words, his father heavy on his mind."),
      {"yong": ["esteem", 1], "xin": ["trust", 1], "shou": ["warmth", 1]}),
  "sword": char("断剑", "Broken Sword", {"warmth": 1, "trust": 0, "esteem": 1},
      T("断剑：遗器“断剑”的器灵，红发、皮夹克、小虎牙，爱喝朗姆，喝不醉。能斩断连结：术式、契约、因果。",
        "Broken Sword: spirit of the relic, red hair, leather jacket, a sharp canine; loves rum and never gets drunk. She cuts connections: spells, contracts, causes."),
      {"yong": ["esteem", 1], "duo": ["esteem", 1]}),
  "evelyn": char("伊芙琳", "Evelyn", {"warmth": 0, "trust": 0, "esteem": 1},
      T("伊芙琳·冯·艾希：24 岁，艾希家的次女，荆棘冠的持有者。从来没有输过，父亲却选了姐姐当继承人。冷，准，把对手当成要评估的东西。",
        "Evelyn von Eiche: 24, second daughter of the Eiche family, holder of the Thorn Crown. Has never lost; her father chose her sister as heir anyway. Cold, precise, sizes up opponents like goods."),
      {"duo": ["esteem", 1], "yong": ["esteem", 1]}),
  "august": char("奥古斯特", "August", {"warmth": 1, "trust": 1, "esteem": 1},
      T("奥古斯特·莱恩：60 岁上下，守秘局外勤监督官，干了四十一年，同事叫他“胶水”。守规矩，替普通人把魔法留下的痕迹补好。",
        "August Lane: about 60, a field supervisor at the Secrecy Bureau for forty-one years; colleagues call him 'Glue'. Keeps the rules and patches over what magic leaves behind so ordinary people never see it."),
      {"xin": ["trust", 1], "shou": ["esteem", 1], "ji": ["warmth", 1]}),
  "baiqiu": char("白秋", "Bai Qiu", {"warmth": 0, "trust": 0, "esteem": 1},
      T("白秋：29 岁，在听潮茶楼三楼做情报生意，天平的持有者。银灰长发，木簪，旗袍式外套。天平拿走她做选择时的犹豫，所以她什么都决定得很快。",
        "Bai Qiu: 29, deals information from the third floor of the Tidelistening Teahouse; holder of the Scales. Silver-grey hair, a wooden pin, a qipao-cut coat. The Scales take her hesitation, so she decides everything fast."),
      {"duo": ["esteem", 1], "xin": ["trust", 1], "xiu": ["warmth", 1]}),
}
NAMES = {cid: c["name"] for cid, c in CHARS.items()}
PLAYER = T("林栖", "Lin Qi")

VARS = {}
for cid, c in CHARS.items():
    for dim, (init, lo, hi) in c["dims"].items():
        VARS[f"rel.{cid}.{dim}"] = {"type": "num", "init": init, "min": lo, "max": hi, "char": cid, "dim": dim,
                                    "label": T(f"{c['name']['zh']}·{dim}", f"{c['name']['en']} · {dim}")}
VARS["light"] = {"type": "num", "init": 0, "min": 0, "max": 6, "label": T("余裕", "Margin")}
VARS["memories"] = {"type": "num", "init": 6, "min": 0, "max": 6, "label": T("记忆", "Memories")}
VARS["notice"] = {"type": "num", "init": 0, "min": 0, "max": 5, "label": T("守秘局的注意", "Bureau's notice")}

# 记忆册：林栖还记得的事。mem.<id> 为真就是还记得。顺序就是提灯“挑”的顺序（最温暖的先）。
MEMORIES = [
  {"id": "ride", "title": T("学骑车的下午", "The afternoon I learned to ride"),
   "text": T("院子里的梧桐树，一辆天蓝色的小自行车。有个人在后面扶着车座跟着跑，然后松了手。", "The plane tree in the yard, a little sky-blue bicycle. Someone ran behind holding the seat, then let go.")},
  {"id": "praise", "title": T("第一次被父亲夸手巧", "The first time Dad praised my hands"),
   "text": T("台灯下拆开的闹钟。它重新走起来的时候，一只带着机油味的大手揉了揉我的头。", "An alarm clock in pieces under the desk lamp. When it ticked again, a big hand that smelled of machine oil ruffled my hair.")},
  {"id": "musicbox", "title": T("第一次修好八音盒", "Fixing my first music box"),
   "text": T("五岁，蹲在梧桐树底下修了一整个下午。妈妈叫我吃饭，我说它现在就坏着，它现在就难受。", "Five years old, squatting under the plane tree all afternoon. Mum called me in to eat; I said it's broken right now, it hurts right now.")},
  {"id": "coat", "title": T("妈妈的蓝外套", "Mum's blue coat"),
   "text": T("洗得发白，左边袖口有一块她自己缝的补丁，针脚歪歪扭扭。冬天她把我的手揣进口袋里。", "Washed pale, a patch she sewed herself on the left cuff, crooked stitches. In winter she tucked my hands into its pocket.")},
  {"id": "soup", "title": T("很咸的番茄蛋汤", "The too-salty tomato-and-egg soup"),
   "text": T("每次都咸，她自己从来不觉得。", "Salty every single time; she never noticed.")},
  {"id": "photo", "title": T("港口的照片", "The photo at the harbor"),
   "text": T("我举着手去够海鸥。照片上我身边那一块是空白——可我记得那里站着她。", "I'm reaching for a gull. Beside me in the photo is a blank—but I remember she stood there.")},
]
for m in MEMORIES:
    VARS[f"mem.{m['id']}"] = {"type": "flag", "init": True, "label": T("记得：" + m["title"]["zh"], "Remembers: " + m["title"]["en"])}

FLAGS = ch1.FLAGS + ch2.FLAGS + ch3.FLAGS + [
    ("flag.never", "（试样里不会解开）", "(not unlocked in the pilot)"),
]
for f, zh, en in FLAGS: VARS[f] = {"type": "flag", "init": False, "label": T(zh, en)}

CHAPTERS = ch1.CHAPTERS + ch2.CHAPTERS + ch3.CHAPTERS
NODES = ch1.NODES + ch2.NODES + ch3.NODES

# ---------------- 结局 ----------------
# 坏结局在前（谁先满足条件谁算），每个坏结局带一段“灰城诊所”：告诉玩家回到哪一步、为什么。
DEAD = ch1.DEAD + ch2.DEAD + ch3.DEAD
ENDINGS = [
  {"id": "g_end", "title": T("结局", "Ending"), "fragments": [
     {"id": d["id"], "title": d["title"], "text": d["text"], "when": F(d["flag"]), "dead": True, "clinic": d["clinic"], **({"cg": d["cg"]} if d.get("cg") else {})} for d in DEAD] + [
     {"id": "pilot", "title": T("灯火线 · 试样到此", "The Lamplight Route · end of the sample"), "cg": "cg_lamp_lit",
      "text": T("钟楼敲了十二下。第七次灰烬王冠之争的第三天过去了。你登记了名字，见过了断剑、守秘局和天平。灯还亮着。",
                "The clock tower strikes twelve. The third day of the seventh Ashen Crown war is over. You registered your name and met the Sword, the Bureau and the Scales. The lamp is still lit."),
      "when": F("flag.c3_done")}]},
  {"id": "g_mem", "title": T("记忆册", "The memory book"), "fragments": [
     {"id": "whole", "text": T("记忆册里一页都没有变灰。你学会了在不全力的时候，也能把东西修好。", "Not one page of the memory book has gone grey. You learned to mend things without going all out."), "when": V("memories", ">=", 6)},
     {"id": "some", "text": T("记忆册里有几页变灰了。你知道那里写过很温暖的事，只是想不起来是什么。", "A few pages of the memory book have gone grey. You know something warm was written there; you can't recall what."), "when": V("memories", "<=", 5)}]},
  {"id": "g_gran", "title": T("葛兰", "Gran"), "fragments": [
     {"id": "ally", "text": T("葛兰在摩天轮底下说：下回打架，叫上我。你没想到自己会记住这句话。", "Under the Ferris wheel Gran said: next time there's a fight, call me. You didn't expect to remember that."), "when": AT("gran", "trust", 2)},
     {"id": "rival", "text": T("葛兰还是你的对手。他喝完了那瓶啤酒，没有再说什么。", "Gran is still your opponent. He finished the beer and said nothing more."), "when": UPTO("gran", "trust", 1)}]},
]

# ---------------- 遗器档案（随剧情一格一格解开；页面把解开过的记在本机，二周目也看得到） ----------------
def row(zh_label, en_label, zh, en, when): return {"label": T(zh_label, en_label), "text": T(zh, en), "when": when}
REG = F("flag.registered")
ARCHIVE = [
  {"id": "lamp", "name": T("提灯", "The Lamp"), "rows": [
     row("持有者", "Holder", "林栖", "Lin Qi", F("flag.contract")),
     row("力量", "Power", "修复：让坏掉的东西想起原本的样子。", "Mending: makes broken things remember what they were.", F("flag.contract")),
     row("代价", "Price", "温暖的记忆，由提灯挑。", "Warm memories, chosen by the Lamp.", F("flag.contract")),
     row("灯座底下", "Under the base", "两个字母：M. & S.", "Two letters: M. & S.", F("flag.saw_initials")),
     row("真名", "True name", "（试样里不会揭晓）", "(not revealed in the sample)", F("flag.never"))]},
  {"id": "sword", "name": T("断剑", "The Broken Sword"), "rows": [
     row("持有者", "Holder", "葛兰·霍克", "Gran Hawke", F("flag.met_gran")),
     row("力量", "Power", "斩断连结：术式、契约、因果。", "Severing: spells, contracts, causes.", F("flag.met_gran")),
     row("断口", "The break", "六十年前断的。白秋说，是提灯的上一任主人折断的——真假不知道。", "Broken sixty years ago. Bai Qiu says the Lamp's last holder broke it—true or not, unknown.", F("flag.heard_sword")),
     row("想要的", "What she wants", "“等到第六十年，帮我一个忙。”", "'In the sixtieth year, do me a favor.'", F("flag.know_gran"))]},
  {"id": "crown", "name": T("荆棘冠", "The Thorn Crown"), "rows": [
     row("持有者", "Holder", "伊芙琳·冯·艾希", "Evelyn von Eiche", ANY(F("flag.know_evelyn"), REG)),
     row("器灵", "Spirit", "一个捧着空白书的诗人。", "A poet holding a blank book.", F("flag.know_evelyn")),
     row("下一个目标", "Next target", "卡罗·文斯手里的墨水瓶。", "Carlo Vince's Inkwell.", F("flag.heard_ink"))]},
  {"id": "scales", "name": T("天平", "The Scales"), "rows": [
     row("持有者", "Holder", "白秋", "Bai Qiu", REG),
     row("力量", "Power", "交换：两件事物的重量、位置，甚至命运。", "Exchange: the weight, place, even fate of two things.", F("flag.met_baiqiu")),
     row("代价", "Price", "做选择时的犹豫。", "Hesitation when choosing.", F("flag.know_baiqiu")),
     row("裂纹", "The crack", "被太重的东西压裂的。林栖修好了它。", "Cracked by something too heavy. Lin mended it.", F("flag.fixed_scales"))]},
  {"id": "chess", "name": T("棋盘", "The Chessboard"), "rows": [row("持有者", "Holder", "（未登记）", "(unregistered)", REG)]},
  {"id": "mirror", "name": T("镜子", "The Mirror"), "rows": [row("持有者", "Holder", "雷恩，A.", "Rhine, A.", REG)]},
  {"id": "clock", "name": T("钟", "The Clock"), "rows": [row("持有者", "Holder", "雷恩，B.", "Rhine, B.", REG)]},
  {"id": "anchor", "name": T("锚", "The Anchor"), "rows": [row("持有者", "Holder", "（空）", "(none)", REG)]},
  {"id": "kite", "name": T("风筝", "The Kite"), "rows": [row("持有者", "Holder", "（空）", "(none)", REG)]},
  {"id": "ink", "name": T("墨水瓶", "The Inkwell"), "rows": [row("持有者", "Holder", "卡罗·文斯", "Carlo Vince", REG)]},
  {"id": "cradle", "name": T("摇篮", "The Cradle"), "rows": [row("持有者", "Holder", "（空）", "(none)", REG)]},
  {"id": "key", "name": T("钥匙", "The Key"), "rows": [
     row("持有者", "Holder", "这一栏是空白。不是“空”，也不是“未登记”。", "This line is blank. Not 'none', not 'unregistered'.", REG),
     row("监督官说", "The supervisor says", "四百二十年来，钥匙那一栏从来没有填过。可是每一次王冠打开，都要用到它。", "In four hundred and twenty years the Key's line has never been filled. Yet every time the Crown opens, it is used.", REG)]},
]

# ---------------- 美术清单（两版画风共用名字：art/anime/... 和 art/real/...） ----------------
ART = {
  "bg": {**ch1.BG, **ch2.BG, **ch3.BG},
  "cg": {**ch1.CG, **ch2.CG, **ch3.CG, "title": T("标题", "Title")},
  "faces": {"normal": T("平常", "neutral"), "smile": T("笑", "smile"), "serious": T("认真", "serious"), "angry": T("生气", "angry"),
            "sad": T("难过", "sad"), "surprised": T("吃惊", "surprised"), "battle": T("战斗", "battle")},
  "styles": {"anime": T("动漫", "Anime"), "real": T("写实", "Realistic")},
}

# 记忆册和葛兰两组只在走完试样时出现；坏结局后面只有结局本身和灰城诊所
for g in ENDINGS[1:]:
    for f in g["fragments"]: f["when"] = ALL(F("flag.c3_done"), f["when"])

CAMPAIGN = {
    "spec": SPEC, "tiers": TIERS(), "pack": PACK("relic-war"),
    "resources": {"power": ["light"], "memory": ["memories"], "risk": ["notice"]},
    "id": "ashen_v1", "title": T("灰烬王冠", "The Ashen Crown"), "volume": T("灯火线 · 试样", "The Lamplight Route · sample"),
    "rights": {"source": "原创（改编自本项目的同名小说）", "original_characters": ["林栖（玩家）", "提灯", "葛兰", "断剑", "伊芙琳", "奥古斯特", "白秋"]},
    "player": {"name": PLAYER}, "format": "vn",
    "vars": VARS, "chars": CHARS, "dims": {}, "echoes": {}, "debts": {},
    "chapters": CHAPTERS, "nodes": {n["id"]: n for n in NODES}, "endings": ENDINGS,
    "side_prompt": T("这一夜，城里不止你一个人醒着。读谁的？", "Tonight you are not the only one awake in the city. Whose night will you read?"),
    "art": ART, "memories": MEMORIES, "archive": ARCHIVE,
}

if __name__ == "__main__":
    out = HERE / "campaign.json"
    out.write_text(json.dumps(CAMPAIGN, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("nodes", len(NODES), "->", out)

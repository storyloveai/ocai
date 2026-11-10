#!/usr/bin/env python3
"""《灰烬王冠》galgame · 卷一《灯火》（序章、第一章到第七章）。原创作品，改编自 game/ashen/novel/ 里的同名小说。
所有角色都是成年人。玩法见 docs/游戏方案.md。
跑一遍生成 content/campaign.json：python3 game/ashen/content/story.py"""
import json, pathlib, sys
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from lib import *
import ch1, ch2, ch3, ch4, ch5, ch6, ch7
CH = [ch1, ch2, ch3, ch4, ch5, ch6, ch7]

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
  "carlo": char("卡罗", "Carlo", {"warmth": 1, "trust": 0, "esteem": 1},
      T("卡罗·文斯：27 岁，荧光绿头发的涂鸦画家，墨水瓶的持有者。想让所有人都能看见魔法。",
        "Carlo Vince: 27, a neon-haired street painter, holder of the Inkwell. Wants everyone to be able to see magic."),
      {"xin": ["trust", 1], "yong": ["esteem", 1]}),
  "suman": char("苏蔓", "Su Man", {"warmth": 0, "trust": 0, "esteem": 1},
      T("苏蔓：31 岁，中心医院急诊科医生，守秘局的合作医生，摇篮的持有者。不想赢，想阻止王冠被打开。",
        "Su Man: 31, an emergency doctor at Central Hospital who treats the Bureau's cases; holder of the Cradle. Doesn't want to win; wants to stop the Crown from opening."),
      {"xin": ["trust", 1], "xiu": ["warmth", 1], "shou": ["esteem", 1]}),
  "adam": char("亚当", "Adam", {"warmth": 0, "trust": 0, "esteem": 0},
      T("亚当·雷恩：双胞胎里的哥哥，戴黑色头戴式耳机，镜子的持有者。替弟弟坐过三年牢。", "Adam Rhine: the elder twin, black headphones, holder of the Mirror. Served three years for his brother."),
      {"xin": ["trust", 1], "xiu": ["warmth", 1]}),
  "ben": char("本", "Ben", {"warmth": 0, "trust": 0, "esteem": 0},
      T("本·雷恩：双胞胎里的弟弟，戴黑色口罩，钟的持有者。钟拿走时间的顺序。", "Ben Rhine: the younger twin, black mask, holder of the Clock. The Clock takes the order of time."),
      {"xin": ["trust", 1], "xiu": ["warmth", 1]}),
}
# 器灵和配角：关系轴照样有（引擎要求），剧本里基本不动
for cid, zh, en, pz, pe in [
    ("cradle", "摇篮", "Cradle", "摇篮：遗器“摇篮”的器灵，戴面纱的女人，很少说话。能让人和伤口睡着，代价是对未来的期待。", "Cradle: the spirit of the relic, a veiled woman who rarely speaks. She can put people and wounds to sleep; the price is hope for what's ahead."),
    ("poet", "诗人", "Poet", "诗人：荆棘冠的器灵，黑发，长外套，捧着一本没有字的书。", "Poet: the Thorn Crown's spirit, dark-haired, in a long coat, holding a book with no words."),
    ("ink", "墨水瓶", "Inkwell", "墨水瓶：书记员模样的器灵，戴眼镜，拿羽毛笔。写下来的东西会暂时成真。", "Inkwell: a clerkish spirit in spectacles with a quill. What it writes comes true for a while."),
    ("kite", "风筝", "Kite", "风筝：光着脚的长发少女，头发长到脚踝。", "Kite: a barefoot girl whose hair reaches her ankles."),
    ("merlo", "撑黑伞的人", "The man with the umbrella", "撑黑伞的男人：在钟楼上看棋盘的人，名字还没有人知道。", "The man with the black umbrella: he watches a chessboard atop the clock tower; no one yet knows his name.")]:
    CHARS[cid] = char(zh, en, {"warmth": 0, "trust": 0, "esteem": 0}, T(pz, pe), {"ji": ["trust", 1]})
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

FLAGS = sum((c.FLAGS for c in CH), []) + [
    ("flag.never", "（卷一里不会解开）", "(not unlocked in Volume 1)"),
]
for f, zh, en in FLAGS: VARS[f] = {"type": "flag", "init": False, "label": T(zh, en)}

CHAPTERS = sum((c.CHAPTERS for c in CH), [])
NODES = sum((c.NODES for c in CH), [])

# ---------------- 结局 ----------------
# 坏结局在前（谁先满足条件谁算），每个坏结局带一段“灰城诊所”：告诉玩家回到哪一步、为什么。
DEAD = sum((c.DEAD for c in CH), [])
ENDINGS = [
  {"id": "g_end", "title": T("结局", "Ending"), "fragments": [
     {"id": d["id"], "title": d["title"], "text": d["text"], "when": F(d["flag"]), "dead": True, "clinic": d["clinic"], **({"cg": d["cg"]} if d.get("cg") else {})} for d in DEAD] + [
     {"id": "vol1", "title": T("卷一《灯火》完", "Volume 1, Lamplight · The End"), "cg": "cg_plaza",
      "text": T("荆棘王冠悬在维斯特林的夜空里。伊芙琳给了所有人七天，而你是第一个。灯是暖的。卷二《结盟》，从这七天开始。",
                "The crown of thorns hangs over Westerling. Evelyn has given everyone seven days, and you are first. The lamp is warm. Volume 2, Alliance, begins with those seven days."),
      "when": F("flag.c7_done")}]},
  {"id": "g_mem", "title": T("记忆册", "The memory book"), "fragments": [
     {"id": "whole", "text": T("记忆册里一页都没有变灰。你学会了在不全力的时候，也能把东西修好。", "Not one page of the memory book has gone grey. You learned to mend things without going all out."), "when": V("memories", ">=", 6)},
     {"id": "some", "text": T("记忆册里有几页变灰了。你知道那里写过很温暖的事，只是想不起来是什么。", "A few pages of the memory book have gone grey. You know something warm was written there; you can't recall what."), "when": ALL(V("memories", "<=", 5), V("memories", ">=", 3))},
     {"id": "most", "text": T("记忆册里大半都变灰了。最后剩下的那一页，是港口的照片：照片上你身边是一片空白，可你记得那里站着她。", "Most of the memory book has gone grey. The last page left is the photo at the harbor: a blank beside you, but you remember she stood there."), "when": V("memories", "<=", 2)}]},
  {"id": "g_gran", "title": T("葛兰", "Gran"), "fragments": [
     {"id": "ally", "text": T("葛兰在摩天轮底下说：下回打架，叫上我。你没想到自己会记住这句话。", "Under the Ferris wheel Gran said: next time there's a fight, call me. You didn't expect to remember that."), "when": AT("gran", "trust", 2)},
     {"id": "rival", "text": T("葛兰还是你的对手。他扔给你的那瓶啤酒，你还没有开。", "Gran is still your opponent. The beer he tossed you is still unopened."), "when": UPTO("gran", "trust", 1)}]},
  {"id": "g_ben", "title": T("雷恩兄弟", "The Rhine brothers"), "fragments": [
     {"id": "ben_leg", "text": T("本出院那天是走着出去的。亚当在医院门口站了很久，什么都没说，冲你鞠了一躬。", "Ben walked out of the hospital on his own feet. Adam stood at the door a long time, said nothing, and bowed to you."), "when": F("flag.ben_leg")},
     {"id": "ben_lost", "text": T("本的左腿没了。你在工具包里翻出一盒弹簧和齿轮，想了很久，能不能给他修一条腿。", "Ben lost his left leg. You turned out a box of springs and gears from your tool bag and wondered for a long time whether you could mend him a leg."), "when": NF("flag.ben_leg")}]},
  {"id": "g_su", "title": T("苏蔓", "Su Man"), "fragments": [
     {"id": "su", "text": T("苏蔓的名片压在柜台的玻璃底下。她还是每天打一个电话来，问你吃药了没有。", "Su Man's card sits under the counter glass. She still calls every day to ask if you've taken your pills."), "when": F("flag.told_su")},
     {"id": "su_far", "text": T("苏蔓说过，她想阻止王冠被打开。你没告诉她你妈妈的事。也许下一次。", "Su Man said she wants to stop the Crown opening. You didn't tell her about your mum. Next time, maybe."), "when": NF("flag.told_su")}]},
  {"id": "g_evelyn", "title": T("伊芙琳", "Evelyn"), "fragments": [
     {"id": "evelyn", "text": T("伊芙琳走回夜空之前，最后看了你一眼。那一眼里，好像有一个她自己也答不上来的问题。", "Before Evelyn walked back into the sky she looked at you one last time. As if there were a question in it she couldn't answer either."), "when": F("flag.evelyn_falter")},
     {"id": "evelyn_cold", "text": T("伊芙琳踩着荆棘的阶梯走回夜空，没有回头。", "Evelyn walked back up her stair of thorns into the sky without looking back."), "when": NF("flag.evelyn_falter")}]},
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
     row("上一任主人", "Previous holder", "苏（姓氏不详）。名字在第六次王冠之争的被遗忘者名单上。", "Su (surname unknown). Her name is on the list of the forgotten from the sixth Crown war.", F("flag.c7_done")),
     row("锁着的灯", "The locked lantern", "里面是一件蓝外套和一本很厚的本子。“给六十年后，那个比我更勇敢的人。”", "Inside, a blue coat and a very thick notebook. 'To the one, sixty years on, who is braver than I was.'", F("flag.touched_lock")),
     row("真名", "True name", "（卷一里不会揭晓）", "(not revealed in Volume 1)", F("flag.never"))]},
  {"id": "sword", "name": T("断剑", "The Broken Sword"), "rows": [
     row("持有者", "Holder", "葛兰·霍克", "Gran Hawke", F("flag.met_gran")),
     row("力量", "Power", "斩断连结：术式、契约、因果。", "Severing: spells, contracts, causes.", F("flag.met_gran")),
     row("断口", "The break", "六十年前断的。白秋说，是提灯的上一任主人折断的——真假不知道。", "Broken sixty years ago. Bai Qiu says the Lamp's last holder broke it—true or not, unknown.", F("flag.heard_sword")),
     row("想要的", "What she wants", "“等到第六十年，帮我一个忙。”", "'In the sixtieth year, do me a favor.'", F("flag.know_gran")),
     row("那个忙", "The favor", "她想死。真正地死。只有王冠能改写“遗器不会死”这条规则。", "She wants to die. Truly. Only the Crown can rewrite the rule that relics never die.", F("flag.know_wish")),
     row("第十个主人", "Tenth holder", "阿尔伯特·霍克，葛兰的祖父。输了以后，擦了二十年空匣子。", "Albert Hawke, Gran's grandfather. After he lost, he polished an empty case for twenty years.", F("flag.know_hawke"))]},
  {"id": "crown", "name": T("荆棘冠", "The Thorn Crown"), "rows": [
     row("持有者", "Holder", "伊芙琳·冯·艾希", "Evelyn von Eiche", ANY(F("flag.know_evelyn"), REG)),
     row("器灵", "Spirit", "一个捧着空白书的诗人。", "A poet holding a blank book.", F("flag.know_evelyn")),
     row("下一个目标", "Next target", "卡罗·文斯手里的墨水瓶。", "Carlo Vince's Inkwell.", F("flag.heard_ink")),
     row("代价", "Price", "关于她自己的骄傲。每赢一次，就少一点。", "Her pride in herself. A little less with every win.", ANY(F("flag.know_evelyn_why"), F("flag.know_pride"))),
     row("手里", "In hand", "荆棘冠、墨水瓶、风筝。三件。", "Thorn Crown, Inkwell, Kite. Three.", F("flag.c5_done"))]},
  {"id": "scales", "name": T("天平", "The Scales"), "rows": [
     row("持有者", "Holder", "白秋", "Bai Qiu", REG),
     row("力量", "Power", "交换：两件事物的重量、位置，甚至命运。", "Exchange: the weight, place, even fate of two things.", F("flag.met_baiqiu")),
     row("代价", "Price", "做选择时的犹豫。", "Hesitation when choosing.", F("flag.know_baiqiu")),
     row("裂纹", "The crack", "被太重的东西压裂的。林栖修好了它。", "Cracked by something too heavy. Lin mended it.", F("flag.fixed_scales"))]},
  {"id": "chess", "name": T("棋盘", "The Chessboard"), "rows": [row("持有者", "Holder", "（未登记）", "(unregistered)", REG),
     row("灰色的棋子", "The grey piece", "最底下一行，最角落。没有形状，像灰烬捏成的。它用一个女孩的声音说话。", "Bottom row, corner square. Shapeless, as if pressed from ash. It speaks in a girl's voice.", F("flag.saw_chess_grey")),
     row("上一次的胜者", "Last victor", "第六次灰烬王冠之争，胜者：梅洛。", "Sixth Ashen Crown War. Victor: Merlo.", F("flag.c7_done"))]},
  {"id": "mirror", "name": T("镜子", "The Mirror"), "rows": [row("持有者", "Holder", "雷恩，A.", "Rhine, A.", REG),
     row("力量", "Power", "照下别人的术式，再放出来，威力只有一半。只会照它见过的东西。", "Copies a spell it has seen and casts it back at half strength. Only what it has seen.", F("flag.c6_done"))]},
  {"id": "clock", "name": T("钟", "The Clock"), "rows": [row("持有者", "Holder", "雷恩，B.", "Rhine, B.", REG),
     row("代价", "Price", "时间的顺序。", "The order of time.", F("flag.know_twins"))]},
  {"id": "anchor", "name": T("锚", "The Anchor"), "rows": [row("持有者", "Holder", "（空）", "(none)", REG)]},
  {"id": "kite", "name": T("风筝", "The Kite"), "rows": [row("持有者", "Holder", "（空）", "(none)", REG),
     row("现在", "Now", "伊芙琳·冯·艾希。器灵是一个光着脚的长发少女。", "Evelyn von Eiche. Its spirit is a barefoot girl with long hair.", ANY(F("flag.know_pride"), F("flag.c7_done")))]},
  {"id": "ink", "name": T("墨水瓶", "The Inkwell"), "rows": [row("持有者", "Holder", "卡罗·文斯", "Carlo Vince", REG),
     row("力量", "Power", "写下来的东西会暂时成真。得先写。", "What is written comes true for a while. It must be written first.", ANY(F("flag.know_ink_rule"), F("flag.know_carlo"))),
     row("现在", "Now", "伊芙琳·冯·艾希。", "Evelyn von Eiche.", F("flag.c5_done"))]},
  {"id": "cradle", "name": T("摇篮", "The Cradle"), "rows": [row("持有者", "Holder", "（空）", "(none)", REG),
     row("其实", "In fact", "苏蔓。她三个月前在医院地下室捡到的，从没登记。", "Su Man. She found it in the hospital basement three months ago and never registered it.", ANY(F("flag.know_cradle"), F("flag.c6_done"))),
     row("代价", "Price", "对未来的期待。", "Hope for what's ahead.", F("flag.su_cradle"))]},
  {"id": "key", "name": T("钥匙", "The Key"), "rows": [
     row("持有者", "Holder", "这一栏是空白。不是“空”，也不是“未登记”。", "This line is blank. Not 'none', not 'unregistered'.", REG),
     row("监督官说", "The supervisor says", "四百二十年来，钥匙那一栏从来没有填过。可是每一次王冠打开，都要用到它。", "In four hundred and twenty years the Key's line has never been filled. Yet every time the Crown opens, it is used.", REG)]},
]

# ---------------- 美术清单（两版画风共用名字：art/anime/... 和 art/real/...） ----------------
ART = {
  "bg": {k: v for c in CH for k, v in c.BG.items()},
  "cg": {**{k: v for c in CH for k, v in c.CG.items()}, "title": T("标题", "Title")},
  "faces": {"normal": T("平常", "neutral"), "smile": T("笑", "smile"), "serious": T("认真", "serious"), "angry": T("生气", "angry"),
            "sad": T("难过", "sad"), "surprised": T("吃惊", "surprised"), "battle": T("战斗", "battle")},
  "styles": {"anime": T("动漫", "Anime"), "real": T("写实", "Realistic")},
}

# 记忆册、葛兰、配角三组只在走完卷一时出现；坏结局后面只有结局本身和灰城诊所
for g in ENDINGS[1:]:
    for f in g["fragments"]: f["when"] = ALL(F("flag.c7_done"), f["when"])

CAMPAIGN = {
    "spec": SPEC, "tiers": TIERS(), "pack": PACK("relic-war"),
    "resources": {"power": ["light"], "memory": ["memories"], "risk": ["notice"]},
    "id": "ashen_v1", "title": T("灰烬王冠", "The Ashen Crown"), "volume": T("卷一 · 灯火", "Volume 1 · Lamplight"),
    "rights": {"source": "原创（改编自本项目的同名小说）", "original_characters": ["林栖（玩家）", "提灯", "葛兰", "断剑", "伊芙琳", "奥古斯特", "白秋", "卡罗", "苏蔓", "亚当", "本", "摇篮", "诗人", "墨水瓶", "风筝", "梅洛"]},
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

"""v1.7: what you say in night talks has lasting consequences.
Free lines are labelled (warm / rude / romantic / flatter / nonsense / threat / flat) and settled by rules in the engine
(CC.speak). This file declares the impressions those rules write, and the authored content that reads them:
scene lines, a gate, two crises (a slip of the tongue; the road of Mi Heng) and ending pieces."""
from lib import *

def R(c, d, op, v): return V(f"rel.{c}.{d}", op, v)
def I(c, k, op, v): return V(f"imp.{c}.{k}", op, v)

KINDS = {"offended": T("被冒犯", "Offended"), "frivolous": T("嫌你轻浮", "Finds you frivolous"),
         "flattery": T("嫌你谄媚", "Finds you a flatterer"), "odd": T("觉得你古怪", "Finds you odd")}

def extend(N, VARS, CHARS, ENDINGS_ADD):
    USED = {"guanyu": ["offended", "frivolous", "flattery"], "liubei": ["offended", "flattery"], "zhuge": ["offended", "frivolous", "flattery"],
            "caocao": ["offended", "flattery"], "wenzhi": ["offended", "flattery"]}  # only impressions some content reads
    for c, d in CHARS.items():
        for k, lab in KINDS.items():
            if k not in USED.get(c, []): continue
            VARS[f"imp.{c}.{k}"] = {"type": "num", "init": 0, "min": 0, "max": 5,
                                    "label": T(d["name"]["zh"] + "·" + lab["zh"], d["name"]["en"] + " · " + lab["en"]), "char": c, "imp": k, "show": False}
    VARS["renown.rash"] = {"type": "num", "init": 0, "min": 0, "max": 10, "label": T("名声·口无遮拦", "Name for loose talk"), "group": "renown", "show": True}
    VARS["flag.mi_heng"] = {"type": "flag", "init": False, "label": T("步了祢衡的后尘", "Went the way of Mi Heng")}
    byid = {n["id"]: n for n in N}

    # ---------- scenes remember what you said ----------
    def say_in(nid, text, when, first=False):
        p = P(text, when)
        if first: byid[nid]["intro"].insert(0, p)
        else: byid[nid]["intro"].append(p)
    say_in("c3_terms", T("关羽没有看你。篝火边那句冲撞他的话，他还记着。", "Guan Yu doesn't look at you. He hasn't forgotten what you threw at him by the campfire."), I("guanyu", "offended", ">=", 1))
    say_in("c3_terms", T("关羽瞥了你一眼：『篝火边那些话，我当你是年轻。今天，说正事。』", "Guan Yu glances at you. 'What you said by the fire—I'll put it down to youth. Today we talk business.'"), ALL(I("guanyu", "frivolous", ">=", 1), I("guanyu", "offended", "<", 1)))
    say_in("c4_seal", T("关羽临走前低声对你说：『那晚的话，别再对旁人说了。』", "Before leaving, Guan Yu says quietly, 'What you said that night—don't say it to anyone else.'"), I("guanyu", "frivolous", ">=", 1))
    say_in("c5_cottage", T("刘备待你仍旧客气，只是议事时，他不再先问你。", "Liu Bei is as courteous as ever—but at council, he no longer asks you first."), I("liubei", "offended", ">=", 1))
    say_in("c5_cottage", T("刘备笑着对诸葛亮说：『子衡这人，什么话都敢说。』你分不清这是夸你还是提醒你。", "Liu Bei says to Zhuge Liang with a smile, 'Ziheng will say anything.' You can't tell whether it's praise or a warning."), V("renown.rash", ">=", 2))
    say_in("c7_letter", T("这封信写得很短。上回你那些话，她大概还没消气。", "The letter is short. She probably hasn't forgiven what you said last time."), I("wenzhi", "offended", ">=", 1), first=True)
    say_in("c8_huarong", T("诸葛亮摇着扇子：『子衡兄的好话，亮已经攒了一箩筐。今天，说句实话吧。』", "Zhuge Liang waves his fan. 'I've a basketful of your compliments already, Ziheng. Today, tell me something true.'"), I("zhuge", "flattery", ">=", 1))
    say_in("c8_vigil", T("关羽看了你一眼：『今夜不必说好听的。』", "Guan Yu glances at you. 'No sweet words tonight.'"), I("guanyu", "flattery", ">=", 1))
    say_in("c6_slope", T("刘备摆手打断你：『这时候，不必说好听的。』", "Liu Bei waves you silent. 'This is no time for pretty words.'"), I("liubei", "flattery", ">=", 1), first=True)
    say_in("c8_huarong", T("诸葛亮咳了一声，故意不看你。那晚灯下的话，他显然还记得。", "Zhuge Liang clears his throat and pointedly doesn't look at you. He clearly remembers what you said that night by the lamp."), I("zhuge", "frivolous", ">=", 1))
    say_in("c8_huarong", T("诸葛亮对你客气得过了头。灯下那句冲撞，他没有提，也没有忘。", "Zhuge Liang is excessively polite to you. He hasn't mentioned what you threw at him by the lamp—nor forgotten it."), I("zhuge", "offended", ">=", 1))
    say_in("c8_river", T("『你今天嘴怎么这么甜？』她头也不回地说，『有事求我？』", "'Why so sweet today?' she says without turning around. 'Want something from me?'"), I("wenzhi", "flattery", ">=", 1))
    say_in("c7_chain", T("曹操摆摆手：『你的好话我听腻了，今天说点有用的。』", "Cao waves a hand. 'I'm tired of your compliments. Say something useful today.'"), I("caocao", "flattery", ">=", 1))
    say_in("c7_chain", T("曹操扫了你一眼：『今天倒是安静。』", "Cao glances at you. 'Quiet today, aren't we.'"), I("caocao", "offended", ">=", 1))

    # ---------- a gate: Guan Yu won't accept the vouch of someone who insulted him ----------
    v = next(c for c in byid["c8_huarong"]["choices"] if c["id"] == "vouch")
    v["req"] = ALL(v["req"], I("guanyu", "offended", "<", 2))
    v["hint"] = T("需要关羽的敬重 ≥ 3 或刘备的信任 ≥ 6，且关羽没有被你冒犯过两次以上", "Needs Guan Yu's respect ≥ 3 or Liu Bei's trust ≥ 6, and not to have offended Guan Yu twice")

    # ---------- crises ----------
    def crisis(id, title, intro, choices, when, order):
        return node(id, "*", "interrupt", title, "free", T("原创危机", "original crisis"), intro, choices, when=when, order=order)
    N.append(crisis("x_miheng", T("祢衡之路", "The Road of Mi Heng"),
        T("你在宴后当面顶撞了曹操。第二天，丞相府传出话来：要派你出使荆州，去见刘表。府里的人都知道，几个月前，一个叫祢衡的狂士，也是这样被送走的。",
          "You defied Cao Cao to his face after the feast. The next day word comes from his office: you are to go as envoy to Liu Biao in Jingzhou. Everyone in the household knows that months ago a brash scholar named Mi Heng was sent away exactly like this."),
        [choice("go", "dilemma", T("受命出使。", "Accept the mission."),
                T("你带着一纸国书南下。刘表待你客气，又把你转送江夏。你终于明白了曹操的意思：他不必亲手杀你。", "You go south with a letter of state. Liu Biao receives you politely, then sends you on to Jiangxia. At last you understand Cao's meaning: he doesn't need to kill you himself."),
                [setv("flag.exiled"), setv("flag.mi_heng")]),
         choice("kneel", "strategy", T("跪在丞相府门前请罪。", "Kneel at the Chancellor's gate and beg forgiveness."),
                T("你跪了一整天。傍晚，曹操让人传话：『起来吧。孤要的是会说话的人，不是不会说话的人。』", "You kneel all day. At dusk Cao sends word: 'Get up. I want men who know how to speak—not men who don't know when to stop.'"),
                [rel("caocao", "regard", -2), add("renown.rash", -2)], req=R("caocao", "regard", ">=", 5), hint=T("需要曹操的赏识 ≥ 5，他才肯给你台阶", "Needs Cao's regard ≥ 5 for him to give you a way back")),
         choice("again", "dilemma", T("当着来使的面，再骂一次。", "Curse him again, in front of his messenger."),
                T("来使面色惨白地回去复命。曹操只笑了一声：『送他去荆州。』你学祢衡学到了底。", "The messenger goes back ashen-faced. Cao only laughs once. 'Send him to Jingzhou.' You have followed Mi Heng all the way."),
                [setv("flag.exiled"), setv("flag.mi_heng"), add("renown.rash", 2)])],
        ALL(CAO, I("caocao", "offended", ">=", 2)), 0))
    for c in N[-1]["choices"]:
        if c["id"] in ("go", "again"): c["ends"] = True

    N.append(crisis("x_loose", T("失言", "A Slip of the Tongue"), [
        P(T("有人把你夜里说的那些话，一句一句报给了刘备。张飞拍着桌子：『这种人留在身边做什么？』", "Someone has reported to Liu Bei, word for word, the things you've been saying at night. Zhang Fei pounds the table. 'Why keep a man like that around?'"), LIU),
        P(T("程昱把一张纸放在曹操案头，上面抄着你这些日子说过的话。曹操看完，叫你过去。", "Cheng Yu lays a sheet on Cao Cao's desk: a copy of everything you've said lately. Cao reads it and sends for you."), CAO)],
        [choice("apologize", "strategy", T("认错：话说过了头，愿受责罚。", "Admit it: you spoke out of turn, and will accept the consequences."),
                T("主公没有罚你，只说：『先生是聪明人，聪明人最该管住嘴。』", "Your lord doesn't punish you. He only says, 'You're a clever man. Clever men most of all should mind their tongues.'"),
                [add("renown.rash", -2), rel("liubei", "trust", -1), rel("caocao", "regard", -1)]),
         choice("defend", "dilemma", T("辩解：都是真心话，句句有所指。", "Defend yourself: you meant every word, and each had a point."),
                T("你一句一句解释。主公听完，沉默了很久：『有些真话，要挑时候说。』这件事就这样过去了。", "You explain each line. Your lord listens and is silent for a long time. 'Some truths need the right moment.' And there it ends."),
                [add("renown.rash", -1)], req=ANY(R("liubei", "trust", ">=", 6), R("caocao", "regard", ">=", 6)), hint=T("需要主公足够信你（刘备信任或曹操赏识 ≥ 6）", "Needs your lord's confidence (Liu Bei's trust or Cao's regard ≥ 6)")),
         choice("leave", "dilemma", T("请辞。", "Resign."),
                T("没有人挽留你。你走的那天，连送行的人都没有。", "No one asks you to stay. On the day you leave, no one even sees you off."), [setv("flag.exiled")])],
        V("renown.rash", ">=", 4), 4))
    N[-1]["choices"][2]["ends"] = True

    # ---------- endings ----------
    ENDINGS_ADD["g_side"] = [frag_("miheng", T("你和祢衡一样，被送去了荆州。后来的事，没有人记得很清楚——史书里，只多了一句“又有狂士某”。", "Like Mi Heng, you were sent to Jingzhou. What happened after, no one remembers clearly; the histories add only 'and another brash scholar.'"), F("flag.mi_heng"))]
    ENDINGS_ADD["g_name"] = [frag_("rash", T("人说子衡口无遮拦。喜欢你的人说你真，怕你的人说你狂。", "People say Ziheng can't hold his tongue. Those who like you call it honesty; those who fear you call it madness."), V("renown.rash", ">=", 3))]

def frag_(id, text, when):
    return {"id": id, "text": text, "when": when}

# offline reactions for the new intents
EXTRA_REACT = {
  "guanyu": {"threat": [T("刀出鞘半寸，又推了回去。『这话，换个人说，已经死了。』", "The blade slides an inch out of its sheath and back. 'Anyone else who said that would be dead.'"), T("关羽站起身，一句话也没说，走了。", "Guan Yu stands and walks away without a word.")],
             "nonsense": [T("关羽皱眉看着你，像在看一个说梦话的人。", "Guan Yu frowns at you, as if at a man talking in his sleep."), T("『你若累了，就去睡。』", "'If you're tired, go to sleep.'")]},
  "liubei": {"threat": [T("刘备的手停在杯上：『先生……这是醉话，还是真话？』", "Liu Bei's hand stops on his cup. 'Sir... is that the wine talking, or you?'"), T("他没有发火，只是叫来了张飞。张飞站在门口，没有进来。", "He doesn't lose his temper. He just calls for Zhang Fei, who stands in the doorway and doesn't come in.")],
             "nonsense": [T("刘备笑了笑，没有接话。", "Liu Bei smiles and lets it go."), T("『先生今夜，话有些多。』", "'You're talkative tonight, sir.'")]},
  "zhuge": {"threat": [T("诸葛亮的扇子没有停：『子衡兄若真要动手，亮这把扇子，挡不住。』他看着你，一点也不怕。", "Zhuge Liang's fan doesn't pause. 'If you truly mean to strike, this fan won't stop you.' He looks at you, not the least afraid."), T("『这话，亮当没听见。主公那里，亮也不会说。』", "'I'll take it I didn't hear that. Nor will I tell our lord.'")],
            "nonsense": [T("诸葛亮认真想了想：『这是谜语？』", "Zhuge Liang considers it seriously. 'Is this a riddle?'"), T("他低头记了一笔。你不知道他记了什么。", "He jots something down. You don't know what.")]},
  "caocao": {"threat": [T("曹操大笑，笑完了脸色一沉：『孤这里，说这种话的人，坟头的草都高了。』", "Cao roars with laughter, then his face darkens. 'The grass is tall on the graves of men who talked like that to me.'"), T("他什么也没说，只是记下了。你知道他记下了。", "He says nothing—only makes a note. You know he's made a note.")],
             "nonsense": [T("『有趣。』曹操眯起眼，『你是装疯，还是真疯？』", "'Interesting.' Cao narrows his eyes. 'Are you feigning madness, or truly mad?'"), T("曹操挥挥手，像赶走一只苍蝇。", "Cao waves a hand, as if shooing a fly.")]},
  "wenzhi": {"threat": [T("温芷退了一步：『你吓到我了。』她把药箱抱在怀里，没有再说话。", "Wen Zhi steps back. 'You're frightening me.' She holds her medicine chest close and says nothing more."), T("『你走吧。』她说，『今晚别再来了。』", "'Go,' she says. 'Don't come back tonight.'")],
             "nonsense": [T("温芷伸手摸了摸你的额头：『没发烧啊。』", "Wen Zhi feels your forehead. 'No fever.'"), T("『又说胡话。』她笑着摇头。", "'Talking nonsense again.' She shakes her head, smiling.")]},
}
EXTRA_PATTERNS = {
  "threat": r"杀了你|宰了你|砍了你|要你的命|让你死|弄死你|kill you|i'll kill|slit your|you'll die|end you",
  "nonsense": r"^(哈+|啊+|嘿+|呵+|嘻+|嗯+|哦+|lol|ha(ha)+|asdf\w*|[a-z]{1,2})[!！。.]*$|胡说八道|瞎扯|乱说|blah",
}

# ---------- promises made in free speech, and when the story judges them kept or broken ----------
def commit_rules():
    LIU_ = V("track", "==", "liu"); CAO_ = V("track", "==", "cao")
    wz_kept = ANY(F("flag.wenzhi_with_you"), F("flag.wenzhi_safe"), F("flag.wenzhi_warned"), F("flag.wenzhi_together"))
    rules = []
    for kind in ("protect", "loyalty"):
        rules.append({"char": "wenzhi", "kind": kind, "kept": wz_kept, "broken": F("flag.wenzhi_used"),
                      "kept_effects": [rel("wenzhi", "intimacy", 2)], "broken_effects": [rel("wenzhi", "intimacy", -2), rel("wenzhi", "trust", -1)],
                      "kept_text": T("你答应过温芷的话，你做到了。她没有说什么，只是把你的手握得很紧。", "You kept your word to Wen Zhi. She says nothing—only holds your hand very tightly."),
                      "broken_text": T("你答应过温芷的话，被你自己拿去换了军报。她再提起这句话时，语气平得像在念药方。", "The promise you made Wen Zhi, you traded for military intelligence. When she mentions it again, her voice is as flat as a prescription.")})
    rules.append({"char": "liubei", "kind": "loyalty", "broken": CAO_, "kept": LIU_, "at_end": True,
                  "kept_effects": [rel("liubei", "trust", 1)], "broken_effects": [add("renown.cunning", 1)],
                  "kept_text": T("你对刘备说过不离不弃。一卷走完，你还在他身边。", "You told Liu Bei you'd never leave him. At the end of the volume, you're still at his side."),
                  "broken_text": T("你对刘备说过不离不弃。后来古城的消息传来，说他听说你留在了曹营，只说了一句：『人各有志。』", "You told Liu Bei you'd never leave him. Word reaches you that when he heard you'd stayed with Cao, he said only: 'Every man chooses his own road.'")})
    rules.append({"char": "guanyu", "kind": "loyalty", "broken": CAO_, "kept": LIU_, "at_end": True,
                  "kept_effects": [rel("guanyu", "respect", 1)], "broken_effects": [rel("guanyu", "respect", -2)],
                  "kept_text": T("你对关羽许过的话，你守住了。在他那里，这比什么都重。", "You kept the word you gave Guan Yu. To him, nothing weighs more."),
                  "broken_text": T("你对关羽许过的话，没有守住。他再也不跟你喝酒了。", "You broke the word you gave Guan Yu. He never drinks with you again.")})
    rules.append({"char": "caocao", "kind": "loyalty", "broken": F("flag.secret_mercy"), "kept": CAO_, "at_end": True,
                  "kept_effects": [rel("caocao", "regard", 1)], "broken_effects": [],
                  "kept_text": T("你对曹操说过要尽忠。至少到这一卷为止，你做到了。", "You told Cao Cao you'd serve him faithfully. For this volume at least, you did."),
                  "broken_text": T("你对曹操说过要尽忠，却在长坂坡放走了刘备的家眷。他不知道。你知道。", "You swore loyalty to Cao Cao, then let Liu Bei's people go at Changban. He doesn't know. You do.")})
    return rules

# when a talk opens, the character speaks first
OPENERS = {
  "guanyu": {"warm": T("关羽把酒囊推到你面前：『坐。』", "Guan Yu pushes the wine skin toward you. 'Sit.'"), "cold": T("关羽看见你来，手里的刀没有放下。", "Guan Yu sees you coming and doesn't put down his blade."), "neutral": T("关羽抬头看了你一眼，又低下头去。", "Guan Yu glances up at you, then down again.")},
  "liubei": {"warm": T("刘备笑着招手：『子衡，来，陪我看看这夜色。』", "Liu Bei beckons with a smile. 'Ziheng, come—keep me company.'"), "cold": T("刘备听见脚步声，没有回头：『是子衡啊。』", "Liu Bei hears your footsteps and doesn't turn. 'Ah, Ziheng.'"), "neutral": T("刘备往旁边让了让，给你留出一个位子。", "Liu Bei moves over to make room for you.")},
  "zhuge": {"warm": T("诸葛亮早就备好了两盏茶：『亮猜你今夜会来。』", "Zhuge Liang has already poured two cups of tea. 'I guessed you'd come tonight.'"), "cold": T("诸葛亮合上书：『子衡兄有事？』", "Zhuge Liang closes his book. 'Something you need, Ziheng?'"), "neutral": T("诸葛亮抬起头，扇子停了一停。", "Zhuge Liang looks up; his fan pauses.")},
  "caocao": {"warm": T("曹操举杯：『来，今夜不谈公事。』", "Cao Cao raises his cup. 'Come—no business tonight.'"), "cold": T("曹操眯着眼看你：『你来做什么？』", "Cao Cao squints at you. 'What do you want?'"), "neutral": T("曹操指了指对面的席位。", "Cao Cao points to the seat across from him.")},
  "wenzhi": {"warm": T("温芷听见你的脚步声，先笑了：『就知道是你。』", "Wen Zhi hears your footsteps and smiles first. 'I knew it was you.'"), "cold": T("温芷背对着你，手里的活没停：『有事？』", "Wen Zhi keeps her back to you, hands busy. 'Yes?'"), "neutral": T("温芷往旁边挪了挪，没说话。", "Wen Zhi shifts over without a word.")},
}

"""v2.0: open questions. Someone in the scene asks you something there is no button for.
You answer in your own words; the model (or the keyword patterns below) only decides which kind of answer it was.
Each answer kind has authored text and effects. `fallback` is used when nothing matches (and if a player skips it)."""
from lib import *

def R(c, d, op, v): return V(f"rel.{c}.{d}", op, v)

def ans(id, meaning, out, effects=(), match=None, mood=None, echo=()):
    d = {"id": id, "means": meaning, "out": out if isinstance(out, list) else [P(out)], "effects": list(effects)}
    if match: d["match"] = match
    if mood: d["mood"] = mood
    if echo: d["echo"] = list(echo)
    return d

ASKS = {
  # 煮酒论英雄: Cao asks the question he is famous for asking — before he answers it himself
  "c1_plum": {"who": "caocao", "fallback": "dodge",
    "q": T("曹操忽然转向你：『玄德不肯说。你是他的门客，你说——当今天下，谁可称英雄？』",
           "Cao Cao suddenly turns to you. 'Xuande won't say. You're his man—you tell me. Who in the realm today deserves to be called a hero?'"),
    "answers": [
      ans("liu", T("说刘备是英雄", "names Liu Bei"),
          T("曹操的笑停了一停。他看了刘备一眼，刘备手里的筷子差点掉下来。『有意思。』曹操慢慢地说，『门客替主公说了主公不敢说的话。』",
            "Cao's laugh stops short. He glances at Liu Bei, whose chopsticks nearly slip. 'Interesting,' Cao says slowly. 'The retainer says what his lord doesn't dare.'"),
          [rel("caocao", "esteem", 1), rel("liubei", "trust", -1), setv("flag.cao_wary")], match=r"刘备|玄德|使君|皇叔|主公|我家|liu bei|xuande|my lord", mood="surprised"),
      ans("cao", T("说曹操本人是英雄", "names Cao Cao himself"),
          T("曹操大笑：『你倒会说话。』他给你斟了一杯，又看了刘备一眼：『你的门客，比你会说话。』",
            "Cao roars with laughter. 'You know how to talk.' He pours you a cup, then glances at Liu Bei. 'Your man talks better than you do.'"),
          [rel("caocao", "esteem", 1)], match=r"丞相|曹公|曹操|明公|孟德|您|你自己|就是你|chancellor|cao cao|you yourself|yourself", mood="warm"),
      ans("self", T("说自己是英雄", "names Ziheng himself"),
          T("曹操眯起眼：『好大的口气。』他没有再笑，手指在案上轻轻敲着。",
            "Cao narrows his eyes. 'Big words.' He stops laughing; his fingers tap the table."),
          [rel("caocao", "esteem", 1), add("heat.caocao"), add("renown.rash")], match=r"^我(自己|就是|乃|当)|在下|子衡|本人|舍我其谁|^me\b|myself|^i am|ziheng", mood="cold"),
      ans("others", T("说某个诸侯，如袁绍、孙策、刘表、吕布", "names some other warlord"),
          T("曹操摇头笑道：『冢中枯骨。』说完又自顾自数下去。你的答案，他听过太多遍了。",
            "Cao shakes his head with a smile. 'Bones in the grave.' He goes on counting to himself. He has heard your answer too many times."),
          [], match=r"袁绍|本初|袁术|公路|孙策|伯符|景升|奉先|孙权|刘表|吕布|马腾|张鲁|刘璋|张绣|yuan shao|yuan shu|sun ce|liu biao|lu bu", mood="neutral"),
      ans("dodge", T("推辞、不正面回答、说没有人", "evades, or says no one"),
          T("曹操也不勉强：『书生谨慎。』他转回头，接着说他自己的。",
            "Cao doesn't press. 'A cautious scholar.' He turns back and carries on."),
          [], match=r"不知|不敢|不好说|不清楚|无人|没人|没有|不便|i don't know|no one|nobody|can't say", mood="neutral"),
      ans("rude", T("答非所问、讽刺或冒犯曹操", "mocks or insults Cao"),
          T("席上安静了一瞬。曹操盯着你：『你再说一遍？』",
            "The table goes quiet for a moment. Cao stares at you. 'Say that again?'"),
          [add("heat.caocao"), add("renown.rash"), rel("liubei", "trust", -1)], match=r"奸|篡|贼|狗|蠢|traitor|usurp|tyrant|villain", mood="cold"),
    ]},
  # 三顾茅庐: Zhuge Liang tests the man who stood outside in the snow
  "c5_cottage": {"who": "zhuge", "fallback": "dodge",
    "q": T("诸葛亮请刘备入内，却先看向你：『子衡兄在门外站了半日。亮想先问一句——刘使君凭什么取天下？』",
           "Zhuge Liang invites Liu Bei in, but looks at you first. 'You stood outside half the day, Ziheng. Let me ask you first: what will Lord Liu take the realm with?'"),
    "answers": [
      ans("ren", T("仁义、人心、百姓", "benevolence, people's hearts"),
          T("诸葛亮点头：『人和。曹操有天时，孙权有地利，使君能有的，只有这个。』刘备在旁边听着，没有说话。",
            "Zhuge Liang nods. 'The people. Cao has the moment, Sun Quan has the land; this is all my lord can have.' Liu Bei listens and says nothing."),
          [rel("zhuge", "esteem", 1), rel("liubei", "trust", 1)], match=r"仁|义|人心|民心|百姓|人和|benevol|righteous|the people|hearts", mood="warm"),
      ans("talent", T("人才、得人、请到诸葛亮这样的人", "talent, winning men like Zhuge"),
          T("诸葛亮笑了：『这一句，亮听出来了，是在夸亮。』他摇着扇子，却没有否认。",
            "Zhuge Liang smiles. 'I can hear that one is meant for me.' He fans himself, but doesn't deny it."),
          [rel("zhuge", "esteem", 1)], match=r"人才|得人|贤|先生|孔明|卧龙|talent|able men|kongming", mood="warm"),
      ans("land", T("地利：荆州、益州、据险而守、三分天下", "territory: Jingzhou, Yizhou, a three-way split"),
          T("诸葛亮手里的扇子停了。他看了你很久：『这张图，亮画了十年，还没给人看过。子衡兄从哪里看来的？』",
            "Zhuge Liang's fan stops. He looks at you a long time. 'I've drawn that map for ten years and shown it to no one. Where did you see it, Ziheng?'"),
          [rel("zhuge", "esteem", 2), rel("zhuge", "trust", -1), add("uncanny")], match=r"荆州|益州|西川|两川|巴蜀|汉中|三分|鼎足|jingzhou|yizhou|shu|three ways|tripod", mood="surprised"),
      ans("fate", T("天命、汉室宗亲、皇叔的名分", "Heaven's mandate, his imperial blood"),
          T("诸葛亮淡淡一笑：『天命，是说给别人听的。子衡兄自己信吗？』",
            "Zhuge Liang smiles faintly. 'Heaven's mandate is something you tell other people. Do you believe it yourself?'"),
          [rel("zhuge", "esteem", -1)], match=r"天命|天意|宗亲|皇叔|汉室|正统|血脉|mandate|heaven|imperial|bloodline", mood="neutral"),
      ans("doubt", T("说取不了天下、没有机会", "says he can't"),
          T("刘备的脸色变了。诸葛亮却笑了：『肯说真话的人不多。那亮就来试试，看能不能让子衡兄改口。』",
            "Liu Bei's face changes. Zhuge Liang laughs. 'Few men will tell the truth. Then let me try to make you change your mind.'"),
          [rel("zhuge", "esteem", 1), rel("liubei", "trust", -2)], match=r"取不了|不能|没机会|没有机会|难|不行|can't|cannot|no chance|impossible", mood="surprised"),
      ans("dodge", T("推辞、不正面回答", "evades"),
          T("诸葛亮也不追问：『那就听亮说吧。』", "Zhuge Liang doesn't press. 'Then hear what I have to say.'"),
          [], match=r"不知|不敢|先生说|请先生|i don't know|you tell", mood="neutral"),
    ]},
  # 江边: Wen Zhi asks what comes after
  "c8_river": {"who": "wenzhi", "fallback": "unsure",
    "q": T("温芷把药箱放在脚边，看着江面：『这一仗打完，你想去哪？』",
           "Wen Zhi sets her medicine chest at her feet and looks out at the water. 'When this battle's over, where do you want to go?'"),
    "answers": [
      ans("with_her", T("想和她在一起、去她在的地方", "wherever she is"),
          [P(T("她没有回头，耳朵却红了：『……这算是回答吗？』", "She doesn't turn around, but her ears go red. '…Is that an answer?'"), AT("wenzhi", "intimacy", 1)),
           P(T("她愣了一下，笑着摇头：『你连我想去哪都不知道。』", "She blinks, then laughs and shakes her head. 'You don't even know where I want to go.'"), UPTO("wenzhi", "intimacy", 0))],
          [rel("wenzhi", "intimacy", 1)], match=r"和你|陪你|跟你|一起|你在哪|你去哪|有你|with you|wherever you|by your side", mood="shy"),
      ans("home", T("回家乡、归隐、过平常日子、开药铺", "home, a quiet life"),
          T("温芷想了想：『开个药铺也好。晒药的竹匾，你来翻。』她说得像玩笑，又不太像。",
            "Wen Zhi thinks about it. 'An apothecary would do. You can turn the drying trays.' She says it like a joke, and not quite."),
          [rel("wenzhi", "intimacy", 1), rel("wenzhi", "trust", 1)], match=r"回家|家乡|颍川|归隐|种地|药铺|平常|安稳|隐居|go home|quiet|retire|apothecary|farm", mood="warm"),
      ans("lord", T("继续辅佐主公、去下一个战场", "back to his lord, the next campaign"),
          T("她点点头：『我就知道。』过了一会儿又说：『那你记得带上金疮药。』",
            "She nods. 'I knew it.' After a while she adds, 'Then remember to take wound salve.'"),
          [rel("wenzhi", "trust", 1)], match=r"主公|刘备|曹操|丞相|荆州|天下|辅佐|打仗|my lord|liu bei|cao cao|campaign|serve", mood="sad"),
      ans("unsure", T("不知道、还没想过", "doesn't know"),
          T("『我也不知道。』她说，『那就先活着打完。』", "'Neither do I,' she says. 'Then let's get through it alive first.'"),
          [], match=r"不知道|没想过|不清楚|再说|don't know|haven't thought|not sure", mood="neutral"),
      ans("rude", T("敷衍、玩笑过头或冒犯她", "brushes her off or insults her"),
          T("温芷把药箱提了起来：『算了，当我没问。』", "Wen Zhi picks up her medicine chest. 'Forget it. I didn't ask.'"),
          [rel("wenzhi", "trust", -1), add("heat.wenzhi")], match=r"关你|管得着|少管|啰嗦|none of your|mind your", mood="cold"),
    ]},
}

def extend(N):
    byid = {n["id"]: n for n in N}
    for nid, a in ASKS.items():
        byid[nid]["ask"] = a

# keyword fallback checks answers in this order (more specific kinds first)
ORDER = {"c1_plum": ["rude", "liu", "cao", "others", "dodge", "self"], "c5_cottage": ["land", "doubt", "fate", "ren", "talent", "dodge"],
         "c8_river": ["rude", "home", "with_her", "lord", "unsure"]}
for _k, _o in ORDER.items():
    ASKS[_k]["answers"].sort(key=lambda a: _o.index(a["id"]))

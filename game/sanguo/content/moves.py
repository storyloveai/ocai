"""卷一的“说话走向”（决策记录 v2.15）：玩家在场景里自由说出的某些话，会改变接下来发生的事。

AI（或离线的关键词）只判断玩家这句话是哪一种走向；走向带来的变化、旁白和剧情去哪里，都在这里写死。
每条走向：
  id      走向编号（同一场景里不重复）
  to      对谁说
  means   这句话是什么意思（给 AI 看，也给创作者看）
  match   离线时识别用的正则（没接 AI 时靠它）
  labels  AI 给这句话打的语气标签命中其一也算（例如 threat）
  out     旁白：说完之后发生了什么
  effects 规则效果
  goto    剧情转进的“当场发作”场景；resume=True 表示演完回到原场景，否则原场景就此结束
台词都是我们自己写的；原著里的话只取大意，不当引文。
"""
from lib import *

def mv(id, to, means, out, effects=(), match=None, labels=(), goto=None, resume=False, when=None, nodes=None, except_=None):
    d = {"id": id, "to": to, "means": means, "out": out if isinstance(out, list) else [P(out)], "effects": list(effects)}
    if match: d["match"] = match
    if labels: d["labels"] = list(labels)
    if goto: d["goto"] = goto; d["resume"] = resume
    if when: d["when"] = when
    if nodes: d["nodes"] = nodes
    if except_: d["except"] = except_
    return d

KILL_YOU = r"杀了?你|宰了你|砍了你|要你的命|取你(的)?性命|你的(人)?头|刺杀|除掉你|弄死你|让你死|kill you|i'll kill|your head|end you|you'll die"

FLAGS = {
    "flag.urged_kill_liu": T("梅园里劝曹操杀刘备", "Urged Cao Cao to kill Liu Bei in the plum garden"),
    "flag.named_liu_hero": T("梅园里当着曹操说刘备是英雄", "Told Cao Cao in the plum garden that Liu Bei was the hero"),
    "flag.urged_stop_guan": T("劝曹操拦下关羽", "Urged Cao Cao to stop Guan Yu"),
}

NODE_MOVES = {
  "c1_plum": [
    mv("threat", "caocao", T("当面威胁曹操、说要杀他", "threatens Cao Cao to his face / says they will kill him"),
       T("话还没落地，廊下的甲士已经齐齐转过身来。刘备手里的筷子掉在了地上。", "The words are barely out before every guard on the veranda has turned. Liu Bei's chopsticks fall to the floor."),
       [rel("caocao", "esteem", -1), add("renown.rash", 2), setv("flag.cao_wary")],
       match=KILL_YOU + r"|杀曹|诛曹|曹贼", labels=["threat"], goto="x_plum_rage"),
    mv("kill_liu", "caocao", T("劝曹操杀了刘备、除掉刘备", "urges Cao Cao to kill Liu Bei / get rid of him"),
       [P(T("梅园里一下子静了。刘备端着酒，没有动。曹操看看你，又看看刘备，忽然大笑：『子衡这话，是替孤试玄德，还是替玄德试孤？』他笑够了，摆摆手：『孤若杀英雄，天下谁还敢来投孤？』",
            "The garden goes silent. Liu Bei holds his cup and doesn't move. Cao Cao looks at you, then at Liu Bei, and bursts out laughing. 'Ziheng—are you testing Xuande for me, or testing me for Xuande?' When he's done laughing he waves a hand. 'If I killed heroes, who in the realm would dare come to me?'")),
        P(T("刘备放下酒杯，从这一刻起，再没有看你一眼。", "Liu Bei sets down his cup, and from this moment on he doesn't look at you once."))],
       [setv("flag.urged_kill_liu"), rel("liubei", "trust", -3), rel("liubei", "warmth", -2), rel("caocao", "esteem", 1), add("renown.cunning")],
       match=r"杀了?(他|刘备|玄德|刘使君)|除掉(他|刘备)|刘备(不可|留不得)|此人(当|必|不可不)除|留(他|此人)不得|kill (him|liu bei)|get rid of (him|liu bei)"),
    mv("hero_liu", "caocao", T("对曹操说刘备才是真英雄", "tells Cao Cao that Liu Bei is the true hero"),
       T("曹操拊掌：『子衡与孤，所见略同。』他笑着给刘备斟满酒，眼睛却一直没离开刘备的脸。刘备在桌下踩了你一脚。",
         "Cao Cao claps his hands. 'Ziheng and I see alike.' Smiling, he fills Liu Bei's cup, but his eyes never leave Liu Bei's face. Under the table Liu Bei steps on your foot."),
       [setv("flag.named_liu_hero"), setv("flag.cao_wary"), rel("caocao", "esteem", 1), rel("liubei", "trust", -2)],
       match=r"(刘(备|使君|皇叔)|玄德).{0,6}(才|就|乃)?是.{0,4}英雄|英雄.{0,6}(刘(备|使君|皇叔)|玄德)|liu bei is the (true |real )?hero"),
    mv("warn_liu", "liubei", T("悄悄提醒刘备：曹操起疑了，早点离开许都", "quietly warns Liu Bei that Cao suspects him and he should leave Xuchang"),
       T("刘备在桌下按住你的手，面上照旧笑着给曹操斟酒。曹操的目光在你们两人之间转了一圈。", "Under the table Liu Bei presses your hand, still smiling as he pours for Cao Cao. Cao Cao's gaze travels once between the two of you."),
       [rel("liubei", "trust", 1), add("heat.caocao", 1)],
       match=r"快走|离开许都|早(点|些)?(走|离开)|出城|小心曹操|曹操(要|想)杀你|leave xuchang|get out|be careful of cao"),
  ],
  "c4_seal": [
    mv("stop_guan", "caocao", T("劝曹操拦下、截杀关羽", "urges Cao Cao to stop or kill Guan Yu before he leaves"),
       T("曹操摆摆手：『各为其主，由他去吧。』关羽已经走到门口，回头看了你一眼。那一眼，你记了很多年。", "Cao Cao waves it away. 'Each serves his own lord. Let him go.' Guan Yu, already at the door, looks back at you once. You remember that look for many years."),
       [setv("flag.urged_stop_guan"), rel("guanyu", "warmth", -3), rel("guanyu", "trust", -2), rel("caocao", "esteem", 1), add("renown.cunning")],
       match=r"截杀|追杀|杀了?(他|关羽|云长)|别放(他|关羽)|不能放|拦住(他|关羽)|kill guan|stop (him|guan yu)|don't let him go"),
    mv("stay_guan", "guanyu", T("求关羽留下，别走", "begs Guan Yu to stay with Cao Cao"),
       T("关羽抚着长髯：『关某之心，你知道。』他把印绶的结又系紧了一些。", "Guan Yu strokes his long beard. 'You know my heart.' He ties the cord of the seal a little tighter."),
       [rel("guanyu", "esteem", -1), rel("caocao", "esteem", 1)],
       match=r"留下|别走|不要走|投(曹|丞相)|stay|don't go"),
  ],
  "c5_cottage": [
    mv("three", "zhuge", T("抢在诸葛亮之前说出三分天下的大势（取荆州、益州，联合东吴）", "lays out the three-way division before Zhuge Liang can (take Jing and Yi, ally with Wu)"),
       T("诸葛亮手里的扇子停了。他看了你很久，才笑着对刘备说：『主公帐下有此人，何必三顾亮的草庐？』笑意没到眼底。", "The fan in Zhuge Liang's hand stops. He looks at you a long time before smiling at Liu Bei. 'With such a man in your service, my lord, why come three times to my cottage?' The smile doesn't reach his eyes."),
       [setv("flag.zhuge_tested"), add("uncanny", 2), rel("zhuge", "esteem", 2), rel("zhuge", "trust", -1)],
       match=r"三分|荆州.{0,8}益州|益州.{0,8}荆州|联(吴|孙)|three kingdoms|divide the realm|jingzhou.{0,20}yizhou"),
  ],
  "c8_huarong": [
    mv("kill_cao", "guanyu", T("劝关羽见到曹操就杀，别念旧恩", "urges Guan Yu to kill Cao Cao on sight and forget old kindness"),
       T("关羽丹凤眼一睁：『关某立了军令状，用不着你来提醒。』诸葛亮在一旁摇着扇子，像是什么都没听见。", "Guan Yu's eyes snap open. 'I have signed the pledge. I don't need you to remind me.' Beside him Zhuge Liang fans himself as though he heard nothing."),
       [rel("guanyu", "warmth", -1), rel("zhuge", "esteem", 1)],
       match=r"杀了?曹(操|贼)|斩(了)?曹|别放(过)?曹|不要放|kill cao|don't (let|spare)"),
  ],
}

# 全书通用：在别的场景里当面威胁曹操，他当场发作（梅园那一场有自己的走向）
CAMP_MOVES = [
    mv("cao_threat", "caocao", T("当面威胁曹操、说要杀他", "threatens Cao Cao to his face / says they will kill him"),
       T("你说出那句话的时候，整个屋子都静了。", "When you say it, the whole room goes still."),
       [rel("caocao", "esteem", -1), add("renown.rash", 1)],
       match=KILL_YOU + r"|曹贼", labels=["threat"], goto="x_cao_rage", resume=True, except_=["c1_plum"]),
]

READS = {   # 说过的话，后面要有人记得
    "c4_gucheng": [P(T("刘备没有提梅园那天你说的话。可他给你倒酒的时候，手停了一下。", "Liu Bei doesn't mention what you said in the plum garden. But as he pours your wine, his hand pauses."), F("flag.urged_kill_liu")),
                   P(T("刘备笑着说：『梅园那天，你差点把我的命说没了。』他说完，自己先笑了。", "Liu Bei says with a smile, 'That day in the plum garden, you nearly talked me out of my life.' He laughs first."), F("flag.named_liu_hero"))],
    "c8_vigil": [P(T("关羽看着火，忽然说：『许都那天，劝曹操拦我的，是你。』", "Guan Yu watches the fire and suddenly says, 'That day in Xuchang, the one who urged Cao Cao to stop me—that was you.'"), F("flag.urged_stop_guan"))],
}

def extend(N, VARS):
    for k, lab in FLAGS.items(): VARS[k] = {"type": "flag", "init": False, "label": lab}
    byid = {n["id"]: n for n in N}
    for nid, ms in NODE_MOVES.items(): byid[nid]["moves"] = ms
    for nid, ps in READS.items(): byid[nid]["intro"] = list(byid[nid]["intro"]) + ps
    return CAMP_MOVES

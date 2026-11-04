#!/usr/bin/env python3
"""Genre packs (题材包). Edit this file, then run it: python3 game/engine/packs/make_packs.py

A pack is what one kind of story has in common: the value tags its choices are marked with, the roles its
resources play, how failure looks, and the checks the validator applies. A book picks one pack and maps
each resource role to its own variables (camp.resources = {"risk": ["uncanny"], ...}).
"""
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent
def T(z, e): return {"zh": z, "en": e}

# every pack gets these validator rules (see README, 题材包):
#   alt_path       — a choice gated on resources has a sibling with no lock in the same scene
#   earned_victory — an ending that reads an "earned" resource (power, proof) also reads something the player did
#   risk_bites     — every risk variable triggers at least one scene
# "earned": true on a role marks resources that must never decide success alone
COMMON_RULES = ["alt_path", "earned_victory", "risk_bites"]

PACKS = {
"history-strategy": {
 "title": T("历史谋略", "History & strategy"),
 "premise": T("原著大事照样发生，玩家是身边的谋士：怎么发生、谁付代价、谁欠谁的情，由玩家决定。好玩在“改得动历史的边，改不动历史的骨”。",
              "The great events still happen; the player is the adviser at someone's elbow and decides how they happen, who pays, and who owes whom. The fun is bending the edges of history without breaking its spine."),
 "values": {"yi": T("义", "loyalty"), "zhi": T("智", "cleverness"), "ren": T("仁", "kindness"), "yong": T("勇", "nerve"), "cheng": T("诚", "honesty"), "li": T("利", "self-interest")},
 "roles": {
   "reputation": {"required": True, **T("名声：别人怎么称呼你（忠义、权谋……），决定谁肯用你、结局怎么写你。", "Reputation: what people call you; decides who will use you and how the ending remembers you.")},
   "risk": {"required": True, **T("风险：越界的代价（异名、失言）。到线必须触发危机，不能只是一个数字。", "Risk: the cost of overstepping. Crossing the line must trigger a crisis, not just change a number.")},
   "drift": {"required": False, **T("偏离原著的程度。改得越多，后面要还的叙事债务越多。", "How far the story has drifted from the book; more drift means more narrative debts to settle.")}},
 "failures": [T("失宠：主公冷落你，把你调去闲职", "Falling from favor: your lord sidelines you"),
              T("被当成妖人：知道得太多，又说不出来源", "Branded a sorcerer: you know too much and can't say how"),
              T("失言：话说过头，被人报上去", "A loose tongue: someone reports what you said")],
 "checklist": [T("每章一场原著名场面，原文保留或作用保留", "One set piece from the book per chapter, kept literally or by function"),
               T("玩家拿掉原著某段情节的前因时，开一笔叙事债务，后面必须补上", "When the player removes a cause from the book, open a narrative debt and settle it later")],
},
"cultivation": {
 "title": T("修仙成长", "Cultivation"),
 "premise": T("资质平常的人一点一点攒出一条路。好玩在“捷径永远在眼前，每一条都要付代价”：借来的灵力要还，用过的同伴会记得。",
              "An ordinary talent building a path one step at a time. The fun is that a shortcut is always in reach and every one has a price: borrowed power must be repaid, and companions you used remember."),
 "values": {"wen": T("稳", "caution"), "tan": T("贪", "greed"), "yi": T("义", "loyalty"), "hen": T("狠", "ruthlessness"), "cheng": T("诚", "honesty"), "wu": T("悟", "insight")},
 "roles": {
   "power": {"required": True, "earned": True, **T("修为、灵力：往上走的本钱。不能单凭它判定成功。", "Power: the capital for climbing. Never the sole test of success.")},
   "currency": {"required": True, **T("灵石、资源：花出去就没了，花在哪里就是选择。", "Currency: once spent it's gone; where you spend it is the choice.")},
   "body": {"required": False, **T("经脉、伤势：冒进的代价落在身上。", "Body: the cost of rushing lands on you.")},
   "risk": {"required": True, **T("暴露、因果：被人盯上。到线必须出事。", "Risk: being noticed. Cross the line and something must happen.")}},
 "failures": [T("走火入魔：资源不够还强行冲关", "Qi deviation: forcing a breakthrough without the means"),
              T("欠债：借来的灵力、人情到期结算", "Debt: borrowed power and favors come due"),
              T("被盯上：暴露太多，有人来收账", "Marked: exposed too much, and someone comes to collect")],
 "checklist": [T("资源不够时一定有别的路（延期、步行、等候），不能卡死", "When resources fall short there is always another way (wait, walk, defer), never a dead end"),
               T("玩家不拿原著主角的机缘和宝物", "The player never takes the original protagonist's fortune or treasures")],
},
"mystery-revenge": {
 "title": T("悬疑复仇", "Mystery & revenge"),
 "premise": T("真相一点一点拼出来，但每一块证据都可能伤到无辜的人。好玩在“查得清”和“下不下得了手”是两件事。",
              "The truth comes together piece by piece, and every piece can hurt someone innocent. The fun is that knowing and acting are two different things."),
 "values": {"zhen": T("真", "truth"), "ren": T("忍", "patience"), "li": T("利", "advantage"), "qing": T("情", "sentiment"), "yi": T("义", "justice"), "hen": T("狠", "ruthlessness")},
 "roles": {
   "proof": {"required": True, "earned": True, **T("证据：能核验的才算，同一来源的传言不能算两条。", "Proof: only what can be verified counts; two rumors from one source are one.")},
   "currency": {"required": False, **T("经费、人情：查案要花钱，花了就欠了谁。", "Currency: investigating costs money, and money means owing someone.")},
   "time": {"required": False, **T("时间、余裕：拖得越久，对方准备得越好。", "Time: the longer it takes, the readier the other side is.")},
   "risk": {"required": True, **T("暴露：被对手察觉。到线必须出事。", "Exposure: being noticed by the other side. Cross the line and something must happen.")}},
 "failures": [T("身份暴露：对手先动手", "Exposed: the other side moves first"),
              T("证据链断：关键一环说不出来源", "A broken chain: a key link can't be sourced"),
              T("误伤：真相落在无辜的人身上", "Collateral: the truth lands on the innocent")],
 "checklist": [T("证据程序是剧情规则，不写成现实中的法律或调查教程", "Evidence procedure is a story rule, never a real-world legal or investigation guide"),
               T("原著人物保留自己的目标，不围着玩家转", "Characters from the book keep their own goals; they don't orbit the player")],
},
"school-romance": {
 "title": T("校园恋爱", "School romance"),
 "premise": T("galgame 式的恋爱故事：读剧情、看人，在关键处做选择。好感藏在后台，只从对方的态度里感觉得到；共通线走完，按好感进入某个人的线。好玩在“当时随手的一句话，后来才知道有多重”。",
              "A visual-novel romance: read, watch the characters, choose at the key moments. Affection stays hidden and shows only in how they treat you; after the common route, affection decides whose route you enter. The fun is learning later how much a passing remark weighed."),
 "values": {"cheng": T("真诚", "sincerity"), "wen": T("温柔", "gentleness"), "yong": T("勇气", "courage"), "ti": T("体贴", "consideration"), "xi": T("玩笑", "playfulness"), "gu": T("坚持", "persistence")},
 "roles": {
   "risk": {"required": True, **T("误会、流言：说错话、做错事积下来的。到线必须出事（一场误会、一次冷战），不能只是一个数字。", "Misunderstanding, rumor: what careless words and deeds pile up. Crossing the line must cause something (a misunderstanding, a cold spell), not just change a number.")},
   "time": {"required": False, **T("剩下的日子：离某个期限（毕业、拆迁、离开）还有多久。", "Days left: how long until a deadline (graduation, demolition, a departure).")},
   "keepsake": {"required": False, **T("信物、回忆：一起做过的事留下的东西，后面会在关键时刻用上。", "Keepsakes and memories: what shared moments leave behind, used later at a key moment.")}},
 "failures": [T("错过：该开口的时候没有开口", "Missed: you didn't speak when it mattered"),
              T("误会：一句话被听成了另一个意思", "Misunderstood: one remark heard as something else"),
              T("普通结局：谁都不够亲近，春天就这样过去了", "Normal ending: no one close enough, and the season simply passes")],
 "checklist": [T("所有角色都是成年人；纯爱，不写露骨内容", "Every character is an adult; romance stays non-explicit"),
               T("好感不显示数字，只体现在台词、表情和后面的走向上", "Affection is never shown as a number; only in lines, expressions and what follows"),
               T("分歧点总有一条路可走：谁都不够时进普通结局，不卡死", "Every branch point has a way forward: if no one is close enough, the normal ending, never a dead end"),
               T("每条个人线都有好结局和普通结局，通关全部个人线后开启真结局", "Every route has a good and a normal ending; clearing all routes opens the true ending")],
},
}

if __name__ == "__main__":
    for pid, p in PACKS.items():
        out = {"id": pid, "version": 1, **p, "rules": COMMON_RULES}
        (HERE / f"{pid}.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    print("packs:", ", ".join(PACKS))

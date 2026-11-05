"""主线也看她的状态（决策记录 v0.22）。做法参考“故事单元 / 按状态选内容”（Failbetter 的 QBN、Yarn Spinner 的 storylet）：
同一个主线场景，按女主当前的状态（正常 / 记仇 / 决裂）选对应的版本来演，而不是一条写死的线。

- 夏知遥是社长，和她决裂 = 你不在电影社了。共通线三个主线场景各有一个“社团外面”的版本（`*_out`），原版只在没决裂时出现。
- 沈澄、季白在主线里戏份少：决裂后，主线里她们的台词和以她们为主的选项自动收起，换成一句她躲着你的旁白（talk.py 里写了几处）。
- 检查：tools/stance_check.mjs 模拟“一有机会就说下流话”的玩家，决裂以后她要是还在任何地方出场说话，就算不通过。"""
from lib import *

OK = lambda h: NF(f"flag.broken_{h}")
BROKE = lambda h: F(f"flag.broken_{h}")

C1_OUT = scene("c1_fair_out", "c1", "main", T("社团招新", "Club Fair"), [
    bg("campus"),
    nar("转学到汐川大学的第一天，室友程航就把我拖到了社团招新的广场上。", "On my first day at Xichuan University, my roommate Cheng Hang drags me to the club fair in the square."),
    show("chenghang", "smile", "left"),
    say("chenghang", "听我的，大三转学生想融入，只有一条路：社团。", "Trust me. A third-year transfer has one way to fit in: clubs.", face="smile"),
    hide("chenghang"),
    nar("最角落的摊位上，摆着一台老式放映机。摊位后面坐着的，是昨天那个女孩。", "At the farthest corner booth sits an old projector. Behind it is the girl from yesterday."),
    nar("她看见了我，把报名表往桌上一扣，转过身去跟别人说话。", "She sees me, slaps the sign-up sheet face down on the table, and turns to talk to someone else."),
    think("昨天那句话，收不回来了。", "What I said yesterday can't be taken back."),
    show("jibai", "normal", "right"),
    say("jibai", "……你就是陆同学？社长让我转告你：电影社不缺人。", "…You're Mr. Lu? The president asked me to tell you: the film club isn't short of members.", face="sad"),
    say("jibai", "不过，放映室的门白天一般开着。那是影院的，不是社团的。", "Though the booth door is usually open during the day. It belongs to the cinema, not the club.", face="normal"),
    hide("jibai"),
    show("shencheng", "normal", "right"),
    say("shencheng", "……陆远。回来了啊。", "…Lu Yuan. So you're back.", face="surprised"),
    say("shencheng", "我还要送咖啡。", "I've got coffee to deliver.", face="normal"),
    hide("shencheng"),
], [
    choice("chase", "dilemma", T("去追沈澄。", "Go after Shen Cheng."), [
        show("shencheng", "normal", "center"),
        say("shencheng", "有事？", "Something you need?", face="normal"),
        me("……好久不见。", "…It's been a long time."),
        say("shencheng", "七年。不是“好久”。", "Seven years. Not 'a long time.'", face="sad"),
        nar("她走到拐角时，回头看了一眼。", "At the corner, she glances back once."),
    ], [rel("shencheng", "intimacy", 1)], values=["gu"]),
    choice("booth", "expression", T("问季白：放映室在哪里？", "Ask Ji Bai where the booth is."), [
        show("jibai", "normal", "center"),
        say("jibai", "银幕对面的小楼上。你祖父的东西，都还在那里。", "In the little building facing the screen. Your grandfather's things are all still there.", face="normal"),
    ], [rel("jibai", "intimacy", 1)], values=["ti"]),
    choice("leave", "expression", T("一个人走开。", "Walk away alone."), [
        nar("广场上很吵。我在人群里走了很久，才走到海边。", "The square is loud. I walk a long way through the crowd before I reach the sea."),
    ], []),
], order=1, when=BROKE("zhiyao"), cast=["zhiyao", "jibai", "shencheng", "chenghang"])

C2_OUT = scene("c2_screening_out", "c2", "main", T("栏杆外面", "Outside the Railing"), [
    bg("cinema_dusk"),
    nar("周六傍晚。我没有进影院，坐在海堤上，隔着铁栏杆看银幕。", "Saturday evening. I don't go into the cinema. I sit on the seawall and watch the screen through the iron railing."),
    show("zhou", "normal", "left"),
    say("zhou", "老陆的孙子？进去坐啊。……哦，跟社长闹翻了？", "Old Lu's grandson? Go on in and sit down. …Oh. Fell out with the president, did you?", face="normal"),
    say("zhou", "放映室的钥匙，你爷爷说过，哪天你回来了就给你。喏。去不去，你自己定。", "Your grandfather said if you ever came back, I was to give you the booth key. Here. Whether you use it is up to you.", face="sad"),
    hide("zhou"),
    nar("七点，银幕亮了。来的人一共五个。放到一半，放映室那边传来一声闷响——画面停住，烧出一个白洞。", "Seven o'clock, and the screen lights up. Five people in all. Halfway through, a dull snap comes from the booth—the picture freezes and a white hole burns through it."),
], [
    choice("splice", "dilemma", T("拿着钥匙去放映室，帮季白接片。", "Take the key to the booth and help Ji Bai splice the film."), [
        bg("projection"), show("jibai", "surprised", "center"),
        say("jibai", "社长说过，不让你进来。", "The president said you weren't to come in.", face="surprised"),
        say("jibai", "……算了。按住这里，别抖。", "…Never mind. Hold it here. Don't shake.", face="normal"),
        nar("三分钟后，银幕重新亮了起来。", "Three minutes later, the screen lights up again."),
    ], [rel("jibai", "intimacy", 1), rel("jibai", "esteem", 1)], values=["ti"]),
    choice("walk", "dilemma", T("看见沈澄提着空保温桶往外走，追上去送她回家。", "See Shen Cheng leaving with the empty flask, and walk her home."), [
        bg("street"), show("shencheng", "normal", "center"),
        say("shencheng", "你在外面坐了一晚上？", "You sat out here all evening?", face="surprised"),
        say("shencheng", "……你小时候，也总是一个人坐在栏杆外面。", "…When we were kids, you'd always sit outside the railing on your own too.", face="sad"),
    ], [rel("shencheng", "intimacy", 1), rel("shencheng", "warmth", 1)], values=["wen"]),
    choice("stay", "expression", T("留在栏杆外面看完。", "Stay outside the railing and watch to the end."), [
        nar("银幕重新亮起来的时候，我听见台上那个女孩松了一口气。她没有往这边看。", "When the screen comes back on, I hear the girl on the stage let out a breath. She doesn't look this way."),
    ], []),
], order=1, when=BROKE("zhiyao"), cast=["zhou", "jibai", "shencheng"])

C3_OUT = scene("c3_member_out", "c3", "main", T("公告栏", "The Notice Board"), [
    bg("campus"),
    nar("四月初，学生处的通知贴了出来：电影社月底前凑不齐三个人，就撤销。", "Early April, Student Affairs posts a notice: if the film club doesn't have three members by month's end, it's dissolved."),
    nar("我看见夏知遥在公告栏前站了很久，然后一个摊位一个摊位地去问。没有人停下来。", "I see Zhiyao stand in front of the board for a long time, then go from booth to booth asking. No one stops."),
    think("这件事，已经没有我的位置了。", "There's no place for me in this anymore."),
], [
    choice("jibai", "dilemma", T("去放映室找季白。", "Go find Ji Bai in the booth."), [
        bg("projection"), show("jibai", "normal", "center"),
        say("jibai", "社长来问过我。我入了。她一个人撑不下去。", "The president asked me. I joined. She can't hold it together on her own.", face="sad"),
        say("jibai", "你们之间的事，我不问。可放映室，你随时可以来。", "Whatever's between you two, I won't ask. But you can come to the booth any time.", face="normal"),
    ], [rel("jibai", "trust", 1), rel("jibai", "intimacy", 1), setv("flag.third_jibai")], values=["cheng"]),
    choice("cheng", "dilemma", T("去咖啡馆找沈澄。", "Go find Shen Cheng at the café."), [
        bg("cafe"), show("shencheng", "normal", "center"),
        say("shencheng", "她来问过我要不要入社。……我答应了。", "She came and asked if I'd join. …I said yes.", face="normal"),
        say("shencheng", "潮声影院的最后一场，我本来就要去的。", "I was going to be at the Tidesound's last show anyway.", face="sad"),
    ], [rel("shencheng", "intimacy", 1), setv("flag.third_cheng")], values=["ti"], req=AT("shencheng", "trust", 1), hint=T("她现在还不肯理你", "She won't give you the time of day yet")),
    choice("none", "expression", T("什么也不做。", "Do nothing."), [
        nar("月底，电影社凑够了三个人。那天我在宿舍里，听程航说的。", "By month's end, the film club has its three members. I hear about it from Cheng Hang, back in the dorm."),
    ], [setv("flag.third_hang")]),
], order=1, when=BROKE("zhiyao"), cast=["jibai", "shencheng"])

VARIANTS = {"c1_fair": C1_OUT, "c2_screening": C2_OUT, "c3_member": C3_OUT}

def _uses(ops, h):
    return any(o.get("who") == h and o["op"] in ("say", "show") for o in ops)

def extend(NODES):
    byid = {n["id"]: n for n in NODES}
    for nid, v in VARIANTS.items():
        o = byid[nid]; o["when"] = ALL(o["when"], OK("zhiyao")) if o.get("when") else OK("zhiyao")
        v["order"] = o["order"]; NODES.append(v)
    # 沈澄、季白：主线里决裂后自动收起她的台词和以她为主的选项
    for n in NODES:
        if n["kind"] != "main" or n["chapter"] not in ("c1", "c2", "c3", "c4"): continue   # 个人线里决裂直接结束（talk.py），这里只管共通线
        for h in ("shencheng", "jibai"):
            n["script"] = [{**op, "when": ALL(op["when"], OK(h)) if op.get("when") else OK(h)} if op.get("who") == h and op["op"] in ("say", "show") else op for op in n["script"]]
            for c in n["choices"]:
                first = next((o for o in c.get("script", []) if o["op"] in ("say", "show") and o.get("who") not in (None, "me")), None)
                if first and first.get("who") == h:
                    c["when"] = ALL(c["when"], OK(h)) if c.get("when") else OK(h)

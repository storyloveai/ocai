#!/usr/bin/env python3
"""《汐川的第七个春天》 —— 原创校园纯爱 galgame。所有角色都是成年人（大学生、研究生）。
本文件：人物、变量、序章、第一章。跑一遍生成 content/campaign.json：python3 game/xichuan/content/story.py"""
import json, pathlib, sys
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from lib import *

WARM_ = lambda c: AT(c, "intimacy", 1)

# ---------------- 人物 ----------------
def char(id, zh, en, dims, persona, values, romance=False, main="intimacy"):
    d = {"name": T(zh, en), "dims": {k: [v, 0, 10] for k, v in dims.items()}, "original": True, "main": main,
         "persona": persona, "values": values}
    if romance: d["romance"] = True
    return d

CHARS = {
  "zhiyao": char("zhiyao", "夏知遥", "Xia Zhiyao", {"warmth": 2, "trust": 1, "esteem": 1, "intimacy": 0},
      T("夏知遥：21 岁，汐川大学大三，电影社社长。明亮、嘴快、固执，一个人撑着快解散的社团；毕业后要去外地照顾生病的母亲，这件事谁也没告诉。叫主角“陆远”，熟了以后叫“喂”。",
        "Xia Zhiyao: 21, a third-year at Xichuan University and president of the film club. Bright, quick-tongued, stubborn; holding a dying club together alone. After graduation she must move away to care for her sick mother, and she has told no one. Calls the protagonist 'Lu Yuan', later just 'hey'."),
      {"yong": ["esteem", 1], "cheng": ["trust", 1], "xi": ["warmth", 1], "gu": ["esteem", 1]}, romance=True),
  "shencheng": char("shencheng", "沈澄", "Shen Cheng", {"warmth": 1, "trust": 1, "esteem": 1, "intimacy": 1},
      T("沈澄：21 岁，主角的青梅竹马，留在汐川，一边读书一边在家里的海边咖啡馆帮忙。对主角冷淡、话少；七年前他走的那天，他们有一个约，她记得，他忘了。叫主角“陆远”，从不叫小名。",
        "Shen Cheng: 21, the protagonist's childhood friend who stayed in Xichuan, studying while helping at her family's seaside café. Cool and curt with him. Seven years ago, on the day he left, they made a promise; she remembers, he forgot. Calls him 'Lu Yuan', never his childhood nickname."),
      {"cheng": ["trust", 1], "ti": ["warmth", 1], "wen": ["warmth", 1], "gu": ["trust", 1]}, romance=True),
  "jibai": char("jibai", "季白", "Ji Bai", {"warmth": 1, "trust": 1, "esteem": 1, "intimacy": 0},
      T("季白：23 岁，研究生，潮声影院的兼职放映员，整天在放映室修老胶片。安静、说话准确、爱用电影打比方；仓库里有一盘没有标签的胶片，她一直没敢放。叫主角“陆同学”。",
        "Ji Bai: 23, a graduate student and part-time projectionist at the Tidesound Cinema, forever restoring old film in the booth. Quiet, precise, fond of film metaphors. In the storeroom there is an unlabeled reel she has never dared to run. Calls him 'Mr. Lu'."),
      {"wen": ["warmth", 1], "ti": ["trust", 1], "cheng": ["esteem", 1], "yong": ["esteem", 1]}, romance=True),
  "zhou": char("zhou", "老周", "Old Zhou", {"warmth": 2, "trust": 2, "esteem": 1},
      T("老周：六十多岁，潮声影院看门的，主角祖父的老搭档。嘴硬心软。", "Old Zhou: in his sixties, caretaker of the Tidesound Cinema and the protagonist's grandfather's old partner. Gruff, soft-hearted."),
      {"cheng": ["trust", 1], "ti": ["warmth", 1]}, main="trust"),
  "chenghang": char("chenghang", "程航", "Cheng Hang", {"warmth": 2, "trust": 2, "esteem": 1},
      T("程航：21 岁，主角的室友，话多，自认恋爱军师，其实一次也没谈过。", "Cheng Hang: 21, the protagonist's roommate. Talkative, a self-appointed love strategist who has never dated."),
      {"xi": ["warmth", 1], "yong": ["esteem", 1]}, main="warmth"),
}
NAMES = {cid: c["name"] for cid, c in CHARS.items()}
PLAYER = T("陆远", "Lu Yuan")

VARS = {}
for cid, c in CHARS.items():
    for dim, (init, lo, hi) in c["dims"].items():
        VARS[f"rel.{cid}.{dim}"] = {"type": "num", "init": init, "min": lo, "max": hi, "char": cid, "dim": dim,
                                    "label": T(f"{c['name']['zh']}·{dim}", f"{c['name']['en']} · {dim}")}
VARS["rumor"] = {"type": "num", "init": 0, "min": 0, "max": 5, "label": T("误会", "Misunderstanding")}
for f, zh, en in (("flag.saw_last_spring", "对知遥说“来看它最后一个春天”", "Told Zhiyao he came to see its last spring"),
                  ("flag.joined_club", "加入了电影社", "Joined the film club"),
                  ("flag.cheng_coffee", "在沈澄的店里点了小时候那杯", "Ordered his childhood drink at Shen Cheng's café"),
                  ("flag.saw_reel", "看见了那盘没有标签的胶片", "Saw the unlabeled reel")):
    VARS[f] = {"type": "flag", "init": False, "label": T(zh, en)}

# ---------------- 序章 · 返乡 ----------------
PROLOGUE = scene("p_return", "p", "main", T("序章 · 返乡", "Prologue · Coming Back"), [
    bg("train"),
    nar("三月。列车沿着海岸线往南开。窗外的海，和七年前一模一样。", "March. The train runs south along the coast. The sea outside the window looks exactly as it did seven years ago."),
    think("七年。我以为自己不会再回来了。", "Seven years. I thought I'd never come back."),
    nar("父亲去世以后，律师寄来一封信：汐川的老房子归我了。还有一句话，写在信的最后——", "After my father died, the lawyer sent a letter: the old house in Xichuan was mine now. And one more line, at the very end—"),
    nar("“潮声影院五月拆除。你祖父的东西，还在放映室。——老周”", "'The Tidesound Cinema comes down in May. Your grandfather's things are still in the projection booth. —Old Zhou'"),
    bg("station"),
    nar("汐川站小得只有一个站台。风里有咸味。", "Xichuan Station has only one platform. The wind tastes of salt."),
    bg("oldhouse"),
    nar("老房子的门锁锈了。院子里那棵枇杷树还在，比记忆里高了很多。", "The lock on the old house has rusted. The loquat tree in the yard is still there, much taller than I remember."),
    think("先去影院看看吧。趁天还没黑。", "I'll go see the cinema first. While it's still light."),
    bg("cinema_dusk"),
    nar("潮声影院是一座露天影院。白色的银幕背对着海，前面是一排排生锈的铁椅子。夕阳把银幕染成了橙色。", "The Tidesound Cinema is an open-air theater. Its white screen stands with its back to the sea, rows of rusting iron seats before it. The sunset has turned the screen orange."),
    cg("cg_stage"),
    nar("银幕下面的台子上，站着一个女孩。她对着空无一人的座位，大声地念着什么。", "On the stage beneath the screen stands a girl. She is reading something aloud, at full volume, to rows of empty seats."),
    cgoff(),
    show("zhiyao", "normal", "center"),
    say("zhiyao", "……春季放映会，最后一季！每周六晚上七点，潮声影院，免费入场！——不对，太像卖菜的了。", "…The Spring Screenings, final season! Every Saturday, seven p.m., the Tidesound Cinema, free admission!—No. That sounds like a market stall."),
    say("zhiyao", "……啊。", "…Oh.", face="surprised"),
    say("zhiyao", "你是拆迁办的人吧？我告诉你，五月之前，我们一天也不会搬的！", "You're from the demolition office, right? Let me tell you—until May, we're not moving out a single day early!", face="angry"),
    me("我不是拆迁办的。我姓陆。这座影院，是我爷爷开的。", "I'm not from the demolition office. My name's Lu. My grandfather built this cinema."),
    say("zhiyao", "……诶？", "…Huh?", face="surprised"),
    say("zhiyao", "陆爷爷的孙子？那你——你是来拆它的，还是来救它的？", "Grandpa Lu's grandson? Then you're—are you here to tear it down, or to save it?", face="normal"),
], [
    choice("honest", "expression", T("“我只是来收拾爷爷的东西。”", "\"I'm just here to pack up my grandfather's things.\""), [
        say("zhiyao", "……这样啊。", "…I see.", face="sad"),
        say("zhiyao", "那你收拾的时候，小心点放映室。里面的东西，比你以为的要多。", "Then be careful in the booth when you do. There's more in there than you think.", face="normal"),
        nar("她跳下台子，从我身边走过，没有回头。", "She hops down from the stage and walks past me without looking back."),
    ], [rel("zhiyao", "trust", 1)], values=["cheng"]),
    choice("spring", "expression", T("“……来看它最后一个春天。”", "\"…I came to see its last spring.\""), [
        say("zhiyao", "最后一个春天……", "Its last spring…", face="surprised"),
        say("zhiyao", "这句话不错。可以借我用在海报上吗？", "That's a good line. Can I borrow it for the poster?", face="smile"),
        nar("她笑起来的时候，夕阳刚好落进海里。", "When she smiles, the sun has just slipped into the sea."),
    ], [rel("zhiyao", "intimacy", 1), setv("flag.saw_last_spring")], values=["wen"]),
    choice("who", "expression", T("“……先说你是谁？”", "\"…Who are you, first?\""), [
        say("zhiyao", "我？夏知遥，汐川大学电影社社长。", "Me? Xia Zhiyao. President of the Xichuan University Film Club.", face="normal"),
        say("zhiyao", "社员嘛……目前，一个。就是我。", "Members… currently, one. Me.", face="smile"),
    ], [rel("zhiyao", "warmth", 1)], values=["xi"]),
], order=1, cast=["zhiyao"])

# ---------------- 第一章 · 电影社 ----------------
C1_FAIR = scene("c1_fair", "c1", "main", T("社团招新", "Club Fair"), [
    bg("campus"),
    nar("转学到汐川大学的第一天，室友程航就把我拖到了社团招新的广场上。", "On my first day at Xichuan University, my roommate Cheng Hang drags me to the club fair in the square."),
    show("chenghang", "smile", "left"),
    say("chenghang", "听我的，大三转学生想融入，只有一条路：社团。尤其是女生多的社团。", "Trust me. A third-year transfer has one way to fit in: clubs. Especially clubs with lots of girls.", face="smile"),
    say("chenghang", "那个摊位就不行了，你看，只有一个人。", "That booth's hopeless, though. Look—one person.", face="normal"),
    hide("chenghang"),
    nar("最角落的摊位上，摆着一台老式放映机，一张手画的海报：《春季放映会 · 最后一季》。摊位后面坐着的，是昨天那个女孩。", "At the farthest corner booth sit an old film projector and a hand-drawn poster: 'The Spring Screenings · Final Season.' Behind it sits the girl from yesterday."),
    show("zhiyao", "surprised", "center"),
    say("zhiyao", "啊，陆爷爷的孙子！你也是这个学校的？", "Oh—Grandpa Lu's grandson! You go here too?", face="surprised"),
    say("zhiyao", "太好了。听着，电影社再招不到两个人，学期末就要被撤销了。你来，就还差一个。", "Perfect. Listen—if the film club doesn't get two more members, it's dissolved at the end of term. You join, and we're only one short.", face="smile"),
    show("jibai", "normal", "right"),
    say("jibai", "知遥，放映机的片门我调好了。下周六可以用。", "Zhiyao, I've adjusted the projector's gate. It'll be ready next Saturday.", face="normal"),
    say("zhiyao", "这是季白，研究生，影院的放映员。", "This is Ji Bai, a grad student. She's the cinema's projectionist.", face="normal"),
    say("jibai", "我不是社员。我是被雇来的。……你好，陆同学。", "I'm not a member. I'm hired help. …Hello, Mr. Lu.", face="normal"),
    nar("一个端着托盘的女孩从摊位前走过，停下了。托盘上是几杯外送的咖啡。", "A girl carrying a tray of takeaway coffees passes the booth, and stops."),
    hide("jibai"),
    show("shencheng", "normal", "right"),
    say("shencheng", "……陆远。", "…Lu Yuan.", face="surprised"),
    say("shencheng", "回来了啊。", "So you're back.", face="normal"),
    think("沈澄。七年没见，她一眼就认出了我。", "Shen Cheng. Seven years, and she recognized me at a glance."),
    say("shencheng", "我还要送咖啡。", "I've got coffee to deliver.", face="normal"),
    hide("shencheng"),
    say("zhiyao", "认识的人？……先不管这个。所以，你入不入社？", "Someone you know? …Never mind. So—are you joining or not?", face="normal"),
], [
    choice("join", "dilemma", T("当场填表。", "Fill in the form on the spot."), [
        say("zhiyao", "真的？！", "Really?!", face="surprised"),
        say("zhiyao", "好，陆远，从今天起你就是电影社的第二个社员。工作很多的，你别后悔。", "Okay, Lu Yuan, as of today you're the film club's second member. There's a lot of work. No regrets.", face="smile"),
        nar("她把表格收好，像是怕我反悔，又看了一遍我的名字。", "She tucks the form away, then reads my name over once more, as if afraid I'd take it back."),
    ], [setv("flag.joined_club"), rel("zhiyao", "intimacy", 1), rel("zhiyao", "esteem", 1)], values=["yong"]),
    choice("chase", "dilemma", T("说要想想，转身去追沈澄。", "Say you need to think, and go after Shen Cheng."), [
        say("zhiyao", "……喂！", "…Hey!", face="angry"),
        nar("我在广场的另一头追上了沈澄。她没有停下来。", "I catch up with Shen Cheng at the far end of the square. She doesn't stop walking."),
        show("shencheng", "normal", "center"),
        say("shencheng", "有事？", "Something you need?", face="normal"),
        me("……好久不见。", "…It's been a long time."),
        say("shencheng", "七年。不是“好久”。", "Seven years. Not 'a long time.'", face="sad"),
        nar("她说完就走了。可我看见，她走到拐角时，回头看了一眼。", "Then she's gone. But at the corner, I see her glance back once."),
    ], [rel("shencheng", "intimacy", 1), add("rumor", 1)], values=["gu"]),
    choice("ask", "expression", T("问季白：放映员是做什么的？", "Ask Ji Bai what a projectionist actually does."), [
        show("jibai", "normal", "right"),
        say("jibai", "让光穿过胶片，一秒二十四格，打到银幕上。观众看见的是动，其实每一格都是停着的。", "I send light through the film, twenty-four frames a second, onto the screen. The audience sees motion, but every single frame is standing still.", face="normal"),
        say("jibai", "……抱歉，说多了。", "…Sorry. I talked too much.", face="shy"),
        say("zhiyao", "她一说起胶片就停不下来。所以——你入不入？", "Once she starts on film she can't stop. So—are you in?", face="smile"),
        nar("我在表格上写了名字。季白在旁边看着，没说话，嘴角好像动了一下。", "I write my name on the form. Ji Bai watches without a word; the corner of her mouth seems to move."),
    ], [setv("flag.joined_club"), rel("jibai", "intimacy", 1), rel("zhiyao", "warmth", 1)], values=["ti"]),
], order=1, cast=["zhiyao", "jibai", "shencheng", "chenghang"])

AFTER = T("放学后，你去了……", "After classes, you went…")

S_ZHIYAO = scene("c1_poster", "c1", "side", T("雨里的海报", "Posters in the Rain"), [
    bg("rain_street"),
    nar("傍晚下起了雨。我在校门口看见夏知遥抱着一卷海报，一张一张往公告栏上贴。", "It starts raining in the evening. At the school gate I find Xia Zhiyao with an armful of posters, pasting them onto the notice board one by one."),
    show("zhiyao", "normal", "center"),
    say("zhiyao", "看什么？来帮忙啊，社员。", "What are you staring at? Come help, member.", face="smile"),
    nar("我们贴完最后一张的时候，两个人都湿透了。", "By the time we've put up the last one, we're both soaked."),
    say("zhiyao", "其实我知道，就算招满了人，影院五月还是要拆。", "Honestly, I know it. Even if we fill the club, the cinema still comes down in May.", face="sad"),
    say("zhiyao", "可是我想在它拆掉之前，让它再满一次。哪怕就一次。", "But before it does, I want to see it full one more time. Even just once.", face="normal"),
], [
    choice("umbrella", "expression", T("把伞撑到她头顶。", "Hold your umbrella over her."), [
        say("zhiyao", "……都湿透了还撑伞，你傻不傻。", "…We're already soaked and you open an umbrella. Are you an idiot?", face="shy"),
        nar("她没有躲开。", "She doesn't step away."),
    ], [rel("zhiyao", "intimacy", 1)], values=["ti"]),
    choice("promise", "dilemma", T("“那就让它满一次。我帮你。”", "\"Then let's fill it once. I'll help.\""), [
        say("zhiyao", "说好了啊。说话不算数的人，我会记一辈子的。", "That's a promise. I'll remember anyone who breaks one for the rest of my life.", face="smile"),
    ], [rel("zhiyao", "trust", 1), rel("zhiyao", "esteem", 1)], values=["yong"]),
], order=1, salience=1, cast=["zhiyao"])

S_SHENCHENG = scene("c1_cafe", "c1", "side", T("海边的咖啡馆", "The Seaside Café"), [
    bg("cafe"),
    nar("沈家的咖啡馆还在海堤边上，招牌换了，门口的风铃没换。", "The Shen family café still sits by the seawall. The sign is new; the wind chime by the door isn't."),
    show("shencheng", "normal", "center"),
    say("shencheng", "……欢迎光临。要点什么？", "…Welcome. What can I get you?", face="normal"),
    think("她的语气，和对任何一个客人都一样。", "Her tone is the same as with any other customer."),
], [
    choice("childhood", "expression", T("“热可可，多放一块棉花糖。”——小时候每次来都点这个。", "\"Hot cocoa, extra marshmallow.\" The order you always made as a kid."), [
        say("shencheng", "……嗯。", "…Okay.", face="surprised"),
        nar("她转身去做，背对着我站了很久。端上来的时候，杯子里有两块棉花糖。", "She turns to make it and stands with her back to me for a long time. When she brings it over, there are two marshmallows in the cup."),
        say("shencheng", "这个你倒是记得。", "That, you remember.", face="sad"),
    ], [rel("shencheng", "intimacy", 1), setv("flag.cheng_coffee")], values=["wen"]),
    choice("ask_why", "dilemma", T("“你在生我的气？”", "\"Are you angry with me?\""), [
        say("shencheng", "生气？", "Angry?", face="normal"),
        say("shencheng", "生气要力气的。七年，早用完了。", "Being angry takes energy. I used it all up years ago.", face="sad"),
        say("shencheng", "……你连那天也忘了吧。", "…You've forgotten that day too, haven't you.", face="normal"),
        think("那天？哪一天？", "That day? Which day?"),
    ], [rel("shencheng", "trust", 1), add("rumor", 1)], values=["cheng"]),
], order=2, salience=1, cast=["shencheng"])

S_JIBAI = scene("c1_booth", "c1", "side", T("放映室", "The Projection Booth"), [
    bg("projection"),
    nar("潮声影院的放映室在银幕对面的小楼上。我推门进去的时候，季白正对着灯，一格一格地看胶片。", "The Tidesound's projection booth is in the little building facing the screen. When I push the door open, Ji Bai is holding film up to the lamp, studying it frame by frame."),
    show("jibai", "normal", "center"),
    say("jibai", "陆同学。墙上那些，是你祖父的字。", "Mr. Lu. The writing on the wall there is your grandfather's.", face="normal"),
    nar("墙上贴满了泛黄的便签：哪台机器哪天换过灯泡，哪部片子哪一卷容易断。最下面一张写着：“第七卷，别放。”", "The wall is covered with yellowed notes: which machine had its bulb changed when, which reel of which film tends to snap. The one at the very bottom says: 'Reel seven. Don't run it.'"),
    say("jibai", "仓库里确实有一盘没有标签的胶片。我数过，它在第七个架子上。", "There is a reel with no label in the storeroom. I counted. It's on the seventh shelf.", face="normal"),
    say("jibai", "我一直没放。……因为他说别放。", "I've never run it. …Because he said not to.", face="sad"),
], [
    choice("look", "dilemma", T("“能让我看看那盘胶片吗？”", "\"Could I see that reel?\""), [
        say("jibai", "……可以看，不可以放。", "…You can look. You can't run it.", face="normal"),
        nar("那盘胶片很轻，铁盒上有一道划痕，像是有人用指甲刻下的一个数字：7。", "The reel is light. On its tin there is a scratch, as if someone carved a number with a fingernail: 7."),
    ], [setv("flag.saw_reel"), rel("jibai", "trust", 1), rel("jibai", "intimacy", 1)], values=["yong"]),
    choice("help", "expression", T("“你在修什么？我能帮忙吗？”", "\"What are you repairing? Can I help?\""), [
        say("jibai", "那你帮我拿着这一头。别碰到画面。", "Then hold this end for me. Don't touch the picture.", face="smile"),
        nar("我们一直修到天黑。她讲每一格的时候，声音比白天轻快很多。", "We work until dark. When she talks about each frame, her voice is far lighter than it was by day."),
    ], [rel("jibai", "warmth", 1), rel("jibai", "intimacy", 1)], values=["ti"]),
], order=3, salience=1, cast=["jibai"])

# 误会到线：流言传开（第二章起会触发）
X_RUMOR = scene("x_rumor", "*", "interrupt", T("流言", "Rumors"), [
    bg("campus"),
    show("chenghang", "surprised", "center"),
    say("chenghang", "兄弟，你出名了。论坛上说转学生一来就到处追女生。", "Buddy, you're famous. The forum says the new transfer has been chasing every girl in sight.", face="surprised"),
    say("chenghang", "我的建议是：这两天低调一点。", "My advice: keep your head down for a couple of days.", face="normal"),
], [
    choice("ok", "expression", T("“……知道了。”", "\"…Got it.\""), [nar("这几天，路上遇见的人好像都在看我。", "For days after, everyone I pass seems to be looking at me.")], [add("rumor", -2)]),
], order=-1, when=V("rumor", ">=", 2))

import common, zhiyao, shencheng, jibai

CHAPTERS = [
    {"id": "p", "title": T("序章", "Prologue"), "intro": [P(T("三月，汐川。", "March, Xichuan."))], "offer": 0},
    {"id": "c1", "title": T("第一章 · 电影社", "Chapter 1 · The Film Club"), "intro": [P(T("开学第一周。", "The first week of term."))], "offer": 3,
     "main_first": True, "side_prompt": AFTER},
]
CHAPTERS += common.CHAPTERS + zhiyao.CHAPTERS
NODES = [PROLOGUE, C1_FAIR, S_ZHIYAO, S_SHENCHENG, S_JIBAI, X_RUMOR] + common.NODES + zhiyao.NODES + shencheng.NODES + jibai.NODES
for f, zh, en in common.FLAGS + zhiyao.FLAGS + shencheng.FLAGS + jibai.FLAGS: VARS[f] = {"type": "flag", "init": False, "label": T(zh, en)}

ENDINGS = [
    {"id": "g_end", "title": T("尾声", "Epilogue"), "fragments": [{"id": e["id"], "title": e["title"], "text": e["text"], "when": e["when"]} for e in zhiyao.ENDINGS + shencheng.ENDINGS + jibai.ENDINGS] + [
        {"id": "none", "title": T("普通结局「最后一排」", "Normal Ending: The Back Row"), "text": T("最后一场放映，你坐在最后一排。散场的时候，银幕上的光一点一点暗下去。春天就这样过去了。", "At the last show you sit in the back row. As the crowd leaves, the light on the screen fades bit by bit. And so the spring passes."), "when": F("flag.route_none")}]},
    {"id": "g_heart", "title": T("这个春天", "This spring"), "fragments": [  # 走完一条个人线的人不再显示这一组
        {"id": "zhiyao", "text": T("夏知遥在社团群里，第一次叫了你的名字。", "In the club chat, Xia Zhiyao calls you by name for the first time."), "when": WARM_("zhiyao")},
        {"id": "shencheng", "text": T("沈澄的咖啡馆，那几天打烊总比平时晚一个小时。", "Those nights, Shen Cheng's café always closes an hour late."), "when": WARM_("shencheng")},
        {"id": "jibai", "text": T("放映室的灯，那几周每晚都亮到很晚。", "For those weeks, the light in the booth burns late every night."), "when": WARM_("jibai")},
        {"id": "none", "text": T("这个春天过得很快。你还说不清，自己最想见的是谁。", "The spring goes by fast. You still can't say who you most want to see."),
         "when": ALL(UPTO("zhiyao", "intimacy", 0), UPTO("shencheng", "intimacy", 0), UPTO("jibai", "intimacy", 0))}]},
]
for f in ENDINGS[1]["fragments"]: f["when"] = ALL(NF("flag.route_zhiyao"), NF("flag.route_shencheng"), NF("flag.route_jibai"), f["when"])

# 播放页用的美术清单：背景和 CG 的名字（占位图和 CG 鉴赏用），立绘按 人/表情 取图
ART = {
  "bg": {"train": T("列车车厢 · 黄昏", "Train carriage · dusk"), "station": T("汐川站", "Xichuan Station"), "oldhouse": T("老房子的院子", "The old house"),
         "cinema_dusk": T("潮声影院 · 黄昏", "Tidesound Cinema · dusk"), "campus": T("汐川大学 · 社团广场", "Xichuan University · club square"),
         "rain_street": T("雨中的校门", "School gate in the rain"), "cafe": T("海边咖啡馆", "Seaside café"), "projection": T("放映室", "Projection booth")},
  "cg": {"cg_stage": T("银幕下的女孩", "The girl beneath the screen")},
  "faces": {"normal": T("平常", "neutral"), "smile": T("笑", "smile"), "shy": T("害羞", "shy"), "angry": T("生气", "angry"), "sad": T("难过", "sad"), "surprised": T("吃惊", "surprised")},
}

ART["bg"].update(common.BG); ART["bg"].update(zhiyao.BG); ART["cg"].update(common.CG); ART["cg"].update(zhiyao.CG); ART["cg"].update(shencheng.CG); ART["cg"].update(jibai.CG)

CAMPAIGN = {
    "spec": SPEC, "tiers": TIERS(), "pack": PACK("school-romance"),
    "resources": {"risk": ["rumor"]},
    "id": "xichuan_v1", "title": T("汐川的第七个春天", "The Seventh Spring of Xichuan"), "volume": T("全本", "Complete"),
    "rights": {"source": "原创", "original_characters": ["陆远（玩家）", "夏知遥", "沈澄", "季白", "老周", "程航"]},
    "player": {"name": PLAYER}, "format": "vn",
    "vars": VARS, "chars": CHARS, "dims": {}, "echoes": {}, "debts": {},
    "chapters": CHAPTERS, "nodes": {n["id"]: n for n in NODES}, "endings": ENDINGS,
    "side_prompt": AFTER, "art": ART,
}

if __name__ == "__main__":
    out = HERE / "campaign.json"
    out.write_text(json.dumps(CAMPAIGN, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("nodes", len(NODES), "->", out)

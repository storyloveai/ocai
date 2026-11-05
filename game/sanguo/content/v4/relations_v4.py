"""卷四：关系改变你能经历的事 + 命运分支（决策记录 v2.33；做法同卷一至卷三）。
卷四本来就有不少按旗标改口的话，这里补上按关系的那一层：
1. 当场改口：6 个场景（荆州线 4 个、成都线 2 个）。
2. 主动找上门：在荆州、和温芷走得近（亲近到「在意」），她会把一张手画的小路图交给你；败走时派人求救，信差抄小路，早到两天。
3. 同一个请求，结果不同：水淹七军（关羽器不器重你）、成都派人去上庸（刘备信不信你）。
4. 命运：关羽面前第二次冒犯（记仇 ≥ 3）——赔罪就从此不再见你（失势），不退就被赶走，这一卷提前结束。"""
import copy
from lib import *
from relations import RP, WARM, COLD, NOTWARM, _twin

JING = ALL(ANY(ANY(F("flag.post_jingzhou"), F("flag.v3_to_jing")), F("flag.v4_to_jing")), NF("flag.v4_hermit"))
FLAGS = {"flag.v4_wz_map": T("温芷给了你一张小路图", "Wen Zhi gave you a map of the back paths")}

INTRO = {
  "c1_pangde": ("guanyu", "esteem",
     T("关羽把自己的护心镜摘下来，扣在你胸前：『阵后流矢多。』", "Guan Yu unfastens his own breastplate mirror and buckles it onto your chest. 'Stray arrows fly behind the lines.'"), None),
  "c2_flood": ("guanyu", "trust",
     T("关羽把地图铺在你面前，压上一块石头：『这一仗怎么打，我想先听你的。』", "Guan Yu spreads the map before you and weighs it down with a stone. 'How this battle goes—I want to hear you first.'"),
     T("关羽自己看着地图，问话的时候头也没抬。", "Guan Yu studies the map himself; he doesn't look up when he asks.")),
  "c3_bone": ("guanyu", "warmth",
     T("关羽伸出左臂之前，冲你笑了笑：『看着，别眨眼。』", "Before he holds out his left arm, Guan Yu smiles at you. 'Watch. Don't blink.'"), None),
  "c1_chengdu": ("zhuge", "esteem",
     T("诸葛亮亲手给你倒了一杯茶，等你喝完才开口。", "Zhuge Liang pours you a cup of tea with his own hands and waits until you've finished it before he speaks."), None),
  "c4_cd": ("liubei", "trust",
     T("汉中王把案上的令箭推到你手边：『你说怎么办，就怎么办。』", "The King of Hanzhong pushes the command arrows on his desk toward your hand. 'Whatever you say, we'll do.'"),
     T("汉中王问的是满屋的人，眼睛没有落在你身上。", "The King asks the whole room; his eyes don't rest on you.")),
  "c6_news": ("liubei", "warmth",
     T("他醒过来，第一个找的是你：『子衡……云长他……』", "When he comes to, it's you he looks for first. 'Ziheng… Yunchang…'"), None),
}

MAP = node("x_rel_wzmap", "*", "interrupt", T("小路图", "The Map"), "free", T("原创", "original"),
    [RP(T("温芷托人送来一张折得很小的纸。打开是一张手画的地图：江陵到上庸、到麦城，几条山里的小路，是她这几年给伤兵送药走出来的。角上写着：『用不上最好。』",
          "Wen Zhi sends you a scrap of paper folded very small. Unfolded, it's a hand-drawn map: the mountain paths from Jiangling to Shangyong and to Maicheng, worn by her own feet over years of carrying medicine to the wounded. In the corner she has written: 'Best if you never need it.'"), None, ["wenzhi", "intimacy", 1])],
    [choice("keep", "expression", T("收进贴身的衣袋里。", "Tuck it into the pocket closest to you."), T("那张纸贴着你的心口，一直到麦城。", "The paper stays against your chest all the way to Maicheng."),
            [setv("flag.v4_wz_map"), rel("wenzhi", "intimacy", 1)]),
     choice("thanks", "expression", T("回一张字条：『等这一仗打完，你带我走一遍。』", "Send a note back: 'When this war is over, walk it with me.'"),
            T("字条回来了，只有一个字：『好。』", "The note comes back with a single word: 'Yes.'"),
            [setv("flag.v4_wz_map"), rel("wenzhi", "warmth", 1)])],
    when=ALL(JING, AT("wenzhi", "intimacy", 1), NF("flag.v4_wz_map")), order=3)
MAP["art"] = {"scene": "lamp", "layers": [], "illus": "v4_wz_map"}; MAP["cast"] = [{"id": "wenzhi"}]

GUAN_OUT = T("关羽没有拔刀。他只说了一个字：『滚。』第二天一早，周仓把你的行李放在了营门外。荆州，你回不去了。",
             "Guan Yu doesn't draw his blade. He says only one word: 'Out.' Early the next morning Zhou Cang leaves your things outside the camp gate. You can't go back to Jingzhou.")


def extend(N, VARS):
    for k, lab in FLAGS.items(): VARS[k] = {"type": "flag", "init": False, "label": lab, "carry": False}
    VARS["grudge.guanyu"] = {"type": "num", "init": 0, "min": 0, "max": 10, "label": T("关羽·记仇", "Guan Yu · grudge"), "carry": False}
    byid = {n["id"]: n for n in N}
    for nid, (c, d, warm, cold) in INTRO.items():
        init = VARS[f"rel.{c}.{d}"]["init"]
        extra = [RP(warm, WARM(c, d), [c, d, 2])] + ([RP(cold, COLD(c, d), [c, d, 0])] if cold and init > TIER_END[0] else [])
        byid[nid]["intro"] = list(byid[nid]["intro"]) + extra
    # Wen Zhi's map, and the day the riders need it
    N.append(MAP)
    rt = byid["c5_retreat"]; call = next(c for c in rt["choices"] if c["id"] == "call")
    cm = copy.deepcopy(call)
    cm.update({"id": "call_map", "when": F("flag.v4_wz_map"),
               "label": T("拿出温芷画的小路图，劝关羽：现在就派人抄小路去上庸、去成都求救。", "Bring out Wen Zhi's map and urge Guan Yu: send riders by the back paths to Shangyong and Chengdu, now."),
               "out": [P(T("廖化照着温芷的图，抄山里的小路去了上庸，比走大路早到了两天。你写给成都的信，也跟着他走了。", "Following Wen Zhi's map, Liao Hua takes the mountain paths to Shangyong and arrives two days sooner than the main road would have allowed. Your letter to Chengdu travels with him."))]
                      + call["out"][1:],
               "effects": call["effects"] + [rel("guanyu", "trust", 1), rel("wenzhi", "trust", 1)],
               "because": T("因为温芷给过你那张小路图", "Because Wen Zhi gave you that map")})
    call["when"] = ALL(call["when"], NF("flag.v4_wz_map")) if call.get("when") else NF("flag.v4_wz_map")
    rt["choices"].insert(rt["choices"].index(call) + 1, cm)
    # the same request lands differently
    fl = byid["c2_flood"]; pl = next(c for c in fl["choices"] if c["id"] == "plan")
    _twin(fl, "plan", WARM("guanyu", "esteem"), NOTWARM("guanyu", "esteem"),
          {"out": [P(T("关羽一拍大腿：『就这么办。』当夜就让关平去备船。", "Guan Yu slaps his thigh. 'That's how we'll do it.' That very night he sends Guan Ping to ready the boats."))] + pl["out"],
           "effects": pl["effects"] + [rel("guanyu", "trust", 1)], "because": T("因为关羽器重你，当场用了你的计", "Because Guan Yu values you, he takes your plan on the spot")})
    cd = byid["c4_cd"]; ea = next(c for c in cd["choices"] if c["id"] == "early")
    _twin(cd, "early", WARM("liubei", "trust"), NOTWARM("liubei", "trust"),
          {"out": [P(T("汉中王当场写了手令：『上庸的兵，听子衡调遣。』", "The King writes an order then and there: 'The troops at Shangyong answer to Ziheng.'"))] + ea["out"],
           "effects": ea["effects"] + [rel("liubei", "trust", 1)], "because": T("因为汉中王信你，把上庸的兵交给了你", "Because the King trusts you, he puts the Shangyong troops under you")})
    # Guan Yu doesn't kill his brother's man — he drives you out
    gr = byid["x_guan_rage4"]
    for c in gr["choices"]: c["when"] = ALL(c["when"], V("grudge.guanyu", "<=", 2)) if c.get("when") else V("grudge.guanyu", "<=", 2)
    gr["choices"].append(choice("bow_late", "expression", T("拱手赔罪。", "Bow and apologize."),
        T("关羽看了你很久：『你走吧。』从那天起，他议事不再叫你，路上遇见了，也只当没看见。", "Guan Yu looks at you a long while. 'Go.' From that day on he no longer calls you to council; if you pass on the road, he looks straight through you."),
        [setv("flag.sidelined"), rel("guanyu", "esteem", -2), rel("guanyu", "warmth", -1)], when=V("grudge.guanyu", ">=", 3)))
    out = choice("stand_late", "dilemma", T("不退。", "Don't back down."), GUAN_OUT,
                 [setv("flag.v4_left"), rel("guanyu", "esteem", -3), rel("liubei", "trust", -2)], when=V("grudge.guanyu", ">=", 3))
    out["fate"] = {"kind": "exile", "who": "guanyu", "label": T("被逐出", "sent away")}; out["ends"] = True
    gr["choices"].append(out)

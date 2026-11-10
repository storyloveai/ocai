"""《灰烬王冠》galgame 的写法工具（规格 storydate.campaign/0.4，题材包 relic-war）。从汐川的 lib.py 复制，加了记忆和遗器档案的写法。
场景和选项照引擎的格式写；每个场景、每个选项多一份逐句剧本 `script`，只给播放页用，引擎不读：
  bg(背景) · show(人, 表情, 位置) · hide(人) · cg(CG) / cgoff() · say(人, 中, 英) · nar(中, 英) · me(中, 英) · think(中, 英)
关系藏在后台（rel.<人>.trust 等），页面上从不显示数字。
记忆：mem.<id> 是旗标，开局为真；全力出手用 forget(id) 交出一段（mem.<id> 变假、memories 减一）。"""
import json, pathlib
ENGINE = pathlib.Path(__file__).resolve().parents[2] / "engine"
SPEC = "storydate.campaign/0.4"
def PACK(pid): return json.loads((ENGINE / "packs" / f"{pid}.json").read_text(encoding="utf-8"))
def TIERS():
    t = json.loads((ENGINE / "tiers.json").read_text(encoding="utf-8")); return t
_t = json.loads((ENGINE / "tiers.json").read_text(encoding="utf-8"))
TIER_START, TIER_END = _t["start"], _t["end"]

def T(zh, en): return {"zh": zh, "en": en}
def V(name, op, val=True): return {"v": name, "op": op, "val": val}
def F(name): return V(name, "==", True)
def NF(name): return V(name, "!=", True)
def ALL(*a): return {"all": list(a)}
def ANY(*a): return {"any": list(a)}
def AT(c, axis, k): return V(f"rel.{c}.{axis}", ">=", TIER_START[k])
def UPTO(c, axis, k): return V(f"rel.{c}.{axis}", "<=", TIER_END[k])
def setv(name, val=True): return {"set": name, "to": val}
def add(name, by=1): return {"add": name, "by": by}
def rel(c, dim, by): return {"add": f"rel.{c}.{dim}", "by": by}
def P(text, when=None):
    d = {"text": text}
    if when: d["when"] = when
    return d

# ---- the line-by-line script (player only) ----
def bg(id): return {"op": "bg", "id": id}
def show(who, face="normal", at="center"): return {"op": "show", "who": who, "face": face, "at": at}
def hide(who=None): return {"op": "hide", "who": who}
def cg(id): return {"op": "cg", "id": id}
def cgoff(): return {"op": "cg", "id": None}
def say(who, zh, en, face=None):
    d = {"op": "say", "who": who, "t": T(zh, en)}
    if face: d["face"] = face
    return d
def nar(zh, en): return {"op": "say", "who": None, "t": T(zh, en)}
def me(zh, en): return {"op": "say", "who": "me", "t": T(zh, en)}
def think(zh, en): return {"op": "say", "who": "me", "think": True, "t": T(zh, en)}
def iff(cond, *ops):
    """lines that play only when `cond` holds at that moment (something you did earlier, a relationship tier)"""
    return [{**o, "when": cond} for o in ops]

def flat(script):
    out = []
    for x in script: out.extend(flat(x) if isinstance(x, list) else [x])
    return out

def lines(script):
    """first spoken line of a script, for the engine's own short `out`/`intro` text"""
    s = next((x for x in script if x["op"] == "say" and not x.get("when")), None)
    return [P(s["t"])] if s else [P(T("（继续）", "(Continue)"))]

def choice(id, type, label, script, effects=(), values=(), when=None, req=None, hint=None, ends=False):
    script = flat(script)
    d = {"id": id, "type": type, "label": label, "out": lines(script), "effects": list(effects), "script": script}
    if values: d["values"] = list(values)
    if when: d["when"] = when
    if req: d["req"] = req
    if hint: d["hint"] = hint
    if ends: d["ends"] = True
    return d

def scene(id, chapter, kind, title, script, choices, order=0, when=None, salience=0, cast=()):
    script = flat(script)
    d = {"id": id, "chapter": chapter, "kind": kind, "title": title, "lock": "free", "canon": T("原创", "original"),
         "intro": lines(script), "choices": choices, "salience": salience, "order": order, "script": script}
    if when: d["when"] = when
    if cast: d["cast"] = [{"id": c} for c in cast]
    return d

# ---- 记忆（代价）----
def forget(mid): return [setv(f"mem.{mid}", False), add("memories", -1)]
def REMEMBERS(mid): return F(f"mem.{mid}")
def FORGOT(mid): return NF(f"mem.{mid}")
def lamp_takes(zh, en):
    """提灯收下一段记忆时的固定一行（播放页会把这一行显示成灰色，并在记忆册里把这段变灰）"""
    return {"op": "say", "who": "lamp", "t": T(zh, en), "forget": True}

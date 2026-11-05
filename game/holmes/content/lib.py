"""《贝克街》的写法工具（规格 storydate.campaign/0.4，题材包 mystery-revenge）。和《汐川》同一套写法，逐句剧本 `script` 只给播放页用：
  bg · show · hide · cg / cgoff · say(人, 中, 英) · nar · me（华生说） · think（华生心里想）
英文台词尽量用原著原句（公版），中文自己翻译。"""
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
    return [P(s["t"])] if s else [P(T("……", "…"))]

def choice(id, type, label, script, effects=(), values=(), when=None, req=None, hint=None, ends=False):
    script = flat(script)
    d = {"id": id, "type": type, "label": label, "out": lines(script), "effects": list(effects), "script": script}
    if values: d["values"] = list(values)
    if when: d["when"] = when
    if req: d["req"] = req
    if hint: d["hint"] = hint
    if ends: d["ends"] = True
    return d

CANON = T("柯南·道尔原著", "Arthur Conan Doyle")
def scene(id, chapter, kind, title, script, choices, order=0, when=None, salience=0, cast=()):
    script = flat(script)
    d = {"id": id, "chapter": chapter, "kind": kind, "title": title, "lock": "free", "canon": CANON,
         "intro": lines(script), "choices": choices, "salience": salience, "order": order, "script": script}
    if when: d["when"] = when
    if cast: d["cast"] = [{"id": c} for c in cast]
    return d

# ---- 查案（决策记录 v0.4）：线索是旗标 clue.<id>，同时给“证据”加 1；推理问答的答对数记在 deduce ----
def clue(cid): return [setv(f"clue.{cid}"), add("proof", 1)]
def HAS(cid): return F(f"clue.{cid}")

"""Campaign spec v0.3 helpers. Content files read like the spec, not like brackets."""
import json

def T(zh, en):
    return {"zh": zh, "en": en}

# ---- conditions (may nest) ----
def V(name, op, val=True):
    return {"v": name, "op": op, "val": val}
def F(name):            # flag is true
    return V(name, "==", True)
def NF(name):           # flag is not true
    return V(name, "!=", True)
def ALL(*a): return {"all": list(a)}
def ANY(*a): return {"any": list(a)}
LIU = V("track", "==", "liu")
CAO = V("track", "==", "cao")

# ---- effects ----
def setv(name, val=True): return {"set": name, "to": val}
def add(name, by=1): return {"add": name, "by": by}
def rel(char, dim, by): return {"add": f"rel.{char}.{dim}", "by": by}

def P(text, when=None):
    """A paragraph that shows only when `when` holds."""
    d = {"text": text}
    if when: d["when"] = when
    return d

def choice(id, type, label, out, effects=(), when=None, req=None, hint=None, foresight=False,
           echo=(), debt=(), resolve=(), intent=None):
    d = {"id": id, "type": type, "label": label, "out": out if isinstance(out, list) else [P(out)],
         "effects": list(effects)}
    if when: d["when"] = when
    if req: d["req"] = req
    if hint: d["hint"] = hint
    if foresight: d["foresight"] = True
    if echo: d["echo"] = list(echo)
    if debt: d["debt"] = list(debt)
    if resolve: d["resolve"] = [list(r) for r in resolve]
    if intent: d["intent"] = intent
    return d

def cb(pays, text, when):
    return {"pays": pays, "text": text, "when": when}

def node(id, chapter, kind, title, lock, canon, intro, choices, when=None, salience=0, quote=None,
         callbacks=(), on_enter=(), speaker=None, order=0):
    d = {"id": id, "chapter": chapter, "kind": kind, "title": title, "lock": lock, "canon": canon,
         "intro": intro if isinstance(intro, list) else [P(intro)], "choices": choices,
         "salience": salience, "order": order}
    if when: d["when"] = when
    if quote: d["quote"] = quote
    if callbacks: d["callbacks"] = list(callbacks)
    if on_enter: d["on_enter"] = list(on_enter)
    if speaker: d["speaker"] = speaker
    return d

def dump(obj, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)

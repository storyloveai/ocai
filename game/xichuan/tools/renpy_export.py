#!/usr/bin/env python3
"""把《汐川》的剧本转成 Ren'Py 工程的 game/ 内容（决策记录 v0.24，小样）：game/xichuan/renpy/game/
用法：python3 tools/renpy_export.py [--chapters p,c1]

Ren'Py（https://www.renpy.org）：最成熟的开源视觉小说引擎。这里只翻译剧本和素材，不写界面：
  背景 → images/bg <名>.webp，立绘 → images/<人> <表情>.webp，CG → images/cg <名>.webp（Ren'Py 按文件名自动定义图片）
  逐句剧本 → scene / show / hide / 台词；iff 条件 → if；选项 → menu（带条件）+ $ 效果；支线选择 → menu；章节 → label + jump。
用 SDK 新建一个工程，把这里生成的 game/ 下的文件拷进去，再放一个中文字体（见 docs/WebGAL小样-给Codex.md 里的 Ren'Py 一节）。"""
import json, pathlib, shutil, sys

R = pathlib.Path(__file__).resolve().parents[1]
camp = json.loads((R / "content/campaign.json").read_text("utf-8"))
OUT = R / "renpy/game"
CHAPS = (sys.argv[sys.argv.index("--chapters") + 1] if "--chapters" in sys.argv else "p,c1").split(",")
COLORS = {"zhiyao": "#ff9db8", "shencheng": "#8fc7ff", "jibai": "#c7b4ff", "zhou": "#c9b48a", "chenghang": "#9fe0a8"}
SLOT = {"left": "fig_left", "right": "fig_right", "center": "fig_center"}   # 立绘 1024×1536，缩到画面高度的 95%

def var(name): return name.replace(".", "_")
def text(s): return s.replace("\\", "\\\\").replace('"', '\\"').replace("[", "[[").replace("{", "{{").replace("%", "%%").replace("\n", " ")

def cond(c):
    if not c: return None
    if "all" in c: return " and ".join(f"({cond(x)})" for x in c["all"])
    if "any" in c: return " or ".join(f"({cond(x)})" for x in c["any"])
    v, op, val = var(c["v"]), c["op"], c["val"]
    if isinstance(val, bool): return f"{v}" if (op == "==") == val else f"not {v}"
    return f"{v} {op} {val}"

class Stage:
    def __init__(self): self.slots = {}; self.bg = None
    def fig(self, who, face, at, pad):
        has = lambda f: (OUT / f"images/{who} {f}.webp").exists()
        face = face if has(face) else "normal"
        if not has(face): return []                               # 没有立绘的配角：只显示名字
        out = []
        for slot, w in list(self.slots.items()):
            if slot == at and w != who: out.append(f"{pad}hide {w}"); del self.slots[slot]
        self.slots = {s: w for s, w in self.slots.items() if w != who}; self.slots[at] = who
        return out + [f"{pad}show {who} {face} at {SLOT[at]}"]

def lines(ops, st, pad):
    out = []
    for op in ops:
        k, c = op["op"], cond(op.get("when"))
        p = pad + ("    " if c else "")
        body = []
        if k == "bg":
            st.bg = op["id"]; st.slots = {}; body.append(f"{p}scene bg {op['id']} with dissolve")
        elif k == "cg":
            if op["id"] and (OUT / f"images/cg {op['id']}.webp").exists(): st.slots = {}; body.append(f"{p}scene cg {op['id']} with dissolve")
            elif not op["id"] and st.bg: body.append(f"{p}scene bg {st.bg} with dissolve")
        elif k == "show":
            at = op.get("at") or next((s for s, w in st.slots.items() if w == op["who"]), "center")
            body += st.fig(op["who"], op.get("face", "normal"), at, p)
        elif k == "hide":
            for s, w in list(st.slots.items()):
                if not op.get("who") or w == op["who"]: body.append(f"{p}hide {w}"); del st.slots[s]
        elif k == "say":
            who, t = op.get("who"), text(op["t"]["zh"])
            if who and who != "me" and op.get("face"):
                slot = next((s for s, w in st.slots.items() if w == who), None)
                if slot: body += st.fig(who, op["face"], slot, p)
            if who is None: body.append(f'{p}"{t}"')
            elif who == "me": body.append(f'{p}"（{t}）"' if op.get("think") else f'{p}me "{t}"')
            else: body.append(f'{p}{who} "{t}"')
        if body: out += ([f"{pad}if {c}:"] if c else []) + body
    return out

def effects(effs, pad):
    out = []
    for e in effs:
        if "set" in e: out.append(f"{pad}$ {var(e['set'])} = {repr(e['to'])}")
        elif "add" in e:
            d = camp["vars"].get(e["add"], {}); v = var(e["add"])
            out.append(f"{pad}$ {v} = max({d.get('min', -999)}, min({d.get('max', 999)}, {v} + ({e['by']})))")
    return out

def node(n, st, then):
    out = [f"    # ==== {n['id']} · {n['title']['zh']}"] + lines(n.get("script", []), st, "    ") + ["    menu:"]
    for c in n["choices"]:
        conds = [x for x in (cond(c.get("when")), cond(c.get("req"))) if x]
        out.append(f'        "{text(c["label"]["zh"])}"' + (f" if {' and '.join(f'({x})' for x in conds)}" if conds else "") + ":")
        body = effects(c.get("effects", []), "            ") + lines(c.get("script", []), st, "            ") + [f"            {then}"]
        out += body
    return out

def build():
    if OUT.exists(): shutil.rmtree(OUT)
    (OUT / "images").mkdir(parents=True)
    A = R / "art"
    for p in (A / "bg").glob("*.webp"): shutil.copy(p, OUT / f"images/bg {p.stem}.webp")
    for p in (A / "cg").glob("*.webp"): shutil.copy(p, OUT / f"images/cg {p.stem}.webp")
    for p in (A / "sprites").glob("*/*.webp"): shutil.copy(p, OUT / f"images/{p.parent.name} {p.stem}.webp")

    head = ["# 由 tools/renpy_export.py 生成，不要手改", f'define me = Character("{camp["player"]["name"]["zh"]}")']
    head += [f"transform fig_{k}:\n    zoom 0.67\n    xalign {x}\n    yalign 1.0" for k, x in (("left", 0.18), ("center", 0.5), ("right", 0.82))]
    head += [f'define {c} = Character("{v["name"]["zh"]}", color="{COLORS.get(c, "#ffffff")}")' for c, v in camp["chars"].items()]
    head += [f"default {var(k)} = {repr(False) if d['type'] == 'flag' else d['init']}" for k, d in camp["vars"].items() if d["type"] in ("num", "flag")]
    body = ["", "label start:", f"    jump ch_{CHAPS[0]}"]
    chapters = [c for c in camp["chapters"] if c["id"] in CHAPS]
    for i, ch in enumerate(chapters):
        nxt = f"jump ch_{chapters[i + 1]['id']}" if i + 1 < len(chapters) else "jump fin"
        mains = sorted([n for n in camp["nodes"].values() if n["chapter"] == ch["id"] and n["kind"] == "main" and not n["id"].endswith("_out")], key=lambda n: n["order"])
        sides = sorted([n for n in camp["nodes"].values() if n["chapter"] == ch["id"] and n["kind"] == "side"], key=lambda n: n["order"])
        body += ["", f"label ch_{ch['id']}:", f'    centered "{text(ch["title"]["zh"])}"']
        st = Stage()
        for k, n in enumerate(mains):
            then = f"jump {mains[k + 1]['id']}" if k + 1 < len(mains) else (f"jump sides_{ch['id']}" if sides else nxt)
            if k: body.append(f"label {n['id']}:")
            body += node(n, st, then)
        if sides:
            prompt = text((ch.get("side_prompt") or camp.get("side_prompt") or {}).get("zh", "放学后，你去了……"))
            body += ["", f"label sides_{ch['id']}:", "    menu:", f'        "{prompt}"']
            for n in sides:
                c = cond(n.get("when"))
                body += [f'        "{text(n["title"]["zh"])}"' + (f" if {c}" if c else "") + ":", f"            jump {n['id']}"]
            for n in sides:
                body += ["", f"label {n['id']}:"] + node(n, Stage(), nxt)
    body += ["", "label fin:", '    "（小样到此结束。完整版里接下来是第二章《第一场放映》。）"', "    return"]
    (OUT / "script.rpy").write_text("\n".join(head + body) + "\n", "utf-8")
    (OUT / "xichuan_options.rpy").write_text("\n".join([
        "# 小样的设置：在 SDK 生成的工程（generate_gui --language schinese，自带思源黑体）之上覆盖标题和标题画面",
        "init 5 python:",
        '    config.name = "汐川的第七个春天"',
        '    config.window_title = "汐川的第七个春天"',
        "    config.menu_include_disabled = False", ""]), "utf-8")
    print("renpy/game ·", ", ".join(c["id"] for c in chapters), "·", sum(1 for _ in (OUT / "script.rpy").read_text("utf-8").splitlines()), "lines,",
          sum(1 for _ in (OUT / "images").glob("*")), "images")

if __name__ == "__main__":
    build()

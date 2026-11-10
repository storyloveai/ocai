#!/usr/bin/env python3
"""把《汐川》的剧本转成 WebGAL 游戏包（决策记录 v0.23，小样）：game/xichuan/webgal/game/
用法：python3 tools/webgal_export.py [--chapters p,c1]

WebGAL（https://github.com/OpenWebGAL/WebGAL，MPL-2.0）负责演出：转场、立绘、CG、存读档、回想、自动/快进、鉴赏。
我们的剧本照旧写在 content/*.py；这里只做翻译：
  场景 → 一个 .txt 场景文件；逐句剧本 → changeBg / changeFigure / 台词；iff 条件 → -when=；
  选项 → choose（带显示条件）+ label + setVar（效果）；章节里的“放学后你去了……” → choose；章节之间 → changeScene。
小样只翻译序章和第一章，用来和现在的播放页比“手感”。自由对话（AI）、决裂这些在小样里先不接。"""
import argparse, json, pathlib, shutil

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source-root', type=pathlib.Path, default=pathlib.Path(__file__).resolve().parents[1], help='Read-only Xichuan input directory')
parser.add_argument('--out', type=pathlib.Path, default=pathlib.Path(__file__).resolve().parents[1] / 'webgal/game')
parser.add_argument('--chapters', default='p,c1')
args = parser.parse_args()
R = args.source_root.resolve()
camp = json.loads((R / 'content/campaign.json').read_text('utf-8'))
OUT = args.out.resolve()
CHAPS = args.chapters.split(',')
unknown = set(CHAPS) - {c['id'] for c in camp['chapters']}
if unknown or not CHAPS or not all(CHAPS):
    parser.error(f'Unknown or empty chapter selection: {args.chapters}')
NAMES = {c: v["name"]["zh"] for c, v in camp["chars"].items()}
PLAYER = camp["player"]["name"]["zh"]
SLOT = {"left": "-left", "right": "-right", "center": ""}

def var(name): return name.replace(".", "_")
def esc(s): return s.replace(";", "；").replace("\n", " ")

def cond(c):
    """our condition tree → a WebGAL expression"""
    if not c: return None
    if "all" in c: return " && ".join(f"({cond(x)})" for x in c["all"])
    if "any" in c: return " || ".join(f"({cond(x)})" for x in c["any"])
    v, op, val = var(c["v"]), c["op"], c["val"]
    if isinstance(val, bool): val = "true" if val else "false"
    if op == "==" and val == "true": return f"{v}==true"
    if op == "!=" and val == "true": return f"{v}!=true"
    return f"{v}{op}{val}"

def when(c): e = cond(c); return f" -when={e}" if e else ""

class Stage:
    def __init__(self): self.slots = {}; self.bg = None
    def fig(self, who, face, at):
        face = face if (OUT / f"figure/{who}_{face}.webp").exists() else "normal"
        if not (OUT / f"figure/{who}_{face}.webp").exists(): return []          # 没有立绘的配角：只显示名字
        out = []
        for slot, w in list(self.slots.items()):                                 # 同一个人只站一个位置；同一个位置只站一个人
            if (w == who and slot != at) or (slot == at and w != who): out.append(f"changeFigure:none {SLOT[slot]} -next;"); del self.slots[slot]
        self.slots[at] = who
        return out + [f"changeFigure:{who}_{face}.webp {SLOT[at]} -next;".replace("  ", " ")]

def lines(ops, st):
    out = []
    for op in ops:
        w = when(op.get("when")); k = op["op"]
        if k == "bg":
            st.bg = op["id"]; out += [f"changeFigure:none -left -next{w};", f"changeFigure:none -next{w};", f"changeFigure:none -right -next{w};", f"changeBg:bg_{op['id']}.webp -next{w};"]; st.slots = {}
        elif k == "cg":
            if op["id"] and (OUT / f"background/cg_{op['id']}.webp").exists():
                out += [f"changeFigure:none -left -next{w};", f"changeFigure:none -next{w};", f"changeFigure:none -right -next{w};",
                        f"changeBg:cg_{op['id']}.webp -next{w};", f"unlockCg:cg_{op['id']}.webp -name={esc(camp['art']['cg'].get(op['id'], {}).get('zh', op['id']))}{w};"]; st.slots = {}
            elif not op["id"] and st.bg: out.append(f"changeBg:bg_{st.bg}.webp -next{w};")
        elif k == "show":
            out += [x[:-1] + w + ";" for x in st.fig(op["who"], op.get("face", "normal"), op.get("at") or next((s for s, x in st.slots.items() if x == op["who"]), "center"))]
        elif k == "hide":
            for slot, x in list(st.slots.items()):
                if not op.get("who") or x == op["who"]: out.append(f"changeFigure:none {SLOT[slot]} -next{w};".replace("  ", " ")); del st.slots[slot]
        elif k == "say":
            who, text = op.get("who"), esc(op["t"]["zh"])
            if who and who != "me" and op.get("face"):
                slot = next((s for s, x in st.slots.items() if x == who), None)
                if slot: out += [x[:-1] + w + ";" for x in st.fig(who, op["face"], slot)]
            if who is None: out.append(f":{text}{w};")
            elif who == "me": out.append(f":（{text}）{w};" if op.get("think") else f"{PLAYER}:{text}{w};")
            else: out.append(f"{NAMES[who]}:{text}{w};")
    return out

def effects(effs):
    out = []
    for e in effs:
        if "set" in e: out.append(f"setVar:{var(e['set'])}={'true' if e['to'] is True else 'false' if e['to'] is False else e['to']};")
        elif "add" in e:
            d = camp["vars"].get(e["add"], {}); v = var(e["add"])
            out.append(f"setVar:{v}={v}+{e['by']};" if e["by"] >= 0 else f"setVar:{v}={v}-{-e['by']};")
            if "min" in d: out.append(f"setVar:{v}={d['min']} -when={v}<{d['min']};")
            if "max" in d: out.append(f"setVar:{v}={d['max']} -when={v}>{d['max']};")
    return out

def node_text(n, st, then):
    """one scene → WebGAL lines, ending with `then` (the next thing to happen)"""
    out = [f"; ==== {n['id']} · {n['title']['zh']}"] + lines(n.get("script", []), st)
    opts = []
    for c in n["choices"]:
        show = cond(c.get("when")); lock = cond(c.get("req"))
        lab = esc(c["label"]["zh"]).replace(":", "：").replace("|", "／")
        pre = (f"({show})" if show else "") + (f"[{lock}]" if lock else "")
        if pre: pre += "->"
        opts.append(f"{pre}{lab}:{n['id']}__{c['id']}")
    out.append("choose:" + "|".join(opts) + ";")
    for c in n["choices"]:
        out.append(f"label:{n['id']}__{c['id']};")
        out += effects(c.get("effects", []))
        out += lines(c.get("script", []), st)
        out.append(then)
    return out

def build():
    if OUT.exists(): shutil.rmtree(OUT)
    for d in ("scene", "background", "figure", "bgm", "vocal", "animation", "template"): (OUT / d).mkdir(parents=True, exist_ok=True)
    A = R / "art"
    for p in (A / "bg").glob("*.webp"): shutil.copy(p, OUT / f"background/bg_{p.name}")
    for p in (A / "cg").glob("*.webp"):
        if p.name != "title.webp": shutil.copy(p, OUT / f"background/cg_{p.name}")
    if (A / "cg/title.webp").exists(): shutil.copy(A / "cg/title.webp", OUT / "background/title.webp")
    for p in (A / "sprites").glob("*/*.webp"): shutil.copy(p, OUT / f"figure/{p.parent.name}_{p.name}")

    init = [f"setVar:{var(k)}={('true' if d.get('init', False) else 'false') if d['type'] == 'flag' else d['init']};" for k, d in camp["vars"].items() if d["type"] in ("num", "flag")]
    chapters = [c for c in camp["chapters"] if c["id"] in CHAPS]
    for i, ch in enumerate(chapters):
        nxt = f"changeScene:{chapters[i + 1]['id']}.txt;" if i + 1 < len(chapters) else "changeScene:fin.txt;"
        mains = sorted([n for n in camp["nodes"].values() if n["chapter"] == ch["id"] and n["kind"] == "main" and not str(n["id"]).endswith("_out")], key=lambda n: n["order"])
        sides = sorted([n for n in camp["nodes"].values() if n["chapter"] == ch["id"] and n["kind"] == "side"], key=lambda n: n["order"])
        st = Stage(); out = (init if i == 0 else []) + [f"intro:{esc(ch['title']['zh'])}|{esc(ch['intro'][0]['text']['zh']) if ch.get('intro') else ''};"]
        after_main = f"jumpLabel:{ch['id']}__sides;" if sides else nxt
        for k, n in enumerate(mains):
            out += node_text(n, st, f"jumpLabel:{mains[k + 1]['id']}__start;" if k + 1 < len(mains) else after_main)
            if k + 1 < len(mains): out.append(f"label:{mains[k + 1]['id']}__start;")
        if sides:
            out.append(f"label:{ch['id']}__sides;")
            prompt = esc((ch.get("side_prompt") or camp.get("side_prompt") or {}).get("zh", "放学后，你去了……"))
            out.append(f":{prompt};")
            out.append("choose:" + "|".join(f"({cond(n['when'])})->{esc(n['title']['zh'])}:{n['id']}__start" if n.get("when") else f"{esc(n['title']['zh'])}:{n['id']}__start" for n in sides) + ";")
            for n in sides:
                out.append(f"label:{n['id']}__start;")
                out += node_text(n, Stage(), nxt)
        (OUT / f"scene/{ch['id']}.txt").write_text("\n".join(out) + "\n", "utf-8")
    (OUT / "template/template.json").write_text(json.dumps({"name": "StoryDate WebGAL spike"}) + "\n", "utf-8")
    (OUT / "userStyleSheet.css").write_text('/* Use the engine default theme. */\n', 'utf-8')
    (OUT / "animation/animationTable.json").write_text('[]\n', 'utf-8')
    for style in ('UI/Title/title.scss', 'Stage/TextBox/textbox.scss', 'Stage/Choose/choose.scss'):
        p = OUT / 'template' / style
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text('/* Use the engine default theme. */\n', 'utf-8')
    (OUT / "scene/start.txt").write_text(f"changeScene:{chapters[0]['id']}.txt;\n", "utf-8")
    (OUT / "scene/fin.txt").write_text(":（小样到此结束。完整版里接下来是第二章《第一场放映》。）;\nend;\n", "utf-8")
    (OUT / "config.txt").write_text("\n".join([f"Game_name:{camp['title']['zh']};", "Game_key:storydate-xichuan-webgal-spike-v1;", "Title_img:title.webp;",
        "Enable_Appreciation:true;", "Enable_Continue:true;", "Enable_flowchart:false;"]) + "\n", "utf-8")
    print("webgal/game ·", ", ".join(c["id"] for c in chapters), "·", sum(1 for _ in (OUT / "scene").glob("*.txt")), "scenes,",
          sum(1 for _ in (OUT / "background").glob("*")), "backgrounds,", sum(1 for _ in (OUT / "figure").glob("*")), "figures")

if __name__ == "__main__":
    build()

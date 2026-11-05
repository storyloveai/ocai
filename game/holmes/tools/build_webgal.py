#!/usr/bin/env python3
"""《贝克街》→ WebGAL 网页版：ooc-replica/dist/assets/holmes-webgal/
用法：python3 game/holmes/tools/build_webgal.py
- 引擎：直接用 Codex 构建好的 WebGAL 4.6.6（ooc-replica/dist/assets/xichuan-webgal，未改源码），只换 game/ 目录。
- 剧本：game/xichuan/tools/webgal_export.py（两本书共用的导出器）把 content/campaign.json 转成 WebGAL 剧本，全部章节。
- 结局：导出器只到 fin.txt，这里按结局碎片的条件重写 fin.txt（-when）。
- 图还没出的背景和 CG 先用占位图（只在构建的临时目录里生成，不进 art/）。"""
import json, pathlib, shutil, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFont

HERE = pathlib.Path(__file__).resolve().parents[1]
REPO = HERE.parents[1]
ENGINE = REPO / "ooc-replica/dist/assets/xichuan-webgal"
DEST = REPO / "ooc-replica/dist/assets/holmes-webgal"
EXPORT = REPO / "game/xichuan/tools/webgal_export.py"
camp = json.loads((HERE / "content/campaign.json").read_text("utf-8"))

def font(size):
    for f in ("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc", "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc"):
        if pathlib.Path(f).exists(): return ImageFont.truetype(f, size)
    return ImageFont.load_default()

def placeholder(path, label, cg=False):
    im = Image.new("RGB", (1920, 1080)); d = ImageDraw.Draw(im)
    top, bot = ((58, 52, 64), (24, 22, 30)) if cg else ((70, 74, 78), (30, 32, 36))
    for y in range(1080):
        t = y / 1079; d.line([(0, y), (1920, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip(top, bot)))
    d.text((960, 420), label, fill=(220, 214, 200), font=font(64), anchor="mm")
    d.text((960, 500), "（图还没画，先占位）", fill=(160, 156, 150), font=font(32), anchor="mm")
    path.parent.mkdir(parents=True, exist_ok=True); im.save(path, quality=80)

def cond(c):
    if "all" in c: return " && ".join(f"({cond(x)})" for x in c["all"])
    if "any" in c: return " || ".join(f"({cond(x)})" for x in c["any"])
    v, op, val = c["v"].replace(".", "_"), c["op"], c["val"]
    if isinstance(val, bool): val = "true" if val else "false"
    return f"{v}{op}{val}"

def esc(s): return s.replace(";", "；").replace("\n", " ")

def main():
    with tempfile.TemporaryDirectory() as tmp:
        src = pathlib.Path(tmp) / "src"; game = pathlib.Path(tmp) / "game"
        (src / "content").mkdir(parents=True)
        shutil.copy(HERE / "content/campaign.json", src / "content/campaign.json")
        if (HERE / "art").exists(): shutil.copytree(HERE / "art", src / "art", ignore=shutil.ignore_patterns("candidates", "*.jsonl", "*.py", "*.md"))
        for kind in ("bg", "cg"):
            for k, name in camp["art"][kind].items():
                p = src / "art" / kind / f"{k}.webp"
                if not p.exists(): placeholder(p, name["zh"], cg=kind == "cg")
        chapters = ",".join(c["id"] for c in camp["chapters"])
        subprocess.run([sys.executable, str(EXPORT), "--source-root", str(src), "--out", str(game), "--chapters", chapters], check=True)

        # 结局：按碎片条件显示
        fin = ["changeFigure:none -left -next;", "changeFigure:none -next;", "changeFigure:none -right -next;", "changeBg:bg_baker_night.webp -next;",
               f":—— {esc(camp['volume']['zh'])} · 完 ——;"]
        for g in camp["endings"]:
            fin.append(f":【{esc(g['title']['zh'])}】;")
            for f in g["fragments"]:
                head = f"「{esc(f['title']['zh'])}」" if f.get("title") else ""
                fin.append(f":{head}{esc(f['text']['zh'])} -when={cond(f['when'])};")
        fin += [":（卷一试样到此结束。下一卷：《四签名》。）;", "end;"]
        (game / "scene/fin.txt").write_text("\n".join(fin) + "\n", "utf-8")
        (game / "config.txt").write_text("\n".join([f"Game_name:{camp['title']['zh']};", "Game_key:storydate-bakerstreet-v1;", "Title_img:bg_baker_night.webp;",
                                                    "Enable_Appreciation:true;", "Enable_Continue:true;", "Enable_flowchart:false;"]) + "\n", "utf-8")

        if DEST.exists(): shutil.rmtree(DEST)
        shutil.copytree(ENGINE, DEST, ignore=shutil.ignore_patterns("game"))
        shutil.copytree(game, DEST / "game")
        shutil.copytree(ENGINE / "game/template", DEST / "game/template", dirs_exist_ok=True)
        shutil.copy(ENGINE / "game/userStyleSheet.css", DEST / "game/userStyleSheet.css")
    m = json.loads((DEST / "manifest.json").read_text("utf-8"))
    m.update(name="贝克街 · 卷一 血字的研究", short_name="贝克街", description="福尔摩斯全本 galgame · WebGAL")
    (DEST / "manifest.json").write_text(json.dumps(m, ensure_ascii=False, indent=2) + "\n", "utf-8")
    (DEST / "NOTICE.txt").write_text("WebGAL 4.6.6 — OpenWebGAL contributors — MPL-2.0 (LICENSE-WebGAL.txt). Engine unmodified; copied from the xichuan-webgal build (see its SOURCE.json).\n"
                                     "Story: adapted from Arthur Conan Doyle, A Study in Scarlet (1887, public domain). Chinese text and adaptation: StoryDate.\n", "utf-8")
    print("WebGAL →", DEST, f"{sum(p.stat().st_size for p in DEST.rglob('*') if p.is_file()) / 1e6:.1f} MB")

if __name__ == "__main__":
    main()

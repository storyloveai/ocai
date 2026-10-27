#!/usr/bin/env python3
"""Inline campaign JSON + engine into one self-contained page. Usage: python3 tools/build.py"""
import json, pathlib, subprocess, sys
R = pathlib.Path(__file__).resolve().parents[1]
# the engine is shared by every book and lives in game/engine/; this book keeps a byte-identical copy
# (engine/campaign_core.js) so the website can keep taking its files from game/sanguo/ as before
SHARED = R.parent / "engine/campaign_core.js"
(R / "engine/campaign_core.js").write_bytes(SHARED.read_bytes())
subprocess.run([sys.executable, str(R / "content/campaign.py")], check=True, stdout=subprocess.DEVNULL)
if (R / "content/v2/campaign_v2.py").exists():
    subprocess.run(["node", str(R / "tools/presets.js"), str(R / "content/campaign.json"), str(R / "content/v2/presets.json")], check=True, stdout=subprocess.DEVNULL)
    subprocess.run([sys.executable, str(R / "content/v2/campaign_v2.py")], check=True, stdout=subprocess.DEVNULL)
if (R / "content/v3/campaign_v3.py").exists():
    subprocess.run(["node", str(R / "tools/presets.js"), str(R / "content/v2/campaign_v2.json"), str(R / "content/v3/presets.json"), "v3"], check=True, stdout=subprocess.DEVNULL)
    subprocess.run([sys.executable, str(R / "content/v3/campaign_v3.py")], check=True, stdout=subprocess.DEVNULL)
if (R / "content/v4/campaign_v4.py").exists():
    subprocess.run(["node", str(R / "tools/presets.js"), str(R / "content/v3/campaign_v3.json"), str(R / "content/v4/presets.json"), "v4"], check=True, stdout=subprocess.DEVNULL)
    subprocess.run([sys.executable, str(R / "content/v4/campaign_v4.py")], check=True, stdout=subprocess.DEVNULL)
if (R / "content/v5/campaign_v5.py").exists():
    subprocess.run(["node", str(R / "tools/presets.js"), str(R / "content/v4/campaign_v4.json"), str(R / "content/v5/presets.json"), "v5"], check=True, stdout=subprocess.DEVNULL)
    subprocess.run([sys.executable, str(R / "content/v5/campaign_v5.py")], check=True, stdout=subprocess.DEVNULL)
if (R / "content/v6/campaign_v6.py").exists():
    subprocess.run(["node", str(R / "tools/presets.js"), str(R / "content/v5/campaign_v5.json"), str(R / "content/v6/presets.json"), "v6"], check=True, stdout=subprocess.DEVNULL)
    subprocess.run([sys.executable, str(R / "content/v6/campaign_v6.py")], check=True, stdout=subprocess.DEVNULL)
if (R / "content/v7/campaign_v7.py").exists():
    subprocess.run(["node", str(R / "tools/presets.js"), str(R / "content/v6/campaign_v6.json"), str(R / "content/v7/presets.json"), "v7"], check=True, stdout=subprocess.DEVNULL)
    subprocess.run([sys.executable, str(R / "content/v7/campaign_v7.py")], check=True, stdout=subprocess.DEVNULL)
sys.path.insert(0, str(R / "content"))
import book
camp = book.load()
engine = (R / "engine/campaign_core.js").read_text()
art = (R / "engine/art.js").read_text() + "\n" + (R / "engine/portraits.js").read_text()
assert "</script" not in art
src = (R / "app/play.src.html").read_text()
assert "</script" not in engine
data = json.dumps(camp, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
base = src.replace("/*__BOOK__*/null", data).replace("/*__ENGINE__*/", engine).replace("/*__ART__*/", art)
# Two editions of the same book: "ink" (pictures drawn in code) and "illus" (the illustrations in art/).
# The illustrated page links to the image files instead of embedding them; web/illus.html finds them at ../art/,
# and the website rewrites ART_BASE to where it serves them.
ART_DIRS = ("portraits", "scenes", "cg", "ending")
files = sorted(f"{d}/{f.name}" for d in ART_DIRS for f in (R / "art" / d).glob("*.webp")) if (R / "art").exists() else []
def edition(name, art_base=""):
    return base.replace('"__EDITION__"', json.dumps(name)).replace('"__ART_BASE__"', json.dumps(art_base)).replace("/*__ART_FILES__*/[]", json.dumps(files if name == "illus" else []))
out = edition("ink")
(R / "dist").mkdir(exist_ok=True)
(R / "dist/index.html").write_text(out)
# a full document for standalone hosting (the artifact host adds its own skeleton)
head = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body style="margin:0">'
doc = head + out + "</body></html>"
(R / "web").mkdir(exist_ok=True)
(R / "web/index.html").write_text(doc)
(R / "web/illus.html").write_text(head + edition("illus", "../art/") + "</body></html>")
print("illus.html links", len(files), "illustrations")
print("dist/index.html", len(out), "bytes; web/index.html", len(doc))

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
sys.path.insert(0, str(R / "content"))
import book
camp = book.load()
engine = (R / "engine/campaign_core.js").read_text()
art = (R / "engine/art.js").read_text() + "\n" + (R / "engine/portraits.js").read_text()
# illustrated portraits (art/portraits/<character id>.webp), embedded so the page stays a single file
import base64
imgs = {f.stem: "data:image/webp;base64," + base64.b64encode(f.read_bytes()).decode() for f in sorted((R / "art/portraits").glob("*.webp"))}
art = "var PORTRAIT_IMG = " + json.dumps(imgs) + ";\n" + art
assert "</script" not in art
src = (R / "app/play.src.html").read_text()
assert "</script" not in engine
data = json.dumps(camp, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
out = src.replace("/*__BOOK__*/null", data).replace("/*__ENGINE__*/", engine).replace("/*__ART__*/", art)
(R / "dist").mkdir(exist_ok=True)
(R / "dist/index.html").write_text(out)
# a full document for standalone hosting (the artifact host adds its own skeleton)
doc = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body style="margin:0">' + out + "</body></html>"
(R / "web").mkdir(exist_ok=True)
(R / "web/index.html").write_text(doc)
print("dist/index.html", len(out), "bytes; web/index.html", len(doc))

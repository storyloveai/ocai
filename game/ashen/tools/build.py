#!/usr/bin/env python3
"""把剧本、引擎和美术清单打包成一个页面：web/index.html（网站上在 /assets/ashen/index.html）。
美术分两版：art/anime/... 和 art/real/...（名字一样），页面里可以切换，缺图时用另一版，再缺就用占位。
用法：python3 game/ashen/content/story.py && python3 game/ashen/tools/build.py"""
import json, pathlib
R = pathlib.Path(__file__).resolve().parents[1]
ENGINE = R.parent / "engine" / "campaign_core.js"
camp = json.loads((R / "content/campaign.json").read_text("utf-8"))
art = sorted(str(p.relative_to(R / "art")) for p in (R / "art").rglob("*.webp") if "candidates" not in p.parts)
src = (R / "app/play.src.html").read_text("utf-8")
src = src.replace("/*__ENGINE__*/", ENGINE.read_text("utf-8")).replace("/*__CAMPAIGN__*/null", json.dumps(camp, ensure_ascii=False)).replace("/*__ART__*/[]", json.dumps(art))
(R / "web").mkdir(exist_ok=True)
(R / "web/index.html").write_text(src, "utf-8")
print(f"web/index.html · {len(camp['nodes'])} scenes · {len(art)} pictures")

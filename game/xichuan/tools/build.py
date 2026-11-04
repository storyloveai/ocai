#!/usr/bin/env python3
"""把剧本、引擎和美术清单打包成一个页面：web/index.html（网站上在 /assets/xichuan/index.html）。
用法：python3 game/xichuan/content/story.py && python3 game/xichuan/tools/build.py"""
import json, pathlib
R = pathlib.Path(__file__).resolve().parents[1]
ENGINE = R.parent / "engine" / "campaign_core.js"
camp = json.loads((R / "content/campaign.json").read_text("utf-8"))
art = sorted(str(p.relative_to(R / "art")) for p in (R / "art").rglob("*.webp"))
src = (R / "app/play.src.html").read_text("utf-8")
src = src.replace("/*__ENGINE__*/", ENGINE.read_text("utf-8")).replace("/*__CAMPAIGN__*/null", json.dumps(camp, ensure_ascii=False)).replace("/*__ART__*/[]", json.dumps(art))
(R / "web").mkdir(exist_ok=True)
(R / "web/index.html").write_text(src, "utf-8")
print(f"web/index.html · {len(camp['nodes'])} scenes · {len(art)} pictures")

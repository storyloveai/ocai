#!/usr/bin/env python3
"""把剧本、引擎和美术清单打包成一个页面：web/index.html（网站上在 /assets/ashen/index.html）。
美术分两版：art/anime/... 和 art/real/...（名字一样），页面里可以切换，缺图时用另一版，再缺就用占位。
用法：python3 game/ashen/content/story.py && python3 game/ashen/tools/build.py"""
import json, pathlib, shutil
R = pathlib.Path(__file__).resolve().parents[1]
ENGINE = R.parent / "engine" / "campaign_core.js"
camp = json.loads((R / "content/campaign.json").read_text("utf-8"))
art = sorted(str(p.relative_to(R / "art")) for p in (R / "art").rglob("*.webp") if "candidates" not in p.parts)
src = (R / "app/play.src.html").read_text("utf-8")
src = src.replace("/*__ENGINE__*/", ENGINE.read_text("utf-8")).replace("/*__CAMPAIGN__*/null", json.dumps(camp, ensure_ascii=False)).replace("/*__ART__*/[]", json.dumps(art))
# 声音（决策记录 v0.13）：按 audio/cues.json 把用到的声音复制到 web/audio/（bgm/ 配乐，snd/ 环境音和音效）
LIB = R.parent / "engine/audio/lib"
cues = json.loads((R / "audio/cues.json").read_text("utf-8"))
AOUT = R / "web/audio"
if AOUT.exists(): shutil.rmtree(AOUT)
(AOUT / "bgm").mkdir(parents=True); (AOUT / "snd").mkdir()
for k, b in cues.get("bgm", {}).items():
    if (R / "audio" / b["file"]).is_file(): shutil.copy(R / "audio" / b["file"], AOUT / f"bgm/{k}.mp3")
used = {c.get(t) for g in ("scenes", "cg", "nodes") for c in cues.get(g, {}).values() for t in ("amb", "sfx")} | {c["sfx"] for c in cues.get("lines", [])} | {v for k, v in cues.get("events", {}).items() if not k.endswith("_vol")}
for n in sorted(x for x in used if x):
    local = R / "audio/sfx" / f"{n}.mp3"; shutil.copy(local if local.is_file() else LIB / f"{n}.mp3", AOUT / f"snd/{n}.mp3")
files = sorted(str(p.relative_to(AOUT)) for p in AOUT.rglob("*.mp3"))
src = src.replace("/*__AUDIO__*/{ cues: {}, files: [] }", json.dumps({"cues": {k: v for k, v in cues.items() if not k.startswith("_")}, "files": files}, ensure_ascii=False))
(R / "web").mkdir(exist_ok=True)
(R / "web/index.html").write_text(src, "utf-8")
print(f"web/index.html · {len(camp['nodes'])} scenes · {len(art)} pictures · {len(files)} sounds")

#!/usr/bin/env python3
"""把 Codex 发在 GitHub Release「ashen-crown-art-2026-11-10」里的图，按灯火线试样的名字收进两版画风。
用法：先把 Release 的 zip 解压到一个目录（每个 zip 一个子目录，名字同 zip），再
  python3 game/ashen/art/import_release.py <解压目录>
出处写进 art/sources.json（画风、名字 → 包、文件、sha256）。"""
import hashlib, json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "tools"))
from adopt import adopt

A, RL = "ashen-crown-anime", "ashen-crown-realistic"
# (画风, 包, 包里的文件, 落地名字)
MAP = [
  # 立绘：标准立绘 + 剧本里用到的表情（没画的表情，播放页用 normal）
  ("anime", A, "characters/lantern-spirit.png", "sprites/lamp/normal"),
  ("anime", A, "characters/garlan.png", "sprites/gran/normal"),
  ("anime", A, "expressions/expr-garlan-guard.png", "sprites/gran/battle"),
  ("anime", A, "expressions/expr-garlan-guard.png", "sprites/gran/serious"),
  ("anime", A, "expressions/expr-garlan-relief.png", "sprites/gran/sad"),
  ("anime", A, "characters/broken-sword.png", "sprites/sword/normal"),
  ("anime", A, "expressions/expr-broken-sword-grin.png", "sprites/sword/smile"),
  ("anime", A, "expressions/expr-broken-sword-grin.png", "sprites/sword/battle"),
  ("anime", A, "expressions/expr-broken-sword-somber.png", "sprites/sword/sad"),
  ("anime", A, "characters/evelyn.png", "sprites/evelyn/normal"),
  ("anime", A, "expressions/expr-evelyn-command.png", "sprites/evelyn/serious"),
  ("anime", A, "characters/august.png", "sprites/august/normal"),
  ("anime", A, "characters/bai-qiu.png", "sprites/baiqiu/normal"),
  ("anime", A, "expressions/expr-bai-qiu-smile.png", "sprites/baiqiu/smile"),
  ("anime", A, "expressions/expr-bai-qiu-suspicion.png", "sprites/baiqiu/serious"),
  ("real", RL, "characters/lantern-spirit.png", "sprites/lamp/normal"),
  ("real", RL, "characters/garlan.png", "sprites/gran/normal"),
  ("real", RL, "expressions/garlan-concern.png", "sprites/gran/serious"),
  ("real", RL, "expressions/garlan-concern.png", "sprites/gran/sad"),
  ("real", RL, "expressions/garlan-grin.png", "sprites/gran/battle"),
  ("real", RL, "characters/broken-sword.png", "sprites/sword/normal"),
  ("real", RL, "expressions/broken-sword-smile.png", "sprites/sword/smile"),
  ("real", RL, "expressions/broken-sword-smile.png", "sprites/sword/battle"),
  ("real", RL, "expressions/broken-sword-somber.png", "sprites/sword/sad"),
  ("real", RL, "characters/evelyn.png", "sprites/evelyn/normal"),
  ("real", RL, "characters/august.png", "sprites/august/normal"),
  ("real", RL, "characters/bai-qiu.png", "sprites/baiqiu/normal"),
  ("real", RL, "expressions/bai-qiu-smile.png", "sprites/baiqiu/smile"),
  ("real", RL, "expressions/bai-qiu-suspicion.png", "sprites/baiqiu/serious"),
  # 背景（缺的那版播放页会借另一版）
  ("anime", A, "backgrounds/bg-repair-rain.png", "bg/shop_rain"),
  ("anime", A, "backgrounds/bg-repair-rain.png", "bg/shop_night"),
  ("anime", A, "backgrounds/bg-repair-sun.png", "bg/shop_day"),
  ("anime", A, "backgrounds/bg-anchor-bar.png", "bg/bar"),
  ("anime", A, "backgrounds/bg-penthouse-dawn.png", "bg/eiche_top"),
  ("anime", A, "backgrounds/bg-ferris-yard.png", "bg/ferris"),
  ("anime", A, "backgrounds/bg-ferris-yard.png", "bg/park_gate"),
  ("anime", A, "backgrounds/bg-lighthouse-view.png", "bg/lighthouse"),
  ("anime", A, "backgrounds/bg-tea-room.png", "bg/teahouse"),
  ("real", RL, "backgrounds/clocktower-room.png", "bg/clocktower"),
  ("real", RL, "backgrounds/repair-night-empty.png", "bg/shop_rain"),
  ("real", RL, "backgrounds/repair-night-empty.png", "bg/shop_night"),
  ("real", RL, "backgrounds/repair-day.png", "bg/shop_day"),
  ("real", RL, "backgrounds/family-attic.png", "bg/oldhouse"),
  ("real", RL, "backgrounds/ancestral-cellar.png", "bg/basement"),
  ("real", RL, "backgrounds/anchor-bar.png", "bg/bar"),
  ("real", RL, "backgrounds/funfair.png", "bg/park_gate"),
  ("real", RL, "backgrounds/funfair.png", "bg/ferris"),
  ("real", RL, "backgrounds/lighthouse-attic.png", "bg/lighthouse"),
  ("real", RL, "backgrounds/tea-room.png", "bg/teahouse"),
  ("real", RL, "backgrounds/old-town.png", "bg/harbor_street"),
  # CG（不跨画风）
  ("anime", A, "keyart/cover-wide.png", "cg/title"),
  ("anime", A, "backgrounds/bg-lantern-memory.png", "cg/cg_lamp_lit"),
  ("anime", A, "battles/01-ferris-wheel/01-approach.png", "cg/cg_f_approach"),
  ("anime", A, "battles/01-ferris-wheel/02-bench.png", "cg/cg_f_bench"),
  ("anime", A, "battles/01-ferris-wheel/03-summon.png", "cg/cg_f_summon"),
  ("anime", A, "battles/01-ferris-wheel/05-repair-rails.png", "cg/cg_f_rails"),
  ("anime", A, "battles/01-ferris-wheel/06-lighthouse.png", "cg/cg_lighthouse"),
  ("anime", A, "battles/01-ferris-wheel/07-wheel-collapse.png", "cg/cg_cut"),
  ("anime", A, "battles/01-ferris-wheel/08-restore-price.png", "cg/cg_restore"),
  ("real", RL, "keyart/harbor-title-wide.png", "cg/title"),
  ("real", RL, "events/lantern-cleaning.png", "cg/cg_mend_lamp"),
  ("real", RL, "events/lantern-memory-space.png", "cg/cg_lamp_lit"),
  ("real", RL, "events/old-seam.png", "cg/cg_bar_pov"),
  ("real", RL, "events/ferris-repair.png", "cg/cg_restore"),
  ("real", RL, "events/ferris-afterglow.png", "cg/cg_wheel"),
  ("real", RL, "events/registry.png", "cg/cg_register"),
  ("real", RL, "events/teahouse-bai-qiu.png", "cg/cg_scales"),
]

if __name__ == "__main__":
    if len(sys.argv) != 2: sys.exit(__doc__)
    root = pathlib.Path(sys.argv[1]); src = {}
    for style, pack, f, name in MAP:
        p = root / pack / f
        adopt(style, str(p), name)
        src[f"{style}/{name}"] = {"pack": pack + ".zip", "file": f, "sha256": hashlib.sha256(p.read_bytes()).hexdigest()}
    out = pathlib.Path(__file__).resolve().parent / "sources.json"
    out.write_text(json.dumps({"release": "ashen-crown-art-2026-11-10", "images": src}, ensure_ascii=False, indent=1) + "\n", "utf-8")
    print(len(src), "images ->", out)

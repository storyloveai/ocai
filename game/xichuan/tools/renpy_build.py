#!/usr/bin/env python3
"""一条命令做出 Ren'Py 网页版小样（决策记录 v0.24）。
用法：python3 tools/renpy_build.py <Ren'Py SDK 目录> <输出目录> [--chapters p,c1]
  SDK：https://www.renpy.org/latest.html 的 sdk.tar.bz2，再把同版本的 web.zip 解压进 SDK 目录。
步骤：用 SDK 的模板新建工程（简体中文界面，自带思源黑体）→ 放进 renpy_export.py 生成的剧本和图 → 标题画面换成我们的 → lint → 构建网页版。"""
import pathlib, shutil, subprocess, sys

R = pathlib.Path(__file__).resolve().parents[1]
sdk, dest = pathlib.Path(sys.argv[1]).resolve(), pathlib.Path(sys.argv[2]).resolve()
chapters = sys.argv[sys.argv.index("--chapters") + 1] if "--chapters" in sys.argv else "p,c1"
proj = R / "renpy/project"
run = lambda *a: subprocess.run([str(sdk / "renpy.sh"), *map(str, a)], check=True, capture_output=True, text=True, cwd=sdk).stdout

subprocess.run([sys.executable, str(R / "tools/renpy_export.py"), "--chapters", chapters], check=True)
if proj.exists(): shutil.rmtree(proj)
shutil.copytree(sdk / "gui", proj, ignore=shutil.ignore_patterns("cache"))
run(sdk / "launcher", "generate_gui", proj, "--width", 1920, "--height", 1080, "--accent", "#ff9db8", "--boring", "#1b1a2e", "--language", "schinese", "--start")
(proj / "game/script.rpy").unlink()
shutil.copytree(R / "renpy/game", proj / "game", dirs_exist_ok=True)
gui = proj / "game/gui.rpy"
s = gui.read_text("utf-8")
s = s.replace('define gui.main_menu_background = "gui/main_menu.png"', 'define gui.main_menu_background = "images/cg title.webp"')
s = s.replace('define gui.game_menu_background = "gui/game_menu.png"', 'define gui.game_menu_background = "images/cg title.webp"')
gui.write_text(s, "utf-8")
for p in proj.glob("game/*.bak"): p.unlink()
lint = run(proj, "lint")
if "error" in lint.lower().split("statistics")[0]: print(lint); sys.exit(1)
if dest.exists(): shutil.rmtree(dest)
run(sdk / "launcher", "web_build", proj, "--destination", dest)
for p in ("index.html.symbols",): (dest / p).unlink(missing_ok=True)      # 调试符号，网页用不到
print("Ren'Py 网页版 →", dest, f"{sum(f.stat().st_size for f in dest.rglob('*') if f.is_file()) / 1e6:.0f} MB")

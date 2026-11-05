# WebGAL 小样（给 Codex）

目的：把《汐川》的序章和第一章放进成熟的开源 galgame 引擎 WebGAL，和现在自己写的播放页比“手感”。用户在手机上对比后决定要不要整体换引擎。

WebGAL：https://github.com/OpenWebGAL/WebGAL ，MPL-2.0，可商用（只改引擎代码时要公开改动的文件；我们只放游戏内容、不改引擎，不受影响）。

## 步骤

1. 生成游戏包（不需要装任何东西）：
   ```
   cd game/xichuan && python3 tools/webgal_export.py      # → game/xichuan/webgal/game/（剧本 + 背景 + 立绘 + CG + config）
   ```
2. 构建 WebGAL 引擎（需要联网装依赖）：
   ```
   git clone --depth 1 https://github.com/OpenWebGAL/WebGAL /tmp/webgal && cd /tmp/webgal
   yarn install && yarn parser:build && cd packages/webgal && yarn build    # 产物在 packages/webgal/dist/
   ```
3. 换上我们的游戏：用第 1 步的 `game/xichuan/webgal/game/` 整个替换 `dist/game/`。
4. 放到网站上做预览：复制 `dist/` 到 `ooc-replica/dist/assets/xichuan-webgal/`（不要放进 `game:sync`，这只是小样），以 `main` 为 base 开 PR，标题写“WebGAL 小样”，等用户看预览。
5. 自测：电脑和手机（竖屏、横屏）各打开一次 `/assets/xichuan-webgal/index.html`，确认标题图、背景、立绘表情、CG、选项、存读档、回想都正常；截图贴在 PR 里。

## 已知限制（小样）
- 只有序章和第一章；自由对话（AI）、决裂、2.5D 立体、背景音乐这些都还没接。
- 选项后的好感用 WebGAL 变量算，支线按条件全部列出（不是引擎的“挑三个”）。
- 转换器只写剧本，不改 WebGAL 引擎。

## Ren'Py 对比小样（剧本已经转好）
1. `python3 game/xichuan/tools/renpy_export.py`：生成 `game/xichuan/renpy/game/`，里面有 `script.rpy`（序章 + 第一章，含条件、选项、数值、支线）、`xichuan_options.rpy` 和 `images/`（背景、CG、立绘，按 Ren'Py 的文件名规则命名，自动定义图片）。
2. 下载 Ren'Py SDK 8.x（https://www.renpy.org/latest.html），启动器里新建工程 `xichuan`（语言选简体中文），把第 1 步生成的 `game/` 下的文件全部覆盖拷进新工程的 `game/`。
3. 放一个中文字体：`game/fonts/NotoSansSC-Regular.ttf`（Noto Sans SC，SIL OFL 开源；从 Google Fonts 下载）。
4. 启动器里先“启动工程”在桌面上点一遍，有报错把错误信息贴回给 Claude。
5. 启动器里“Web（测试版）”构建网页版，把输出目录整个放到 `ooc-replica/dist/assets/xichuan-renpy/`，和 WebGAL 小样放进同一个 PR。手机上也打开试一下（第一次加载会比较慢，Ren'Py 网页版要下载整个引擎）。

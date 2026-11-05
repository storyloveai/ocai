# 汐川 WebGAL 小样 · 2026-11-05

目的：同一份汐川序章、第一章在原播放页与 WebGAL 中比较阅读、演出、存档和触屏手感。入口 `/assets/xichuan-webgal/index.html`，原播放页仍为 `/assets/xichuan/index.html`。main 为 base，仅加入独立静态目录、导出/打包工具与本记录，不导入实验分支的 AI、2.5D、BGM 或剧本改动。

## 固定输入与复现

- 网站基线：main `181c4d7f8bd0fe3049bf663464fe0ec2662d90d0`。
- 剧本与已采用图片：`claude/webgal-spike` 的 `29cda81c0be07fe49b179cd0ccc0333e0443438b`，只读输入。与初测的 `fc55000` 剧本 JSON 相同，更新后补齐第四批 CG，雨伞分支已重新实测。
- 引擎：上游 [WebGAL 4.6.6](https://github.com/OpenWebGAL/WebGAL/tree/15173bc21339a65da34b78463fca8a304e4d503a)，commit `15173bc21339a65da34b78463fca8a304e4d503a`，引擎源代码未修改。保留默认 UI、字体、音效与 MPL-2.0 许可证；移除默认演示故事，使用独立 Game_key，存档不与原播放页共享。
- 构建环境：Node 22.16.0、Yarn 1.22.22、Python 3.9。发布目录约 51.3 MiB，其中三套引擎字体约 36 MiB；网页按需请求资源，不等于首次必须下载整个目录。
- `SOURCE.json` 记录输入提交、剧本 SHA256、引擎提交。预构建静态产物已提交，网站的常规构建无需再联网构建引擎。

在仓库根目录，准备独立的输入和引擎目录：

```sh
git fetch origin claude/webgal-spike
git worktree add --detach /tmp/xichuan-webgal-input 29cda81c0be07fe49b179cd0ccc0333e0443438b
git clone https://github.com/OpenWebGAL/WebGAL /tmp/xichuan-webgal-engine
git -C /tmp/xichuan-webgal-engine checkout 15173bc21339a65da34b78463fca8a304e4d503a
(cd /tmp/xichuan-webgal-engine && yarn install --frozen-lockfile && yarn parser:build && yarn webgal:build)
python3 game/xichuan/tools/package_webgal_spike.py --engine-root /tmp/xichuan-webgal-engine --source-root /tmp/xichuan-webgal-input/game/xichuan
python3 -m unittest discover -s game/xichuan/tools -p test_webgal_export.py
python3 -m http.server 8765 --directory ooc-replica/dist
```

浏览 `http://127.0.0.1:8765/assets/xichuan-webgal/index.html`。不要 `file://` 打开；`game:sync` 不管理此小样目录。

## 转换修正

- 同时有显示条件与可选条件时输出 `(show)[enable]->文字:标签`，避免重复箭头使 WebGAL 丢失跳转。
- 条件 CG 清除三个人物槽位时也带条件，未命中时不会误清立绘。
- 旗标按源 `init` 初始化；未知章节在清理输出前报错。
- 加入默认主题、空动画表与本游戏身份信息，保留引擎启动所需资源。
- 4 个场景文件、23 个实际引用图片的路径及全部跳转已静态核对，无缺图或悬空跳转。完整目录保留输入快照的其他图片，但未解锁 CG 不会自动出现。

## 验收结果

桌面测试使用本机 Google Chrome；手机测试为同一浏览器的 Android 触屏/UA/viewport 模拟，**不等于实体手机测试**。真实 iPhone/Safari、安卓设备的内存、首载网络和手感仍需要用户在 Preview 上验证。

| 检查 | 结果 | 截图 |
|---|---|---|
| 桌面 1440×900 标题与自定义标题背景 | 通过 | [标题](webgal-spike/desktop-title.png) |
| 序章背景、知遥的表情切换、三个选项 | 通过 | [序章选项](webgal-spike/desktop-choices.png) |
| 跨章、第一章条件选项 | 通过 | [第一章](webgal-spike/desktop-chapter1.png) |
| 三条支线、沈澄和季白立绘 | 通过；咖啡馆已完整走到结束，另两条走到各自选项，雨伞 CG 已播放 | [沈澄](webgal-spike/desktop-shencheng.png)、[季白](webgal-spike/desktop-jibai.png)、[雨伞 CG](webgal-spike/desktop-umbrella-cg.png) |
| 存档缩略图、读档恢复画面及选项 | 通过；保存序章选项，选第二项并继续后读回，原三个选项恢复 | [存档](webgal-spike/desktop-save.png) |
| 回想中有已读台词、可返回演出 | 通过 | [回想](webgal-spike/desktop-backlog.png) |
| 序章 CG 解锁、鉴赏缩略图及打开大图 | 通过 | [鉴赏](webgal-spike/desktop-gallery.png)、[CG 大图](webgal-spike/desktop-cg.png) |
| 手机竖屏 390×844：标题、选项、触屏存读档 | 通过；引擎自动旋转成横向游戏画面 | [标题](webgal-spike/mobile-portrait-title.png)、[选项](webgal-spike/mobile-portrait-choices.png)、[存档](webgal-spike/mobile-portrait-save.png) |
| 手机横屏 844×390：跨章、选项、回想 | 通过 | [第一章](webgal-spike/mobile-landscape-chapter1.png)、[回想](webgal-spike/mobile-landscape-backlog.png) |

[静态检查结果](webgal-spike/static-results.json)、[手机模拟错误记录](webgal-spike/mobile-results.json)。浏览器未捕获到 JS 运行异常；只有上游主动尝试加载两个未附带的可选 Live2D SDK 的 404。本小样使用静态立绘，不需要 Live2D SDK，未添加其他 SDK。测试浏览器启用软件 WebGL 渲染。

快捷键：Esc 是 WebGAL 的“老板键”，会出现伪装搜索页，再按 Esc 恢复。回想通过左上角叉号返回，存读档页通过“返回”退出。

## 仓库回归

- `python3 content/campaign.py`、`python3 tools/build.py`：三国生成文件无漂移；卷一至八各 5,000 次模拟均 PASS，`art_audit.py --strict` PASS。
- 汐川 `content/story.py`、`tools/build.py`、3,000 次模拟均 PASS；生成文件无漂移。
- `npm run game:sync` 已执行；仅产生无内容变化的来源提交号更新，未纳入此小样。
- 网站 `npm run build` PASS，`npm run check` 185/185 PASS。没有 `npm test` 脚本，仓库统一检查入口为 `check`。测试使用本机模拟服务，不调用付费模型。
- 导出条件回归测试 PASS：组合显示/可选条件、true 初始旗标、条件 CG 清场/解锁、未知章节保留已有输出。
- 网站构建会顺带刷新七份原本过期的三国 server campaign 图名副本；这类与本小样无关的构建副作用已还原，未改三国内容或生成规则。

## 范围与对比结论

只有中文序章和第一章，剧情、条件与好感效果转换为 WebGAL 指令；结束后回标题。AI 自由对话、决裂、2.5D、背景音乐和后续章节不在小样范围；选项支线按条件全部列出。没有迁移原播放页存档，也没有全站换引擎。

WebGAL 的横向画面、表情/CG、存读档、回想和鉴赏已经能用于比较；竖屏体验是旋转横屏，不是竖排阅读，底部工具栏在手机上偏小，需用户真机判断。小样没有做移动网速首载性能承诺。

Ren’Py 由 Claude 在 [#130](https://github.com/storyloveai/ocai/pull/130) 提供；最新决策记录 v0.26 明确记载：模拟 iPhone 可运行，但用户真机打不开，决定不再投入 Ren’Py、等待 WebGAL。本 PR 按最新交接只交付 WebGAL，不重复构建或引入 Ren’Py 目录。

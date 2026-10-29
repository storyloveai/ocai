# 三国网站接入验收（2026-10-29）

## 结果

- 主干网站基线：`24cde5d07fd16bb20f516deb52815b46002cbb07`（目前同步的是六卷）。
- 八卷兼容验证内容：`claude/art-adopt-4`，`6f359c96d3dd717dc74fbf4fd9ca43838edca364`，独立只读工作树构建；测试使用本 PR 的网站入口，不把内容分支合进本 PR。
- 修复：`?edition=classic&lang=en` 或全站语言为 EN 时，经典三章继承英文。此前网站只写 `campaign.settings`，经典版实际读取 `settings`，因此仍是中文。现在写入当前版本自己的设置，保留另一版设置和进度。
- 修复前，同一套新增回归中 15 项通过、两项经典版语言检查失败；修复后全部通过。

## 验证

| 检查 | 结果 | 范围 |
|---|---|---|
| `npm run build` | PASS | 主干网站构建；未运行 `build.py` 或 `game:sync` |
| `npm run check` | 151/151 PASS | 原有 134 项 + 新增 17 项 |
| 同一测试套件对八卷独立构建运行 | 21/21 PASS | 各卷入口续玩、刷新、插画/水墨共享进度；七次跨卷继承；旧单存档迁移；来源验证；账号切换后的迟到写入 |
| Chromium 实际网站 | 22/22 PASS | 1440×900、390×844；经典英文 URL/全站继承；首页选择→刷新→点击水墨入口；八卷分别续玩并检查游戏页面横向溢出 |
| 浏览器脚本异常 / 本轮访问资源 404 | 0 / 0 | 见 `browser-results.json`；不是全书全部插画的路径扫描 |

新增 Node 测试通过网站入口创建 iframe，运行构建后的游戏脚本，双向投递真实协议消息，再检查账号存储中的进度。跨卷测试从引擎固定模拟得到的合法结局点击“继续下一卷”，检查继承数据、原存档和下一卷存档点。

### 复现自动化检查

在网站目录安装依赖后：

```sh
npm ci
npm run build
npm run check
```

八卷兼容检查：另建 `6f359c96d3dd717dc74fbf4fd9ca43838edca364` 的工作树，在它的 `ooc-replica/` 内安装依赖并 `npm run build`；然后回本 PR 的网站目录运行（替换路径）：

```sh
SANGUO_ACCEPTANCE_ROOT=/absolute/path/to/eight-volume-checkout/ooc-replica \
  node --test tests/sanguo-site-acceptance.test.mjs
```

环境变量只选择测试内容的读取目录，不会修改或同步它的生成文件。

### 浏览器检查方法

本地仅把 `/api/config` 设为 `configured:false, auth:null`；所有游戏回复使用已写好的离线逻辑，未调用收费模型。八卷服务器提供独立内容工作树的静态构建，网站入口 JS 使用本 PR 修复后的文件。

1. 打开 `/play/three-kingdoms?edition=classic&lang=en`，检查游戏标题和页面语言为英文。
2. 全站选 EN，再打开 `/play/three-kingdoms?edition=classic`，检查同样继承英文。
3. 新存档打开 `/play/three-kingdoms?choice=cover`，等旁支选择出现，刷新后继续，再点击水墨版，确认同一局和选择记录保留。
4. 分别注入各卷合法开局存档，点击“继续上次”，检查正文、当前局编号、游戏横向滚动宽度；电脑和手机各做一次。

截图：[经典版电脑](classic-en-desktop.png)、[经典版手机](classic-en-mobile.png)、[卷八电脑](volume-eight-desktop.png)、[卷八手机](volume-eight-mobile.png)。

## 边界和后续

- 本 PR 基于主干，预览包含主干已有六卷；八卷兼容结果来自上述独立内容构建。尚未把八卷或待采用插画发布到生产环境。
- 没有改剧情、规则、引擎、作图清单、正式插画、任何同步生成文件，也没有改 Claude 在 PR #73 / #75 修改的接入、API 和构建文件。
- 各卷只验证合法入口和一条固定模拟结局路径；不代表穷尽所有剧情分支。
- 账号隔离用模拟 Firebase 客户端测试；真实 Firebase 登录、跨设备云同步、线上 AI 和付费链路仍需各自的预览环境验收。
- #67 按卷加载仍待处理，涉及 Claude 当前 PR #73 正在修改的构建、适配器和游戏页面，本轮不同时改这些文件。
- GitHub issue/PR API 仍 403。未创建 issue、未发布认领、未创建 PR；相关文字保存在本目录。拿到 issue 编号后，PR 说明须加实际的 `Closes #编号`，不能用虚构编号。
- 停在分支和预览，不合并、不上线。

## 交付状态

- 代码和本报告已推送 `codex/sanguo-qa`；修复提交 `414bff3e90eb7f4df5a3d0fcd561b53eb7e2d803`，远端分支已核对。
- 自动创建草稿 PR 同样返回 `Post "https://api.github.com/graphql": Forbidden`。可按本目录 issue / claim / PR 草稿由有 API 权限的助手代建，并补真实 issue 编号。
- [查看分支差异](https://github.com/storyloveai/ocai/compare/main...codex/sanguo-qa)、[创建 PR 的入口](https://github.com/storyloveai/ocai/pull/new/codex/sanguo-qa)。这些是 GitHub 页面，不是已创建的 PR。
- 当前网络访问 Vercel 候选预览域名返回 `Tunnel connection failed: 403 Forbidden`，GitHub 提交页面也未提供部署链接。因此未确认 Vercel 构建状态，没有把推测 URL 当成可用预览交付。

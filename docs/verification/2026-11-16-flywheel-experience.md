# 角色发现体验收敛验收

2026-11-16，Codex，任务 [#154](https://github.com/storyloveai/ocai/issues/154)，PR [#155](https://github.com/storyloveai/ocai/pull/155)。用户在评审后授权直接删减功能、重做按钮与颜色。当前记录取代初版“大量栏目与模拟工作台”的验收说明；旧实现不再作为交付能力。

## 实际变更

- 首页只有一个角色发现主 CTA，四部作品的角色行直接打开 `/characters?world=…`；不再新增四个全站侧栏入口。
- 角色目录保留搜索、筛选、真实入口；档案将人物详细设定默认折叠，提示剧透。32 条原作节选出处全部双语，四条引文/出处及三国世界介绍已依据原文校正。三张故事封面明确标注为非定稿立绘。
- 世界介绍作为可选内容；玩法页只解释实际作品，不再给出虚构关系数值或结局。页面没有老板语录、食材/锅等内部比方。
- 删除三步建卡、模拟授权、模板拼角色、重复编辑器；`/studio` 复用真实 `/builder`。旧草稿只读保留导出，损坏/拒读有明确提示，不改原始存储。
- 白主按钮、深色描边次按钮、8px 圆角、至少 44px 触区；减少金填充、渐变、边框和动画。标题区缩小，手机先显示人物介绍/主 CTA，再显示立绘。表情不压缩，可横滑。

## 自动化验证

`npm run build`、`npm run check`：196/196 通过，含 8 个角色发现检查（2 个顶层测试、6 个交互子用例）。`git diff --check` 通过。

覆盖：33 张卡/真实资源/聊天白名单、全部引文出处双语、搜索只更新结果并保焦点、中英文搜索、表情切换、真实独立游戏 `target="_top"`、折叠剧透、页签 ARIA 与方向键/Home/End、无重复侧栏/模拟演示、旧草稿 JSON 导出完整相等、损坏 JSON 和存储拒读不覆盖数据。

## 真浏览器检查

本地 `http://127.0.0.1:3016`，Chrome；桌面 1366×900、手机 390×844，中英双语。没有调用模型、计费或改变真实账户。

| 路径/交互 | 观察结果 |
| --- | --- |
| 首页 → 汐川角色行 | URL 为 `/characters?world=xichuan`，筛选命中 5 人；首页仍保留原书库和首屏，底部只有一个主 CTA |
| 搜索“夏知遥”及语言切换 | 输入焦点保留，英文下可搜中文名字；切换语言保留查询，结果仍为 1 人；清空恢复 |
| 汐川 + 可聊天 | 无结果时正确显示空态，没有伪造夏知遥聊天入口 |
| 档案与表情 | 害羞表情可切换，语言切换后仍选中 Shy；英文出处不混中文；侧栏不再残留 Home 选中 |
| 按钮/手机 | 主按钮计算样式 `rgb(250,250,250)` / `rgb(23,23,23)` / 8px / 44px；六个表情各宽 44px；手机主 CTA 在首屏；无页面横向溢出 |
| 维斯特林页签 | 一次只显示一个面板；Timeline → Home 回 Background；切换语言保留时间线选择；手机无横向溢出 |
| 玩法说明 | 四种说明与实际作品链接存在；无旧老板语录/锅对照/数字演示 |
| `/studio` → 创作工坊 | 点击后进入既有“Create a Title”，显示 Story / Character 选择；不创建第二套编辑器 |
| 旧演示草稿 | 本机上轮评审的 2 条草稿仍可见、可展开导出；本轮没有新增、删除或改写它们 |

## 截图

截图均为本轮实际浏览器，保存在 [assets/flywheel-simplified-20261116](assets/flywheel-simplified-20261116/)。

- 桌面：[中文角色库](assets/flywheel-simplified-20261116/desktop-zh-library.jpg)、[中文档案](assets/flywheel-simplified-20261116/desktop-zh-profile.jpg)、[英文档案](assets/flywheel-simplified-20261116/desktop-en-profile.jpg)、[世界页签](assets/flywheel-simplified-20261116/desktop-en-world.jpg)、[玩法](assets/flywheel-simplified-20261116/desktop-en-formats.jpg)、[创作入口](assets/flywheel-simplified-20261116/desktop-en-create.jpg)、[首页动线](assets/flywheel-simplified-20261116/desktop-en-home-strip.jpg)。
- 手机：[中文角色库](assets/flywheel-simplified-20261116/mobile-zh-library.jpg)、[英文角色库](assets/flywheel-simplified-20261116/mobile-en-library.jpg)、[中文档案](assets/flywheel-simplified-20261116/mobile-zh-profile.jpg)、[英文档案](assets/flywheel-simplified-20261116/mobile-en-profile.jpg)、[世界页签](assets/flywheel-simplified-20261116/mobile-zh-world.jpg)、[玩法](assets/flywheel-simplified-20261116/mobile-zh-formats.jpg)、[旧草稿](assets/flywheel-simplified-20261116/mobile-zh-create.jpg)。

## 保留边界

未合并、未推 main；未改 `game/`、#149/#151、账户或计费代码，无密钥/付费操作。`app.js` 仅补 flywheel 的账户重绘回调；不代表与两个在途 PR 没有合并冲突。

汐川等独立游戏尚未接通账号后的回聊记忆和积分，档案明确提示；#149/#151 合并前须做专门集成验收。本轮浏览器检查不等于真实账号/支付验收。工作台旧数据不自动迁移到正式工坊，只提供完整备份。

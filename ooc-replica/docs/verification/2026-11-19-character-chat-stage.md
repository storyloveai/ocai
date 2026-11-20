# 第六轮验收 · 角色聊天室

[本轮规格](https://github.com/storyloveai/ocai/issues/156#issuecomment-7000695846) · [PR #157](https://github.com/storyloveai/ocai/pull/157) · [沈澄 Preview](https://storydate-zhou-git-codex-character-l-940c20-zhou-zeyas-projects.vercel.app/play/xc-shencheng) · [季白 Preview](https://storydate-zhou-git-codex-character-l-940c20-zhou-zeyas-projects.vercel.app/play/xc-jibai) · [曹操 Preview](https://storydate-zhou-git-codex-character-l-940c20-zhou-zeyas-projects.vercel.app/play/sgc-002)

截图共 36 张。首页与三位角色舞台的 16 张，以及手机英文「已记住」的 1 张，取自代码提交 `5b9b4a8` 的[固定 Vercel Preview](https://storydate-zhou-86jo7hgv5-zhou-zeyas-projects.vercel.app/play/xc-shencheng)。另 19 张操作截图取自同一提交的本机演示环境。截图按原始视口保存。

## 舞台与首页

| 视口与语言 | 首页 | 沈澄 · 海边咖啡馆 | 季白 · 放映室 | 曹操 · 纯立绘 |
| --- | --- | --- | --- | --- |
| 1366×900 中文 | [侧栏](2026-11-19-chat-stage/desktop-zh-home.jpg) | [舞台与开场](2026-11-19-chat-stage/desktop-zh-shencheng-stage.jpg) | [舞台与开场](2026-11-19-chat-stage/desktop-zh-jibai-stage.jpg) | [舞台与开场](2026-11-19-chat-stage/desktop-zh-cao-stage.jpg) |
| 1366×900 English | [侧栏](2026-11-19-chat-stage/desktop-en-home.jpg) | [舞台与开场](2026-11-19-chat-stage/desktop-en-shencheng-stage.jpg) | [舞台与开场](2026-11-19-chat-stage/desktop-en-jibai-stage.jpg) | [舞台与开场](2026-11-19-chat-stage/desktop-en-cao-stage.jpg) |
| 390×844 中文 | [手机导航与语言](2026-11-19-chat-stage/mobile-zh-home.jpg) | [舞台与开场](2026-11-19-chat-stage/mobile-zh-shencheng-stage.jpg) | [舞台与开场](2026-11-19-chat-stage/mobile-zh-jibai-stage.jpg) | [舞台与开场](2026-11-19-chat-stage/mobile-zh-cao-stage.jpg) |
| 390×844 English | [手机导航与语言](2026-11-19-chat-stage/mobile-en-home.jpg) | [舞台与开场](2026-11-19-chat-stage/mobile-en-shencheng-stage.jpg) | [舞台与开场](2026-11-19-chat-stage/mobile-en-jibai-stage.jpg) | [舞台与开场](2026-11-19-chat-stage/mobile-en-cao-stage.jpg) |

## 消息操作与建议回复

| 视口与语言 | 建议回复 | 默认对话 | AI 消息操作 | 用户消息操作 | 已记住 |
| --- | --- | --- | --- | --- | --- |
| 1366×900 中文 | [建议](2026-11-19-chat-stage/desktop-zh-starters.jpg) | [默认](2026-11-19-chat-stage/desktop-zh-conversation.jpg) | [五项操作](2026-11-19-chat-stage/desktop-zh-actions.jpg) | [两项操作](2026-11-19-chat-stage/desktop-zh-user-actions.jpg) | [常驻徽章](2026-11-19-chat-stage/desktop-zh-remembered.jpg) |
| 1366×900 English | [建议](2026-11-19-chat-stage/desktop-en-starters.jpg) | [默认](2026-11-19-chat-stage/desktop-en-conversation.jpg) | [五项操作](2026-11-19-chat-stage/desktop-en-actions.jpg) | [两项操作](2026-11-19-chat-stage/desktop-en-user-actions.jpg) | [常驻徽章](2026-11-19-chat-stage/desktop-en-remembered.jpg) |
| 390×844 中文 | [建议](2026-11-19-chat-stage/mobile-zh-starters.jpg) | [默认](2026-11-19-chat-stage/mobile-zh-conversation.jpg) | [五项操作](2026-11-19-chat-stage/mobile-zh-actions.jpg) | [两项操作](2026-11-19-chat-stage/mobile-zh-user-actions.jpg) | [常驻徽章](2026-11-19-chat-stage/mobile-zh-remembered.jpg) |
| 390×844 English | [建议](2026-11-19-chat-stage/mobile-en-starters.jpg) | [默认](2026-11-19-chat-stage/mobile-en-conversation.jpg) | [五项操作](2026-11-19-chat-stage/mobile-en-actions.jpg) | [两项操作](2026-11-19-chat-stage/mobile-en-user-actions.jpg) | [常驻徽章](2026-11-19-chat-stage/mobile-en-remembered.jpg) |

## 工程检查

第六轮将 15 位可聊天角色的 30 个中英文入口加入舞台回归。构建、网站全量 394 项测试、22 份 CSS 解析及游戏副本一致性检查全部通过。三位 StoryDate 原创角色只有聊天相遇，眉标标明「原创相遇」。有关联作品的角色可以从头图眉标进入对应故事页。

## 验证方法

在该分支的本机隔离 Chrome 中，四组新访客分别从首页切换语言，打开曹操、季白、沈澄的聊天页，再从沈澄进入剧情、实际开始序章并返回聊天。本机手机尺寸组使用触屏输入。四组本机演示均无模型或计费 POST 请求、无页面脚本错误。

- 三位角色的舞台内都只有一张人物图片，且是第一张图。沈澄和季白分别叠加咖啡馆和放映室场景。曹操只使用人物原图。桌面链接指向角色所属故事，手机眉标收短。出现过真实消息后再看沈澄聊天，开场对白没有重复插入。
- 桌面消息流、沈澄的故事栏、舞台和输入坞实测均宽 740px。手机四者均从 x=12 开始，宽 366px。手机开启三条建议后，宽度仍为 366px，建议在同一行水平滚动。另测英文新会话在尚无剧情存档、记住一条消息时的故事栏，进度文字先收短，Recap 和 Memories · 1 保持同行且完整可读。四组均实际编辑了一条建议后发送，又直接点另一条建议发送，消息文字与按钮上的内容一致。
- 新消息默认收起操作条。桌面悬停或逐键 Tab 即可访问。手机实点已展开消息、另一条消息和输入区验证切换及收起。AI 和用户消息分别可操作五项和两项，显隐前后同一消息高度相同。双方各记住一条原话后，工具条收起仍显示徽章，重载后可继续查看记事和回顾。
- 四组分别检查了顶栏按钮的显示宽度和文本实际宽度。「演示对话」和 “Demo replies” 均完整显示。另用本地模型名称样例 “Gemini Flash” 检查同一按钮，两个视口均有足够空间容纳文字。桌面两种语言均测量了侧栏语言文字、登录说明、Google 按钮的垂直位置，三者依次排列且互不遮挡。

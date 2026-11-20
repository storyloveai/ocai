# 角色页：保留原 banner，统一 Story 卡片

任务 #156 / PR #157 的用户反馈，2026-11-16。继续在 `codex/character-loop-integration-20261116` 提供预览，不合并、不关闭原 PR。

## 本轮结果

- `/characters` 复用原 `hero-scene.js` 的貂蝉原图、左侧人物特写、柔和渐变、右侧对白、推荐回复及输入框。共享 `mountHeroContent`，原 Story 首页的图片、文案、章节选择与周边布局保留。
- 下方 33 个角色沿用 Story 的 2:3 封面、8px 圆角、图下名字、16px/500 标题、13px 灰色副文及 16px 卡间距。去掉整块灰底与图中叠名，来源和“可聊天”标识在图下。卡片打开统一档案，聊天入口继续原 chatId。
- 21 张正式透明立绘配对应故事中已有的无人场景，卡片与档案使用同一映射；三国 9 人、原创 3 人保留自带环境的不透明插画。没有新增人设、改写剧情或生成新图。人物 alpha 和场景缩略图已检查，背景与表情独立分层。
- 筛选、搜索和中英切换保留 banner 尚未发送的文字。推荐回复和表单沿用原 `heroHref`，只把用户点击的回答交给既有聊天入口。

## 验证

- `npm run build` 成功；完整 `npm run check` 292/292 通过。最终能力标识文案调整后，角色目录 11 项专项再次通过；部署 CI 会复查最终提交。
- 7 组目录、路由、原 banner、夏知遥存档/账号集成专项 45/45 通过。覆盖双语、筛选、草稿保留、旧 `sgc-007` 身份、33 个目录和全部场景文件、当前分支记事与刷新恢复。
- 真实 Chrome 检查桌面 1366×900、手机 390×844，中英文无横向溢出；角色特写与输入框可用，夏知遥档案的表情切换只换前景，背景/现有消息/记事/序章进度保留。Story 首页原场景、两个章节选择和输入框仍存在。
- 本地真实应用点击貂蝉“Who is listening?”后，原聊天保存了该句，并明确报告模拟服务不可用；没有把本地 mock 视作真实模型效果。组件专项的“零 API/零存档写入”指 banner 自身只执行导航，实际聊天仍遵循既有发送、错误与计费规则。
- 没有读取/复制密钥、配置远端环境、调用付费模型、发放/消费真实积分。真实 AI、跨设备和支付边界沿用此前验收说明。

## 截图

位于 `assets/character-banner-20261116/`：

- [桌面原 banner 与目录](assets/character-banner-20261116/01-desktop-banner-and-cards.jpg)
- [手机英文 banner](assets/character-banner-20261116/02-mobile-en-banner.jpg)
- [手机英文卡片](assets/character-banner-20261116/03-mobile-en-cards.jpg)
- [夏知遥档案场景](assets/character-banner-20261116/04-desktop-profile-scene.jpg)
- [Story 首页对照](assets/character-banner-20261116/05-desktop-story-reference.jpg)
- [角色卡片细节](assets/character-banner-20261116/06-desktop-story-style-cards.jpg)

三位原创角色尚无独立场景素材，当前使用已有完整人物插画；不会把其他角色的环境冒充其正式设定。

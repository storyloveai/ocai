# 三国关系场景候选：交付验证

输入锁定 main `30e542bb410469877c0de090e7b02b7e19dfe318` 的 `game/sanguo/art/edition-jobs-relations.jsonl`。7 项各 A/B，共 14 张可选原图；1 张送草药 B 的修订初稿单独归档，不列入选择。

## 素材与边界

- 每张原始 PNG 与内置工具输出字节一致，SHA-256、实际尺寸、完整 prompt/negative_prompt、所有参考图和引用哈希在候选目录 `generation.json`。每项列出的头像全部传入，另以已采用 `scenes/v7_last.webp` 对齐画风。具体模型及 seed 未暴露，未调用外部付费图片 API。
- 原始 PNG 未裁切、缩放、修图；网页 WebP 只编码，不改变构图或尺寸。正式 1200×480 输出交由 Claude 选图后裁切。
- `v3_token`、`v4_wz_map`、`v8_jw_book` 的 composition 与无文字要求矛盾，已在 #115 记录；遵循原 prompt、negative_prompt、accept 与用户要求，无字铜牌、地图和兵书。原清单未改。
- 送草药 B 的初稿多画背景士兵，已通过内置图片编辑去除并保留初稿与修订引用记录。其他图经人工初检人物、动作、年龄、服色、玩家背影及无文字要求，仍需 Claude 逐项正式审图。
- 四类命运图清单与 #97 的输入快照逐字段一致。命运预览的 HTML/JS/CSS/manifest/WebP 直接复用 #97 对应文件、字节不变；原始 PNG 与记录保留在 #97，不重复生图、不从 #102 导入任何正式采用图。

## 实际验证

- `npm run build` 通过；`npm run check` 185 项通过。
- `node scripts/sync-game.mjs --check` 通过，仅只读检查；未运行 build.py 或 game:sync。
- 原图、参考图与预览哈希、原生尺寸、候选数量及原始 prompt/negative_prompt 保真检查通过。
- Playwright：1440×1000 和 390×844，各中英文，共 4 组。每组真实解码 14 张新场景及 8 张命运横幅；检查七组选图、刷新持久化、导出、原图链接、完整图模态框及 Escape、语言切换、无横向溢出、两批审图选择互相隔离和游戏存储不变。
- 无页面 JS 异常；无 POST / 模型 API / 游戏 API 请求。结果见 `browser-results.json`，截图为本地静态审图页面。线上部署及资源哈希检查在 PR 单独记录，不冒称已用真实玩家进行游戏测试。

候选目录：`game/sanguo/art/candidates/relations-batch9/`。审图页：`/assets/art-review/relations/index.html`，另有 `/assets/art-review/fates/index.html`。本批只交候选，未修改剧情、引擎、作者任务清单、正式图片或生成游戏页面；没有采用或合并。

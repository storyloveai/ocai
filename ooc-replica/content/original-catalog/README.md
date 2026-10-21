# 原创目录与作图任务包

这一批是 **40 个故事 + 40 个角色** 的独立原创文案，用于后续替换现有展示目录的一半以上。分类沿用网站现有分类；标题、简介、开场、人物与绘图场景重新创作，不是对原站标题换词。

- `catalog-drafts.json`：完整资料，含中英文标题、中文简介、分类、标签、开场、角色年龄/设定、固定图片路径、替换候选 ID。
- `catalog-drafts.jsonl`：每行一个完整条目，方便批量导入。
- `cover-jobs.jsonl`：每行一项作图任务，含独立英文提示词、负面提示词、比例、尺寸与 `output_filename`。没有绑定供应商，不包含 API 地址、密钥或真实调用。
- `INDEX.md`：80 条目录的快速审阅表。
- `ideas.json`：便于维护的原始文案。修改后在应用目录运行 `npm run originals:export` 重建上述文件。

## 接入作图 API 时

1. 逐行读取 `cover-jobs.jsonl`，把 `prompt`、`negative_prompt`、尺寸等映射到所选 API 的参数。
2. 使用固定的 `id` 关联结果，把图保存为 `output_filename`，不要依赖标题推断关联，也不要把 API 密钥写进清单。
3. 生成后先审图，确认人物、场景、年龄和构图与条目一致。可转成适合网页的 WebP，保留 `id` 与文件名。
4. 待图像通过审阅，再同步修改条目的 `cover.status`、`assetUrl` 与发布状态，并将图片和文案成对接入目录。
5. `replacementFor` 是未来展示位的替换候选，不是对原站条目的改名。新条目使用自己的 ID，旧用户会话保留原 ID。

当前包明确标记 `prepared_not_published` / `draft_pending_cover_review`。本轮不替换线上目录，不把待生成图标成完成，不制造播放量、评论或真人作者身份。

这些条目已写好世界/人物前提和开场，**尚未拆成《三国·谋士》同等深度的规则剧情**。后续拆书与规则引擎建设是另一项工作。

## 完整 DeepSeek 文字批次

已完成40个故事、40个角色的文字扩写。阅读 [完整目录](generated-text/INDEX.md)，机器统计见 [QUALITY.json](generated-text/QUALITY.json)，人工抽查与待审图事项见 [EDITORIAL-REVIEW.md](generated-text/EDITORIAL-REVIEW.md)。共320个图片任务仍为pending。生成方式与续跑见 [TEXT-GENERATION.md](TEXT-GENERATION.md)。

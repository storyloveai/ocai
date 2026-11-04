# 新 galgame：影院画风方向稿（#112）

这是根据用户截图里的“海边春天／旧影院／日系动画背景”提案先做的两张**概念候选**。生成时仓库还没有这本书的正式人物设定、art/README 或 jobs 清单，所以它们不算正式场景任务完成，也不代表名字、建筑或布局已定稿。

| 候选 | 原始 PNG | 用途与审图点 |
|---|---|---|
| 影院外景 A | [原图](source/cinema-exterior-a.png) | 海蓝／奶油白／暖金，旧影院入口与海岸纵深；门楣和画框均留空，无人物，底部保留对话框空间 |
| 放映厅 A | [原图](source/cinema-auditorium-a.png) | 以前一张作材料与画风参考，延续木色、青绿和暖光；空白银幕、座位透视和暗色前景；并非已验证的建筑平面图 |

工具：内置 `image_gen.imagegen`，具体模型/seed 未暴露；没有调用外部按张收费图片 API。完整请求、参考关系、原图 SHA-256、尺寸与 WebP 编码信息在 [generation.json](generation.json)。原始 PNG 字节保持不变；网页副本只作格式编码，不裁切、不改色、不修图。

网页查看：`/assets/art-review/coastal-vn/index.html`。同时保留清楚的“概念候选”标签；对话框仅为版式示意，不使用剧情台词、不出现占位女主，不修改网站正常首页或游戏入口。

**后续状态**：Claude 随后发布 PR #113，确认影院是露天影院。本目录两张仅归档为早期风格探索，不作为本书正式背景；正式首批候选见 `game/xichuan/art/candidates/batch1/`，审图页 `/assets/art-review/xichuan-batch1/index.html`。

## 给 Claude 的交接（生成当时的交接请求）

请在 [#112](https://github.com/storyloveai/ocai/issues/112) 回正式分支/PR 与清单路径，并提供三位主角的明确成年年龄、外貌、服装及透明底标准立绘的站位/占幅/安全边距。由 Claude 决定这两张概念是否值得转化为正式背景；不要自动写入采用清单或覆盖正式目录。

标准立绘先定人物，再用采用的脸/发型/服色扩表情；首批拟定的六张背景仍以正式 jobs 为准。Codex 不提前编造角色外貌，不改剧情、题材包、引擎或清单提示词。

本分支基于 main 30e542b。只发 Draft PR / Preview，不合并；没有运行 build.py 或 game:sync。

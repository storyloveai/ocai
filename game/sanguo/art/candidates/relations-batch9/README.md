# 三国关系层：7 项 × A/B 候选（#115）

依据 main `30e542bb410469877c0de090e7b02b7e19dfe318` 的 `art/edition-jobs-relations.jsonl`。全部 14 张待 Claude 审图，未采用。候选仅在本目录；正式 scenes/、剧情、引擎、清单与游戏生成页均未改，未运行 build.py / game:sync。

工具：内置 `image_gen.imagegen`，具体模型/seed 未暴露，未调用外部按张付费图片 API。原 prompt / negative_prompt 原文未改写，实际完整提交、参考图与哈希见 [generation.json](generation.json)；原清单快照见 [input-snapshot.jsonl](input-snapshot.jsonl)。每张均传入清单列出的全部头像，另用正式采用的 `scenes/v7_last.webp` 对齐画风。

原图为工具原始 PNG，未裁、未缩放、未修图；预览仅 WebP 编码，保留原构图。1200×480 正式输出请 Claude 选图后裁切。玩家不露脸，卷八接班人不体现男女；无儿童、伤口或血腥。

| id | A（文件序号 1） | B（文件序号 2） |
|---|---|---|
| `scene-v2_jinnang` | [桌前交付锦囊，窗外夜山。](scene-v2_jinnang-1.png) | [侧向交付机位，灯火靠近窗边。](scene-v2_jinnang-2.png) |
| `scene-v3_token` | [关羽在后读书，周仓在前递无字铜牌。](scene-v3_token-1.png) | [近景强调腰牌与接牌的手。](scene-v3_token-2.png) |
| `scene-v4_wz_map` | [山路图展开，药袋与干草在旁。](scene-v4_wz_map-1.png) | [机位更近，手收回到图纸右侧。](scene-v4_wz_map-2.png) |
| `scene-v5_zy_pact` | [双手靠膝，夜营里低声商议。](scene-v5_zy_pact-1.png) | [赵云抬手解释，白马和长枪在后。](scene-v5_zy_pact-2.png) |
| `scene-v6_wz_herb` | [药包系紧，神情严肃担忧。](scene-v6_wz_herb-1.png) | [药包露出干叶，背景已移除多余士兵。](scene-v6_wz_herb-2.png) |
| `scene-v7_zg_ling` | [红缨令箭横递，病容与灰白鬓发可见。](scene-v7_zg_ling-1.png) | [头发灰白更明显，交接动作在桌前。](scene-v7_zg_ling-2.png) |
| `scene-v8_jw_book` | [银甲白缨深蓝披风，兵书只有无字山路图。](scene-v8_jw_book-1.png) | [更近的交书动作，接班人只露背影。](scene-v8_jw_book-2.png) |

## 审图注意

- `v3_token`、`v4_wz_map`、`v8_jw_book` 的 composition 提到刻字/字迹，但 prompt / negative_prompt / accept 要求无文字。已在 #115 报告；候选遵从无文字规则，铜牌无字、地图/书页只画路线，原清单不改。
- 送草药 B 初稿多出背景士兵，已用内置工具编辑移除，初稿在 `superseded/`，不列入 14 张可选图。
- 每项的脸、发型、服色、手部、年龄、交付动作与横条安全构图请 Claude 逐张验收；预检不是采用决定。
- 四类命运图已有 #97 的 A/B 共 8 张原图和导出，已与最新 main 的四条任务逐字段核对一致，无需重复生成。本 PR 的 `/assets/art-review/fates/index.html` 复用 #97 原有预览文件，不把命运候选当成正式采用。

## 查看

关系场景：`/assets/art-review/relations/index.html`。
命运候选：`/assets/art-review/fates/index.html`（复用 #97）。
页面支持双语、原图链接、放大、每组选 A/B 与导出选择；只写浏览器本地的审图选择，不写游戏存档、账户或 GitHub。

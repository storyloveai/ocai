# 《汐川的第七个春天》第一批候选（#112 / 新编号交付）

按 Claude PR #113、提交 `49078fe48c9d920b2d4b472773e8cb0218f941a7` 的 `art/jobs-batch1.jsonl` 出图：**三位女主各 A–D 四张、六个背景各 A/B 两张，共 24 张待审候选**。全部未采用；没有扩表情、裁切或写入正式目录。

原始任务文件逐字节保存在 [jobs-input-snapshot.jsonl](jobs-input-snapshot.jsonl)，作者原清单未改。每次实际提交的完整 prompt、参考关系、修订原因、原始尺寸、Alpha、SHA-256 在 [generation.json](generation.json)。原 prompt / negative_prompt 原文保留；额外验收与交付说明是单独的包装段，未改写角色设定。放映室的露天影院上下文来自本书 README。

工具：内置 `image_gen.imagegen`，实际模型/seed 未暴露；无外部按张收费图片 API。原始 PNG 按工具输出字节保存；审图页立绘 WebP 无损保留 Alpha，背景只编码，不裁、不缩放、不改色或修图。

文件名按最新要求使用 `<任务 id>-<序号>.png`。A/B/C/D 分别对应 1/2/3/4；24 张原图仅改名，SHA-256 与旧 #114 完全一致。

## 人物：每人四个标准图候选

| 人物 | A | B | C | D |
|---|---|---|---|---|
| 夏知遥，21 岁 | [双手轻叠、略侧身](sprite-zhiyao-normal-1.png) | [双臂自然下垂、较正面](sprite-zhiyao-normal-2.png) | [身体转向略明显、双臂放松](sprite-zhiyao-normal-3.png) | [略侧身、手臂下垂](sprite-zhiyao-normal-4.png) |
| 沈澄，21 岁 | [双手轻叠、头部略倾](sprite-shencheng-normal-1.png) | [自然合手、侧身更轻](sprite-shencheng-normal-2.png) | [双手交叠、围裙较简洁](sprite-shencheng-normal-3.png) | [正面略侧、胸前口袋更清楚](sprite-shencheng-normal-4.png) |
| 季白，23 岁 | [双手合在身前](sprite-jibai-normal-1.png) | [一手入袋、另一手放松](sprite-jibai-normal-2.png) | [一手入袋、略转身](sprite-jibai-normal-3.png) | [双手自然下垂](sprite-jibai-normal-4.png) |

三位的头发/眼睛/服装按清单；候选之间存在脸型、细节与站姿差异，**不是已采用标准图的表情包**。请用户先各定一张，之后只围绕该标准图扩表情。脸与成年感、手部、发夹/眼镜和衣服细节仍请 Claude 按 accept 复核。

所有标准图原始画布为 **1024×1536，RGBA，有实际透明像素**；人物区域最大 Alpha 为 254，接近不透明，背景角落透明。网页可切棋盘格、浅色、深色，并叠到背景上检查边缘。900×1600 是采用后的交付目标，由 Claude 按要求裁切/排版；本批保留未裁原图。

## 背景：每项两案

| 场景 | A | B |
|---|---|---|
| 汐川站 | [开放雨棚、长椅和海岸纵深](bg-station-1.png) | [木质候车建筑与站台](bg-station-2.png) |
| 老房子院落 | [枇杷树/铁门在左，住宅在右](bg-oldhouse-1.png) | [住宅在左，树和铁门偏右](bg-oldhouse-2.png) |
| 露天影院·黄昏 | [偏侧机位，放映室在左](bg-cinema_dusk-1.png) | [铁椅排布更展开，银幕与海面](bg-cinema_dusk-2.png) |
| 大学社团广场 | [双侧摊位，中间通向主楼](bg-campus-1.png) | [略侧向的摊位与花树](bg-campus-2.png) |
| 海边咖啡馆 | [吧台在左、海窗与入口](bg-cafe-1.png) | [更宽的开门视野与海堤](bg-cafe-2.png) |
| 胶片放映室 | [后侧机位、两台机器朝窗外露天银幕](bg-projection-1.png) | [侧向机位、窗外银幕与晚霞](bg-projection-2.png) |

所有背景原图为 **1672×941**，接近 16:9，底部留给对话区域；没有人物，初步未见可读文字或水印。1920×1080 是采用后的输出目标，本次没有伪造原生分辨率或提前放大。

## 修订与排除项

- 夏知遥 A 初稿偏全身，已用内置工具重做膝上机位；初稿在 `sprite-zhiyao-normal/superseded/a-full-body-initial.png`。
- 放映室 A 初稿窗外成室内影厅，与露天影院设定不符；第一次修订改了窗景和空白便签，但机器朝向仍不对。两张初稿均保留在 `bg-projection/superseded/`，不进入选图页。最终 A 用新的后侧机位重做，两台机器朝同一放映窗。
- 此前三张被替换的原图不计入 24 张候选；生成记录保留全部 27 次正式任务生成/修订。
- 清单到达前做的两张室内影院画风概念在 `ooc-replica/art-concepts/coastal-vn/2026-11-04/` 单独归档，**不属于本书六个场景、不作为采用备选**。

## 查看与协作

审图页：`/assets/art-review/xichuan-batch1/index.html`。

支持中英切换、按人物/背景看候选、放大、透明边缘检查、人物/背景叠放、选图与导出待审清单。选择仅在浏览器保存，不自动写回 GitHub、改清单或采用图片。叠放对白是版式示意，不是本书剧情。

本 PR 替代旧 #114，依赖 `claude/xichuan` / PR #113，只审 Codex 的候选和审图页增量；Claude 的剧情、引擎、清单、正式图片和生成页面均未改，也未运行 build.py / game:sync。请 Claude 按 accept 审图，由用户定标准立绘，Claude 再裁切接入；用户明确授权前不合并。

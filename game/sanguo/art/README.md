# 插画版的图

《三国·谋士》有两个版本，故事、规则、存档都一样，只有画面不同：

- **插画版**（`web/illus.html`，网站默认）：用这个文件夹里的插画。
- **水墨版**（`web/index.html`）：所有画面由 `engine/art.js`、`engine/portraits.js` 用代码画出，保持原样。

插画版里某张图还没有时，那个位置自动回退成水墨画，所以可以分批补图。

## 文件夹

| 文件夹 | 内容 | 尺寸 |
|---|---|---|
| `portraits/<角色 id>.webp` | 人物头像，id 与 `content/campaign.json` 的 `chars` 一致 | 300×400 |
| `scenes/<名>.webp` | 章节场景图。卷一按节点的 `art.scene` 取；卷二、卷三按节点的 `art.illus` 取（`v2_`、`v3_` 开头是专属的，`g_` 开头是几个小场景共用的） | 1200×480 |
| `cg/<高光 id>.webp` | 高光大图，id 与 `cg_captions` 一致 | 1200×720 |
| `ending/<变体>.webp` | 结局图：two_boat（同舟）、home（江边小屋）、city（城郭）、lone（独立江岸） | 1200×480 |
| `cover.webp` | 网站卡片封面 | 640×960 |
| `source/` | 生成的原图，留着以后重新裁 | — |

表情目前用同一张头像加滤镜区分（冷淡偏灰、温和偏暖）。场景图不随剧情图层变化，一个场景一张。

## 作图清单

- `portrait-jobs.jsonl`：人物头像。
- `edition-jobs.jsonl`：卷一的场景、结局、高光、封面。
- `edition-jobs-v5.jsonl`：卷五的场景图（17 张，`v5_` 开头），排在卷四之后。
- `edition-jobs-v4.jsonl`：卷四的场景图（14 张，`v4_` 开头；还没画时插画版用水墨顶上）。字段和 v23 清单一样。
- `edition-jobs-v4.jsonl`：卷四的场景图（14 张，`v4_` 开头；还没画时插画版用水墨顶上）。每条带参考图路径、必须保留的特征、构图和验收要点。
- `edition-jobs-v23.jsonl`：卷二、卷三的场景图（51 张，覆盖两卷所有节点）。每条的 `refs` 列出画面里出现的角色，生成时会把他们的头像一起发给模型，保持脸一致。
  每条还有给出图的人看的字段：
  - `batch`、`status`：`done` 已采用；`ready` 可以出图（第 1 批）；`queued` 排队（第 2 批）。
  - `ref_paths`：要一起发给模型的参考图，先是出场角色的头像，最后一张是画风对齐用的已采用场景图。
  - `keep`：每个角色必须保住的特征。
  - `composition`：构图和关键动作。
  - `accept`：验收要点。
  出图的人每张交 2–3 张候选，放在 PR 里；Claude 选图，采用后裁成 1200×480 放进 `scenes/`，原图留在 `source/`，再把 `status` 改成 `done`。

## 生成

仓库 Secrets 里放好 `OPENAI_API_KEY` 后：GitHub → Actions → Generate portraits → Run workflow。

- `jobs`：清单文件，`art/portrait-jobs.jsonl` 或 `art/edition-jobs.jsonl`
- `ids`：要生成的条目（逗号分隔，如 `scene-garden,cg-thunder`），留空 = 所有还没有图的条目
- `quality` 默认 high，`model` 默认 gpt-image-2

任务把四张封面（sg-001、004、007、008）作为画风参考，生成后重建页面、同步网站，结果推到 `art/gen-<编号>` 分支，审图后合并。每次运行都会在 OpenAI 账户产生费用（高质量约每张 0.2 美元）。

本地也能跑：`OPENAI_API_KEY=... python3 tools/gen_portraits.py --jobs art/edition-jobs.jsonl --ids scene-garden`（需要 `pip install requests pillow`）。

## 审图要点

人物年龄、外貌符合原著描写；同一个人在不同图里脸要一致；不像任何影视剧或游戏形象；汉服不是和服；画面里没有文字。

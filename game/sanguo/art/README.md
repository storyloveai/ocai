# 剧情人像（插画版）

游戏里角色的小头像默认用这里的插画，跟网站封面一个画风。原来代码画的水墨版没删，玩家在顶栏「画风」里切回「水墨」就能看到。

## 放在哪

- `portraits/<角色 id>.webp`：角色 id 跟 `content/campaign.json` 里 `chars` 的键一致（liubei、caocao、guanyu、zhuge、wenzhi、zhouyu、lusu、zhaoyun、sunfuren、pangtong、zhangsong）。
- 竖版 3:4，脸放在上三分之一。导出 300×400 左右的 WebP 就够，单张控制在 40 KB 以内，因为会被内嵌进单页 `web/index.html`。
- `tools/build.py` 会把这个文件夹里的图全部打包进页面。还没有图的角色，插画模式下显示名字卡。

## 现在有哪些

| 角色 | 来源 |
|---|---|
| 刘备、曹操、关羽、诸葛亮、周瑜、赵云 | 从网站书目封面 sg-001、002、003、004、005、008 裁出（`ooc-replica/dist/assets/originals/`） |
| 温芷、鲁肃、孙夫人、庞统、张松 | 还没有图，作图清单在 `portrait-jobs.jsonl` |

## 补图

**自动生成（推荐）**：仓库 Secrets 里放好 `OPENAI_API_KEY` 后，到 GitHub → Actions → Generate portraits → Run workflow。
可以填要生成的角色 id（逗号分隔，留空 = 所有缺图角色）和质量。任务会把封面 sg-004、sg-007 作为画风参考发给模型，
生成后自动重建页面、同步网站，并开一个 PR 供审图。每跑一次都会在 OpenAI 账户上产生费用。
本地也能跑：`OPENAI_API_KEY=... python3 tools/gen_portraits.py --ids wenzhi`（需要 `pip install requests pillow`）。

**手动**：
1. 用出封面的同一个工具，逐行跑 `portrait-jobs.jsonl`（提示词、负面提示词、尺寸都在里面）。
2. 审图：人物、年龄、外貌符合原著描写，不像任何影视剧或游戏形象。
3. 按 `output_filename` 存进 `portraits/`，裁到 3:4、压到 40 KB 以内。
4. 按仓库说明重新构建并同步到网站：`python3 tools/build.py`，再到 `ooc-replica` 跑 `npm run game:sync`。

表情目前用同一张图加滤镜区分（冷淡偏灰、温和偏暖）。以后要给每个表情单独出图，再扩展这个约定。

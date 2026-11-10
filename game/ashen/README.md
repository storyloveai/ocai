# 灰烬王冠

原创现代魔法战争故事：小说（`novel/`，连载中）和 galgame（灯火线试样）。

| 目录 | 内容 |
|---|---|
| `novel/` | 小说正文，按卷分目录；每卷有合集 |
| `docs/` | 设定集、各卷细纲、写法笔记、游戏方案、决策记录 |
| `content/` | galgame 剧本（`story.py` 汇总，`ch1.py`…按章）→ `campaign.json` |
| `app/play.src.html` | 播放页（从汐川的播放页扩展：两版画风、记忆册、遗器档案、灰城诊所） |
| `art/` | 两版美术 `anime/`、`real/`，出图单 `jobs-*.jsonl`，见 `art/README.md` |
| `web/index.html` | 打包好的页面，网站上在 `/assets/ashen/` |

```
python3 content/story.py && python3 tools/build.py && python3 art/make_jobs.py
node ../engine/tools/check.mjs content/campaign.json 3000      # 必须 PASS
cd ../../ooc-replica && npm run game:sync
```

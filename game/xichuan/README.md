# 汐川的第七个春天

StoryDate 第一本 galgame：原创校园纯爱。离家七年的主角陆远回到海边小城汐川，在一座春天过完就要拆的露天影院里，和三位女主度过最后一季放映。

- **体验**：和玩 galgame 一样——读剧情、看立绘和 CG、在分歧点做选择。没有自由输入，不显示好感数字。
- **原创**：故事、人物、台词全部原创，只用类型公认的结构（共通线、分歧、个人线、好感、真结局）。
- **成年**：所有角色都是大学生或研究生（20 岁以上）；纯爱，不写露骨内容；中英双语。
- 企划和待定事项：见 Claude Docs 的企划文档；设计改动记在 `docs/决策记录.md`。

## 文件

| 路径 | 内容 |
|---|---|
| `content/lib.py` | 写法工具：场景、选项，以及逐句剧本 `bg / show / hide / cg / say / nar / me / think` |
| `content/story.py` | 人物、变量、章节、剧本 → 生成 `content/campaign.json` |
| `app/play.src.html` | galgame 播放页（背景 + 立绘 + 对话框；回看、自动、跳过、存档、CG 鉴赏、中英切换） |
| `tools/build.py` | 把引擎、剧本、图片清单打包成 `web/index.html` |
| `art/` | 图（见 `art/README.md`）；没有图的地方播放页显示占位图 |

## 改完要跑

```
cd game/xichuan
python3 content/story.py
python3 tools/build.py
node ../engine/tools/check.mjs content/campaign.json 3000   # 必须 PASS
cd ../../ooc-replica && npm run game:sync                    # 网站上的副本（/assets/xichuan/index.html）
```

`content/campaign.json` 和 `web/index.html` 要一起提交，CI 会检查是不是最新的。

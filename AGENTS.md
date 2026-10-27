# 协作说明（给人，也给 Codex / Claude Code 等 AI 助手）

动手之前先读 `docs/当前进度.md`（现在在做什么、AI 助手怎么分工、待办），再确认你改的是哪一块。做完一块回来更新它。（2026-10-21 起分工调整：网站开发由 zhouzeya 接手，兰馨负责故事和角色内容。）

| 区域 | 内容 | 负责人（GitHub） | 先读 |
|---|---|---|---|
| 网站 | `ooc-replica/`（现在的网站）；`src/` `api/` `netlify/` `server/` `scripts/` `data/` `dist/` `supabase/` `tests/`（早期版本） | zhouzeya（@666ZHOUZEYA） | `ooc-replica/README.md` |
| 故事和角色内容 | `ooc-replica/content/`（原创书目、角色）、`ooc-replica/book-campaigns/`（名著互动） | 兰馨（@allliiita / @Lindsey-cyber） | `ooc-replica/content/original-catalog/README.md`、`game/engine/README.md` |
| 互动小说玩法 | `game/engine/`：所有书共用的引擎、五档、题材包、检查和升级工具；`game/sanguo/`：三国·谋士，卷一至卷五已完成 | zhouzeya（@666ZHOUZEYA） | `game/engine/README.md`、`game/sanguo/README.md`、`game/sanguo/docs/决策记录.md`、`game/sanguo/docs/接入约定.md` |

## 分支和部署

- `main` 是唯一主干。zhouzeya 的 Vercel（storydate-zhou.vercel.app）跟 `main` 自动部署；兰馨的 Vercel 跟她自己的分支，两边互不影响。
- 开始新工作前，先把 `main` 合进自己的分支；做完一块，发 PR 合回 `main`。不要长期各推各的分支，不然代码会分岔。

**写新书**（不管在网站目录还是 `game/` 下）：按 `game/engine/README.md` 选题材包、用规格 0.4、过 `game/engine/tools/check.mjs`。引擎只从 `game/engine/campaign_core.js` 取，不在副本上改；需要引擎加功能时提 issue 或 PR。

## 协作流程

- 不直接推 `main`。一项改动一个分支、一个 PR，PR 说明写清楚：改了什么、对方那边要不要跟着动。
- 跨区域改动，比如为了接入游戏改网站的构建或 API，在 PR 里点名对方 review。`.github/CODEOWNERS` 会自动请对方 review。
- 网站接入游戏，只通过 `game/sanguo/docs/接入约定.md` 里列出的文件和接口，引擎只从 `game/engine/` 取。
- 内容（书目、角色、名著剧情）的改动请兰馨 review；网站代码和游戏的改动请 zhouzeya review。

## 改 `game/` 时必须做的

```
python3 game/engine/packs/make_packs.py  # 改了题材包时
node --test game/engine/test/engine.test.mjs           # 改了引擎时
cd game/sanguo
python3 content/campaign.py              # 内容 → content/campaign.json
python3 tools/build.py                   # 生成各卷内容和卷二的“前情”，并打包成 web/index.html（整本书一个页面）
node tools/check.js content/campaign.json 5000         # 卷一：静态校验 + 模拟玩家，必须 PASS
node tools/check.js content/v2/campaign_v2.json 5000   # 卷二，同上
node tools/check.js content/v3/campaign_v3.json 5000   # 卷三，同上
node tools/check.js content/v4/campaign_v4.json 5000   # 卷四，同上
node tools/check.js content/v5/campaign_v5.json 5000   # 卷五，同上
cd ../../ooc-replica && npm run game:sync                  # 把引擎和三国的新版本复制给网站（CI 会检查）
```

- 改了内容或引擎，要把重新生成的 `content/campaign.json`、`content/v2/campaign_v2.json`、`content/v2/presets.json`、`content/v3/campaign_v3.json`、`content/v3/presets.json`、`content/v4/campaign_v4.json`、`content/v4/presets.json`、`content/v5/campaign_v5.json`、`content/v5/presets.json`、`web/index.html` 和 `web/illus.html` 一起提交。网站构建不需要 Python。
- PR 改到 `game/**` 时，GitHub Actions（`.github/workflows/game-check.yml`）会自动跑上面这三步，并检查提交的生成文件是不是最新的。
- 内容规矩以 `game/sanguo/README.md` 的“写内容的规矩”为准。最重要的几条：
  - 中英双语都要写；
  - 原著引文只取公版原文，不改写、不洗稿受版权保护的译本或改编作品；
  - 不写露骨内容；
  - 哪些角色可以谈恋爱是产品决定，不由 AI 自行添加；
  - 剧情数值只由规则决定，AI 只负责给玩家的话打标签和写台词。

## 改网站时

- 构建：`npm run build`；测试：`npm test`。密钥只放在托管平台的环境变量里，不写进仓库和文档。
- 其余约定见 `README.md` 和 `docs/` 下的文档。

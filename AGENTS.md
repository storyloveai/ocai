# 协作说明（给人，也给 Codex / Claude Code 等 AI 助手）

这个仓库有两块，分开负责，通过固定接口对接。动手之前先确认你改的是哪一块。

| 区域 | 内容 | 负责人（GitHub） | 先读 |
|---|---|---|---|
| 网站 | `src/` `api/` `netlify/` `server/` `scripts/` `data/` `dist/` `supabase/` `tests/` | 兰馨（@allliiita / @Lindsey-cyber） | `README.md`、`docs/STORYLOVE-SETUP.md`、`docs/HANDOFF.md` |
| 互动小说玩法 | `game/`（目前只有 `game/sanguo/`：三国·谋士，卷一、卷二已完成） | zhouzeya（@zhouzeya） | `game/sanguo/README.md`、`game/sanguo/docs/决策记录.md`、`game/sanguo/docs/接入约定.md` |

## 协作流程

- 不直接推 `main`。一项改动一个分支、一个 PR，PR 说明写清楚：改了什么、对方那边要不要跟着动。
- 跨区域改动，比如为了接入游戏改网站的构建或 API，在 PR 里点名对方 review。`.github/CODEOWNERS` 会自动请对方 review。
- 网站接入游戏，只通过 `game/sanguo/docs/接入约定.md` 里列出的文件和接口。需要游戏那边改接口时，提 issue 或 PR，不要直接改 `game/` 里的引擎或内容。
- 游戏那边不改网站的页面、路由、账户、支付和部署配置。

## 改 `game/` 时必须做的

```
cd game/sanguo
python3 content/campaign.py              # 内容 → content/campaign.json
python3 tools/build.py                   # 生成各卷内容和卷二的“前情”，并打包成 web/index.html（整本书一个页面）
node tools/check.js content/campaign.json 5000         # 卷一：静态校验 + 模拟玩家，必须 PASS
node tools/check.js content/v2/campaign_v2.json 5000   # 卷二，同上
```

- 改了内容或引擎，要把重新生成的 `content/campaign.json`、`content/v2/campaign_v2.json`、`content/v2/presets.json` 和 `web/index.html` 一起提交。网站构建不需要 Python。
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

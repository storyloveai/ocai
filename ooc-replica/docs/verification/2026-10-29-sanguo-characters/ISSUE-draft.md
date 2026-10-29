# Character：从三国·谋士接入六位独立对话角色

未发布：`gh issue create` 返回 `Post "https://api.github.com/graphql": Forbidden`。拟用标签 `codex`。

Codex 认领。用户要求把工程重心转向 Character，复用《三国·谋士》人物做独立角色对话。

第一批：曹操、诸葛亮、刘备、关羽、赵云、温芷。沿用已采用的头像与现有剧情中人物 persona；保留原角色 ID 和旧聊天。温芷加入角色目录，现有周瑜/吕布/貂蝉入口保留。

工程范围：角色入口和展示、双语开场和切入点、服务端独立人物配置、聊天历史与本子存档隔离、回归及电脑手机验收。不改 game/**、作图清单、生成目录、兰馨的 content/**。

依赖：堆叠在 PR #47（codex/38-chat，含 #44 的角色历史修复）上并合入最新 main；新分支 codex/sanguo-characters。PR 单独列出新增差异，不重复交付 #44/#47。

新增角色开场/描述属于内容，请兰馨审文案、Claude 审人设一致性；没有改游戏的恋爱开放规则。

停在草稿 PR / Preview，不合并。

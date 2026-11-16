# 夏知遥集成预览交接

用户要求：统一角色入口，跑通夏知遥聊天、故事、记忆和进度，提供从头体验的 Preview，不合并。任务 #156。

使用 `codex/character-loop-integration-20261116`，base main。它组合 #151 4e78a6a（含 #149 38b6ad4）及 #155 1b184f9；原 PR 不改、不关、不合并。产品行为和截图见 `docs/verification/2026-11-16-character-loop-integration.md`。

关键入口：`/characters` → `/characters/xc-zhiyao` → `/play/xc-zhiyao` ↔ `/play/xichuan`。原角色聊天 ID 和 `ooc-session-v2-*` 键未更名；旧 singular 角色 URL 兼容，新旧存档不被静默清除。旧静态汐川入口在 Vercel 缺少 site=1 时跳宿主，iframe 保留 site=1。

默认夏知遥是明确的本设备演示，无模型、积分请求；实际故事和记事存储是真的。设置里显式切 AI 后才沿用真实服务器/报价流程。演示不作为真实模型效果证据。匿名用户在当前浏览器保存；账号恢复与隔离沿用 #149/#151，但真实 Preview Firebase、跨设备、模型/支付验收仍待环境和授权。

2026-11-16 深度迭代：手机档案层级、URL 筛选返回、账号/分支作用域的本设备草稿及冲突恢复、服务不可用、记事来源、窄屏工具和 iframe 高度已补齐；321 项检查通过。实际从零聊天→记事→游戏入社→续玩→读序章回退，未注入存档。最新记录与 8 张截图见 `docs/verification/2026-11-16-character-refinement.md`。未发送草稿仅在本设备保存，不进云端记忆。

继续时先检查此集成分支及 PR 的最新状态，避免回到 #155 独立展示分支导致流程再次断开。不要把整合提交当作 main 已上线。未经“合并 #N”指示，不合并。

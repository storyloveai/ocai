# 飞轮体验版验收记录

2026-11-16 凌晨，Codex，任务 [#154](https://github.com/storyloveai/ocai/issues/154)。分支 `codex/flywheel-experience-20261115`（基于 main `c688a97`）。未合并 main、未碰 #149/#151、无密钥操作、无付费调用。

## 交付物

| 文件 | 内容 |
| --- | --- |
| `docs/product/2026-11-15-flywheel-experience-prd.md` | PRD：老板原话 / PDF 推论 / 实现决定分层 |
| `ooc-replica/dist/assets/flywheel/cards-data.js` | 统一角色卡索引（33 张）+ 三张地图（作品/宇宙/框架） |
| `ooc-replica/dist/assets/flywheel/flywheel.js` | 四个页面 + 首页动线 + 侧栏入口 |
| `ooc-replica/dist/assets/flywheel/flywheel.css` | 全套样式（沿用站点 token 与断点） |
| `tests/flywheel.test.mjs` | 数据完整性 + 双端到端 |
| `dist/app.js` / `site-i18n.js` / `package.json` | 路由注册 / 4 个侧栏词条 / node --check 链 |

## 页面清单

- `/characters`：33 张卡（汐川5 + 三国9 + 原创3 + 维斯特林10 + 贝克街6），宇宙/可聊天筛选 + 空态
- `/characters/<id>`：人设、说话方式（原作例句引用 + 出处）、不能违背的设定、出场横滑、同宇宙角色
- `/universe`：5 个宇宙卡（角色数/故事数）；`/universe/westlin` 四页签（世界规则/地点/势力/时间线）
- `/frameworks`：老板比方引用 + 四料对照（食材/规矩/锅/菜）+ 四框架卡 + 「同一句话，锅怎么接」静态演示
- `/studio`：三步建卡（基础/人设/**授权开关**）+ 实时预览 + 拼角色前提 + 本地草稿/导出，常驻原型声明
- 首页末尾追加「从故事认识角色」动线（footer 之前，避开既有测试锁定区）；侧栏克隆模式加入 4 个入口

## 自动化验证

- `npm run build` + `npm run check`：**190 项全部通过**（新增 2 项：数据完整性、端到端），`node --check` 链已含新文件
- 数据测试断言：33 张卡双语齐全、每张立绘文件真实存在、聊天链接全部命中 `character-profiles.js` 白名单、`/assets/**` 外链目标文件存在

## 浏览器走查（本地 127.0.0.1:3000，main 同源结构）

桌面 1366×900：首页 hero 未受影响 + strip 呈现（4 宇宙行 + 4 CTA）；角色库筛选/计数；夏知遥档案（例句引用、`target="_top"` 外跳汐川）；维斯特林四页签切换（时间线 3 条目）；框架演示切换台词后双栏变化；工作台三步建卡→实时预览联动→授权第三档→保存草稿（"我的草稿 · 1"）→拼角色生成前提（夏知遥 × 程航，含授权注记）。
手机 390×844：角色库双列 + 筛选换行；提灯档案单列完整可读。

## 边界与说明

- 内容全部摘自仓库现有文件（`game/*/content`、`game/ashen/docs/设定集.md`、`game/holmes/docs/设计方案.md`、站点角色模块），未新写设定；例句标注出处
- 沙盘与真机的差异：本地无模型 key，聊天跳转链接已按白名单核对但未点入真实对话；PostHog 未接新事件（按 PRD 约定）
- 已知限制：sgc-005/6/7（周瑜/吕布/貂蝉）无聊天入口（与主线一致）；拼角色为模板拼装非 AI；工作台草稿仅在本机
- 走查中发现并已修：浏览器缓存旧 app.js 导致动线"消失"（强刷后正常，非代码问题）；strip 原插在 footer 之后，已改为 footer 之前；异常捕获留痕 `window.__fwError` 不静默

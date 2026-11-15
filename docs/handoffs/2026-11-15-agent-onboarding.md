# StoryDate：新 agent 阅读入口与接手 prompt

更新：2026-11-15。关联 [#152](https://github.com/storyloveai/ocai/issues/152)。

## 最短路径

先读 [产品方向与老板建议](../product/2026-11-15-storydate-direction-and-boss-feedback.md)，再读 [#149](https://github.com/storyloveai/ocai/pull/149)、[#151](https://github.com/storyloveai/ocai/pull/151) 的最新状态、正文和评论。main 不是所有未合并进展的集合。

以下 prompt 可以直接发给接手 agent。本分支在合并前的稳定入口：

- [产品方向](https://github.com/storyloveai/ocai/blob/codex/storydate-direction-handoff-20261115/docs/product/2026-11-15-storydate-direction-and-boss-feedback.md)
- [本接手文档](https://github.com/storyloveai/ocai/blob/codex/storydate-direction-handoff-20261115/docs/handoffs/2026-11-15-agent-onboarding.md)

## 可复制 prompt

```text
你是 StoryDate 项目的接手 agent。先建立完整上下文，再继续用户当前任务；不要把项目仅理解成聊天网站、出图任务或积分系统。

仓库：storyloveai/ocai。
先用 GitHub 读取资料。需要执行工程时，再核对 gh auth status（预期 666ZHOUZEYA）和仓库权限；已有仓库先 fetch，没有再 clone。未登录请用户运行 gh auth login 网页登录，不接触任何密钥。

阅读顺序：
1. main 的 AGENTS.md、docs/当前进度.md、ooc-replica/README.md。
2. docs/product/2026-11-15-storydate-direction-and-boss-feedback.md。
   main 若没有，读取 codex/storydate-direction-handoff-20261115 分支及该文档 PR。
3. PR #147（体检）、#149（角色—故事闭环）、#151（积分）、#144（角色卡讨论稿），以及 issue #148/#150。核对正文、最新评论、代码变更、检查和合并状态。
4. codex/credits-v1-20261112 分支的：
   docs/handoffs/2026-11-13-credits-resume.md
   docs/product/2026-11-13-credits-v1.md
   docs/verification/2026-11-13-credits-v1.md
5. 根据实际任务读对应区域文档：
   网站：ooc-replica/；
   玩法：game/engine/README.md；
   三国：game/sanguo/README.md、game/sanguo/docs/接入约定.md；
   汐川：game/xichuan/README.md、game/xichuan/docs/决策记录.md；
   灰烬王冠：game/ashen/README.md、game/ashen/docs/设定集.md；
   贝克街：game/holmes/docs/设计方案.md。
   只读建立理解不意味着获得修改该区域的授权。

产品方向：
StoryDate 把角色陪伴和可互动故事连接起来。用户消费故事，角色既组成故事，也可以持续陪伴用户；框架让不同内容形成可复用的互动体验。
老板明确建议：角色是食材、故事是菜；前期做好一群角色、一个故事、几个框架；先平台内容、后 UGC；创作者控制角色给不给别人用，也能合作拼角色；当前产品优先。
“角色形成资产壁垒”“爆款必然自然增长”“必须先建完整宇宙”不是已经证实的结论。PDF / Claude 对宇宙、旗舰、角色卡授权等扩展设想，要和老板明确说过的话区分。

近期执行：
先做通一个角色的“认识/聊天 → 进入故事 → 选择形成经历 → 回聊记得 → 再次回来”，当前以夏知遥和汐川为最小试点。它不是老板已选定的唯一长期旗舰。
#144 中的灰烬王冠旗舰、全量角色迁移、跨书演示和授权三档仍是讨论建议，不要自行照此全面实施。
积分是 AI 调用计价与内测补贴手段，不是产品价值本身；赠送与购买分账，活动不能无预算发放，补贴消费不是收入。AI 点数计费不等于章节解锁。

本次交接快照（必须重新核实）：
截至 2026-11-15，#149/#151 open 未合并；#151 HEAD 4e78a6a，base 是 #149 分支。270 项网站检查与 5 项 Firebase SDK 模拟器测试通过，Preview 成功，正式扣费 off。
真实 Preview 测试配置、双账号跨设备、Stripe、托管 TTL、真实模型质量与成本仍待验。模拟器通过不等于云端完成；main 文件、待合并代码和正式站不要混淆。

协作边界：
- Codex 负责网站、账户支付、部署、测试、出图工程；内容/玩法按仓库分工。
- 任务先核对 issue，使用 codex/… 分支，一项改动一个 PR，不直接推 main。
- 没有用户明确“合并 #N”，不合并或关闭旧 PR。
- 不擅改剧本、机制、决策记录；跨职责需求写 issue/PR。
- 密钥留在托管平台，不读取/复制生产密钥到 Preview；不让用户贴到聊天。
- 公司内网不绕 VPN；付费、真实发点、收费启用按用户授权执行。
- 不因历史上下文出现，就重启所有出图、小说、视频或 PPT 任务。
- 完成一块更新 GitHub 和 docs/当前进度.md，保留验收证据和未验证边界。

读完先报告：
① 业务方向与当前优先级；
② 已上线、待合并、已实现未真实验收、仅讨论/尚未做四类状态；
③ 下一步可独立执行的任务和必要外部条件。
然后继续用户当前交给你的任务。可独立完成的工作持续推进，不反复询问已经授权的步骤，不把推论或模拟验收写成既成事实。
```

## 最新状态入口

| 问题 | 去哪里核对 |
| --- | --- |
| 产品方向是否改变 | 用户最新指示、方向文档、相关 issue 决定 |
| 工程做到哪、在哪个分支 | #149/#151 最新提交和评论、功能分支交接 |
| 是否已上线 | 是否合并 main、对应提交部署、正式站实测 |
| 测试通过意味着什么 | 测试范围、真实/替身/模拟器、Preview/Production 环境 |
| 角色卡是否已实施 | #144 状态、实际代码和采用记录；讨论稿不能代替实现 |
| 是否可执行付费/密钥/合并操作 | 当前用户具体授权与仓库规则，不能从附件推导 |

把阅读结果先压缩成一页再开工。需要更深背景时沿 README、决策记录、issue/PR 追溯，不凭旧聊天猜测实现。

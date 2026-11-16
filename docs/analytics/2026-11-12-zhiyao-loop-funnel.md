# 夏知遥闭环漏斗口径

接续 #148 / #149。只传作品/人物/节点/选项 ID、结果枚举及耗时，不传用户原话、回复、记事、存档或账户资料。本地和自动化浏览器沿用 analytics.js 的关闭规则，不强行开启采集。

| 阶段 | 事件 | 口径 |
|---|---|---|
| 打开角色聊天 | character_chat_opened | 成功挂载人物聊天界面，每次打开/刷新可记录；漏斗按独立用户去重 |
| 尝试聊天 | chat_message_sent | 已发起一次请求，不能当作模型成功 |
| 开始看见回复 | chat_reply_started | 当前页面首次显示非空回复片段 |
| 成功收到回复 | chat_reply_completed | 流正常完成且正文非空；demo 与 ai 分开筛选 |
| 失败 / 主动停止 | chat_reply_failed / chat_reply_cancelled | 与成功互斥，每个尝试最多一个最终事件；错误只传白名单代码 |
| 点击角色的故事邀请 | xichuan_story_invitation_opened | 明确点击聊天界面的故事入口 |
| 打开游戏 | game_opened，game=xichuan | 游戏容器打开；尚不代表点击开始 |
| 开始新一轮 | game_run_started，game=xichuan | 由游戏实际开始动作发出 |
| 剧情选择 | xichuan_choice_selected | 由真实选项点击发出；读档还原的历史 ledger 不算新点击 |
| 续玩 / 读档 | xichuan_game_resumed | 游戏实际执行 restore，不按页面打开猜测 |
| 回到角色 | xichuan_chat_returned | 点击游戏的回聊入口且有已玩进度；导航标记立即移除，刷新不再重复当作一次往返 |
| 到达结局 | game_volume_ended，game=xichuan | 当前进度首次从未结束变为结束 |

在 PostHog 按人物 xc-zhiyao / 游戏 xichuan 筛选，基础漏斗取“打开聊天→成功回复(ai)→点击故事邀请→剧情选择→回聊”。次日留存看同一用户次日再次 character_chat_opened 或游戏续玩；不能用总事件次数冒充用户转化率。

这次完成事件发送口径与模拟测试，尚未登录 PostHog 后台验证真实收数或创建在线看板。浏览器故障演练没有发生产统计。付费/解锁未接入本漏斗，不虚构付费转化。

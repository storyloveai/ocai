# 体检证据

对应 [一页清单](../2026-11-12-storydate-loop-audit.md)。以下为 2026-11-12 的有限实测，线上公开页面、公开配置与 main `c688a97e905ca6ee2dedd68d718411593e7eee82` 互相核对。

## 实际操作

| 检查 | 步骤与观察 | 证据 |
| --- | --- | --- |
| 角色目录 | 从正式站首页点“角色”，读到 12 张卡片，其中没有夏知遥 | [目录截图](01-character-catalog.jpg) |
| 角色聊天 | 打开沈砚舟并发送虚构测试台词，收到模型回复，勾选记事后刷新。原话、回复及“记事 · 1”仍在 | [聊天截图](02-character-chat.jpg) |
| 聊天按钮 | “继续故事”发出“继续当前对话。”并续写当前会话，未进入独立游戏 | [交互实现](../../../ooc-replica/dist/assets/interaction.js) |
| 汐川入口 | 首页热门榜第二张卡片打开 `/assets/xichuan/index.html`，开始游戏，推进到首个选择 | [选择截图](03-xichuan-first-choice.jpg) |
| 汐川对话 | 发送虚构台词“你这么认真，我愿意先留下来帮你收拾放映厅。”，夏知遥回应这句话 | [回应截图](04-xichuan-chat.jpg) |
| 存档 | 在选择菜单上点击“存档”“读档”，界面未变；作出选项后再点存档，面板打开，存档 1 有章节与时间；刷新出现“继续”，能恢复本次场景。自动续玩可能重播该场景中的几句台词 | [存档截图](05-xichuan-save.jpg) |
| 回想 | 390×844 手机断点，标题页点“回想”，DOM 有回想面板但画面仍被标题页覆盖；随后恢复浏览器默认尺寸 | [手机截图](09-mobile-gallery-covered.jpg) |
| 历史 | 经过汐川游玩与保存后打开“历史”，只有沈砚舟聊天一项，汐川未列出 | [历史截图](08-history-missing-xichuan.jpg) |
| 账号 | 桌面 Google 登录入口可点，短暂进入忙碌状态后回到未登录。本次没有观察到完整账号选择和登录结果，也没有确认错误原因 | 待真人完成登录后复验 |
| 积分 | 购买页列出三档美元套餐，“关于积分”说明聊天不扣积分；免费页也有相同说明；自动充值标签明确提示尚未启用 | [积分说明](06-credit-policy.jpg)、[自动充值](07-credit-auto.jpg) |
| 社区与创作 | 社区显示一条公开作品；“我的作品”有创建入口，打开 `/builder` 能选故事或角色类型。发布和授权流程不在本次验收内 | [社区截图](10-community.jpg) |

## 源码核对

- [人物目录](../../../ooc-replica/dist/assets/storydate-originals.js)、[人物设定入口](../../../ooc-replica/dist/assets/character-profiles.js)、[聊天 API 允许名单](../../../ooc-replica/server/roles.js) 中没有独立的夏知遥身份。
- [汐川播放页](../../../game/xichuan/app/play.src.html) 的 `store` 直接读写本机 `xc.*`，语言偏好使用 `sd.lang`；`V.said` 保存最近向各女主说过的话。进入游戏的链接由 [首页游戏卡片](../../../ooc-replica/dist/assets/ashen-crown.js) 和 [首页渲染](../../../ooc-replica/dist/assets/reference.js) 提供。
- 同一播放页中，`#bar` 为 z-index 3，`.menu` 为 4。选择菜单铺满舞台，遮住底部按钮。回想面板为 z-index 6，标题层为 7，标题页调用回想时标题层仍显示。两项都与可见页面现象吻合。
- [账号存储](../../../ooc-replica/dist/assets/account-storage.js) 的 `cloudKey` 和 [历史](../../../ooc-replica/dist/assets/history.js) 没有接入 `xc.*`。账号存储将游客与账号隔离，注释明确游客历史不会自动归入登录账号。跨设备和游客转登录的连续体验仍需设计与实测。
- [现有统计](../../../ooc-replica/dist/assets/analytics.js) 已接 PostHog，自动化浏览器和本地禁用；[聊天](../../../ooc-replica/dist/assets/interaction.js) 发 `chat_message_sent`，[三国接入](../../../ooc-replica/dist/assets/three-kingdoms.js) 发游戏进度事件，[支付](../../../ooc-replica/dist/assets/payments.js) 发购买相关事件。汐川独立页尚未发现相应事件与进度转发。
- [积分页](../../../ooc-replica/dist/assets/credits-view.js) 与 [支付交互](../../../ooc-replica/dist/assets/payments.js) 对应线上说明。公开配置返回 `payments: true`、`walletConfigured: true`、`walletMode: live`。本次验证到页面与配置，未操作实单。
- [角色卡讨论稿 PR #144](https://github.com/storyloveai/ocai/pull/144) 已在审阅。下一块先复用其中适用的字段接夏知遥。既有 [支付体检 #39](https://github.com/storyloveai/ocai/issues/39) 已关闭，正式站真实付款的验收状态需以用户实际完成的结果为准。

## 线上版本核验

| 文件 | 线上与该 main 提交相同的 SHA-256 |
| --- | --- |
| `/assets/xichuan/index.html` | `494e707b96cac4b5e5c5805c6d4c1fc8b737c14108671503ea630c7b44ca1883` |
| `/assets/analytics.js` | `4d387f744f4cf71304d31b12c0cafc16764279db8674c1c24c8a9500de868023` |

浏览器只录入了虚构测试台词。截图均为未登录页面，未记录账号标识、凭据、订单信息或聊天以外的浏览器内容。

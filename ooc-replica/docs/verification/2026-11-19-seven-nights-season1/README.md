# Seven Nights 首季验收

本轮从已验收的 `b58e71b` 独立分支出发。新剧场入口为 `/seven-nights`，从首屏可连续阅读三夜，也能从剧集卡直达某一夜。第四夜为制作中预告，收藏记录保存在当前设备。

## Preview 实测

[实测 Preview](https://storydate-zhou-r9ngw2mqo-zhou-zeyas-projects.vercel.app/seven-nights)。Chrome 浏览器视口为桌面 1366 × 900、手机 390 × 844。每组从剧场进入，第二夜选择亮出暗账并打开车内草稿，第三夜选择拉近距离并打开阳台草稿，再经左上角返回剧场查看印记。预览使用访客身份与手机模拟视口，只核对草稿，没有发送真实模型请求。

| 页面 | 桌面 EN | 桌面 中文 | 手机 EN | 手机 中文 |
|---|---|---|---|---|
| 剧场入口 | [实截](desktop-en-hub.jpg) | [实截](desktop-zh-hub.jpg) | [实截](mobile-en-hub.jpg) | [实截](mobile-zh-hub.jpg) |
| 第二夜开场 | [实截](desktop-en-ep2-color.jpg) | [实截](desktop-zh-ep2-color.jpg) | [实截](mobile-en-ep2-color.jpg) | [实截](mobile-zh-ep2-color.jpg) |
| 第二夜水墨 | [实截](desktop-en-ep2-ink.jpg) | [实截](desktop-zh-ep2-ink.jpg) | [实截](mobile-en-ep2-ink.jpg) | [实截](mobile-zh-ep2-ink.jpg) |
| 第二夜抉择 | [实截](desktop-en-ep2-decision.jpg) | [实截](desktop-zh-ep2-decision.jpg) | [实截](mobile-en-ep2-decision.jpg) | [实截](mobile-zh-ep2-decision.jpg) |
| 第二夜集末 | [实截](desktop-en-ep2-ending.jpg) | [实截](desktop-zh-ep2-ending.jpg) | [实截](mobile-en-ep2-ending.jpg) | [实截](mobile-zh-ep2-ending.jpg) |
| 车内私聊 | [实截](desktop-en-ep2-chat.jpg) | [实截](desktop-zh-ep2-chat.jpg) | [实截](mobile-en-ep2-chat.jpg) | [实截](mobile-zh-ep2-chat.jpg) |
| 第三夜开场 | [实截](desktop-en-ep3-color.jpg) | [实截](desktop-zh-ep3-color.jpg) | [实截](mobile-en-ep3-color.jpg) | [实截](mobile-zh-ep3-color.jpg) |
| 第三夜抉择 | [实截](desktop-en-ep3-decision.jpg) | [实截](desktop-zh-ep3-decision.jpg) | [实截](mobile-en-ep3-decision.jpg) | [实截](mobile-zh-ep3-decision.jpg) |
| 第三夜集末 | [实截](desktop-en-ep3-ending.jpg) | [实截](desktop-zh-ep3-ending.jpg) | [实截](mobile-en-ep3-ending.jpg) | [实截](mobile-zh-ep3-ending.jpg) |
| 阳台私聊 | [实截](desktop-en-ep3-chat.jpg) | [实截](desktop-zh-ep3-chat.jpg) | [实截](mobile-en-ep3-chat.jpg) | [实截](mobile-zh-ep3-chat.jpg) |

[第 3 集免费解锁卡实截](mobile-en-gate.jpg)。同一设备免费解锁后，重新进入会直接恢复阅读。

另从剧场按钮逐集进入第一、二、三夜，季终返回剧场后核对三张已读卡及七项选择印记。

## 回归与隐私

构建、420 项 JavaScript 自动测试、23 份 CSS 的 esbuild 解析、游戏副本一致性检查与 Pillow 深度校验通过。读者页面和剧场复用已有路由与账号作用域。开启计费时以服务端返回的 15 积分为准，钱包事务同时记录扣费与剧集权益。单元测试覆盖伪造价格、余额不足、跨账号、并发重复解锁，以及预览凭据无权打开计费模式。

角色场景与记忆只经过枚举白名单。剧场、读完、闸门曝光和解锁四个新增事件只写入规范中的字段。回归检查了分支、浏览、输入类型、轮次等事件参数，确认 URL 查询字符串和自由输入不会进入捕获结果。聊天回复用测试替身验证，Preview 验收仅检查打开草稿的链路。

## 纹理与模型

新绘制 8 张，首集已有 5 张。桌面资产档案内保留生成器的原生 1672 × 941 PNG，以及 1664 × 936 的交付母版。两张空镜重新制作为无人场景，其余六张按角色锚点制作。网页只分发 1440 × 810 纹理。

Depth Anything V2 Small 从本地权重离线推理，权重 SHA-256 为 `3152477ce0d8d6978d76b995120de97cb5b928701fd0f817769f59e249a16b70`。深度以无损 WebP 编码，13 张均通过三通道一致、尺寸和指定物体近亮远暗检查。

| 纹理 | WebP 字节 | 深度字节 |
|---|---:|---:|
| ep2_p1 | 156,794 | 43,596 |
| ep2_p2 | 131,088 | 40,746 |
| ep2_p3 | 154,346 | 43,204 |
| ep2_p4 | 148,672 | 43,302 |
| ep3_p1 | 155,568 | 40,376 |
| ep3_p2 | 152,514 | 40,566 |
| ep3_p3 | 156,708 | 43,588 |
| ep3_p4 | 152,256 | 44,052 |
| p1 | 153,272 | 44,308 |
| p2 | 142,834 | 40,700 |
| p3 | 148,476 | 43,346 |
| p4 | 146,282 | 40,956 |
| p5 | 152,904 | 32,780 |

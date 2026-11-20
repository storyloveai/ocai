# Seven Nights 首季验收

本轮从已验收的 `b58e71b` 独立分支出发。新剧场入口为 `/seven-nights`，从首屏可连续阅读三夜，也能从剧集卡直达某一夜。第四夜为制作中预告，收藏记录保存在当前设备。

## Preview 实测

[打开本轮固定 Preview](https://storydate-zhou-qhrnta54h-zhou-zeyas-projects.vercel.app/seven-nights)。本轮对照 PR #164 的审美评审单，在部署提交 `de94828` 上使用 Chrome 实截。桌面为 1366 × 900，手机为 390 × 844 的浏览器视口，分别核对中文和英文。下表收录 72 张截图。

每一组都从剧场进入分镜，切换第二夜的彩漫和水墨，选择台词，查看玩家与纪沉的反打，再进入对应幕间。聊天截图取自点击情境台词后、手动发送前。截图等待可见的画格纹理加载及滚动落定。

在本地同版页面额外拦截了所有 POST 和外部请求。四组浏览器验收逐幕点击快捷台词、核对输入框、展开设置并打开原有模型面板，记录到 0 个 POST。单独实测了桌面侧栏用鼠标展开及再次收起，以及系统开启减少动态效果后的入场状态。实测三幕头像的最终裁切位置依次是 74% / 18%、34% / 22%、38% / 18%。

| 页面 | 桌面 EN | 桌面 中文 | 手机 EN | 手机 中文 |
|---|---|---|---|---|
| 剧场入口 | [实截](desktop-en-hub.jpg) | [实截](desktop-zh-hub.jpg) | [实截](mobile-en-hub.jpg) | [实截](mobile-zh-hub.jpg) |
| 第一夜开场 | [实截](desktop-en-ep1-color.jpg) | [实截](desktop-zh-ep1-color.jpg) | [实截](mobile-en-ep1-color.jpg) | [实截](mobile-zh-ep1-color.jpg) |
| 第一夜抉择 | [实截](desktop-en-ep1-decision.jpg) | [实截](desktop-zh-ep1-decision.jpg) | [实截](mobile-en-ep1-decision.jpg) | [实截](mobile-zh-ep1-decision.jpg) |
| 第一夜反打 | [实截](desktop-en-ep1-response.jpg) | [实截](desktop-zh-ep1-response.jpg) | [实截](mobile-en-ep1-response.jpg) | [实截](mobile-zh-ep1-response.jpg) |
| 第一夜集末 | [实截](desktop-en-ep1-ending.jpg) | [实截](desktop-zh-ep1-ending.jpg) | [实截](mobile-en-ep1-ending.jpg) | [实截](mobile-zh-ep1-ending.jpg) |
| 书房私聊 | [实截](desktop-en-ep1-chat.jpg) | [实截](desktop-zh-ep1-chat.jpg) | [实截](mobile-en-ep1-chat.jpg) | [实截](mobile-zh-ep1-chat.jpg) |
| 第二夜开场 | [实截](desktop-en-ep2-color.jpg) | [实截](desktop-zh-ep2-color.jpg) | [实截](mobile-en-ep2-color.jpg) | [实截](mobile-zh-ep2-color.jpg) |
| 第二夜水墨 | [实截](desktop-en-ep2-ink.jpg) | [实截](desktop-zh-ep2-ink.jpg) | [实截](mobile-en-ep2-ink.jpg) | [实截](mobile-zh-ep2-ink.jpg) |
| 第二夜抉择 | [实截](desktop-en-ep2-decision.jpg) | [实截](desktop-zh-ep2-decision.jpg) | [实截](mobile-en-ep2-decision.jpg) | [实截](mobile-zh-ep2-decision.jpg) |
| 第二夜反打 | [实截](desktop-en-ep2-response.jpg) | [实截](desktop-zh-ep2-response.jpg) | [实截](mobile-en-ep2-response.jpg) | [实截](mobile-zh-ep2-response.jpg) |
| 第二夜集末 | [实截](desktop-en-ep2-ending.jpg) | [实截](desktop-zh-ep2-ending.jpg) | [实截](mobile-en-ep2-ending.jpg) | [实截](mobile-zh-ep2-ending.jpg) |
| 车内私聊 | [实截](desktop-en-ep2-chat.jpg) | [实截](desktop-zh-ep2-chat.jpg) | [实截](mobile-en-ep2-chat.jpg) | [实截](mobile-zh-ep2-chat.jpg) |
| 第三夜开场 | [实截](desktop-en-ep3-color.jpg) | [实截](desktop-zh-ep3-color.jpg) | [实截](mobile-en-ep3-color.jpg) | [实截](mobile-zh-ep3-color.jpg) |
| 第三夜抉择 | [实截](desktop-en-ep3-decision.jpg) | [实截](desktop-zh-ep3-decision.jpg) | [实截](mobile-en-ep3-decision.jpg) | [实截](mobile-zh-ep3-decision.jpg) |
| 第三夜反打 | [实截](desktop-en-ep3-response.jpg) | [实截](desktop-zh-ep3-response.jpg) | [实截](mobile-en-ep3-response.jpg) | [实截](mobile-zh-ep3-response.jpg) |
| 第三夜集末 | [实截](desktop-en-ep3-ending.jpg) | [实截](desktop-zh-ep3-ending.jpg) | [实截](mobile-en-ep3-ending.jpg) | [实截](mobile-zh-ep3-ending.jpg) |
| 阳台私聊 | [实截](desktop-en-ep3-chat.jpg) | [实截](desktop-zh-ep3-chat.jpg) | [实截](mobile-en-ep3-chat.jpg) | [实截](mobile-zh-ep3-chat.jpg) |
| 第三夜免费解锁 | [实截](desktop-en-gate.jpg) | [实截](desktop-zh-gate.jpg) | [实截](mobile-en-gate.jpg) | [实截](mobile-zh-gate.jpg) |

同一设备免费解锁后，重新进入会直接恢复阅读。

另从剧场按钮逐集进入第一、二、三夜，季终返回剧场后核对三张已读卡及七项选择印记。

## Cinema Pro 手机与 WebGL 验收

390px 触屏视口进入时顶部可见「3D 倾斜」。打开就有轻微呼吸，竖滑时各画格按自身在屏幕里的位置移动；横拖或倾斜可以接管。系统开启减少动态时，视差、微光和入场转场静止。单测覆盖权限拒绝、2.5 秒未收到读数、横拖、后台恢复和离屏停止。

在同一个 390px 面板上，用生产着色器及输入处理器先正视、再右倾，逐行读取画布像素并测量同一根标线的中心。白色近景向左 16.97px，焦点深度 0.58 的标线向左 0.01px，黑色远景向右 23.41px。可在本目录所属的 `ooc-replica/` 启动本地静态服务器，打开 [像素探针](../../../tests/fixtures/cinema-depth-probe.html) 复测。三夜中有纪沉的画格另外使用各自深度图的双眼采样值锁定视线，并保护脸部免受玻璃雨痕影响。

Apple M2 上使用 Chrome / ANGLE Metal、390×844 视口，在第二夜和《煮酒论英雄》开场各取 120 个帧间隔。两处的平均刷新率均为 60 fps，帧间隔中位数与 P95 均为 16.7 ms。此项是桌面 GPU 实测，实体 iPhone、Android 的传感器与帧率仍需真机复测。

本地浏览器的四组中文／英文、桌面／触屏尺寸验收均使用关闭计费的配置，拦截外部请求，逐集检查画布覆盖、当前场景的舞台图和未发送草稿，记录到 0 个 POST。三国和三夜共用引擎，本轮上线资产复用原画与深度图。

## 回归与隐私

构建、422 项 JavaScript 自动测试、23 份 CSS 的 esbuild 解析、游戏副本一致性检查与 Pillow 深度校验通过。读者页面和剧场复用已有路由与账号作用域。开启计费时以服务端返回的 15 积分为准，钱包事务同时记录扣费与剧集权益。单元测试覆盖伪造价格、余额不足、跨账号、并发重复解锁，以及预览凭据无权打开计费模式。

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

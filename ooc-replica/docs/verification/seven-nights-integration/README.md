# Seven Nights 主站融合验收

基线为已发布的 `9c42e04`，规格见 [#164 方案 1](https://github.com/storyloveai/ocai/pull/164#issuecomment-7034552987)。本页截图均取自本地 Chromium，使用两个版本的实际页面和站内图片。

## 从主站体验

1. 打开首页的故事书库。第一张卡进入七夜剧场，左上角 StoryDate 标志回到首页。后六张卡保持原顺序和原地址，首页原有的三国互动横幅仍可使用。
2. 打开角色库。首张卡进入 Julian 的书房。聊天舞台上的剧集入口返回剧场。从某集的选择进入私聊后，返回箭头会恢复该集已展开的分镜。
3. 全站搜索分别输入 Julian、Vance、Seven Nights、Port Veyron、纪沉、七夜、凌晨两点。每个查询同时返回剧集和角色，点击后分别进入剧场和聊天。
4. 阅读任意一集，或打开 Julian 私聊。在侧栏历史或「我的作品 → 历史」可按类型找回剧集或最近访问的私聊场景。第三集只看到解锁页时不会记为已读。
5. 正片使用 `/seven-nights/ep1`、`/seven-nights/ep2`、`/seven-nights/ep3`。旧试播地址仍可打开，规范化保留查询参数和片段。

## 验证

- 网站构建及 424 项自动测试通过。CSS 解析检查涵盖公共卡片、角色墙、剧场样式。
- 桌面 1366×900、手机 390×844 各跑中英两种语言。四次浏览器走查均实际点击发现卡、剧集入口、返回箭头和历史记录，刷新三条旧入口并核对地址。浏览器未产生写请求或页面脚本异常。
- 服务端逐幕核对专属角色提示词、允许的记忆、防剧透及 PG-16 边界。自动化的显式发送用例使用模拟提供方。
- 桌面与手机均采用浏览器视口测试。下面每组五处画面各有融合前和融合后两张原始截图。

### 桌面 · 英文

| 页面 | 融合前 | 融合后 |
| --- | --- | --- |
| 故事书库 | [查看原图](before-1366-en-story.jpg) | [查看原图](after-1366-en-story.jpg) |
| 角色墙 | [查看原图](before-1366-en-characters.jpg) | [查看原图](after-1366-en-characters.jpg) |
| 搜索结果 | [查看原图](before-1366-en-search.jpg) | [查看原图](after-1366-en-search.jpg) |
| Julian 聊天舞台 | [查看原图](before-1366-en-chat.jpg) | [查看原图](after-1366-en-chat.jpg) |
| 剧场首页 | [查看原图](before-1366-en-hub.jpg) | [查看原图](after-1366-en-hub.jpg) |

### 桌面 · 中文

| 页面 | 融合前 | 融合后 |
| --- | --- | --- |
| 故事书库 | [查看原图](before-1366-zh-story.jpg) | [查看原图](after-1366-zh-story.jpg) |
| 角色墙 | [查看原图](before-1366-zh-characters.jpg) | [查看原图](after-1366-zh-characters.jpg) |
| 搜索结果 | [查看原图](before-1366-zh-search.jpg) | [查看原图](after-1366-zh-search.jpg) |
| Julian 聊天舞台 | [查看原图](before-1366-zh-chat.jpg) | [查看原图](after-1366-zh-chat.jpg) |
| 剧场首页 | [查看原图](before-1366-zh-hub.jpg) | [查看原图](after-1366-zh-hub.jpg) |

### 手机 · 英文

| 页面 | 融合前 | 融合后 |
| --- | --- | --- |
| 故事书库 | [查看原图](before-390-en-story.jpg) | [查看原图](after-390-en-story.jpg) |
| 角色墙 | [查看原图](before-390-en-characters.jpg) | [查看原图](after-390-en-characters.jpg) |
| 搜索结果 | [查看原图](before-390-en-search.jpg) | [查看原图](after-390-en-search.jpg) |
| Julian 聊天舞台 | [查看原图](before-390-en-chat.jpg) | [查看原图](after-390-en-chat.jpg) |
| 剧场首页 | [查看原图](before-390-en-hub.jpg) | [查看原图](after-390-en-hub.jpg) |

### 手机 · 中文

| 页面 | 融合前 | 融合后 |
| --- | --- | --- |
| 故事书库 | [查看原图](before-390-zh-story.jpg) | [查看原图](after-390-zh-story.jpg) |
| 角色墙 | [查看原图](before-390-zh-characters.jpg) | [查看原图](after-390-zh-characters.jpg) |
| 搜索结果 | [查看原图](before-390-zh-search.jpg) | [查看原图](after-390-zh-search.jpg) |
| Julian 聊天舞台 | [查看原图](before-390-zh-chat.jpg) | [查看原图](after-390-zh-chat.jpg) |
| 剧场首页 | [查看原图](before-390-zh-hub.jpg) | [查看原图](after-390-zh-hub.jpg) |

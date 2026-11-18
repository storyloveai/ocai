# 角色与 Story 详情页验收 · 2026-11-18

本地 Google Chrome 在 `127.0.0.1:3066` 验证了从夏知遥的角色页选择话题、查看原作、返回聊天并交接草稿的流程。桌面 1366×900、手机 390×844 各测中英文。四组流程均无页面异常、横向溢出或 POST 请求。完整自动化回归通过 375 项。

实现对应 [issue #156 中的六条设计规格与 DOM 样板](https://github.com/storyloveai/ocai/issues/156#issuecomment-6968481533)。

## 六项体验验收

| 验收项 | 实测结果 |
| --- | --- |
| 1. 角色与作品首屏 | 两页共用主视觉和正文布局。桌面左侧画面均宽 340 px，手机均为 364×260 px。夏知遥首屏同时呈现场景、人物、原作台词和对话入口；Story 首屏呈现原作封面、简介和剧情入口。 |
| 2. 选话题与输入 | 选择话题会把原句填进输入框，选中按钮的 `aria-pressed` 变为 `true`。手写另一句话会解除选中。英文手机页切至中文再切回英文，手写原句仍在。 |
| 3. 同一个聊天主按钮 | 空白时显示开始或继续聊天，有内容时原按钮变为「带这句话去聊」。桌面点击按钮、手机在输入框按 Enter，均进入夏知遥原聊天，输入框保留逐字相同的内容并显示「本设备草稿 · 尚未发送」。这条路径观察到 **0 个 POST**，发送仍由用户在聊天页确认。 |
| 4. 手机首屏可操作 | 390×844 下，夏知遥空白态按钮底边距视口顶部中文约 699 px、英文约 759 px，按钮高 48 px。13 位可聊角色 × 中英文 × 空白或已输入共 **52 种状态**，390 px 宽时每种状态的按钮顶部和底部均能命中。另测 320×844，夏知遥英文按钮底边约 766 px。 |
| 5. 所属故事横条 | 真实作品封面在桌面为 72×108 px、手机为 64×96 px。横条内保留作品名、简介、详情与剧情入口。有进度时在原作品下显示。由夏知遥进入《汐川》的详情和播放器，沿原入口可回到同一聊天。 |
| 6. Story 角色区 | 《汐川》显示 5 位角色，夏知遥标「可聊天 / Chat available」，另 4 位标「故事出场 / In the story」。点击沈澄进入其档案，可沿作品入口继续，页面没有聊天表单。四组流程都实点收藏、取消收藏，并验证按钮回到初始状态。 |

## 实测截图

选话题列展示选中状态、填入的原句和更新后的主按钮。所属故事横条与 Story 角色区两列为滚动到对应位置的画面。

| 视口与语言 | 角色首屏 | 选话题 | 所属故事横条 | Story 首屏 | Story 角色区 |
| --- | --- | --- | --- | --- | --- |
| 1366×900 · 中文 | [角色](assets/detail-stage-20261118/desktop-zh-character.jpg) | [选话题](assets/detail-stage-20261118/desktop-zh-selected.jpg) | [横条](assets/detail-stage-20261118/desktop-zh-strip.jpg) | [Story](assets/detail-stage-20261118/desktop-zh-story.jpg) | [角色区](assets/detail-stage-20261118/desktop-zh-cast.jpg) |
| 1366×900 · 英文 | [角色](assets/detail-stage-20261118/desktop-en-character.jpg) | [选话题](assets/detail-stage-20261118/desktop-en-selected.jpg) | [横条](assets/detail-stage-20261118/desktop-en-strip.jpg) | [Story](assets/detail-stage-20261118/desktop-en-story.jpg) | [角色区](assets/detail-stage-20261118/desktop-en-cast.jpg) |
| 390×844 · 中文 | [角色](assets/detail-stage-20261118/mobile-zh-character.jpg) | [选话题](assets/detail-stage-20261118/mobile-zh-selected.jpg) | [横条](assets/detail-stage-20261118/mobile-zh-strip.jpg) | [Story](assets/detail-stage-20261118/mobile-zh-story.jpg) | [角色区](assets/detail-stage-20261118/mobile-zh-cast.jpg) |
| 390×844 · 英文 | [角色](assets/detail-stage-20261118/mobile-en-character.jpg) | [选话题](assets/detail-stage-20261118/mobile-en-selected.jpg) | [横条](assets/detail-stage-20261118/mobile-en-strip.jpg) | [Story](assets/detail-stage-20261118/mobile-en-story.jpg) | [角色区](assets/detail-stage-20261118/mobile-en-cast.jpg) |

## 回归与验证范围

- `npm run build`、`npm run game:check` 和 CSS 解析检查通过。`npm run check` 共 375 项通过，失败、跳过、取消均为 0。
- 回归覆盖聊天记事的来源与展开状态、读取旧存档时移除之后取得的事实、刷新后的聊天与剧情进度，以及从角色和 Story 进入播放器后返回原入口。
- 账号作用域回归覆盖切换账号、恢复账号期间的旧页面事件、访客旧存档与聊天分支之间的隔离。草稿测试覆盖同角色刷新后保留、不同角色隔离、显式发送只消费一次。
- 本轮浏览器使用本地站点。线上支付、真实模型回复及跨设备同步尚未验证。

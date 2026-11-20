# 角色与故事的展示和交互统一

任务 #156，继续 PR #157，保持未合并。用户认可角色先对话的方向，但指出角色与 Story 的布局、按钮颜色及反馈仍不一致。本轮以现有 Story 为基准，不增加功能。

## 最终改动

- 目录复用 Story 的 80 / 48 / 24px 边距、192 / 176 / 手机 128–148px 的 2:3 封面、12px 圆角、原阴影、标题与摘要尺度。保留貂蝉左图右文及渐变；banner 节奏、方角例句与下方探索标题对齐 Story。
- 详情共用 1200px（含 padding）容器、单一 56px 返回栏、240px 左封面与 40px 间距；窄桌面为 220 / 32，手机为 112 / 20。手机介绍和聊天在封面后满宽排列，真实 DOM 顺序为人物 → 介绍 → 聊天 → 原作片段，无 display:contents 或视觉专用重排。
- `story-surfaces.css` 同时作用于 Story 首页 / 详情、角色目录 / 详情：白主按钮、透明暗次按钮、例句选中、默认 / hover / active / 金色键盘焦点、44px 筛选与 48px 主要操作。白主按钮从 #fafafa 到 hover #e5e5e5、active #c8c8c8；分类仅用原站金色描边和 #303033 选中底色，不增加金底主操作。
- Story 出场角色与目录共用封面及 caption 规则：图文间距 16px、文字间距 6px、标题预留两行。保留真实出处及“可聊 / 故事出场”能力差别。
- 角色例句的 aria-pressed 随本设备待发送草稿变化，修改原句即清除旧选中态。状态绘制幂等，不重复写入相同属性或文字。原 draft 交接、账号 / 分支 / 来源及旧消息键未变。
- 线上复查发现首次进入角色时布局 CSS 晚于内容，会短暂跳动；将角色布局样式纳入初始 stylesheet ready，与 Story 一起等待后再展示。首次可见的封面已实测为正确 240×360，且只加载一份角色 CSS。

## 验证

- `npm run build` 通过。
- 完整 `npm run check`：**373 / 373**；包含本机 API 模拟器，无真实模型 / 支付调用。
- `npm run game:check`：副本最新；三份 CSS esbuild 解析 0 warning；`git diff --check` 通过。
- 独立复核发现并修复两点：角色 banner submit 遗漏共享选择器（手机会退回透明按钮）；Story cast 缺少与目录一致的 caption 容器。修后相关 25 项及目录 / Story 18 项通过。
- 旧测试中“没有探索标题”的断言已按新产品布局修正；未删除筛选、来源、草稿或作用域检查。新增断言覆盖例句选中、同步保留、编辑清除和真实阅读顺序。

## 实际浏览器操作

Chrome，1366×900 与 390×844，中英双语；本机视觉服务关闭 AI、登录及计费，拒绝 POST，不注入 DOM / 存档。

1. 角色目录保留貂蝉，筛选 33 → 13 → 33；选中实际为背景 rgb(48,48,51)、边框 rgb(212,168,83)，与 Story 分类一致，无横向溢出。
2. 角色 → 夏知遥 → 原 Story → 同一角色。桌面两边封面实测均 x304 / y88 / 240×360；手机均 x20 / y84 / 112×168。主按钮均 48px，#fafafa / #171717、相同 150ms 颜色过渡。
3. 手机中文聊天主操作位于约 334px，英文也在第一屏；长例句换行正常。选中例句显示白底和 pressed；打开原 chatId 仅见 Device draft · not sent，没有新发言或生成。清掉本次测试草稿后返回。
4. 暂不可聊人物保持真实故事入口和无聊天表单；既有行为回归继续通过。没有操控真实积分、远端配置或付费模型。

截图：

- [手机角色英文](assets/character-story-alignment-20261117/01-character-mobile-en.jpg)
- [手机故事英文](assets/character-story-alignment-20261117/02-story-mobile-en.jpg)
- [桌面角色目录](assets/character-story-alignment-20261117/03-character-directory-desktop.jpg)
- [桌面角色详情](assets/character-story-alignment-20261117/04-character-detail-desktop.jpg)
- [桌面故事详情](assets/character-story-alignment-20261117/05-story-detail-desktop.jpg)

## 边界

这是同一集成 Preview 的视觉与交互统一，没有合并或关闭任何 PR，没有改 game/、内容源、密钥或计费。夏知遥仍明确为 Demo；真实 Firebase 双账号 / 跨设备 / 模型质量和支付仍待独立测试环境。原生继续入口的 #158 限制不变。

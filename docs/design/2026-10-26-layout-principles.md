# StoryDate 首页：布局依据与预览验收

日期：2026-10-26。范围：首页的叙事入口、浏览工具和书架。PR #43；只更新分支预览。

用户喜欢现有深色质感、曹操场景和金白 Logo，但 Banner 与书架争抢注意力。此前增加硬分割线、放大裁切人物和强制整屏 Hero 的方向已被用户否定。本轮以已恢复的柔和渐变版本为基线，只调整信息分组、对齐、字号和操作尺寸。

## 阅读材料与证据边界

没有一篇论文能给出所有网站唯一正确的布局。下面分别列出可追溯的研究、标准和设计系统，以及我们据此作出的项目判断。

| 材料 | 实际查阅内容 | 在这里怎样使用 |
|---|---|---|
| Rosenholtz, Li & Nakano (2007), *Measuring Visual Clutter*, Journal of Vision, [DOI 10.1167/7.2.17](https://doi.org/10.1167/7.2.17) | 查阅了作者随论文发布的 [Feature Congestion 代码说明](https://github.com/ArturoDeza/Piranhas/blob/1577e4f1cd75bce9f8e4a1b99db44b5f88553d11/MATLAB/denseClutterFunctions/Feature_Congestion/ReadMe.m)，没有取得论文全文。说明涉及颜色、对比度和方向变化对视觉杂乱度的度量。 | 降低同一区域里同时争夺注意力的控件数量；保持已有色彩，不新增装饰线。本轮没有运行论文的计算模型，不能声称杂乱度分数下降了多少。 |
| Aalto University UI 研究组 [Interface Metrics / AIM](https://github.com/aalto-ui/aim) | 查阅项目说明和指标定义，包括网格对齐、留白和 feature congestion。 | 统一 Hero、浏览工具、书架标题与封面的起始边线。留白用于分组；不是留白越多越好，也不把 AIM 指标当审美评分。 |
| I. Scott MacKenzie (2018), *Fitts’ Law*, 第 17 章，*The Wiley Handbook of Human Computer Interaction* | 阅读公开的[章节文本提取稿](https://github.com/Eduard007Munteanu/Master_Project_Thesis_3DUI/blob/e17a745a296a7baa21899720ac8edc24065f1cd5/Thesis_Latex/references/Fitts%20Law.pdf.md)中对目标距离、宽度与选择时间的说明。不是直接读取 Fitts 1954 原始论文。 | 高频操作保留足够大的点击区域；开始章节按钮统一 48px 高。48px 是本项目选择，公式不推导出这个固定值，也不证明折叠题材一定更快。 |
| Google Material 官方 [Typography](https://github.com/material-components/material-web/blob/main/docs/theming/typography.md)、[Buttons](https://github.com/material-components/material-web/blob/main/docs/components/button.md) | 阅读官方源码文档中的语义字号角色与按钮强调层级。 | 引文、段落、书架标题、书名、说明分别使用稳定字号与行高；白色实心按钮承载“开始第一章”，选项卡保持较低强调。保留现有字体，不引入 Material 组件库。 |
| W3C WCAG 2.2：[信息和关系](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html)、[目标尺寸最低要求](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)、[对比度最低要求](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)、[焦点不被遮挡](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) | 阅读 [w3c/wcag 官方仓库](https://github.com/w3c/wcag/tree/main/understanding)对应 Understanding 源文档。 | 原生 select 有可访问名称、键盘操作和可见焦点。普通正文最低对比度基准为 4.5:1；目标尺寸 AA 是 24×24 CSS px 或满足间距等例外条件，不是“一律必须 44px”。本轮浏览控件采用 44px、主按钮 48px；没有完成全站 WCAG 合规审计。 |

部分原站受当前网络限制，因此读取了官方 GitHub 源码文档及上述公开研究材料。没有用营销文章替代论文结论，也没有声称读过无法取得的全文。

## 本站采用的布局规则

1. **先读场景，再行动，再浏览。** 引文是文案焦点，场景选择和输入框组成一个操作组；主按钮保持最明确的操作强调。下方书架通过原有渐变和适量空间衔接，不加新分割线，不裁切或重新压暗曹操。
2. **同组靠近，不同任务分开。** 原来同一排混有 4 个浏览模式和 12 种题材。本轮保留 4 个浏览入口，把题材放进“按题材浏览”原生选择器。每个题材仍触发原来的分类逻辑。这样增加了一次展开操作，是减少首屏控件拥挤与题材直达效率之间的取舍，需要用户反馈验证。
3. **一条起始线贯穿页面。** 桌面大屏内容侧边距 80px，小桌面 48px，手机/平板 24px；Hero 文案、分类工具、书架标题、第一张封面共享这条线。封面横向浏览的后续内容可以越出视口，但页面本身不能横向溢出。
4. **字号表达内容角色。** 桌面引文 36px、小桌面 30px、手机 28px；书架标题 20/18px；书名 16/15px；说明 13/12px。书名最多两行并保留一致高度，避免下方信息上下跳动。次要文字为 `#A1A1A1`，主文案沿用页面白色。
5. **间距重复出现。** 使用 4、8、12、16、24、32、48、64px 的间距档位，卡片内紧、书架之间松。这是便于一致执行的设计约定，不是科学证明的唯一数列。
6. **小屏保留可读封面。** 手机封面从约 93–117px 调整为 128–148px 的范围，允许一排展示更少、但更清楚的作品；继续原生横滑。电脑常规屏保持 192px 封面。

Logo、人物图片、剧情、推荐排序、书目数据及语言控件位置不在本轮调整范围。分类项保持中英文翻译和稳定的内部分类标识。

## 验证记录

基线为上一版柔和渐变首页。Chromium 实际 DOM 测量，单位 CSS px；两种语言分别验证。

| 视口宽度 | 调整前：文案 / 标题 / 首封面左边线 | 调整后：文案 / 标题 / 首封面左边线 | 调整后封面宽度 |
|---|---|---|---|
| 1440 | 335.19 / 336 / 336 | 336 / 336 / 336 | 192 |
| 1024 | 312.31 / 336 / 336 | 304 / 304 / 304 | 176 |
| 390 | 24 / 16 / 16 | 24 / 24 / 24 | 140.39 |
| 320 | 24 / 16 / 16 | 24 / 24 / 24 | 128 |

- 四种尺寸、中英文均无页面横向溢出；主按钮 48px，4 个浏览入口均至少 44px 高。
- 分类自动化验证覆盖题材选择、原有分类结果、返回精选及中英文稳定标识。额外浏览器验证覆盖全部 12 种题材、键盘选择和选中状态下切换语言。
- 构建及 134 项现有回归检查通过。
- 这些是结构和功能检查，不是眼动实验、转化率实验或“吸引力提高”的实测结果。

## 预览与下一步观察

- [新版首页](https://storydate-zhou-git-codex-sidebar-bra-e69e4f-zhou-zeyas-projects.vercel.app/)
- [本轮调整前的布局对照](https://storydate-zhou-git-codex-sidebar-bra-e69e4f-zhou-zeyas-projects.vercel.app/?layout=baseline)

验收重点：第一眼能否理解场景、能否明确知道如何开始、浏览题材是否好找。后续可让新用户完成“开始第一章”和“找一本指定题材作品”两个任务，观察第一次操作、找书时间和误点，再决定是否保留题材折叠。

# 汐川第一批美术验收（#112 / PR #114，依赖 #113）

- 正式清单：`claude/xichuan` 提交 49078fe，三位女主各四张、六个背景各两张，共 24 张。原清单与输入快照 SHA-256 一致；没有改人物/剧情/清单提示词。
- 内置工具实际生成并保留全部原始 PNG；24 张当前候选 + 3 张 superseded 修订初稿。原图字节与工具文件一致，提交 prompt 包含原 prompt / negative_prompt 原文。
- 立绘全部 1024×1536、RGBA，透明像素比例和 Alpha 范围记录在 generation.json；网页无损 WebP 的 Alpha 直方图与原图一致。背景均 1672×941，网页仅编码。未裁切/缩放，不宣称已达正式目标输出尺寸。
- 视觉预审：已查看全套实际成图；夏知遥 A 的全身机位和放映室 A 的室内窗景/投影方向问题已修订，初稿保留并从选图页排除。当前图片仍需用户/Claude 按作者 accept 决定采用，技术通过不等于正式采用。
- 网站构建和 185 项检查通过；`sync-game.mjs --check` 通过，只读检查，没有同步或重建正式图片。
- 当前 xichuan 剧本 3000 次模拟 PASS、无阻断问题；有原有未覆盖节点/关系变化较少的 WARN，本次不改内容来消除这些提醒。
- 电脑/手机 × 中文/英文共 4 组真实浏览器流程：全部 24 张预览解码/尺寸、透明底切换、放大与 Escape、9 项选图与刷新持久化、清单导出、人物/背景叠放、对白留白开关、语言切换、无横向溢出与其他存储未改均通过；零 API/POST 请求。见 `browser-results.json` 和附图。
- 与 PR #113 的差异只限 Codex 候选、独立审图页面/记录和自己的进度行；不改 Claude 源文件及生成页面。本次没有运行 build.py 或 game:sync。

页面 `/assets/art-review/xichuan-batch1/index.html`，仅用于审图。完整原图、单张说明和修订史见 `game/xichuan/art/candidates/batch1/README.md`。线上部署复核在 PR 中另记。

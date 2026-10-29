# 修复三国经典版语言继承，并补齐网站存档与跨卷接入回归

进入经典三章时，网站原先把语言写进新版的 `campaign.settings`，经典版读取 `settings`，导致 `?edition=classic&lang=en` 和全站 EN 仍显示中文。现在按版本写入正确设置，保留其他设置和存档。

新增经过网站 iframe 和账号存储桥接的测试，覆盖首页选项、刷新续玩、插画/水墨共享进度、旧存档迁移、跨卷结局继承和切换账号后的迟到写入。没有修改 Claude 的内容、引擎或 PR #73 / #75 正在改的文件，Claude 不需要跟着改；请其确认八卷接入验证范围即可。

验证：主干构建和 151 项检查通过；对内容提交 `6f359c96d3dd717dc74fbf4fd9ca43838edca364` 的独立八卷构建运行 21 项接入检查，全部通过；Chromium 电脑/手机共 22 项通过。实际 Firebase 云同步、线上模型和付费未测。

详细记录与截图见 `ooc-replica/docs/verification/2026-10-29-sanguo-site-acceptance/README.md`。

Vercel Preview：待核实部署后填写。这个 PR 基于 main 的六卷网站；八卷是独立构建兼容验证，不在此 PR 合并内容。

关联 issue：GitHub API 403，issue 尚未创建；创建后在此填真实 `Closes #编号`。

仅供 review，等待用户明确说“合并”。

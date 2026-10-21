# 同状态条款弹窗截图比较

REA 6.4.0 对真实原站和新部署的两张截图进行了本地像素比较。输入图像尺寸均为 1363×936，同轮播与条款弹窗状态。原站条款弹窗仍遮挡页面。本结果只能说明这一被遮挡截图状态的逐像素差异，不能作为全站无遮挡还原度、完整页面一致性或功能一致性分数。

原文件虽以 `.png` 命名，实际编码均为 JPEG。REA 原样拒绝 `Invalid PNG signature`，保留在 `terms-compare.evidence.json`。随后完整解码为 RGB，再无损编码为标准 PNG；没有缩放、裁剪、修图或配准。转换与源文件完整性见 `terms-comparison-provenance.json`，两张 PNG 的自验证内容位于 `*.normalized.artifact.json`。由于原始截图经过 JPEG 压缩，阈值 0 的微小像素差异也包含压缩噪声，不能直接等同于 UI 误差面积。

| REA 比较设置 | 结果 |
| --- | --- |
| 严格阈值 0 | 325,081 / 1,275,768 像素变化，25.4812% |
| 容差阈值 8 | 9,032 / 1,275,768 像素变化，0.7080% |
| 最大通道差值 | 163 / 255 |
| 平均绝对通道差值 | 0.455520 / 255 |

阈值 8 是补充观察，用于查看大于 8 的通道差异；不能解释为官方相似度或准确率。截图背景、遮挡区域及动态内容都会影响统计。REA 不做 OCR、感知评分、语义布局分析或颜色校正。

严格比较 Evidence：`ev_32bb031dbc84c2778c295d007acfe6a74d5719155450b3689c13a06e7c0898d8`，完整记录 `terms-normalized-compare.evidence.json`，提取指标 `terms-compare.diff.json`。

容差比较 Evidence：`ev_5e71a1186f0d45e859b4fb1c0ec2a47fc25c13694ef25fc8024aa73cc694b264`，完整记录 `terms-threshold8-compare.evidence.json`，提取指标 `terms-threshold8-compare.diff.json`。

命令：

```bash
node runtime/node_modules/rea-agents/scripts/rea.mjs compare-web-screenshots ooc-reference-terms.normalized.artifact.json ooc-replica-terms.normalized.artifact.json --format json
node runtime/node_modules/rea-agents/scripts/rea.mjs compare-web-screenshots ooc-reference-terms.normalized.artifact.json ooc-replica-terms.normalized.artifact.json --channel-threshold 8 --format json
```

# 卷八《归晋》候选评审

已交 0/21 项、0 张原图，每项目标 A/B 两张及相应 1200×480 导出。

来源：Claude 的 PR #70，清单提交 `28a2fe9fb5cf586c8bbba016424803b573afae24`。原始清单未改，完整 prompt / negative_prompt 原文保存在生成记录。

参考处理：pending user answer; generation must not start

模型：ChatGPT 自带 image_gen.imagegen，底层模型名称与 seed 未公开；没有调用按张付费图片 API。原图字节保留，ImageMagick 只做已获用户许可的几何裁切与缩放。最终采用请 Claude 审图。

[卷七头像与场景评审](../v7-review/README.md) · [需要 Claude 处理的源清单问题](source-problems.md)

## A/B 对比

| id | A | B | 进度 |
|---|---|---|---|
| scene-v8_hearse | — | — | 等用户许可临时画风参考 |
| scene-v8_weiyan | — | — | 等新头像采用、补齐正式参考 |
| scene-v8_return | — | — | 等用户许可临时画风参考 |
| scene-v8_gate | — | — | 等 Claude 统一温芷年龄 |
| scene-v8_oldman | — | — | 等新头像采用、补齐正式参考 |
| scene-v8_simayi_letter | — | — | 等用户许可临时画风参考 |
| scene-v8_wz_last | — | — | 等用户许可临时画风参考 |
| scene-v8_heir | — | — | 等用户许可临时画风参考 |
| scene-v8_fan | — | — | 等新头像采用、补齐正式参考 |
| scene-v8_duangu | — | — | 等新头像采用、补齐正式参考 |
| scene-v8_jiangwei_night | — | — | 等新头像采用、补齐正式参考 |
| scene-v8_healer | — | — | 等用户许可临时画风参考 |
| scene-v8_huanghao | — | — | 等新头像采用、补齐正式参考 |
| scene-v8_jiange | — | — | 等新头像采用、补齐正式参考 |
| scene-v8_yinping | — | — | 等用户许可临时画风参考 |
| scene-v8_mianzhu | — | — | 等用户许可临时画风参考 |
| scene-v8_beidi | — | — | 等用户许可临时画风参考 |
| scene-v8_temple | — | — | 等用户许可临时画风参考 |
| scene-v8_zhonghui | — | — | 等新头像采用、补齐正式参考 |
| scene-v8_lebu | — | — | 等用户许可临时画风参考 |
| scene-v8_end | — | — | 等 Claude 统一尾声接班人年龄 |

评审页路径：`/assets/art-v8/index.html`。当前环境仍对 GitHub API 返回代理 403；分支可推送，但 issue 留言、新 PR 和 Vercel Preview 均不能假定已创建。未合并或上线。

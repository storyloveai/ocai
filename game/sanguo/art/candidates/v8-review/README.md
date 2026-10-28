# 卷八《归晋》候选评审

已交 1/21 项、2 张原图，每项目标 A/B 两张及相应 1200×480 导出。

来源：Claude 的 PR #71（叠在 #70 上），清单提交 `326e33f0f33e0df0e5e8477a54bc2de4376b9424`。原始清单未改，完整 prompt / negative_prompt 原文保存在生成记录。

参考处理：No replacement references authorized or used. Use adopted references from PR #71; missing scene references wait for adoption.

模型：ChatGPT 自带 image_gen.imagegen，底层模型名称与 seed 未公开；没有调用按张付费图片 API。原图字节保留，ImageMagick 只做已获用户许可的几何裁切与缩放。最终采用请 Claude 审图。

[卷七头像与场景评审](../v7-review/README.md) · [需要 Claude 处理的源清单问题](source-problems.md)

## A/B 对比

| id | A | B | 进度 |
|---|---|---|---|
| scene-v8_hearse | — | — | 等卷七相应场景采用为正式参考 |
| scene-v8_weiyan | — | — | 等 Claude 统一魏延相貌服色，并采用卷七参考 |
| scene-v8_return | — | — | 等卷七相应场景采用为正式参考 |
| scene-v8_gate | — | — | 等 Claude 统一温芷年龄 |
| scene-v8_oldman | — | — | 等卷七相应场景采用为正式参考 |
| scene-v8_simayi_letter | — | — | 等卷七相应场景采用为正式参考 |
| scene-v8_wz_last | <a href="https://raw.githubusercontent.com/storyloveai/ocai/5b29ce47aa465f95bce255a5565387c7b79b187b/game/sanguo/art/candidates/scene-v8_wz_last/a.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/5b29ce47aa465f95bce255a5565387c7b79b187b/game/sanguo/art/candidates/scene-v8_wz_last/a-1200x480.png" width="240" height="96" alt="scene-v8_wz_last A"></a><br>白发温芷在灯下把针凑近眼前补衣，子衡背影靠在右侧床上醒着。 | <a href="https://raw.githubusercontent.com/storyloveai/ocai/5b29ce47aa465f95bce255a5565387c7b79b187b/game/sanguo/art/candidates/scene-v8_wz_last/b.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/5b29ce47aa465f95bce255a5565387c7b79b187b/game/sanguo/art/candidates/scene-v8_wz_last/b-1200x480.png" width="240" height="96" alt="scene-v8_wz_last B"></a><br>金簪白梅仍在白发高髻上，温芷坐在右侧补衣，子衡背影留在左侧床榻。 | 待 Claude 审图 |
| scene-v8_heir | — | — | 等卷七相应场景采用为正式参考 |
| scene-v8_fan | — | — | 等卷七相应场景采用为正式参考 |
| scene-v8_duangu | — | — | 等 Claude 统一血污与禁止血的矛盾 |
| scene-v8_jiangwei_night | — | — | 等卷七相应场景采用为正式参考 |
| scene-v8_healer | — | — | 等卷七相应场景采用为正式参考 |
| scene-v8_huanghao | — | — | 等卷七相应场景采用为正式参考 |
| scene-v8_jiange | — | — | 等卷七相应场景采用为正式参考 |
| scene-v8_yinping | — | — | 等卷七相应场景采用为正式参考 |
| scene-v8_mianzhu | — | — | 等卷七相应场景采用为正式参考 |
| scene-v8_beidi | — | — | 等卷七相应场景采用为正式参考 |
| scene-v8_temple | — | — | 等卷七相应场景采用为正式参考 |
| scene-v8_zhonghui | — | — | 等卷七相应场景采用为正式参考 |
| scene-v8_lebu | — | — | 等卷七相应场景采用为正式参考 |
| scene-v8_end | — | — | 等 Claude 统一尾声接班人年龄 |

评审页路径：`/assets/art-v8/index.html`。新候选推到现有草稿 [#72](https://github.com/storyloveai/ocai/pull/72)，不合并。当前环境仍对 GitHub API 返回代理 403，逐批 #68 留言不能自动提交，草稿随分支交付。

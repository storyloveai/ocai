# 卷八清单与参考状态（更新至 PR #71）

上一批17项已由 Claude 在 #71 采用，新头像已齐。不再等待用户许可临时参考；本轮不用替代参考，不用尚未采用的候选。

## 仍需 Claude 处理

- 卷七本轮候选 v7_last、v7_jiangwei、v7_weiyan 尚待 Claude 采用；卷八多数任务引用这三张正式场景，不能直接拿未采用候选替换。
- scene-v8_gate：keep 与 prompt 开头为六十多岁，composition 与 prompt 后半为五十多岁；请统一单场景年龄。
- scene-v8_weiyan：清单的 heavily bearded / 浓须、black/dark armor 与已采用魏延短须暗红甲有冲突。请明确与正式头像如何对齐。
- scene-v8_duangu：composition / prompt 仍写血污 / blood-stained，negative_prompt 禁 blood；用户明确要求不画伤口、血腥、自杀。请统一清单。
- scene-v8_end：keep 仍为接班人30–50岁，prompt/composition要老人；剧情 c8_end 为53岁或近70岁。请统一单场景年龄。

## 每条状态

| id | 缺失正式参考 | 等待条件 |
|---|---|---|
| scene-v8_hearse | game/sanguo/art/scenes/v7_last.webp | missing_adopted_scene_reference |
| scene-v8_weiyan | game/sanguo/art/scenes/v7_weiyan.webp | conflicting_weiyan_identity_and_missing_reference |
| scene-v8_return | game/sanguo/art/scenes/v7_last.webp | missing_adopted_scene_reference |
| scene-v8_gate | 无 | conflicting_wenzhi_age |
| scene-v8_oldman | game/sanguo/art/scenes/v7_jiangwei.webp | missing_adopted_scene_reference |
| scene-v8_simayi_letter | game/sanguo/art/scenes/v7_last.webp | missing_adopted_scene_reference |
| scene-v8_wz_last | 无 | 参考已齐，可在前两批完成后生成 |
| scene-v8_heir | game/sanguo/art/scenes/v7_last.webp | missing_adopted_scene_reference |
| scene-v8_fan | game/sanguo/art/scenes/v7_jiangwei.webp | missing_adopted_scene_reference |
| scene-v8_duangu | game/sanguo/art/scenes/v7_jiangwei.webp | conflicting_blood_constraint |
| scene-v8_jiangwei_night | game/sanguo/art/scenes/v7_jiangwei.webp | missing_adopted_scene_reference |
| scene-v8_healer | game/sanguo/art/scenes/v7_last.webp | missing_adopted_scene_reference |
| scene-v8_huanghao | game/sanguo/art/scenes/v7_jiangwei.webp | missing_adopted_scene_reference |
| scene-v8_jiange | game/sanguo/art/scenes/v7_jiangwei.webp | missing_adopted_scene_reference |
| scene-v8_yinping | game/sanguo/art/scenes/v7_last.webp | missing_adopted_scene_reference |
| scene-v8_mianzhu | game/sanguo/art/scenes/v7_last.webp | missing_adopted_scene_reference |
| scene-v8_beidi | game/sanguo/art/scenes/v7_last.webp | missing_adopted_scene_reference |
| scene-v8_temple | game/sanguo/art/scenes/v7_last.webp | missing_adopted_scene_reference |
| scene-v8_zhonghui | game/sanguo/art/scenes/v7_jiangwei.webp | missing_adopted_scene_reference |
| scene-v8_lebu | game/sanguo/art/scenes/v7_last.webp | missing_adopted_scene_reference |
| scene-v8_end | game/sanguo/art/scenes/v7_last.webp | conflicting_successor_age |

上述问题已保存在分支供 Claude review；GitHub API 仍403，尚未作为 #68 留言提交。原始清单没有改。

# 卷八参考与清单问题（给 Claude）

来源：PR #70 / claude/sanguo-v8 / 28a2fe9fb5cf586c8bbba016424803b573afae24。21 条均缺少所列的卷七画风参考；未改作者清单。

- v7_last.webp、v7_child.webp、v7_jiangwei.webp、v7_weiyan.webp 尚不存在。姜维、魏延正式头像也未采用。
- scene-v8_gate：keep 与 prompt 的开头为六十多岁，composition 与 prompt 后半为五十多岁。请统一年龄。
- scene-v8_weiyan：虽无 after，仍缺魏延正式头像与上一场景；还与 #68 的短须要求不一致（本清单写 heavily bearded / 浓须）。请确认采用后的相貌。
- scene-v8_duangu：composition/prompt 写浑身血污 / blood-stained，而 accept/negative_prompt 禁止血。请统一为无血的衣甲尘土等表现。
- scene-v8_end：keep 接班人 30–50 岁，prompt/composition 要老年，剧情节点 c8_end 为 53 或近 70 岁。请统一这条单场景年龄。

对其余 11 条已准备使用 main 上已采用图的临时画风参考映射，等待用户明确许可；不会擅自改原始 ref_paths，也不会把未采用的新头像候选充当正式参考。

GitHub API 仍返回代理 403，本说明尚未作为 issue 留言提交。

# 四类命运图候选（#96）

基于 main `1b1552a`，接续 Claude 已合并的 #93。所有图片仍是候选，正式游戏/清单状态不变。

每项 A/B 两张：原始 PNG、1200×480 WebP、逐张 `*-generation.json`。四条清单的 prompt / negative_prompt / keep / composition / accept 保留原文，所有 ref_paths 均作为参考传入；未更改 `art/fate-jobs.jsonl`。

| 条目 | A | B |
|---|---|---|
| fate-execute | 雨中押送，刀影较明显 | 更远镜头；刀影较轻，需重点审 |
| fate-jail | 左墙刻痕与高窗月光 | 右手刻痕、牢门和冷光纵深 |
| fate-exile | 山城晨雾，人物和整匹马保留 | 城门守望者与牵马背影 |
| fate-wounded | 肩部绷带较清楚，灯下调药 | 更开阔的帐内暖光 |

初步推荐 **被斩 A、下狱 B、被逐出 B、负伤 A**，仅作比较建议，不代表采用。最终仍需审刀影、横幅构图和整套画风。

- [全部生成与裁切记录](generation.json)
- [原始任务输入快照](input-snapshot.json)
- [卷八年龄后续核对](AGE-REVIEW.md)
- 线上审图页：`/assets/art-review/fates/index.html`。页面支持双语、完整构图、A/B 选择与选择文本整理；选择仅保存在浏览器，不自动写回 GitHub 或采用图片。

工具为内置 `image_gen.imagegen`，模型版本未暴露；无外部按张收费图片 API。共 11 次生成/修订，8 张交审候选；3 张初稿保留于各条目 `superseded/`。被斩 B 初稿刀影不足；逐出初稿存在额外远处人影、主体过大，随后重新生成。

原始 PNG 保持字节不变。横幅按记录的矩形裁切为严格 5:2，再导出 1200×480；完整构图网页图仅转 WebP。网页候选副本在 `ooc-replica/dist/assets/candidates/fates/`，未放入正式 `art/fate/` 或网站正式三国图目录。

未运行 `build.py` 或 `game:sync`。只读缺图审计通过：八卷正式场景缺图 0，命运图仍显示 4 项待画/采用（符合候选未采用的现状）。

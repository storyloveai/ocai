# 卷七及留任结局 · 候选评审

已交 3/29 项、6 张原图，每项目标两张。

工具：ChatGPT 自带 image_gen.imagegen，底层模型名称和 seed 未公开。没有调用按张付费的 OpenAI 图片 API。每张 PNG 原图保持工具返回的原始字节，JSON 保存完整清单原文、实际提示词、参考图及哈希。

用户已明确要求同时交原图和裁切版。300×400 头像和 1200×480 横幅为 ImageMagick 几何裁切/缩放导出，未重绘、未添加文字水印；裁切坐标、工具和哈希均记录在 JSON 中。未放入正式 portraits/scenes/ending，未改清单或剧情，未运行 build.py / game:sync。

三张头像必须由 Claude 采用后，才画带 after 的六个场景，并加入已采用头像。第3批按顺序排在第2批之后，其中 v7_city 也等姜维头像采用。不要把未采用的候选擅自当作新人物参考。

评审页：`/assets/art-v7/index.html`。PR 保持 Preview，不合并。

## 第1批头像对比：请 Claude 每人选 A 或 B

| 角色 | A · 300×400 | B · 300×400 |
|---|---|---|
| portrait-jiangwei | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/portrait-jiangwei/a.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/portrait-jiangwei/a-300x400.png" width="150" height="200" alt="portrait-jiangwei A"></a> | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/portrait-jiangwei/b.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/portrait-jiangwei/b-300x400.png" width="150" height="200" alt="portrait-jiangwei B"></a> |
| portrait-simayi | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/portrait-simayi/a.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/portrait-simayi/a-300x400.png" width="150" height="200" alt="portrait-simayi A"></a> | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/portrait-simayi/b.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/portrait-simayi/b-300x400.png" width="150" height="200" alt="portrait-simayi B"></a> |
| portrait-weiyan | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/portrait-weiyan/a.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/portrait-weiyan/a-300x400.png" width="150" height="200" alt="portrait-weiyan A"></a> | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/portrait-weiyan/b.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/portrait-weiyan/b-300x400.png" width="150" height="200" alt="portrait-weiyan B"></a> |

## 三批进度

| 项目 | 进度 | 等待条件 |
|---|---|---|
| portrait-jiangwei | 2/2 | Claude 审图 |
| portrait-simayi | 2/2 | Claude 审图 |
| portrait-weiyan | 2/2 | Claude 审图 |
| scene-v7_biao | 0/2 | Claude 审图 |
| scene-v7_child | 0/2 | Claude 审图 |
| scene-v7_houzhu | 0/2 | Claude 审图 |
| scene-v7_weiyan | 0/2 | 等三张新头像由 Claude 采用，再加入采用的头像参考 |
| scene-v7_jiangwei | 0/2 | 等三张新头像由 Claude 采用，再加入采用的头像参考 |
| scene-v7_wanglang | 0/2 | Claude 审图 |
| scene-v7_jieting | 0/2 | Claude 审图 |
| scene-v7_hill | 0/2 | Claude 审图 |
| scene-v7_kongcheng | 0/2 | Claude 审图 |
| scene-v7_masu | 0/2 | Claude 审图 |
| scene-v7_jiangwei_night | 0/2 | 等三张新头像由 Claude 采用，再加入采用的头像参考 |
| scene-v7_zilong | 0/2 | Claude 审图 |
| scene-v7_old | 0/2 | Claude 审图 |
| scene-v7_feud | 0/2 | 等三张新头像由 Claude 采用，再加入采用的头像参考 |
| scene-v7_student | 0/2 | Claude 审图 |
| scene-v7_shangfang | 0/2 | Claude 审图 |
| scene-v7_envoy | 0/2 | 等三张新头像由 Claude 采用，再加入采用的头像参考 |
| scene-v7_lamp | 0/2 | Claude 审图 |
| scene-v7_last | 0/2 | 等三张新头像由 Claude 采用，再加入采用的头像参考 |
| scene-v7_home | 0/2 | Claude 审图 |
| ending-v2_city | 0/2 | 按用户要求，排在第2批之后 |
| ending-v3_city | 0/2 | 按用户要求，排在第2批之后 |
| ending-v4_city | 0/2 | 按用户要求，排在第2批之后 |
| ending-v5_city | 0/2 | 按用户要求，排在第2批之后 |
| ending-v6_city | 0/2 | 按用户要求，排在第2批之后 |
| ending-v7_city | 0/2 | 等姜维头像采用，并按顺序完成第2批 |

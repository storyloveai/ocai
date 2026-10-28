# 卷七及留任结局 · 候选评审

已交 17/29 项、34 张原图，每项目标两张。

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
| scene-v7_biao | 2/2 | Claude 审图 |
| scene-v7_child | 2/2 | Claude 审图 |
| scene-v7_houzhu | 2/2 | Claude 审图 |
| scene-v7_weiyan | 0/2 | 等三张新头像由 Claude 采用，再加入采用的头像参考 |
| scene-v7_jiangwei | 0/2 | 等三张新头像由 Claude 采用，再加入采用的头像参考 |
| scene-v7_wanglang | 2/2 | Claude 审图 |
| scene-v7_jieting | 2/2 | Claude 审图 |
| scene-v7_hill | 2/2 | Claude 审图 |
| scene-v7_kongcheng | 2/2 | Claude 审图 |
| scene-v7_masu | 2/2 | Claude 审图 |
| scene-v7_jiangwei_night | 0/2 | 等三张新头像由 Claude 采用，再加入采用的头像参考 |
| scene-v7_zilong | 2/2 | Claude 审图 |
| scene-v7_old | 2/2 | Claude 审图 |
| scene-v7_feud | 0/2 | 等三张新头像由 Claude 采用，再加入采用的头像参考 |
| scene-v7_student | 2/2 | Claude 审图 |
| scene-v7_shangfang | 2/2 | Claude 审图 |
| scene-v7_envoy | 0/2 | 等三张新头像由 Claude 采用，再加入采用的头像参考 |
| scene-v7_lamp | 2/2 | Claude 审图 |
| scene-v7_last | 0/2 | 等三张新头像由 Claude 采用，再加入采用的头像参考 |
| scene-v7_home | 2/2 | Claude 审图 |
| ending-v2_city | 0/2 | 按用户要求，排在第2批之后 |
| ending-v3_city | 0/2 | 按用户要求，排在第2批之后 |
| ending-v4_city | 0/2 | 按用户要求，排在第2批之后 |
| ending-v5_city | 0/2 | 按用户要求，排在第2批之后 |
| ending-v6_city | 0/2 | 按用户要求，排在第2批之后 |
| ending-v7_city | 0/2 | 等姜维头像采用，并按顺序完成第2批 |

## 卷七场景 A/B 对照

缩略图链接到未裁原图；精确尺寸导出和生成记录见评审页。

| 场景 | A · 1200×480 | B · 1200×480 |
|---|---|---|
| scene-v7_biao | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_biao/a.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_biao/a-1200x480.png" width="240" height="96" alt="scene-v7_biao A"></a><br>帐内暖灯下，诸葛亮持空白奏表，银发子衡背身在旁。 | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_biao/b.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_biao/b-1200x480.png" width="240" height="96" alt="scene-v7_biao B"></a><br>近景强调诸葛亮疲惫泛红的眼神，羽扇置于案侧。 |
| scene-v7_child | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_child/a.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_child/a-1200x480.png" width="240" height="96" alt="scene-v7_child A"></a><br>闻芷在梅树与药圃旁手扶腰腹，子衡背身相伴，没有婴童入画。 | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_child/b.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_child/b-1200x480.png" width="240" height="96" alt="scene-v7_child B"></a><br>暮色庭院里，闻芷的白梅发饰与扶腰动作完整可见。 |
| scene-v7_houzhu | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_houzhu/a.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_houzhu/a-1200x480.png" width="240" height="96" alt="scene-v7_houzhu A"></a><br>青年刘禅在御座上托腮前倾，子衡背身躬身于前。 | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_houzhu/b.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_houzhu/b-1200x480.png" width="240" height="96" alt="scene-v7_houzhu B"></a><br>暖光侧照刘禅黑红朝服，空旷殿堂中两人相对。 |
| scene-v7_wanglang | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_wanglang/a.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_wanglang/a-1200x480.png" width="240" height="96" alt="scene-v7_wanglang A"></a><br>王朗在马上捂胸，诸葛亮在四轮小车中举扇，两军隔阵相对。 | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_wanglang/b.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_wanglang/b-1200x480.png" width="240" height="96" alt="scene-v7_wanglang B"></a><br>平原夕照下，王朗骑黑马近景捂胸，诸葛亮坐车举扇应对。 |
| scene-v7_jieting | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_jieting/a.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_jieting/a-1200x480.png" width="240" height="96" alt="scene-v7_jieting A"></a><br>马谡完整跪姿呈上无字军令，诸葛亮持扇迟疑，诸将在后观望。 | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_jieting/b.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_jieting/b-1200x480.png" width="240" height="96" alt="scene-v7_jieting B"></a><br>帐中马谡双膝跪地举起空白军令，诸葛亮持扇沉思，诸将神色凝重。 |
| scene-v7_hill | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_hill/a.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_hill/a-1200x480.png" width="240" height="96" alt="scene-v7_hill A"></a><br>子衡与王平在坡下观察军队上山，前方士卒修筑低处防线。 | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_hill/b.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_hill/b-1200x480.png" width="240" height="96" alt="scene-v7_hill B"></a><br>山道从左侧向上延伸，银发子衡背影与坡下木垒相呼应。 |
| scene-v7_kongcheng | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_kongcheng/a.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_kongcheng/a-1200x480.png" width="240" height="96" alt="scene-v7_kongcheng A"></a><br>城楼上诸葛亮双手抚琴，子衡背身与两名成年侍从在旁，城门敞开，街上有人洒扫。 | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_kongcheng/b.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_kongcheng/b-1200x480.png" width="240" height="96" alt="scene-v7_kongcheng B"></a><br>俯瞰敞开的城门与洒扫街道，诸葛亮双手抚琴，子衡和两名成年侍从在城楼上。 |
| scene-v7_masu | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_masu/a.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_masu/a-1200x480.png" width="240" height="96" alt="scene-v7_masu A"></a><br>诸葛亮举袖掩泪，两名成年守卫押着被缚马谡离开。 | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_masu/b.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_masu/b-1200x480.png" width="240" height="96" alt="scene-v7_masu B"></a><br>马谡双腕被缚随守卫出帐，诸将低头，诸葛亮掩面。 |
| scene-v7_zilong | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_zilong/a.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_zilong/a-1200x480.png" width="240" height="96" alt="scene-v7_zilong A"></a><br>白发赵云卧床微笑，银枪置于床边，子衡背身探望。 | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_zilong/b.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_zilong/b-1200x480.png" width="240" height="96" alt="scene-v7_zilong B"></a><br>近景呈现赵云苍老的眉眼与银甲，子衡在床前倾身。 |
| scene-v7_old | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_old/a.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_old/a-1200x480.png" width="240" height="96" alt="scene-v7_old A"></a><br>灯下只显出老者的白须与相握的手，面容藏在阴影里。 | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_old/b.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_old/b-1200x480.png" width="240" height="96" alt="scene-v7_old B"></a><br>雪夜帐中匿名老将握住子衡的手，身份保持不可辨。 |
| scene-v7_student | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_student/a.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_student/a-1200x480.png" width="240" height="96" alt="scene-v7_student A"></a><br>成年年轻书佐双膝跪地，向背身而坐的银发子衡请教。 | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_student/b.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_student/b-1200x480.png" width="240" height="96" alt="scene-v7_student B"></a><br>低案旁书佐完整跪姿可见，空白册与笔砚放在两人之间。 |
| scene-v7_shangfang | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_shangfang/a.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_shangfang/a-1200x480.png" width="240" height="96" alt="scene-v7_shangfang A"></a><br>诸葛亮立于左侧山脊仰望暴雨，谷中火势被雨水和蒸汽压低。 | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_shangfang/b.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_shangfang/b-1200x480.png" width="240" height="96" alt="scene-v7_shangfang B"></a><br>右侧诸葛亮握白羽扇望天，湿透的上方谷中残火与白汽相间。 |
| scene-v7_lamp | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_lamp/a.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_lamp/a-1200x480.png" width="240" height="96" alt="scene-v7_lamp A"></a><br>七盏小灯完整围成斗形，一盏主灯受风偏焰；诸葛亮跪坐，门口来人保持逆光暗影。 | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_lamp/b.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_lamp/b-1200x480.png" width="240" height="96" alt="scene-v7_lamp B"></a><br>诸葛亮按胸跪坐，七盏小灯与一盏主灯完整可数，来人背影掀入冷风。 |
| scene-v7_home | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_home/a.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_home/a-1200x480.png" width="240" height="96" alt="scene-v7_home A"></a><br>黄昏山路上，一具封闭灵柩向成都而行，子衡背身持羽扇。 | <a href="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_home/b.png"><img src="https://raw.githubusercontent.com/storyloveai/ocai/codex/art-v7-endings/game/sanguo/art/candidates/scene-v7_home/b-1200x480.png" width="240" height="96" alt="scene-v7_home B"></a><br>送行队伍与无字白幡沿山道远去，子衡的银发与羽扇留在近景。 |

## 发布状态

分支已推送 GitHub。当前运行环境访问 api.github.com 被代理拒绝（HTTP 403），issue 认领留言与新 PR 尚未提交；这不代表已创建 PR 或已有可访问的 Vercel 部署。PR 草稿见同目录 PR-body.md。

Claude 请先在 #68 记录姜维、司马懿、魏延各采用 A 还是 B，并提供正式采用路径或采用提交。六个 after 场景放行后，再按顺序进入留任结局批次。

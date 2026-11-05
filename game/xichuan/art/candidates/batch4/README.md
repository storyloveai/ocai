# 汐川第四批 · 15项30张CG候选

8个关键时刻＋7个结局，每项两个候选。作者清单来自 claude/xichuan-art2 @ eecbf7930566e745037b4c5e1cab3999e01c61ce；jobs-snapshot.json逐字保留各条原字段。工作分支从最新main建立并已 git pull origin main，本PR以main为base，不夹带尚未合并#122的采用改动。

内置image_gen.imagegen生成，用户已确认本批用内置；未调用付费图片API。模型版本和seed未暴露。实际完整提示词与参考图见generation.json；角色标准立绘按ref_paths全部传入，references/及references.json保留当次输入快照和哈希。原始PNG不裁切、不放大，采用后的1920×1080由Claude处理。

## 审图

打开index.html并排看图，可显示下方三分之一对白遮罩。30张已逐组目检，主要动作、角色服装和主角背影/手部要求已核；白布右下异色补角已另打开原图确认。qa.json记录逐项关注点：七/八封信的数量及遮挡、手指与胶片接触、摘下的眼镜、投影光路、对白框覆盖后的动作区域仍请Claude采用前精审。候选不是自动采用稿。

## 验证

全部30张PNG解码、横幅比例、尺寸和SHA通过。按AGENTS.md跑三国生成/构建、八卷各5000次检查、严格插画审计、汐川生成/构建和3000次模拟、game:sync，全通过，日志附verification.log。保护的生成副本只由脚本生成。没有改作者剧本、播放页或决策记录，未放入正式CG路径，未合并或关闭旧PR。

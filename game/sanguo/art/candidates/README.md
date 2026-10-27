# 三国·谋士：场景原图候选

Issue #56 · PR #62。第二轮 31/33 场景，共 63 张新原图；第一轮 29 场景已由 Claude 通过 PR #65 采用。

预览：https://storydate-zhou-git-codex-art-candidates-zhou-zeyas-projects.vercel.app/assets/art-candidates/index.html

工具：ChatGPT 自带 image_gen.imagegen。底层模型名称和 seed 不由工具公开；未调用按张付费的 OpenAI 图片 API。所有 PNG 保留工具返回的原始字节，未裁图。每张旁的 JSON 保存清单原文、实际完整提示词、全部参考图及其哈希、尺寸和一句话说明。

第二轮使用 Claude PR #65 的固定提交 67361b46d8c60ec131c5e967f385f00220ad75e1；该 PR 已合并到 main。review-plan.json 是候选评审用的原文快照，不是游戏作图清单。补充的人物一致性参考（刘备老年形象、孟获等）也在各张记录中单独列明。

请 Claude 逐张审图，选择、裁成 1200×480、采用、同步网站由 Claude 处理；本分支只交候选，不改原作图清单、剧情或正式插画，不运行 build.py / game:sync。

庞德第一轮 A/B 被 Claude 否决，保留为历史；当前只审修正回射方向的 C/D，不把 A/B 计入当前候选数。

| 场景 | 状态 | 当前候选 |
|---|---|---|
| scene-v3_clinic | Claude 已采用 A | [A](scene-v3_clinic/a.png) / [B](scene-v3_clinic/b.png) |
| scene-v3_dingjun | Claude 已采用 B | [A](scene-v3_dingjun/a.png) / [B](scene-v3_dingjun/b.png) |
| scene-g_cold | Claude 已采用 B | [A](scene-g_cold/a.png) / [B](scene-g_cold/b.png) |
| scene-v3_dandao | Claude 已采用 A | [A](scene-v3_dandao/a.png) / [B](scene-v3_dandao/b.png) |
| scene-v2_chengdu | Claude 已采用 B | [A](scene-v2_chengdu/a.png) / [B](scene-v2_chengdu/b.png) |
| scene-v2_pangtong_night | Claude 已采用 A | [A](scene-v2_pangtong_night/a.png) / [B](scene-v2_pangtong_night/b.png) |
| scene-v3_letter | Claude 已采用 B | [A](scene-v3_letter/a.png) / [B](scene-v3_letter/b.png) |
| scene-v3_wakou | Claude 已采用 A | [A](scene-v3_wakou/a.png) / [B](scene-v3_wakou/b.png) |
| scene-v3_laozu | Claude 已采用 B | [A](scene-v3_laozu/a.png) / [B](scene-v3_laozu/b.png) |
| scene-v3_huniu | Claude 已采用 B | [A](scene-v3_huniu/a.png) / [B](scene-v3_huniu/b.png) |
| scene-v3_fire | Claude 已采用 B | [A](scene-v3_fire/a.png) / [B](scene-v3_fire/b.png) |
| scene-v3_far | Claude 已采用 A | [A](scene-v3_far/a.png) / [B](scene-v3_far/b.png) |
| scene-v3_guan_hall | Claude 已采用 A | [A](scene-v3_guan_hall/a.png) / [B](scene-v3_guan_hall/b.png) |
| scene-v3_report | Claude 已采用 B | [A](scene-v3_report/a.png) / [B](scene-v3_report/b.png) |
| scene-v3_guanping | Claude 已采用 A | [A](scene-v3_guanping/a.png) / [B](scene-v3_guanping/b.png) |
| scene-v3_wz_jing | Claude 已采用 B | [A](scene-v3_wz_jing/a.png) / [B](scene-v3_wz_jing/b.png) |
| scene-g_wounded | Claude 已采用 B | [A](scene-g_wounded/a.png) / [B](scene-g_wounded/b.png) |
| scene-v4_flood | Claude 已采用 B | [A](scene-v4_flood/a.png) / [B](scene-v4_flood/b.png) |
| scene-v4_feast | Claude 已采用 A | [A](scene-v4_feast/a.png) / [B](scene-v4_feast/b.png) |
| scene-v4_pow | Claude 已采用 A | [A](scene-v4_pow/a.png) / [B](scene-v4_pow/b.png) |
| scene-v4_bone | Claude 已采用 A | [A](scene-v4_bone/a.png) / [B](scene-v4_bone/b.png) |
| scene-v4_huatuo | Claude 已采用 A | [A](scene-v4_huatuo/a.png) / [B](scene-v4_huatuo/b.png) |
| scene-v4_luxun | Claude 已采用 A | [A](scene-v4_luxun/a.png) / [B](scene-v4_luxun/b.png) |
| scene-v4_retreat | Claude 已采用 B | [A](scene-v4_retreat/a.png) / [B](scene-v4_retreat/b.png) |
| scene-v4_shangyong | Claude 已采用 B | [A](scene-v4_shangyong/a.png) / [B](scene-v4_shangyong/b.png) |
| scene-v4_wz_letter | Claude 已采用 B | [A](scene-v4_wz_letter/a.png) / [B](scene-v4_wz_letter/b.png) |
| scene-v4_maicheng | Claude 已采用 B | [A](scene-v4_maicheng/a.png) / [B](scene-v4_maicheng/b.png) |
| scene-v4_west | Claude 已采用 A | [A](scene-v4_west/a.png) / [B](scene-v4_west/b.png) |
| scene-v4_news | Claude 已采用 A | [A](scene-v4_news/a.png) / [B](scene-v4_news/b.png) |
| scene-v4_zhuge_night | 2/2，待 Claude 审图 | [A](scene-v4_zhuge_night/a.png) / [B](scene-v4_zhuge_night/b.png) |
| scene-v4_pangde | 2/2，待 Claude 审图 | [C](scene-v4_pangde/c.png) / [D](scene-v4_pangde/d.png) |
| scene-v5_fazheng | 2/2，待 Claude 审图 | [A](scene-v5_fazheng/a.png) / [B](scene-v5_fazheng/b.png) |
| scene-v5_liufeng | 2/2，待 Claude 审图 | [A](scene-v5_liufeng/a.png) / [B](scene-v5_liufeng/b.png) |
| scene-v5_guan_arm | 2/2，待 Claude 审图 | [A](scene-v5_guan_arm/a.png) / [B](scene-v5_guan_arm/b.png) |
| scene-v5_emperor | 0/2，待 Claude 审图 | 待生成 |
| scene-v5_fei | 2/2，待 Claude 审图 | [A](scene-v5_fei/a.png) / [B](scene-v5_fei/b.png) |
| scene-v5_langzhong | 2/2，待 Claude 审图 | [A](scene-v5_langzhong/a.png) / [B](scene-v5_langzhong/b.png) |
| scene-v5_mourning | 2/2，待 Claude 审图 | [A](scene-v5_mourning/a.png) / [B](scene-v5_mourning/b.png) |
| scene-v5_jin | 2/2，待 Claude 审图 | [A](scene-v5_jin/a.png) / [B](scene-v5_jin/b.png) |
| scene-v5_huangzhong | 2/2，待 Claude 审图 | [A](scene-v5_huangzhong/a.png) / [B](scene-v5_huangzhong/b.png) |
| scene-v5_vanguard | 2/2，待 Claude 审图 | [A](scene-v5_vanguard/a.png) / [B](scene-v5_vanguard/b.png) |
| scene-v5_camps | 2/2，待 Claude 审图 | [A](scene-v5_camps/a.png) / [B](scene-v5_camps/b.png) |
| scene-v5_stream | 2/2，待 Claude 审图 | [A](scene-v5_stream/a.png) / [B](scene-v5_stream/b.png) |
| scene-v5_blade | 2/2，待 Claude 审图 | [A](scene-v5_blade/a.png) / [B](scene-v5_blade/b.png) |
| scene-v5_fire | 2/2，待 Claude 审图 | [A](scene-v5_fire/a.png) / [B](scene-v5_fire/b.png) |
| scene-v5_rearguard | 2/2，待 Claude 审图 | [A](scene-v5_rearguard/a.png) / [B](scene-v5_rearguard/b.png) |
| scene-v5_tuogu | 2/2，待 Claude 审图 | [A](scene-v5_tuogu/a.png) / [B](scene-v5_tuogu/b.png) |
| scene-v5_wz | 2/2，待 Claude 审图 | [A](scene-v5_wz/a.png) / [B](scene-v5_wz/b.png) |
| scene-v6_wu | 2/2，待 Claude 审图 | [A](scene-v6_wu/a.png) / [B](scene-v6_wu/b.png) |
| scene-v6_qinmi | 2/2，待 Claude 审图 | [A](scene-v6_qinmi/a.png) / [B](scene-v6_qinmi/b.png) |
| scene-v6_home | 2/2，待 Claude 审图 | [A](scene-v6_home/a.png) / [B](scene-v6_home/b.png) |
| scene-v6_tablet | 2/2，待 Claude 审图 | [A](scene-v6_tablet/a.png) / [B](scene-v6_tablet/b.png) |
| scene-v6_masu | 2/2，待 Claude 审图 | [A](scene-v6_masu/a.png) / [B](scene-v6_masu/b.png) |
| scene-v6_first | 2/2，待 Claude 审图 | [A](scene-v6_first/a.png) / [B](scene-v6_first/b.png) |
| scene-v6_zhuge_night | 2/2，待 Claude 审图 | [A](scene-v6_zhuge_night/a.png) / [B](scene-v6_zhuge_night/b.png) |
| scene-v6_lushui | 2/2，待 Claude 审图 | [A](scene-v6_lushui/a.png) / [B](scene-v6_lushui/b.png) |
| scene-v6_mengyou | 2/2，待 Claude 审图 | [A](scene-v6_mengyou/a.png) / [B](scene-v6_mengyou/b.png) |
| scene-v6_spring | 2/2，待 Claude 审图 | [A](scene-v6_spring/a.png) / [B](scene-v6_spring/b.png) |
| scene-v6_rattan | 2/2，待 Claude 审图 | [A](scene-v6_rattan/a.png) / [B](scene-v6_rattan/b.png) |
| scene-v6_wz_burns | 2/2，待 Claude 审图 | [A](scene-v6_wz_burns/a.png) / [B](scene-v6_wz_burns/b.png) |
| scene-v6_seventh | 1/2，待 Claude 审图 | [A](scene-v6_seventh/a.png) |
| scene-v6_offering | 2/2，待 Claude 审图 | [A](scene-v6_offering/a.png) / [B](scene-v6_offering/b.png) |

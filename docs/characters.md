# 九位角色配置

原有 Lara Croft、蒂法、春丽保留。本次按照用户最新六张图新增不知火舞、峰不二子、娜美、妮可·罗宾、波雅·汉库克、弥海砂，取消未发布的远坂凛配置。

| ID | 人物 | 性格与动机 | 首次相遇 |
|---|---|---|---|
| lara | Lara Croft | 独立、机智、求知，谨慎探险 | 雨夜营地 |
| tifa | 蒂法 | 温柔、坚定，认真倾听、有行动力 | Seventh Heaven |
| chunli | 春丽 | 成熟、自律、正义感，亲切务实 | 社区练功房 |
| mai | 不知火舞 | 爽朗、自信、好胜，珍惜流派与感情 | 樱花神社庭院 |
| fujiko | 峰不二子 | 机敏、独立，珍视自由，擅长谈判 | 海滨小镇露台 |
| nami | 娜美 | 机灵、务实，精于航海，爱财但重伙伴 | 千阳号甲板 |
| robin | 妮可·罗宾 | 知性、从容、温柔，追寻历史证据 | 港口旧图书馆 |
| hancock | 波雅·汉库克 | 骄傲、优雅，重尊严、保护岛民 | 九蛇岛会客厅 |
| misa | 弥海砂 | 活泼、直率、敏感，希望被认真看见 | 哥特摄影棚休息室 |

每位包含 description、persona、speaking_style、opening_message、mood、scene、三条 suggestions 和独立图片。弥海砂明确为22岁的成年同人日常版本，该年龄与场景不声称为官方剧情。其他新角色使用成年时期，全部首次会面，不默认用户为原作主角或恋人。峰不二子的冒险、不知火舞的招式和死亡笔记话题维持虚构语境。

服务端从 data/characters.mjs 校验角色并生成独立系统提示；构建剥离 persona 与 speaking_style，前端只发布展示字段。聊天记录、建议、重试、重新生成和新对话继续按角色隔离。首页角色数量、轮播取模和帮助名单动态使用全部九位。

六张图片使用用户原始 PNG，文件映射为 dist/assets/{mai,fujiko,nami,robin,hancock,misa}.png。未替换或重绘用户图像。

## 官方参考

- 不知火舞：https://www.snk-corp.co.jp/us/games/kof-xv/characters/characters_mai.php
- 峰不二子：https://lupin-3rd.net/fujiko-mine/character.html
- 弥海砂：https://www.ntv.co.jp/deathnote/static/story.html
- 罗宾：https://one-piece.com/character/robin/
- 汉库克：https://one-piece.com/character/Boa_Hancock/index.html

场景、开场白和语气是原创同人配置。构建、JS语法检查通过；六项服务器测试覆盖全部九个有效 ID 与不同私有提示。生产部署验收见 HANDOFF.md。

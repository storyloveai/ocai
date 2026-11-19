# 汐川三位女主的聊天与剧情记忆验收

[第五轮规格](https://github.com/storyloveai/ocai/issues/156#issuecomment-6997646710) · [预览汐川角色目录](https://storydate-zhou-git-codex-character-l-940c20-zhou-zeyas-projects.vercel.app/characters?world=xichuan) · [沈澄档案](https://storydate-zhou-git-codex-character-l-940c20-zhou-zeyas-projects.vercel.app/characters/xc-shencheng) · [季白档案](https://storydate-zhou-git-codex-character-l-940c20-zhou-zeyas-projects.vercel.app/characters/xc-jibai)

## 两条可复现的路线

打开任一档案，选一句建议开场白，再点白色聊天按钮。输入框会带入所选原话，等待玩家发送。初次对话能看到海边咖啡馆或放映室的开场场景。点聊天上方的「进入故事」，从序章开始，在招新时选择「当场填表」，到第一个放学后的支线菜单。

| 角色 | 实际选择 | 返回聊天后问「你记得我们刚做了什么吗？」 | 再点「继续故事」恢复的原句 |
| --- | --- | --- | --- |
| 沈澄 | 选海边咖啡馆，点小时候喝的热可可 | 沈澄记得热可可多放一块棉花糖；档案的共同经历里也有这次点单 | 「……嗯。」 / “…Okay.” |
| 季白 | 选放映室，问能否看看那盘胶片 | 季白记得陆远见过没贴标签的片盒，明确区分看见片盒和看过影片 | 「……可以看，不可以放。」 / “…You can look. You can't run it.” |

两次都通过「‹ 返回聊天」回到发起本次游玩的女主。初次从剧情返回时，沈澄把杯子放回吧台，季白关掉检片灯。打开另一位女主的聊天，同一存档仍显示当前章节，她的进度摘要和对话均未带入对方刚经历的点单或看片盒一事。

## 验收条件与结果

- 在本机隔离 Chrome 上运行 PR 分支网站，分别使用桌面 1366×900、手机 390×844 与中英文四种组合。每种组合下，沈澄和季白各从空白访客环境开始，共八条独立路线。
- 八次均由原生播放器经实际点击生成存档。预览用的本地配置关闭 AI 和计费，聊天页面显示「演示对话」，回复标注「演示回复」。八条路线合计零次 POST 请求、零个页面脚本异常。这里验证的是演示回复与存档的对应关系。
- 八次「继续故事」均直接恢复原对白，说话人和整句文字逐字相同。每次恢复后还刷新了玩家页，再实点「返回聊天」，均回到原女主聊天 URL 和她自己的进度摘要。
- 首页四组实测中，曹操 Hero 上沿均位于视口 y=0；旧 Dismiss 控件和 52 px 通知占位的 DOM 数量均为 0。汐川目录只列三位女主，三张卡均显示「可聊天」。手机中、英两组额外点击全站「可聊天」胶囊，显示 15 位角色。

## 首页与目录

| 视口与语言 | 首页 | 汐川三位女主 |
| --- | --- | --- |
| 1366×900 · 中文 | [首页](2026-11-19-xichuan-trio/desktop-zh-home.jpg) | [汐川](2026-11-19-xichuan-trio/desktop-zh-directory.jpg) |
| 1366×900 · English | [首页](2026-11-19-xichuan-trio/desktop-en-home.jpg) | [汐川](2026-11-19-xichuan-trio/desktop-en-directory.jpg) |
| 390×844 · 中文 | [首页](2026-11-19-xichuan-trio/mobile-zh-home.jpg) | [汐川](2026-11-19-xichuan-trio/mobile-zh-directory.jpg) · [全站 15 位可聊天角色](2026-11-19-xichuan-trio/mobile-zh-chat-directory.jpg) |
| 390×844 · English | [首页](2026-11-19-xichuan-trio/mobile-en-home.jpg) | [汐川](2026-11-19-xichuan-trio/mobile-en-directory.jpg) · [全站 15 位可聊天角色](2026-11-19-xichuan-trio/mobile-en-chat-directory.jpg) |

## 沈澄的档案、聊天与续玩

| 视口与语言 | 档案舞台 | 开场建议入稿 | 首次进入聊天 | 游戏后的演示回复 | 一键恢复原对白 | 返回原聊天 |
| --- | --- | --- | --- | --- | --- | --- |
| 1366×900 · 中文 | [舞台](2026-11-19-xichuan-trio/desktop-zh-shencheng-profile.jpg) | [草稿](2026-11-19-xichuan-trio/desktop-zh-shencheng-dock.jpg) | [开场](2026-11-19-xichuan-trio/desktop-zh-shencheng-opening.jpg) | [记忆](2026-11-19-xichuan-trio/desktop-zh-shencheng-demo.jpg) | [对白](2026-11-19-xichuan-trio/desktop-zh-shencheng-resumed.jpg) | [返回](2026-11-19-xichuan-trio/desktop-zh-shencheng-returned.jpg) |
| 1366×900 · English | [舞台](2026-11-19-xichuan-trio/desktop-en-shencheng-profile.jpg) | [草稿](2026-11-19-xichuan-trio/desktop-en-shencheng-dock.jpg) | [开场](2026-11-19-xichuan-trio/desktop-en-shencheng-opening.jpg) | [记忆](2026-11-19-xichuan-trio/desktop-en-shencheng-demo.jpg) | [对白](2026-11-19-xichuan-trio/desktop-en-shencheng-resumed.jpg) | [返回](2026-11-19-xichuan-trio/desktop-en-shencheng-returned.jpg) |
| 390×844 · 中文 | [舞台](2026-11-19-xichuan-trio/mobile-zh-shencheng-profile.jpg) | [草稿](2026-11-19-xichuan-trio/mobile-zh-shencheng-dock.jpg) | [开场](2026-11-19-xichuan-trio/mobile-zh-shencheng-opening.jpg) | [记忆](2026-11-19-xichuan-trio/mobile-zh-shencheng-demo.jpg) | [对白](2026-11-19-xichuan-trio/mobile-zh-shencheng-resumed.jpg) | [返回](2026-11-19-xichuan-trio/mobile-zh-shencheng-returned.jpg) |
| 390×844 · English | [舞台](2026-11-19-xichuan-trio/mobile-en-shencheng-profile.jpg) | [草稿](2026-11-19-xichuan-trio/mobile-en-shencheng-dock.jpg) | [开场](2026-11-19-xichuan-trio/mobile-en-shencheng-opening.jpg) | [记忆](2026-11-19-xichuan-trio/mobile-en-shencheng-demo.jpg) | [对白](2026-11-19-xichuan-trio/mobile-en-shencheng-resumed.jpg) | [返回](2026-11-19-xichuan-trio/mobile-en-shencheng-returned.jpg) |

## 季白的档案、聊天与续玩

| 视口与语言 | 档案舞台 | 开场建议入稿 | 首次进入聊天 | 游戏后的演示回复 | 一键恢复原对白 | 返回原聊天 |
| --- | --- | --- | --- | --- | --- | --- |
| 1366×900 · 中文 | [舞台](2026-11-19-xichuan-trio/desktop-zh-jibai-profile.jpg) | [草稿](2026-11-19-xichuan-trio/desktop-zh-jibai-dock.jpg) | [开场](2026-11-19-xichuan-trio/desktop-zh-jibai-opening.jpg) | [记忆](2026-11-19-xichuan-trio/desktop-zh-jibai-demo.jpg) | [对白](2026-11-19-xichuan-trio/desktop-zh-jibai-resumed.jpg) | [返回](2026-11-19-xichuan-trio/desktop-zh-jibai-returned.jpg) |
| 1366×900 · English | [舞台](2026-11-19-xichuan-trio/desktop-en-jibai-profile.jpg) | [草稿](2026-11-19-xichuan-trio/desktop-en-jibai-dock.jpg) | [开场](2026-11-19-xichuan-trio/desktop-en-jibai-opening.jpg) | [记忆](2026-11-19-xichuan-trio/desktop-en-jibai-demo.jpg) | [对白](2026-11-19-xichuan-trio/desktop-en-jibai-resumed.jpg) | [返回](2026-11-19-xichuan-trio/desktop-en-jibai-returned.jpg) |
| 390×844 · 中文 | [舞台](2026-11-19-xichuan-trio/mobile-zh-jibai-profile.jpg) | [草稿](2026-11-19-xichuan-trio/mobile-zh-jibai-dock.jpg) | [开场](2026-11-19-xichuan-trio/mobile-zh-jibai-opening.jpg) | [记忆](2026-11-19-xichuan-trio/mobile-zh-jibai-demo.jpg) | [对白](2026-11-19-xichuan-trio/mobile-zh-jibai-resumed.jpg) | [返回](2026-11-19-xichuan-trio/mobile-zh-jibai-returned.jpg) |
| 390×844 · English | [舞台](2026-11-19-xichuan-trio/mobile-en-jibai-profile.jpg) | [草稿](2026-11-19-xichuan-trio/mobile-en-jibai-dock.jpg) | [开场](2026-11-19-xichuan-trio/mobile-en-jibai-opening.jpg) | [记忆](2026-11-19-xichuan-trio/mobile-en-jibai-demo.jpg) | [对白](2026-11-19-xichuan-trio/mobile-en-jibai-resumed.jpg) | [返回](2026-11-19-xichuan-trio/mobile-en-jibai-returned.jpg) |

## 工程回归

网站全量测试 390 项通过，0 项失败、0 项跳过。生产构建、游戏副本一致性检查及 22 份 CSS 的解析均通过。测试用本地模拟服务验证 AI 回复模式和建议请求，逐组比对服务端的角色设定、存档白名单及私密背景解锁条件。

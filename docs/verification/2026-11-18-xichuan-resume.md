# 夏知遥从聊天回到故事 · 第三轮验收

打开夏知遥聊天，点「进入故事」，在序章读到她排练春季放映会的台词，再点左上「返回聊天」。此时点「继续故事」，第一屏就是刚才的对白。用同一浏览器打开角色档案，故事横条也会接续该进度。[聊天 Preview](https://storydate-zhou-git-codex-character-l-940c20-zhou-zeyas-projects.vercel.app/play/xc-zhiyao) · [档案 Preview](https://storydate-zhou-git-codex-character-l-940c20-zhou-zeyas-projects.vercel.app/characters/xc-zhiyao) · [设计规格](https://github.com/storyloveai/ocai/issues/156#issuecomment-6973048174) · [播放器授权与验收](https://github.com/storyloveai/ocai/issues/158)

## 四组真实游玩

本机隔离 Chrome 分别使用 1366×900、390×844 和中英文。每组独立从新游戏走到夏知遥普通结局，存档由播放器随实际点击生成。逐次比对恢复前后的对白全文、选项和结局正文。四组均为 0 个页面脚本错误、0 次 POST 请求。聊天使用演示模式。

| 离开故事的位置 | 实测结果 |
| --- | --- |
| 首次打开 | 聊天入口为「进入故事」。标题页可开始游戏。无存档时直接打开带续玩参数的链接也能开始游戏。 |
| 夏知遥排练放映会台词 | 从聊天点一次「继续故事」直接看见原话，说话人和全文相同。「返回聊天」仍回到夏知遥的对话。 |
| 序章主线三选 | 在档案下方故事横条点「继续故事」，三项原选择直接可点。点「标题」可以手动回到封面，再用原生「继续」返回。 |
| 入社后的支线菜单 | 选择「当场填表」后，聊天显示第 1 章和已入社。离开「放学后，你去了……」再返回，海报、咖啡馆、放映室三项全部保留。 |
| 夏知遥普通结局《春天过去了》 | 聊天入口变成「回顾结局」。一次点击即可看到原结局标题和完整正文，仍可手动回到标题。 |

## 聊天顶部

桌面与手机均只有一块上下文条。桌面最大宽度 720 px，手机宽度 390 px。有回顾与一条记事时，两种视口的上下文条实测均高 85 px。手机英文进度自然换行，右侧入口可点。首聊只显示进度和故事入口，发出演示消息后出现「回顾」，收藏后出现「记事 · 1」，建立分支后可用「走向 · 2」切换。芯片高 32 px、字号 12 px、圆角 6 px。模式在顶栏可见，每条演示回复保留来源标记。

夏知遥已有对话时，可在设置中重新开始唯一的相遇。沈砚舟、陆闻笙、林照晚各自的两个相遇场景均可通过原场景按钮打开，按钮高 38 px。

## 截图

| 视口 | 聊天顶部 | 一次点击后的对白 | 一次点击后的选项 | 结局回顾 |
| --- | --- | --- | --- | --- |
| 1366×900 · 中文 | [进度和记事](assets/xichuan-resume-20261118/desktop-zh-chat.jpg) | [对白](assets/xichuan-resume-20261118/desktop-zh-dialogue.jpg) | [三个选项](assets/xichuan-resume-20261118/desktop-zh-choice.jpg) | [结局](assets/xichuan-resume-20261118/desktop-zh-ending.jpg) |
| 1366×900 · 英文 | [进度和记事](assets/xichuan-resume-20261118/desktop-en-chat.jpg) | [对白](assets/xichuan-resume-20261118/desktop-en-dialogue.jpg) | [三个选项](assets/xichuan-resume-20261118/desktop-en-choice.jpg) | [结局](assets/xichuan-resume-20261118/desktop-en-ending.jpg) |
| 390×844 · 中文 | [进度和记事](assets/xichuan-resume-20261118/mobile-zh-chat.jpg) | [对白](assets/xichuan-resume-20261118/mobile-zh-dialogue.jpg) | [三个选项](assets/xichuan-resume-20261118/mobile-zh-choice.jpg) | [结局](assets/xichuan-resume-20261118/mobile-zh-ending.jpg) |
| 390×844 · 英文 | [进度和记事](assets/xichuan-resume-20261118/mobile-en-chat.jpg) | [对白](assets/xichuan-resume-20261118/mobile-en-dialogue.jpg) | [三个选项](assets/xichuan-resume-20261118/mobile-en-choice.jpg) | [结局](assets/xichuan-resume-20261118/mobile-en-ending.jpg) |

## 构建与协议回归

- 汐川执行了 `python3 content/story.py`、`python3 tools/build.py`、3000 局 `check.mjs` 和 2400 局 `stance_check.mjs`。模拟通过，静态检查 0 个错误、138 个提示；本次随机样本未覆盖 `g_words.promise` 结局片段。
- 网站执行了 `npm run game:sync`、`npm run build`、`npm run check`、`npm run game:check`。381 项测试全部通过。生成的原生 HTML 与网站内副本逐字节一致，两份修改的 CSS 均通过解析。
- 协议测试使用实际生成的播放器。跨来源和错误窗口的握手无效，重复握手只消费一次。恢复快照不会重做选择、再发存档或结算；手动读旧槽后重新进入，使用手动选定的进度。损坏的最新存档会退回标题，普通入口和独立播放器保留原来的标题入口。
- 旧版快照在一幕的最后一句对白和紧接着的菜单之间共用同一游标。遇到这种旧档会回到末句，点一下进入选项。新版快照单独保存菜单是否已显示，可精确回到该屏。

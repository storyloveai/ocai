# 《煮酒论英雄》活分镜验收

入口为 `/pilot/sanguo-manga`。从开场三格读到雷声，选择「趁雷声打翻自己的酒樽」可以去找曹操。重选时输入「主公快走」，刘备会有另一种反应，也会成为幕间的首位推荐。切换水墨可以直接比较同一幅原画的网点、人物轮廓与对白框。

## 桌面与手机

下表 16 张原图均截自已登录的 [storydate-zhou 分支 Preview](https://storydate-zhou-git-codex-living-manga-pilot-zhou-zeyas-projects.vercel.app/pilot/sanguo-manga)，对应功能提交 `40e40be`。桌面和手机使用 Chrome 的指定视口。浏览器独立访问会进入 Vercel 登录页。最后一列可在聊天输入框看到从第 4 格选择带过来的台词。进入私聊后由读者决定是否发送。

| 视口与语言 | 彩漫开场 | 黑白水墨 | 抉择后的第 4–5 格 | 幕间草稿 |
| --- | --- | --- | --- | --- |
| 桌面 1366×900 · 中文 | [看开场](desktop-zh-color.jpg) | [看水墨](desktop-zh-ink.jpg) | [看分支](desktop-zh-decision.jpg) | [看草稿](desktop-zh-interlude.jpg) |
| 桌面 1366×900 · 英文 | [看开场](desktop-en-color.jpg) | [看水墨](desktop-en-ink.jpg) | [看分支](desktop-en-decision.jpg) | [看草稿](desktop-en-interlude.jpg) |
| 手机 390×844 · 中文 | [看开场](mobile-zh-color.jpg) | [看水墨](mobile-zh-ink.jpg) | [看分支](mobile-zh-decision.jpg) | [看草稿](mobile-zh-interlude.jpg) |
| 手机 390×844 · 英文 | [看开场](mobile-en-color.jpg) | [看水墨](mobile-en-ink.jpg) | [看分支](mobile-en-decision.jpg) | [看草稿](mobile-en-interlude.jpg) |

## 剧情与交接

- 三个预设选择和三个自由发言暗门均来自本地剧集数据。其他台词原样进入读者气泡，且消息作为纯文本显示。每条路径只添加两格、对应的叙事印记及适合的幕间人物。
- 曹操、刘备和关羽使用现有聊天室。验证从新分镜进入聊天时，输入框与 `?draft=` 的内容一致。没有聊天生成、积分扣款或原游戏存档写入。分别测试聊天左上返回和浏览器后退，原分支、主题及聊天推荐都能恢复。
- 触屏横拖可看景深，竖滑能正常阅读。桌面指针、自动微晃、归零与系统减少动态效果均已检查。雨声需主动开启，离开阅读器时释放。
- 开场使用花园、近裁雷亭与雷亭全景。后续宴席复用 `v2_cao_feast.webp`，夜访和密信使用灯下、书信原画。

## 图像与设备

五张原画在本地 CPU 上用 [Depth Anything V2 Small](https://huggingface.co/depth-anything/Depth-Anything-V2-Small-hf/tree/5426e4f0f36572d16453bbda7a8389317b1bef99) 生成白近黑远的静态深度纹理。管线、模型修订、权重 SHA-256 和复现命令见 [离线批处理脚本](../../../scripts/generate-depth-maps.py)。更换剧集时可以用同一脚本烘焙新图，替换剧集的双语 JSON 数据和素材路径即可。

Chrome WebGL 对照测试使用一张真实原画和可控的黑白深度阶梯。在相同视角变化下，远景像素平均变化为 0，近景为 34.59/255。关闭 WebGL 时切到静态原画与 CSS 视差。已检查上下文丢失与恢复、离屏暂停、页面隐藏、反复重选和离开路由的资源回收。

手机结果来自触屏视口模拟。通过浏览器姿态输入和权限接口模拟，分别检查允许、拒绝、无传感器数据及复位。尚未使用实体 iPhone Safari 或 Android 手机验证传感器读数、帧率与耗电。

## 回归检查

在功能提交 `40e40be` 上运行 `npm run build`、`npm run check`、`npm run game:check` 与 23 份 CSS 的语法校验。全部通过。410 项 JavaScript 测试涵盖现有回归及新增的 16 项活分镜测试。另运行 `python tests/test_living_manga_depth.py`，五张纹理与原画尺寸一致，逐像素三通道相等，近景亮于对应远景。

| 场景 | 深度 WebP 字节 |
| --- | ---: |
| 后园 | 44,980 |
| 雷亭 | 42,418 |
| 宴席 | 44,266 |
| 灯下 | 44,906 |
| 密信 | 44,576 |

在手机宽度填满 180 个汉字时，第 4 格的玩家气泡随内容展开为 9 行，与角色反应的旁白之间保留了约 60px。在本机 Chrome 的网络请求记录中，8 次幕间交接均为 0 次 POST。往返覆盖两种语言、三位角色和两个尺寸，均恢复到原来的分支与滚动位置。

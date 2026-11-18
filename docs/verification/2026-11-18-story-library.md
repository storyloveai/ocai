# 首页精品书库与全站搜索验收

[第四轮规格](https://github.com/storyloveai/ocai/issues/156#issuecomment-6975884648) · [首页 Preview](https://storydate-zhou-git-codex-character-l-940c20-zhou-zeyas-projects.vercel.app/) · [全站搜索 Preview](https://storydate-zhou-git-codex-character-l-940c20-zhou-zeyas-projects.vercel.app/search) · [PR #157](https://github.com/storyloveai/ocai/pull/157)

## 体验路径

打开首页，在曹操 Banner 下左右滑动或点击玩法胶囊。选择「名著互动」，打开《基督山伯爵》，即可在舞台上读到故事简介与前两章试玩范围。浏览器后退会回到刚选的筛选。打开全站搜索，在「故事」和「角色」之间切换，可以对照两份公开名单。

| 胶囊 | 作品数 | 按呈现顺序 |
| --- | ---: | --- |
| 全部 | 6 | 汐川、三国、灰烬王冠、贝克街、凡人修仙传、基督山伯爵 |
| 恋爱与群像 Galgame | 2 | 汐川、灰烬王冠 |
| 历史谋略 | 1 | 三国 |
| 侦探推理 | 1 | 贝克街 |
| 名著互动 | 2 | 凡人修仙传、基督山伯爵 |

## 浏览器实测

在本机 Chrome 的独立环境中，分别走过 1366 × 900 桌面和 390 × 844 手机的中文、英文界面。

- 四组均逐张核对六张卡片的标题、能力、悬念句和副标题。24 次从首页点击封面均直接进入对应的 `/story/<id>`，舞台内各有一个进入故事的主按钮。
- 首页与角色目录的封面实测同宽，桌面为 192 × 288 px，手机约为 140 × 211 px，圆角均为 12 px。手机可横滑到最后一颗胶囊。英文长徽章采用紧凑排版，完整文案可读。
- 全站搜索空输入时，「全部」与「故事」各推荐六部，「角色」展示 18 位。输入旧作完整标题能找到相应记录，清空输入恢复精品推荐。搜索打开期间切换语言保留焦点。
- 三国主舞台提供水墨入口。曹操 Banner 的选项与自填回答仍分别通过 `?choice=` 和 `?say=` 交给游戏。浏览器检查使用隔离数据，未调用真实聊天与支付服务。
- 50 个 `story-*` 草稿、8 个 `sg-*` 小传仍能通过旧地址进入对应舞台和播放入口。旧收藏、历史、自建作品、汐川聊天与续玩、积分门禁均由回归套件覆盖。
- 显式 `?layout=baseline` 和 `?inspection=reference-terms` 可查看历史快照。`?hero=classic` 可切换旧 Banner，仍显示六部精品。

## 实测截图

每张均保留原视口尺寸。书库与筛选截图滚动至封面位置，方便与首屏对照。

| 环境 | 首页首屏 | 全部作品 | 名著筛选 | 详情舞台 | 全站搜索 |
| --- | --- | --- | --- | --- | --- |
| 桌面 · 中文 | [首屏](assets/story-library-20261118/desktop-zh-home.jpg) | [书库](assets/story-library-20261118/desktop-zh-library.jpg) | [筛选](assets/story-library-20261118/desktop-zh-classics.jpg) | [舞台](assets/story-library-20261118/desktop-zh-stage.jpg) | [搜索](assets/story-library-20261118/desktop-zh-search.jpg) |
| 桌面 · 英文 | [首屏](assets/story-library-20261118/desktop-en-home.jpg) | [书库](assets/story-library-20261118/desktop-en-library.jpg) | [筛选](assets/story-library-20261118/desktop-en-classics.jpg) | [舞台](assets/story-library-20261118/desktop-en-stage.jpg) | [搜索](assets/story-library-20261118/desktop-en-search.jpg) |
| 手机 · 中文 | [首屏](assets/story-library-20261118/mobile-zh-home.jpg) | [书库](assets/story-library-20261118/mobile-zh-library.jpg) | [筛选](assets/story-library-20261118/mobile-zh-classics.jpg) | [舞台](assets/story-library-20261118/mobile-zh-stage.jpg) | [搜索](assets/story-library-20261118/mobile-zh-search.jpg) |
| 手机 · 英文 | [首屏](assets/story-library-20261118/mobile-en-home.jpg) | [书库](assets/story-library-20261118/mobile-en-library.jpg) | [筛选](assets/story-library-20261118/mobile-en-classics.jpg) | [舞台](assets/story-library-20261118/mobile-en-stage.jpg) | [搜索](assets/story-library-20261118/mobile-en-search.jpg) |

## 工程检查

`npm run build`、`npm run game:check` 和 `npm run check` 均通过。网站测试 381 项通过，0 项失败、0 项跳过。使用 esbuild 解析了网站素材目录下的 21 份 CSS。

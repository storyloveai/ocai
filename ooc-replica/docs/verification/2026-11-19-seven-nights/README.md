# Seven Nights · 第一集验收

独立试播分支从 `c124d794`（#160）分出。首次进入英文试播页时优先使用读者主动保存的语言。截图取自 [Vercel 固定提交预览](https://storydate-zhou-6315i5o1v-zhou-zeyas-projects.vercel.app/pilot/seven-nights)，对应 `83b21bb`。使用 Chrome 的 1366 × 900 桌面视口和 390 × 844 手机模拟视口。手机真机传感器未纳入本轮验收。

## 桌面与手机

| 视口 | 彩漫开场 | 黑白水墨 | 抉择后 | 书房草稿 |
| --- | --- | --- | --- | --- |
| 桌面 EN | [彩漫](desktop-en-color.jpg) | [水墨](desktop-en-ink.jpg) | [集末](desktop-en-decision.jpg) | [书房](desktop-en-interlude.jpg) |
| 桌面 中文 | [彩漫](desktop-zh-color.jpg) | [水墨](desktop-zh-ink.jpg) | [集末](desktop-zh-decision.jpg) | [书房](desktop-zh-interlude.jpg) |
| 手机 EN | [彩漫](mobile-en-color.jpg) | [水墨](mobile-en-ink.jpg) | [集末](mobile-en-decision.jpg) | [书房](mobile-en-interlude.jpg) |
| 手机 中文 | [彩漫](mobile-zh-color.jpg) | [水墨](mobile-zh-ink.jpg) | [集末](mobile-zh-decision.jpg) | [书房](mobile-zh-interlude.jpg) |

## 资源与验证方法

五张静态原画来自已定稿 GPT 母版。WebP 均为 1440 × 810。第 2、3 格共用 P2 的原画与深度，P5 为空书房。服务端 Julian 按本期角色设定为 33 岁。

| 素材 | 彩图（字节） | 深度纹理（字节） |
| --- | ---: | ---: |
| P1 | 153272 | 44308 |
| P2 | 142834 | 40700 |
| P3 | 148476 | 43346 |
| P4 | 146282 | 40956 |
| P5 | 152904 | 32780 |

从网站目录执行离线推理，权重修订为 `5426e4f0f36572d16453bbda7a8389317b1bef99`。实际模型文件 SHA-256 为 `3152477ce0d8d6978d76b995120de97cb5b928701fd0f817769f59e249a16b70`。

```sh
art=dist/assets/living-manga/seven-nights
python scripts/generate-depth-maps.py --model-dir "$MODEL_DIR" --output-dir "$art/depth" "$art"/p?.webp
python tests/test_living_manga_depth.py
```

Pillow 检查两套剧集纹理的尺寸、灰度通道和画面指定位置的近亮远暗关系。网站构建、游戏副本一致性、CSS 解析及 415 项 JavaScript 回归均通过。

## 转化与隐私

四步为浏览、首次参与、提交抉择、进入幕间。后续发送用第五个事件记录轮次。选择和聊天事件仅含剧集、语言、视口、输入方式、分支、角色或序号等对应字段。自动测试走真实路由，在测试替身处截获事件，逐项核对字段及触发次数，并检查自由输入的标记文本没有进入事件。显式发送测试在聊天传输层截获一次请求，并核对请求的角色 ID 为 sn-julian。打开草稿及返回的回归检查会拦截所有非预期请求。桌面和手机双语 Preview 的输入框均带入对应语言的试探台词，返回分镜后保留抉择。交接的 0 POST 由自动回归断言。Preview 体验只打开草稿，未发送给真实模型；浏览器提示当前 Preview 未配置 Firebase 登录，本轮为访客验收。

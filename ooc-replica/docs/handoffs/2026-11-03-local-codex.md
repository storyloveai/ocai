# 给本地 Codex 的云端交接

更新时间：2026-11-03（北京时间）。仓库：`storyloveai/ocai`；产品：StoryDate。

用户要求把云端对话中的工作上下文交给本地助手继续。本文是经过整理的项目交接，**不是原始聊天记录，也不意味着两个会话已经共享记忆或凭据**。仓库是公开的，因此没有收录用户私人聊天、截图、公司接口文档、内网地址、API Key、Vercel Token 或分享令牌。

## 先做当前任务：团队出图 API 对比

- Issue：[#103](https://github.com/storyloveai/ocai/issues/103)；Draft PR：[#104](https://github.com/storyloveai/ocai/pull/104)。分支 `codex/klein-image-eval`。
- 用户原意：实际调用团队开发部署的图片服务，比较它与此前给 StoryDate 画的图，判断产品适配效果。
- 用户确认自己的电脑在公司内网，希望直接由能执行本机终端的本地 GPT/Codex 来调用。
- 云端只尝试了第一张：DNS 解析不到网关，出口代理在建连阶段返回 403；**没有到服务鉴权或模型阶段，没有 API 成图，不能断言 Key 有效/无效，也不能给模型质量结论**。剩下两项没有继续请求。不要把网络失败的 0.135 秒当成模型速度。
- API 文档名是 `flux3-image-klein-API.md`，用户需要在本机提供这份文档或已经配置好的 Base URL。Key 只从本机专用环境变量或隐藏输入获取，不从 GitHub 查找、不要求贴在公开评论里。
- 用户给过云端测试 Key，但本文不会转存；本地会话不会因此自动拿到它。网关测试 Key 与内网服务固定 Key 不可混用。

### 已准备材料

目录：[`../../image-benchmarks/klein-pilot/`](../../image-benchmarks/klein-pilot/README.md)。最初测试包提交为 `938973c`；后续本分支只追加交接材料，运行时仍以最新文件为准。

| 文件 | 内容 |
|---|---|
| `cases.json` | 固定原始提示词、参考图、seed=103、历史基线来源和 SHA-256 |
| `baseline/gu-chengye.png` | 原始内置工具成图：顾承野，30 岁成年男性 |
| `baseline/song-zhixia.png` | 原始内置工具成图：宋栀夏，27 岁成年女性 |
| `run.py` | Python 标准库串行调用、结果记录、等比 HTML 对比与 ZIP 打包 |
| `check_runner.py` | 4 项离线协议检查；使用模拟返回，不能算模型已出图 |
| `cloud-attempt.json` | 云端实际失败记录，含明确的未评估状态 |
| `../klein-pilot.zip` | 约 4.5 MB 的独立可运行包；无密钥、公司文档或网关地址 |

本轮只有三项，不要自行扩成大批量：

1. `gu-chengye`：按原始提示词生成成年男性角色肖像。
2. `song-zhixia`：按原始提示词生成成年女性角色肖像。
3. `gu-morning-edit`：用顾承野原图作参考，只改为清晨窗景和光照，保留脸、发型、服色、姿态、建筑模型与人数。

前两项的历史基线来自内置 `image_gen.imagegen`，未裁切或修饰。第三项是输入/输出保真检查，**没有一张已完成的“内置工具同指令编辑”可以冒充对照**。

### 本地接手顺序

1. 先读根目录 `AGENTS.md`、`docs/当前进度.md`，再查 #103/#104 最新评论与当前分支。检查现有未提交修改；不要为读本文而覆盖用户正在用其他工具修改的代码。
2. 拉最新 main，查看打开的 PR。在 #103 留言“Codex 本地接续”，说明接手本机运行；云端已经停止尝试该内网服务，避免两边重复请求。
3. 打开本机 API 文档。使用文档中与用户测试 Key 对应的网关，不自行切换厂商或猜内网固定密钥。
4. 在测试目录运行下面的离线检查和第一张。Base URL 与 Key 必须在本机准备；不要把 Key 写入命令参数、代码或日志。

```bash
cd ooc-replica/image-benchmarks/klein-pilot
python3 check_runner.py
python3 run.py --out ../klein-results
python3 run.py --run --only gu-chengye --archive \
  --out ../klein-results --key-stdin \
  --base-url "$ZEN5_IMAGE_BASE_URL"
```

`ZEN5_IMAGE_BASE_URL` 是用户文档中的 HTTPS Base URL。`--key-stdin` 在交互终端隐藏输入 Key；也可预先安全配置 `ZEN5_API_KEY` 后不带该参数。若本地代理没有交互终端，使用已配置的专用环境变量，不把 Key 作为 argv 传入。

5. 第一张成功后，检查真实 PNG 和报告，再完成余下两项：

```bash
python3 run.py --run --archive --out ../klein-results \
  --key-stdin --base-url "$ZEN5_IMAGE_BASE_URL"
```

成功结果会校验后跳过，不重复请求；任何一项失败就停止，不自动重试可能已计费的请求。超时可能发生在服务已经开始生成之后，先排查再决定是否手动重跑。

6. 打开 `../klein-results/index.html` 并实际查看三张输出。用户希望助手自己做比较，不要只返回脚本或泛泛推荐模型。保留原始 PNG 与 `results.json`，输出 ZIP 位于 `../klein-results.zip`。先扫描报告/图片中的敏感内容，再决定哪些非敏感产物可补进 PR #104。
7. 评估脸与眼神、成年感、人物数量、手和肢体、暗金页面画风、构图、无字/水印；编辑项重点查身份和服饰漂移。给出有样图依据的适用场景结论。如果仍连不上，记录本地具体失败阶段，不伪造结果。
8. 在 #103 更新实际结果。PR #104 保持草稿，未获用户明确“合并”指令前不合并、不开正式图片替换任务。

### 评测限制必须保留

- 文档中的模型别名为 `flux-3-image-klein`；未验证实际底层权重和版本，不凭名字认定架构、质量或商用许可。
- 网关会自动扩写提示词。请求原文相同不代表进模型的提示词相同；只记录服务实际返回的扩写，未返回就记未知。
- 服务忽略 `size`、`n`、`response_format`；每次返回一张 b64 PNG。记录实际尺寸，原图不裁，HTML 只等比显示。
- 历史内置工具没有暴露准确模型版本、seed 或生成耗时；不能拿它做受控速度测试或跨模型 seed 复现对比。
- 小样是服务管线比较，不能从两张图证明全量一致性。成本需要团队实际计费或资源数据，不从客户端耗时猜。
- 用户不希望批量调用按张付费的 OpenAI 图片 API。本轮只用其明确指定的团队服务，不另接付费图片厂商；如果新步骤确实需要额外付费，先说明具体方案和费用再问。

## 已确认的产品方向与容易踩的坑

这些是用户反复表达并已经用于实现的取舍。当前任务不需要重做前端，只供后续接续时避免走回头路。

- 喜欢现有暗色整体质感、金白 Logo 和曹操 Banner。Logo 采用“对话之书”初版比例：Story/左书页保留原金色，Date/右书页用文字白色；没有突兀白色底框。
- Banner 与书库靠渐变和留白分层；不要再加两条生硬分割线，也不要把曹操裁得看不见。通知关闭后整行收起，不能留下空灰条。
- 语言控制在桌面侧栏底部、账号区上方，手机顶栏；中文与英文生成必须跟所选语言，不能混成双语回复。保留历史原话，不因切语言篡改记录。
- Character 必须保留原貂蝉开局肖像与原浏览交互。用户喜欢“一实一虚”的阅读方式：对白清晰，动作叙述低调；不要为新机制重做整个网站。
- 新 Character 路线是在现有体验中加入原创成年角色、独立相遇、可接续对话与选择后果。用户允许 Codex 做这批角色内容和配图；当前十位试作是原创，不需要为了本次评测抓取或改写外站作品。
- 关系变化应体现在角色行为和后续交流，而不是装饰性的数值变化。试点做了原话出处与接续，不声称通用语义记忆、无限记忆或已经解锁内容。
- 三国方面，用户觉得关系反馈需要真正影响体验，结局需要更好的图文结合；Claude 已推进规则和八卷剧情，Codex 接续工程/配图。不要把此诉求理解为可在生图评测里改引擎和剧情。

## 其他在审工作：不要混进本轮

2026-11-03 交接时已读 GitHub 确认如下；后续请重新查实时状态，不能把快照当永久事实。`docs/当前进度.md` 在不同待合并分支中有不同的 Codex 行，部分旧行过时，应结合 PR 实际状态判断。

| Issue / PR | 分支 / 基底 | 本轮交接时的状态 |
|---|---|---|
| #94 / [#95](https://github.com/storyloveai/ocai/pull/95) | `codex/character-wave-one` → main | Draft，十位原创成年角色、十张肖像、二十种双语相遇；快照 `d4d095d`，未合并 |
| #99 / [#101](https://github.com/storyloveai/ocai/pull/101) | `codex/character-reunion` → `codex/character-wave-one` | Draft，依赖 #95；顾承野/宋栀夏/晏绯接续入口、有限明确选择反馈；快照 `c8a8090`，未合并 |
| #96 / [#97](https://github.com/storyloveai/ocai/pull/97) | `codex/sanguo-fate-candidates` → main | Draft，四种命运图各 A/B 候选和审图页；快照 `bb0fea7`，未合并 |
| #100 / [#102](https://github.com/storyloveai/ocai/pull/102) | `codex/sanguo-fate-integration` → `codex/sanguo-fate-candidates` | Draft，拟接入被斩 A／下狱 B／逐出 B／负伤 A；快照 `55a81fb`；只是预览拟采用，清单状态保留，未合并 |
| #103 / [#104](https://github.com/storyloveai/ocai/pull/104) | `codex/klein-image-eval` → main | 当前接手任务；三项本机评测包完成，尚无 API 成图，等待内网执行 |
| #98 | 以 GitHub issue 最新状态为准 | 卷八温芷/姜维年龄重画的可选后续，不属于当前三项 API 测试 |

交接时 main 是 `1b1552a`（已合并 Claude #93）。八卷剧情和此前场景插画已进入这条主线；四种命运图的拟接入还在上表两份 PR 中，不能说已经上线。

验证记录也分清范围：#104 原实现有 4 项离线协议检查、网站构建和 185 项检查通过；#101 有 203 项检查、本地 12 组流程及真实 Preview 小样记录；#102 有八卷每卷 5000 次模拟、14 项引擎、185 项网站检查及本地 16 组浏览器记录。查各 PR 的具体验证说明，不把模拟响应当真实模型质量证据。

Vercel 项目为 `storydate-zhou`，main 自动部署正式站；分支推送只供 Preview。曾遇临时匿名分享失效，因此交付使用有账号权限的 Vercel 原生预览地址。用户要求先看效果再合并；API 对比不是重新部署网站或复制生产密钥到 Preview 的授权。

## 协作规则与本地工作区

以根目录 `AGENTS.md` 和 `docs/当前进度.md` 为准；以下是防止误操作的重点：

- 用户与队友会混用多种工具，保护现有未提交改动，不重置、清理或强制切换正在工作的分支。
- 任务走 GitHub issue、开工留言认领，分支用 `codex/`；开工前看最新 main 与打开的 PR，避免碰另一助手正在改的文件。
- Codex 主要负责 `ooc-replica/**` 的工程与接入，Claude 负责 `game/**` 剧情、规则、引擎、作图清单提示词及选图；角色试作和图片交付有本轮用户授权，但不推导成可以任意改所有内容。
- `ooc-replica/content/**` 与 `book-campaigns/**` 是兰馨内容，改动请她 review。
- 不手改 `ooc-replica/sanguo/upstream/**`、`ooc-replica/book-campaigns/engine/campaign_core.js`、`ooc-replica/dist/assets/sanguo-art/**`；只通过 `npm run game:sync` 生成。本次评测不需要同步或 build.py。
- 共用进度文档只更新自己那一行。只开 PR、停在 Preview；**用户明确说“合并”后才合并**。本次没有收到合并 #95/#97/#101/#102/#104 的授权。
- 本地接手不会自动拿到云端聊天、上传附件、环境变量或登录态。需要的 API 文档/配置由用户在本机提供；不要把私人上下文上传到公开仓库。

## 给用户的交付

拿到真实结果后，在本地会话直接显示或打开 `index.html`，结合原图逐项解释优缺点。把不含密钥的 `klein-results.zip` 交给用户；用户可以把它带回云端继续审图。回传报告时带上来源分支/提交和实际调用记录，不要求用户再次复述整个项目。

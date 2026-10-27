> 2026-10-23：本文件是 10 月 10 日 Netlify 早期版本的接续记录，已过时。当前进度见 `docs/当前进度.md`。

# OOC AI 接续记录 — 2026-10-10

用户最新要求：窗口即将满，立即停止探索，提交 GitHub 并保存全部数据。

## 项目与授权
- GitHub 私有仓库：https://github.com/allliiita/ocai （用户已授权提交）
- 公开站：https://oocai.netlify.app/ （当前仍旧版静态演示）
- Netlify 项目 oocai，ID 99ae2b9a-1654-41e2-8eca-b289571a06fd，team allliiita。
- Netlify 当前是手动 Drop 部署，尚未连接 GitHub，不能用静态ZIP部署 Functions。
- 管理入口：https://app.netlify.com/projects/oocai/configuration/developer-settings
- 环境变量入口：https://app.netlify.com/projects/oocai/configuration/env
- Netlify 登录已恢复。连接仓库向导：https://app.netlify.com/projects/oocai/link
- GitHub 弹出 Netlify App 授权页，尚未点击 Authorize。页面列出验证GitHub身份、知晓可访问资源、代表用户操作、读取邮件地址。新授权需当前步骤确认。
- 不要把OAuth state、登录凭证、API密钥写入接续文档。

## 用户目标
保留现有 HTML/CSS/JS 和黑色/荧光绿视觉，接入 Netlify POST /api/chat，固定真实模型、三角色、流式回复、最近20条上下文、按角色localStorage、重试/新对话、验证/限流。推GitHub并Netlify上线。无需账户、支付、数据库、向量检索、摘要、长期记忆、训练。必要付费先明确服务和预算让用户授权，禁止擅自充值。

## 已选模型
AI_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=anthropic/claude-sonnet-4.6
AI_API_KEY 尚无。不要在聊天中索取密钥；让用户在Netlify Functions环境变量安全填写。
服务器固定 provider.only=['anthropic'] 和 allow_fallbacks=false，reasoning.enabled=false/exclude=true，max_tokens600。OpenRouter不是随机模型；客户端不能更改模型或提示词。

研究结论：选Sonnet4.6是成熟RP基线，不是公认最优，未做付费实测。SillyTavern一手体验多，但意见分歧，中文需要实际验收。价格每百万输入/输出$3/$15；假设3000输入+300输出约$0.0135/回复。成本备选DeepSeek V3.2，DeepInfra $0.26/$0.38，同假设约$0.000894/回复。Euryale v2.3专门RP训练但中文与托管可靠性证据较弱。新版Sonnet5.5已存在，thinking常开，社区早期体验矛盾；不能称4.6最新。榜单token用量不是质量。
预算建议专用key初始硬额度$20、低日限额（若支持），不开自动充值。IP限流不代替账户总额上限。尚未充值、未创建key、未设置预算。

## 角色
- Lara Croft：成年英国/欧美角色，独立好奇，冷静机智略英式幽默，遗迹营地。BAFTA 2024约4000玩家投票最具标志性角色第一。
- 蒂法 Tifa：日本作品《FFVII》成年本篇人物，不是日本国籍；温柔细心而有主见，Seventh Heaven。NHK 2020 FF角色投票第九，原NHK页面本次阻挡，媒体可追溯。不要默认用户是Cloud。
- 春丽 Chun-Li：《街头霸王》中国身份（作品日本），SF6成年功夫教练、前ICPO；成熟自律热心。不说刻板古风。Capcom周年投票第六来自可追溯报道，原榜本次403。
人物/设定/开场已写 data/characters.mjs，均原创同人，非官方台词。系统提示要求尊重用户行动，不编造共同记忆，跟随用户语言，1—3段，不总以问题结尾。

## 代码现状
- netlify/functions/chat.mjs：现代Request/Response API。JSON流读取最大64KB，角色allowlist，user/assistant，1—20条，每条4000字符、总20000。Origin同源检查（不代替鉴权）。50秒超时，处理上游SSE跨UTF8分块，转为data:{delta}/{done}/{error}，上游错误脱敏。
- Netlify config内置8请求/60秒/IP+domain限流；生产验证尚待部署。
- status.mjs：只返回ready boolean，不泄露密钥。
- scripts/build.mjs：导出公开角色卡，私有系统设定不进入dist。
- dist/app.js：已移除固定reply()，异步流式、发送锁、失败重试、最后回复重新生成、每角色本地存储、刷新恢复、新对话/导出、CJK composition保护。其他故事/创建角色是预览不能调用API。发送错误不偷偷用假回复。
- UI：新角色首页、人物档案、角色相关建议、聊天场景右栏、错误提示与动态等待；立绘见assets。桌面/手机布局需浏览器最终验收。
- build和服务端6项测试已通过；之前工作区的9项含前端VM测试曾通过，但切换工作区后前端测试文件未恢复，当前以实际tests目录为准。
- 当前工作目录 /workspace/scratch/5078990eb041/oocai。旧 /workspace/sites/ooc-replica 在环境切换后不可用。恢复脚本 update_frontend.py 与recover_frontend.py 保存于上层。
- 尚无真实API付费回复，不能宣称3角色真实聊天验收完成。尚未部署新版到Netlify。

## 三张图片
生成的PNG已有完整文件；请保存GitHub或备份完整ZIP。1024x1536，半写实成年同人角色立绘，非实际3D资产。
共享prompt：vertical waist-up, polished semi-realistic anime digital painting, cinematic lighting, facial/textile detail, muted emerald/amber, face upper third, adult fully clothed, no text/logo/watermark/UI。
Lara：brown braid, teal expedition top/strap, misty temple jungle。
Tifa：long dark hair, white athletic top, dark suspenders/short jacket, cozy bar。
Chun-Li：hair buns/white ribbons, blue/gold jacket, modern kungfu studio。

## 后续Astra 3D prompt
在现有OOC AI网页上，为原创成年28岁城市建筑师（冷静机智、有边界）设计半写实3D展示。先交正侧背参考、服装配色比例规范、生产步骤。有建模/导出工具才交真实GLB/VRM：人形骨骼、眨眼/微笑、待机；预算60k三角面、2048贴图、压缩8MB以内。仅替换桌面右侧立绘，Three.js惰性加载，视口外暂停，手机默认静态，WebGL失败降级，销毁释放资源。无建模工具就交规格和任务清单，不能把渲染图称为3D模型。不把3D作为API上线前置；暂不加语音/唇形同步。

## 下一窗口步骤
1. 核实本次GitHub最新提交与完整备份，必要时补上传PNG。
2. 完成Netlify GitHub应用授权并限制到ocai仓库（如果需要安装时说明权限，遵守当前步骤确认）。连接main，build npm run build，publish dist，functions netlify/functions，Node22。
3. 部署无key版本，浏览器检查首页/3角色/刷新记录/失败重试/移动布局；公开API缺key应503而非HTML。
4. 用户安全填入预算限制key，配置另外两个非秘密变量，重新部署；付费实测三角色语气/上下文/流式/错误恢复。未经测试不要称完成。
5. 只有上述完成后再做角色建模或prompt调优。

## 研究来源（已查，停止新增探索）
https://openrouter.ai/anthropic/claude-sonnet-4.6
https://openrouter.ai/deepseek/deepseek-v3.2
https://openrouter.ai/anthropic/claude-sonnet-5.5
https://openrouter.ai/docs/guides/routing/provider-selection
https://openrouter.ai/docs/guides/best-practices/reasoning-tokens
https://openrouter.ai/docs/guides/best-practices/spend-controls
https://openrouter.ai/collections/roleplay
https://www.reddit.com/r/SillyTavernAI/comments/1r9aasv/opus_46_vs_sonnet_46/
https://www.reddit.com/r/SillyTavernAI/comments/1wsm3k7/claude_sonnet_55_is_here/
https://note.com/aa4666lo/n/n55c56879f0ae
https://huggingface.co/Sao10K/L3.3-70B-Euryale-v2.3
https://www.playtombraider.com/en-gb/news/articles/meet-lara-croft
https://www.bafta.org/media-centre/press-releases/lara-croft-crowned-most-iconic-video-games-character-of-all-time-according-to-bafta-poll/
https://www.jp.square-enix.com/ffviir_ig/character/tifa.html
https://www.gamespark.jp/article/2020/03/01/97163.html
https://news.capcomusa.com/2022/06/02/street-fighter-6-redefines-the-genre-in-2023/
https://realotakugamer.com/street-fighter-30th-anniversary-character-popularity-poll-results-revealed/32524/
https://docs.netlify.com/build/functions/api/

## 保存检查点
代码和接续记录已提交 main：31b41aca2ca58d044a22edfe037fab33409c9701。三张PNG尚待GitHub上传；完整PNG包含于本次备份ZIP。不要忽略此步骤后直接部署。
完整持久备份：oocai-checkpoint-2026-10-10.zip，含三张PNG、全部源码、研究资料及旧版打包。备份已成功保存，可从本次回复下载。备份身份 libfile_b8fa50b724608191bea5e5e036f3b5c7。当前网站依然旧版，没有完成Netlify连接/部署或填入API密钥。用户最新要求停止探索，优先保存，因此暂不处理新授权。

## 接续检查 — 2026-10-10 19:14（Asia/Shanghai）

- 已收到重新附上的完整备份 ZIP；源码 blob 哈希与仓库一致，保留比备份更新的交接记录。
- 研究报告、来源列表和数据示例已提交 docs/research；历史恢复脚本与使用限制说明提交 docs/archive（2576a73）。这些资料不扩大当前 MVP 范围。
- 原始三张 PNG 已通过 GitHub 文件上传恢复到 dist/assets/lara.png、tifa.png、chunli.png（07dc3aa）；文件哈希与备份一致。
- npm run build 与 npm test 再次通过，实际服务端测试为 6 项。尚未做付费真实聊天验收。
- 用户已明确批准浏览器上传、继续 Netlify 连接及更新交接记录。Netlify 尚待本轮连接/部署核验；新应用权限仍按当前步骤处理，未充值、未创建 API key。

- Netlify GitHub 连接向导已进入 Authorize Netlify 页面；请求验证身份、知晓可访问资源、代表用户操作以及读取邮箱地址。尚未点击 Authorize，等待对该具体新权限的当前步骤确认。后续安装必须优先限制到 ocai 仓库。本轮未完成部署。

## 最新上线状态 — 2026-10-10 19:30（Asia/Shanghai）

本节覆盖前文的历史待办状态。

- 用户已逐步确认 Netlify OAuth 与具体仓库安装权限；Netlify App 已安装，仅选择 allliiita/ocai（一个仓库），GitHub 安装密码经安全输入验证，未保存凭证。
- Netlify 已连接 GitHub main，npm run build、dist、netlify/functions 已识别；Node22由 netlify.toml 配置。部署 6aca201990d71fd1d77c5eb0（main@531a0bb）已于19:23发布，2个Functions部署成功。
- 公开网站 https://oocai.netlify.app/ 已是新版三角色页面，不再是旧静态演示。
- AI_BASE_URL 与 AI_MODEL 在连接向导中未实际保存，已在项目环境变量页重新创建并确认存在。当前免费计划无法选单独Functions scope，两者为All scopes。AI_API_KEY 尚无，未充值。
- 生产接口实测：GET /api/status → 200 JSON {ready:false}；合法POST /api/chat → 503 JSON（非HTML）；高频请求返回429。
- 部署Post-processing日志确认成功处理1条programmatic限流规则，window_limit8、window_size60。首次9个并发请求未立即429；后续复测已出现429。Netlify官方说明计数异步，超限后最多10秒开始拦截：https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/ 。这不是账户总预算上限。
- 桌面浏览器验收：三角色分别独立开场；所有PNG完整加载（1024x1536）；发送失败提示、重试、发送锁释放、刷新恢复未完成消息、新对话清除测试消息均通过。浏览器未完成窄屏移动视口实测，不应称手机验收完成。
- npm run build 和6项服务端测试通过；没有付费模型回复，真实语气/上下文/SSE上游尚待密钥后验证。
- 下一步：用户在Netlify安全填写AI_API_KEY（Contains secret values），先设置专用key硬预算、关闭自动充值；保存后重新部署。不得在聊天索取/输出key，不擅自充值。随后验收3角色真实回复、上下文及流式，并完成移动布局检查。3D仍不是上线前置。

## 密钥接通与真实回复验收 — 2026-10-10 20:00（Asia/Shanghai）

本节覆盖前文的缺密钥状态。

- 用户在自己的浏览器安全保存 AI_API_KEY 后通知“已保存”。仅核实变量名与Secret values标志，未读取或输出密钥。生产context为1个值，Scopes为Builds、Functions、Runtime（免费计划限制）。
- 已重新部署并确认 Published：6aca27b69f486cd38f7dfd69，代码main@555d8be，2个Functions，构建/部署11秒。GET /api/status → {ready:true}。
- 3次真实POST /api/chat全部HTTP200，SSE完整返回done，无error：Lara 115个非空delta/13.44秒；Tifa73个/10.10秒；Chun-Li67个/9.38秒。时间包含本工具网络开销，不是严格模型延迟基准。
- 三个中文回复分别围绕探险准备、无酒精饮品、基础功夫，与各自场景一致。完整三次测试结果已存docs/verification/live-chat-2026-10-10.json，不含密钥。
- 浏览器Tifa额外2轮真实对话：首轮提供测试称呼“小禾”、不喝咖啡、喜欢热饮；第二轮能准确复述，并指出尚未提供甜度偏好。完成后刷新，真实回复保留，发送按钮可用。这是最近聊天上下文和localStorage验收，不是长期记忆。
- 前轮503/重试/新对话/429验收仍有效。本轮没有充值、开自动充值或更改模型。API key额度与预算由用户在提供商端维护，本轮未查询剩余额度。
- 当前真实聊天可用。剩余明确未验收：窄屏移动视口、长期RP质量、压力负载、重新生成真实回复。下一步可先完成移动布局与提示词细化，3D仍可后续独立规划。


## 2026-10-11 — Six additional character configurations

User replaced the earlier unshipped four-character request with six uploaded portraits. Cancel Rin; retain original Lara/Tifa/Chun-Li. Add Mai Shiranui, Fujiko Mine, Nami, Nico Robin, Boa Hancock and Misa Amane (explicit adult22 fan daily-life version). Identity of Mai/Fujiko/Misa confirmed by user. Each has individual personality, voice, motivation, first-meeting scene, opening and three suggestions. See docs/characters.md. All nine IDs supported by server; private prompts excluded from public build. Hero rotation/count/help now derive from roster length. npm run build, npm test (6 tests), node --check dist/app.js passed. Production verification follows after deployment.

### Production verification — 2026-10-11

Deployed configuration commit: 76b6cc73fd8fdc36a21af9a39de19dcc73adde12. /api/status ready:true; deployed public roster exactly nine, no Rin, no persona/speaking_style. Six GitHub image blob hashes match the uploaded original PNGs. Browser verified every new hero control, corresponding loaded image, six chat openings and suggestion buttons; all nine card images loaded. Six real /api/chat SSE requests ultimately returned HTTP200 and done:true with distinct Chinese replies. Initial concurrent provider failures502 and subsequent site429 were resolved by waiting for the normal8/minute limit and retrying sequentially, without weakening limits or changing provider. See docs/verification/six-characters-live-2026-10-11.json (successful replies and failed-attempt statuses). Netlify dashboard was signed out in this resumed browser; deployment is verified from live app/API content rather than an authenticated dashboard.

Browser Misa roundtrip also passed: sent a new question about relaxing after filming, received a complete character-specific reply, regenerate control reappeared, and browser refresh retained both question and answer.

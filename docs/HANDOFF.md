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

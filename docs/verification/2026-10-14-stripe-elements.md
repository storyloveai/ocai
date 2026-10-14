# Stripe Elements 升级与验收

## 最小改动

现有应用是原生 JavaScript + Vercel/Netlify API，`src/app.js` 调用 `/api/checkout` 后跳转到 Stripe-hosted Checkout。后端根据登录用户、固定 USD Price 和每次尝试的 UUID 创建 Session。Webhook 验证原始签名，再重新读取 Stripe Session，校验支付状态、环境、用户、金额、Price 和数量，以 Session ID 幂等发放 Credits。`checkout-status` 只读到账状态。

本次继续使用 Checkout Sessions，新增 `ui_mode: elements` 分支，使用 `return_url` 替代 hosted 的 `success_url/cancel_url`。保留原 hosted API 分支兼容尚未刷新的客户端；新客户端只使用站内 Elements。价格和数据库结构不变，Webhook 的校验与发放规则不变。Elements 与 hosted 使用不同 Idempotency-Key，避免部署切换时重试冲突。

后端使用官方 `stripe` SDK，前端通过官方 `@stripe/stripe-js` loader 加载 Stripe.js。前端新模块按需加载；同一个 Session 创建 Express Checkout Element 和 Payment Element。银行卡信息由 Stripe iframe 收集。快捷按钮最多三列、两行，窄屏由 Stripe 布局自动适配并允许溢出菜单；钱包不可用时隐藏快捷区域和分隔线。支付窗口关闭、账户改变时销毁 Elements，重复确认被拦截。Session secret 只存在内存和认证接口响应中，不写 URL、本地存储或分析事件。

Google Pay 使用 `auto`。Apple Pay 使用官方 `always` 选项，因为 Stripe 要求该选项才能支持非 Safari 桌面浏览器中的 Apple Pay。这并不绕过 Stripe 的平台/账户/域名资格检查；Stripe 可能为兼容平台提供钱包登录/设置或跨设备流程。二维码和原生付款窗口全部由 Stripe/Apple 提供，本站没有二维码实现，也不做用户代理猜测。无法保证每台设备都出现钱包或二维码。

客户端确认成功仍显示待到账，并查询现有 `checkout-status`；只有有效、已支付的 Webhook 才能发放余额。跨设备/3DS/银行授权等付款方式仍可能打开原生窗口或跳转认证页面。

## 配置和上线

1. 部署新增文件和构建输出。执行 `npm ci`、`npm run build`、`npm test`。
2. 在服务器环境设置 `STRIPE_PUBLISHABLE_KEY`，必须为与现有 `STRIPE_SECRET_KEY` 相同账户、相同环境的 `pk_test_…` 或 `pk_live_…`。它是可公开密钥；Secret 和 Webhook Secret 仍只留在服务端。缺少或模式不一致时新客户端禁用充值，不会自动跳回 hosted。
3. 保留现有三个 `STRIPE_PRICE_*`、`APP_URL` 和 `STRIPE_WEBHOOK_SECRET`。Webhook 仍为 `/api/webhook`，订阅 `checkout.session.completed` 和 `checkout.session.async_payment_succeeded`。正式付款继续要求 `STRIPE_LIVE_ENABLED=true`。
4. 在 Stripe Dashboard 的 Payment method domains 中注册实际提供 Elements 的 HTTPS 域名（包括需要使用的钱包测试域名）。分别核对 sandbox 和 live 环境。启用商户账户实际支持的付款方式；不要硬编码 `payment_method_types`。
5. 保留 Supabase 钱包环境隔离。当前 `gixohkydrqoabmjcqquq` 是专用测试项目，已有测试余额。本升级不删除 sandbox 标记、不重置余额，也不将其直接改成真实充值钱包。正式环境需先建立独立生产钱包/项目，并配置认证回调与现有 SQL migrations；如迁移用户，先明确身份映射。此 UI 升级不需要额外 SQL migration。
6. 检查 `/api/config` 的 `payments`、`embeddedPayments` 为 true，`walletMode` 与目标环境一致。只公开 publishable key，不能暴露 Secret/Service Role/Webhook Secret。

## 测试步骤（先用现有 sandbox）

| 场景 | 操作 | 应有结果 |
| --- | --- | --- |
| 站内付款 | Google 登录，选择原有任一档位 | 在本站打开安全付款窗口，无 hosted Checkout 跳转；金额/币种/档位保持一致 |
| 卡付款成功 | `4242 4242 4242 4242`，未来有效期、任意合法 CVC/邮编 | 客户端确认后查询到账；Webhook 成功后只增加该档位一次 |
| 3DS | `4000 0025 0000 3155` | 完成 Stripe 认证；取消认证不发放；成功后按 Webhook 到账 |
| 拒绝付款 | `4000 0000 0000 9995` | 显示 Stripe 错误，可修改后重试，余额不变 |
| 关闭/刷新/重复点击 | 加载时关闭、确认时重复点击、付款后刷新 | 不挂载旧窗口、不重复确认；刷新后按 Session 状态恢复查询，不重复增加余额 |
| Webhook 延迟 | 在测试环境暂缓事件交付，再重试原事件 | 客户端先显示等待；事件交付后到账。不得靠成功 URL 发放 |
| 异步付款 | 若账户/币种支持，选择延迟确认方式 | completed/unpaid 不发放，async_payment_succeeded/paid 才发放 |
| Webhook 重放/伪造 | 重发同一已支付事件；发送无签名请求 | 重发不重复增加余额；伪造请求返回 400 |
| 越权查询 | 用另一账户查询原 Session | 返回 404，不展示他人订单，不发放余额 |
| Apple Pay 原生 | 已注册 HTTPS 域名；兼容 Apple 设备、浏览器与有效 Wallet 卡 | 由 Apple/Stripe 弹出原生支付流程；sandbox key 不产生真实扣款 |
| Apple Pay 跨设备 | 官方支持的桌面浏览器，配合兼容 iPhone/iPad（按 Stripe/Apple 当前要求） | 支持时由 Stripe/Apple 展示跨设备扫码流程；本站没有自制 QR |
| Google Pay | 已注册 HTTPS 域名；兼容浏览器、地区与可用 Wallet | Stripe 自动显示按钮并完成其钱包流程 |
| 无钱包 | 未配置钱包/不支持的设备或地区 | 只显示 Stripe 判定可用的付款方式；Payment Element 仍可使用 |
| 手机布局 | 320/375/390px 视口，竖屏和横屏 | 弹窗可滚动、无横向溢出，快捷按钮自动排列/折行 |

Apple Pay/Google Pay sandbox 测试通常使用 Wallet 中已有有效卡；不要尝试把 Stripe 测试卡添加到真实 Wallet。必须确认网站为 test 模式后再测试。正式小额验收由账户持有人在自己的设备完成，并核对服务端 Webhook、数据库流水和余额；此交付未进行真实扣款。

## 已验证与限制

- 本地构建和 53 项自动测试通过，覆盖原有登录/聊天/钱包/Webhook及新增 Elements 配置、重复确认、钱包可用性、关闭销毁和失败重试。
- 通过现有 Stripe sandbox 创建了 `ui_mode=elements` Session：open、livemode=false、amount_total=199，返回 client_secret。未确认付款，测试 Session 会自动过期。
- 新增前端确认测试使用 SDK 接口模拟；它们不代表真实设备钱包或 Stripe iframe 已完成端到端验收。
- GitHub/Vercel 连接器仍返回 403；已通过授权浏览器上传全部 17 个文件到 `stripe-elements-checkout`，创建 PR #5。远端文件与已测试版本逐字节一致。Vercel 预览构建 Ready、PR 两项检查通过。尚未合并生产：正式 publishable key 已保存到 Vercel，仍需同账户的正式服务端受限密钥。
- Stripe MCP OAuth 已授权正式账户 acct_1UPzaoA85MgDT2yA；使用现有 live 价格，正式域名 Apple Pay/Google Pay active。
- 正式 Webhook we_1UQHcdA85MgDT2yAyxqfeElB 已创建，订阅 completed / async_payment_succeeded，API 2026-08-26.dahlia；部署前保持 disabled。
- 正式余额使用私有 storylove_live schema，仅 service_role 能执行四个 RPC，RLS 作为额外保护；测试余额表保持原样。Supabase migration live_wallet_isolation 已应用。事务验证初始余额 0、重复购买/签到幂等、测试订单拒绝、测试余额不变，全部回滚。权限验证 anon/authenticated 不可购买，正式表没有遗留测试行。
- 安全检查没有新增 WARN/ERROR；私有 service-only 表无公开策略的 INFO 符合设计。原有密码保护 WARN 与 Google OAuth 支付改动无关。
- 生产配置需要 SUPABASE_LIVE_WALLET_ENABLED=true、SUPABASE_LIVE_PROJECT_REF=gixohkydrqoabmjcqquq；Preview 保持 test。Production-only STRIPE_LIVE_SECRET_KEY 必须由账户持有人安全配置为同账户 rk_live…，至少 Checkout Sessions 写及读取、Prices 读取（含展开读取权限）。MCP OAuth 不会自动生成运行时私钥。不要把私钥发到聊天或仓库。
- 发布顺序：保存正式私钥和 STRIPE_LIVE_WEBHOOK_SECRET、三个 live 价格及上述钱包配置；合并 PR 并等待生产 Ready；检查 config 为 live/payments/embeddedPayments=true；启用正式 Webhook；再由持有人进行真实设备小额付款验收。不得在 live 页面使用 Stripe 测试卡。

官方依据：
- https://docs.stripe.com/payments/elements/build-a-payment-page
- https://docs.stripe.com/elements/express-checkout-element
- https://docs.stripe.com/js/elements_object/create_express_checkout_element
- https://docs.stripe.com/payments/payment-methods/pmd-registration
- https://docs.stripe.com/checkout/fulfillment

AI 配置指南：https://docs.stripe.com/mcp 、https://docs.stripe.com/agents 、https://docs.stripe.com/keys 。OAuth 可以分别授权 sandbox 和 live 账户；自动代理也可使用 Agent-tagged Restricted API Key。不要将私钥放入聊天或公开仓库。

正式 Webhook 签名密钥已存为 Production-only STRIPE_LIVE_WEBHOOK_SECRET；test 模式仍只使用原 STRIPE_WEBHOOK_SECRET。

正式三个价格和钱包环境开关已保存到 Production。持有人只需新增 Production-only Secret STRIPE_LIVE_SECRET_KEY（rk_live…），保留原共享 STRIPE_SECRET_KEY 供 Preview 测试；服务器优先使用正式密钥。

const $ = (selector) => document.querySelector(selector),
  app = $("#app"),
  modal = $("#modal");
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const icon = (name) => window.storyIcon?.(name) || "";
const account = window.storyAccount;
const analytics = window.storyAnalytics || {
  track() {},
  pageView() {},
  session: null,
};
let saved;
try {
  saved = JSON.parse(localStorage.getItem("ooc-demo") || "{}");
} catch {
  saved = {};
}
const state = {
  favorites: Array.isArray(saved?.favorites) ? saved.favorites : [],
  chats:
    saved?.chats &&
    typeof saved.chats === "object" &&
    !Array.isArray(saved.chats)
      ? saved.chats
      : {},
  archives: Array.isArray(saved?.archives) ? saved.archives : [],
  created: Array.isArray(saved?.created) ? saved.created : [],
  nickname: typeof saved?.nickname === "string" ? saved.nickname : "旅行者",
  avatar: typeof saved?.avatar === "string" ? saved.avatar : "你",
};
const realCharacters = window.OOC_CHARACTERS || [],
  original = window.STORYLOVE_STORIES || [];
let page = "story",
  genre = "all",
  query = "",
  searchType = "all",
  hero = 0,
  selected = null;
let chatError = "",
  activeRequest = null,
  serviceReady = null,
  busy = false,
  walletBusy = false;
let paymentState = "",
  paymentSession = null,
  paymentPolling = false;
let drafts = {};
try {
  drafts = JSON.parse(sessionStorage.getItem("storylove-drafts") || "{}") || {};
} catch {}
const genres = {
  Fantasy: "奇幻",
  Romance: "恋爱",
  SchoolLife: "校园",
  "School Life": "校园",
  Simulation: "模拟",
  Adventure: "冒险",
  "Slice of Life": "日常",
};
const creditIcon = icon("spark");
function items() {
  return [...realCharacters, ...original, ...state.created];
}
function persistDraft() {
  try {
    sessionStorage.setItem("storylove-drafts", JSON.stringify(drafts));
  } catch {}
}
function persist() {
  try {
    localStorage.setItem("ooc-demo", JSON.stringify(state));
  } catch {
    toast("本地储存已满，请导出重要对话。");
  }
  historyList();
}
function formatReply(value) {
  return esc(value)
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/^[-*] /gm, "• ");
}
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(
    () => $("#toast").classList.remove("visible"),
    3600,
  );
}
function nav(next) {
  if (location.hash === "#" + next) route();
  else location.hash = next;
}
function historyList() {
  $("#historyList").innerHTML =
    Object.keys(state.chats)
      .reverse()
      .slice(0, 5)
      .map((id) => {
        const item = items().find((t) => t.id === id);
        return item
          ? `<button class="historyitem" data-chat="${esc(id)}"><img src="${esc(item.image)}" alt="" width="32" height="38"><span>${esc(item.name)}</span></button>`
          : "";
      })
      .join("") || '<p class="quiet sidehint">开始一段对话，它会留在这里。</p>';
  $("#profileBtn").innerHTML =
    `<span class="account-avatar">${icon("user")}</span><span class="account-label"><b>${esc(account.user?.user_metadata?.full_name || state.nickname)}</b><small>${account.user ? "我的账户" : "访客 · 对话已保存"}</small></span>`;
}
function cover(item) {
  if (item.type === "story" && item.status !== "published")
    return `<div class="book-art" style="--cover:${esc(item.color || "#a6c5b0")}"><span class="book-series">STORYLOVE ORIGINALS</span><span class="book-motif" aria-hidden="true">${esc(item.motif || "✦")}</span><strong>${esc(item.name)}</strong><span class="book-rule"></span><small>你的下一段故事</small></div>`;
  return `<img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy" decoding="async" width="320" height="400">`;
}
function card(item) {
  const coming = item.type === "story" && item.status !== "published";
  return `<button class="card ${item.type === "character" ? "character" : "story-card"}" data-title="${esc(item.id)}"><div class="cover">${cover(item)}<span class="badge">${coming ? "即将上线" : "角色聊天"}</span></div><h3>${esc(item.name)}</h3><div class="meta">${esc(genres[item.genre] || item.mood || "原创故事")}</div></button>`;
}
function empty(title, description) {
  return `<div class="empty">${icon("book")}<h2>${esc(title)}</h2><p>${esc(description)}</p><button class="secondary" data-page="character">去认识角色 ${icon("arrow")}</button></div>`;
}
function head(title, subtitle = "") {
  return `<div class="pagehead"><div><h1>${esc(title)}</h1>${subtitle ? `<p>${esc(subtitle)}</p>` : ""}</div></div>`;
}
function footer() {
  return `<footer class="footer"><div class="footer-brand"><img src="assets/storylove-mark.svg" alt="" width="26" height="26"><strong>StoryLove</strong><span>让想象，慢慢发生。</span></div><button data-action="help">使用帮助</button><small>AI 回复可能有误 · 对话保存在当前浏览器</small></footer>`;
}
function home() {
  if (page === "story")
    return `<div class="content library"><section class="libraryhero"><div><span class="eyebrow">YOUR NEXT CHAPTER</span><h1>故事还未开始，<br>想象已经抵达。</h1><p>收藏喜欢的世界，等待新章。</p><button class="primary" data-page="character">先与角色相遇 ${icon("arrow")}</button></div><div class="library-illustration" aria-hidden="true"><div class="floating-spark">✧</div><div class="hero-book"><span>STORYLOVE</span>${icon("book")}<b>每一种想象<br>都有下一页</b></div><div class="orbit">✦</div></div></section><div class="sectionhead"><div><span class="eyebrow">THE STORY SHELF</span><h2>挑一个喜欢的世界</h2></div><span class="quiet">${original.length} 部小说筹备中</span></div><div class="tabs" aria-label="小说类型">${[["all", "全部"], ...Object.entries(genres).filter(([key]) => key !== "SchoolLife")].map(([key, label]) => `<button class="chip ${genre === key ? "selected" : ""}" data-genre="${key}" aria-pressed="${genre === key}">${label}</button>`).join("")}</div><div class="cards book-grid">${original
      .filter((t) => genre === "all" || t.genre === genre)
      .map(card)
      .join(
        "",
      )}</div><p class="fan-note">当前为书架占位，正文和互动剧情正在准备中。</p></div>${footer()}`;
  const h = realCharacters[hero % realCharacters.length];
  if (!h) return empty("角色正在准备中", "稍后再来看看。");
  return `<section class="hero characterhero"><div class="herocopy"><span class="eyebrow">A LITTLE COMPANY, A NEW STORY</span><h1>一次相遇，<br>一段属于你的故事。</h1><p>选一个角色，聊聊今天。</p><button class="primary" data-chat="${esc(h.id)}">与 ${esc(h.name)} 交谈 ${icon("arrow")}</button><span class="hero-caption">${esc(h.scene)}</span></div><div class="heroart"><img src="${esc(h.image)}" alt="${esc(h.name)}" decoding="async" fetchpriority="high" width="700" height="700"></div><div class="herodots">${realCharacters.map((item, i) => `<button data-feature="${i}" class="${i === hero ? "selected" : ""}" aria-label="查看${esc(item.name)}" aria-pressed="${i === hero}"></button>`).join("")}</div></section><div class="content"><div class="sectionhead"><h2>今天，想和谁聊聊？</h2><span class="quiet">${realCharacters.length} 位角色 · 各有自己的世界</span></div><div class="cards character-grid">${realCharacters.map(card).join("")}</div><p class="fan-note">角色设定为原创同人内容，与原作权利人无关联。</p></div>${footer()}`;
}
function detail() {
  const t = selected,
    coming = t.type === "story" && t.status !== "published";
  return `<div class="content detail"><button class="text-button" data-page="${t.type === "story" ? "story" : "character"}">${icon("back")} 返回${t.type === "story" ? "书架" : "角色"}</button><div class="detailtop"><div class="detailcover cover">${cover(t)}</div><div><span class="eyebrow">${coming ? "STORYLOVE ORIGINALS · COMING SOON" : esc(t.origin || "角色聊天")}</span><h1>${esc(t.name)}</h1><p>${esc(t.description)}</p><span class="chip">${esc(genres[t.genre] || t.mood || "原创")}</span><div class="detailactions">${coming ? '<span class="coming-note">正文筹备中，敬请期待</span>' : `<button class="primary" data-chat="${esc(t.id)}">${state.chats[t.id] ? "继续对话" : "开始对话"} ${icon("arrow")}</button>`}<button class="secondary" data-like="${esc(t.id)}" aria-pressed="${state.favorites.includes(t.id)}">${icon("heart")} ${state.favorites.includes(t.id) ? "已收藏" : "收藏"}</button></div></div></div><div class="detailtext"><h2>${coming ? "在这里等待下一章" : "故事从这里开始"}</h2><p class="opening">${esc(coming ? "这是一部筹备中的小说。正式内容上线后，你可以在这里开始阅读和互动。" : t.intro)}</p>${coming ? '<button class="text-button" data-page="character">先去认识一位角色 ' + icon("arrow") + "</button>" : ''}</div></div>`;
}
function searchResults() {
  const matches = items().filter(
    (t) =>
      (searchType === "all" || t.type === searchType) &&
      (t.name + " " + t.description + " " + (genres[t.genre] || t.genre))
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  $("#searchResults").innerHTML = matches.length
    ? `<p class="quiet">找到 ${matches.length} 个结果</p><div class="cards book-grid">${matches.map(card).join("")}</div>`
    : empty("暂时没有找到", "换个名字或关键词试试。");
}
function credits() {
  const w = account.wallet,
    disabled = walletBusy || account.loading;
  const paymentMessages = {
    pending: "正在确认付款和到账…",
    credited: "充值已到账，可以继续你的故事了。",
    processing: "付款仍在处理中，确认后余额会自动更新。",
    waiting: "正在等待到账确认。可以稍后刷新余额，无需重复付款。",
    unpaid: "这笔付款尚未完成。",
    error: "暂时无法确认到账，请稍后重试。",
    cancelled: "你已取消付款，未完成的订单不会到账。",
  };
  return (
    head("我的灵感", "给下一段故事，留一点期待。") +
    `<div class="content wallet-page">${paymentState ? `<div class="payment-notice ${paymentState === "credited" ? "success" : ""}" role="status">${icon(paymentState === "credited" ? "check" : "clock")}<span>${paymentMessages[paymentState]}</span>${["waiting", "error", "processing"].includes(paymentState) ? '<button class="secondary" data-action="verifyPayment">重新确认</button>' : ""}</div>` : ""}<div class="balance"><span class="eyebrow">YOUR STORY WALLET ${account.walletMode === "test" ? "· 测试环境" : ""}</span><p>我的 Credits</p><b>${creditIcon} ${w ? Number(w.balance).toLocaleString() : "—"}</b><div class="wallet-actions">${account.user ? `<button class="primary" data-action="checkin" ${disabled || w?.checked || !w ? "disabled" : ""}>${w?.checked ? icon("check") + " 今日已签到" : walletBusy ? "正在处理…" : "每日签到 · +100"}</button><button class="secondary" data-action="creditHistory" ${!w ? "disabled" : ""}>查看流水</button><button class="text-button" data-action="refreshWallet" ${disabled ? "disabled" : ""}>刷新余额</button>` : `<button class="primary" data-action="login" ${disabled ? "disabled" : ""}>${account.loading ? "正在恢复账户…" : "登录领取灵感"}</button>`}</div><small>每日 00:00（上海时间）刷新${account.walletMode === "test" ? " · 测试余额与正式余额独立" : ""}</small></div>${account.error || account.walletError ? `<p class="account-notice" role="status">${esc(account.error || account.walletError)}${account.user ? '<button data-action="refreshWallet">重试</button>' : ""}</p>` : ""}<div class="sectionhead"><div><h2>为下一章补充灵感</h2><p class="quiet">${account.walletMode === "test" ? "当前为测试结账，不会产生真实扣款。" : "一次充值，随时使用。通过 Stripe 安全付款。"}</p></div></div><div class="plans">${(window.STORYLOVE_CREDIT_PACKS || []).map(({ credits: n, amount, label }, i) => `<div class="plan ${i === 1 ? "recommended" : ""}">${i === 1 ? '<span class="plan-tag">更多可能</span>' : ""}<span class="eyebrow">${esc(label)}</span><h2>${creditIcon} ${n.toLocaleString()}</h2><p>${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount / 100)} <small>USD · 一次性</small></p><button class="${i === 1 ? "primary" : "secondary"}" data-refill="${n}" ${disabled || !account.payments ? "disabled" : ""}>${walletBusy ? "正在处理…" : account.payments ? (account.walletMode === "test" ? "测试充值" : "充值") : "充值准备中"}</button></div>`).join("")}</div><p class="demohint">${account.payments ? "付款和到账状态以 Stripe 确认及账户流水为准。" : "充值服务尚未开放。"} 当前角色聊天暂不扣除 Credits。</p></div>`
  );
}
function profile() {
  return (
    head("我的账户") +
    `<div class="content profile-page"><div class="profile-card"><div class="profile-avatar">${icon("character")}</div><h2>${esc(account.user?.user_metadata?.full_name || state.nickname)}</h2><p class="quiet">${account.user ? "已登录，余额和签到与账户关联。" : "可以直接聊天。充值前登录，余额将与账户关联。"}</p>${account.loading ? "<p>正在恢复账户…</p>" : account.user ? '<button class="secondary" data-action="logout">退出登录</button>' : '<button class="primary" data-action="login">登录 / 注册</button>'}${account.error ? `<p class="account-notice">${esc(account.error)}</p>` : ""}</div><form id="profileForm"><label for="nickname">对话中的称呼</label><input id="nickname" maxlength="40" value="${esc(state.nickname)}" autocomplete="nickname"><button class="secondary" type="submit">保存称呼</button></form><div class="setting-links"><button data-page="titles">${icon("heart")} 我的收藏 ${icon("arrow")}</button><button data-page="history">${icon("clock")} 最近对话 ${icon("arrow")}</button><button data-page="credits">${icon("spark")} 我的灵感 ${icon("arrow")}</button></div><p class="fan-note">收藏和对话保存在当前浏览器；余额与账户关联。退出登录不会删除本地对话。</p></div>`
  );
}
function render() {
  if (page === "chat" && $("#message") && selected) {
    drafts[$("#message").dataset.character] = $("#message").value;
    persistDraft();
  }
  document.body.classList.toggle("in-chat", page === "chat");
  document.querySelectorAll("[data-page]").forEach((button) => {
    const active = button.dataset.page === page;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  if (page === "story" || page === "character") app.innerHTML = home();
  else if (page === "detail" && selected) app.innerHTML = detail();
  else if (page === "chat" && selected) app.innerHTML = chat();
  else if (page === "credits") app.innerHTML = credits();
  else if (page === "profile") app.innerHTML = profile();
  else if (page === "search") {
    app.innerHTML =
      head("找一个世界", "搜索小说和角色。") +
      `<div class="content"><div class="searchbox">${icon("search")}<input id="search" type="search" aria-label="搜索小说和角色" placeholder="输入名字或关键词…" value="${esc(query)}"></div><div class="tabs">${[
        ["all", "全部"],
        ["story", "小说"],
        ["character", "角色"],
      ]
        .map(
          ([key, label]) =>
            `<button class="chip ${searchType === key ? "selected" : ""}" data-searchtype="${key}" aria-pressed="${searchType === key}">${label}</button>`,
        )
        .join("")}</div><div id="searchResults"></div></div>`;
    searchResults();
  } else if (page === "titles" || page === "history") {
    const titles =
      page === "titles"
        ? items().filter((t) => state.favorites.includes(t.id))
        : Object.keys(state.chats)
            .reverse()
            .map((id) => items().find((t) => t.id === id))
            .filter(Boolean);
    app.innerHTML =
      head(page === "titles" ? "我的收藏" : "最近对话") +
      `<div class="content">${titles.length ? `<div class="cards book-grid">${titles.map(card).join("")}</div>` : empty(page === "titles" ? "把喜欢的故事留在这里" : "第一次相遇，从这里开始", page === "titles" ? "在小说或角色档案里点一下收藏。" : "和一位角色聊聊，随时回来继续。")}${page === "history" ? archiveList() : ""}${state.created.length && page === "titles" ? `<details class="legacy-drafts"><summary>以前保存的本地草稿（${state.created.length}）</summary><p class="quiet">这些草稿仍保存在浏览器中，内容未发布。</p><div class="cards">${state.created.map(card).join("")}</div></details>` : ""}</div>`;
  } else app.innerHTML = empty("这一页还没写好", "回到角色页继续探索。");
  historyList();
  if (page === "chat") {
    if ($("#message")) $("#message").value = drafts[selected.id] || "";
    scrollChat();
  }
  analytics.pageView(
    ["chat", "detail"].includes(page) ? page + "/" + selected?.id : page,
  );
}
function archiveCurrentChat() {
  const messages = (state.chats[selected.id] || []).filter(m => !m.pending);
  if (!messages.some(m => m.role === "user")) return;
  state.archives.push({ characterId: selected.id, created: Date.now(), messages: messages.map(m => ({ role: m.role, text: m.text })) });
}
function archiveList() {
  return state.archives.length ? `<section class="conversation-archives"><h2>以前的对话</h2>${state.archives.map((entry, index) => `<button class="settingrow" data-archive="${index}"><span>${esc(items().find(t => t.id === entry.characterId)?.name || entry.characterId)}<small>${esc(new Date(entry.created).toLocaleString("zh-CN"))}</small></span>${icon("arrow")}</button>`).reverse().join("")}</section>` : "";
}
function startChat(id) {
  const next = items().find((t) => t.id === id);
  if (!next) return nav("character");
  if (!next.real) {
    selected = next;
    location.hash = "title/" + id;
    return;
  }
  if (activeRequest) {
    activeRequest.abort();
    activeRequest = null;
    busy = false;
  }
  selected = next;
  chatError = "";
  analytics.track("chat_start", {
    character_id: id,
    kind: next.type || "character",
  });
  if (!Array.isArray(state.chats[id]))
    state.chats[id] = [{ role: "assistant", text: next.intro || "欢迎。" }];
  state.chats[id] = state.chats[id].filter(
    (m) => !m.pending && typeof m.text === "string",
  );
  if (state.chats[id].at(-1)?.role === "user")
    chatError = "上一条消息尚未完成回复，可以重试。";
  page = "chat";
  location.hash = "chat/" + id;
  persist();
  render();
}
function chat() {
  const ms = state.chats[selected.id] || [];
  return `<div class="chat-layout"><div class="chat"><div class="chathead"><button data-action="backDetail" aria-label="返回角色">${icon("back")}</button><div class="chat-title"><b>${esc(selected.name)}</b><small>${esc(selected.scene || (selected.type === "story" ? "互动小说" : "角色场景"))}</small></div><button class="secondary new-chat" data-action="restartChat" ${busy ? "disabled" : ""}>新对话</button><button data-action="chatMenu" aria-label="对话菜单">${icon("more")}</button></div><div class="messages" id="messages" aria-label="对话记录"><div class="chatintro"><img src="${esc(selected.image)}" alt="${esc(selected.name)}"><span class="eyebrow">${esc(selected.origin || "故事预览")}</span><h2>${esc(selected.name)}</h2><p>${esc(selected.description)}</p></div>${ms.map((m, i) => `<div class="msg ${m.role} ${m.pending ? "pending" : ""}"><small>${m.role === "user" ? esc(state.avatar) : esc(selected.name)}</small><div class="bubble" ${m.pending ? 'id="streamBubble"' : ""}>${m.pending && !m.text ? '<span class="typing"><i></i><i></i><i></i></span>' : m.role === "assistant" ? formatReply(m.text) : esc(m.text)}</div>${m.role === "assistant" && i === ms.length - 1 && i > 0 && !m.pending ? `<button data-regenerate="${i}" ${busy ? "disabled" : ""}>↻ 重新生成</button>` : ""}</div>`).join("")}<div id="chatError" class="chat-error" role="alert" ${chatError ? "" : "hidden"}><span>${esc(chatError)}</span>${chatError.includes("登录") ? '<button class="secondary" data-action="login">登录</button>' : ""}<button class="secondary" data-action="retryChat" ${busy ? "disabled" : ""}>重试</button></div></div><div class="composer">${ms.length <= 1 ? `<div class="suggestions">${(selected.suggestions || []).map((t) => `<button data-suggestion="${esc(t)}">${esc(t)}</button>`).join("")}</div>` : ""}<form id="sendForm" class="inputrow"><textarea id="message" maxlength="4000" rows="1" placeholder="${"说些什么，或描述你的行动…"}" data-character="${esc(selected.id)}" aria-label="消息"></textarea><button type="submit" aria-label="发送消息" ${busy ? "disabled" : ""}>${icon("send")}</button>${busy ? '<button type="button" class="stop-generation" data-action="stopChat">停止</button>' : ""}</form><div class="demohint">${busy ? "正在回复…" : selected.real ? (selected.type === "story" ? "互动小说" : "AI 角色") + " · 已保存到此浏览器" : "占位故事暂未接入聊天"}${serviceReady === false && selected.real ? " · 服务暂时不可用" : ""}</div></div></div><aside class="character-rail"><img src="${esc(selected.image)}" alt=""><div><span class="eyebrow">${esc(selected.origin || "PREVIEW")}</span><h2>${esc(selected.name)}</h2><p>${esc(selected.mood || selected.genre)}</p><p>${esc(selected.description)}</p></div></aside></div>`;
}
function scrollChat(force = true) {
  const m = $("#messages");
  if (m && (force || m.scrollHeight - m.scrollTop - m.clientHeight < 140))
    m.scrollTop = m.scrollHeight;
}
function recentMessages(ms) {
  const history = ms
    .filter((m) => !m.pending && !m.failed && m.text.trim())
    .slice(-20);
  let size = 0;
  const result = [];
  for (let i = history.length - 1; i >= 0; i--) {
    if (size + history[i].text.length > 20000) break;
    size += history[i].text.length;
    result.unshift({ role: history[i].role, content: history[i].text });
  }
  return result;
}
async function generate() {
  if (busy || !selected) return;
  if (!selected.real) {
    chatError = "这部小说正在准备中。";
    render();
    return;
  }
  const id = selected.id,
    ms = state.chats[id];
  if (ms.at(-1)?.role !== "user") return;
  const messages = recentMessages(ms);
  busy = true;
  chatError = "";
  const controller = new AbortController();
  activeRequest = controller;
  const startedAt = performance.now();
  let replyMeta = {},
    firstDelta = null;
  const pending = { role: "assistant", text: "", pending: true };
  ms.push(pending);
  render();
  let frame = 0;
  const paint = () => {
    frame = 0;
    const bubble = $("#streamBubble");
    if (
      page === "chat" &&
      selected?.id === id &&
      activeRequest === controller &&
      bubble
    ) {
      const m = $("#messages"),
        follow = m.scrollHeight - m.scrollTop - m.clientHeight < 140;
      bubble.innerHTML = formatReply(pending.text);
      if (follow) scrollChat();
    }
  };
  const timer = setTimeout(() => controller.abort(), 55000);
  let succeeded = false;
  try {
    const session =
      account.user && account.provider !== "netlify"
        ? (await account.client.auth.getSession()).data.session
        : null;
    if (account.user && account.provider !== "netlify" && !session)
      throw Object.assign(Error("登录已过期，请重新登录。"), { status: 401 });
    controller.signal.throwIfAborted();
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(account.user && account.provider !== "netlify"
          ? { Authorization: "Bearer " + session?.access_token }
          : {}),
      },
      body: JSON.stringify({ characterId: id, messages }),
      signal: controller.signal,
    });
    if (!response.ok) {
      let error;
      try {
        error = (await response.json()).error;
      } catch {}
      throw Object.assign(
        Error(
          error ||
            (response.status === 429
              ? "请求较多，请稍等一分钟再试。"
              : "聊天服务暂时不可用，请重试。"),
        ),
        { status: response.status },
      );
    }
    if (
      !response.headers.get("content-type")?.includes("text/event-stream") ||
      !response.body
    )
      throw Error("聊天接口尚未部署，请稍后再试。");
    const reader = response.body.getReader(),
      decoder = new TextDecoder();
    let buffer = "",
      doneEvent = false;
    const line = (raw) => {
      if (!raw.startsWith("data:")) return;
      const e = JSON.parse(raw.slice(5));
      if (e.error) throw Error(e.error);
      if (e.done) {
        doneEvent = true;
        replyMeta = {
          prompt_version: e.promptVersion,
          provider: e.provider,
          model: e.model,
        };
      }
      if (e.delta) {
        if (firstDelta === null) firstDelta = performance.now() - startedAt;
        pending.text += e.delta;
        if (!frame) frame = requestAnimationFrame(paint);
      }
    };
    try {
      while (true) {
        const { done, value } = await reader.read();
        buffer += done
          ? decoder.decode()
          : decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const l of lines) line(l);
        if (done) {
          if (buffer) line(buffer);
          break;
        }
      }
    } finally {
      await reader.cancel().catch(() => {});
    }
    if (!doneEvent || !pending.text) throw Error("回复中断，请重试。");
    delete pending.pending;
    succeeded = true;
    analytics.track("reply_complete", {
      character_id: id,
      duration_ms: Math.round(performance.now() - startedAt),
      first_delta_ms: Math.round(firstDelta || 0),
      ...replyMeta,
    });
  } catch (e) {
    analytics.track("reply_failed", {
      character_id: id,
      reason: controller.signal.aborted ? "aborted" : "service_error",
      duration_ms: Math.round(performance.now() - startedAt),
    });
    const index = ms.indexOf(pending);
    if (index >= 0) ms.splice(index, 1);
    if (activeRequest === controller && selected?.id === id)
      chatError = controller.signal.aborted
        ? "回复已中断，请重试。"
        : e.message;
    if (
      activeRequest === controller &&
      selected?.id === id &&
      e.status === 401
    ) {
      chatError = "登录已过期，请重新登录后重试。";
      account.user = null;
      account.wallet = null;
    }
  } finally {
    clearTimeout(timer);
    if (frame) cancelAnimationFrame(frame);
    const current = activeRequest === controller;
    if (current) {
      activeRequest = null;
      busy = false;
    }
    persist();
    if (current && page === "chat" && selected?.id === id) {
      const box = $("#messages"),
        top = box?.scrollTop,
        follow =
          !box || box.scrollHeight - box.scrollTop - box.clientHeight < 140;
      render();
      if (!follow && $("#messages")) $("#messages").scrollTop = top;
      $("#message")?.focus();
    }
  }
  return succeeded;
}
function send(text) {
  text = text.trim();
  if (!text || busy) return;
  if (!selected.real) return toast("这部小说正在准备中。");
  if (chatError && state.chats[selected.id]?.at(-1)?.role === "user") {
    toast("请重试上一条消息，或开始新对话。");
    return;
  }
  if (text.length > 4000) return toast("每条消息最多4000个字符。");
  analytics.track("message_send", {
    character_id: selected.id,
    message_count:
      state.chats[selected.id].filter((m) => m.role === "user").length + 1,
  });
  drafts[selected.id] = "";
  persistDraft();
  if ($("#message")) $("#message").value = "";
  state.chats[selected.id].push({ role: "user", text });
  persist();
  generate();
}

let paymentController = null,
  paymentUser = null;
modal.addEventListener("close", () => {
  paymentController?.abort();
  paymentController = null;
});
let loginIntent = {};
function showLogin(intent = {}) {
  loginIntent = intent;
  openModal(`<section class="login-panel"><span class="eyebrow">STORYLOVE</span><h2>${intent.action === "checkout" ? "登录后继续充值" : "欢迎回来"}</h2><p>对话保存在此浏览器，登录不会清除记录。</p><button class="primary" data-action="googleLogin">使用 Google 继续</button>${account.provider === "supabase" ? '<form id="emailLoginForm"><label for="loginEmail">或使用邮箱登录 / 注册</label><input id="loginEmail" type="email" autocomplete="email" required placeholder="你的邮箱"><button class="secondary" type="submit">发送登录链接</button><p id="emailLoginStatus" role="status"></p></form>' : ""}<button class="text-button" data-action="closeModal">继续浏览</button></section>`);
}
function openModal(html) {
  paymentController?.abort();
  paymentController = null;
  modal.innerHTML = `<button class="close" data-action="closeModal" aria-label="关闭">${icon("close")}</button>${html}`;
  if (!modal.open) modal.showModal();
}
async function checkout(pack) {
  if (walletBusy || !account.payments) return;
  await window.accountReady;
  if (!account.user)
    return showLogin({ route: "#credits", action: "checkout", pack: Number(pack) });
  walletBusy = true;
  render();
  try {
    const key = "storylove-checkout:" + account.user.id + ":" + pack;
    let pending;
    try {
      pending = JSON.parse(sessionStorage.getItem(key));
    } catch {}
    if (!pending || Date.now() - pending.created > 1800000) {
      pending = { id: crypto.randomUUID(), created: Date.now() };
      sessionStorage.setItem(key, JSON.stringify(pending));
    }
    analytics.track("checkout_start", {
      pack: Number(pack),
      flow_id: pending.id,
    });
    if (!account.embeddedPayments)
      throw Error("站内付款正在准备中，请稍后再试。");
    const controller = new AbortController();
    const packInfo = window.STORYLOVE_CREDIT_PACKS.find(
      (p) => p.credits === Number(pack),
    );
    openModal(
      `<section class="embedded-checkout"><h2 id="payment-title">${esc(packInfo.label)} · ${Number(pack).toLocaleString()} Credits</h2><p>${esc(new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(packInfo.amount / 100))} USD · 一次性${account.walletMode === "test" ? " · 测试付款" : ""}</p><form aria-labelledby="payment-title"><div data-wallet-section><div data-express-element></div></div><p class="payment-separator" data-wallet-separator hidden>或使用其他付款方式</p><div data-payment-element></div><p data-payment-error role="alert"></p><p data-payment-status role="status">正在加载安全付款界面…</p><button class="primary payment-submit" type="submit" disabled>确认付款</button></form><p class="quiet">支付信息由 Stripe 安全处理。余额将在交易确认后到账。</p></section>`,
    );
    paymentController = controller;
    paymentUser = account.user.id;
    const userId = account.user.id;
    const result = await account.api("checkout", {
      pack: Number(pack),
      request_id: pending.id,
      ui_mode: "elements",
      analytics: { session_id: analytics.session },
    });
    if (controller.signal.aborted || account.user?.id !== userId) return;
    sessionStorage.setItem("storylove-payment-return", result.session_id);
    const { mountCheckout } = await import("/checkout.js");
    if (controller.signal.aborted || account.user?.id !== userId) return;
    await mountCheckout({
      root: modal.querySelector(".embedded-checkout"),
      publishableKey: account.stripePublishableKey,
      clientSecret: result.client_secret,
      signal: controller.signal,
      onComplete(sessionId) {
        sessionStorage.removeItem(key);
        paymentSession = sessionId;
        sessionStorage.setItem("storylove-payment-return", sessionId);
        paymentState = "pending";
        modal.close();
        location.hash = "credits";
        verifyPayment();
      },
    });
    if (!controller.signal.aborted)
      analytics.track("checkout_ready", {
        pack: Number(pack),
        flow_id: pending.id,
      });
  } catch (error) {
    analytics.track("checkout_failed", {
      pack: Number(pack),
      reason: "unavailable",
    });
    const paymentError = modal.querySelector("[data-payment-error]");
    if (modal.open && paymentError) {
      paymentError.textContent = error.message;
      modal.querySelector("[data-payment-status]").textContent = "";
    } else toast(error.message);
  } finally {
    walletBusy = false;
    if (page === "credits") render();
  }
}
async function checkin() {
  if (walletBusy) return;
  await window.accountReady;
  if (!account.user)
    return account.login({ route: "#credits", action: "checkin" });
  walletBusy = true;
  render();
  analytics.track("checkin_start");
  try {
    account.wallet = await account.api("checkin", {});
    analytics.track("checkin_complete", {
      outcome: account.wallet.claimed ? "claimed" : "already_claimed",
    });
    toast(
      account.wallet.claimed ? "已领取 100 Credits" : "今日已签到，明天再来。",
    );
  } catch (error) {
    analytics.track("checkin_failed", { reason: "unavailable" });
    toast(error.message);
  } finally {
    walletBusy = false;
    if (page === "credits") render();
  }
}
async function verifyPayment() {
  if (!paymentSession || paymentPolling || !account.user) return;
  paymentPolling = true;
  paymentState = "pending";
  if (page === "credits") render();
  try {
    for (let attempt = 0; attempt < 8; attempt++) {
      const status = await account.api(
        "checkout-status?session_id=" + encodeURIComponent(paymentSession),
      );
      if (status.credited) {
        paymentState = "credited";
        for (const key of Object.keys(sessionStorage))
          if (key.startsWith("storylove-checkout:" + account.user.id + ":"))
            sessionStorage.removeItem(key);
        sessionStorage.removeItem("storylove-payment-return");
        await account.refreshWallet();
        break;
      }
      if (status.status === "expired") {
        paymentState = "unpaid";
        break;
      }
      paymentState = status.paid ? "waiting" : "processing";
      if (attempt < 7)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(1000 * (attempt + 1), 5000)),
        );
    }
  } catch {
    paymentState = "error";
  } finally {
    paymentPolling = false;
    if (page === "credits") render();
  }
}
async function resumeIntent() {
  const intent = account.takeIntent?.();
  if (!intent) return;
  location.hash = intent.route;
  route();
  if (intent.action === "checkout") await checkout(intent.pack);
  if (intent.action === "checkin") await checkin();
  if (intent.action === "chat") {
    $("#message")?.focus();
    toast("已登录，点击发送即可继续。");
  }
}
window.addEventListener("accountchange", () => {
  historyList();
  if (paymentController && account.user?.id !== paymentUser) {
    paymentController.abort();
    if (modal.querySelector(".embedded-checkout") && modal.open) modal.close();
  }
  if (account.user) resumeIntent().catch((error) => toast(error.message));
  if (["credits", "profile"].includes(page)) render();
  else if (page === "chat" && !busy) {
    // Preserve composer, scroll and focus when tokens/session refresh in the background.
    const button = $('#sendForm button[type="submit"]');
    if (button) button.disabled = busy;
  }
});
document.addEventListener("input", (event) => {
  if (event.target.id === "search") {
    query = event.target.value;
    searchResults();
  }
  if (event.target.id === "message") {
    drafts[selected.id] = event.target.value;
    persistDraft();
    event.target.style.height = "auto";
    event.target.style.height = Math.min(event.target.scrollHeight, 130) + "px";
  }
});
document.addEventListener("submit", (event) => {
  if (event.target.id === "emailLoginForm") {
    event.preventDefault();
    const button = event.target.querySelector("button"), status = $("#emailLoginStatus");
    button.disabled = true;
    account.loginEmail($("#loginEmail").value.trim(), loginIntent)
      .then(() => { status.textContent = "登录链接已发送，请检查邮箱。"; })
      .catch(e => { status.textContent = e.message; })
      .finally(() => { button.disabled = false; });
  }
  if (event.target.id === "sendForm") {
    event.preventDefault();
    send($("#message").value);
  }
  if (event.target.id === "profileForm") {
    event.preventDefault();
    state.nickname = $("#nickname").value.trim() || "旅行者";
    state.avatar = state.nickname;
    persist();
    toast("称呼已保存。");
  }
});
document.addEventListener("keydown", (event) => {
  if (
    event.target.id === "message" &&
    event.key === "Enter" &&
    !event.shiftKey &&
    !event.isComposing
  ) {
    event.preventDefault();
    send(event.target.value);
  }
});
document.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button || button.disabled) return;
  const data = button.dataset;
  try {
    if (data.page) {
      if (modal.open) modal.close();
      nav(data.page);
      return;
    }
    if (button.id === "collapse") {
      document.body.classList.toggle("collapsed");
      button.setAttribute(
        "aria-expanded",
        !document.body.classList.contains("collapsed"),
      );
      return;
    }
    if (data.title) {
      location.hash = "title/" + data.title;
      return;
    }
    if (data.archive !== undefined) {
      const entry = state.archives[Number(data.archive)];
      if (!entry) return;
      const name = items().find(t => t.id === entry.characterId)?.name || entry.characterId;
      openModal(`<h2>${esc(name)} · 以前的对话</h2><div class="archive-messages">${entry.messages.map(m => `<div class="msg ${m.role}"><small>${esc(m.role === "user" ? state.nickname : name)}</small><div class="bubble">${m.role === "assistant" ? formatReply(m.text) : esc(m.text)}</div></div>`).join("")}</div>`);
      return;
    }
    if (data.chat) {
      if (location.hash === "#chat/" + data.chat) startChat(data.chat);
      else location.hash = "chat/" + data.chat;
      return;
    }
    if (data.genre) {
      genre = data.genre;
      render();
      return;
    }
    if (data.feature !== undefined) {
      hero = Number(data.feature);
      render();
      return;
    }
    if (data.like) {
      const index = state.favorites.indexOf(data.like);
      if (index < 0) state.favorites.push(data.like);
      else state.favorites.splice(index, 1);
      persist();
      render();
      return;
    }
    if (data.suggestion) {
      $("#message").value = data.suggestion;
      drafts[selected.id] = data.suggestion;
      persistDraft();
      $("#message").focus();
      return;
    }
    if (data.searchtype) {
      searchType = data.searchtype;
      document.querySelectorAll("[data-searchtype]").forEach((b) => {
        b.classList.toggle("selected", b === button);
        b.setAttribute("aria-pressed", b === button);
      });
      searchResults();
      return;
    }
    if (data.refill) {
      await checkout(data.refill);
      return;
    }
    if (data.regenerate !== undefined) {
      if (busy) return;
      analytics.track("conversation_regenerate", { character_id: selected.id });
      state.chats[selected.id].splice(Number(data.regenerate));
      persist();
      await generate();
      return;
    }
    switch (data.action) {
      case "closeModal":
        modal.close();
        break;
      case "backDetail":
        nav("character");
        break;
      case "login":
        showLogin({ route: location.hash || "#profile" });
        break;
      case "googleLogin":
        await account.login(loginIntent);
        break;
      case "logout":
        await account.logout();
        toast("已退出登录。");
        break;
      case "checkin":
        await checkin();
        break;
      case "refreshWallet":
        await account.refreshWallet();
        break;
      case "verifyPayment":
        await verifyPayment();
        break;
      case "retryChat":
        await generate();
        break;
      case "stopChat":
        activeRequest?.abort();
        break;
      case "creditHistory":
        await account.refreshWallet();
        openModal(
          `<h2>Credits 流水</h2>${account.wallet?.history?.length ? '<div class="ledger">' + account.wallet.history.map((entry) => `<div class="settingrow"><span>${entry.kind === "checkin" ? "每日签到" : "充值"}<small>${esc(new Date(entry.created_at).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }))}</small></span><b>+${esc(entry.delta)}</b></div>`).join("") + "</div>" : '<p class="quiet">暂无流水。</p>'}`,
        );
        break;
      case "chatMenu":
        openModal(
          '<h2>这段对话</h2><button class="settingrow" data-action="exportChat">导出对话</button><button class="settingrow" data-action="confirmRestart">开始新对话</button>',
        );
        break;
      case "restartChat":
      case "confirmRestart":
        if (busy) break;
        openModal(
          '<h2>重新开始这段故事？</h2><p class="quiet">当前对话会保留在最近对话中。</p><div class="modalactions"><button class="secondary" data-action="exportChat">先导出</button><button class="primary" data-action="doRestart">重新开始</button></div>',
        );
        break;
      case "doRestart":
        if (busy) break;
        analytics.track("conversation_restart", { character_id: selected.id });
        archiveCurrentChat();
        state.chats[selected.id] = [
          { role: "assistant", text: selected.intro },
        ];
        drafts[selected.id] = "";
        persistDraft();
        chatError = "";
        persist();
        modal.close();
        render();
        break;
      case "exportChat": {
        const blob = new Blob(
          [
            state.chats[selected.id]
              .filter((m) => !m.pending)
              .map(
                (m) =>
                  (m.role === "user" ? state.avatar : selected.name) +
                  ": " +
                  m.text,
              )
              .join("\n\n"),
          ],
          { type: "text/plain;charset=utf-8" },
        );
        const anchor = document.createElement("a");
        const url = URL.createObjectURL(blob);
        anchor.href = url;
        anchor.download = "StoryLove-" + selected.id + ".txt";
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        modal.close();
        break;
      }
      case "help":
        openModal(
          "<h2>让故事自然开始</h2><p>在角色页选择一位角色，直接开始对话。无需登录即可聊天；充值前再选择登录方式。</p><p>小说书架正在筹备正文，你可以先收藏喜欢的题材。</p><p>对话和收藏保存在当前浏览器；账户余额与登录关联。聊天暂不消耗 Credits。</p>",
        );
        break;
    }
  } catch (error) {
    toast(error.message || "操作失败，请稍后重试。");
  }
});
function route() {
  const hash = location.hash.slice(1);
  if (page === "chat" && $("#message") && selected) {
    drafts[selected.id] = $("#message").value;
    persistDraft();
  }
  if (hash.startsWith("chat/")) {
    if (page !== "chat" || selected?.id !== hash.slice(5))
      startChat(hash.slice(5));
    return;
  }
  if (activeRequest) {
    activeRequest.abort();
    activeRequest = null;
    busy = false;
  }
  if (hash.startsWith("title/")) {
    selected = items().find((t) => t.id === hash.slice(6));
    if (!selected) return nav("story");
    page = "detail";
    analytics.track("character_view", { character_id: selected.id });
  } else {
    page = [
      "story",
      "character",
      "titles",
      "history",
      "credits",
      "profile",
      "search",
    ].includes(hash)
      ? hash
      : "story";
  }
  render();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);
window.addEventListener("pagehide", persistDraft);
window.addEventListener("focus", () => {
  if (page === "credits" && account.user) account.refreshWallet();
});
// Boot is separate from view functions so unit tests can exercise the stream controller.
const boot = async () => {
  const url = new URL(location.href),
    outcome = url.searchParams.get("checkout");
  paymentSession = url.searchParams.get("session_id");
  if (outcome) {
    paymentState = outcome === "success" ? "pending" : "cancelled";
    if (outcome === "cancelled")
      sessionStorage.removeItem("storylove-payment-return");
    if (paymentSession && /^cs_[\w]+$/.test(paymentSession))
      sessionStorage.setItem("storylove-payment-return", paymentSession);
    else paymentSession = null;
    for (const key of Object.keys(sessionStorage))
      if (key.startsWith("storylove-checkout:")) sessionStorage.removeItem(key);
    analytics.track("checkout_return", {
      outcome: outcome === "success" ? "success" : "cancelled",
    });
    url.searchParams.delete("checkout");
    url.searchParams.delete("session_id");
    url.hash = "credits";
    history.replaceState(null, "", url);
  }
  route();
  fetch("/api/status")
    .then((r) => (r.ok ? r.json() : null))
    .then((status) => {
      serviceReady = status?.ready ?? null;
    })
    .catch(() => {});
  await window.accountReady;
  await resumeIntent();
  if (!paymentSession)
    paymentSession = sessionStorage.getItem("storylove-payment-return");
  if (paymentSession && account.user) await verifyPayment();
};
boot().catch(() => toast("页面初始化失败，请刷新重试。"));

let heroGesture = null;
document.addEventListener("pointermove", event => {
  const card = event.target.closest(".card, .plan");
  if (!card || event.pointerType === "touch") return;
  const rect = card.getBoundingClientRect();
  card.style.setProperty("--pointer-x", `${event.clientX - rect.left}px`);
  card.style.setProperty("--pointer-y", `${event.clientY - rect.top}px`);
});
document.addEventListener("pointerdown", event => {
  if (event.target.closest(".characterhero") && !event.target.closest("button") && event.button === 0)
    heroGesture = { x: event.clientX, y: event.clientY, id: event.pointerId };
});
document.addEventListener("pointerup", event => {
  const start = heroGesture; heroGesture = null;
  if (!start || start.id !== event.pointerId) return;
  const dx = event.clientX - start.x, dy = event.clientY - start.y;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    hero = (hero + (dx < 0 ? 1 : -1) + realCharacters.length) % realCharacters.length;
    render();
  }
});
document.addEventListener("pointercancel", () => { heroGesture = null; });
document.addEventListener("wheel", event => {
  if (!event.target.closest(".characterhero") || Math.abs(event.deltaX) < 30 || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
  event.preventDefault();
  if (window.heroWheelLock) return;
  window.heroWheelLock = true;
  hero = (hero + (event.deltaX > 0 ? 1 : -1) + realCharacters.length) % realCharacters.length;
  render();
  setTimeout(() => { window.heroWheelLock = false; }, 350);
}, { passive: false });

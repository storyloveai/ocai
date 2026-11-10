const SITE_LABEL = { tipsy: "Tipsy", chai: "Chai", zeta: "Zeta" };
const STYLE_LABEL = {
  webtoon: "韩漫 / 动漫",
  comic_ink: "黑白漫画",
  game_3d: "3D 游戏",
  dark_fantasy_painting: "暗黑奇幻",
  semi_realistic_painting: "半写实",
  cosplay_photo: "Cosplay 摄影",
  photo_editorial: "编辑摄影",
  poster_graphic: "海报 / 拼贴",
  group_shot: "多人构图",
  environmental_portrait: "环境肖像",
  photo_candid: "手机随手拍",
};
const COMP_LABEL = {
  full_body: "全身",
  upper_body: "上半身",
  close_up: "特写",
  action: "动作",
  group: "多人",
  environmental: "环境",
};
const TIER_LABEL = {
  top_10: "top 10%",
  upper_mid: "50–90%",
  mid: "25–50%",
  long_tail: "长尾 25%",
};

const state = {
  entries: [],
  site: "all",
  style: "all",
  composition: "all",
  tier: "all",
  query: "",
};

const $ = (selector) => document.querySelector(selector);
const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char]));

function options(entries, key, labels) {
  const counts = new Map();
  for (const entry of entries) {
    const value = entry[key];
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value, count]) => `<option value="${esc(value)}">${esc(labels[value] || value)} (${count})</option>`)
    .join("");
}

function filtered() {
  const q = state.query.trim().toLowerCase();
  return state.entries.filter((entry) => {
    if (state.site !== "all" && entry.site !== state.site) return false;
    if (state.style !== "all" && entry.style_bucket !== state.style) return false;
    if (state.composition !== "all" && entry.composition_bucket !== state.composition) return false;
    if (state.tier !== "all" && entry.tier !== state.tier) return false;
    if (!q) return true;
    return [entry.title, entry.name, entry.role, entry.tags, entry.tagline]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });
}

function card(entry) {
  const tags = String(entry.tags || "").split("|").slice(0, 3).join(" · ");
  return `
    <button class="card" data-id="${esc(entry.id)}" aria-label="查看 ${esc(entry.title)}">
      <div class="thumb">
        <img src="${esc(entry.image)}" alt="${esc(entry.title)}" loading="lazy" decoding="async"
          width="${entry.width}" height="${entry.height}" />
        <span class="site-pill ${esc(entry.site)}">${esc(SITE_LABEL[entry.site] || entry.site)}</span>
        <span class="tier-pill">${esc(TIER_LABEL[entry.tier] || entry.tier)}</span>
      </div>
      <div class="card-body">
        <h3>${esc(entry.title)}</h3>
        <div class="role">${esc(entry.role)} · ${esc(entry.name)}</div>
        <div class="card-meta">
          <span>${esc(STYLE_LABEL[entry.style_bucket] || entry.style_bucket)}</span>
          <span>·</span>
          <span>${esc(COMP_LABEL[entry.composition_bucket] || entry.composition_bucket)}</span>
        </div>
      </div>
    </button>`;
}

function render() {
  const result = filtered();
  $("#grid").innerHTML = result.map(card).join("");
  $("#emptyState").hidden = result.length !== 0;
  $("#resultCount").textContent = `显示 ${result.length} / ${state.entries.length} 个角色`;
  document.querySelectorAll(".site-tab").forEach((tab) => {
    const selected = tab.dataset.site === state.site;
    tab.classList.toggle("selected", selected);
    tab.setAttribute("aria-selected", String(selected));
  });
}

function syncSelects() {
  $("#styleFilter").value = state.style;
  $("#compositionFilter").value = state.composition;
  $("#tierFilter").value = state.tier;
}

function modal(entry) {
  const dialog = $("#lightbox");
  $("#modalImg").src = entry.image;
  $("#modalImg").alt = entry.title;
  $("#modalTitle").textContent = entry.title;
  $("#modalTagline").textContent = entry.tagline || "";
  $("#modalMeta").innerHTML = [
    SITE_LABEL[entry.site] || entry.site,
    TIER_LABEL[entry.tier] || entry.tier,
    STYLE_LABEL[entry.style_bucket] || entry.style_bucket,
    COMP_LABEL[entry.composition_bucket] || entry.composition_bucket,
    entry.aspect_ratio,
  ].map((text) => `<span>${esc(text)}</span>`).join("");
  $("#modalTags").innerHTML = String(entry.tags || "")
    .split("|")
    .filter(Boolean)
    .map((tag) => `<span>${esc(tag)}</span>`)
    .join("");
  $("#modalGreeting").textContent = String(entry.greeting || "").replaceAll("{{user}}", "你");
  $("#modalPrompt").textContent = entry.prompt || "";
  if (!dialog.open) dialog.showModal();
}

function interleave(entries) {
  const groups = { tipsy: [], chai: [], zeta: [] };
  for (const entry of entries) groups[entry.site]?.push(entry);
  const ordered = [];
  const max = Math.max(...Object.values(groups).map((group) => group.length));
  for (let index = 0; index < max; index += 1) {
    for (const site of ["tipsy", "chai", "zeta"]) {
      if (groups[site][index]) ordered.push(groups[site][index]);
    }
  }
  return ordered;
}

async function boot() {
  try {
    const response = await fetch("/replica/data.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    state.entries = interleave(data.entries || []);
    $("#styleFilter").insertAdjacentHTML("beforeend", options(state.entries, "style_bucket", STYLE_LABEL));
    $("#compositionFilter").insertAdjacentHTML("beforeend", options(state.entries, "composition_bucket", COMP_LABEL));
    $("#tierFilter").insertAdjacentHTML("beforeend", options(state.entries, "tier", TIER_LABEL));
    render();
  } catch (error) {
    $("#resultCount").textContent = "图库加载失败";
    $("#grid").innerHTML = `<div class="empty-state"><b>无法加载图库</b><p>${esc(error.message)}</p></div>`;
  }
}

document.addEventListener("click", (event) => {
  const siteTab = event.target.closest("[data-site]");
  if (siteTab) {
    state.site = siteTab.dataset.site;
    render();
    return;
  }
  const cardButton = event.target.closest(".card[data-id]");
  if (cardButton) {
    const entry = state.entries.find((item) => item.id === cardButton.dataset.id);
    if (entry) modal(entry);
  }
});

$("#styleFilter").addEventListener("change", (event) => { state.style = event.target.value; render(); });
$("#compositionFilter").addEventListener("change", (event) => { state.composition = event.target.value; render(); });
$("#tierFilter").addEventListener("change", (event) => { state.tier = event.target.value; render(); });
$("#searchInput").addEventListener("input", (event) => { state.query = event.target.value; render(); });
$("#resetFilters").addEventListener("click", () => {
  state.site = "all"; state.style = "all"; state.composition = "all"; state.tier = "all"; state.query = "";
  $("#searchInput").value = "";
  syncSelects();
  render();
});
$("#modalClose").addEventListener("click", () => $("#lightbox").close());
$("#lightbox").addEventListener("click", (event) => {
  if (event.target === $("#lightbox")) $("#lightbox").close();
});

boot();

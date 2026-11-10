import {getLang} from './site-i18n.js';

// Additive character shelf for the generated covers. It reuses the captured
// card template on /character, so the page chrome stays untouched.
const PAGE_SIZE = 24;
const CSS_HREF = '/assets/generated-character-shelf.css';
const COPY = {
  en: {
    source: 'Source', gender: 'Gender', allSources: 'All sources', allGenders: 'All genders',
    female: 'Female', male: 'Male', nonbinary: 'Non-binary',
    count: n => `${n} characters`, page: (n, total) => `Page ${n} of ${total}`,
    previous: 'Previous', next: 'Next', featured: 'Three Kingdoms · The Strategist',
    empty: 'No characters match these filters.'
  },
  zh: {
    source: '来源', gender: '性别', allSources: '全部来源', allGenders: '全部性别',
    female: '女性', male: '男性', nonbinary: '非二元',
    count: n => `${n} 个角色`, page: (n, total) => `第 ${n} / ${total} 页`,
    previous: '上一页', next: '下一页', featured: '三国 · 谋士',
    empty: '没有符合当前筛选的角色。'
  }
};

function addStyle() {
  if (document.querySelector(`link[href="${CSS_HREF}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = CSS_HREF;
  document.head.append(link);
}

function localized(c, lang) {
  return {
    title: lang === 'zh' ? c.title_zh || c.title : c.title,
    description: lang === 'zh' ? c.description_zh || c.description : c.description
  };
}

function makeCard(template, item, {href = '', lang = 'en'} = {}) {
  const node = template.cloneNode(true);
  node.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
  const anchor = node.querySelector('a');
  if (href) {
    anchor.setAttribute('href', href);
  } else {
    anchor.removeAttribute('href');
    anchor.setAttribute('role', 'group');
    anchor.setAttribute('aria-label', item.title);
  }
  const images = [...anchor.querySelectorAll('img')];
  const cover = images.find(img => img.classList.contains('object-cover')) || images.at(-1);
  if (cover) {
    cover.src = item.image;
    cover.alt = item.title;
    cover.loading = 'lazy';
    cover.removeAttribute('data-asset');
    cover.removeAttribute('srcset');
    cover.removeAttribute('sizes');
    cover.style.visibility = '';
    cover.setAttribute('fetchpriority', 'low');
  }
  const text = anchor.querySelectorAll('p');
  if (text[0]) text[0].textContent = item.title;
  if (text[1]) text[1].textContent = item.description || '';
  if (text[2]) text[2].textContent = item.sourceLabel || '';
  node.dataset.generatedCard = item.id;
  if (href) node.dataset.featuredCharacter = item.id;
  return node;
}

function select(labelText, options, value, onChange) {
  const label = document.createElement('label');
  const span = document.createElement('span');
  span.textContent = labelText;
  const el = document.createElement('select');
  for (const [optionValue, optionLabel] of options) {
    const option = document.createElement('option');
    option.value = optionValue;
    option.textContent = optionLabel;
    el.append(option);
  }
  const selected = [...el.options].find(option => option.value === value);
  if (selected) selected.selected = true;
  el.addEventListener('change', () => onChange(el.value));
  label.append(span, el);
  return {label, select: el, span};
}

export function mountGeneratedCharacterShelf(section, container, template, {generated, featured}) {
  if (!section || !container || !template || !generated?.length) return;
  if (!template.querySelector('a')) return;
  addStyle();
  // The captured "Most Played" control sorted the retired OOC catalogue. The
  // generated shelf has its own source/gender filters and pagination.
  section.querySelector('h2')?.parentElement?.querySelector('button')?.remove();

  const lang0 = getLang();
  let labels = COPY[lang0] || COPY.en;
  const baseClass = container.className;
  const state = {site: 'all', gender: 'all', page: 1};
  const sites = [...new Set(generated.map(c => c.site))];
  const siteLabels = new Map(generated.map(c => [c.site, c.siteLabel || c.site]));

  container.className = `${baseClass} sd-generated-grid`;
  container.dataset.generatedGrid = '';
  container.setAttribute('data-no-i18n', '');

  const toolbar = document.createElement('div');
  toolbar.className = 'sd-generated-toolbar';
  toolbar.setAttribute('data-no-i18n', '');
  const source = select(labels.source, [['all', labels.allSources], ...sites.map(site => [site, siteLabels.get(site)])], state.site, value => {
    state.site = value; state.page = 1; render();
  });
  const gender = select(labels.gender, [['all', labels.allGenders], ['female', labels.female], ['male', labels.male], ['nonbinary', labels.nonbinary]], state.gender, value => {
    state.gender = value; state.page = 1; render();
  });
  const count = document.createElement('p');
  count.className = 'sd-generated-count';
  count.dataset.generatedCount = '';
  toolbar.append(source.label, gender.label, count);
  container.before(toolbar);

  const pager = document.createElement('nav');
  pager.className = 'sd-generated-pagination';
  pager.setAttribute('data-no-i18n', '');
  container.after(pager);

  const featuredBlock = document.createElement('div');
  featuredBlock.className = 'sd-generated-featured';
  featuredBlock.setAttribute('data-no-i18n', '');
  featuredBlock.innerHTML = '<h3 class="sd-generated-subheading"></h3>';
  const featuredGrid = document.createElement('div');
  featuredGrid.className = baseClass;
  featuredBlock.append(featuredGrid);
  pager.after(featuredBlock);

  function pageButton(label, page, {current = false, disabled = false, aria} = {}) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.dataset.generatedPage = String(page);
    if (aria) button.setAttribute('aria-label', aria);
    if (current) button.setAttribute('aria-current', 'page');
    button.disabled = disabled;
    return button;
  }

  function renderFeatured() {
    const lang = getLang();
    featuredGrid.replaceChildren();
    for (const c of featured || []) {
      const text = localized(c, lang);
      featuredGrid.append(makeCard(template, {
        id: c.id, title: text.title, description: text.description, image: c.image,
        sourceLabel: c.author || 'StoryDate Studio'
      }, {href: `/character/${c.id}`, lang}));
    }
  }

  function render() {
    const filtered = generated.filter(c =>
      (state.site === 'all' || c.site === state.site) &&
      (state.gender === 'all' || c.gender === state.gender));
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    state.page = Math.min(state.page, totalPages);
    const start = (state.page - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);
    container.replaceChildren(...pageItems.map(c => makeCard(template, c)));

    count.textContent = labels.count(filtered.length);
    pager.setAttribute('aria-label', labels.page(state.page, totalPages));
    pager.replaceChildren();
    pager.append(pageButton(`‹ ${labels.previous}`, state.page - 1, {disabled: state.page === 1, aria: labels.previous}));
    for (let i = 1; i <= totalPages; i++) {
      pager.append(pageButton(String(i), i, {current: i === state.page, aria: labels.page(i, totalPages)}));
    }
    pager.append(pageButton(`${labels.next} ›`, state.page + 1, {disabled: state.page === totalPages, aria: labels.next}));

    if (!pageItems.length) {
      const empty = document.createElement('p');
      empty.className = 'sd-generated-empty';
      empty.textContent = labels.empty;
      container.append(empty);
    }
  }

  pager.addEventListener('click', event => {
    const button = event.target.closest('button[data-generated-page]');
    if (!button || button.disabled) return;
    const page = Number(button.dataset.generatedPage);
    if (!Number.isInteger(page) || page < 1 || page === state.page) return;
    state.page = page;
    render();
    container.scrollIntoView?.({behavior: 'smooth', block: 'start'});
  });

  function relabel() {
    labels = COPY[getLang()] || COPY.en;
    source.span.textContent = labels.source;
    gender.span.textContent = labels.gender;
    source.select.options[0].textContent = labels.allSources;
    gender.select.options[0].textContent = labels.allGenders;
    gender.select.options[1].textContent = labels.female;
    gender.select.options[2].textContent = labels.male;
    gender.select.options[3].textContent = labels.nonbinary;
    featuredBlock.querySelector('.sd-generated-subheading').textContent = labels.featured;
    render();
    renderFeatured();
  }

  const onLang = () => {
    if (!section.isConnected) {
      globalThis.removeEventListener?.('sd-lang', onLang);
      return;
    }
    relabel();
  };
  globalThis.addEventListener?.('sd-lang', onLang);
  featuredBlock.querySelector('.sd-generated-subheading').textContent = labels.featured;
  render();
  renderFeatured();
}

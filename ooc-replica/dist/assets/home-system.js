import {FEATURED_STORIES, STORY_FILTERS} from './featured-stories.js';
import {getLang} from './site-i18n.js';
import {escapeHTML as safe} from './stream.js';

export function featuredStoryCard(story, lang) {
  return `<a class="fw-card" href="/story/${safe(story.id)}" data-story-card="${safe(story.id)}" data-full-info data-no-i18n>
    <span class="fw-card-portrait">
      <img src="${safe(story.image)}" alt="" width="300" height="450" loading="lazy">
      <span class="sd-capability${story.featured ? ' is-chat' : ''}">${safe(story.badge[lang])}</span>
      <span class="sd-card-quote"><span>${safe(story.quote[lang])}</span></span>
    </span>
    <div class="fw-card-body"><strong class="fw-card-name">${safe(story.title[lang])}</strong><p class="sd-card-meta">${safe(story.meta[lang])}</p></div>
  </a>`;
}

export function localizeStoryCard(card, story, lang) {
  card.querySelector('.sd-capability').textContent = story.badge[lang];
  card.querySelector('.sd-card-quote > span').textContent = story.quote[lang];
  card.querySelector('.fw-card-name').textContent = story.title[lang];
  card.querySelector('.sd-card-meta').textContent = story.meta[lang];
}

const libraryLabels = {
  zh: {name: '故事书库', filters: '筛选互动故事', count: n => `${n} 部互动故事`},
  en: {name: 'Story library', filters: 'Filter interactive stories', count: n => `${n} interactive ${n === 1 ? 'story' : 'stories'}`},
};

export function mountHomeSystem(root) {
  const library = root.querySelector('#story-library');
  root.classList.add('sd-evidence-home');
  const remembered = globalThis.history?.state?.storyFilter;
  let active = STORY_FILTERS.some(filter => filter.id === remembered) ? remembered : 'all';
  library.innerHTML = `<section class="fw-page sd-story-library" data-no-i18n>
    <div class="fw-filter-row">
      <div class="fw-filter-bar sd-story-filter-bar native-carousel" role="group">
        ${STORY_FILTERS.map(filter => `<button type="button" class="fw-chip" data-story-filter="${safe(filter.id)}"></button>`).join('')}
      </div>
      <span class="sd-story-count" data-story-count role="status"></span>
    </div>
    <div class="fw-grid sd-story-grid"></div>
  </section>`;
  const section = library.querySelector('.sd-story-library');
  const controls = section.querySelector('.sd-story-filter-bar');
  const count = section.querySelector('[data-story-count]');
  const grid = section.querySelector('.sd-story-grid');
  const buttons = [...controls.querySelectorAll('[data-story-filter]')];
  let shown = [];
  function syncLabels(lang) {
    const labels = libraryLabels[lang];
    section.setAttribute('aria-label', labels.name);
    controls.setAttribute('aria-label', labels.filters);
    buttons.forEach((button, i) => { button.textContent = STORY_FILTERS[i].label[lang]; });
    count.textContent = labels.count(shown.length);
  }
  function syncLanguage() {
    const lang = getLang();
    syncLabels(lang);
    [...grid.children].forEach((card, i) => localizeStoryCard(card, shown[i], lang));
  }
  function filterStories() {
    const lang = getLang();
    shown = FEATURED_STORIES.filter(story => active === 'all' || story.category === active);
    grid.innerHTML = shown.map(story => featuredStoryCard(story, lang)).join('');
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.storyFilter === active)));
    syncLabels(lang);
  }
  controls.addEventListener('click', event => {
    const button = event.target.closest('[data-story-filter]');
    if (!button || button.dataset.storyFilter === active) return;
    active = button.dataset.storyFilter;
    globalThis.history?.replaceState?.({...globalThis.history.state, storyFilter: active}, '');
    filterStories();
  });
  filterStories();
  return {syncLanguage};
}

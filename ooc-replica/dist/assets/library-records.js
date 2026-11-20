export const VISITED_TITLES_KEY = 'ooc-visited-titles';
const MAX_VISITED = 200, FALLBACK_COVER = '/assets/cover-0.webp';
const publicId = value => typeof value === 'string' && /^u-[\w-]{1,100}$/.test(value);

function coverImage(value) {
  if (typeof value !== 'string') return FALLBACK_COVER;
  if (value.startsWith('data:')) return value.length <= 8192 && /^data:image\/(png|jpeg|webp|gif|avif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value) ? value : FALLBACK_COVER;
  if (value.length <= 2048 && (/^\/(?!\/)/.test(value) || /^assets\//.test(value) || /^https?:\/\//.test(value))) return value;
  return FALLBACK_COVER;
}

function visitedTitle(value) {
  if (!value || !publicId(value.id) || !['story', 'character'].includes(value.type) || typeof value.title !== 'string' || !value.title.trim()) return null;
  return {id: value.id, title: value.title.trim().slice(0, 50), type: value.type, image: coverImage(value.image)};
}

function visitedTitles(snapshot) {
  return snapshot?.version === 1 && Array.isArray(snapshot.titles) ? snapshot.titles.slice(0, MAX_VISITED).map(visitedTitle).filter(Boolean) : [];
}

// A display cache is never a published draft or permission to reopen a title.
// Callers still fetch the remote title whenever its play URL is opened.
export function withVisitedTitle(snapshot, publicTitle) {
  const title = visitedTitle(publicTitle);
  if (!title) return null;
  const titles = new Map([[title.id, title]]);
  for (const previous of visitedTitles(snapshot)) {
    if (titles.size === MAX_VISITED) break;
    if (!titles.has(previous.id)) titles.set(previous.id, previous);
  }
  return {version: 1, titles: [...titles.values()]};
}

// Resolve only records supplied by the current account scope. Own publications
// and visited metadata never join the public catalog or grant access to a title.
export function resolveLibraryRecords(ids, catalog = [], drafts = [], visited = null) {
  const records = new Map((Array.isArray(catalog) ? catalog : []).filter(d => d && typeof d.id === 'string').map(d => [d.id, d]));
  for (const draft of Array.isArray(drafts) ? drafts : []) {
    if (!draft || draft.status !== 'published' || !['story', 'character'].includes(draft.type) ||
        !publicId(draft.publishedId) ||
        typeof draft.title !== 'string' || !draft.title.trim() || records.has(draft.publishedId)) continue;
    records.set(draft.publishedId, {
      id: draft.publishedId, publishedId: draft.publishedId, playUrl: '/play/' + draft.publishedId, type: draft.type,
      title: draft.title, description: typeof draft.description === 'string' ? draft.description : '',
      image: typeof draft.image === 'string' && draft.image ? draft.image : FALLBACK_COVER,
    });
  }
  for (const title of visitedTitles(visited)) if (!records.has(title.id)) records.set(title.id, {...title, playUrl: '/play/' + title.id});
  return [...new Set(Array.isArray(ids) ? ids : [])].map(id => records.get(id)).filter(Boolean);
}

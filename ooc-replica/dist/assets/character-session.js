import {characterById, characterScene} from './character-profiles.js';
import {createCharacterThreads} from './character-threads.js';

export function openCharacterSession(id, helpers) {
  const profile = characterById.get(id); if (!profile) return null;
  const makeManager = () => createCharacterThreads({id, read: helpers.read, save: helpers.save, defaultScene: profile.defaultScene || null});
  let manager = makeManager(), state = manager.initial();
  const query = new URLSearchParams(globalThis.location?.search || ''), requested = query.get('encounter');
  const encounter = profile.scenes?.find(s => s.id === requested);
  if (encounter && encounter.id !== state.thread.sceneId) {
    const lang = globalThis.document?.documentElement.lang?.startsWith('zh') ? 'zh' : 'en';
    manager.begin(encounter.id, encounter.title[lang], state.messages); manager = makeManager(); state = manager.initial();
  }
  if (requested) {
    query.delete('encounter');
    try {globalThis.history?.replaceState(globalThis.history.state, '', (globalThis.location.pathname || '/play/' + id) + (query.size ? '?' + query : '') + (globalThis.location.hash || ''));} catch {}
  }
  return {manager, state, profile: characterScene(profile, state.thread.sceneId)};
}

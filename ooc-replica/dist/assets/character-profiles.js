import {sanguoCharacters} from './sanguo-characters.js';
import {originalCharacters} from './original-characters.js';

export const characterProfiles = [...originalCharacters, ...sanguoCharacters];
export const characterById = new Map(characterProfiles.map(c => [c.id, c]));
export function characterScene(profile, id) {
  if (!profile?.scenes) return profile;
  const selected = profile.scenes.find(s => s.id === id) || profile.scenes[0];
  return {...profile, selectedScene: selected.id, scene: selected.location, opening: selected.opening, starters: selected.starters};
}

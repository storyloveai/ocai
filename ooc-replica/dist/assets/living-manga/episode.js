// All matching rules and outcome text belong to the episode. The first matching
// rule wins in either reading language. Test the normalized copy and keep the
// player's original punctuation, spelling and script for the panel and handoff.
export function resolveChoice(episode, input, lang = 'zh') {
  const { options, freeInput } = episode.decision;
  if (input?.optionId != null) {
    const option = options.find(({ id }) => id === input.optionId);
    if (!option || !Object.hasOwn(episode.branches, option.branchId)) return null;
    return { branchId: option.branchId, playerText: option.playerText[lang] };
  }
  if (typeof input?.text !== 'string') return null;
  const playerText = input.text.trim();
  if (!playerText || playerText.length > freeInput.maxLength) return null;

  const normalized = playerText.normalize('NFKC').replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
  const rule = freeInput.rules.find(({ pattern, unless }) =>
    new RegExp(pattern, 'iu').test(normalized) && !(unless && new RegExp(unless, 'iu').test(normalized))
  );
  const branchId = rule?.branchId ?? freeInput.fallbackBranchId;
  return Object.hasOwn(episode.branches, branchId) ? { branchId, playerText } : null;
}

export function interludeDraft(entry, choice, lang = 'zh') {
  return entry.draft[lang].replaceAll('{playerText}', () => choice.playerText);
}

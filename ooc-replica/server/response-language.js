export function responseLanguage(body) {
  if (body.language === undefined) return undefined;
  if (!['zh', 'en'].includes(body.language)) throw Error('Invalid response language');
  return body.language;
}
export function languageInstruction(language) {
  return language ? 'RESPONSE LANGUAGE: The visitor selected ' + (language === 'zh' ? 'Simplified Chinese' : 'English') + ' in the website language control. Use only that language for generated dialogue, narration and suggestions, even if history, canon or the visitor message contains another language. Do not append a parallel translation. Use the character name matching the selected language when both names exist in canon; keep the visitor’s own supplied name unchanged. This selection overrides automatic language detection; existing quoted source text remains source text.' : '';
}

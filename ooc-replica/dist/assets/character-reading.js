// Adds semantic reading layers to already escaped, application-generated HTML.
// Quotes in code blocks and HTML attributes are never interpreted as dialogue.
export function balanceCharacterAction(text) {
  const outsideCode = text.replace(/```[\s\S]*?(?:```|$)/g, '');
  const count = (outsideCode.match(/(?<![\\*])\*(?!\*)/g) || []).length;
  if (count % 2 && /(?:^|\n)\*$/.test(text)) return text.slice(0, -1);
  return count % 2 ? text + '*' : text;
}

export function characterReadingHTML(html, source) {
  const prose = source.replace(/```[\s\S]*?(?:```|$)|`[^`]*`/g, '');
  const quoted = /[“「『"]/.test(prose);
  let closer = null, codeDepth = 0;
  const pieces = html.split(/(<[^>]+>)/g).map(part => {
    if (part.startsWith('<')) {
      if (/^<(?:code|pre)(?:\s|>)/i.test(part)) codeDepth++;
      if (/^<\/(?:code|pre)>/i.test(part)) codeDepth = Math.max(0, codeDepth - 1);
      return part;
    }
    if (codeDepth || !part || !quoted) return part;
    return part.split(/([“”「」『』]|&quot;)/g).filter(Boolean).map(token => {
      const opens = {'“': '”', '「': '」', '『': '』'};
      let speech = Boolean(closer);
      if (!closer && opens[token]) {closer = opens[token]; speech = true;}
      else if (token === '&quot;') {speech = true; closer = closer === '&quot;' ? null : closer || '&quot;';}
      else if (closer && token === closer) {speech = true; closer = null;}
      return `<span class="${speech ? 'character-spoken' : 'character-narration'}">${token}</span>`;
    }).join('');
  });
  return `<div class="character-prose" data-no-i18n>${pieces.join('')}</div>`;
}

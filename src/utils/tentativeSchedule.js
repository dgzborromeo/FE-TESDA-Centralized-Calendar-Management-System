const TENTATIVE_PREFIX = '[TENTATIVE]';

export function parseTentativeDescription(rawDescription) {
  const raw = String(rawDescription || '');
  if (!raw) return { isTentative: false, note: '', plainDescription: '' };

  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const first = String(lines[0] || '').trim();
  const m = first.match(/^\[TENTATIVE\]\s*(.+)?$/i);
  if (!m) return { isTentative: false, note: '', plainDescription: raw };

  const note = String(m[1] || '').trim();
  const plainDescription = lines.slice(1).join('\n').trim();
  return { isTentative: true, note, plainDescription };
}

export function buildTentativeDescription(isTentative, note, plainDescription) {
  const cleanDesc = String(plainDescription || '').trim();
  if (!isTentative) return cleanDesc || undefined;
  const cleanNote = String(note || '').trim();
  const firstLine = cleanNote ? `${TENTATIVE_PREFIX} ${cleanNote}` : TENTATIVE_PREFIX;
  return cleanDesc ? `${firstLine}\n${cleanDesc}` : firstLine;
}


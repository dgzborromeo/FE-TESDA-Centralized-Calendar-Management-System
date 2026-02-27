export function parseRegionalDirectorsLabel(label) {
  const raw = String(label || '').trim();
  if (!raw) return [];
  if (raw.toLowerCase() === 'all rds') return ['All RDs'];
  return raw
    .split(',')
    .map((s) => String(s || '').trim())
    .filter(Boolean);
} 


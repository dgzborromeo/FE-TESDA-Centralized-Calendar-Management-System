export function parseParticipantLabel(label) {
  const raw = String(label || '').trim();
  if (!raw) return [];
  const lower = raw.toLowerCase();
  if (lower === 'all rds') return ['All RDs'];
  if (lower === 'all pds') return ['All PDs'];
  if (lower === 'all eds') return ['All EDs'];
  return raw
    .split(',')
    .map((s) => String(s || '').trim())
    .filter(Boolean);
}

export function parseRegionalDirectorsLabel(label) {
  return parseParticipantLabel(label);
} 


const STORAGE_KEY = 'event_regional_directors_participants';

function safelyParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export function saveRegionalDirectorsForEvent(eventId, names) {
  const idNum = Number(eventId);
  if (!Number.isFinite(idNum)) return;
  const cleanNames = Array.isArray(names)
    ? names
        .map((n) => String(n || '').trim())
        .filter((n) => n.length > 0)
    : [];
  try {
    const existingRaw = window.localStorage.getItem(STORAGE_KEY);
    const existing = existingRaw ? safelyParse(existingRaw) : {};
    existing[idNum] = cleanNames;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // Ignore storage errors (e.g., disabled cookies)
  }
}

export function getRegionalDirectorsForEvent(eventId) {
  const idNum = Number(eventId);
  if (!Number.isFinite(idNum)) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = safelyParse(raw);
    const names = data[idNum];
    return Array.isArray(names) ? names : [];
  } catch {
    return [];
  }
}

export function clearRegionalDirectorsForEvent(eventId) {
  const idNum = Number(eventId);
  if (!Number.isFinite(idNum)) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = safelyParse(raw);
    if (!data || typeof data !== 'object') return;
    delete data[idNum];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}


// scripts/ui/popup/month-category-store-drafts.js

/**
 * UI-only inline drafts (sessie-gebonden; geen localStorage writes)
 * Key: "year-month-type" -> Map(catName -> { valueRaw: string, scope: 'only'|'from'|'year' })
 */

const __ffInlineDrafts = new Map();
const __draftKey = (year, month, type) => `${year}-${month}-${type}`;

function __ensureDraftMap(year, month, type) {
  const k = __draftKey(year, month, type);
  if (!__ffInlineDrafts.has(k)) __ffInlineDrafts.set(k, new Map());
  return __ffInlineDrafts.get(k);
}

export function getInlineDraft(year, month, type, catName) {
  const m = __ffInlineDrafts.get(__draftKey(year, month, type));
  if (!m) return null;
  return m.get(String(catName || "")) || null;
}

export function setInlineDraft(year, month, type, catName, draft) {
  const m = __ensureDraftMap(year, month, type);
  m.set(String(catName || ""), draft || null);
}

export function deleteInlineDraft(year, month, type, catName) {
  const m = __ffInlineDrafts.get(__draftKey(year, month, type));
  if (!m) return;
  m.delete(String(catName || ""));
}

export function clearInlineDraft(year, month, type, catName) {
  deleteInlineDraft(year, month, type, catName);
}

export function getAllInlineDrafts(year, month, type) {
  const m = __ffInlineDrafts.get(__draftKey(year, month, type));
  if (!m) return {};
  const obj = {};
  for (const [name, d] of m.entries()) {
    if (!name) continue;
    if (d && typeof d === "object") obj[name] = { ...d };
  }
  return obj;
}

export function clearAllInlineDrafts(year, month, type) {
  __ffInlineDrafts.delete(__draftKey(year, month, type));
}

export function clearInlineDrafts(year, month, type) {
  clearAllInlineDrafts(year, month, type);
}

export function hasInlineDrafts(year, month, type) {
  const m = __ffInlineDrafts.get(__draftKey(year, month, type));
  return !!(m && m.size);
}

// Scope hint helpers (gebonden aan draft)
export function getInlineScopeHint(year, month, type, catName) {
  const d = getInlineDraft(year, month, type, catName);
  return d && d.scope ? d.scope : null;
}

export function setInlineScopeHint(year, month, type, catName, scope) {
  const d = getInlineDraft(year, month, type, catName) || {};
  setInlineDraft(year, month, type, catName, { ...d, scope: scope || d.scope || "only" });
}

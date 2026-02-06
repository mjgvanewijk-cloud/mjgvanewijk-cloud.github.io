// scripts/core/state/saving-accounts-precommit-data.js

export function upsertIntoSavingAccounts(existing, updated, replaceId) {
  const list = Array.isArray(existing) ? existing.slice() : [];
  const rid = replaceId ? String(replaceId) : null;
  const uid = updated?.id ? String(updated.id) : null;

  const match = (a) => {
    const id = String(a?.id || "");
    if (rid && id === rid) return true;
    if (uid && id === uid) return true;
    return false;
  };

  const idx = list.findIndex(match);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...updated };
  } else {
    const tmpId = uid || `tmp_${Date.now()}`;
    list.push({ ...updated, id: tmpId });
  }
  return list;
}

export function removeFromSavingAccounts(existing, deleteId) {
  const list = Array.isArray(existing) ? existing.slice() : [];
  const did = String(deleteId || "").trim();
  if (!did) return list;
  return list.filter((a) => String(a?.id || "") !== did);
}
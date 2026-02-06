// scripts/core/state/categories-data-upsert-guards.js

// Name uniqueness is whitespace/case insensitive.
export function normName(s) {
  return String(s || "").trim().toLowerCase();
}

function throwNameExists() {
  const e = new Error("FF_CAT_NAME_EXISTS");
  e.code = "FF_CAT_NAME_EXISTS";
  throw e;
}

function throwNameConflict() {
  const e = new Error("FF_CAT_NAME_CONFLICT");
  e.code = "FF_CAT_NAME_CONFLICT";
  throw e;
}

export function assertNoDuplicateName({ cats, newName, originalName }) {
  const list = Array.isArray(cats) ? cats : [];
  const newNameNorm = normName(newName);

  const findByNormName = (n) => list.find((c) => normName(c?.name) === n) || null;

  if (!originalName) {
    const existing = findByNormName(newNameNorm);
    if (existing) throwNameExists();
    return;
  }

  const originalNorm = normName(originalName);
  if (originalNorm !== newNameNorm) {
    const existing = findByNormName(newNameNorm);
    if (existing && normName(existing?.name) !== originalNorm) throwNameExists();
  }
}

export function findPrevCat({ cats, newName, originalName }) {
  const list = Array.isArray(cats) ? cats : [];
  if (originalName) {
    return list.find((c) => (c?.name || "") === originalName) || null;
  }
  return list.find((c) => (c?.name || "") === newName) || null;
}

// 2b) Guard: prevent same-name but different-type overwrites (income vs expense).
export function assertNoTypeConflict({ cats, prevCat, next, originalName }) {
  const name = String(next?.name || "");
  if (!name || name === "Overig") return;

  const wantedType = String(next?.type || "expense");

  // Conflict on add: category exists with same name but different type.
  if (!originalName && prevCat && String(prevCat.type || "expense") !== wantedType) {
    throwNameConflict();
  }

  // Conflict on rename: target name exists on a different category.
  if (originalName && String(originalName) !== name) {
    const list = Array.isArray(cats) ? cats : [];
    const existing = list.find((c) => (c?.name || "") === name);
    if (existing && existing !== prevCat) {
      throwNameConflict();
    }
  }
}

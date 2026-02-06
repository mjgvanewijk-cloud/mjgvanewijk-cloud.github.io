// scripts/core/storage/storage-helpers.js

export function safeParseJson(s) {
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
}

export function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return a === b;

  const ta = typeof a;
  const tb = typeof b;
  if (ta !== tb) return false;

  if (ta !== "object") return false;

  // Arrays
  const aa = Array.isArray(a);
  const ab = Array.isArray(b);
  if (aa || ab) {
    if (!(aa && ab)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // Objects
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
    if (!deepEqual(a[k], b[k])) return false;
  }
  return true;
}

export function isNoOpWrite(storageKey, nextValue) {
  const curStr = localStorage.getItem(storageKey);
  const nextStr = JSON.stringify(nextValue);

  // Fast path: exact string match
  if (curStr === nextStr) return { noOp: true, nextStr };

  // Slow path: semantic equality
  if (curStr != null) {
    const curVal = safeParseJson(curStr);
    if (curVal !== undefined && deepEqual(curVal, nextValue)) {
      return { noOp: true, nextStr };
    }
  }

  return { noOp: false, nextStr };
}
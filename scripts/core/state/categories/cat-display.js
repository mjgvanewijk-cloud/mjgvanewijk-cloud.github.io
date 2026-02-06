// scripts/core/state/categories/cat-display.js

export function ensureCatDisplay(entry, type) {
  if (!entry._catDisplay || typeof entry._catDisplay !== "object") entry._catDisplay = {};
  if (!entry._catDisplay[type] || typeof entry._catDisplay[type] !== "object") entry._catDisplay[type] = {};
  if (!entry._catDisplay[type].overrides || typeof entry._catDisplay[type].overrides !== "object") {
    entry._catDisplay[type].overrides = {};
  }
  return entry._catDisplay[type].overrides;
}


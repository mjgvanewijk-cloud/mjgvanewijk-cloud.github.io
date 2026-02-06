// scripts/core/state/categories-data-store.js
import {
  loadCats,
  loadSettings,
  saveSettings
} from "../storage/index.js";

let onDataChangedGlobal = null;

export function emitCategoriesChanged(detail = {}) {
  try {
    window.dispatchEvent(new CustomEvent("ff:categories-changed", { detail }));
  } catch (_) {}
}

export function setCategoriesChangeHandler(handler) {
  onDataChangedGlobal = handler;
}

export function triggerDataChanged() {
  if (typeof onDataChangedGlobal === "function") {
    onDataChangedGlobal();
  }
}

export function getAllCategories() {
  const catsRaw = loadCats();
  return Array.isArray(catsRaw) ? catsRaw : [];
}

export function getCategoryByName(name) {
  const cats = getAllCategories();
  return cats.find((c) => c && c.name === name) || null;
}

export function syncSettingsCategoriesFromCats() {
  const settings = loadSettings() || {};
  const cats = loadCats(); // direct laden

  settings.categories = {};
  if (Array.isArray(cats)) {
    cats.forEach((c) => {
      if (c && c.name) settings.categories[c.name] = { label: c.name, type: c.type };
    });
  }
  saveSettings(settings);
}
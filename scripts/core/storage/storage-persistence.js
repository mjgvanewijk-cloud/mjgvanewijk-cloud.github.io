// scripts/core/storage/storage-persistence.js
import { t } from "../../i18n.js";
import { recordSnapshot } from "../history/index.js";
import { isNoOpWrite } from "./storage-helpers.js";
import { ensureHistoryBatch } from "./storage-history.js";

export function loadCats() {
  try {
    const s = localStorage.getItem("finflow_categories");
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

export function saveCats(arr, reasonOverride = "") {
  const { noOp, nextStr } = isNoOpWrite("finflow_categories", arr);
  if (noOp) return false;
  // Always allow history capture before the write.
  // recordSnapshot() itself only stores *user-marked* steps, so boot/init writes
  // (without a user marker) remain non-undoable.
  ensureHistoryBatch();  recordSnapshot(reasonOverride || "");
  localStorage.setItem("finflow_categories", nextStr);
  return true;
}

export function loadMonthData() {
  try {
    const s = localStorage.getItem("finflow_monthdata");
    return s ? JSON.parse(s) : {};
  } catch { return {}; }
}

export function saveMonthData(obj, reasonOverride = "") {
  const { noOp, nextStr } = isNoOpWrite("finflow_monthdata", obj);
  if (noOp) return false;
  // See saveCats(): recordSnapshot() filters out non-user steps, so this is safe
  // even when the key is written for the first time.
  ensureHistoryBatch();  recordSnapshot(reasonOverride || "");
  localStorage.setItem("finflow_monthdata", nextStr);
  return true;
}

export function loadSettings() {
  const defaults = { yearStarting: {}, yearBankStarting: {}, yearSavingStarting: {}, yearMonthlySaving: {}, negativeLimit: 0 };
  try {
    const s = localStorage.getItem("finflow_settings");
    if (!s) return defaults;
    const obj = JSON.parse(s) || {};
    // Migratie-logica behouden
    for (const [y, v] of Object.entries(obj.yearStarting || {})) {
      if (Number(v) > 1 && !(obj.yearSavingStarting || {})[y]) {
        obj.yearSavingStarting = { ...obj.yearSavingStarting, [y]: Number(v) };
        obj.yearStarting[y] = 0;
      }
    }
    return { ...defaults, ...obj };
  } catch { return defaults; }
}

export function saveSettings(obj, reasonOverride = "") {
  const { noOp, nextStr } = isNoOpWrite("finflow_settings", obj);
  if (noOp) return false;
  // See saveCats(): recordSnapshot() filters out non-user steps.
  ensureHistoryBatch();  recordSnapshot(reasonOverride || "");
  localStorage.setItem("finflow_settings", nextStr);
  return true;
}
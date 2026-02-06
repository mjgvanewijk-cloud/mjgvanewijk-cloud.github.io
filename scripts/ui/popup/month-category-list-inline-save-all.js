// scripts/ui/popup/month-category-list-inline-save-all.js

import { t } from "../../i18n.js";
import { loadCats } from "../../core/storage/index.js";
import { ensureSystemOther, getYearAmount } from "./month-category-logic.js";
import { getPersistedScope, getMonthCatDisplayState } from "./month-category-store-monthdata.js";
import { getAllInlineDrafts, clearAllInlineDrafts, emitInlineError } from "./month-category-store.js";
import { parseMoneyInput } from "./month-category-list-inline-logic.js";
import { handleInlineSave } from "./month-category-list-inline-save-handler.js";

export async function handleInlineSaveAll({ 
  year, monthNum, type, onDataChanged, refreshSelf, setInlineError 
}) {
  const drafts = getAllInlineDrafts(year, monthNum, type);
  const entries = Object.entries(drafts || {});
  if (entries.length === 0) return true;

  const currentCatsRaw = Array.isArray(loadCats()) ? loadCats() : [];
  const currentCats = ensureSystemOther(currentCatsRaw);
  const findCatByName = (name) => currentCats.find((c) => String(c?.name || "") === String(name || ""));

  const hasYearKey = (catObj) => {
    if (!catObj || typeof catObj !== "object") return false;
    if (catObj.yearsByType && catObj.yearsByType[type] && Object.prototype.hasOwnProperty.call(catObj.yearsByType[type], String(year))) return true;
    if (catObj.years && Object.prototype.hasOwnProperty.call(catObj.years, String(year))) return true;
    return false;
  };

  for (const [catName, draft] of entries) {
    const scope = (draft && typeof draft.scope === "string" ? draft.scope : "only");
    const raw = String(draft && draft.valueRaw != null ? draft.valueRaw : "").trim();
    const num = parseMoneyInput(raw);

    if (num == null) {
      emitInlineError(year, monthNum, type, catName, t("messages.invalid_amount_error"));
      setInlineError?.(t("messages.invalid_amount_error"));
      return false;
    }

    const catObj = findCatByName(catName);
    const monthState = getMonthCatDisplayState(year, monthNum, type);
    const overrides = monthState && monthState.overrides && typeof monthState.overrides === "object" ? monthState.overrides : {};

    const currentAbs = Object.prototype.hasOwnProperty.call(overrides, catName)
      ? Math.abs(Number(overrides[catName] || 0))
      : Math.abs(Number(getYearAmount(catObj, year, type) || 0));

    const persistedScope = getPersistedScope(year, monthNum, type, catName);
    let currentScope = persistedScope;
    if (!currentScope) {
      if (Object.prototype.hasOwnProperty.call(overrides, catName)) currentScope = "only";
      else if (hasYearKey(catObj)) currentScope = "year";
      else currentScope = "only";
    }

    if (Math.abs(num - currentAbs) < 0.000001 && String(scope) === String(currentScope)) continue;

    const setCatInlineError = (msg) => {
      const m = String(msg || "").trim();
      emitInlineError(year, monthNum, type, catName, m || "");
    };

    const ok = await handleInlineSave({
      catName, val: num, scope, setInlineError: setCatInlineError, 
      year, monthNum, type, onDataChanged, refreshSelf, opts: { suppressRefresh: true }
    });
    if (ok === false) return false;
  }

  clearAllInlineDrafts(year, monthNum, type);
  if (typeof onDataChanged === "function") onDataChanged();
  if (typeof refreshSelf === "function") refreshSelf();
  return true;
}
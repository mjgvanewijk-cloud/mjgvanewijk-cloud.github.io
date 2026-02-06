// scripts/ui/popup/month-category-list-inline-save.js

import { clearAllInlineDrafts } from "./month-category-store.js";
import { handleInlineSave as singleSaveHandler } from "./month-category-list-inline-save-handler.js";
import { handleInlineSaveAll as batchSaveHandler } from "./month-category-list-inline-save-all.js";

export function createInlineSaveEngine({ year, month, type, onDataChanged, refreshSelf }) {
  const monthNum = Number(month) || 1;

  const handleInlineSave = (catName, val, scope, setInlineError, opts = null) => {
    return singleSaveHandler({
      catName, val, scope, setInlineError, year, monthNum, type, onDataChanged, refreshSelf, opts
    });
  };

  const handleInlineSaveAll = (setInlineError) => {
    return batchSaveHandler({
      year, monthNum, type, onDataChanged, refreshSelf, 
      setInlineError: typeof setInlineError === "function" ? setInlineError : (() => {})
    });
  };

  const controller = {
    saveAll: async (setInlineError) => handleInlineSaveAll(setInlineError),
    cancelAll: () => {
      clearAllInlineDrafts(year, monthNum, type);
      if (typeof refreshSelf === "function") refreshSelf();
      return true;
    },
  };

  return { handleInlineSave, handleInlineSaveAll, controller };
}
// scripts/ui/popup/month-category-list-dom-inline-handlers.js

import { formatCurrency } from "../../i18n.js";
import { parseMoneyInput } from "./money-input.js";
import { setInlineScopeHint, setInlineDraft, clearInlineDraft } from "./month-category-store.js";
import { getSelectedScope, prepareForEdit } from "./month-category-list-dom-inline-logic.js";

export function setupInlineListeners({
  editor, amountInput, radioName, keyName, year, month, type, busKey, 
  originalValue, preEditValue, setInlineError, softCloseEditor, onInlineEditorStateChanged, sharedCtx
}) {
  let localOriginalValue = originalValue;
  let localPreEditValue = preEditValue;

  const setDraftFromCurrent = () => {
    const scope = getSelectedScope(editor, radioName);
    setInlineDraft(year, month, type, keyName, {
      valueRaw: String(amountInput.value || ""),
      scope: scope,
    });
    setInlineScopeHint(year, month, type, keyName, scope);
  };

  const openEditor = () => {
    editor.setAttribute("data-open", "1");
    try {
      document.dispatchEvent(new CustomEvent("ff-month-cat-inline-open", {
        detail: { key: busKey, rowId: keyName },
      }));
    } catch (_) {}
    if (typeof onInlineEditorStateChanged === "function") {
      onInlineEditorStateChanged({ open: true, ctx: sharedCtx || {} });
    }
  };

  amountInput.addEventListener("focus", (e) => {
    e.stopPropagation();
    openEditor();
    localPreEditValue = prepareForEdit(amountInput, localPreEditValue);
  });

  amountInput.addEventListener("click", (e) => {
    e.stopPropagation();
    openEditor();
    setTimeout(() => { if (document.activeElement === amountInput) localPreEditValue = prepareForEdit(amountInput, localPreEditValue); }, 0);
  });

  amountInput.addEventListener("input", () => {
    setInlineError("");
    setDraftFromCurrent();
  });

  amountInput.addEventListener("blur", () => {
    const raw = String(amountInput.value || "").trim();

    // Leeg wordt behandeld als echte 0 (consistent met overige bedragvelden)
    if (!raw) {
      amountInput.value = formatCurrency(0);
      localPreEditValue = amountInput.value;
      localOriginalValue = amountInput.value;
      setInlineError("");
      setDraftFromCurrent();
      return;
    }

    const n = parseMoneyInput(raw);
    if (n == null) {
      amountInput.value = localPreEditValue || localOriginalValue;
      return;
    }

    amountInput.value = formatCurrency(n);
    localPreEditValue = amountInput.value;
    localOriginalValue = amountInput.value;
    setDraftFromCurrent();
  });

  editor.querySelectorAll(`input[type="radio"][name="${radioName}"]`).forEach((r) => {
    r.addEventListener("change", () => { setInlineError(""); setDraftFromCurrent(); });
  });

  const cancelLocal = () => {
    amountInput.value = localOriginalValue;
    clearInlineDraft(year, month, type, keyName);
    setInlineError("");
    softCloseEditor();
  };

  return { cancelLocal };
}
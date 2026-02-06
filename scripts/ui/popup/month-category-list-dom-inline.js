// scripts/ui/popup/month-category-list-dom-inline.js

import { getInlineScopeHint, getInlineDraft } from "./month-category-store.js";
import { setSelectedScope } from "./month-category-list-dom-inline-logic.js";
import { setupInlineListeners } from "./month-category-list-dom-inline-handlers.js";

export function wireMonthCategoryInlineEditor({
  editor, amountInput, radioName, catName, displayName, year = "x", month = "x", type = "x", 
  initialScope = null, onInlineEditorStateChanged = null, sharedCtx = null, row = null,
}) {
  if (!editor || !amountInput) return;

  const keyName = String(catName || displayName || "");
  const busKey = `\${String(year)}|\${String(month)}|\${String(type)}`;
  let originalValue = amountInput.value;
  let preEditValue = originalValue;

  const errBox = editor.querySelector(".ff-month-cat-inline-error");
  const errText = editor.querySelector(".ff-month-cat-inline-error-text");

  const setInlineError = (msg) => {
    const m = String(msg || "").trim();
    if (errText) errText.textContent = m;
    if (errBox) errBox.style.display = m ? "flex" : "none";
    if (m) amountInput.setAttribute("aria-invalid", "true");
    else amountInput.removeAttribute("aria-invalid");
  };

  const existingDraft = getInlineDraft(year, month, type, keyName);
  if (existingDraft && typeof existingDraft.scope === "string") setSelectedScope(editor, radioName, existingDraft.scope);
  else {
    const hinted = getInlineScopeHint(year, month, type, keyName);
    if (hinted) setSelectedScope(editor, radioName, hinted);
    else if (initialScope) setSelectedScope(editor, radioName, initialScope);
    else setSelectedScope(editor, radioName, "only");
  }

  if (existingDraft && typeof existingDraft.valueRaw === "string") {
    amountInput.value = existingDraft.valueRaw;
    originalValue = existingDraft.valueRaw;
  }

  const softCloseEditor = () => {
    editor.setAttribute("data-open", "0");
    if (typeof onInlineEditorStateChanged === "function") onInlineEditorStateChanged({ open: false });
  };

  const { cancelLocal } = setupInlineListeners({
    editor, amountInput, radioName, keyName, year, month, type, busKey, 
    originalValue, preEditValue, setInlineError, softCloseEditor, onInlineEditorStateChanged, sharedCtx
  });

  const onInlineErrorEvt = (ev) => {
    const d = ev && ev.detail;
    if (d && String(d.name || "") === keyName) setInlineError(String(d.message || ""));
  };
  document.addEventListener("ff-month-cat-inline-error", onInlineErrorEvt);

  const onGlobalOpen = (ev) => {
    const d = ev && ev.detail;
    if (d && String(d.key || "") === busKey && String(d.rowId || "") !== keyName) {
      editor.setAttribute("data-open", "0");
      setInlineError("");
      amountInput.removeAttribute("aria-invalid");
    }
  };
  document.addEventListener("ff-month-cat-inline-open", onGlobalOpen);

  if (row) {
    row.__ff_softClose = softCloseEditor;
    row.__ff_cancelLocal = cancelLocal;
    row.__ff_cleanup = () => {
      document.removeEventListener("ff-month-cat-inline-error", onInlineErrorEvt);
      document.removeEventListener("ff-month-cat-inline-open", onGlobalOpen);
    };
  }
}
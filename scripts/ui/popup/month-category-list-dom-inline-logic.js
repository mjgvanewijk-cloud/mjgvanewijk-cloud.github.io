// scripts/ui/popup/month-category-list-dom-inline-logic.js

export function getSelectedScope(editor, radioName) {
  const r = editor.querySelector(`input[type="radio"][name="${radioName}"]:checked`);
  return r ? r.value : "only";
}

export function setSelectedScope(editor, radioName, scope) {
  const s = scope === "from" || scope === "year" || scope === "only" ? scope : "only";
  const r = editor.querySelector(`input[type="radio"][name="${radioName}"][value="${s}"]`);
  if (r) r.checked = true;
}

export function prepareForEdit(amountInput, preEditValue) {
  const currentVal = String(amountInput.value || preEditValue || "");
  try {
    const len = currentVal.length;
    amountInput.setSelectionRange(len, len);
  } catch (_) {}
  return currentVal;
}
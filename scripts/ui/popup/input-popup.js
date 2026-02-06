// scripts/ui/popup/input-popup.js

import { t } from "../../i18n.js";
import { createPopupOverlay, createPopupContainer, installKeyboardPadding } from "./overlay.js";
import { installIOSOneTapCaretFix } from "./ios-one-tap-caret.js";

// Nieuwe modules importeren
import { getInputPopupHTML } from "./input-popup-html.js";
import { setupErrorHelpers, setupToggleLogic, setupScopeLogic } from "./input-popup-controls.js";

export function openInputPopup({
  title, message, label, defaultValue, type = "number",
  showToggle = false, toggleLabels = { pos: "+", neg: "-" }, defaultNegative = false,
  showScope = false, scopeLabels = {},
  confirmLabel, cancelLabel,
  onConfirm, onCancel,
}) {
  const overlay = createPopupOverlay();
  overlay.style.zIndex = "20050";

  // Container styling gelijk aan categories
  const container = createPopupContainer("category-edit-sheet ff-input-sheet");

  const safeValue =
    defaultValue !== undefined && defaultValue !== null && defaultValue !== ""
      ? defaultValue
      : type === "number" ? 0 : "";

  // 1. HTML Genereren
  container.innerHTML = getInputPopupHTML({
    displayTitle: title ?? "",
    displayMessage: message ?? "",
    displayLabel: label ?? "",
    type,
    safeValue,
    showToggle, toggleLabels,
    showScope, scopeLabels,
    okText: confirmLabel || t("common.next"),
    cancelText: cancelLabel || t("common.cancel")
  });

  // Setup DOM
  const prevBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  document.body.appendChild(overlay);
  overlay.appendChild(container);

  const cleanupKeyboardPadding = installKeyboardPadding(overlay);
  const input = container.querySelector("#popupGenericInput");

  // 2. Initialiseer Controls via sub-modules
  const { setInlineError, clearInlineError } = setupErrorHelpers(container, input);
  
  const toggleCtrl = setupToggleLogic(container, defaultNegative, clearInlineError);
  
  const scopeCtrl = setupScopeLogic(container);

  // 3. Lifecycle functies
  const close = () => {
    document.body.style.overflow = prevBodyOverflow || "";
    cleanupKeyboardPadding?.();
    if (overlay.__ff_cleanup_observer) overlay.__ff_cleanup_observer();
    overlay.remove();
  };

  const cancel = () => {
    close();
    if (typeof onCancel === "function") onCancel();
  };

  // 4. Event Listeners
  overlay.__ff_onCancel = cancel;
  overlay.onclick = (e) => { if (e.target === overlay) cancel(); };

  container.querySelector("#popupCancelBtn").onclick = (e) => {
    e.preventDefault(); e.stopPropagation();
    cancel();
  };

  container.querySelector("#popupConfirmBtn").onclick = (e) => {
    e.preventDefault(); e.stopPropagation();
    clearInlineError();

    const val = input && input.value !== "" ? input.value : type === "number" ? 0 : "";
    const isNeg = toggleCtrl.getIsNeg();
    const scope = scopeCtrl.getSelectedScope();
    
    const helpers = { setInlineError, clearInlineError, input, event: e, scope };

    if (typeof onConfirm === "function") {
      const result = onConfirm(val, isNeg, scope, helpers);
      if (result === false) return; // Niet sluiten bij validatiefout
    }

    close();
  };

  requestAnimationFrame(() => container.classList.add("show"));
  installIOSOneTapCaretFix(container);
}
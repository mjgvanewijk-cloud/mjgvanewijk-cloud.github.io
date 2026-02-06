// scripts/ui/popup/wizard-inline-sheet.js

import { t, formatCurrency } from "../../i18n.js";
import { installIOSOneTapCaretFix } from "./ios-one-tap-caret.js";
import { parseMoneyInput } from "./money-input.js";

import { installKeyboardDrag } from "./wizard-inline-keyboard-drag.js";
import { normalizeForWizardCallback } from "./wizard-inline-normalize.js";
import { buildWizardInlineSheetDOM } from "./wizard-inline-sheet-html.js";
import { initWizardInlineInput } from "./wizard-inline-input.js";
import { initWizardInlineToggle } from "./wizard-inline-toggle.js";

/**
 * Open een uniforme wizard-sheet met inline edit veld.
 *
 * Doel: Beginsaldo Bank / Beginsaldo Sparen / Roodstaan limiet
 * - Zelfde sheet-shell als inkomsten/uitgaven (month-category sheet).
 * - Pen-icoon wit.
 * - Bedrag direct in de rij te editen.
 * - Validatie blijft buiten deze module (caller kan setInlineError gebruiken).
 */
export function openWizardInlineSheet({
  title,
  rowLabel,
  inputValue = "",
  inputPlaceholder = "",
  showToggle = false,
  toggleLabels = { pos: t("common.positive"), neg: t("common.negative") },
  defaultNegative = false,
  confirmLabel = t("common.save"),
  cancelLabel = t("common.cancel"),
  onConfirm,
  onCancel,
}) {
  // Toon valuta in het veld (display state). Tijdens edit (focus) wordt het veld geleegd.
  const baseAmount = Number(inputValue);
  const displayInputValue = formatCurrency(Number.isFinite(baseAmount) ? baseAmount : 0);

  const {
    overlay,
    container,
    prevBodyOverflow,
    input,
    errorBox,
    errorText,
    btnPos,
    btnNeg,
  } = buildWizardInlineSheetDOM({
    title,
    rowLabel,
    displayInputValue,
    showToggle,
    togglePosLabel: toggleLabels?.pos ?? t("common.positive"),
    toggleNegLabel: toggleLabels?.neg ?? t("common.negative"),
    confirmLabel,
    cancelLabel,
  });

  // iPhone landscape: geen keyboard-padding of interne scroll.
  // De gebruiker moet de hele sheet kunnen slepen om het invoerveld zichtbaar te maken.
  const dragHandle = container.querySelector(".ff-month-category-header") || container;
  const cleanupKeyboardDrag = installKeyboardDrag(overlay, container, dragHandle);

  const { setInlineError, clearInlineError } = initWizardInlineInput({
    input,
    errorBox,
    errorText,
    displayFallbackValue: displayInputValue,
    formatCurrency,
    parseMoneyInput,
  });

  const toggle = initWizardInlineToggle({
    showToggle,
    defaultNegative,
    btnPos,
    btnNeg,
    clearInlineError,
  });

  const close = () => {
    document.body.style.overflow = prevBodyOverflow || "";
    cleanupKeyboardDrag?.();
    if (overlay.__ff_cleanup_observer) overlay.__ff_cleanup_observer();
    overlay.remove();
  };

  const cancel = () => {
    close();
    if (typeof onCancel === "function") onCancel();
  };

  overlay.__ff_onCancel = cancel;
  overlay.onclick = (e) => {
    if (e.target === overlay) cancel();
  };

  container.querySelector("#ffWizardCancelBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    cancel();
  });

  const confirm = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    clearInlineError();

    const raw = normalizeForWizardCallback(input?.value ?? "", parseMoneyInput);
    const helpers = { input, event: e, setInlineError, clearInlineError, isNegative: toggle.isNegative() };

    if (typeof onConfirm === "function") {
      const res = onConfirm(raw, toggle.isNegative(), helpers);
      if (res === false) return; // blijf open
    }

    close();
  };

  container.querySelector("#ffWizardConfirmBtn")?.addEventListener("click", confirm);

  // Row click focuses input (inline edit in de cel)
  const row = container.querySelector(".ff-wizard-inline-row");
  const focusInput = () => {
    try {
      input?.focus?.({ preventScroll: true });
      input?.select?.();
    } catch (_) {}
  };
  if (row) {
    row.addEventListener("click", (e) => {
      // click op input zelf mag gewoon
      if (e.target === input) return;
      e.preventDefault();
      e.stopPropagation();
      focusInput();
    });
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        confirm(e);
      }
    });
  }

  // Enter in input = confirm
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") confirm(e);
  });

  requestAnimationFrame(() => container.classList.add("show"));
  installIOSOneTapCaretFix(container);
}

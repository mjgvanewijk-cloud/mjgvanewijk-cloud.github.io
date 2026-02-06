// scripts/ui/popup/saving-month/row-events-saving.js
import { formatCurrency } from "../../../i18n.js";
import { parseMoneyInput } from "../money-input.js";
import {
  amountClassBySign,
  clearInlineError,
  flowLabelBySign,
  getAbsFromInputValue,
  setInlineError,
} from "./row-helpers.js";

export function wireSavingRowInteractions({
  item,
  editor,
  amountInput,
  flowLabelEl,
  scopeRadios,
  btnPos,
  btnNeg,
  uiScope,
  isNegInitial,
  absFlow,
  flowSigned,
  draftApi,
  busKey,
  rowId,
}) {
  const { getDraft, setDraft, deleteDraft } = draftApi;

  const setEditorOpen = (open) => {
    editor.setAttribute("data-open", open ? "1" : "0");
  };

  const applyScopeToUI = (scope) => {
    const val = String(scope || "only");
    scopeRadios.forEach((r) => {
      r.checked = r.value === val;
    });
  };

  const applySignToUI = (neg) => {
    if (flowLabelEl) flowLabelEl.textContent = flowLabelBySign(neg);

    if (amountInput) {
      amountInput.classList.remove("ff-amount-positive", "ff-amount-negative");
      const abs = getAbsFromInputValue(amountInput.value, absFlow);
      const cls = amountClassBySign(neg, abs);
      if (cls) amountInput.classList.add(cls);
    }

    if (btnPos) btnPos.classList.toggle("is-active", !neg);
    if (btnNeg) btnNeg.classList.toggle("is-active", !!neg);
  };

  // init
  applyScopeToUI(uiScope);
  applySignToUI(isNegInitial);

  const onGlobalOpen = (e) => {
    const d = e?.detail || {};
    if (d && d.key === busKey && String(d.rowId || "") !== rowId) {
      setEditorOpen(false);
      clearInlineError(editor);
      if (amountInput) amountInput.removeAttribute("aria-invalid");
    }
  };
  document.addEventListener("ff-saving-inline-open", onGlobalOpen);

  const onInlineErr = (e) => {
    const det = e?.detail || {};
    if (!det || det.key !== busKey) return;
    if (String(det.name || "") !== rowId) return;

    setEditorOpen(true);
    setInlineError(editor, det.message);

    if (amountInput) {
      if (det.message) amountInput.setAttribute("aria-invalid", "true");
      else amountInput.removeAttribute("aria-invalid");
    }

    try {
      item.scrollIntoView({ block: "nearest" });
    } catch (_) {}
  };
  document.addEventListener("ff-month-cat-inline-error", onInlineErr);

  const openEditor = () => {
    setEditorOpen(true);
    clearInlineError(editor);
    if (amountInput) amountInput.removeAttribute("aria-invalid");
    try {
      document.dispatchEvent(new CustomEvent("ff-saving-inline-open", { detail: { key: busKey, rowId } }));
    } catch (_) {}
  };

  if (amountInput) {
    amountInput.addEventListener("click", (e) => { e.stopPropagation(); openEditor(); });
    amountInput.addEventListener("focus", (e) => { e.stopPropagation(); openEditor(); });
    amountInput.addEventListener("input", () => {
      const cur = getDraft();
      const baseIsNeg = (cur && typeof cur.isNeg === "boolean") ? !!cur.isNeg : !!isNegInitial;
      const baseScope = (cur && typeof cur.scope === "string") ? cur.scope : uiScope;
      const raw = String(amountInput.value || "");
      const draftRaw = raw.trim() ? raw : "0";
      setDraft({ isNeg: baseIsNeg, scope: baseScope, valueRaw: draftRaw });
      clearInlineError(editor);
      if (amountInput) amountInput.removeAttribute("aria-invalid");
      applySignToUI(!!getDraft()?.isNeg);
    });
    amountInput.addEventListener("blur", () => {
      const raw = String(amountInput.value || "").trim();
      const existing = getDraft();
      const hasDraft = !!existing;
    
      // Belangrijk: als de gebruiker niets heeft aangepast, maken we geen draft aan.
      // Alleen formatten/terugzetten in de UI.
      const baseIsNeg = (existing && typeof existing.isNeg === "boolean") ? !!existing.isNeg : !!isNegInitial;
      const baseScope = (existing && typeof existing.scope === "string") ? existing.scope : uiScope;
    
      if (!raw) {
        if (hasDraft) {
          // Leeg = echte 0 (alleen vastleggen als er al een draft bestaat door user-interactie)
          setDraft({ isNeg: baseIsNeg, scope: baseScope, valueRaw: "0" });
        }
        // UI terugzetten
        amountInput.value = formatCurrency(0);
        applySignToUI(!!baseIsNeg);
        applyScopeToUI(baseScope);
        if (amountInput) amountInput.removeAttribute("aria-invalid");
        clearInlineError(editor);
        return;
      }
    
      const num = parseMoneyInput(raw);
      if (num == null) return;
    
      // UI normaliseren
      amountInput.value = formatCurrency(Math.abs(num));
    
      if (hasDraft) {
        setDraft({ isNeg: baseIsNeg, scope: baseScope, valueRaw: String(amountInput.value || "") });
        applySignToUI(!!getDraft()?.isNeg);
      } else {
        // Geen draft: niets committen, alleen UI
        applySignToUI(!!baseIsNeg);
        applyScopeToUI(baseScope);
      }
    });
  }

  scopeRadios.forEach((r) => {
    r.addEventListener("change", () => {
      const cur = getDraft();
      const baseIsNeg = (cur && typeof cur.isNeg === "boolean") ? !!cur.isNeg : !!isNegInitial;
      const baseRaw = (cur && typeof cur.valueRaw === "string") ? cur.valueRaw : String(amountInput ? (amountInput.value || "") : "");
      setDraft({ isNeg: baseIsNeg, valueRaw: baseRaw, scope: r.value });
      clearInlineError(editor);
      if (amountInput) amountInput.removeAttribute("aria-invalid");
    });
  });

  const setNeg = (neg) => {
    const cur = getDraft();
    const baseScope = (cur && typeof cur.scope === "string") ? cur.scope : uiScope;
    const baseRaw = (cur && typeof cur.valueRaw === "string") ? cur.valueRaw : String(amountInput ? (amountInput.value || "") : "");
    setDraft({ isNeg: !!neg, scope: baseScope, valueRaw: baseRaw });
    clearInlineError(editor);
    if (amountInput) amountInput.removeAttribute("aria-invalid");
    applySignToUI(!!neg);
  };

  if (btnPos) btnPos.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); setNeg(false); });
  if (btnNeg) btnNeg.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); setNeg(true); });

  return () => {
    document.removeEventListener("ff-saving-inline-open", onGlobalOpen);
    document.removeEventListener("ff-month-cat-inline-error", onInlineErr);
  };
}
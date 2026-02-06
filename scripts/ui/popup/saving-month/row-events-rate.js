// scripts/ui/popup/saving-month/row-events-rate.js
import { formatCurrency, t } from "../../../i18n.js";
import { clearInlineError, setInlineError } from "./row-helpers.js";
import { buildInterestLabel } from "../saving-month-popup-helpers.js";
import { openPremiumTrialPopup } from "../../../core/state/premium.js";
import { normalizeRateForUI } from "./row-events-logic.js";


function openPremiumRateSheet() {
  // Eén centrale premium-gate: trial beschikbaar → trial sheet, trial verlopen → oranje paywall (Doorgaan/Sluiten).
  // Geen helpcloud.
  openPremiumTrialPopup(null, {
    title: t("messages.premium_rate_month_title"),
    topText: t("messages.premium_rate_month_note"),
  });
}

export function wireSavingRateInteractions({
  year, month, item, editor, rateInput, scopeRadios, uiScope, rateInitial, draftApi, busKey, rowId, openClickEl, interestLabelEl, interestValueEl, balanceAfterFlow, showRealInterest,
}) {
  const { getDraft, setDraft, deleteDraft } = draftApi;

  const setPremiumLockedUI = (locked) => {
    const lock = !!locked;
    try {
      if (rateInput) rateInput.disabled = lock;
      scopeRadios?.forEach((r) => { try { r.disabled = lock; } catch (_) {} });
    } catch (_) {}
  };

  const setEditorOpen = (open) => { editor.setAttribute("data-open", open ? "1" : "0"); };
  const applyScopeToUI = (scope) => { const val = String(scope || "only"); scopeRadios.forEach((r) => { r.checked = r.value === val; }); };

  const getScopeFromUI = () => {
    let v = null;
    scopeRadios.forEach((r) => { if (r && r.checked) v = r.value; });
    v = String(v || "");
    return v === "only" || v === "from" || v === "year" ? v : String(uiScope || "only");
  };

  applyScopeToUI(uiScope);
  if (!showRealInterest) { setPremiumLockedUI(true); }

  const applyRatePreviewToRow = (rate) => {
    if (!showRealInterest) return;
    if (interestLabelEl) interestLabelEl.textContent = buildInterestLabel(rate);
    const b = Number(balanceAfterFlow);
    const r = Number(rate);
    const interest = (Number.isFinite(b) && Number.isFinite(r)) ? (b * (r / 100) / 12) : 0;
    const rounded = Math.round(interest * 100) / 100;
    if (interestValueEl) interestValueEl.textContent = formatCurrency(rounded);
  };

  applyRatePreviewToRow(rateInitial);

  const onGlobalOpen = (e) => {
    const d = e?.detail || {};
    if (d && d.key === busKey && String(d.rowId || "") !== rowId) {
      setEditorOpen(false); clearInlineError(editor);
      if (rateInput) rateInput.removeAttribute("aria-invalid");
    }
  };
  document.addEventListener("ff-saving-inline-open", onGlobalOpen);

  const onInlineErr = (e) => {
    const det = e?.detail || {};
    if (!det || det.key !== busKey || String(det.name || "") !== rowId) return;
    setEditorOpen(true); setInlineError(editor, det.message);
    if (rateInput) { if (det.message) rateInput.setAttribute("aria-invalid", "true"); else rateInput.removeAttribute("aria-invalid"); }
    try { item.scrollIntoView({ block: "nearest" }); } catch (_) {}
  };
  document.addEventListener("ff-month-cat-inline-error", onInlineErr);

  const openEditor = () => {
    if (!showRealInterest) {
      openPremiumRateSheet({ year, month });
      return;
    }

    setEditorOpen(true);
    clearInlineError(editor);
    if (rateInput) rateInput.removeAttribute("aria-invalid");

    const existing = getDraft();
    if (!existing) applyRatePreviewToRow(rateInitial);

    try { document.dispatchEvent(new CustomEvent("ff-saving-inline-open", { detail: { key: busKey, rowId } })); } catch (_) {}
  };

  if (openClickEl) {
    openClickEl.addEventListener("click", (e) => { e.stopPropagation(); openEditor(); if (rateInput && showRealInterest) rateInput.focus({ preventScroll: true }); });
    openClickEl.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); openEditor(); if (rateInput && showRealInterest) rateInput.focus({ preventScroll: true }); } });
  }

  if (rateInput) {
    rateInput.addEventListener("click", (e) => { e.stopPropagation(); openEditor(); });
    rateInput.addEventListener("focus", (e) => { e.stopPropagation(); openEditor(); });
    rateInput.addEventListener("input", () => {
      const cur = getDraft();
      const baseScope = (cur && typeof cur.scope === "string") ? cur.scope : getScopeFromUI();
      setDraft({ scope: baseScope, valueRaw: String(rateInput.value || "") }); clearInlineError(editor); rateInput.removeAttribute("aria-invalid");
      const n = normalizeRateForUI(rateInput.value); if (n != null) applyRatePreviewToRow(n);
    });
    rateInput.addEventListener("blur", () => {
      const raw = String(rateInput.value || "").trim();
      const existing = getDraft();
      const hasDraft = !!existing;
    
      // Als de gebruiker niets heeft aangepast, maken we geen draft aan.
      // We normaliseren alleen de UI.
      if (!raw) {
        if (hasDraft) deleteDraft();
        rateInput.value = String(rateInitial).replace(".", ",");
        applyScopeToUI(uiScope);
        applyRatePreviewToRow(rateInitial);
        rateInput.removeAttribute("aria-invalid");
        clearInlineError(editor);
        return;
      }
    
      const num = normalizeRateForUI(raw);
      if (num == null) return;
    
      rateInput.value = String(num).replace(".", ",");
    
      if (hasDraft) {
        const baseScope = (existing && typeof existing.scope === "string") ? existing.scope : getScopeFromUI();
        setDraft({ scope: baseScope, valueRaw: String(rateInput.value || "") });
      }
      applyRatePreviewToRow(num);
    });
  }

  scopeRadios.forEach((r) => {
    r.addEventListener("change", () => {
      const cur = getDraft(); const hasRaw = cur && typeof cur.valueRaw === "string";
      const fallbackRaw = rateInput ? String(rateInput.value || "") : String(rateInitial).replace(".", ",");
      setDraft({ scope: r.value, ...(hasRaw ? {} : { valueRaw: fallbackRaw }) }); clearInlineError(editor);
      if (rateInput) rateInput.removeAttribute("aria-invalid");
      const curRaw = rateInput ? String(rateInput.value || "") : String(getDraft()?.valueRaw || "");
      const n = normalizeRateForUI(curRaw); applyRatePreviewToRow(n != null ? n : rateInitial);
    });
  });

  return () => {
    document.removeEventListener("ff-saving-inline-open", onGlobalOpen);
    document.removeEventListener("ff-month-cat-inline-error", onInlineErr);
  };
}

// scripts/core/state/categories-ui-years.js
import { t, formatCurrency } from "../../i18n.js";
import { monthName } from "./categories-ui-helpers.js";
import { buildPreviewAndFindLimitViolation } from "./categories-ui/save-handler-preview-limit.js";
import { loadCats } from "../storage/index.js";
import { buildUpdatedCategory } from "./categories-ui/save-handler-build.js";

// Import uit de 5 sub-modules
import { getYearValueFromBlock, updateRemoveButtonsState, parseDecimalOrZero } from "./categories-ui-years-utils.js";
import { clearCategoryYearInlineErrors, showCategoryYearInlineError } from "./categories-ui-years-errors.js";
import { collectYearsData, hasMonthOverridesForYear } from "./categories-ui-years-logic.js";
import { openCategoryYearDeletedKeepManualInfoSheet } from "./categories-ui-years-popups.js";
import { renderYearRow, addNewYearRow } from "./categories-ui-years-render.js";

// Re-exports voor compatibiliteit met andere scripts
export { clearCategoryYearInlineErrors, showCategoryYearInlineError, renderYearRow, addNewYearRow, collectYearsData, parseDecimalOrZero };

/**
 * Delete-jaar moet EXACT hetzelfde werken als bij Sparen:
 * - bij klik: eerst volledige precommit/preview-validatie
 * - bij fout: direct inline error en NIETS wijzigen
 * - bij OK: pas dan UI/draft aanpassen (jaarregel verwijderen)
 * 
 * Belangrijk: geen auto-commit/persist op klik; Opslaan blijft het commit-moment.
 */
export function bindYearDeleteLogic({ container, ctx, getSelectedType, pendingWipeYears, pendingNoDefaultYears }) {
  if (!container) return;
  const wipeSet = pendingWipeYears instanceof Set ? pendingWipeYears : new Set();
  const noDefaultSet = pendingNoDefaultYears instanceof Set ? pendingNoDefaultYears : new Set();

  container.addEventListener("click", (e) => {
    const btn = e.target && e.target.closest(".remove-year-btn");
    if (!btn) return;

    e.preventDefault();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
    else e.stopPropagation();

    const block = btn.closest(".cat-year-block");
    const yearRaw = getYearValueFromBlock(block);
    const yearInt = Number(yearRaw);

    // 1. Check laatste rij (zonder iets te wijzigen)
    if (container.querySelectorAll(".cat-year-block").length <= 1) {
      clearCategoryYearInlineErrors(container);
      showCategoryYearInlineError(container, yearRaw, t("errors.cannot_delete_last_year"));
      return;
    }

    // 2. BOUW de candidate update ZONDER de UI te wijzigen (zelfde builder als Opslaan)
    const tSel = (typeof getSelectedType === "function") ? String(getSelectedType() || "expense") : "expense";
    const sheetRoot = container.closest(".category-edit-sheet, .ff-popup") || document;
    const saveBtn = sheetRoot.querySelector("#saveCatBtn") || sheetRoot.querySelector(".ff-btn--primary") || null;
    const nameInput = sheetRoot.querySelector("#catName");
    const originalName = String(ctx?.cat?.name || "").trim();
    const newName = String(nameInput?.value ?? originalName ?? "").trim();

    clearCategoryYearInlineErrors(container);
    if (saveBtn) saveBtn.disabled = false;

    const yearsAfterDeletion = collectYearsData(container);
    delete yearsAfterDeletion[yearRaw];

    const updatedCat = buildUpdatedCategory({
      ctx,
      selectedType: tSel,
      newName,
      years: yearsAfterDeletion,
    });

    // 3. PREVIEW-validatie (zelfde als Opslaan) ZONDER te muteren.
    // Bij violation: direct inline error en STOP (jaar blijft staan).
    try {
      const prevCats = Array.isArray(loadCats()) ? loadCats() : [];
      const { violation } = buildPreviewAndFindLimitViolation({
        prevCats,
        updatedCat,
        ctx,
        selectedType: tSel,
        yearDeletePlan: null, // Jaar verwijderen mag NOOIT handmatige maand-overrides wissen
      });

      if (violation) {
        showCategoryYearInlineError(
          container,
          violation.year,
          t("errors.bank_limit_reached", {
            month: `${monthName(violation.month)} ${violation.year}`,
            amount: formatCurrency(violation.bank),
            limit: formatCurrency(violation.limit),
          })
        );
        if (saveBtn) saveBtn.disabled = true;
        return;
      }
    } catch (err) {
      // Preview moet betrouwbaar zijn; bij error blokkeren we de delete liever dan riskant muteren.
      try { console.error(err); } catch (_) {}
      showCategoryYearInlineError(container, yearRaw, t("errors.generic_desc"));
      if (saveBtn) saveBtn.disabled = true;
      return;
    }

    // 4. PAS BIJ SUCCES: UI/draft aanpassen
    wipeSet.delete(yearRaw);
    noDefaultSet.delete(yearRaw);
    block.remove();
    updateRemoveButtonsState(container);


    // Optionele info-sheet bij handmatige overrides
    if (hasMonthOverridesForYear({ yearInt, type: tSel, name: ctx?.cat?.name })) {
      openCategoryYearDeletedKeepManualInfoSheet({ year: yearRaw });
    }
  }, true);
}
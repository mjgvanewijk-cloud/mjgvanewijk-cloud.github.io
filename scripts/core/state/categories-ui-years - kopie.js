// scripts/core/state/categories-ui-years.js
import { t, formatCurrency } from "../../i18n.js";
import { precommitFindFirstCategoryLimitViolation } from "./categories-precommit-limit.js";
import { monthName } from "./categories-ui-helpers.js";

// Import uit de 5 sub-modules
import { getYearValueFromBlock, updateRemoveButtonsState, parseDecimalOrZero } from "./categories-ui-years-utils.js";
import { clearCategoryYearInlineErrors, showCategoryYearInlineError } from "./categories-ui-years-errors.js";
import { collectYearsData, buildCandidateCatsForLivePreview } from "./categories-ui-years-logic.js";
import { renderYearRow, addNewYearRow } from "./categories-ui-years-render.js";

// Re-exports voor compatibiliteit met andere scripts
export { clearCategoryYearInlineErrors, showCategoryYearInlineError, renderYearRow, addNewYearRow, collectYearsData, parseDecimalOrZero };

/**
 * De oplossing: Eerst virtueel checken of verwijderen mag.
 * De UI (bedragen/rijen) wordt pas aangeraakt als de bank-limiet check slaagt.
 */
export function bindYearDeleteLogic({ container, ctx, getSelectedType, pendingWipeYears, pendingNoDefaultYears }) {
  if (!container) return;
  const wipeSet = pendingWipeYears instanceof Set ? pendingWipeYears : new Set();
  const noDefaultSet = pendingNoDefaultYears instanceof Set ? pendingNoDefaultYears : new Set();

  container.addEventListener("click", (e) => {
    const btn = e.target && e.target.closest ? e.target.closest(".remove-year-btn") : null;
    if (!btn) return;

    e.preventDefault();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
    else e.stopPropagation();

    const block = btn.closest(".cat-year-block");
    if (!block) return;

    const yearRaw = String(getYearValueFromBlock(block) || "").trim();
    const yearInt = Number(yearRaw);

    // 1. Check laatste rij (zonder iets te wijzigen)
    if (container.querySelectorAll(".cat-year-block").length <= 1) {
      clearCategoryYearInlineErrors(container);
      showCategoryYearInlineError(container, yearRaw, t("errors.cannot_delete_last_year"));
      return;
    }

    // 2. VIRTUELE VALIDATIE (Concept-status bouwen in geheugen)
    const tSel = (typeof getSelectedType === "function") ? String(getSelectedType() || "expense") : "expense";
    clearCategoryYearInlineErrors(container);

    // Empty/invalid year: safe to remove row directly (after last-row guard)
    if (!Number.isFinite(yearInt)) {
      if (yearRaw) {
        wipeSet.delete(yearRaw);
        noDefaultSet.delete(yearRaw);
      }
      block.remove();
      updateRemoveButtonsState(container);
      return;
    }

    // We bouwen yearsAfterDeletion uit de LIVE UI state, excl. de rij die verwijderd wordt.
    const yearsAfterDeletion = (() => {
      const out = {};
      const blocks = Array.from(container.querySelectorAll(".cat-year-block"));
      for (const b of blocks) {
        if (b === block) continue;
        const y = String(getYearValueFromBlock(b) || "").trim();
        if (!y || !/^\d{4}$/.test(y)) continue;
        const v = parseDecimalOrZero(b.querySelector(".cat-budget-val")?.value);
        out[y] = v;
      }
      return out;
    })();

    const nextCatsSitu = buildCandidateCatsForLivePreview({
      yearsContainer: container,
      ctx,
      selectedType: tSel,
      yearsAfterDeletion,
    });
    const violation = precommitFindFirstCategoryLimitViolation({ candidateCats: nextCatsSitu });

    // 3. BESLISSING: Toon melding of voer actie uit
    if (violation) {
      // STOP: Banklimiet wordt geraakt. Toon melding. 
      // Omdat we 'block.remove()' nog niet hebben aangeroepen, blijft de UI exact zoals hij was.
      showCategoryYearInlineError(
        container,
        Number(violation.year),
        t("errors.bank_limit_reached", {
          month: `${monthName(violation.month)} ${violation.year}`,
          amount: formatCurrency(violation.bank),
          limit: formatCurrency(violation.limit),
        })
      );
      return;
    }

    // 4. PAS BIJ SUCCES: UI aanpassen (NIET automatisch opslaan)
    wipeSet.delete(yearRaw);
    noDefaultSet.delete(yearRaw);
    block.remove();
    updateRemoveButtonsState(container);
  }, true);
}
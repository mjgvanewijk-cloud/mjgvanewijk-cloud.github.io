// scripts/core/state/categories-ui-years.js
import { t, formatCurrency } from "../../i18n.js";
import { precommitFindFirstCategoryLimitViolation } from "./categories-precommit-limit.js";
import { monthName } from "./categories-ui-helpers.js";

// Import uit sub-modules
import { getYearValueFromBlock, updateRemoveButtonsState, parseDecimalOrZero } from "./categories-ui-years-utils.js";
import { clearCategoryYearInlineErrors, showCategoryYearInlineError } from "./categories-ui-years-errors.js";
import { hasMonthOverridesForYear, buildCandidateCatsForLivePreview, collectYearsData } from "./categories-ui-years-logic.js";
import { openCategoryYearDeletedKeepManualInfoSheet } from "./categories-ui-years-popups.js";
import { renderYearRow, addNewYearRow } from "./categories-ui-years-render.js";

// Re-exports voor compatibiliteit met andere scripts
export { clearCategoryYearInlineErrors, showCategoryYearInlineError, renderYearRow, addNewYearRow, collectYearsData, parseDecimalOrZero };

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

    const yearRaw = String(block.querySelector(".cat-year-val")?.value ?? "").trim();
    const yearInt = Number(yearRaw);

    const totalBlocks = container.querySelectorAll(".cat-year-block").length;
    if (totalBlocks <= 1) {
      try { clearCategoryYearInlineErrors(container); } catch (_) {}
      showCategoryYearInlineError(container, getYearValueFromBlock(block) || yearRaw || "0", t("errors.cannot_delete_last_year"));
      return;
    }

    if (!Number.isFinite(yearInt)) {
      const yStr = String(yearRaw || "");
      if (yStr) { wipeSet.delete(yStr); noDefaultSet.delete(yStr); }
      block.remove();
      updateRemoveButtonsState(container);
      return;
    }

    const yStr = String(yearInt);
    const tSel = (typeof getSelectedType === "function") ? String(getSelectedType() || "expense") : "expense";
    const catNameForCheck = (ctx && ctx.isSystemOther) ? "Overig" : String(ctx?.cat?.name || "");

    try { clearCategoryYearInlineErrors(container); } catch (_) {}

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

    const nextCats = buildCandidateCatsForLivePreview({
      yearsContainer: container,
      ctx,
      selectedType: tSel,
      yearsAfterDeletion,
    });

    const violation = precommitFindFirstCategoryLimitViolation({ candidateCats: nextCats });
    if (violation) {
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

    wipeSet.delete(yStr);
    noDefaultSet.delete(yStr);
    block.remove();
    updateRemoveButtonsState(container);

    const hasOverrides = hasMonthOverridesForYear({ yearInt, type: tSel, name: catNameForCheck });
    if (hasOverrides) openCategoryYearDeletedKeepManualInfoSheet({ year: yStr });
  }, true);
}
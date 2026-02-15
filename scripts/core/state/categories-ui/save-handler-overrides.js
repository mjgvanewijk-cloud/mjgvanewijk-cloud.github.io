// scripts/core/state/categories-ui/save-handler-overrides.js
import { loadMonthData, loadCats } from "../../storage/index.js";
import { hasMonthOverridesForYear } from "./save-handler-helpers.js";
import { openManualMonthOverridesConfirmSheet } from "./sheet-month-overrides-confirm.js";
import { buildPreviewAndFindLimitViolation } from "./save-handler-preview-limit.js";
import { showCategoryYearInlineError } from "../categories-ui-years-errors.js";
import { t, formatCurrency } from "../../../i18n.js";
import { monthName } from "../categories-ui-helpers.js";

export function handleManualOverridesCheck({ ctx, selectedType, updatedCat, originalName, commitWithOptions, options, wipeYears, wipeNames, wipeType, yearsContainer, saveBtn }) {
  try {
    const prevCats = Array.isArray(loadCats()) ? loadCats() : [];
    const prevCat = (ctx && ctx.isEdit)
      ? (prevCats.find((c) => String(c?.name || "") === String(ctx.cat?.name || "")) || null)
      : null;

    const getYearsObjForType = (cat, t) => {
      if (!cat || typeof cat !== "object") return {};
      if (String(cat?.name || "") === "Overig") {
        const ybt = cat.yearsByType && typeof cat.yearsByType === "object" ? cat.yearsByType[t] : null;
        return (ybt && typeof ybt === "object") ? ybt : {};
      }
      return (cat.years && typeof cat.years === "object") ? cat.years : {};
    };

    const prevY = getYearsObjForType(prevCat, selectedType);
    const nextY = getYearsObjForType(updatedCat, selectedType);
    const changedYears = [];

    Object.keys(nextY || {}).forEach((yStr) => {
      if (!Object.prototype.hasOwnProperty.call(prevY || {}, yStr)) return;
      const a = Number(prevY?.[yStr]), b = Number(nextY?.[yStr]);
      if (Number.isFinite(a) && Number.isFinite(b) && a !== b) changedYears.push(Number(yStr));
    });

    const mdNow = loadMonthData() || {};
    const namesForLookup = [String(updatedCat?.name || "").trim()].filter(Boolean);
    if (originalName && String(originalName) !== String(updatedCat?.name || "")) namesForLookup.push(String(originalName));

    // PRIORITY 1: Inline bank-limit violation must always be shown first.
    // If we cannot proceed, the "manual month overrides" confirm sheet is irrelevant.
    try {
      const { violation: v0 } = buildPreviewAndFindLimitViolation({ prevCats, updatedCat, ctx, selectedType });
      if (v0) {
        if (yearsContainer) {
          showCategoryYearInlineError(yearsContainer, v0.year, t("errors.bank_limit_reached", {
            month: `${monthName(v0.month)} ${v0.year}`,
            amount: formatCurrency(v0.bank),
            limit: formatCurrency(v0.limit),
          }));
        }
        if (saveBtn) saveBtn.disabled = true;
        return true;
      }
    } catch (_) {}

    const yearWithOverrides = changedYears
      .filter(Number.isFinite)
      .sort((a, b) => a - b)
      .find((yy) => hasMonthOverridesForYear({ monthData: mdNow, year: yy, type: selectedType, names: namesForLookup }));

    if (!yearWithOverrides) return false;

    // PRIORITY 2: If we already know the save would violate the bank-limit
    // (either with or without wiping overrides), show inline error and stop.
    try {
      const { violation: vNo } = buildPreviewAndFindLimitViolation({ prevCats, updatedCat, ctx, selectedType });

      const mergedYears = Array.from(new Set([...(wipeYears || []), yearWithOverrides]));
      const mergedNames = Array.from(new Set([...(wipeNames || []), ...namesForLookup]));

      const { violation: vYes } = buildPreviewAndFindLimitViolation({
        prevCats, updatedCat, ctx, selectedType,
        yearDeletePlan: { wipeYears: mergedYears, names: mergedNames, type: wipeType },
      });

      const vPick = vNo || vYes;
      if (vPick) {
        if (yearsContainer) {
          showCategoryYearInlineError(yearsContainer, vPick.year, t("errors.bank_limit_reached", {
            month: `${monthName(vPick.month)} ${vPick.year}`,
            amount: formatCurrency(vPick.bank),
            limit: formatCurrency(vPick.limit),
          }));
        }
        if (saveBtn) saveBtn.disabled = true;
        return true;
      }
    } catch (_) {}

    openManualMonthOverridesConfirmSheet({
      year: yearWithOverrides,
      onNo: ({ close }) => { close(); commitWithOptions({ nextOptions: options }); },
      onYes: ({ close }) => {
        close();

        const mergedYears = Array.from(new Set([...(wipeYears || []), yearWithOverrides]));
        const mergedNames = Array.from(new Set([...(wipeNames || []), ...namesForLookup]));

        const { violation: v2 } = buildPreviewAndFindLimitViolation({
          prevCats, updatedCat, ctx, selectedType,
          yearDeletePlan: { wipeYears: mergedYears, names: mergedNames, type: wipeType },
        });

        if (v2) {
          if (yearsContainer) {
            showCategoryYearInlineError(yearsContainer, v2.year, t("errors.bank_limit_reached", {
              month: `${monthName(v2.month)} ${v2.year}`,
              amount: formatCurrency(v2.bank),
              limit: formatCurrency(v2.limit),
            }));
          }
          if (saveBtn) saveBtn.disabled = true;
          return;
        }

        const nextOptions = (mergedYears.length && mergedNames.length)
          ? { wipeYearOverrides: { years: mergedYears, type: wipeType, names: mergedNames } }
          : null;

        commitWithOptions({ nextOptions });
      },
    });

    return true;
  } catch (_) {
    return false;
  }
}

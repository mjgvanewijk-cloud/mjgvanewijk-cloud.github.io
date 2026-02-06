// scripts/core/state/categories-ui/save-handler.js
import { t, formatCurrency } from "../../../i18n.js";
import { loadCats } from "../../storage/index.js";
import { monthName } from "../categories-ui-helpers.js";
import { collectYearsData } from "../categories-ui-render.js";
import { showCategoryYearInlineError } from "../categories-ui-years-errors.js";

import { resolveNameErrorTextNode, createNameErrorController } from "./save-handler-name.js";
import { buildUpdatedCategory } from "./save-handler-build.js";
import { buildPreviewAndFindLimitViolation } from "./save-handler-preview-limit.js";
import { commitCategoryUpdate, stableStringify } from "./commit.js";

// Module Imports
import { bindSaveHandlerEvents } from "./save-handler-events.js";
import { validateSaveBasics } from "./save-handler-validation.js";
import { handleManualOverridesCheck } from "./save-handler-overrides.js";

export function bindSaveHandler({ root, ctx, getSelectedType, onClose, getYearDeletePlan }) {
  const nameInput = root.querySelector("#catName");
  const nameErrBox = root.querySelector("#catNameError");
  const nameErrTxt = resolveNameErrorTextNode({ root, nameErrBox });
  const saveBtn = root.querySelector("#saveCatBtn");
  const yearsContainer = root.querySelector("#catYearsContainer");

  if (!saveBtn) return;

  const { hideNameError, showNameError, validateUniqueName, validateCrossTypeConflict } = createNameErrorController({ root, ctx, nameInput, nameErrBox, nameErrTxt });
  const { clearInlineLimit } = bindSaveHandlerEvents({ yearsContainer, saveBtn, nameInput, hideNameError });

  saveBtn.onclick = () => {
    if (!nameInput) return;
    clearInlineLimit();
    hideNameError();

    const newName = nameInput.value.trim();
    const selectedType = getSelectedType();

    if (!validateSaveBasics({ newName, ctx, showNameError, validateUniqueName, validateCrossTypeConflict, selectedType })) return;

    const years = collectYearsData(yearsContainer);
    const updatedCat = buildUpdatedCategory({ ctx, selectedType, newName, years });
    const prevCats = Array.isArray(loadCats()) ? loadCats() : [];

    const { violation } = buildPreviewAndFindLimitViolation({
      prevCats, updatedCat, ctx, selectedType,
      yearDeletePlan: (typeof getYearDeletePlan === "function" ? getYearDeletePlan({ updatedCat, ctx, selectedType }) : null),
    });

    if (violation) {
      if (yearsContainer) {
        showCategoryYearInlineError(yearsContainer, violation.year, t("errors.bank_limit_reached", {
          month: `${monthName(violation.month)} ${violation.year}`,
          amount: formatCurrency(violation.bank), limit: formatCurrency(violation.limit),
        }));
      }
      saveBtn.disabled = true; return;
    }

    const plan = (typeof getYearDeletePlan === "function") ? getYearDeletePlan({ updatedCat, ctx, selectedType }) : null;
    const wipeYears = plan && Array.isArray(plan.wipeYears) ? plan.wipeYears : [];
    const wipeNames = plan && Array.isArray(plan.names) ? plan.names : [];
    const wipeType = plan ? String(plan.type || selectedType || "expense") : String(selectedType || "expense");
    const options = (wipeYears.length && wipeNames.length) ? { wipeYearOverrides: { years: wipeYears, type: wipeType, names: wipeNames } } : null;
    const originalName = (ctx && ctx.isEdit) ? String(ctx.cat?.name || "").trim() : null;

    const commitWithOptions = ({ nextOptions } = {}) => {
      const nextStr = stableStringify(updatedCat);
      if (ctx && ctx.__ffLastCommittedCatStr === nextStr) {
        if (typeof onClose === "function") onClose({ accepted: true, source: "save-noop" });
        return;
      }
      if (!commitCategoryUpdate({ updatedCat, ctx, originalName, options: nextOptions, yearsContainer, saveBtn, showNameError, selectedType })) return;
      if (ctx) ctx.__ffLastCommittedCatStr = nextStr;
      if (typeof onClose === "function") onClose({ accepted: true, source: "save" });
    };

    if (!handleManualOverridesCheck({ ctx, selectedType, updatedCat, originalName, commitWithOptions, options, wipeYears, wipeNames, wipeType, yearsContainer, saveBtn })) {
      commitWithOptions({ nextOptions: options });
    }
  };
}
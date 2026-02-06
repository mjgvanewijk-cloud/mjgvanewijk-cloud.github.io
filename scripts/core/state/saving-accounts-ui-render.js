// scripts/core/state/saving-accounts-ui-render.js
import { renderSavingYearRow, addNewSavingYearRow, collectSavingYearsAndRates } from "./saving-accounts-ui-years.js";
import { getSavingAccountSheetHTML } from "./saving-accounts-ui-html.js";

export { collectSavingYearsAndRates } from "./saving-accounts-ui-years.js";

export function renderSavingAccountSheetContent(root, isEdit, acc, opts = null) {
  const options = (opts && typeof opts === "object") ? opts : {};
  const yearRowOpts = options.yearRowOpts || null;
  root.innerHTML = getSavingAccountSheetHTML(isEdit, acc);

  const container = root.querySelector("#savYearsContainer");
  if (container) {
    const yearsObj = (acc && acc.years && typeof acc.years === "object") ? acc.years : null;
    const ratesObj = (acc && acc.rates && typeof acc.rates === "object") ? acc.rates : {};

    if (yearsObj && Object.keys(yearsObj).length > 0) {
      Object.entries(yearsObj).forEach(([y, signed]) => {
        renderSavingYearRow(container, y, signed, (ratesObj[y] ?? null), yearRowOpts);
      });
    } else {
      renderSavingYearRow(container, new Date().getFullYear(), 0, null, yearRowOpts);
    }
  }

  const addBtn = root.querySelector("#addSavYearBtn");
  if (addBtn) {
    addBtn.onclick = (e) => {
      e?.preventDefault?.();
      const block = addNewSavingYearRow(container, yearRowOpts);
      if (!block) return;

      const focusEl = block.querySelector(".cat-budget-input") || block.querySelector(".cat-year-input") || block.querySelector("input");
      const scrollIntoView = () => {
        try { block.scrollIntoView({ block: "end", inline: "nearest" }); } catch (_) {}
      };
      const focus = () => {
        try { focusEl?.focus?.({ preventScroll: true }); }
        catch (_) { try { focusEl?.focus?.(); } catch (_) {} }
      };

      try { requestAnimationFrame(() => { scrollIntoView(); focus(); }); } catch (_) { scrollIntoView(); focus(); }
      try { setTimeout(() => { scrollIntoView(); focus(); }, 0); } catch (_) {}
    };
  }
}

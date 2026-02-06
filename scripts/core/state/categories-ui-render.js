// scripts/core/state/categories-ui-render.js

import { t } from "../../i18n.js";
import { renderYearRow, addNewYearRow } from "./categories-ui-years.js";
import { getCategorySheetHTML } from "./categories-ui-html.js";

// Re-export voor gemak
export { collectYearsData } from "./categories-ui-years.js";

export function renderSheetContent(root, isEdit, cat, opts = null) {
  root.innerHTML = getCategorySheetHTML(isEdit, cat, opts);

  const container = root.querySelector("#catYearsContainer");
  if (container) {
    const yearsView = (cat && cat._yearsView && typeof cat._yearsView === "object") ? cat._yearsView : cat?.years;
    if (yearsView && typeof yearsView === "object" && Object.keys(yearsView).length > 0) {
      Object.entries(yearsView).forEach(([y, b]) => renderYearRow(container, y, b));
    } else {
      const defaultYear = (opts && opts.initialYear) ? String(opts.initialYear) : String(new Date().getFullYear());
      renderYearRow(container, defaultYear, "");
    }
  }

  const addBtn = root.querySelector("#addYearBtn");
  if (addBtn) {
    addBtn.onclick = (e) => {
      e?.preventDefault?.();
      const block = addNewYearRow(container);
      if (!block) return;

      const focusEl = block.querySelector(".cat-budget-input") || block.querySelector(".cat-year-input") || block.querySelector("input");
      const scrollIntoView = () => {
        try { block.scrollIntoView({ block: "end", inline: "nearest" }); } catch (_) {}
      };
      const focus = () => {
        try { focusEl?.focus?.({ preventScroll: true }); }
        catch (_) { try { focusEl?.focus?.(); } catch (_) {} }
      };

      // Eerst scrollen, daarna focus. Dubbele timing voor iOS/overlay.
      try { requestAnimationFrame(() => { scrollIntoView(); focus(); }); } catch (_) { scrollIntoView(); focus(); }
      try { setTimeout(() => { scrollIntoView(); focus(); }, 0); } catch (_) {}
    };
  }
}
// scripts/ui/popup/month-category-popup-addflow.js

import { t } from "../../i18n.js";
import { isPremiumActiveForUI, openPremiumTrialPopup } from "../../core/state/premium.js";
import { loadCats } from "../../core/storage/index.js";

/**
 * Creates the "Add category" flow for the month-category popup.
 * Keeps the same behavior:
 * - Before first real category, solidify whole year (legacy totals -> Overig overrides)
 * - If not premium: open trial popup and then continue to add-flow
 */
export function createAddFlow({ year, month, type, getLiveTotal, rerender, onAddCategory }) {
  const runAddFlow = async (fromTrial = false) => {

    if (typeof onAddCategory === "function") {
      const res = onAddCategory({
        year,
        month,
        type,
        totalAmount: getLiveTotal(),
        refresh: rerender,
        fromTrial: !!fromTrial,
      });
      if (res && typeof res.then === "function") await res;
      rerender();
    }
  };

  const handleAddClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Premium: altijd toegestaan.
    if (isPremiumActiveForUI()) {
      try {
        await runAddFlow(false);
      } catch (err) {
        console.error(err);
      }
      return;
    }

    {
      const cats = Array.isArray(loadCats()) ? loadCats() : [];
      const countForType = cats.filter((c) => c && String(c.type || "expense") === String(type)).length;

      // Eerste categorie is gratis: direct door naar add-flow.
      if (countForType === 0) {
        try {
          await runAddFlow(false);
        } catch (err) {
          console.error(err);
        }
        return;
      }

      // Vanaf de tweede categorie: premium gating
      openPremiumTrialPopup(() => {
        // Direct door naar nieuwe categorie toevoegen
        rerender();
        Promise.resolve()
          .then(() => runAddFlow(true))
          .catch(console.error);
      }, {
        // Context: user clicked "Categorie Toevoegen met Premium" from month-card
        title: t("messages.premium_add_category_title"),
        topText: t("messages.premium_add_category_top"),
      });
      return;
    }
  };

  return { runAddFlow, handleAddClick };
}
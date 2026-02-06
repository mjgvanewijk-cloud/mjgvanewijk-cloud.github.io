// scripts/ui/popup/month-category-popup.js

import { t } from "../../i18n.js";
import { createPopupOverlay } from "./overlay.js";
import { isPremiumActiveForUI } from "../../core/state/premium.js";
import { getAllCategories } from "../../core/state/categories-data-store.js";
import { renderList } from "./month-category-list.js";

// Existing modules
import { getLiveTotalForMonth } from "./month-category-popup-data.js";

// New small helper modules
import { buildMonthCategoryPopupDOM, setAddButtonLabel } from "./month-category-popup-dom.js";
import { clearPopupDrafts, finalizePopup } from "./month-category-popup-lifecycle.js";
import { createAddFlow } from "./month-category-popup-addflow.js";

/**
 * Month category popup (income/expense).
 * - Overig moet altijd zichtbaar blijven.
 * - Premium = optel-model:
 *   vóór de eerste echte categorie moeten bestaande (legacy) maandtotalen "stollen"
 *   naar Overig overrides, anders verdwijnt Overig (0) bij rebuild.
 * - Na "Gratis proefperiode starten" direct door naar "Nieuwe categorie toevoegen".
 */
export function openMonthCategoryPopup({
  year,
  month,
  type, // "income" | "expense"
  totalAmount = 0, // fallback
  onClose,
  onAddCategory,
  onCategoryClick,
  onDataChanged,
}) {
  // Normaliseer: in deze popup mag month soms als string binnenkomen.
  // Onze inline-draft store gebruikt numerieke maand-index.
  const monthNum = Number(month) || 1;

  // Deze popup moet zich gedragen als een 'card' (zoals maand-cards): centered en stabiel in landscape.
  const overlay = createPopupOverlay("ff-overlay-center");
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  const monthLabel = t(`months.${month}`);
  const typeLabel = type === "income" ? t("table.headers.income") : t("table.headers.expense");

  const title = t("popups.month_category_title", {
    type: typeLabel,
    month: monthLabel,
    year: String(year),
  });

  const computeAddLabel = () => {
    const cats = getAllCategories();
    const countForType = cats.filter((c) => c && String(c.type || "expense") === String(type)).length;

    // Eerste categorie is gratis (ook zonder premium)
    if (countForType === 0) return t("monthpopup.create_cat");

    // Vanaf de tweede categorie: premium gating
    return isPremiumActiveForUI() ? t("common.add_cat") : t("monthpopup.add_cat_with_premium");
  };

  const { popup, listEl, addBtn, closeBtn } = buildMonthCategoryPopupDOM({
    type,
    title,
    addLabel: computeAddLabel(),
    closeLabel: t("common.close"),
  });

  let listController = null;
  let closed = false;

  const getLiveTotal = () => {
    const v = getLiveTotalForMonth(year, month, type);

    // v kan 0 zijn (geldig) of null als viewmodel ontbreekt.
    if (typeof v === "number" && Number.isFinite(v)) return v;

    const fallback = Number(totalAmount);
    return Number.isFinite(fallback) ? fallback : 0;
  };

  const updateAddButtonLabel = () => {
    setAddButtonLabel(addBtn, computeAddLabel());
  };

  const rerender = () => {
    if (closed) return;
    if (!listEl) return;

    updateAddButtonLabel();

    // Belangrijk voor Undo/Redo UX:
    // Alleen het openen/sluiten van deze popup mag geen persist-writes doen.
    // De lijst-render gebruikt al een "live total" fallback (Overig = totaal bij legacy data)
    // en hoeft dus niet te 'solidify-en' tijdens openen.

    listController = renderList({
      container: listEl,
      year,
      month,
      type,
      totalAmount: getLiveTotal(),
      onCategoryClick: (payload = {}) => {
        if (typeof payload.refreshSelf !== "function") payload.refreshSelf = rerender;
        if (typeof onCategoryClick === "function") onCategoryClick(payload);
      },
      onDataChanged: typeof onDataChanged === "function" ? onDataChanged : null,
      premiumEnabled: !!isPremiumActiveForUI(),
      preview: null,
      refreshSelf: rerender,
    });
  };

  // Discard (no validation): used for overlay click/back.
  const closeDiscard = () => {
    if (closed) return;
    closed = true;

    // Clear any UI-only drafts so reopening shows persisted values.
    clearPopupDrafts({ year, monthNum, type });

    finalizePopup({ overlay, prevOverflow, onClose });
  };

  // Commit-on-close: validate + apply drafts. If invalid, keep popup open and show inline errors.
  const closeCommit = async () => {
    if (closed) return;

    if (listController && typeof listController.saveAll === "function") {
      const ok = await listController.saveAll(() => {});
      if (!ok) return; // keep open; row-level inline errors are emitted by the list
    }

    // Always clear UI-only drafts after a successful close.
    clearPopupDrafts({ year, monthNum, type });

    closed = true;
    finalizePopup({ overlay, prevOverflow, onClose });
  };

  overlay.__ff_onCancel = closeDiscard;

  document.body.appendChild(overlay);
  overlay.appendChild(popup);

  overlay.onclick = (e) => {
    if (e.target === overlay) closeDiscard();
  };

  if (closeBtn) closeBtn.onclick = closeCommit;

  const { handleAddClick } = createAddFlow({
    year,
    month,
    type,
    getLiveTotal,
    rerender,
    onAddCategory,
  });

  if (addBtn) addBtn.onclick = handleAddClick;

  rerender();
}

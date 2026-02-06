// scripts/ui/popup/saving-month/sheet-shell.js
import { t } from "../../../i18n.js";
import { createPopupOverlay, createPopupContainer } from "../overlay.js";

export function createSavingMonthShell({ year, month, onClose } = {}) {
  const overlay = createPopupOverlay("ff-overlay-center");
  const popup = createPopupContainer("ff-month-category-sheet ff-month-category-sheet--saving ff-month-category-card");

  const monthLabel = t(`months.${month}`);

  popup.innerHTML = `
    <div class="ff-popup__header ff-month-category-header">
      <h2 class="ff-popup__title">${t("saving_month.title", { month: monthLabel, year: String(year) })}</h2>
    </div>

    <div class="ff-popup__body ff-month-category-body">
      <div class="ff-month-cat-list" id="ffSavingList"></div>
    </div>

    <div class="ff-popup__footer ff-month-category-footer" id="ffSavingFooter"></div>
  `;

  document.body.style.overflow = "hidden";

  const listEl = popup.querySelector("#ffSavingList");
  const footerEl = popup.querySelector("#ffSavingFooter");

  let refreshFn = null;

  const onPremiumActivated = (e) => {
    const d = e?.detail || {};
    if (Number(d.year) !== Number(year)) return;
    if (Number(d.month) !== Number(month)) return;
    try {
      if (typeof refreshFn === "function") refreshFn();
    } catch (_) {}
  };
  document.addEventListener("ff-saving-month-premium-activated", onPremiumActivated);

  const finalizeClose = () => {
    document.body.style.overflow = "";
    document.removeEventListener("ff-saving-month-premium-activated", onPremiumActivated);
    overlay.remove();
    if (typeof onClose === "function") onClose();
  };

  const setRefreshHandler = (fn) => {
    refreshFn = typeof fn === "function" ? fn : null;
  };

  return { overlay, popup, listEl, footerEl, finalizeClose, setRefreshHandler };
}


// scripts/ui/popup/saving-month/delete-sheets-not-possible.js
import { t, formatCurrency } from "../../../i18n.js";
import { createPopupOverlay, createPopupContainer } from "../../popups.js";

export function openSavingNegativeNotPossibleSheet(violation) {
  if (!violation) return;
  const existingNP = document.getElementById("ffSavingNotPossibleOverlay");
  if (existingNP) existingNP.remove();

  const npOverlay = createPopupOverlay("ff-overlay-center");
  npOverlay.id = "ffSavingNotPossibleOverlay";

  const npRoot = createPopupContainer([
    "ff-month-category-sheet",
    "ff-month-category-card",
    "ff-cat-delete-from-month",
    "ff-not-possible-sheet",
    "ff-month-category-sheet--saving",
    "ff-month-category-sheet--warning",
  ].join(" "));

  const mName = t(`months.${String(violation.month || 1).trim()}`);
  const label = `${mName} ${violation.year}`;

  npRoot.innerHTML = `
    <div class="ff-popup__header ff-month-category-header">
      <h2 class="ff-popup__title">${t("errors.base_item_protected_title")}</h2>
    </div>
    <div class="ff-popup__body ff-cat-delete-body">
      <div class="ff-cat-delete-message">
        ${t("errors.saving_limit_reached", {
          month: label,
          amount: formatCurrency(violation.saving),
        })}
      </div>
    </div>
    <div class="ff-popup__footer ff-month-category-footer">
      <button type="button" id="closeSavingNotPossibleBtn" class="ff-btn ff-btn--primary ff-btn--full">${t("common.close")}</button>
    </div>
  `;

  const closeNP = () => {
    npRoot.classList.remove("show");
    setTimeout(() => npOverlay.remove(), 160);
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeNP();
    }
  };

  document.addEventListener("keydown", onKey);
  npOverlay.onclick = (e) => { if (e.target === npOverlay) closeNP(); };
  const btn = npRoot.querySelector("#closeSavingNotPossibleBtn");
  if (btn) btn.onclick = closeNP;

  npOverlay.appendChild(npRoot);
  document.body.appendChild(npOverlay);
  requestAnimationFrame(() => npRoot.classList.add("show"));
}
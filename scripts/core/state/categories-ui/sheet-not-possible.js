// scripts/core/state/categories-ui/sheet-not-possible.js
import { createPopupOverlay, createPopupContainer } from "../../../ui/popups.js";
import { t, formatCurrency } from "../../../i18n.js";

export function openBankLimitNotPossibleSheet(violation) {
  if (!violation) return;
  const existingNP = document.getElementById("ffNotPossibleOverlay");
  if (existingNP) existingNP.remove();

  const npOverlay = createPopupOverlay("ff-overlay-center");
  npOverlay.id = "ffNotPossibleOverlay";

  const npRoot = createPopupContainer([
    "ff-month-category-sheet",
    "ff-month-category-card",
    "ff-cat-delete-from-month",
    "ff-not-possible-sheet",
    "ff-month-category-sheet--warning",
      ].join(" "));

  const mName = t(`months.${String(violation.month || 1).trim()}`);
  const label = `${mName} ${violation.year}`;

  npRoot.innerHTML = `
    <div class="ff-popup__header ff-month-category-header">
      <div class="ff-popup__title">${t("errors.base_item_protected_title")}</div>
    </div>
    <div class="ff-popup__body ff-cat-delete-body">
      <div class="ff-cat-delete-message">
        ${t("errors.bank_limit_reached", {
          month: label,
          amount: formatCurrency(violation.bank),
          limit: formatCurrency(violation.limit),
        })}
      </div>
    </div>
    <div class="ff-popup__footer ff-cat-footer ff-cat-delete-footer">
      <button type="button" id="closeNotPossibleBtn" class="ff-btn ff-btn--primary">${t("common.close")}</button>
    </div>
  `;

  const closeNP = () => {
    npRoot.classList.remove("show");
    setTimeout(() => npOverlay.remove(), 160);
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e) => { if (e.key === "Escape") { e.preventDefault(); closeNP(); } };
  document.addEventListener("keydown", onKey);
  npOverlay.onclick = (e) => { if (e.target === npOverlay) closeNP(); };
  const btn = npRoot.querySelector('#closeNotPossibleBtn');
  if (btn) btn.onclick = closeNP;

  npOverlay.appendChild(npRoot);
  document.body.appendChild(npOverlay);
  requestAnimationFrame(() => npRoot.classList.add("show"));
}
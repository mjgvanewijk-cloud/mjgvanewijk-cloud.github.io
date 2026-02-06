// scripts/ui/popup/saving-month/sheet-month-overrides-confirm.js
import { createPopupOverlay, createPopupContainer } from "../../popups.js";
import { t } from "../../../i18n.js";

export function openSavingManualMonthOverridesConfirmSheet({ year, onYes, onNo } = {}) {
  const y = Number(year);
  if (!Number.isFinite(y)) return;

  const existing = document.getElementById("ffSavingManualMonthOverridesOverlay");
  if (existing) existing.remove();

  const overlay = createPopupOverlay("ff-overlay-center");
  overlay.id = "ffSavingManualMonthOverridesOverlay";

  const root = createPopupContainer([
    "ff-month-category-sheet",
    "ff-month-category-card",
    "ff-cat-delete-from-month",
    "ff-month-category-sheet--warning",
  ].join(" "));

  root.innerHTML = `
    <div class="ff-popup__header ff-month-category-header">
      <div class="ff-popup__title">${t("common.manual_month_overrides_title", { year: y })}</div>
    </div>
    <div class="ff-popup__body ff-cat-delete-body">
      <div class="ff-cat-delete-message">${t("common.manual_month_overrides_message")}</div>
    </div>
    <div class="ff-popup__footer ff-cat-footer ff-cat-delete-footer">
      <button type="button" id="ffSavingManualMonthOverridesYesBtn" class="ff-btn ff-btn--primary">${t("common.manual_month_overrides_yes")}</button>
      <button type="button" id="ffSavingManualMonthOverridesNoBtn" class="ff-btn ff-btn--secondary">${t("common.manual_month_overrides_no")}</button>
    </div>
  `;

  const close = () => {
    root.classList.remove("show");
    setTimeout(() => overlay.remove(), 160);
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  document.addEventListener("keydown", onKey);
  overlay.onclick = (e) => { if (e.target === overlay) close(); };

  const yesBtn = root.querySelector("#ffSavingManualMonthOverridesYesBtn");
  const noBtn = root.querySelector("#ffSavingManualMonthOverridesNoBtn");

  if (noBtn) noBtn.onclick = (e) => {
    e?.preventDefault?.();
    if (typeof onNo === "function") onNo({ close });
    else close();
  };
  if (yesBtn) yesBtn.onclick = (e) => {
    e?.preventDefault?.();
    if (typeof onYes === "function") onYes({ close });
    else close();
  };

  overlay.appendChild(root);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => root.classList.add("show"));
}

// scripts/ui/popup/saving-month/delete-sheets-year-info.js
import { t } from "../../../i18n.js";
import { createPopupOverlay, createPopupContainer } from "../../popups.js";

// ------------------------------------------------------------
// Info: jaar verwijderen, maar handmatige bedragen blijven staan
// ------------------------------------------------------------

export function openSavingYearDeletedKeepManualInfoSheet({ year } = {}) {
  const y = Number(year);
  if (!Number.isFinite(y)) return;

  const existing = document.getElementById("ffSavingYearDeletedInfoOverlay");
  if (existing) existing.remove();

  const overlay = createPopupOverlay("ff-overlay-center");
  overlay.id = "ffSavingYearDeletedInfoOverlay";

  const root = createPopupContainer([
    "ff-month-category-sheet",
    "ff-month-category-card",
    "ff-cat-delete-from-month",
    "ff-info-sheet",
    "ff-month-category-sheet--saving",
    "ff-month-category-sheet--warning",
  ].join(" "));

  root.innerHTML = `
    <div class="ff-popup__header ff-month-category-header">
      <h2 class="ff-popup__title">${t("saving_accounts.delete_year_done_title")}</h2>
    </div>
    <div class="ff-popup__body ff-cat-delete-body">
      <div class="ff-cat-delete-message">${t("saving_accounts.delete_year_done_message", { year: y })}</div>
    </div>
    <div class="ff-popup__footer ff-month-category-footer">
      <button type="button" id="ffSavingYearDeletedInfoCloseBtn" class="ff-btn ff-btn--primary ff-btn--full">${t("common.close")}</button>
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
  const btn = root.querySelector("#ffSavingYearDeletedInfoCloseBtn");
  if (btn) btn.onclick = (e) => { e?.preventDefault(); close(); };

  overlay.appendChild(root);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => root.classList.add("show"));
}
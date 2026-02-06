import { t } from "../../i18n.js";
import { createPopupOverlay, createPopupContainer } from "../../ui/popups.js";

export const openSavingYearDeletedKeepManualInfoSheet = ({ year } = {}) => {
  const y = Number(year);
  if (!Number.isFinite(y)) return;

  const existingInfo = document.getElementById("ffSavYearDeletedInfoOverlay");
  if (existingInfo) existingInfo.remove();

  const infoOverlay = createPopupOverlay("ff-overlay-center");
  infoOverlay.id = "ffSavYearDeletedInfoOverlay";

  const infoRoot = createPopupContainer([
    "ff-month-category-sheet",
    "ff-month-category-card",
    "ff-cat-delete-from-month",
    "ff-month-category-sheet--saving",
    "ff-month-category-sheet--warning",
    "ff-info-sheet",
  ].join(" "));

  infoRoot.innerHTML = `
    <div class="ff-popup__header ff-month-category-header">
      <h2 class="ff-popup__title">${t("saving_accounts.delete_year_done_title")}</h2>
    </div>
    <div class="ff-popup__body ff-cat-delete-body">
      <div class="ff-cat-delete-message">${t("saving_accounts.delete_year_done_message", { year: y })}</div>
    </div>
    <div class="ff-popup__footer ff-month-category-footer">
      <button type="button" id="ffSavYearDeletedInfoCloseBtn" class="ff-btn ff-btn--primary ff-btn--full">${t("common.close")}</button>
    </div>
  `;

  const close = () => {
    infoRoot.classList.remove("show");
    setTimeout(() => infoOverlay.remove(), 160);
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  document.addEventListener("keydown", onKey);
  infoOverlay.onclick = (e) => { if (e.target === infoOverlay) close(); };
  const btn = infoRoot.querySelector("#ffSavYearDeletedInfoCloseBtn");
  if (btn) btn.onclick = (e) => { e?.preventDefault(); close(); };

  infoOverlay.appendChild(infoRoot);
  document.body.appendChild(infoOverlay);
  requestAnimationFrame(() => infoRoot.classList.add("show"));
};
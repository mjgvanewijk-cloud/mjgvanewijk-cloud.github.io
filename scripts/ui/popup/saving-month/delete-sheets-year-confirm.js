// scripts/ui/popup/saving-month/delete-sheets-year-confirm.js
import { t } from "../../../i18n.js";
import { createPopupOverlay, createPopupContainer } from "../../popups.js";

// ------------------------------------------------------------
// Jaar verwijderen in spaarpot-instellingen (met maand-overrides)
// ------------------------------------------------------------
export function openDeleteSavingYearConfirmSheet({ year, onKeep, onWipe } = {}) {
  const y = Number(year);
  if (!Number.isFinite(y)) return;

  const existing = document.getElementById("ffSavingDeleteYearConfirmOverlay");
  if (existing) existing.remove();

  const overlay = createPopupOverlay("ff-overlay-center");
  overlay.id = "ffSavingDeleteYearConfirmOverlay";
  const root = createPopupContainer([
    "ff-month-category-sheet",
    "ff-month-category-card",
    "ff-cat-delete-from-month",
    "ff-month-category-sheet--warning",
  ].join(" "));

  root.innerHTML = `
    <div class="ff-popup__header ff-month-category-header">
      <div class="ff-popup__title">${t("saving_accounts.delete_year_title", { year: y })}</div>
    </div>
    <div class="ff-popup__body ff-cat-delete-body">
      <div class="ff-cat-delete-message">
        ${t("saving_accounts.delete_year_message", { year: y })}
      </div>
    </div>
    <div class="ff-popup__footer ff-cat-footer ff-cat-delete-footer">
      <button type="button" id="ffSavingDeleteYearKeepBtn" class="ff-btn ff-btn--secondary">${t("saving_accounts.delete_year_keep")}</button>
      <button type="button" id="ffSavingDeleteYearWipeBtn" class="ff-btn ff-btn--primary">${t("saving_accounts.delete_year_wipe")}</button>
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

  const btnKeep = root.querySelector("#ffSavingDeleteYearKeepBtn");
  const btnWipe = root.querySelector("#ffSavingDeleteYearWipeBtn");

  if (btnKeep) btnKeep.onclick = (e) => {
    e?.preventDefault();
    if (typeof onKeep === "function") onKeep({ close });
    else close();
  };
  if (btnWipe) btnWipe.onclick = (e) => {
    e?.preventDefault();
    if (typeof onWipe === "function") onWipe({ close });
    else close();
  };

  overlay.appendChild(root);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => root.classList.add("show"));
}


export function openDeleteSavingYearRemoveOnlyConfirmSheet({ year, onDelete } = {}) {
  const y = Number(year);
  if (!Number.isFinite(y)) return;

  const existing = document.getElementById("ffSavingDeleteYearConfirmOverlay");
  if (existing) existing.remove();

  const overlay = createPopupOverlay("ff-overlay-center");
  overlay.id = "ffSavingDeleteYearConfirmOverlay";
  const root = createPopupContainer([
    "ff-month-category-sheet",
    "ff-month-category-card",
    "ff-cat-delete-from-month",
    "ff-month-category-sheet--warning",
  ].join(" "));

  root.innerHTML = `
    <div class="ff-popup__header ff-month-category-header">
      <div class="ff-popup__title">${t("saving_accounts.delete_year_title", { year: y })}</div>
    </div>
    <div class="ff-popup__body ff-cat-delete-body">
      <div class="ff-cat-delete-message">
        ${t("saving_accounts.delete_year_only_message", { year: y })}
      </div>
    </div>
    <div class="ff-popup__footer ff-cat-footer ff-cat-delete-footer">
      <button type="button" id="ffSavingDeleteYearOnlyBtn" class="ff-btn ff-btn--primary">${t("saving_accounts.delete_year_wipe")}</button>
      <button type="button" id="ffSavingDeleteYearOnlyCancelBtn" class="ff-btn ff-btn--secondary">${t("common.cancel")}</button>
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

  const btnDel = root.querySelector("#ffSavingDeleteYearOnlyBtn");
  const btnCancel = root.querySelector("#ffSavingDeleteYearOnlyCancelBtn");

  if (btnCancel) btnCancel.onclick = (e) => { e?.preventDefault(); close(); };
  if (btnDel) btnDel.onclick = (e) => {
    e?.preventDefault();
    if (typeof onDelete === "function") onDelete({ close });
    else close();
  };

  overlay.appendChild(root);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => root.classList.add("show"));
}
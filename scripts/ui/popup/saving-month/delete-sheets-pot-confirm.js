// scripts/ui/popup/saving-month/delete-sheets-pot-confirm.js
import { t } from "../../../i18n.js";
import { createPopupOverlay, createPopupContainer } from "../../popups.js";

export function openDeleteSavingPotConfirmSheet({ name, onConfirm } = {}) {
  const existing = document.getElementById("ffSavingDeleteConfirmOverlay");
  if (existing) existing.remove();

  const overlay = createPopupOverlay("ff-overlay-center");
  overlay.id = "ffSavingDeleteConfirmOverlay";
  const root = createPopupContainer([
    "ff-month-category-sheet",
    "ff-month-category-card",
    "ff-cat-delete-from-month",
    "ff-month-category-sheet--warning",
  ].join(" "));

  root.innerHTML = `
    <div class="ff-popup__header ff-month-category-header">
      <div class="ff-popup__title">${t("saving_accounts.delete_title_named", { name: String(name || "") })}</div>
    </div>
    <div class="ff-popup__body ff-cat-delete-body">
      <div class="ff-cat-delete-message">
        ${t("saving_accounts.delete_confirm", { name: String(name || "") })}
      </div>
    </div>
    <div class="ff-popup__footer ff-cat-footer ff-cat-delete-footer">
      <button type="button" id="ffSavingDeleteBtn" class="ff-btn ff-btn--primary">${t("common.delete")}</button>
      <button type="button" id="ffSavingCancelDeleteBtn" class="ff-btn ff-btn--secondary">${t("common.cancel")}</button>
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

  const btnDelete = root.querySelector("#ffSavingDeleteBtn");
  const btnCancel = root.querySelector("#ffSavingCancelDeleteBtn");
  if (btnCancel) btnCancel.onclick = (e) => { e?.preventDefault(); close(); };
  if (btnDelete) btnDelete.onclick = (e) => {
    e?.preventDefault();
    if (typeof onConfirm === "function") onConfirm({ close });
    else close();
  };

  overlay.appendChild(root);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => root.classList.add("show"));
}
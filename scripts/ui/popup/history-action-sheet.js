// scripts/ui/popup/history-action-sheet.js
import { t } from "../../i18n.js";
import { createPopupOverlay, createPopupContainer } from "./overlay.js";

function mapChangedKey(key) {
  switch (key) {
    case "finflow_settings": return t("history.changed_settings");
    case "finflow_categories": return t("history.changed_categories");
    case "finflow_monthdata": return t("history.changed_monthdata");
    default: return key;
  }
}

export function openHistoryActionSheet({ op, changedKeys } = {}) {
  const existing = document.getElementById("ffHistoryActionOverlay");
  if (existing) existing.remove();

  const overlay = createPopupOverlay("ff-overlay-center");
  overlay.id = "ffHistoryActionOverlay";

  const root = createPopupContainer([
    "ff-month-category-sheet",
    "ff-month-category-card",
    "ff-history-action-sheet",
    "ff-month-category-sheet--warning",
  ].join(" "));

  const title = (op === "redo") ? t("history.redo_title") : t("history.undo_title");

  const items = Array.isArray(changedKeys) ? changedKeys : [];
  const lines = items.length
    ? items.map(k => `<li>${mapChangedKey(k)}</li>`).join("")
    : `<li>${t("history.changed_unknown")}</li>`;

  root.innerHTML = `
    <div class="ff-popup__header ff-month-category-header">
      <div class="ff-popup__title">${title}</div>
    </div>

    <div class="ff-popup__body ff-cat-delete-body">
      <div class="ff-cat-delete-message">
        <div class="ff-history-action-intro">${t("history.changed_intro")}</div>
        <ul class="ff-history-action-list">${lines}</ul>
      </div>
    </div>

    <div class="ff-popup__footer ff-cat-footer ff-cat-delete-footer">
      <button type="button" id="ffHistoryActionCloseBtn" class="ff-btn ff-btn--primary">${t("common.close")}</button>
    </div>
  `;

  const close = () => {
    root.classList.remove("show");
    setTimeout(() => overlay.remove(), 160);
    document.removeEventListener("keydown", onKey);
  };

  const onKey = (e) => {
    if (e.key === "Escape") close();
  };

  root.querySelector("#ffHistoryActionCloseBtn")?.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", onKey);

  overlay.appendChild(root);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => root.classList.add("show"));
}

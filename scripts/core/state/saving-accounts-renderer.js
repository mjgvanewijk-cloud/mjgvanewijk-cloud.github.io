// scripts/core/state/saving-accounts-renderer.js
import { createSavingAccountRowHTML } from "./saving-accounts-list-html.js";
import { getSavingAccounts } from "./saving-accounts-data.js";
import { t } from "../../i18n.js";
import { isPremiumActiveForUI } from "./premium.js";
import { attachSavingAccountRowListeners } from "./saving-accounts-events.js";

export function renderSavingAccountsList(overlay, opts = {}) {
  const listContainer = overlay.querySelector("#savingAccountsList");
  const targetYear = Number(opts?.year) || new Date().getFullYear();
  if (!listContainer) return;

  const sheet = listContainer.closest(".ff-month-category-sheet");
  const accounts = Array.isArray(getSavingAccounts()) ? getSavingAccounts() : [];
  const isPremium = isPremiumActiveForUI();

  const addBtn = overlay.querySelector("#addNewSavingAccountBtn");
  if (addBtn) {
    if (accounts.length === 0) addBtn.textContent = t("saving_month.create_account");
    else if (!isPremium) addBtn.textContent = t("saving_month.add_account_with_premium");
    else addBtn.textContent = t("saving_accounts.manage_add");
  }

  if (accounts.length === 0) {
    listContainer.innerHTML = `
      <div class="ff-warning-message">
        ${t("messages.no_saving_accounts_yet")}
      </div>
    `;
    if (sheet) sheet.classList.add("ff-month-category-sheet--warning");
    return;
  }

  if (sheet) sheet.classList.remove("ff-month-category-sheet--warning");

  listContainer.innerHTML = accounts
    .slice()
    .sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || ""), "nl"))
    .map((acc) => createSavingAccountRowHTML(acc, t))
    .join("");

  attachSavingAccountRowListeners(listContainer, overlay, targetYear);
}
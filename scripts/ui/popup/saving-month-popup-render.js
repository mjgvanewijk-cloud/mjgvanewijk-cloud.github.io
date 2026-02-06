// scripts/ui/popup/saving-month-popup-render.js
import { t } from "../../i18n.js";
import { buildSavingMonthRow } from "./saving-month-popup-row.js";

export function renderSavingMonthList({
  listEl,
  rows,
  premiumActive,
  year,
  month,
}) {
  listEl.innerHTML = "";
  rows.forEach((row) => {
    const item = buildSavingMonthRow({
      row,
      premiumActive,
      year,
      month,
    });
    listEl.appendChild(item);
  });
}

export function renderSavingMonthFooter({
  footerEl,
  premiumActive,
  rowsCount,
  onAddAccount,
  onAddAccountWithPremium,
  onClose,
}) {
  footerEl.innerHTML = "";

  if (premiumActive) {
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "ff-btn ff-btn--primary ff-btn--full";
    addBtn.textContent = t("saving_accounts.manage_add");
    addBtn.onclick = onAddAccount;

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "ff-btn ff-btn--secondary ff-btn--full";
    closeBtn.textContent = t("common.close");
    closeBtn.onclick = onClose;

    footerEl.appendChild(addBtn);
    footerEl.appendChild(closeBtn);
  } else {
    // Eerste spaarpot is gratis
    if (Number(rowsCount || 0) === 0 && typeof onAddAccount === "function") {
      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "ff-btn ff-btn--primary ff-btn--full";
      addBtn.textContent = t("saving_month.create_account");
      addBtn.onclick = onAddAccount;
      footerEl.appendChild(addBtn);
    } else if (typeof onAddAccountWithPremium === "function") {
      const premiumBtn = document.createElement("button");
      premiumBtn.type = "button";
      premiumBtn.className = "ff-btn ff-btn--primary ff-btn--full";
      premiumBtn.textContent = t("saving_month.add_account_with_premium");
      premiumBtn.onclick = onAddAccountWithPremium;
      footerEl.appendChild(premiumBtn);
    }

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "ff-btn ff-btn--secondary ff-btn--full";
    closeBtn.textContent = t("common.close");
    closeBtn.onclick = onClose;
    footerEl.appendChild(closeBtn);
  }
}

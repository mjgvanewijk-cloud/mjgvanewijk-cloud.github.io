// scripts/ui/popup/saving-year/footer.js
import { t } from "../../../i18n.js";

export function renderSavingYearFooter({ footerEl, onClose } = {}) {
  footerEl.innerHTML = "";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  // Read-only sheet: single CTA should be visually primary (blue).
  closeBtn.className = "ff-btn ff-btn--primary ff-btn--full";
  closeBtn.textContent = t("common.close");
  closeBtn.onclick = onClose;

  footerEl.appendChild(closeBtn);
}

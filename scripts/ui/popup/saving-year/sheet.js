// scripts/ui/popup/saving-year/sheet.js
import { attachEscapeToClose } from "../overlay.js";
import { createSavingYearShell } from "./sheet-shell.js";
import { getSavingYearSummaryRows } from "./data.js";
import { renderSavingYearList } from "./render.js";
import { renderSavingYearFooter } from "./footer.js";

export function openSavingYearPopup({ year, onClose } = {}) {
  const { overlay, popup, listEl, footerEl, finalizeClose } = createSavingYearShell({ year, onClose });

  const close = () => finalizeClose();

  // Consistent met andere sheets (saving-month):
  // - ESC sluit altijd de bovenste popup
  // - klik buiten de sheet sluit
  // - overlay krijgt onCancel hook
  attachEscapeToClose();
  overlay.__ff_onCancel = close;
  overlay.onclick = (e) => {
    if (e.target === overlay) close();
  };

  document.body.appendChild(overlay);
  overlay.appendChild(popup);
  requestAnimationFrame(() => popup.classList.add("show"));

  const rows = getSavingYearSummaryRows({ year });

  renderSavingYearList({ listEl, rows });

  renderSavingYearFooter({ footerEl, onClose: close });
}

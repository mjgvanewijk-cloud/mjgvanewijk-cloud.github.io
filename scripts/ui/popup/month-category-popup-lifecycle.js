// scripts/ui/popup/month-category-popup-lifecycle.js

import { clearAllInlineDrafts } from "./month-category-store.js";

export function clearPopupDrafts({ year, monthNum, type }) {
  clearAllInlineDrafts(year, monthNum, type);
}

export function finalizePopup({ overlay, prevOverflow, onClose }) {
  document.body.style.overflow = prevOverflow || "";
  overlay.remove();
  if (typeof onClose === "function") onClose();
}

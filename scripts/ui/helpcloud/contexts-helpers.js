// scripts/ui/helpcloud/contexts-helpers.js

export function norm(s) {
  return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function getActiveTitleText() {
  // Try common title nodes in sheets/popups.
  // IMPORTANT: the app often keeps older screens in the DOM (behind overlays),
  // so we choose the LAST visible title in DOM order.
  const candidates = [
    ".ff-sheet-title",
    ".ff-action-sheet-title",
    ".ff-popup-title",
    ".action-sheet-title",
    ".ff-popup__title",
    ".ff-month-card__title",
    ".ff-sheet__title",
    ".ff-header__title",
    "header h2",
    "header h3",
    "h2",
    "h3"
  ];

  const isVisible = (el) => isVisibleEl(el);

  for (const sel of candidates) {
    const nodes = Array.from(document.querySelectorAll(sel));
    for (let i = nodes.length - 1; i >= 0; i--) {
      const el = nodes[i];
      const t = el && el.textContent ? el.textContent.trim() : "";
      if (t && isVisible(el)) return t;
    }
  }
  return "";
}

// Visibility helper (used across helpcloud heuristics).
export function isVisibleEl(el) {
  if (!el) return false;
  const cs = window.getComputedStyle(el);
  if (!cs) return false;
  if (cs.display === "none" || cs.visibility === "hidden") return false;
  if (parseFloat(cs.opacity || "1") < 0.02) return false;
  const r = el.getBoundingClientRect();
  if (!r || r.width < 2 || r.height < 2) return false;
  return true;
}

/**
 * Returns the top-most visible sheet/popup container.
 * The app often keeps previous sheets in the DOM (behind overlays),
 * so we must scope help detection to the active sheet to avoid
 * false positives from hidden screens.
 */
export function getActiveSheetRoot() {
  const selectors = [
    ".ff-month-category-sheet",
    ".ff-popup",
    ".ff-action-sheet",
    ".ff-sheet",
    ".ff-input-sheet",
    ".ff-year-settings-sheet",
  ];

  for (const sel of selectors) {
    const nodes = Array.from(document.querySelectorAll(sel));
    for (let i = nodes.length - 1; i >= 0; i--) {
      const el = nodes[i];
      if (isVisibleEl(el)) return el;
    }
  }
  return null;
}

export function findButtonByText(text) {
  const want = norm(text);
  const btns = Array.from(document.querySelectorAll("button, [role='button']"));
  return btns.find(b => norm(b.textContent) === want) || null;
}

export function findClickableByTextContains(part) {
  const want = norm(part);
  const nodes = Array.from(document.querySelectorAll("button, [role='button'], a, [data-clickable='true']"));
  return nodes.find(n => norm(n.textContent).includes(want)) || null;
}
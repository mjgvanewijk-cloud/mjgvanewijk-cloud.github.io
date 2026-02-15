// scripts/ui/popup/premium-progress-overlay.js
import { t } from "../../i18n.js";
import { createPopupOverlay, moveFocusOutsideTable } from "./overlay.js";

export const FF_SAVING_ACCOUNTS_CHANGED_DONE_EVENT = "ff-saving-accounts-changed-done";
// Fallback: some flows only fire this one (end-of-refresh in your app).
export const FF_SAVING_ACCOUNTS_CHANGED_EVENT = "ff-saving-accounts-changed";

// Module-level hook so other modules can simply call finishAndClose()
let _activeFinish = null;

export function finishAndClose() {
  // Preferred: close the currently open overlay (if any)
  if (typeof _activeFinish === "function") {
    try { _activeFinish(); } catch (_) {}
    return;
  }
  // Fallback: if no active overlay, still broadcast "done"
  try { window.dispatchEvent(new CustomEvent(FF_SAVING_ACCOUNTS_CHANGED_DONE_EVENT)); } catch (_) {}
  try { document.dispatchEvent(new CustomEvent(FF_SAVING_ACCOUNTS_CHANGED_DONE_EVENT)); } catch (_) {}
}

export function openPremiumProgressOverlay({ titleKey = "messages.calculating_title" } = {}) {
  // Defensive: if a previous overlay instance is still in the DOM (e.g. opacity=0), remove it now.
  try {
    document.querySelectorAll('.ff-premium-progress-overlay').forEach((el) => {
      try { el.remove(); } catch (_) {}
    });
  } catch (_) {}
  // Also reset module hook; a stale hook can prevent a new overlay from being shown.
  _activeFinish = null;

  const overlay = createPopupOverlay("ff-overlay-center ff-premium-progress-overlay ff-esc-disabled");
  // Ensure overlay is ALWAYS visible above sheets/popups (e.g. when edit-sheet stays open).
  // Some sheets use their own overlays/z-index; we hard-force ours to the top.
  try {
    overlay.style.position = "fixed";
    overlay.style.left = "0";
    overlay.style.top = "0";
    overlay.style.right = "0";
    overlay.style.bottom = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "2147483647";
    overlay.style.opacity = "1";
    overlay.style.pointerEvents = "auto";
  } catch (_) {}
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  const card = document.createElement("div");
  try { card.style.position = "relative"; card.style.zIndex = "1"; } catch (_) {}
  card.className = "ff-premium-progress-card";
  card.innerHTML = `
    <div class="ff-premium-progress-title">${t(titleKey)}</div>
    <div class="ff-premium-progress-track" aria-label="${t(titleKey)}">
      <div class="ff-premium-progress-fill ff-premium-progress-fill--js"></div>
    </div>
  `;

  const track = card.querySelector(".ff-premium-progress-track");
  const fill = card.querySelector(".ff-premium-progress-fill");

  // Ensure the moving block is visible even if CSS class styling changes.
  try {
    const bg = window.getComputedStyle(fill).backgroundColor;
    if (!bg || bg === "rgba(0, 0, 0, 0)" || bg === "transparent") {
      fill.style.background = "var(--ff-accent, var(--accent, #0a84ff))";
    }
    fill.style.borderRadius = "999px";
  } catch (_) {}

  track.style.position = "relative";
  track.style.overflow = "hidden";
  fill.style.position = "absolute";
  fill.style.left = "0";
  fill.style.top = "0";
  fill.style.bottom = "0";
  fill.style.width = "22%";
  fill.style.transform = "translateX(-30%)";

  overlay.style.opacity = "1";
  overlay.style.pointerEvents = "auto";
  document.body.appendChild(overlay);
  overlay.appendChild(card);
  try { moveFocusOutsideTable(card); } catch (_) {}

  let closed = false;
  let finished = false;
  let anim = null;

  requestAnimationFrame(() => {
    try {
      anim = fill.animate(
        [{ transform: "translateX(-30%)" }, { transform: "translateX(430%)" }],
        { duration: 900, iterations: Infinity, easing: "linear" }
      );
    } catch (_) {}
  });

  const hardClose = () => {
    if (closed) return;
    closed = true;
    _activeFinish = null;

    try { if (anim) anim.cancel(); } catch (_) {}
    document.body.style.overflow = prevOverflow || "";
    overlay.style.opacity = "0";
    setTimeout(() => { try { overlay.remove(); moveFocusOutsideTable(); } catch (_) {} }, 250);
  };

  const finish = () => {
    if (closed || finished) return;
    finished = true;

    try { if (anim) anim.cancel(); } catch (_) {}
    // Berekening klaar => bar 100% => overlay weg.
    fill.style.transition = "none";
    fill.style.transform = "translateX(0)";
    fill.style.width = "100%";
    try { fill.getBoundingClientRect(); } catch (_) {}
    requestAnimationFrame(hardClose);
  };

  _activeFinish = finish;

  const detach = () => {
    try { window.removeEventListener(FF_SAVING_ACCOUNTS_CHANGED_DONE_EVENT, finish); } catch (_) {}
    try { document.removeEventListener(FF_SAVING_ACCOUNTS_CHANGED_DONE_EVENT, finish); } catch (_) {}
    try { window.removeEventListener(FF_SAVING_ACCOUNTS_CHANGED_EVENT, finish); } catch (_) {}
    try { document.removeEventListener(FF_SAVING_ACCOUNTS_CHANGED_EVENT, finish); } catch (_) {}
  };

  const safeClose = () => { detach(); hardClose(); };

  window.addEventListener(FF_SAVING_ACCOUNTS_CHANGED_DONE_EVENT, finish, { once: true });
  document.addEventListener(FF_SAVING_ACCOUNTS_CHANGED_DONE_EVENT, finish, { once: true });
  // Fallback: if your flow doesn't dispatch "-done", we still finish on the end-of-refresh event.
  window.addEventListener(FF_SAVING_ACCOUNTS_CHANGED_EVENT, finish, { once: true });
  document.addEventListener(FF_SAVING_ACCOUNTS_CHANGED_EVENT, finish, { once: true });

  return { overlay, card, fillEl: fill, finishAndClose: finish, finish, close: safeClose, hardClose: safeClose };
}
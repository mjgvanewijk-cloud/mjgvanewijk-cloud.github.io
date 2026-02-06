// scripts/ui/popup/app-settings/state.js

import { createPopupOverlay, createPopupContainer } from "../overlay.js";

/**
 * Ensure any currently visible HelpCloud bubble/panel is closed.
 */
export function closeHelpCloudIfAny() {
  try {
    window.dispatchEvent(new Event("finflow-history-changed"));
  } catch (_) {
    // no-op
  }
}

export function setHelpMuted(el) {
  try {
    if (el && el.dataset) el.dataset.ffHelpContext = "mute";
  } catch (_) {
    // no-op
  }
}

export function createOverlayAndContainer(containerClass) {
  closeHelpCloudIfAny();

  const overlay = createPopupOverlay("ff-overlay-center");
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  const container = createPopupContainer(containerClass);
  setHelpMuted(container);

  return { overlay, container, prevOverflow };
}

export function bindOverlayClose(overlay, closeAll) {
  overlay.__ff_onCancel = closeAll;
  overlay.onclick = (e) => {
    if (e.target === overlay) closeAll();
  };
}

export function makeCloseAll({ overlay, prevOverflow }) {
  return () => {
    document.body.style.overflow = prevOverflow || "";
    if (overlay.__ff_cleanup_observer) overlay.__ff_cleanup_observer();
    overlay.remove();
  };
}

/**
 * After exportDataFromSettings() opens its confirm sheet (.ff-confirm-sheet),
 * ensure HelpCloud is muted on that sheet root.
 */
export function muteConfirmHelpAfterExport() {
  const mute = () => {
    try {
      const sheet = document.querySelector(".ff-confirm-sheet");
      if (sheet && sheet.dataset) sheet.dataset.ffHelpContext = "mute";
    } catch (_) {
      // no-op
    }
  };

  try {
    requestAnimationFrame(mute);
  } catch (_) {
    mute();
  }

  try {
    setTimeout(mute, 50);
  } catch (_) {
    // no-op
  }
}

export function withTimeout(promise, ms = 8000) {
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

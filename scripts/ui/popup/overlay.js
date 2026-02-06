// scripts/ui/popup/overlay.js

/**
 * Escape sluit altijd de bovenste popup.
 */
export function attachEscapeToClose() {
  window.removeEventListener("keydown", handleEscapeKey);
  window.addEventListener("keydown", handleEscapeKey);
}

function handleEscapeKey(e) {
  if (e.key !== "Escape") return;

  const overlays = document.querySelectorAll(".ff-popup-overlay");
  const activeOverlay = Array.from(overlays).reverse().find((overlay) => {
    if (overlay.classList.contains('ff-esc-disabled')) return false;
    return !overlay.classList.contains("hidden") && overlay.style.display !== "none";
  });

  if (!activeOverlay) return;

  e.preventDefault();
  e.stopPropagation();

  if (typeof activeOverlay.__ff_onCancel === "function") {
    activeOverlay.__ff_onCancel();
  } else {
    activeOverlay.remove();
    document.body.style.overflow = "";
  }
}

/**
 * Overlay (donkere achtergrond) + animatie hook.
 * Belangrijk: altijd bottom-sheet (align-items: flex-end).
 */
export function createPopupOverlay(extraClass = "") {
  const overlay = document.createElement("div");
  overlay.className = ["ff-popup-overlay", extraClass].filter(Boolean).join(" ");

  Object.assign(overlay.style, {
    display: "flex",
    position: "fixed",
    inset: "0",
    zIndex: "20000",
    alignItems: "flex-end",          // <<< bottom-sheet
    justifyContent: "center",
    boxSizing: "border-box",
    padding: "16px",
    paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
    paddingTop: "calc(16px + env(safe-area-inset-top))",
  });

  const activate = (el) => {
    if (!el || el.nodeType !== 1) return;
    if (el.classList && el.classList.contains("ff-popup")) {
      requestAnimationFrame(() => el.classList.add("show"));
    }
  };

  const obs = new MutationObserver((mutations) => {
    for (const m of mutations) m.addedNodes.forEach(activate);
  });

  obs.observe(overlay, { childList: true, subtree: true });
  overlay.__ff_cleanup_observer = () => obs.disconnect();

  return overlay;
}

/**
 * Witte container
 */
export function createPopupContainer(extraClass = "") {
  const popup = document.createElement("div");
  popup.className = ["ff-popup", extraClass].filter(Boolean).join(" ");
  return popup;
}

/**
 * VisualViewport support: overlay NIET verplaatsen, alleen padding aanpassen
 * zodat keyboard niet overlapt.
 */
export function installKeyboardPadding(overlay) {
  const vv = window.visualViewport;
  if (!vv) return () => {};

  const apply = () => {
    const keyboard = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    overlay.style.setProperty('--ff-kb', `${keyboard}px`);
    overlay.classList.toggle('ff-kb-open', keyboard > 0);
    overlay.style.paddingBottom = `calc(${16 + keyboard}px + env(safe-area-inset-bottom))`;

    overlay.style.paddingTop = `calc(16px + env(safe-area-inset-top))`;
  };

  vv.addEventListener("resize", apply);
  vv.addEventListener("scroll", apply);
  apply();

  return () => {
    vv.removeEventListener("resize", apply);
    vv.removeEventListener("scroll", apply);
  };
}

/**
 * Optioneel hulpmiddel om focus buiten de tabel te zetten (o.a. iOS artefacts).
 */
let __ffFocusSink = null;
export function moveFocusOutsideTable(preferredTarget = null) {
  try {
    const ae = document.activeElement;
    if (ae && typeof ae.blur === "function") ae.blur();

    // Prefer focusing a real, visible container (overlay/popup) to avoid
    // focusing aria-hidden nodes (Chrome warns and blocks this).
    const resolveTarget = () => {
      if (preferredTarget && preferredTarget.nodeType === 1) return preferredTarget;

      const overlays = Array.from(document.querySelectorAll(".ff-popup-overlay"));
      const activeOverlay = overlays
        .filter((o) => !o.classList.contains("hidden") && o.style.display !== "none")
        .slice(-1)[0];

      if (activeOverlay) {
        const popup = activeOverlay.querySelector(".ff-popup");
        return popup || activeOverlay;
      }
      return null;
    };

    const target = resolveTarget();
    if (target) {
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      return;
    }

    // Fallback: focus a hidden sink (NOT aria-hidden).
    if (!__ffFocusSink) {
      __ffFocusSink = document.createElement("div");
      __ffFocusSink.tabIndex = -1;
      __ffFocusSink.style.cssText =
        "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;";
      document.body.appendChild(__ffFocusSink);
    }
    __ffFocusSink.focus({ preventScroll: true });
  } catch (_) {}
}
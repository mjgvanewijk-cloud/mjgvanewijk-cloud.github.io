// scripts/ui/helpcloud/index.js

import { t } from "../../i18n.js";
import { detectHelpContext } from "./contexts.js";
import { loadState, saveState, isNode, clickInside } from "./helpcloud-state.js";
import { 
  clearHighlights, 
  applyHighlights, 
  buildUI, 
  deriveTargetsFromFocus, 
  deriveCtxOverrideFromFocus 
} from "./helpcloud-ui.js";

export function initHelpCloud({ idleMs = 8000 } = {}) {
  const st = loadState();
  st.muted = st.muted === true;
  st.lastShownAt = st.lastShownAt || 0;
  st.lastCtxId = st.lastCtxId || "";
  saveState(st);

  const { bubble, panel } = buildUI();

  let idleTimer = null;
  let visible = false;
  let panelOpen = false;
  let returnFocusEl = null;

  function isOrangeSheetOpen() {
    // Orange header sheets are implemented as "warning" month-category sheets.
    return !!document.querySelector(".ff-month-category-sheet--warning");
  }

  function hideAll() {
    // Accessibility: never set aria-hidden on an ancestor of the focused element.
    // If focus is inside the help panel, move focus back before hiding.
    try {
      const ae = document.activeElement;
      if (panel && ae && typeof ae === "object" && panel.contains(ae)) {
        const candidate = returnFocusEl;
        if (candidate && typeof candidate.focus === "function" && candidate !== ae && document.contains(candidate)) {
          candidate.focus({ preventScroll: true });
        } else if (typeof ae.blur === "function") {
          ae.blur();
        }
      }
    } catch (_) {}

    visible = false;
    panelOpen = false;
    bubble.classList.remove("is-visible");
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    clearHighlights();
  }

  function scheduleIdle() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!panelOpen) showBubble({ reason: "idle" });
    }, idleMs);
  }

  function showBubble({ force = false, reason = "idle", fromFocus = false } = {}) {
    if (st.muted) return;

    // Suppress contextual help on orange (warning) sheet-engine screens.
    if (isOrangeSheetOpen()) {
      hideAll();
      return;
    }

    const ctx0 = detectHelpContext();
    if (!ctx0) return;

    const now = Date.now();
    const ctxChanged = (ctx0.id && ctx0.id !== st.lastCtxId);

    const cooldownMs = 12000;
    if (!force && !ctxChanged && (now - st.lastShownAt < cooldownMs)) return;

    let ctx = ctx0;
    const ae = document.activeElement;

    if (fromFocus && isNode(ae)) {
      ctx = deriveCtxOverrideFromFocus(ctx0, ae);
    }

    visible = true;
    bubble.classList.add("is-visible");

    let targets = [];
    if (fromFocus && isNode(ae)) {
      targets = deriveTargetsFromFocus(ae, ctx0);
    } else {
      const ctxTargets = (typeof ctx.targets === "function") ? ctx.targets() : [];
      targets = ctxTargets;
      if (ctx0.id === "year") targets = (ctxTargets || []).slice(0, 1);
    }

    applyHighlights(targets);

    st.lastShownAt = now;
    st.lastCtxId = ctx0.id || "";
    saveState(st);

    bubble.__ff_ctx = ctx;
  }

  function openPanel() {
    if (isOrangeSheetOpen()) {
      hideAll();
      return;
    }
    const ctx0 = bubble.__ff_ctx || detectHelpContext();
    if (!ctx0) return;

    const ae = document.activeElement;
    // Remember where to return focus when the panel closes.
    returnFocusEl = (isNode(ae) && !panel.contains(ae)) ? ae : bubble;
    const ctx = (isNode(ae)) ? deriveCtxOverrideFromFocus(ctx0, ae) : ctx0;

    panelOpen = true;
    const titleEl = panel.querySelector(".ff-helpcloud-panel__title");
    const bodyEl = panel.querySelector(".ff-helpcloud-panel__body");

    titleEl.textContent = t(ctx.titleKey);
    bodyEl.textContent = t(ctx.bodyKey);

    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");

    const targets = (isNode(ae))
      ? deriveTargetsFromFocus(ae, ctx0)
      : ((typeof ctx.targets === "function") ? ctx.targets() : []);
    applyHighlights(targets);
  }

  function closeIfOutsidePointer(e) {
    const target = (e && isNode(e.target)) ? e.target : null;

    if (clickInside(bubble, target) || clickInside(panel, target)) {
      scheduleIdle();
      return;
    }

    if (panelOpen) {
      hideAll();
      scheduleIdle();
      return;
    }

    if (visible) {
      hideAll();
      scheduleIdle();
      return;
    }

    scheduleIdle();
  }

  function onNonClosingActivity() {
    scheduleIdle();
  }

  function onKeydown(e) {
    if (e && e.key === "Escape" && (visible || panelOpen)) {
      hideAll();
    }
    scheduleIdle();
  }

  bubble.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!visible) return;
    openPanel();
  });

  panel.querySelector(".ff-helpcloud-panel__close").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    hideAll();
    scheduleIdle();
  });
  panel.querySelector(".ff-helpcloud-panel__btn").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    hideAll();
    scheduleIdle();
  });

  window.addEventListener("focusin", (e) => {
    const target = (e && isNode(e.target)) ? e.target : null;
    if (!target) return;
    if (isOrangeSheetOpen()) {
      hideAll();
      return;
    }
    if (target.matches("input, textarea, [contenteditable='true']")) {
      showBubble({ force: true, reason: "focus", fromFocus: true });
      scheduleIdle();
    }
  }, { capture: true });

  // Actively hide help UI if an orange (warning) sheet appears.
  // This handles cases where a warning/confirm sheet is opened while the bubble/panel
  // is already visible from the underlying screen.
  const mo = new MutationObserver(() => {
    if (isOrangeSheetOpen() && (visible || panelOpen)) {
      hideAll();
    }
  });
  try {
    mo.observe(document.body, { childList: true, subtree: true });
  } catch (_) {}

  window.addEventListener("mousedown", closeIfOutsidePointer, { passive: true, capture: true });
  window.addEventListener("touchstart", closeIfOutsidePointer, { passive: true, capture: true });
  window.addEventListener("scroll", onNonClosingActivity, { passive: true, capture: true });
  window.addEventListener("keydown", onKeydown, { passive: true, capture: true });

  window.addEventListener("finflow-history-changed", () => {
    if (visible && !panelOpen) hideAll();
    scheduleIdle();
  });

  scheduleIdle();
  return { hideAll, scheduleIdle };
}
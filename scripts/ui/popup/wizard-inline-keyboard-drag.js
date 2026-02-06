// scripts/ui/popup/wizard-inline-keyboard-drag.js

/**
 * iPhone landscape requirement:
 * - Geen resize / geen scrollbare sheet.
 * - Gebruiker moet de sheet als één geheel kunnen slepen (achter/langs keyboard).
 *
 * We implementeren daarom een drag-offset via CSS var: --ff-drag.
 * CSS scoped op .ff-overlay-wizard-inline zorgt dat de sheet transform gebruikt.
 */
export function installKeyboardDrag(overlay, sheet, dragHandle) {
  const vv = window.visualViewport;
  if (!vv) return () => {};

  let dragging = false;
  let startY = 0;
  let startDrag = 0;
  let dragY = 0;

  // Basispositie (dragY=0) rects om bounds te berekenen
  let baseTop = 0;
  let baseBottom = 0;
  let baseHeight = 0;

  // Bounds in pixels (dragY clamped)
  let minDrag = 0;
  let maxDrag = 0;

  const MARGIN = 10; // klein beetje lucht

  const setDrag = (y) => {
    dragY = y;
    sheet.style.setProperty("--ff-drag", `${dragY}px`);
  };

  const computeBase = () => {
    // Reset drag om basis te meten
    sheet.style.setProperty("--ff-drag", `0px`);
    const r = sheet.getBoundingClientRect();
    baseTop = r.top;
    baseBottom = r.bottom;
    baseHeight = r.height;
  };

  const computeBounds = () => {
    // Visible viewport bounds (excl. keyboard)
    const visTop = vv.offsetTop;
    const visBottom = vv.offsetTop + vv.height;

    // Constraint: sheet moet binnen visible viewport kunnen worden geplaatst.
    // (Als dat fysiek niet past, houden we in ieder geval top-clamp aan.)
    const dragTopLimit = (visTop + MARGIN) - baseTop; // >=
    const dragBottomLimit = (visBottom - MARGIN) - baseBottom; // <=

    // maxDrag: laat niet verder naar beneden dan basispositie (0)
    maxDrag = Math.max(0, dragTopLimit);
    // minDrag: zover omhoog dat bottom niet onder keyboard valt,
    // maar ook niet boven de top-marge.
    minDrag = Math.min(0, dragBottomLimit);
    if (minDrag < dragTopLimit) minDrag = dragTopLimit;

    // Als de sheet hoger is dan vv.height, voorkom "locked" behavior:
    // geef alsnog een beperkte range rond de basispositie.
    if (baseHeight > (vv.height - 2 * MARGIN)) {
      maxDrag = 0;
      minDrag = Math.min(minDrag, -Math.max(0, (baseBottom - (visBottom - MARGIN))));
    }
  };

  const clamp = (y) => Math.max(minDrag, Math.min(maxDrag, y));

  const onPointerDown = (e) => {
    // Alleen slepen via header/handle; niet wanneer user op input/toggle drukt.
    const target = e.target;
    if (target && (target.closest("input") || target.closest("button") || target.closest("textarea") || target.closest("select"))) {
      return;
    }

    dragging = true;
    startY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
    startDrag = dragY;
    sheet.classList.add("ff-dragging");

    try { dragHandle.setPointerCapture?.(e.pointerId); } catch (_) {}
    e.preventDefault?.();
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const y = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
    const delta = y - startY;
    setDrag(clamp(startDrag + delta));
    e.preventDefault?.();
  };

  const onPointerUp = (e) => {
    if (!dragging) return;
    dragging = false;
    sheet.classList.remove("ff-dragging");
    try { dragHandle.releasePointerCapture?.(e.pointerId); } catch (_) {}
    e.preventDefault?.();
  };

  const onVVChange = () => {
    // Recompute base+bounds when viewport changes (keyboard open/close or rotate)
    computeBase();
    computeBounds();
    setDrag(clamp(dragY));
  };

  // Init
  computeBase();
  computeBounds();
  setDrag(0);

  vv.addEventListener("resize", onVVChange);
  vv.addEventListener("scroll", onVVChange);

  // Pointer events (preferred)
  dragHandle.addEventListener("pointerdown", onPointerDown);
  dragHandle.addEventListener("pointermove", onPointerMove);
  dragHandle.addEventListener("pointerup", onPointerUp);
  dragHandle.addEventListener("pointercancel", onPointerUp);

  // Touch fallback
  dragHandle.addEventListener("touchstart", onPointerDown, { passive: false });
  dragHandle.addEventListener("touchmove", onPointerMove, { passive: false });
  dragHandle.addEventListener("touchend", onPointerUp, { passive: false });
  dragHandle.addEventListener("touchcancel", onPointerUp, { passive: false });

  return () => {
    vv.removeEventListener("resize", onVVChange);
    vv.removeEventListener("scroll", onVVChange);

    dragHandle.removeEventListener("pointerdown", onPointerDown);
    dragHandle.removeEventListener("pointermove", onPointerMove);
    dragHandle.removeEventListener("pointerup", onPointerUp);
    dragHandle.removeEventListener("pointercancel", onPointerUp);

    dragHandle.removeEventListener("touchstart", onPointerDown);
    dragHandle.removeEventListener("touchmove", onPointerMove);
    dragHandle.removeEventListener("touchend", onPointerUp);
    dragHandle.removeEventListener("touchcancel", onPointerUp);
  };
}

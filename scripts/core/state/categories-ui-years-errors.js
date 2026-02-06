// scripts/core/state/categories-ui-years-errors.js
import { getYearValueFromBlock } from "./categories-ui-years-utils.js";

export function clearCategoryYearInlineErrors(container) {
  container.querySelectorAll(".cat-year-inline-error").forEach((el) => {
    el.style.display = "none";
    const tEl = el.querySelector(".cat-year-inline-error-text");
    if (tEl) tEl.textContent = "";
  });
}

export function showCategoryYearInlineError(container, year, message) {
  const yStr = String(year);
  const blocks = Array.from(container.querySelectorAll(".cat-year-block"));
  const target = blocks.find((b) => getYearValueFromBlock(b) === yStr) ||
    blocks.sort((a, b) => {
      const ay = parseInt(getYearValueFromBlock(a) || "0", 10) || 0;
      const by = parseInt(getYearValueFromBlock(b) || "0", 10) || 0;
      return by - ay;
    })[0] || null;

  if (!target) {
    return;
  }
  const err = target.querySelector(".cat-year-inline-error");
  const txt = err?.querySelector(".cat-year-inline-error-text");
  if (txt) txt.textContent = String(message || "");
  if (err) {
    err.style.display = "flex";

    // __FF_SCROLL_INLINE__
    // Zorg dat de melding ook bij meerdere jaren direct in beeld komt.
    const scrollIntoView = () => {
      try { err.scrollIntoView({ block: "center", inline: "nearest" }); } catch (_) {}
    };
    // Eerstvolgende paint + nogmaals (iOS/overlay timing).
    try { requestAnimationFrame(scrollIntoView); } catch (_) { scrollIntoView(); }
    try { setTimeout(scrollIntoView, 0); } catch (_) {}
  }
}

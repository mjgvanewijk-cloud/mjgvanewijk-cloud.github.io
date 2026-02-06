// scripts/core/state/categories-ui-years-errors.js
import { getYearValueFromBlock } from "./categories-ui-years-utils.js";

const __FFDBG = () => !!(globalThis && globalThis.FFDBG_DELETE_YEAR);

export function clearCategoryYearInlineErrors(container) {
  if (__FFDBG()) {
    try {
      const n = container?.querySelectorAll?.(".cat-year-inline-error")?.length ?? 0;
      console.log("[FFDBG][DEL_YEAR][INLINE_CLEAR][time] count=", n);
    } catch (_) {}
  }
  container.querySelectorAll(".cat-year-inline-error").forEach((el) => {
    el.style.display = "none";
    const tEl = el.querySelector(".cat-year-inline-error-text");
    if (tEl) tEl.textContent = "";
  });
}

export function showCategoryYearInlineError(container, year, message) {
  if (__FFDBG()) {
    try {
      console.log("[FFDBG][DEL_YEAR][INLINE_SHOW][time] year=", year, "msg=", String(message || ""));
    } catch (_) {}
  }
  const yStr = String(year);
  const blocks = Array.from(container.querySelectorAll(".cat-year-block"));

  const target =
    blocks.find((b) => getYearValueFromBlock(b) === yStr) ||
    blocks
      .sort((a, b) => {
        const ay = parseInt(getYearValueFromBlock(a) || "0", 10) || 0;
        const by = parseInt(getYearValueFromBlock(b) || "0", 10) || 0;
        return by - ay;
      })[0] ||
    null;

  if (!target) return;

  const err = target.querySelector(".cat-year-inline-error");
  const txt = err?.querySelector(".cat-year-inline-error-text");
  if (txt) txt.textContent = String(message || "");
  if (err) err.style.display = "flex";

  if (__FFDBG()) {
    try {
      console.log("[FFDBG][DEL_YEAR][INLINE_SHOW][time] applied display=", err ? err.style.display : null, "hasTextNode=", !!txt);
    } catch (_) {}
  }
}
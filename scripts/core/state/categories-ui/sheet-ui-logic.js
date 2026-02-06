// scripts/core/state/categories-ui/sheet-ui-logic.js

export function getSheetOverlayClass(options) {
  return (options && options.overlayClass) 
    ? String(options.overlayClass) 
    : ((options && options.fromMonthCard) ? "ff-overlay-center" : "");
}

export function getSheetPopupClasses(options) {
  let extraPopupClasses = ["category-edit-sheet"];
  const theme = (options && options.themeType) ? String(options.themeType) : null;

  if (options && options.fromMonthCard) {
    extraPopupClasses = ["ff-month-category-sheet", "ff-month-category-card", "ff-cat-edit-from-month"];
    if (theme === "saving") extraPopupClasses.push("ff-month-category-sheet--saving");
    if (theme === "income") extraPopupClasses.push("ff-month-category-sheet--income");
    if (theme === "expense") extraPopupClasses.push("ff-month-category-sheet--expense");
  } else {
    if (theme === "saving") extraPopupClasses.push("ff-theme-saving");
    if (theme === "income") extraPopupClasses.push("ff-theme-income");
    if (theme === "expense") extraPopupClasses.push("ff-theme-expense");
  }
  return extraPopupClasses.join(" ");
}

export function scrollExistingYearInlineError(root) {
  try {
    const yc = root.querySelector("#catYearsContainer");
    if (!yc) return;
    const errs = Array.from(yc.querySelectorAll(".cat-year-inline-error"));
    const visible = errs.find((el) => {
      if (!el) return false;
      const sd = String(el.style.display || "").toLowerCase();
      if (sd && sd !== "none") return true;
      try { return getComputedStyle(el).display !== "none"; } catch (_) { return false; }
    });
    if (!visible) return;
    const scrollIntoView = () => {
      try { visible.scrollIntoView({ block: "center", inline: "nearest" }); } catch (_) {}
    };
    try { requestAnimationFrame(scrollIntoView); } catch (_) { scrollIntoView(); }
    try { setTimeout(scrollIntoView, 0); } catch (_) {}
  } catch (_) {}
}
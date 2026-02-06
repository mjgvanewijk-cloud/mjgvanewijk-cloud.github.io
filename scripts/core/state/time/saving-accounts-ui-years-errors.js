// scripts/core/state/time/saving-accounts-ui-years-errors.js

/**
 * Verwijdert alle bestaande inline foutmeldingen in de container.
 */
export function clearSavingYearInlineErrors(container) {
  container.querySelectorAll(".sav-year-inline-error").forEach((el) => {
    el.style.display = "none";
    const tEl = el.querySelector(".sav-year-inline-error-text");
    if (tEl) tEl.textContent = "";
  });
}

/**
 * Toont een inline foutmelding bij het specifieke jaar.
 */
export function showSavingYearInlineError(container, year, message) {
  const yStr = String(year);
  const blocks = Array.from(container.querySelectorAll(".sav-year-block"));

  const target =
    blocks.find((b) => String(b.querySelector(".cat-year-val")?.value ?? "").trim() === yStr) ||
    blocks
      .sort((a, b) => {
        const ay = parseInt(a.querySelector(".cat-year-val")?.value ?? "0", 10) || 0;
        const by = parseInt(b.querySelector(".cat-year-val")?.value ?? "0", 10) || 0;
        return by - ay;
      })[0] ||
    null;

  if (!target) return;

  const err = target.querySelector(".sav-year-inline-error");
  const txt = err?.querySelector(".sav-year-inline-error-text");
  if (txt) txt.textContent = String(message || "");
  if (err) {
    err.style.display = "flex";

    // Zorg dat de melding ook bij meerdere jaren direct in beeld komt.
    const scrollIntoView = () => {
      try {
        err.scrollIntoView({ block: "center", inline: "nearest" });
      } catch (_) {}
    };
    // Eerstvolgende paint + nogmaals (iOS/overlay timing).
    try {
      requestAnimationFrame(scrollIntoView);
    } catch (_) {
      scrollIntoView();
    }
    try {
      setTimeout(scrollIntoView, 0);
    } catch (_) {}
  }
}

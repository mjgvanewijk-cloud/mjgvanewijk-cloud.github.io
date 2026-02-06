// scripts/ui/popup/input-popup-controls.js

/**
 * Beheert de inline error melding onder het input veld.
 */
export function setupErrorHelpers(container, input) {
  const box = container.querySelector("#popupInlineError");
  const txt = container.querySelector("#popupInlineErrorText");

  const setInlineError = (msg) => {
    if (txt) txt.textContent = msg || "";
    if (box) box.style.display = msg ? "flex" : "none";
    if (input) {
      if (msg) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    }
  };

  const clearInlineError = () => setInlineError("");

  // Auto-clear bij typen
  if (input) input.addEventListener("input", clearInlineError);

  return { setInlineError, clearInlineError };
}

/**
 * Beheert de positief/negatief toggle knoppen.
 */
export function setupToggleLogic(container, initialNegState, onStateChange) {
  const btnPos = container.querySelector("#btnPos");
  const btnNeg = container.querySelector("#btnNeg");
  let isNeg = !!initialNegState;

  if (!btnPos || !btnNeg) {
    return { getIsNeg: () => isNeg };
  }

  const applyUI = () => {
    btnPos.classList.toggle("is-active-green", !isNeg);
    btnNeg.classList.toggle("is-active-red", isNeg);
    btnPos.classList.toggle("is-inactive-grey", isNeg);
    btnNeg.classList.toggle("is-inactive-grey", !isNeg);
  };

  btnPos.onclick = (e) => {
    e.preventDefault(); e.stopPropagation();
    isNeg = false;
    applyUI();
    if (onStateChange) onStateChange();
  };

  btnNeg.onclick = (e) => {
    e.preventDefault(); e.stopPropagation();
    isNeg = true;
    applyUI();
    if (onStateChange) onStateChange();
  };

  applyUI();

  return { getIsNeg: () => isNeg };
}

/**
 * Beheert de scope knoppen (Maand / Vanaf nu / Alles).
 */
export function setupScopeLogic(container) {
  const scopeBtns = container.querySelectorAll(".scope-btn");
  let selectedScope = "month";

  scopeBtns.forEach((btn) => {
    btn.onclick = (e) => {
      e.preventDefault(); e.stopPropagation();
      scopeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedScope = btn.dataset.scope || "month";
    };
  });

  return { getSelectedScope: () => selectedScope };
}
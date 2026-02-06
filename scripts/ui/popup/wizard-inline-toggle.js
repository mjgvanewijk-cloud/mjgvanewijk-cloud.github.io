// scripts/ui/popup/wizard-inline-toggle.js

export function initWizardInlineToggle({
  showToggle,
  defaultNegative,
  btnPos,
  btnNeg,
  clearInlineError,
}) {
  let isNeg = !!defaultNegative;

  const updateToggleUI = () => {
    if (!showToggle) return;

    // Visuele active state:
    // - Positief: groen
    // - Negatief: rood
    if (btnPos) {
      btnPos.classList.toggle("is-active-green", !isNeg);
      btnPos.classList.toggle("is-active-red", false);
      btnPos.classList.toggle("active", !isNeg); // legacy (harmless)
    }
    if (btnNeg) {
      btnNeg.classList.toggle("is-active-red", isNeg);
      btnNeg.classList.toggle("is-active-green", false);
      btnNeg.classList.toggle("active", isNeg); // legacy (harmless)
    }
  };

  if (showToggle) {
    updateToggleUI();
    if (btnPos) btnPos.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      clearInlineError?.();
      isNeg = false;
      updateToggleUI();
    };
    if (btnNeg) btnNeg.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      clearInlineError?.();
      isNeg = true;
      updateToggleUI();
    };
  }

  return {
    isNegative: () => isNeg,
  };
}

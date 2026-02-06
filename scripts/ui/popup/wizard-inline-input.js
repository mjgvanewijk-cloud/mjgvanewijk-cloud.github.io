// scripts/ui/popup/wizard-inline-input.js

export function initWizardInlineInput({
  input,
  errorBox,
  errorText,
  displayFallbackValue,
  formatCurrency,
  parseMoneyInput,
}) {
  // Inline input gedrag (iPhone / landscape):
  // - Bij tik/focus: leegmaken en cursor links laten beginnen.
  // - Let op: geen scrollIntoView hier.

  if (input) {
    let preEditValue = String(input.value || "");

    const clearAndLeft = () => {
      // Bewaar huidige displaywaarde zodat 'lege blur' kan terugvallen.
      preEditValue = String(input.value || preEditValue || "");

      // Leegmaken zodat de gebruiker direct kan typen
      input.value = "";
      // Cursor links
      try {
        input.setSelectionRange(0, 0);
      } catch (_) {}
    };

    input.addEventListener("focus", clearAndLeft);
    // extra zekerheid voor iOS (touch focus)
    input.addEventListener("pointerdown", () => {
      // pointerdown komt vóór focus; run alleen als nog niet gefocust
      setTimeout(() => {
        if (document.activeElement === input) clearAndLeft();
      }, 0);
    });

    // Na invoer (blur) weer netjes formatteren.
    // Als de user niets invult, herstellen we de vorige displaywaarde.
    input.addEventListener("blur", () => {
      const raw = String(input.value || "").trim();
      if (!raw) {
        input.value = preEditValue || displayFallbackValue;
        return;
      }

      const n = parseMoneyInput(raw);
      if (n == null) {
        input.value = preEditValue || displayFallbackValue;
        return;
      }

      input.value = formatCurrency(n);
      preEditValue = input.value;
    });
  }

  const setInlineError = (msg) => {
    if (!errorBox || !errorText) return;
    errorText.textContent = String(msg ?? "");
    errorBox.style.display = "flex";
  };

  const clearInlineError = () => {
    if (!errorBox || !errorText) return;
    errorText.textContent = "";
    errorBox.style.display = "none";
  };

  return { setInlineError, clearInlineError };
}

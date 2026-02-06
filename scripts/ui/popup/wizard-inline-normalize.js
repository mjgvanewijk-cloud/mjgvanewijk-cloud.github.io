// scripts/ui/popup/wizard-inline-normalize.js

export function normalizeForWizardCallback(raw, parseMoneyInput) {
  // Wizard steps verwachten een parseFloat-compat string.
  // Gebruik daarom een robuuste parse (NL duizendtallen/komma's) en geef een genormaliseerde string terug.
  const n = parseMoneyInput(raw);
  if (n == null) return "";
  return String(n);
}

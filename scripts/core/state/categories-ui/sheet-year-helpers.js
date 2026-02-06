// scripts/core/state/categories-ui/sheet-year-helpers.js

export function getYearDeletePlan({ pendingWipeYears, updatedCat, ctx, selectedType, toggleApi }) {
  const wipeYears = Array.from(pendingWipeYears);
  if (!wipeYears.length) return null;

  const originalName = String(ctx?.cat?.name || "").trim();
  const nextName = String(updatedCat?.name || originalName).trim();
  const names = [originalName, nextName].filter(Boolean);

  return {
    wipeYears,
    type: String(selectedType || toggleApi.getSelectedType() || "expense"),
    names,
  };
}
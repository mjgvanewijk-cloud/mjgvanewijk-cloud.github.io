// scripts/core/state/categories-ui/save-handler-build.js

export function buildUpdatedCategory({ ctx, selectedType, newName, years }) {
  const { _displayName, _yearsView, ...catClean } = (ctx.cat || {});

  if (ctx.isSystemOther) {
    const nextLabels = (catClean.labels && typeof catClean.labels === "object")
      ? { ...catClean.labels }
      : {};

    nextLabels[selectedType] = newName;

    const nextYearsByType = (catClean.yearsByType && typeof catClean.yearsByType === "object")
      ? (typeof structuredClone === "function" ? structuredClone(catClean.yearsByType) : JSON.parse(JSON.stringify(catClean.yearsByType)))
      : { income: {}, expense: {} };

    if (!nextYearsByType.income || typeof nextYearsByType.income !== "object") nextYearsByType.income = {};
    if (!nextYearsByType.expense || typeof nextYearsByType.expense !== "object") nextYearsByType.expense = {};

    // Overig year-defaults zijn per kolom; schrijf alleen naar de actieve kolom.
    nextYearsByType[selectedType] = years;

    return {
      ...catClean,
      name: "Overig",
      type: "expense", // Overig is een systeem-object; type blijft expense als legacy
      yearsByType: nextYearsByType,
      years: nextYearsByType.expense, // legacy container
      labels: nextLabels,
    };
  }

  return {
    ...catClean,
    name: newName,
    type: selectedType,
    years,
  };
}

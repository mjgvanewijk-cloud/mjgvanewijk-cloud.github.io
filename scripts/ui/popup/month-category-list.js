// scripts/ui/popup/month-category-list.js
import { clearContainer, addRowItem } from "./month-category-list-dom.js";
import { createActions } from "./month-category-list-actions.js";

import { buildMonthCategoryListModel } from "./month-category-list-model.js";
import { createInlineSaveEngine } from "./month-category-list-inline-save.js";

export function renderList({
  container,
  year,
  month,
  type,
  totalAmount,
  onCategoryClick,
  onDataChanged,
  premiumEnabled,
  preview,
  refreshSelf,
}) {
  if (!container) {
    return {
      saveAll: async () => false,
      cancelAll: () => false,
    };
  }

  // NOTE (sheet engine): clicking on category name (or the pencil) must open
  // the category edit sheet ("Nieuwe Categorie Toevoegen" / "{name} Bewerken").
  // The legacy per-category month popup flow is being removed, so we do not
  // route row-clicks to `onCategoryClick` anymore.

  const model = buildMonthCategoryListModel({ year, month, type, totalAmount, preview });
  const {
    dotColor,
    totalAbs,
    monthNum,
    cats,
    realCats,
    hasRealCats,
    isPreview,
    overrides,
    getDisplayAmount,
    inferInitialScopeForCat,
  } = model;

  const { handleInlineSave, handleInlineSaveAll, controller } = createInlineSaveEngine({
    year,
    month: monthNum,
    type,
    onDataChanged,
    refreshSelf,
  });


  // Render (free en premium): geen verplichte 'Overig' rij.
  clearContainer(container);


  realCats
    .slice()
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    .forEach((c) => {
      const rowAmount = isPreview
        ? (preview.category === c.name ? totalAbs : 0)
        : getDisplayAmount(c, c.name);

      const actions = createActions({
        name: c.name,
        isSystem: false,
        year,
        month: monthNum,
        type,
        onDataChanged,
        refreshSelf,
      });
      actions.onInlineAmountSave = (val, scope, setInlineError) => handleInlineSave(c.name, val, scope, setInlineError);
      actions.onInlineSaveAll = (setInlineError) => handleInlineSaveAll(setInlineError);

      addRowItem({
        container,
        dotColor,
        displayName: c.name,
        amount: rowAmount,
        onClick: () => actions.onEdit(),
        actions,
        catName: c.name,
        year,
        month: monthNum,
        type,
        initialScope: inferInitialScopeForCat(c.name, c, overrides),
      });
    });

  return controller;
}

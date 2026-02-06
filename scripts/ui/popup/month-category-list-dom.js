// scripts/ui/popup/month-category-list-dom.js
// Orchestrator / compat layer: exports blijven hetzelfde.

import { clearContainer, addSeparator } from "./month-category-list-dom-base.js";
import { buildRowItemDOM } from "./month-category-list-dom-row.js";
import { wireMonthCategoryInlineEditor } from "./month-category-list-dom-inline.js";

export { clearContainer, addSeparator };

export function addRowItem({
  container,
  dotColor,
  displayName,
  amount,
  onClick,
  actions = null,

  catName = null,
  year = "x",
  month = "x",
  type = "x",

  initialScope = null,

  // new: optional
  onInlineEditorStateChanged = null,
  sharedCtx = null,
}) {
  const built = buildRowItemDOM({
    container,
    dotColor,
    displayName,
    amount,
    onClick,
    actions,
    catName,
    year,
    month,
    type,
    initialScope,
  });

  if (!built) return;

  const { row, editor, amountInput, radioName } = built;

  // Amount input behaviour + inline editor wiring
  if (amountInput) {
    wireMonthCategoryInlineEditor({
      editor,
      amountInput,
      radioName,
      catName,
      displayName,
      year,
      month,
      type,
      initialScope,
      onInlineEditorStateChanged,
      sharedCtx,
      row,
    });
  }
}

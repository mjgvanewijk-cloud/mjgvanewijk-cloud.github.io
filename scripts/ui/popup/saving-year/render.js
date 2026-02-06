// scripts/ui/popup/saving-year/render.js
import { buildSavingYearRow } from "./row.js";

export function renderSavingYearList({ listEl, rows }) {
  listEl.innerHTML = "";
  (rows || []).forEach((row) => {
    const item = buildSavingYearRow(row);
    listEl.appendChild(item);
  });
}

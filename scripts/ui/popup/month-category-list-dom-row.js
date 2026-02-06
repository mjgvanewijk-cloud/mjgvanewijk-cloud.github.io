// scripts/ui/popup/month-category-list-dom-row.js
import { t, formatCurrency } from "../../i18n.js";
import { PENCIL_SVG } from "../components/icons.js";

export function buildRowItemDOM({
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
}) {
  if (!container) return null;

  const item = document.createElement("div");
  item.className = "ff-month-cat-item";

  const group = document.createElement("div");
  group.className = "ff-month-cat-group";

  if (dotColor) group.style.setProperty("--ff-month-cat-accent", String(dotColor));

  // CHANGED: div instead of button (iOS tap safety). Class blijft gelijk.
  const row = document.createElement("div");
  row.className = "ff-month-cat-row";
  row.setAttribute("role", "button");
  row.setAttribute("tabindex", "0");

  row.innerHTML = `
    <span class="ff-month-cat-left">
      <span class="ff-month-cat-name">${displayName}</span>
      ${PENCIL_SVG}
    </span>
    <span class="ff-month-cat-amount-wrap">
      <input
        class="ff-month-cat-amount-input"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        spellcheck="false"
        value="${formatCurrency(amount)}"
        aria-label="${t("common.amount")}"
      />
    </span>
  `;

  const handleRowActivate = (e) => {
    const tgt = e && e.target;

    // Klikken in editor / amount wrap => nooit de oude popup
    if (tgt && typeof tgt.closest === "function") {
      if (tgt.closest(".ff-month-cat-inline-editor, .ff-month-cat-amount-wrap, .ff-month-cat-scope")) return;
    }
    if (tgt && tgt.classList && tgt.classList.contains("ff-month-cat-amount-input")) return;

    e.preventDefault();
    e.stopPropagation();
    if (typeof onClick === "function") onClick();
  };

  row.addEventListener("click", handleRowActivate);
  row.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") handleRowActivate(e);
  });

  // Pencil click: open category edit sheet
  const pencil = row.querySelector(".ff-month-cat-pencil");
  if (pencil && actions && typeof actions.onEdit === "function") {
    pencil.style.cursor = "pointer";
    pencil.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      actions.onEdit();
    });
  }

  group.appendChild(row);

  // Inline editor (collapsed by default)
  const editor = document.createElement("div");
  editor.className = "ff-month-cat-inline-editor";
  editor.setAttribute("data-open", "0");

  const safeName = String(catName || displayName || "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "");
  const radioName = `ff_scope_${type}_${year}_${month}_${safeName}`;

  editor.innerHTML = `
    <div class="ff-month-cat-scope">
      <label class="ff-month-cat-radio">
        <input type="radio" name="${radioName}" value="only" />
        <span>${t("month_overview.scope_only_month")}</span>
      </label>

      <label class="ff-month-cat-radio">
        <input type="radio" name="${radioName}" value="from" />
        <span>${t("month_overview.scope_from_month")}</span>
      </label>

      <label class="ff-month-cat-radio">
        <input type="radio" name="${radioName}" value="year" />
        <span>${t("month_overview.scope_whole_year")}</span>
      </label>
    </div>

    <div class="ff-inline-error ff-month-cat-inline-error" role="alert" aria-live="polite" style="display:none; margin-top:10px;">
      <span class="ff-inline-error__icon">▲</span>
      <span class="ff-month-cat-inline-error-text"></span>
    </div>
  `;

  group.appendChild(editor);

  container.appendChild(item);
  item.appendChild(group);

  const amountInput = row.querySelector(".ff-month-cat-amount-input");
  const keyName = String(catName || displayName || "");

  return {
    item,
    group,
    row,
    editor,
    amountInput,
    radioName,
    keyName,
    initialScope,
  };
}

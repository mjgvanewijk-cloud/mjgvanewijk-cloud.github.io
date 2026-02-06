// scripts/year/year-category-totals-sheet.js
// Read-only sheet: jaar-totalen per categorie (Inkomsten/Uitgaven).

import { createPopupOverlay, createPopupContainer } from "../ui/popups.js";
import { formatCurrency, t } from "../i18n.js";
import { loadCats, loadMonthData } from "../core/storage/index.js";
import { monthKey } from "./year-edit-data.js";
import { getOverrideAmount, getDefaultCatAmount } from "./year-edit-helpers.js";

function getCatsForType(type) {
  const arr = Array.isArray(loadCats()) ? loadCats() : [];
  const tType = String(type || "expense");
  // Overig: toon alleen de variant die past bij de actieve kolom (income/expense).
  return arr.filter((c) => {
    const name = String(c?.name || "");
    if (!name) return false;
    if (name === "Overig") return String(c?.type || "expense") === tType;
    return String(c?.type || "expense") === tType;
  });
}

function effectiveMonthAmount({ cat, monthEntry, year, type }) {
  const name = String(cat?.name || "");
  if (!name) return 0;
  const tType = String(type || "expense");

  const ov = getOverrideAmount(monthEntry, tType, name);
  if (ov !== null) {
    const ovVal = Number(ov) || 0;
    if (name === "Overig" && ovVal === 0) {
      // FIX-consistent met computeMonthTotalFromCats:
      // Overig override=0 mag een non-zero year-default niet blokkeren
      const defVal = Number(getDefaultCatAmount(cat, year, tType)) || 0;
      return defVal !== 0 ? defVal : ovVal;
    }
    return ovVal;
  }
  return Number(getDefaultCatAmount(cat, year, tType)) || 0;
}

function computeYearTotalsByCategory(year, type) {
  const cats = getCatsForType(type);
  const monthData = loadMonthData() || {};
  const tType = String(type || "expense");

  const rows = cats.map((cat) => {
    const name = String(cat?.name || "");
    let total = 0;
    for (let m = 1; m <= 12; m++) {
      const key = monthKey(year, m);
      const entry = monthData[key] || {};
      total += Math.abs(Number(effectiveMonthAmount({ cat, monthEntry: entry, year, type: tType })) || 0);
    }
    return { name, total: Number(total) || 0 };
  });

  // Hoog -> laag
  rows.sort((a, b) => {
    const d = (Number(b.total) || 0) - (Number(a.total) || 0);
    if (Math.abs(d) > 0.00001) return d;
    return String(a.name).localeCompare(String(b.name), "nl", { sensitivity: "base" });
  });

  return rows;
}

function renderList(container, rows, type) {
  if (!container) return;
  const tType = String(type || "expense");
  container.innerHTML = rows.map((r) => {
    const amount = Number(r.total) || 0;
    const amountText = formatCurrency(amount);
    const amountClass = (tType === "expense")
      ? (amount > 0.005 ? "ff-amount-negative" : "")
      : (amount > 0.005 ? "ff-amount-positive" : "");

    return `
      <div class="ff-cats-manage-row" role="listitem">
        <div class="ff-cats-manage-edit" style="pointer-events:none;">
          <span class="ff-cats-manage-name">${r.name}</span>
          <span class="ff-year-total-amount ${amountClass}">${amountText}</span>
        </div>
      </div>
    `;
  }).join("");
}

export function openYearCategoryTotalsSheet({ year, type, onClose } = {}) {
  const y = Number(year);
  const tType = (String(type || "expense") === "income") ? "income" : "expense";
  const overlayId = `ffYearCategoryTotalsOverlay_${tType}_${y}`;

  let overlay = document.getElementById(overlayId);
  if (overlay) {
    overlay.classList.add("show");
    overlay.style.zIndex = "10001";
    return;
  }

  overlay = createPopupOverlay("ff-overlay-center");
  overlay.id = overlayId;

  const sheet = createPopupContainer(
    `ff-month-category-sheet ff-month-category-card ff-month-category-sheet--${tType} ff-all-rounded ff-cats-manage-sheet`
  );

  const titleKey = tType === "income" ? "year.totals.income_title" : "year.totals.expense_title";

  sheet.innerHTML = `
    <div class="ff-popup__header ff-month-category-header">
      <h2 class="ff-popup__title">${t(titleKey, { year: y })}</h2>
    </div>

    <div id="yearCategoriesList" class="ff-popup__body ff-month-category-body ff-cats-manage-body" role="list"></div>

    <div class="ff-popup__footer ff-month-category-footer ff-cats-manage-footer">
      <button type="button" class="ff-btn ff-btn--primary ff-btn--full" id="ffCloseYearTotals">${t("common.close")}</button>
    </div>
  `;

  overlay.appendChild(sheet);
  document.body.appendChild(overlay);

  const finalizeAndClose = () => {
    overlay.remove();
    try { if (typeof onClose === "function") onClose(); } catch (_) {}
  };

  overlay.__ff_onCancel = finalizeAndClose;
  overlay.onclick = (e) => { if (e.target === overlay) finalizeAndClose(); };
  sheet.querySelector("#ffCloseYearTotals")?.addEventListener("click", (e) => {
    e?.preventDefault();
    finalizeAndClose();
  });

  const list = sheet.querySelector("#yearCategoriesList");
  const rows = computeYearTotalsByCategory(y, tType);
  renderList(list, rows, tType);

  overlay.classList.add("show");
  overlay.style.zIndex = "10001";
}
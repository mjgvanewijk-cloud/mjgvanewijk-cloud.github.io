// scripts/year/year-events-handlers.js
import { loadSettings } from "../core/storage/index.js";
import { getConfiguredStartYear } from "./year-chain.js";
import { showActivationOverlay, triggerFinalStartYearConfirmation } from "./year-activation.js";
import { openMonthCategoryPopup } from "../ui/popup/month-category-popup.js";
import { openSavingMonthPopup } from "../ui/popup/saving-month-popup.js";
import { openSavingYearPopup } from "../ui/popup/saving-year-popup.js";
import { openCellEditOverlay } from "./year-ui.js";
import { openNewCategorySheet } from "../core/state/categories-ui.js";
import { isPremiumActiveForUI } from "../core/state/premium.js";

import { handleTableRefresh } from "./year-events-refresh.js";
import { triggerDataChanged } from "./year-events-state.js";
import { openYearCategoryTotalsSheet } from "./year-category-totals-sheet.js";

export function attachYearTableEvents(tableBody, year) {
  if (!tableBody) return;

  tableBody.querySelectorAll(".clickable-cell").forEach((cell) => {
    cell.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const currentCell = e.currentTarget;
      const month = Number(currentCell.dataset.month);
      const type = currentCell.dataset.type;
      const raw = currentCell.dataset.value ?? "0";
      const initialAmount = Number(raw) || 0;

      const refreshUI = () => { triggerDataChanged(); };

      const openEditor = () => {
        // Jaaroverzicht: totaal per categorie (read-only sheet)
        if (type === "year_income_totals" || type === "year_expense_totals") {
          openYearCategoryTotalsSheet({
            year,
            type: type === "year_income_totals" ? "income" : "expense",
            onClose: () => handleTableRefresh(year),
          });
          return;
        }

        if (type === "year_saving_overview") {
          openSavingYearPopup({
            year,
            onClose: () => handleTableRefresh(year),
          });
          return;
        }

        if (type === "saving") {          openSavingMonthPopup({
            year,
            month,
            onDataChanged: (fromYear) => handleTableRefresh(Number.isFinite(Number(fromYear)) ? Number(fromYear) : year),
            onClose: (fromYear) => handleTableRefresh(Number.isFinite(Number(fromYear)) ? Number(fromYear) : year),
          });
          return;
        }

        if (type === "income" || type === "expense") {
          openMonthCategoryPopup({
            year,
            month,
            type,
            totalAmount: initialAmount,
            onDataChanged: () => {
              import("./year-monthly-edit.js").then((m) => {
                if (m?.rebuildYearTotalsFromCats) {
                  m.rebuildYearTotalsFromCats(year, "income");
                  m.rebuildYearTotalsFromCats(year, "expense");
                }
                handleTableRefresh(year);
              }).catch(() => handleTableRefresh(year));
            },
            onClose: () => handleTableRefresh(year),
            onAddCategory: ({ type, refresh } = {}) => {
              // Premium is actief; open de "Nieuwe categorie" sheet met type-lock op income/expense.
              openNewCategorySheet(() => {
                try { if (typeof refresh === "function") refresh(); } catch (_) {}
                handleTableRefresh(year);
              }, type, { fromMonthCard: true, overlayClass: "ff-overlay-center", themeType: type, initialYear: year });
            },
            onCategoryClick: (payload = {}) => {
              // Bepaal de naam en zorg dat context ALTIJD gevuld is voor de titel
              const name = String(payload.name || "");
              if (!name) return;
              const clickedAmount = Number(payload.clickedAmount);
              const initialForPopup = Number.isFinite(clickedAmount) ? clickedAmount : initialAmount;
              const actions = payload.actions || null;

              const context = { 
                mode: "category", 
                categoryName: name, 
                actions 
              };

              openCellEditOverlay(
                year,
                month,
                type,
                () => {
                  handleTableRefresh(year);
                  if (typeof payload.refreshSelf === "function") payload.refreshSelf();
                },
                initialForPopup,
                context
              );
            },
          });
          return;
        }

        openCellEditOverlay(year, month, type, () => handleTableRefresh(year), initialAmount);
      };

      const settings = loadSettings() || {};
      const startYear = getConfiguredStartYear(settings);

      if (startYear !== null && year < startYear) {
        const isPremium = settings.isPremium === true || settings.premiumActive === true;
        showActivationOverlay(year, isPremium, () => {
          const updatedSettings = loadSettings() || {};
          triggerFinalStartYearConfirmation(year, updatedSettings, refreshUI);
        }, { refreshCallback: refreshUI });
        return;
      }
      openEditor();
    };
  });
}
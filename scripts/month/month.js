// scripts/month/month.js

import { 
  renderMonth, 
  setupMonthNavigation 
} from "./month-render.js"; 

// 1. Storage imports
import {
  loadCats,
  loadMonthData,
  saveMonthData,
} from "../core/storage/index.js";

// 2. Engine imports (Logica & Berekeningen)
// Functies die berekeningen uitvoeren of caches beheren horen hier.
import {
  computeMonthTotalsFor,
  resetCaches,
} from "../core/engine/index.js";

// 3. State imports (Status & Keys)
// Variabelen die de huidige status van de app bijhouden horen hier.
import {
  currentMonthKey,
  initCurrentMonthKey,
  setCurrentMonthKey,
} from "../core/state/index.js";

// 4. I18n motor
import { t, formatCurrency } from "../i18n.js";
let onDataChanged = null;

/**
 * Initialiseert de maand-module.
 */
export function initMonthModule(onChange) {
  onDataChanged = onChange;
  initCurrentMonthKey();
  setupMonthNavigation();
  setupSavingForm();
  
  // Eerst de algemene maand renderen
  renderMonth();
  
  // Haal de data op en toon de lijst met spaarmutaties
  const allData = loadMonthData() || {};
  const currentData = allData[currentMonthKey] || {};
  renderSavingsList(currentData.savings || []);
}

/**
 * Configureert het formulier voor sparen/opnemen.
 */
function setupSavingForm() {
  const addBtn = document.getElementById("addSavingAction");
  if (addBtn) {
    addBtn.type = "button";
    addBtn.textContent = t('months.btn_add_mutation') || "Mutatie toevoegen"; 
  }

  const cancelBtn = document.getElementById("cancelSavingBtn");
  if (cancelBtn) {
    cancelBtn.textContent = t('common.cancel');
  }

  const saveBtn = document.getElementById("saveMonthBtn");
  if (saveBtn) {
    saveBtn.textContent = t('common.save');
  }
}

/**
 * Rendert de lijst met spaarmutaties (stortingen/opnames).
 */
export function renderSavingsList(savings) {
  const list = document.getElementById("savingsList");
  if (!list) return;
  list.innerHTML = "";

  if (!savings || savings.length === 0) {
    const empty = document.createElement("div");
    empty.className = "ff-helptext";
    empty.style.textAlign = "center";
    empty.style.padding = "20px";
    empty.textContent = t('months.no_mutations') || "Geen spaarmutaties deze maand.";
    list.appendChild(empty);
    return;
  }

  savings.forEach((a, idx) => {
    const row = document.createElement("div");
    row.className = "saving-row";

    const label = document.createElement("div");
    label.className = "saving-label";
    
    // Gebruik vertaling voor storting/opname
    const typeText = a.type === "deposit" ? t('months.saving_deposit') : t('months.saving_withdrawal');
    const typeSpan = document.createElement("span");
    typeSpan.textContent = typeText + ": ";
    
    const amountSpan = document.createElement("span");
    amountSpan.className = "saving-amount";
    // Gebruik de centrale formatCurrency
    amountSpan.textContent = formatCurrency(a.amount);
    amountSpan.style.color = a.type === "deposit" ? "#72ff9f" : "#ff8080";

    label.appendChild(typeSpan);
    label.appendChild(amountSpan);
    row.appendChild(label);

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = t('common.delete');
    delBtn.className = "small-btn danger saving-delete-btn";

    delBtn.onclick = () => {
      const isDeposit = a.type === "deposit";
      const confirmMsg = isDeposit ? t('messages.confirm_delete_deposit') : t('messages.confirm_delete_withdrawal');
      
      if (!confirm(confirmMsg)) return;

      const md = loadMonthData();
      const key = currentMonthKey;
      const e = md[key];
      if (!e || !Array.isArray(e.savings)) return;

      e.savings.splice(idx, 1);
      md[key] = e;
      saveMonthData(md);

      resetCaches();
      renderMonth();
      renderSavingsList(e.savings);
      if (onDataChanged) onDataChanged();
    };

    row.appendChild(delBtn);
    list.appendChild(row);
  });
}
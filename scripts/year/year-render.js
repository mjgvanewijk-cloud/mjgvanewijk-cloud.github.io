// scripts/year/year-render.js
import { loadSettings } from "../core/storage.js";
import { currentYear } from "../core/state.js";
import { getYearViewModel } from "../core/adapter.js";
import { createMonthRow, createYearOverviewRow, updateTotalsRow } from "./year-template.js";
import { attachYearTableEvents } from "./year-events.js";
import { t } from "../i18n.js"; 
// Importeer de Hub uit year.js
import { openYearSettingsSheet } from "./year.js"; 

/**
 * Hoofdfunctie voor het renderen van het jaaroverzicht.
 */
export function renderYear() {
  const settings = loadSettings() || {};
  const year = currentYear;

  // 1. Update UI Elementen uit index.html
  const navYearDisplay = document.getElementById("currentYear");
  if (navYearDisplay) navYearDisplay.textContent = year;

  // Update de statische tabelkoppen via i18n [i18n geadapteerd 2025-12-22]
  updateStaticHeaders();

  const view = getYearViewModel(year);
  const tableBody = document.getElementById("yearTableBody");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  // 2. Maandrijen opbouwen met robuuste logica (clamp + startjaar check)
  
  // Bepaal startjaar robuust: neem het vroegste jaar uit alle relevante settings-maps.
  const startYearKeys = [];
  const considerKeys = (obj) => {
    if (!obj || typeof obj !== "object") return;
    for (const k of Object.keys(obj)) {
      const n = Number(k);
      if (Number.isFinite(n)) startYearKeys.push(n);
    }
  };
  
  considerKeys(settings.yearStarting);
  considerKeys(settings.startMonth);
  considerKeys(settings.yearBankStarting);
  considerKeys(settings.yearSavingStarting);

  const startYear = startYearKeys.length ? Math.min(...startYearKeys) : year;
  const yearIsBeforeStart = year < startYear;

  // Bepaal startmaand voor dit jaar.
  let startMonthValue = 1;
  const rawStart =
    (settings.yearStarting && settings.yearStarting[year] != null)
      ? Number(settings.yearStarting[year])
      : (settings.startMonth && settings.startMonth[year] != null)
        ? Number(settings.startMonth[year])
        : 1;

  // Validatie: alleen waarden tussen 1 en 12 zijn geldig als startmaand
  if (Number.isFinite(rawStart) && rawStart >= 1 && rawStart <= 12) {
    startMonthValue = rawStart;
  }

  // Year overview (boven Januari)
  let yearTotalIncome = 0;
  let yearTotalExpense = 0;
  for (let m = 1; m <= 12; m++) {
    const active = !yearIsBeforeStart && (m >= startMonthValue);
    if (!active) continue;
    const md = (view.months && view.months[m]) ? view.months[m] : null;
    if (!md) continue;
    yearTotalIncome += Number(md.income) || 0;
    yearTotalExpense += Number(md.expense) || 0;
  }

  // Plaats de jaaroverzicht-card boven Januari
  const overviewRow = createYearOverviewRow(
    year,
    {
      totalIncome: yearTotalIncome,
      totalExpense: yearTotalExpense,
      bankEnd: view.bankEnd,
      savingEnd: view.savingEnd,
    },
    !yearIsBeforeStart
  );
  tableBody.appendChild(overviewRow);

  for (let m = 1; m <= 12; m++) {
    // Maand is alleen actief als we niet vóór het startjaar zitten EN m >= startmaand
    const active = !yearIsBeforeStart && (m >= startMonthValue);
    const row = createMonthRow(year, m, view.months[m], active, null);
    tableBody.appendChild(row);
  }

  // 3. Totalen bijwerken
  const totalRow = document.getElementById("yearTotalRow");
  if (totalRow) {
    // Requirement: kolom "SPAREN" moet exact de waarde van "Saldo Spaar" tonen.
    // Daarom tonen we in de totalenrij bij "SPAREN" ook het (laatste) spaar-eindsaldo.
    // SPAREN total = Saldo Spaar
    updateTotalsRow(totalRow, view.yearlyInc, view.yearlyExp, view.savingEnd, view.bankEnd, view.savingEnd);
    updateHeaderColors();
  }

  // 4. Events koppelen aan de tabel
  attachYearTableEvents(tableBody, year);

  // 5. Tandwiel FIX: Koppel aan de centrale Instellingen Hub (year.js)
  const settingsBtn = document.getElementById("settingsBtn");
  if (settingsBtn) {
    settingsBtn.onclick = (e) => {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      openYearSettingsSheet(year); 
    };
  }
}

/**
 * Vertaalt de tabelkoppen naar de taal ingesteld in nl.json.
 * Alle meldingen worden nu uit messages/i18n gehaald [cite: 2025-12-21].
 */
function updateStaticHeaders() {
    const headers = document.querySelectorAll(".year-grid thead th");
    if (headers && headers.length >= 6) {
        headers[0].textContent = t('table.headers.month');
        headers[1].textContent = t('table.headers.income');
        headers[2].textContent = t('table.headers.expense');
        headers[3].textContent = t('table.headers.savings');
        headers[4].textContent = t('table.headers.bank_balance');
        headers[5].textContent = t('table.headers.savings_balance');
    }
}

/**
 * Kleurt de koppen op basis van positieve of negatieve totalen.
 */
function updateHeaderColors() {
  const totalRow = document.getElementById("yearTotalRow");
  if (!totalRow) return;

  const table = document.querySelector(".year-grid");
  const headers = document.querySelectorAll(".year-grid thead th");
  const totalCells = totalRow.querySelectorAll("td");

  // reset
  if (table) table.classList.remove("ff-savings-blue");
  totalRow.classList.remove("ff-savings-blue");

  totalCells.forEach((cell, index) => {
    if (index === 0) return;

    const valText = cell.textContent.replace(/[^\d.,-]/g, "").trim();
    const val = parseFloat(valText.replace(/\./g, "").replace(",", "."));

    if (!Number.isFinite(val) || !headers[index]) return;

    headers[index].classList.remove("header-positive", "header-negative");

    // Kolom 4 = Sparen (index 3 omdat totalRow td's starten bij 0)
    if (index === 3) {
      if (val > 0.01) {
        if (table) table.classList.add("ff-savings-blue");
        totalRow.classList.add("ff-savings-blue");
        // geen header-positive; blauw wordt via CSS kolomregel gezet
      } else if (val < -0.01) {
        headers[index].classList.add("header-negative");
      }
      return;
    }

    if (val > 0.01) headers[index].classList.add("header-positive");
    else if (val < -0.01) headers[index].classList.add("header-negative");
  });
}

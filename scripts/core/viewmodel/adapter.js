// scripts/core/viewmodel/adapter.js
import { simulateYear, resetCaches } from "../engine/index.js";
import { loadCats, loadSettings } from "../storage/index.js";

/**
 * Forceert een opschoning van alle interne caches.
 * Wordt aangeroepen vanuit year-events.js bij UI-updates.
 */
export function resetAdapterCache() {
  resetCaches();
}

/**
 * Vertaalt de simulatie-data naar het formaat voor de UI.
 * Aangepast om direct data te tonen zodra er saldi aanwezig zijn (Clean Start fix).
 */
export function getYearViewModel(year) {
  const settings = loadSettings() || {};
  const systemYear = new Date().getFullYear();

  // Bepaal het vroegst geconfigureerde startjaar (marker of expliciet banksaldo).
  // Dit is leidend voor het tonen van tussenliggende jaren (bv. 2025) wanneer je een eerder jaar activeert.
  const absoluteStartYear = (() => {
    let minYear = null;
    const consider = (y) => {
      const n = parseInt(String(y), 10);
      if (!Number.isFinite(n)) return;
      if (minYear === null || n < minYear) minYear = n;
    };
    if (settings.yearStarting && typeof settings.yearStarting === "object") {
      Object.keys(settings.yearStarting).forEach(consider);
    }
    if (settings.yearBankStarting && typeof settings.yearBankStarting === "object") {
      Object.keys(settings.yearBankStarting).forEach(consider);
    }
    return minYear;
  })();

  let allCats = loadCats();
  if (!Array.isArray(allCats)) {
    allCats = Object.values(allCats || {});
  }

  // 1. Verbeterde logica voor weergave
  // Een jaar moet getoond worden als:
  // - Er een expliciete start-marker is (yearStarting)
  // - OF er een begin-bankwaarde is voor dit jaar
  // - OF er een begin-spaarwaarde is voor dit jaar
  // - OF er categorie-defaults bestaan voor dit jaar (zodat categoriebedragen zichtbaar blijven)
  const hasCategoryDefaultsForYear = allCats.some((c) => {
    const years = c?.years;
    if (!years || typeof years !== "object") return false;
    return Object.prototype.hasOwnProperty.call(years, String(year));
  });

  const isExplicitlyConfigured =
    (settings.yearStarting && settings.yearStarting[year] !== undefined) ||
    (settings.yearBankStarting && settings.yearBankStarting[year] !== undefined) ||
    (settings.yearSavingStarting && settings.yearSavingStarting[year] !== undefined) ||
    hasCategoryDefaultsForYear;

  // We tonen data als het jaar het huidige systeemjaar is, in de toekomst ligt,
  // OF als het specifiek geconfigureerd is (voor het geval men in het verleden kijkt).
  const shouldShowData = (absoluteStartYear !== null ? (year >= absoluteStartYear) : (year >= systemYear)) || isExplicitlyConfigured;

  // Haal de simulatie op
  const sim = simulateYear(year) || {};
  const monthsArr = Array.isArray(sim.months) ? sim.months : [];

  const monthlyData = {};
  let yInc = 0;
  let yExp = 0;
  let yFlow = 0;

  const v = (val) => {
    if (val && typeof val === "object" && "amount" in val) return Number(val.amount) || 0;
    return Number(val) || 0;
  };

  /**
   * Geeft null terug voor jaren die we willen verbergen (streepje "-").
   * Voor geconfigureerde jaren of de toekomst geeft dit altijd een getal.
   */
  const out = (val) => {
    if (!shouldShowData) return null;
    return v(val);
  };

  for (const mObj of monthsArr) {
    if (!mObj || !mObj.month) continue;
    const m = Number(mObj.month);

    let mInc = v(
      mObj._simpleIncome ??
        (mObj.income && typeof mObj.income === "object" ? mObj.income.amount : mObj.income)
    );
    let mExp = v(
      mObj._simpleExpense ??
        (mObj.expense && typeof mObj.expense === "object" ? mObj.expense.amount : mObj.expense)
    );

    if (mObj.cats && typeof mObj.cats === "object" && Object.keys(mObj.cats).length > 0) {
      mInc = 0;
      mExp = 0;
      Object.entries(mObj.cats).forEach(([name, amount]) => {
        const val = v(amount);
        const lowerName = String(name || "").toLowerCase();
        const config = allCats.find((c) => (c?.name || "").toLowerCase() === lowerName);
        if (config) {
          if (config.type === "income") mInc += val;
          else mExp += val;
        } else {
          if (lowerName.includes("inkom") || lowerName.includes("salaris")) mInc += val;
          else mExp += val;
        }
      });
    }

    // Spaarpots worden geneutraliseerd naar 0 voor berekening volgens instructie
    const savingFlow = v(mObj.savingFlow ?? mObj.savingDelta ?? mObj.manualSaving ?? 0);

    yInc += mInc;
    yExp += mExp;
    yFlow += savingFlow;

    monthlyData[m] = {
      income: out(mInc),
      expense: out(mExp),
      savingFlow: out(savingFlow),
      bank: out(mObj.bankEnd),
      saving: out(mObj.savingEnd),
    };
  }

  return {
    year,
    months: monthlyData,
    yearlyInc: out(yInc),
    yearlyExp: out(yExp),
    yearlyFlow: out(yFlow),
    bankEnd: out(sim.bankEnd),
    savingEnd: out(sim.savingEnd),
    isEmptyYear: !shouldShowData,
  };
}

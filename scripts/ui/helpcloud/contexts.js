// scripts/ui/helpcloud/contexts.js

import { norm, getActiveTitleText, getActiveSheetRoot } from "./contexts-helpers.js";
import { 
  getReadOnlyYearKind, 
  isYearOverviewEmpty, 
  isSavingPotsEmpty, 
  getMonthSheetKind, 
  isMonthCategoryListEmpty, 
  isSavingPotEditTitle,
  isSavingPotAddTitle,
  isSettingsMainTitle,
  isManageCategoriesTitle,
  isManageSavingAccountsTitle
} from "./contexts-heuristics.js";
import { 
  pickTargetsForMonthSheet, 
  pickTargetsForYear, 
  pickTargetsForReadOnlyYear, 
  pickTargetsForSavingPots, 
  pickTargetsForSavingPotsOverview, 
  pickTargetsForCategories, 
  pickTargetsForMonthAmountEdit, 
  pickTargetsForSavingPotEdit,
  pickTargetsForWizardInlineSheet
} from "./contexts-targets.js";

export function detectHelpContext() {
  const title = getActiveTitleText();
  const root = getActiveSheetRoot();

  // HARD RULE: no contextual help on any orange (warning) sheets opened via the sheet-engine.
  // These sheets use the month-category sheet shell with the '--warning' modifier.
  // Guard both on the active root and on any warning sheet present in the DOM.
  if ((root && root.classList && root.classList.contains("ff-month-category-sheet--warning")) ||
      document.querySelector(".ff-month-category-sheet--warning")) {
    return null;
  }

  // Explicit per-sheet override (set by sheet modules) to prevent stale/wrong context detection
  // when multiple sheets exist in the DOM or during open/close transitions.
  const forced = (root && root.dataset) ? String(root.dataset.ffHelpContext || "") : "";
  if (forced === "mute") return null;
  if (forced === "savingpot_edit") {
    return { id: "savingpot_edit", titleKey: "helpcloud.ctx.savingpot_edit.title", bodyKey: "helpcloud.ctx.savingpot_edit.body", targets: pickTargetsForSavingPotEdit };
  }
  if (forced === "savingpot_add") {
    return { id: "savingpot_add", titleKey: "helpcloud.ctx.savingpot_add.title", bodyKey: "helpcloud.ctx.savingpot_add.body", targets: pickTargetsForSavingPotEdit };
  }

  // Settings main sheet should never show help (title-based + class-based guards).
  if (root && root.classList && root.classList.contains("ff-year-settings-sheet")) return null;
  if (isSettingsMainTitle(title)) return null;

  // Category & saving-account management overview sheets: no help.
  // IMPORTANT: some flows reuse the same base sheet class (e.g. ff-month-category-sheet--saving)
  // for nested sub-sheets like "Categorie toevoegen". Therefore we only mute help here when the
  // active title matches the *overview* titles.
  if (isManageCategoriesTitle(title) || isManageSavingAccountsTitle(title)) return null;

  // Wizard normally suppresses help, but we allow it for specific inline wizard sheets.
  // Note: these inline sheets are also used when opened from Settings.
  const isWizard = document.body.classList.contains("wizard-active");

  const hasWizardInlineSheet = !!(root && root.classList && root.classList.contains("ff-month-category-sheet--wizard"));

  // Wizard-inline sheets (bank start balance, overdraft limit)
  if (hasWizardInlineSheet) {
    // Distinguish Bank start balance vs. Overdraft limit without relying on localized title strings:
    // - Bank sheet has +/- toggle buttons.
    // - Limit sheet does not.
    const hasToggle = !!(root.querySelector && (root.querySelector("#ffWizardBtnPos") || root.querySelector("#ffWizardBtnNeg")));
    const nt = norm(title);

    if (hasToggle || (nt.includes("beginsaldo") && nt.includes("bank"))) {
      return {
        id: "bank_start_balance",
        titleKey: "helpcloud.ctx.bank_start_balance.title",
        bodyKey: "helpcloud.ctx.bank_start_balance.body",
        targets: pickTargetsForWizardInlineSheet,
      };
    }
    if (nt.includes("roodstaan") || (nt.includes("rood") && nt.includes("limiet"))) {
      return {
        id: "overdraft_limit",
        titleKey: "helpcloud.ctx.overdraft_limit.title",
        bodyKey: "helpcloud.ctx.overdraft_limit.body",
        targets: pickTargetsForWizardInlineSheet,
      };
    }

    // Other wizard-inline sheets: keep help disabled.
    // (We only show help on Bank start balance + Overdraft limit.)
    return null;
  }

  if (isWizard) return null;
  const rok = getReadOnlyYearKind(title);
  if (rok) {
    const id = (rok === "income") ? "year_income_readonly" : (rok === "expense") ? "year_expense_readonly" : "year_savingpots_readonly";
    return { id, titleKey: `helpcloud.ctx.${id}.title`, bodyKey: `helpcloud.ctx.${id}.body`, targets: pickTargetsForReadOnlyYear };
  }

  // Categories UI should win over theme-based heuristics.
  // (Category sheets can be rendered with a "saving" theme class when opened from Settings.)
  const hasCatUi = !!(
    root &&
    (
      (root.querySelector && (root.querySelector("#catYearsContainer") || root.querySelector(".cat-year-block"))) ||
      (root.classList && (root.classList.contains("category-edit-sheet") || root.classList.contains("categories-sheet") || root.classList.contains("ff-categories")))
    )
  );

  if (hasCatUi) {
    return { id: "categories", titleKey: "helpcloud.ctx.categories.title", bodyKey: "helpcloud.ctx.categories.body", targets: pickTargetsForCategories };
  }

  // Saving UI: detect via saving-specific DOM markers (NOT via theme class alone).
  // This prevents category sheets with a "saving" theme from being misclassified as savingpots.
  const hasSavingUi = !!(
    root &&
    (
      (root.querySelector && (
        root.querySelector("#ffSavingYearList") ||
        root.querySelector("#ffSavingMonthList") ||
        root.querySelector(".ff-saving-inline-editor-row") ||
        root.querySelector(".ff-saving-row") ||
        root.querySelector(".ff-saving-rate-input") ||
        root.querySelector("#savYearsContainer") ||
        root.querySelector(".sav-rate-input")
      )) ||
      (root.classList && root.classList.contains("saving-account-edit-sheet"))
    )
  );
  if (hasSavingUi) {
    if (isSavingPotEditTitle(title)) {
      return { id: "savingpot_edit", titleKey: "helpcloud.ctx.savingpot_edit.title", bodyKey: "helpcloud.ctx.savingpot_edit.body", targets: pickTargetsForSavingPotEdit };
    }
    if (isSavingPotAddTitle(title)) {
      return { id: "savingpot_add", titleKey: "helpcloud.ctx.savingpot_add.title", bodyKey: "helpcloud.ctx.savingpot_add.body", targets: pickTargetsForSavingPotEdit };
    }
  }

  const msk = getMonthSheetKind(title);
  if (msk === "month_income") {
    const id = !isMonthCategoryListEmpty() ? "month_income_sheet_filled" : "month_income_sheet";
    return { id, titleKey: `helpcloud.ctx.${id}.title`, bodyKey: `helpcloud.ctx.${id}.body`, targets: pickTargetsForMonthSheet };
  }
  if (msk === "month_expense") {
    const id = !isMonthCategoryListEmpty() ? "month_expense_sheet_filled" : "month_expense_sheet";
    return { id, titleKey: `helpcloud.ctx.${id}.title`, bodyKey: `helpcloud.ctx.${id}.body`, targets: pickTargetsForMonthSheet };
  }
  if (msk === "month_saving") {
    if (isSavingPotsEmpty()) {
      return { id: "savingpots_empty", titleKey: "helpcloud.ctx.savingpots_empty.title", bodyKey: "helpcloud.ctx.savingpots_empty.body", targets: pickTargetsForSavingPots };
    }
    return { id: "savingpots_overview", titleKey: "helpcloud.ctx.savingpots_overview.title", bodyKey: "helpcloud.ctx.savingpots_overview.body", targets: pickTargetsForSavingPotsOverview };
  }

  // Generic saving overview (when we're in saving UI but not in the edit sheet).
  if (hasSavingUi) {
    if (isSavingPotsEmpty()) {
      return { id: "savingpots_empty", titleKey: "helpcloud.ctx.savingpots_empty.title", bodyKey: "helpcloud.ctx.savingpots_empty.body", targets: pickTargetsForSavingPots };
    }
    return { id: "savingpots_overview", titleKey: "helpcloud.ctx.savingpots_overview.title", bodyKey: "helpcloud.ctx.savingpots_overview.body", targets: pickTargetsForSavingPotsOverview };
  }

  // (Categories UI handled earlier)

  const isManualSheet = !!(root && root.classList && root.classList.contains("ff-input-sheet"));
  if (isManualSheet) {
    return { id: "manual", titleKey: "helpcloud.ctx.manual.title", bodyKey: "helpcloud.ctx.manual.body", targets: pickTargetsForMonthAmountEdit };
  }

  const t = norm(title);
  if (t.includes("spaarpotjes") || t.includes("spaarpot") || t.includes("spaarrekening")) return { id: "savingpots", titleKey: "helpcloud.ctx.savingpots.title", bodyKey: "helpcloud.ctx.savingpots.body", targets: pickTargetsForSavingPots };
  if (t.includes("categorie") || t.includes("categorieën")) return { id: "categories", titleKey: "helpcloud.ctx.categories.title", bodyKey: "helpcloud.ctx.categories.body", targets: pickTargetsForCategories };
  if (t.includes("uitgaven/inkomsten aanpassen") || t.includes("inkomsten aanpassen") || t.includes("uitgaven aanpassen") || t.includes("maandbedrag")) return { id: "monthamount", titleKey: "helpcloud.ctx.monthamount.title", bodyKey: "helpcloud.ctx.monthamount.body", targets: pickTargetsForMonthAmountEdit };

  if (!root && document.querySelector(".ff-month-card")) {
    if (!document.querySelector(".ff-month-card__row.clickable-cell")) return { id: "year_inactive", titleKey: "helpcloud.ctx.year_inactive.title", bodyKey: "helpcloud.ctx.year_inactive.body", targets: pickTargetsForYear };
  }

  const defaultId = isYearOverviewEmpty() ? "year_empty" : "year";
  return { id: defaultId, titleKey: `helpcloud.ctx.${defaultId}.title`, bodyKey: `helpcloud.ctx.${defaultId}.body`, targets: pickTargetsForYear };
}
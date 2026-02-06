// scripts/ui/helpcloud/contexts-heuristics.js

import { norm, findClickableByTextContains } from "./contexts-helpers.js";
import { t } from "../../i18n.js";

export function getReadOnlyYearKind(title) {
  const nt = norm(title);
  const months = [
    "januari","februari","maart","april","mei","juni",
    "juli","augustus","september","oktober","november","december"
  ];
  if (months.some(m => nt.includes(` ${m} `))) return "";

  const mm = /^(inkomsten|uitgaven|spaarpotjes)\s*(?:-|–|:)?\s*(\d{4})\b/.exec(nt);
  if (!mm) return "";

  const head = mm[1];
  if (head === "inkomsten") return "income";
  if (head === "uitgaven") return "expense";
  return "savingpots";
}

export function isYearOverviewEmpty() {
  const cards = Array.from(document.querySelectorAll(".ff-month-card"));
  if (!cards.length) return false;

  const txt = cards.map(c => (c && c.textContent) ? c.textContent : "").join(" ");
  const matches = txt.match(/€\s*[-+]?\d[\d\.]*,\d{2}/g) || [];
  if (!matches.length) return false;

  const parse = (s) => {
    const t = String(s || "")
      .replace(/[^0-9,\-\.]/g, "")
      .replace(/\./g, "")
      .replace(/,/g, ".");
    const v = parseFloat(t);
    return Number.isFinite(v) ? v : 0;
  };

  return matches.every(m => Math.abs(parse(m)) < 0.005);
}

export function isSavingPotsEmpty() {
  const hasCreate =
    !!findClickableByTextContains("spaarpot aanmaken") ||
    !!findClickableByTextContains("spaarpot toevoegen") ||
    (!!findClickableByTextContains("nog geen") && !!findClickableByTextContains("spaarpot"));

  const hasRows =
    !!document.querySelector(".ff-saving-inline-editor-row") ||
    !!document.querySelector(".ff-saving-row") ||
    !!document.querySelector("[data-saving-pot-row='true']");

  return hasCreate && !hasRows;
}

export function getMonthSheetKind(title) {
  const nt = norm(title);
  const months = [
    "januari","februari","maart","april","mei","juni",
    "juli","augustus","september","oktober","november","december"
  ];
  const hasMonth = months.some(m => nt.includes(` ${m} `));
  if (!hasMonth) return "";

  if (nt.startsWith("inkomsten ")) return "month_income";
  if (nt.startsWith("uitgaven ")) return "month_expense";
  if (nt.startsWith("spaarpotjes ")) return "month_saving";
  return "";
}

export function hasMonthCategoryRows() {
  const root =
    document.querySelector(".ff-month-category-sheet") ||
    document.querySelector(".ff-month-popup") ||
    document.querySelector(".ff-sheet") ||
    document.body;

  const overig = findClickableByTextContains("overig");
  if (overig) return true;

  const clickables = Array.from(root.querySelectorAll("button, [role='button'], a, [data-clickable='true']"))
    .filter(n => {
      const t = norm(n.textContent || "");
      if (!t) return false;
      if (t.includes("sluiten") || t == "ok" || t == "oke" || t == "oké") return false;
      if (t.includes("opslaan")) return false;
      if (t.includes("categorie toevoegen") || t.includes("categorie aanmaken")) return false;
      if (t.includes("premium")) return false;
      if (t.includes("volgende") || t.includes("terug")) return false;
      return true;
    });

  return clickables.length > 0;
}

export function isMonthCategoryListEmpty() {
  const hasCreate = !!findClickableByTextContains("categorie aanmaken") || !!findClickableByTextContains("categorie toevoegen");
  if (!hasCreate) return false;
  return !hasMonthCategoryRows();
}

export function isSavingPotEditTitle(title) {
  const nt = norm(title);
  if (!nt) return false;
  if (nt.startsWith("spaarpotjes ")) return false;
  const months = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];
  if (months.some(m => nt.includes(` ${m} `))) return false;
  return nt.endsWith(" bewerken");
}

export function isSavingPotAddTitle(title) {
  const nt = norm(title);
  if (!nt) return false;

  // Add-sheet title (i18n-driven). We compare against multiple known titles
  // because the same add-sheet can be opened from different entry points.
  const a = norm(t("saving_accounts.new_title"));
  const b = norm(t("saving_accounts.manage_add"));
  const c = norm(t("messages.premium_add_saving_title"));
  return (nt === a) || (nt === b) || (nt === c);
}

export function isSettingsMainTitle(title) {
  const nt = norm(title);
  if (!nt) return false;

  // Use i18n template "Instellingen voor {year}" but accept any 4-digit year.
  const sample = norm(t("wizard.menu_main.title", { year: "0000" }));
  // sample is like: "instellingen voor 0000"
  const re = new RegExp("^" + sample.replace("0000", "\\d{4}") + "$");
  return re.test(nt);
}

export function isManageCategoriesTitle(title) {
  const nt = norm(title);
  if (!nt) return false;
  const a = norm(t("wizard.menu_main.manage_categories"));
  const b = norm(t("messages.premium_manage_categories_title"));
  return (nt === a) || (nt === b);
}

export function isManageSavingAccountsTitle(title) {
  const nt = norm(title);
  if (!nt) return false;
  const a = norm(t("wizard.menu_main.manage_saving_accounts"));
  const b = norm(t("saving_accounts.manage_title"));
  const c = norm(t("messages.premium_manage_saving_accounts_title"));
  return (nt === a) || (nt === b) || (nt === c);
}

export function isCategoryEditTitle(title) {
  const nt = norm(title);
  if (!nt) return false;

  const editWord = norm(t("common.edit")); // e.g. "bewerken"
  const generic = norm(t("categories.edit_title")); // e.g. "categorie bewerken"

  if (generic && nt === generic) return true;

  // Named title pattern ends with "<editWord>" (e.g. "test bewerken", "abc bewerken")
  if (editWord && nt.endsWith(" " + editWord)) return true;

  return false;
}


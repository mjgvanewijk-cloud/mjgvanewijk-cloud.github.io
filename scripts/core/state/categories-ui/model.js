// scripts/core/state/categories-ui/model.js
import { t } from "../../../i18n.js";
import { getCategoryByName } from "../categories-data.js";
import { loadMonthData } from "../../storage/index.js";
import { ensureOtherYearsByType, isSystemOther } from "../categories-data-helpers.js";

export function getDefaultOtherLabel(type) {
  // Geen fallback: altijd expliciet per kolom
  return type === "income"
    ? t("popups.other_system_label_income")
    : t("popups.other_system_label_expense");
}

function hasNonZeroYearBudgets(cat) {
  if (!cat || typeof cat !== "object") return false;

  // Overig: budgets kunnen per kolom staan
  if (isSystemOther(cat)) {
    const yi = (cat.yearsByType?.income && typeof cat.yearsByType.income === "object") ? cat.yearsByType.income : {};
    const ye = (cat.yearsByType?.expense && typeof cat.yearsByType.expense === "object") ? cat.yearsByType.expense : {};
    return [...Object.values(yi), ...Object.values(ye)].some((v) => Math.abs(Number(v) || 0) > 0.0001);
  }

  const y = (cat.years && typeof cat.years === "object") ? cat.years : {};
  return Object.values(y).some((v) => Math.abs(Number(v) || 0) > 0.0001);
}

function isUsedInMonthAllocations(catName) {
  const nm = String(catName || "").trim().toLowerCase();
  if (!nm) return false;

  const md = loadMonthData() || {};
  for (const entry of Object.values(md)) {
    if (!entry || typeof entry !== "object") continue;
    const cats = entry.cats;
    if (!cats || typeof cats !== "object") continue;

    for (const [k, v] of Object.entries(cats)) {
      if (String(k || "").trim().toLowerCase() === nm && Math.abs(Number(v) || 0) > 0.0001) {
        return true;
      }
    }
  }
  return false;
}

export function prepareCategoryContext({ name, initialType }) {
  const isEdit = name !== null;
  const hasContextType = (initialType === "income" || initialType === "expense");

  let cat = isEdit ? getCategoryByName(name) : null;

  // Veiligheid: cat kan null zijn
  if (!cat) {
    cat = {
      name: "",
      color: "var(--apple-blue)",
      type: hasContextType ? initialType : "expense",
      years: {},
      labels: {}
    };
  }

  if (!cat.labels || typeof cat.labels !== "object") cat.labels = {};

  const isSystemOther = isEdit && String(cat?.name || "") === "Overig";

  // Overig: year-defaults moeten per kolom gescheiden zijn; UI rendert daarom een view-map.
  if (isSystemOther) {
    ensureOtherYearsByType(cat);
  }

  // Overig: display label per kolom, internal key blijft intact
  if (isSystemOther) {
    const labelType = hasContextType ? initialType : (cat.type || "expense");
    const currentLabel = String(cat.labels?.[labelType] || "").trim();
    cat._displayName = currentLabel ? currentLabel : getDefaultOtherLabel(labelType);
  }

  const shouldLockTypeOnEdit = isEdit && (
    isUsedInMonthAllocations(cat.name) || hasNonZeroYearBudgets(cat)
  );

  // Vanuit maand-context (inkomsten/uitgaven kolom) moet het type altijd vaststaan:
  // - juiste knop geselecteerd
  // - andere knop disabled / niet klikbaar
  // In overige context (instellingen) blijft de bestaande lock-logica gelden.
  let lockType = hasContextType ? true : shouldLockTypeOnEdit;

  // Overig: type-toggle moet de kolom weerspiegelen (voor label per kolom)
  if (!isEdit && hasContextType) {
    cat.type = initialType;
  }

  const initialSelectedType =
    (isSystemOther && hasContextType)
      ? initialType
      : (cat.type || (hasContextType ? initialType : "expense"));

  // Overig: years-view per kolom
  if (isSystemOther) {
    const tSel = (initialSelectedType === "income") ? "income" : "expense";
    cat._yearsView = cat.yearsByType?.[tSel] || {};
  }

  return {
    isEdit,
    hasContextType,
    initialType,
    lockType,
    isSystemOther,
    cat,
    initialSelectedType,
  };
}

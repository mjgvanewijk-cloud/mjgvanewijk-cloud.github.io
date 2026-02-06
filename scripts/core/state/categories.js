// scripts/core/state/categories.js

// Importeer alles uit de sub-modules
import { 
  setCategoriesChangeHandler, 
  deleteCategory, 
  syncSettingsCategoriesFromCats,
  getAllCategories
} from "./categories-data.js";

// AANGEPAST: Verwijst nu naar categories-ui.js
import { 
  openSheet, 
  openNewCategorySheet, 
  openEditCategorySheet,
  openDeleteCategorySheet
} from "./categories-ui.js";

// Her-exporteer functies
export {
  setCategoriesChangeHandler,
  deleteCategory,
  syncSettingsCategoriesFromCats,
  openSheet,
  openNewCategorySheet,
  openEditCategorySheet,
  openDeleteCategorySheet
};

// Initialisatie
export function initCategoriesModule() {
  syncSettingsCategoriesFromCats();
}
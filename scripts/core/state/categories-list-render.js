// scripts/core/state/categories-list-render.js
import { loadCats, saveCats } from "../storage/index.js";
import { createCategoryRowHTML } from "./categories-list-html.js";
import { t } from "../../i18n.js";
import { isPremiumActiveForUI } from "./premium.js";

/**
 * Render categoriebeheer (jaarinstellingen).
 * Nieuwe structuur:
 * - Geen verplichte systeemcategorie ("Overig") meer.
 * - Lege state toont oranje waarschuwing + 2 knoppen (Toevoegen / Sluiten).
 * - Premium gating voor "meer dan 1" gebeurt via knoplabel + add-flow elders.
 */
export function renderCategoriesList(overlay) {
  const listContainer = overlay.querySelector("#yearCategoriesList");
  if (!listContainer) return;

  // Sheet container voor warning styling
  const sheet = listContainer.closest(".ff-month-category-sheet");

  let cats = Array.isArray(loadCats()) ? loadCats() : [];

  // Filter op geldige categorie objecten (geen system/legacy items)
  cats = cats.filter((c) => c && typeof c === "object" && String(c.name || "").trim());

  const isPremium = isPremiumActiveForUI();
  const addBtn = overlay.querySelector("#addNewCategoryBtn");

  // Button label: 0 => create, >=1 & !premium => premium label, anders default
  if (addBtn) {
    if (cats.length === 0) addBtn.textContent = t("monthpopup.create_cat");
    else if (!isPremium) addBtn.textContent = t("monthpopup.add_cat_with_premium");
    else addBtn.textContent = t("common.add_cat");
  }

  // Empty state
  if (cats.length === 0) {
    listContainer.innerHTML = `
      <div class="ff-warning-message">
        ${t("messages.no_categories_yet") || t("messages.no_categories") || t("messages.no_categories_created") || t("messages.no_categories_hint") || t("month_overview.add_category")}
      </div>
    `;

    // Warning styles only when empty
    if (sheet) sheet.classList.add("ff-month-category-sheet--warning");
    return;
  }

  if (sheet) sheet.classList.remove("ff-month-category-sheet--warning");

  // Sort alphabetisch
  cats = cats.slice().sort((a, b) => String(a.name).localeCompare(String(b.name), "nl"));

  listContainer.innerHTML = cats.map((cat) => {
    const c = { ...cat, __rowId: cat.id || cat.name };
    return createCategoryRowHTML(c, t);
  }).join("");

  const rows = Array.from(listContainer.querySelectorAll(".ff-cats-manage-row"));
  rows.forEach((row) => {
    const id = row.getAttribute("data-id");
    const type = row.getAttribute("data-type");

    // Edit
    const editBtn = row.querySelector('[data-action="edit"]');
    if (editBtn) {
      editBtn.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        try {
          const m = await import("./categories.js");
          const fn = m.openEditCategorySheet || m.openCategoryEditSheet;
          if (typeof fn === "function") {
            fn(id, () => {
              renderCategoriesList(overlay);
            }, type, { fromMonthCard: true, overlayClass: "ff-overlay-center", themeType: type });
          }
        } catch (err) {
          console.error(err);
        }
      };
    }

    // Delete
    const delBtn = row.querySelector('[data-action="delete"]');
    if (delBtn) {
      delBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Use the sheet-engine delete confirmation (orange header + limit checks).
        import("./categories-ui/sheet-delete-logic.js")
          .then((m) => {
            const openDeleteSheet = m.openDeleteSheet;
            if (typeof openDeleteSheet === "function") {
              openDeleteSheet(id, () => renderCategoriesList(overlay), { themeType: type });
            }
          })
          .catch((err) => console.error(err));
      };
    }
  });
}

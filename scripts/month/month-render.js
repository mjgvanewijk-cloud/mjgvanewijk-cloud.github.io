// scripts/month/month-render.js
import { currentMonthKey } from "../core/state.js";
import { t } from "../i18n.js"; // GEWIJZIGD: Gebruik de nieuwe i18n motor

/**
 * Tekent de basis van de maandweergave.
 * Gebruikt t() voor de vertaling van de maandtitels.
 */
export function renderMonth() {
    const container = document.getElementById("monthViewContainer");
    if (!container) return;
    
    const key = currentMonthKey; // Bijv. "2025-12"
    const [year, monthNum] = key.split("-");
    
    // Haal de vertaalde maandnaam op (bijv. "December")
    const monthName = t(`months.${parseInt(monthNum)}`) || monthNum;

    // Update de UI indien de elementen bestaan
    const titleEl = document.getElementById("monthSheetTitle");
    if (titleEl) {
        titleEl.textContent = `${monthName} ${year}`;
    }

    console.log("Maand renderen voor: " + monthName + " " + year);
}

/**
 * Initialiseert de knoppen voor de maand-navigatie.
 */
export function setupMonthNavigation() {
    const nextBtn = document.getElementById("nextMonthBtn");
    const prevBtn = document.getElementById("prevMonthBtn");

    if (nextBtn) {
        nextBtn.onclick = () => {
            console.log("Volgende maand geklikt");
            // Hier kun je de navigatie-logica uitbreiden indien gewenst
        };
    }
    
    if (prevBtn) {
        prevBtn.onclick = () => {
            console.log("Vorige maand geklikt");
            // Hier kun je de navigatie-logica uitbreiden indien gewenst
        };
    }
}
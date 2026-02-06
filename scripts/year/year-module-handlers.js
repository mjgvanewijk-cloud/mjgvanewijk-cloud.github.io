// scripts/year/year-module-handlers.js
// Logica voor het verwerken van beginsaldi en maandelijks spaarinput.
// [i18n geadapteerd & iPhone-proof 2025-12-25]

import { loadSettings, saveSettings } from "../core/storage.js";
import { formatAmount0 } from "./year-utils.js"; 

/**
 * Helper functie om een inputveld waarde op te slaan in de settings.
 * Geoptimaliseerd voor iPhone: voorkomt keyboard-glitches bij blur.
 */
function saveInputData(year, settingsKey, inputId, onDataChanged) {
    const input = document.getElementById(inputId);
    if (!input) return;

    // iPhone-proof: vervang komma door punt en verwijder eventuele extra spaties
    let rawValue = input.value.trim().replace(/\s/g, '').replace(',', '.');
    const n = parseFloat(rawValue) || 0; 
    
    // 1. Data laden en opslaan
    const settings = loadSettings() || {};
    settings[settingsKey] = settings[settingsKey] || {};
    
    // Alleen opslaan als er daadwerkelijk een wijziging is (voorkomt onnodige re-renders op mobiel)
    if (settings[settingsKey][year] === n) {
        input.value = formatAmount0(n);
        return;
    }

    settings[settingsKey][year] = n;
    saveSettings(settings);

    // 2. UI Waarde Formatteren
    input.value = formatAmount0(n);
    
    // 3. App verversen met een kleine delay voor iOS stabiliteit
    if (onDataChanged) {
        window.requestAnimationFrame(() => {
            onDataChanged();
        });
    }
}

/**
 * Slaat het beginsaldo van de bank op (triggerd door onblur).
 */
export function handleBankBlur(year, onDataChanged) {
    saveInputData(year, 'yearBankStarting', 'yearBankStartInput', onDataChanged);
}

/**
 * Slaat het beginsaldo van het spaarpotje op (triggerd door onblur).
 */
export function handleSavingsBlur(year, onDataChanged) {
    saveInputData(year, 'yearStarting', 'yearSavingsStartInput', onDataChanged);
}


/**
 * Slaat de jaarlijkse inputs op (maandelijks sparen/limiet).
 * Geoptimaliseerd voor iPhone-toetsenbord afhandeling.
 */
export function saveYearInputs(year, monthlyType, onDataChanged) {
    const settings = loadSettings() || {};
    let hasChanged = false;

    // Maandelijks spaarinstelling
    const msInput = document.getElementById("monthlySavingAmount");
    if (msInput) {
        let v = msInput.value.trim().replace(',', '.');
        let num = parseFloat(v);
        
        if (!settings.yearMonthlySaving) settings.yearMonthlySaving = {};

        if (v === "" || isNaN(num) || num < 0) {
            if (settings.yearMonthlySaving[year]) {
                delete settings.yearMonthlySaving[year];
                hasChanged = true;
            }
        } else {
            const current = settings.yearMonthlySaving[year] || {};
            if (current.amount !== num || current.type !== (monthlyType || "deposit")) {
                settings.yearMonthlySaving[year] = {
                    amount: num,
                    type: monthlyType || "deposit", 
                };
                hasChanged = true;
            }
        }
        
        // Opschonen als object leeg is
        if (settings.yearMonthlySaving && Object.keys(settings.yearMonthlySaving).length === 0) {
            delete settings.yearMonthlySaving;
            hasChanged = true;
        }
    }
    
    // Negatieve limiet
    const negInput = document.getElementById("negativeLimitInput");
    if (negInput) {
        let v2 = negInput.value.trim().replace(',', '.');
        let num2 = parseFloat(v2);
        
        if (v2 !== "" && !isNaN(num2)) {
            const absoluteLimit = Math.abs(num2); // Limiet is altijd een positieve drempelwaarde
            if (settings.negativeLimit !== absoluteLimit) {
                settings.negativeLimit = absoluteLimit;
                hasChanged = true;
            }
            negInput.value = formatAmount0(absoluteLimit);
        } else if (v2 === "") {
            if (settings.negativeLimit !== undefined) {
                delete settings.negativeLimit;
                hasChanged = true;
            }
        }
    }

    if (hasChanged) {
        saveSettings(settings);
        if (onDataChanged) {
            window.requestAnimationFrame(() => {
                onDataChanged();
            });
        }
    }
}
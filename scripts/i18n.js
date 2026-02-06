// scripts/i18n.js
let translations = {};
let isLoaded = false;

export async function initI18n(lang = 'nl') {
    try {
        const response = await fetch(`./lang/${lang}.json`);
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        
        translations = await response.json();
        window.translations = translations; // Maak globaal voor debugging
        
        isLoaded = true;
    } catch (error) {
        console.error("FinFlow i18n Error:", error);
        isLoaded = true; 
    }
}

export function t(key, data = {}) {
  // Haal tekst op
  let text = getNestedTranslation(key); 

  // Als de tekst niet gevonden is (of gelijk aan key), stop hier
  if (text === key) return key;

  // Vervang placeholders: {year}, {month}, {amount}, etc.
  Object.keys(data).forEach((placeholder) => {
    const value = data[placeholder];
    // Gebruik een globale regex om ALLE instanties te vervangen
    text = text.toString().replace(new RegExp(`{${placeholder}}`, 'g'), value);
  });

  return text;
}

function getNestedTranslation(key) {
  const keys = key.split('.');
  // Gebruik de lokale variabele translations
  let obj = translations;
  
  for (const k of keys) {
    if (obj && obj[k] !== undefined) {
      obj = obj[k];
    } else {
      return key; // Geeft de key terug als pad niet gevonden wordt
    }
  }
  return obj;
}

export function formatCurrency(amount) {
    const currentLang = translations.languageCode || 'nl-NL';
    const config = (translations && translations.currency) ? translations.currency : {
        symbol: "€",
        precision: 2,
        format: "{symbol} {amount}"
    };

    const value = parseFloat(amount) || 0;
    const formattedAmount = value.toLocaleString(currentLang, {
        minimumFractionDigits: config.precision,
        maximumFractionDigits: config.precision
    });

    return config.format
        .replace('{symbol}', config.symbol)
        .replace('{amount}', formattedAmount);
}

export function isI18nReady() { return isLoaded; }
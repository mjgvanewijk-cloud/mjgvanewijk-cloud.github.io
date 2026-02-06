// scripts/wizard/services/recalc-chain.js
import { simulateYear, resetCaches } from "../../core/engine/index.js";
import { currentYear as uiCurrentYear, setCurrentYear } from "../../core/state/index.js";

/**
 * Doorrekent de hele ketting vanaf startYear t/m endYear (incl.)
 * na het wijzigen van startjaar/beginsaldi/limiet.
 *
 * Cruciaal: sommige engine-paden gebruiken (direct/indirect) de globale currentYear
 * voor carry-over. Daarom zetten we currentYear tijdelijk op elk jaar in de loop.
 */
export function recalcChainFromTo(startYear, endYear) {
  resetCaches();

  const startY = Number(startYear);
  const endY = Number(endYear ?? startY);

  // Fallback: kan niet rekenen
  if (!Number.isFinite(startY) || !Number.isFinite(endY)) {
    const prev = uiCurrentYear;
    try {
      setCurrentYear(startYear);
      simulateYear(startYear);
    } finally {
      setCurrentYear(prev);
    }
    return;
  }

  const prevYear = uiCurrentYear;

  try {
    if (startY <= endY) {
      for (let y = startY; y <= endY; y++) {
        setCurrentYear(y);
        simulateYear(y);
      }
    } else {
      setCurrentYear(startY);
      simulateYear(startY);
    }
  } finally {
    // altijd terugzetten naar wat de UI had
    setCurrentYear(prevYear);
  }
}

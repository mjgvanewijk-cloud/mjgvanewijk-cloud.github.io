// scripts/core/engine/index.js
// Verzamelmodule voor de modulaire rekenmotor (contract gelijk aan oude state-engine.js)

export { resetCaches, resetCachesFromYear } from "./cache.js";

// start.js exporteert géén getStartingBankBalance:
export { getUserBankStarting, getNegativeLimit } from "./start.js";

export { computeMonthTotalsFor } from "./month.js";
export { getPots, computePotBalancesUntil } from "./pots.js";

// getStartingBankBalance komt uit year.js:
export { getStartingBankBalance, computeYearEndState, simulateYear } from "./year.js";

export { updateSingleMonthValue, applyValueWithScope } from "./updates.js";

export { rebuildYearsFrom } from "./year.js";

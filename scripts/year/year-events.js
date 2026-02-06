// scripts/year/year-events.js

import { updateSavingChain } from "./year-chain.js";
import { initYearEvents, changeYear } from "./year-events-state.js";
import { attachYearTableEvents } from "./year-events-handlers.js";

// Re-exports om backward compatibility te behouden
export { 
  updateSavingChain, 
  initYearEvents, 
  changeYear, 
  attachYearTableEvents 
};
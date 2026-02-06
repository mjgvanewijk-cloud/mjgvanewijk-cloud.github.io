// scripts/year/year-events-refresh.js
import { updateSavingChain } from "./year-chain.js";
import { resetAdapterCache, getYearViewModel } from "../core/adapter.js";
import { loadSettings } from "../core/storage/index.js";
import { triggerDataChanged } from "./year-events-state.js";

export function handleTableRefresh(year) {
  updateSavingChain(year);
  if (typeof resetAdapterCache === "function") resetAdapterCache();

  const view = getYearViewModel(year);
  const settings = loadSettings() || {};
  // Banklimiet wordt pre-commit afgedwongen bij bewerken/opslaan.
  // We tonen hier geen globale popup (om dubbele UX en “door kunnen klikken” te voorkomen).

  triggerDataChanged();
}
// scripts/ui/popup/app-settings/actions.js

import { exportDataFromSettings, importData } from "../../../backup.js";
import { muteConfirmHelpAfterExport, closeHelpCloudIfAny } from "./state.js";
import { openFeedbackEmail } from "./feedback.js";

export function handleAction(act, { closeAll, showTerms, showPrivacy } = {}) {
  if (act === "backup_save") {
    closeAll?.();
    // Show ONLY the existing orange confirm sheet from exportDataFromSettings().
    // Ensure HelpCloud is muted on that confirm sheet.
    closeHelpCloudIfAny();
    try { exportDataFromSettings(); } catch (_) {}
    muteConfirmHelpAfterExport();
    return;
  }
  if (act === "backup_restore") {
    closeAll?.();
    importData();
    return;
  }
  if (act === "terms") {
    showTerms?.();
    return;
  }
  if (act === "privacy") {
    showPrivacy?.();
    return;
  }
  if (act === "feedback") {
    closeAll?.();
    openFeedbackEmail();
    return;
  }
  // placeholders: do nothing yet
}

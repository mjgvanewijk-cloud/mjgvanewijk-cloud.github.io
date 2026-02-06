// scripts/ui/popup/app-settings/index.js

import { createOverlayAndContainer, makeCloseAll, bindOverlayClose, setHelpMuted } from "./state.js";
import { renderMenu } from "./menu-render.js";
import { renderTerms } from "./terms-sheet.js";
import { renderPrivacy } from "./privacy-sheet.js";
import { handleAction } from "./actions.js";

/**
 * App-level settings menu (tandwiel rechtsboven).
 */
export function openAppSettingsSheet() {
  const { overlay, container, prevOverflow } = createOverlayAndContainer(
    "ff-all-rounded ff-app-settings-sheet"
  );

  const closeAll = makeCloseAll({ overlay, prevOverflow });
  bindOverlayClose(overlay, closeAll);

  const showMenu = () => {
    setHelpMuted(container);
    renderMenu(container, {
      onClose: closeAll,
      onAction: (act) => handleAction(act, {
        closeAll,
        showTerms,
        showPrivacy,
      }),
    });
  };

  const showTerms = () => {
    setHelpMuted(container);
    renderTerms(container, { onBack: showMenu });
  };

  const showPrivacy = () => {
    setHelpMuted(container);
    renderPrivacy(container, { onBack: showMenu });
  };

  document.body.appendChild(overlay);
  overlay.appendChild(container);

  showMenu();
}

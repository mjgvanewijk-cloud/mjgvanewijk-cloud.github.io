// scripts/ui/popup/ios-one-tap-caret.js

function isIOSDevice() {
  const ua = navigator.userAgent || "";
  const iOSUA = /iPad|iPhone|iPod/.test(ua);
  const iPadOSDesktop = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOSUA || iPadOSDesktop;
}

/**
 * iPhone/Safari fix:
 * - geen programmatic focus bij openen
 * - focus + caret binnen eerste user-gesture op het INPUT (of zijn eigen group)
 *   (NIET op de toggle-group)
 */
export function installIOSOneTapCaretFix(container) {
  if (!isIOSDevice()) return;

  const input = container.querySelector("#popupGenericInput");
  if (!input) return;

  // Pak expliciet de groep waar het input in zit (dit is niet de toggle-group).
  const inputGroup = input.closest(".ff-field-group");

  if (input.dataset.ffOneTapCaret === "1") return;
  input.dataset.ffOneTapCaret = "1";

  const ensureCaret = () => {
    try {
      input.focus({ preventScroll: true });
    } catch {
      try { input.focus(); } catch {}
    }
    try {
      const v = String(input.value ?? "");
      input.setSelectionRange(v.length, v.length);
    } catch {}
  };

  const opts = { passive: true, capture: true };

  input.addEventListener("touchstart", ensureCaret, opts);
  input.addEventListener("pointerdown", ensureCaret, opts);
  input.addEventListener("mousedown", ensureCaret, true);

  if (inputGroup) {
    inputGroup.addEventListener("touchstart", ensureCaret, opts);
    inputGroup.addEventListener("pointerdown", ensureCaret, opts);
    inputGroup.addEventListener("mousedown", ensureCaret, true);
  }
}

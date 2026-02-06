// scripts/core/state/categories-ui/save-handler-name.js
import { t } from "../../../i18n.js";
import { loadCats } from "../../storage/index.js";

export function resolveNameErrorTextNode({ root, nameErrBox }) {
  // NOTE: some sheet variants may not include the exact span id, so we fall back to
  // finding a reasonable text node inside the error box.
  return (
    root.querySelector("#catNameErrorText")
    || nameErrBox?.querySelector(".ff-inline-error__text")
    || nameErrBox?.querySelector("span")
    || null
  );
}

export function createNameErrorController({ root, ctx, nameInput, nameErrBox, nameErrTxt }) {
  const hideNameError = () => {
    if (nameErrBox) nameErrBox.style.display = "none";
    if (nameInput) nameInput.removeAttribute("aria-invalid");
  };

  // In month-card mode, the name input (and its error row) can be hidden while
  // the sheet is in "static name" view. Force edit mode so the inline name error
  // is actually visible when validation fails.
  const ensureNameEditingVisible = () => {
    const fn = root && root.__ffCatSetNameEditing;
    if (typeof fn === "function") {
      try { fn(true); } catch (_) {}
    }
  };

  // Central helper: always show the inline error *and* force name editing to be visible.
  const showNameError = (msgKey) => {
    ensureNameEditingVisible();
    if (nameErrTxt) nameErrTxt.textContent = t(msgKey);
    if (nameErrBox) nameErrBox.style.display = "flex";
    if (nameInput) nameInput.setAttribute("aria-invalid", "true");

    requestAnimationFrame(() => {
      try { nameInput.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (_) {}
      try { nameInput.focus(); } catch (_) {}
    });
  };

  // Guard: category names must be unique (incl. system 'Overig'), case/whitespace-insensitive.
  // Prevents silent merges/overwrites when user enters an existing name.
  const validateUniqueName = (newNameLower) => {
    if (ctx.isSystemOther) return null;

    const prevCatsAll = Array.isArray(loadCats()) ? loadCats() : [];
    const exists = prevCatsAll.find((c) => {
      const cn = String(c?.name || "").trim().toLowerCase();
      if (!cn) return false;
      if (cn !== newNameLower) return false;
      if (ctx.isEdit && String(ctx.cat?.name || "") === String(c?.name || "")) return false;
      return true;
    });

    return exists ? "categories.name_exists" : null;
  };

  // Voorkom dat een categorie in de andere kolom (ander type) stilletjes wordt overschreven.
  // Dit veroorzaakt dat bijvoorbeeld een income-categorie verdwijnt zodra je een expense-categorie met dezelfde naam opslaat.
  const validateCrossTypeConflict = (newNameLower, selectedType) => {
    if (ctx.isSystemOther) return null;

    const prevCatsAll = Array.isArray(loadCats()) ? loadCats() : [];
    const conflict = prevCatsAll.find((c) => {
      const cn = String(c?.name || "").trim().toLowerCase();
      if (!cn || cn !== newNameLower) return false;
      if (String(c?.name || "") === "Overig") return false;
      if (ctx.isEdit && String(ctx.cat?.name || "") === String(c?.name || "")) return false;
      const ct = String(c?.type || "expense");
      return ct !== String(selectedType || "expense");
    });

    return conflict ? "categories.name_conflict" : null;
  };

  return {
    hideNameError,
    showNameError,
    validateUniqueName,
    validateCrossTypeConflict,
  };
}

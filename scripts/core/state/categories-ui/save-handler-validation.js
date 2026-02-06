// scripts/core/state/categories-ui/save-handler-validation.js

export function validateSaveBasics({ newName, ctx, showNameError, validateUniqueName, validateCrossTypeConflict, selectedType }) {
  if (!newName) {
    showNameError("categories.name_required");
    return false;
  }

  // "Overig" is een gereserveerde systeemnaam.
  const newNameLower = newName.toLowerCase();
  if (!ctx.isSystemOther && newNameLower === "overig") {
    showNameError("categories.name_reserved_system");
    return false;
  }

  if (!ctx.isSystemOther) {
    const uniqueKey = validateUniqueName(newNameLower);
    if (uniqueKey) {
      showNameError(uniqueKey);
      return false;
    }
    
    const conflictKey = validateCrossTypeConflict(newNameLower, selectedType);
    if (conflictKey) {
      showNameError(conflictKey);
      return false;
    }
  }
  return true;
}
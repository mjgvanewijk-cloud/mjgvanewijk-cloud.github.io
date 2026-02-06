// scripts/core/state/categories-ui/commit.js
import { formatCurrency } from "../../../i18n.js";
import { setNextActionReason, buildUserReason } from "../../history/index.js";

import { upsertCategory } from "../categories-data.js";
import { handleUpsertCategoryError } from "./save-handler-upsert-errors.js";

/**
 * Stable stringify to compare category payloads deterministically.
 * Only used to avoid double persists when a delete-click already committed.
 */
export function stableStringify(obj) {
  const seen = new WeakSet();
  const norm = (v) => {
    if (v === null || typeof v !== "object") return v;
    if (seen.has(v)) return "[Circular]";
    seen.add(v);
    if (Array.isArray(v)) return v.map(norm);
    const out = {};
    Object.keys(v).sort().forEach((k) => { out[k] = norm(v[k]); });
    return out;
  };
  try {
    return JSON.stringify(norm(obj));
  } catch {
    try { return JSON.stringify(obj); } catch { return ""; }
  }
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isDifferent(a, b) {
  return Math.abs(num(a) - num(b)) > 0.0001;
}

function getYearsMap({ cat, isSystemOther, selectedType, fallbackType }) {
  if (!cat || typeof cat !== "object") return {};

  if (isSystemOther) {
    const tSel = (selectedType === "income" || selectedType === "expense")
      ? selectedType
      : (fallbackType === "income" ? "income" : "expense");
    const ybt = (cat.yearsByType && typeof cat.yearsByType === "object") ? cat.yearsByType : {};
    const m = ybt[tSel];
    return (m && typeof m === "object") ? m : {};
  }

  const y = cat.years;
  return (y && typeof y === "object") ? y : {};
}

function getDisplayName({ updatedCat, ctx, selectedType }) {
  if (ctx && ctx.isSystemOther) {
    const tSel = (selectedType === "income" || selectedType === "expense") ? selectedType : "expense";
    const lbl = String(updatedCat?.labels?.[tSel] || "").trim();
    return lbl || "Overig";
  }
  return String(updatedCat?.name || "").trim();
}

/**
 * Commit helper used by both the Save button and "Delete year" click logic.
 * Returns true on success; false when an error was handled (inline error etc.).
 */
export function commitCategoryUpdate({
  updatedCat,
  ctx,
  originalName = null,
  options = null,
  yearsContainer = null,
  saveBtn = null,
  showNameError = null,
  selectedType = null,
} = {}) {
  try {
    // Provide a clear, entity-specific Undo/Redo message.
    try {
      const type = String(updatedCat?.type || "").trim();
      const name = String(updatedCat?.name || "").trim();
      const orig = (originalName != null) ? String(originalName).trim() : null;

      // IMPORTANT (Simplified Undo/Redo):
      // The history engine only records snapshots when the nextActionReason is a
      // user-marker produced by buildUserReason() ("user|...").
      // If we set arbitrary strings here, Undo stays disabled even though data changed.
      if (!orig && name) {
        // New category created
        setNextActionReason(buildUserReason("categories.add", false));
      } else if (orig && name && orig !== name) {
        // Category renamed
        setNextActionReason(buildUserReason("categories.rename", false));
      } else if (orig && name && orig === name) {
        // Option C: explicit, user-friendly reason for manual amount edits.
        const prevCat = ctx?.cat || null;
        const prevYears = getYearsMap({
          cat: prevCat,
          isSystemOther: !!ctx?.isSystemOther,
          selectedType,
          fallbackType: type,
        });
        const nextYears = getYearsMap({
          cat: updatedCat,
          isSystemOther: !!ctx?.isSystemOther,
          selectedType,
          fallbackType: type,
        });

        const years = new Set([...Object.keys(prevYears), ...Object.keys(nextYears)]);
        const changes = [];

        for (const y0 of years) {
          const y = String(y0);
          const from = num(prevYears[y]);
          const to = num(nextYears[y]);
          if (isDifferent(from, to)) changes.push({ year: y, from, to });
        }

        if (changes.length) {
          const displayName = getDisplayName({ updatedCat, ctx, selectedType });

          // Amount edits: mergeable group (typing)
          setNextActionReason(buildUserReason("categories.commit", true));
        }
      }
    } catch (_) {}

    upsertCategory(updatedCat, originalName, options);
    return true;
  } catch (err) {
    if (handleUpsertCategoryError({ err, showNameError, yearsContainer, saveBtn })) {
      return false;
    }
    console.error(err);
    return false;
  }
}

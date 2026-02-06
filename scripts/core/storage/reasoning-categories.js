// scripts/core/storage/reasoning-categories.js
import { safeJsonParse, buildFFHReason } from "./storage-helpers-reasoning.js";

export function inferCatsReason(prevStr, nextArr) {
  const prev = prevStr ? safeJsonParse(prevStr) : null;
  const p = Array.isArray(prev) ? prev : [];
  const n = Array.isArray(nextArr) ? nextArr : [];

  const pById = new Map(p.map((c) => [String(c?.id || c?.code || c?.name || ""), c]));
  const nById = new Map(n.map((c) => [String(c?.id || c?.code || c?.name || ""), c]));

  if (n.length === p.length + 1) {
    for (const [id, c] of nById.entries()) {
      if (!pById.has(id)) return buildFFHReason("history.detail.category_added", { name: String(c?.name || "").trim() }, `cats.add.${id}`, false);
    }
  }
  if (n.length + 1 === p.length) {
    for (const [id, c] of pById.entries()) {
      if (!nById.has(id)) return buildFFHReason("history.detail.category_deleted", { name: String(c?.name || "").trim() }, `cats.del.${id}`, false);
    }
  }

  for (const [id, pc] of pById.entries()) {
    const nc = nById.get(id);
    if (nc && String(pc?.name || "").trim() !== String(nc?.name || "").trim()) {
      return buildFFHReason("history.detail.category_renamed", { old: String(pc?.name || "").trim(), new: String(nc?.name || "").trim() }, `cats.rename.${id}`, true);
    }
  }

  return buildFFHReason("history.detail.categories", {}, "cats.generic", true);
}
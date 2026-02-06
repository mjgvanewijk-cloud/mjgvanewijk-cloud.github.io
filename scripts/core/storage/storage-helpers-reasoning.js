// scripts/core/storage/storage-helpers-reasoning.js
import { t } from "../../i18n.js";

export function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export function buildFFHReason(detailKey, params = {}, group = "", merge = true) {
  const dk = String(detailKey || "").trim();
  if (!dk) return "";
  const pairs = [];
  if (params && typeof params === "object") {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      pairs.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  }
  if (group) pairs.push(`g=${encodeURIComponent(String(group))}`);
  if (merge) pairs.push(`m=1`);
  return `ffh:${dk}|${pairs.join("&")}`;
}
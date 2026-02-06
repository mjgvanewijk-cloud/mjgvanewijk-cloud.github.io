// scripts/ui/helpcloud/helpcloud-state.js

const LS_KEY = "finflow_helpcloud_v2";

export function loadState() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
}

export function saveState(s) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s || {})); } catch {}
}

export function isNode(x) {
  return x && typeof x === "object" && x.nodeType === 1; // Element
}

export function clickInside(el, target) {
  return !!(el && target && isNode(target) && (target === el || el.contains(target)));
}
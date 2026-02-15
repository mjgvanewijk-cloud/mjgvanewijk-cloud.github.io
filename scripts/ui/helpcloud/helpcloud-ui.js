// scripts/ui/helpcloud/helpcloud-ui.js

import { t } from "../../i18n.js";
import { isNode } from "./helpcloud-state.js";

export function clearHighlights() {
  document.querySelectorAll(".ff-helpcloud-highlight").forEach(el => el.classList.remove("ff-helpcloud-highlight"));
}

export function applyHighlights(targets) {
  clearHighlights();
  (targets || []).forEach(el => {
    if (isNode(el)) el.classList.add("ff-helpcloud-highlight");
  });
}

export function buildUI() {
  const bubble = document.createElement("button");
  bubble.className = "ff-helpcloud-bubble";
  bubble.type = "button";
  bubble.setAttribute("aria-label", t("helpcloud.bubble_label"));
  bubble.textContent = t("helpcloud.bubble_label");

  // We gebruiken de maximale 32-bit integer waarde voor zIndex om boven elk scherm te blijven
  const MAX_Z_INDEX = "2147483647";

  Object.assign(bubble.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "auto",
    minWidth: "max-content",
    flexShrink: "0",
    zIndex: MAX_Z_INDEX,
    pointerEvents: "auto"
  });

  const panel = document.createElement("div");
  panel.className = "ff-helpcloud-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-hidden", "true");
  
  // Panel krijgt dezelfde maximale prioriteit
  Object.assign(panel.style, {
    zIndex: MAX_Z_INDEX,
    position: "fixed" 
  });

  panel.innerHTML = `
    <div class="ff-helpcloud-panel__hdr">
      <div class="ff-helpcloud-panel__title"></div>
      <button class="ff-helpcloud-panel__close" type="button" aria-label="${t("helpcloud.close")}">✕</button>
    </div>
    <div class="ff-helpcloud-panel__body"></div>
    <div class="ff-helpcloud-panel__cta">
      <button class="ff-helpcloud-panel__btn ff-helpcloud-panel__btn--primary" type="button">${t("helpcloud.ok")}</button>
    </div>
  `;

  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  return { bubble, panel };
}

export function isSavingRateTarget(target) {
  if (!isNode(target)) return false;
  if (target.classList.contains("ff-saving-rate-input")) return true;
  const aria = String(target.getAttribute("aria-label") || "").toLowerCase();
  if (aria.includes("jaarrente")) return true;

  const row = target.closest(".ff-saving-inline-editor-row");
  if (row && row.querySelector(".ff-saving-rate-input")) return true;

  return false;
}

export function deriveTargetsFromFocus(target, ctx) {
  const out = [];
  if (!isNode(target) || !ctx) return out;

  // Always include the focused field itself
  out.push(target);

  if (ctx.id === "savingpots") {
    const wantsRate = isSavingRateTarget(target);
    let editor = target.closest(".ff-saving-inline-editor-row");

    if (!editor) {
      const candidates = Array.from(document.querySelectorAll(".ff-saving-inline-editor-row"));
      if (wantsRate) {
        editor = candidates.find(e => !!e.querySelector(".ff-saving-rate-input")) || null;
      } else {
        editor = candidates.find(e => !!e.querySelector(".ff-saving-inline-toggles")) || null;
      }
    }

    if (editor) {
      const scope =
        editor.querySelector(".ff-month-cat-scope") ||
        document.querySelector(".ff-month-category-sheet--saving .ff-month-cat-scope");
      const toggles =
        editor.querySelector(".ff-saving-inline-toggles") ||
        document.querySelector(".ff-month-category-sheet--saving .ff-saving-inline-toggles");

      if (scope) out.push(scope);
      if (!wantsRate && toggles) out.push(toggles);
    }

    return out.slice(0, 3);
  }

  return out.slice(0, 1);
}

export function deriveCtxOverrideFromFocus(ctx, target) {
  if (!ctx || ctx.id !== "savingpots") return ctx;
  const wantsRate = isSavingRateTarget(target);
  return {
    ...ctx,
    titleKey: wantsRate ? "helpcloud.ctx.savingpots_rate_focus.title" : "helpcloud.ctx.savingpots_amount_focus.title",
    bodyKey: wantsRate ? "helpcloud.ctx.savingpots_rate_focus.body" : "helpcloud.ctx.savingpots_amount_focus.body"
  };
}
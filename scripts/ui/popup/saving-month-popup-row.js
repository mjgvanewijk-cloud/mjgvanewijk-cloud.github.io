// scripts/ui/popup/saving-month-popup-row.js
import { t, formatCurrency } from "../../i18n.js";
import { parseMoneyInput } from "./money-input.js";
import { getInlineDraft, setInlineDraft, deleteInlineDraft } from "./month-category-store.js";
import { PENCIL_SVG } from "../components/icons.js";

import { balanceAmountClass, amountClassBySign, safeRadioName } from "./saving-month/row-helpers.js";
import { renderSavingEditorHTML, renderSavingRateEditorHTML, renderSavingRowHTML } from "./saving-month/row-render.js";
import { wireSavingRowInteractions, wireSavingRateInteractions } from "./saving-month/row-events.js";
import { formatRateForUI } from "./saving-month-popup-helpers.js";
import {
  getSavingAccountFlowScopeForMonth,
  inferSavingAccountFlowScopeForMonth,
  getSavingAccountRateScopeForMonth,
  inferSavingAccountRateScopeForMonth,
} from "./saving-month-store.js";

import { openEditSavingPotSheet } from "./saving-month/add-pot-sheet.js";

export function buildSavingMonthRow({ row, premiumActive, year, month }) {
  const draftType = "saving";
  const rowId = String(row?.id || "");
  const rateRowId = `rate:${rowId}`;

  const flow = Number(row.flow || 0);
  const absFlow = Math.abs(flow);

  const existingDraft = getInlineDraft(year, month, draftType, rowId);
  const draft = existingDraft && typeof existingDraft === "object" ? { ...existingDraft } : null;

  const draftValueRaw = draft && typeof draft.valueRaw === "string" ? draft.valueRaw : null;
  const isNeg = draft ? !!draft.isNeg : flow < 0;
  const persistedFlowScope = getSavingAccountFlowScopeForMonth(year, month, rowId) || null;
  const inferredFlowScope = persistedFlowScope ? persistedFlowScope : inferSavingAccountFlowScopeForMonth(year, month, rowId);
  const uiScope = draft?.scope || inferredFlowScope || "only";

  const existingRateDraft = getInlineDraft(year, month, draftType, rateRowId);
  const rateDraft = existingRateDraft && typeof existingRateDraft === "object" ? { ...existingRateDraft } : null;
  const rateDraftValueRaw = rateDraft && typeof rateDraft.valueRaw === "string" ? rateDraft.valueRaw : null;
  const persistedRateScope = getSavingAccountRateScopeForMonth(year, month, rowId) || null;
  const inferredRateScope = persistedRateScope ? persistedRateScope : inferSavingAccountRateScopeForMonth(year, month, rowId);
  const uiRateScope = rateDraft?.scope || inferredRateScope || "only";

  const balanceEnd = Number(row.balanceEnd || 0);
  const balanceClass = balanceAmountClass(balanceEnd);

  // Renderer verwacht showRealInterest al beslist
  const showRealInterest = !!premiumActive && !!row.showInterest;
  const rowForRender = { ...row, showRealInterest };

  const displayAmount =
    draftValueRaw != null && String(draftValueRaw).trim() !== "" ? String(draftValueRaw) : formatCurrency(absFlow);

  const amountClass = amountClassBySign(isNeg, parseMoneyInput(displayAmount) ?? absFlow);

  const item = document.createElement("div");
  item.className = "ff-month-cat-item";

  const group = document.createElement("div");
  group.className = "ff-month-cat-group";

  const rowEl = document.createElement("div");
  rowEl.className = "ff-month-cat-row ff-saving-row";

  const radioName = safeRadioName({ year, month, rowId });

  rowEl.innerHTML = renderSavingRowHTML({
    row: rowForRender,
    balanceClass,
    amountClass,
    displayAmount,
    pencilSvg: PENCIL_SVG,
    interestPencilSvg: PENCIL_SVG,
  });

  // Naam + potlood => open bewerken in dezelfde sheet-engine als "Spaarpot Toevoegen"
  const nameClickEl = rowEl.querySelector(".ff-saving-line-left--name");
  if (nameClickEl) {
    nameClickEl.style.cursor = "pointer";
    nameClickEl.addEventListener("click", (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      openEditSavingPotSheet({
        id: rowId,
        year,
        // mode: "rename", // <-- VERWIJDERD: naam-klik opent normaal (geen rename)
        onComplete: () => {
          try {
            document.dispatchEvent(
              new CustomEvent("ff-saving-accounts-changed", { detail: { year, month } })
            );
          } catch (_) {}
        },
      });
    });
  }

  // init label
  const flowLabelEl = rowEl.querySelector(".ff-saving-flow-label");
  if (flowLabelEl) flowLabelEl.textContent = isNeg ? t("saving_month.flow_withdraw") : t("saving_month.flow_save");

  const editor = document.createElement("div");
  editor.className = "ff-month-cat-inline-editor ff-saving-inline-editor";
  editor.setAttribute("data-open", "0");
  editor.innerHTML = renderSavingEditorHTML({ radioName });

  const rateEditor = document.createElement("div");
  rateEditor.className = "ff-month-cat-inline-editor ff-saving-inline-editor ff-saving-inline-editor--rate";
  rateEditor.setAttribute("data-open", "0");

  const rateRadioName = safeRadioName({ year, month, rowId: rateRowId });
  const rateDisplay = rateDraftValueRaw != null && String(rateDraftValueRaw).trim() !== ""
    ? String(rateDraftValueRaw)
    : formatRateForUI(Number(rowForRender?.rate || 0));

  rateEditor.innerHTML = renderSavingRateEditorHTML({ radioName: rateRadioName, displayRate: rateDisplay });

  group.appendChild(rowEl);
  group.appendChild(editor);
  group.appendChild(rateEditor);
  item.appendChild(group);

  const amountInput = rowEl.querySelector(".ff-saving-flow-input");
  const scopeRadios = editor.querySelectorAll(`input[name="${radioName}"]`);
  const btnPos = editor.querySelector('button[data-mode="pos"]');
  const btnNeg = editor.querySelector('button[data-mode="neg"]');

  const rateInput = rateEditor.querySelector(".ff-saving-rate-input");
  const rateScopeRadios = rateEditor.querySelectorAll(`input[name="${rateRadioName}"]`);

  const interestClickEl = rowEl.querySelector(".ff-saving-interest-click");
  const interestLabelEl = rowEl.querySelector(".ff-saving-interest-label");
  const interestValueEl = rowEl.querySelector(".ff-amount-interest");

  const busKey = `${year}-${month}-${draftType}`;

  const draftApi = {
    getDraft: () => getInlineDraft(year, month, draftType, rowId),
    setDraft: (patch) => {
      const cur = getInlineDraft(year, month, draftType, rowId) || {};
      setInlineDraft(year, month, draftType, rowId, { ...cur, ...patch });
    },
    deleteDraft: () => deleteInlineDraft(year, month, draftType, rowId),
  };

  const rateDraftApi = {
    getDraft: () => getInlineDraft(year, month, draftType, rateRowId),
    setDraft: (patch) => {
      const cur = getInlineDraft(year, month, draftType, rateRowId) || {};
      setInlineDraft(year, month, draftType, rateRowId, { ...cur, ...patch });
    },
    deleteDraft: () => deleteInlineDraft(year, month, draftType, rateRowId),
  };

  wireSavingRowInteractions({
    item,
    editor,
    amountInput,
    flowLabelEl,
    scopeRadios,
    btnPos,
    btnNeg,
    uiScope,
    isNegInitial: isNeg,
    absFlow,
    flowSigned: flow,
    draftApi,
    busKey,
    rowId,
  });

  wireSavingRateInteractions({
    year,
    month,
    item,
    editor: rateEditor,
    rateInput,
    scopeRadios: rateScopeRadios,
    uiScope: uiRateScope,
    rateInitial: Number(rowForRender?.rate || 0),
    draftApi: rateDraftApi,
    busKey,
    rowId: rateRowId,
    openClickEl: interestClickEl,
    interestLabelEl,
    interestValueEl,
    balanceAfterFlow: Number(rowForRender?.balanceEnd || 0),
    showRealInterest: !!rowForRender?.showRealInterest,
  });

  return item;
}

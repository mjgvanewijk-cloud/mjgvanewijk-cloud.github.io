// scripts/ui/helpcloud/contexts-targets.js

import { findClickableByTextContains, findButtonByText } from "./contexts-helpers.js";

export function pickTargetsForMonthSheet() {
  const targets = [];
  const overig = findClickableByTextContains("overig");
  const first =
    document.querySelector(".ff-month-category-sheet button, .ff-month-category-sheet [role='button']") ||
    document.querySelector(".ff-month-popup button, .ff-month-popup [role='button']") ||
    document.querySelector("td button, td [role='button']");
  if (overig) targets.push(overig);
  else if (first) targets.push(first);

  const add = findClickableByTextContains("categorie toevoegen") || findClickableByTextContains("toevoegen");
  if (add) targets.push(add);
  return targets.slice(0, 2);
}

export function pickTargetsForYear() {
  const targets = [];
  const tInc = findClickableByTextContains("totaal inkomsten");
  const tExp = findClickableByTextContains("totaal uitgaven");
  const tSav = findClickableByTextContains("eindsaldo spaarpotjes");
  if (tInc) targets.push(tInc);
  if (tExp) targets.push(tExp);
  if (tSav) targets.push(tSav);
  const firstCell = document.querySelector("[data-month-cell='true']") || document.querySelector("td button") || document.querySelector("td [role='button']");
  if (firstCell) targets.push(firstCell);
  return targets.slice(0, 3);
}

export function pickTargetsForReadOnlyYear() {
  const close = findClickableByTextContains("sluiten") || findClickableByTextContains("ok") || findClickableByTextContains("oke") || findClickableByTextContains("oké");
  return close ? [close] : [];
}

export function pickTargetsForSavingPots() {
  const targets = [];
  const add = findClickableByTextContains("toevoegen") || findButtonByText("Toevoegen");
  const edit = document.querySelector("button[aria-label*='Bewerken'], button[title*='Bewerken']") || findClickableByTextContains("bewerken");
  const rate = findClickableByTextContains("rente") || document.querySelector("[aria-label*='Jaarrente']");
  if (add) targets.push(add);
  if (edit) targets.push(edit);
  if (rate) targets.push(rate);
  return targets.slice(0, 3);
}

export function pickTargetsForSavingPotsOverview() {
  const targets = [];
  const add = findClickableByTextContains("toevoegen") || findButtonByText("Toevoegen") || findClickableByTextContains("aanmaken");
  const edit = document.querySelector("button[aria-label*='Bewerken'], button[title*='Bewerken']") || findClickableByTextContains("bewerken");
  if (add) targets.push(add);
  if (edit) targets.push(edit);
  return targets.slice(0, 2);
}

export function pickTargetsForCategories() {
  const targets = [];
  const add = findClickableByTextContains("categorie toevoegen") || findClickableByTextContains("toevoegen");
  const edit = document.querySelector("button[aria-label*='Bewerken'], button[title*='Bewerken']") || findClickableByTextContains("bewerken");
  const yearRow = document.querySelector(".cat-year-block button, .cat-year-block [role='button']");
  if (add) targets.push(add);
  if (edit) targets.push(edit);
  if (yearRow) targets.push(yearRow);
  return targets.slice(0, 3);
}

export function pickTargetsForMonthAmountEdit() {
  const targets = [];
  const input = document.querySelector("input[type='text'][inputmode], input[type='number'], textarea");
  const save = findClickableByTextContains("opslaan") || findButtonByText("Opslaan");
  const applyFrom = findClickableByTextContains("vanaf") || findClickableByTextContains("deze maand");
  if (input) targets.push(input);
  if (applyFrom) targets.push(applyFrom);
  if (save) targets.push(save);
  return targets.slice(0, 3);
}

export function pickTargetsForSavingPotEdit() {
  const targets = [];
  const nameInput = document.querySelector("input[aria-label*='naam' i]") || document.querySelector("input[placeholder*='naam' i]") || document.querySelector("input[type='text']");
  const amountInput = document.querySelector("input[aria-label*='bedrag' i]") || document.querySelector("input[inputmode='decimal']") || document.querySelector("input[inputmode='numeric']");
  const addYear = findClickableByTextContains("jaar toevoegen") || findButtonByText("+ Jaar toevoegen") || findButtonByText("Jaar toevoegen");
  if (nameInput) targets.push(nameInput);
  if (amountInput && amountInput !== nameInput) targets.push(amountInput);
  if (addYear) targets.push(addYear);
  return targets.slice(0, 3);
}

export function pickTargetsForWizardInlineSheet() {
  const targets = [];

  const input =
    document.querySelector("#wizardInlineInput") ||
    document.querySelector(".ff-wizard-inline-input");

  const save =
    document.querySelector("#wizardInlineSaveBtn") ||
    document.querySelector(".ff-wizard-inline-cta") ||
    document.querySelector("#ffWizardConfirmBtn");

  const skip =
    document.querySelector("#wizardInlineSkipBtn") ||
    document.querySelector("#ffWizardCancelBtn");

  if (input) targets.push(input);
  if (save) targets.push(save);
  if (skip) targets.push(skip);

  return targets.slice(0, 3);
}
// scripts/ui/popup/saving-month/saving-pot-ui-html.js
import { t } from "../../../i18n.js";
import { PENCIL_SVG } from "../../components/icons.js";

// Force the icon color saving row.
const penColor = "#007aff";

export function getSavingPotSheetHTML() {
  return `
    <style>
      /* 1. VOORKOM GRIJZE BALKEN: Verwijder padding van de body container */
      :is(#savingPotAddOverlay, #savingPotEditOverlay) .ff-popup__body { 
        overflow-x: hidden !important; 
        padding: 0 !important; 
      }

      /* 2. VERWIJDER SYSTEEM-LIJNEN EN LIJN BREEDTE UIT MET FOOTER */
      /* Alleen de hoofdcontainer krijgt de 16px padding die de footer ook heeft */
      :is(#savingPotAddOverlay, #savingPotEditOverlay) .ff-cat-name-row {
        padding-left: 16px !important;
        padding-right: 16px !important;
        border: none !important;           
        border-bottom: none !important;    
        box-shadow: none !important;
        background-image: none !important;
      }

      /* Binnen-containers mogen GEEN extra padding hebben, anders worden de velden smaller dan de knoppen */
      :is(#savingPotAddOverlay, #savingPotEditOverlay) #catNameInputWrap,
      :is(#savingPotAddOverlay, #savingPotEditOverlay) #catNameStatic,
      :is(#savingPotAddOverlay, #savingPotEditOverlay) #savStartWrap {
        padding-left: 0 !important;
        padding-right: 0 !important;
        border: none !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }

      /* 3. ZWARTE SECTIE: Volle breedte met eigen padding voor uitlijning */
      :is(#savingPotAddOverlay, #savingPotEditOverlay) .ff-section.ff-cat-years {
        width: 100% !important;
        padding-left: 16px !important;
        padding-right: 16px !important;
        box-sizing: border-box !important;
        background: var(--apple-bg-secondary) !important;
        /* Het hele blok (teksten + velden + verwijderen) omlaag duwen vanaf de lijn */
        margin-top: 0px !important;
      }

      /* Layout voor de rijen in de zwarte sectie */
      :is(#savingPotAddOverlay, #savingPotEditOverlay) .sav-years-columns { display: none !important; }

      /* Nieuwe layout (zoals screenshot): 3 velden op 1 rij + 3 knoppen op 1 rij */
      :is(#savingPotAddOverlay, #savingPotEditOverlay) .sav-fields-row {
        display: flex !important;
        gap: 14px !important;
        align-items: flex-end !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }

      :is(#savingPotAddOverlay, #savingPotEditOverlay) .sav-field { min-width: 0 !important; }
      :is(#savingPotAddOverlay, #savingPotEditOverlay) .sav-field-year { flex: 0 0 78px !important; }
      :is(#savingPotAddOverlay, #savingPotEditOverlay) .sav-field-amount { flex: 1 1 0 !important; }
      :is(#savingPotAddOverlay, #savingPotEditOverlay) .sav-field-rate { flex: 0 0 86px !important; }

      :is(#savingPotAddOverlay, #savingPotEditOverlay) .sav-field .cat-year-label {
        margin: 0 0 3px 0 !important;
        color: var(--apple-secondary-label, rgba(235,235,245,0.6)) !important;
        font-size: 12px !important;
        font-weight: 600 !important;
      }

      /* Labels Maandbedrag en Jaarrente dezelfde links-offset (zoals in kopie) */
      :is(#savingPotAddOverlay, #savingPotEditOverlay) .sav-field-amount .cat-year-label { margin-left: -90px !important; }
      :is(#savingPotAddOverlay, #savingPotEditOverlay) .sav-field-rate .cat-year-label { margin-left: -90px !important; }

      /* Algemene label opmaak (zoals in kopie) */
      :is(#savingPotAddOverlay, #savingPotEditOverlay) .cat-year-label {
        text-align: left !important;
        display: flex !important;
        width: 100% !important;
        padding: 0 !important;
      }

      :is(#savingPotAddOverlay, #savingPotEditOverlay) .sav-actions-row {
        display: flex !important;
        width: 100% !important;
        gap: 8px !important;
        margin-top: 10px !important;
        box-sizing: border-box !important;
      }

      :is(#savingPotAddOverlay, #savingPotEditOverlay) .sav-actions-row button {
        flex: 1 1 0 !important;
        min-width: 0 !important;
      }

      
      /* iPhone 12/13/14 (390px) - zorg dat alles binnen het kader blijft */
      @media (max-width: 400px) {
        :is(#savingPotAddOverlay, #savingPotEditOverlay) .sav-fields-row { gap: 10px !important; }
        :is(#savingPotAddOverlay, #savingPotEditOverlay) .sav-field-year { flex: 0 0 70px !important; }
        :is(#savingPotAddOverlay, #savingPotEditOverlay) .sav-field-rate { flex: 0 0 70px !important; }
      }

      /* 4. DWING ALLE INVOERVELDEN NAAR DEZELFDE HOOGTE, ZWART UITERLIJK EN BLAUWE FOCUS */
      :is(#savingPotAddOverlay, #savingPotEditOverlay) .ff-input {
        height: 44px !important;           /* Geforceerde hoogte voor alle velden */
        padding: 4px 8px !important;       /* Binnenruimte: 4px boven/onder, 8px links/rechts om invoervelden visueel gelijk te trekken */
        box-sizing: border-box !important; /* Zorgt dat padding de totale breedte en hoogte van het veld niet vergroot */
        line-height: 1.2 !important;       /* Bepaalt de teksthoogte voor een consistente verticale uitlijning in het veld */
        background-color: var(--apple-bg-main) !important; /* Binnenkant van het veld is nu zwart */
        color: var(--apple-label) !important;           /* Tekstkleur wit voor leesbaarheid op zwart */
        border: 1px solid var(--apple-separator) !important; /* Herstelt het volledige kader rondom de invoervelden */
        border-radius: 8px !important;
      }

      :is(#savingPotAddOverlay, #savingPotEditOverlay) .ff-input:focus {
        border-color: var(--apple-blue) !important;  /* Blauw kader verschijnt bij klikken in het veld */
        outline: none !important;
      }

      /* 5. NAAM EN BEGINSALDO BREEDTE GELIJK MAKEN AAN FOOTER KNOPPEN */
      :is(#savingPotAddOverlay, #savingPotEditOverlay) #catName,
      :is(#savingPotAddOverlay, #savingPotEditOverlay) #savStartBalance {
        width: 100% !important;            /* Dwingt beide velden naar de volledige beschikbare breedte */
        display: block !important;
      }

      /* TEKST VERSCHUIVING NAAR LINKS (Alleen de labels) */
      :is(#savingPotAddOverlay, #savingPotEditOverlay) #catNameStatic .ff-cat-name-row__left { margin-left: -1px !important; }   
      
      /* Beginsaldo label uitlijning (zoals in kopie) */
      :is(#savingPotAddOverlay, #savingPotEditOverlay) #savStartWrap .cat-year-label {
        margin: 0 0 3px 0 !important;
        margin-left: -90px !important;
        color: var(--apple-secondary-label, rgba(235,235,245,0.6)) !important;
        font-size: 12px !important;
        font-weight: 600 !important;
      }

      /* Verwijderen: altijd rode letters (ook disabled) */
      :is(#savingPotAddOverlay, #savingPotEditOverlay) .ff-cat-remove-btn {
        color: var(--apple-red, #ff3b30) !important;
      }
      :is(#savingPotAddOverlay, #savingPotEditOverlay) .ff-cat-remove-btn:disabled,
      :is(#savingPotAddOverlay, #savingPotEditOverlay) .ff-cat-remove-btn[disabled] {
        color: var(--apple-red, #ff3b30) !important;
        opacity: 0.35 !important;
        cursor: default !important;
      }

/* FOOTER UITLIJNING */
      :is(#savingPotAddOverlay, #savingPotEditOverlay) .ff-popup__footer { 
        padding-left: 16px !important; 
        padding-right: 16px !important; 
      }
    </style>

    <div class="ff-popup__header ff-month-category-header">
      <h2 class="ff-popup__title">${t("saving_accounts.new_title")}</h2>
    </div>

    <div class="ff-popup__body ff-month-category-body ff-cat-body" style="padding-top: 0px; padding-bottom: 0px;">
      
      <div class="ff-cat-name-row" style="--ff-month-cat-accent: var(--apple-blue); flex-direction: column; align-items: stretch; margin-bottom: 0px;">
        <div id="catNameStatic" class="ff-cat-name-row" style="--ff-month-cat-accent: ${penColor}; display: flex; cursor: pointer; border-bottom: none; padding: 0;">
          <div class="ff-cat-name-row__left" style="display:flex; align-items:center;">
            <span id="catNameStaticText" class="ff-cat-name-row__text" style="cursor: pointer;">${t("common.name")}</span>
            <button type="button" class="ff-cat-name-row__pen" id="catNameEditBtn" style="color: ${penColor};" aria-label="${t("common.edit")}">
              ${PENCIL_SVG}
            </button>
          </div>
        </div>
        <div id="catNameInputWrap" style="width:100%; margin-top:6px; padding:0; display: none;">
          <input id="catName" class="ff-input" type="text" placeholder="${t("saving_accounts.name_placeholder")}" value="">
        </div>
        <div id="catNameError" class="ff-inline-error ff-inline-error--premium" style="display:none; margin-top:10px;">
          <span class="ff-inline-error__icon">▲</span>
          <span class="ff-inline-error__text"></span>
        </div>
        <div id="savStartWrap" style="width:100%; margin-top:6px;" onclick="event.stopPropagation()">
          <div class="cat-year-label">${t("saving_accounts.start_balance_label")}</div>
          <input id="savStartBalance" class="ff-input" type="text" inputmode="decimal" placeholder="${t("common.amount_placeholder")}" value="" style="margin-top:4px;">
        </div>
        <div id="savStartError" class="ff-inline-error ff-inline-error--premium" style="display:none; margin-top:10px;">
          <span class="ff-inline-error__icon">▲</span>
          <span class="ff-inline-error__text"></span>
        </div>
      </div>

      <div class="ff-divider" style="margin-top:0px; margin-bottom: 0px;"></div>

      <div class="ff-section ff-cat-years" style="margin-top:0px; padding-top: 12px; background: var(--apple-bg-secondary); padding-bottom: 12px;">
        <div class="sav-years-columns" aria-hidden="true">
          <div class="col-year"></div>
          <div class="col-amount">
            <div class="cat-year-label" style="color: var(--apple-label); margin-bottom: 0;">${t("categories.maand_bedrag")}</div>
          </div>
          <div class="col-rate">
            <div class="cat-year-label" style="color: var(--apple-label); margin-bottom: 0;">${t("saving_accounts.interest_label")}</div>
          </div>
          <div class="col-actions"></div>
        </div>
        <div id="savYearsContainer" class="cat-years-container sav-years-container"></div>
        <script>
          (function () {
            function getYearRowCount(root) {
              // Prefer explicit year rows if present, fall back to counting year inputs
              const rows = root.querySelectorAll(".cat-year-row");
              if (rows && rows.length) return rows.length;
              const inputs = root.querySelectorAll(".cat-year-input, input[name='year']");
              return inputs ? inputs.length : 0;
            }

            function updateRemoveDisabled() {
              const container = document.getElementById("savYearsContainer");
              if (!container) return;

              const count = getYearRowCount(container);
              const disable = count < 2;

              container.querySelectorAll(".ff-cat-remove-btn").forEach((btn) => {
                if (disable) {
                  btn.disabled = true;
                  btn.setAttribute("aria-disabled", "true");
                } else {
                  btn.disabled = false;
                  btn.removeAttribute("aria-disabled");
                }
              });
            }

            // Run once after initial render
            queueMicrotask ? queueMicrotask(updateRemoveDisabled) : setTimeout(updateRemoveDisabled, 0);

            // Keep in sync if year rows are re-rendered dynamically
            const container = document.getElementById("savYearsContainer");
            if (container && window.MutationObserver) {
              const obs = new MutationObserver(updateRemoveDisabled);
              obs.observe(container, { childList: true, subtree: true });
            }
          })();
        </script>

        <div id="savRateError" class="ff-inline-error ff-inline-error--premium" style="display:none; margin-top:10px;">
          <span class="ff-inline-error__icon">▲</span>
          <span class="ff-inline-error__text"></span>
        </div>
      </div>
    </div>

    <div class="ff-popup__footer ff-month-category-footer ff-cat-footer">
      <div class="ff-cat-footer-row">
        <button type="button" id="addSavYearBtn" class="ff-btn ff-btn--primary ff-cat-add-year">+ ${t("common.add_year")}</button>
        <button type="button" id="saveSavBtn" class="ff-btn ff-btn--primary ff-cat-save">${t("common.save")}</button>
        <button type="button" id="cancelSavBtn" class="ff-btn ff-btn--secondary ff-cat-cancel">${t("common.cancel")}</button>
      </div>
    </div>
  `;
}
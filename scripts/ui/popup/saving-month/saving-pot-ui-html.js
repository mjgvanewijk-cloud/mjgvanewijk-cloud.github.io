// scripts/ui/popup/saving-month/saving-pot-ui-html.js
import { t } from "../../../i18n.js";
import { PENCIL_SVG } from "../../components/icons.js";

// Force the icon color saving row.
const penColor = "#007aff";

export function getSavingPotSheetHTML() {
  return `
    <style>
      /* 1. VOORKOM GRIJZE BALKEN: Verwijder padding van de body container */
      #savingPotAddOverlay .ff-popup__body { 
        overflow-x: hidden !important; 
        padding: 0 !important; 
      }

      /* 2. VERWIJDER SYSTEEM-LIJNEN EN LIJN BREEDTE UIT MET FOOTER */
      /* Alleen de hoofdcontainer krijgt de 16px padding die de footer ook heeft */
      #savingPotAddOverlay .ff-cat-name-row {
        padding-left: 16px !important;
        padding-right: 16px !important;
        border: none !important;           
        border-bottom: none !important;    
        box-shadow: none !important;
        background-image: none !important;
      }

      /* Binnen-containers mogen GEEN extra padding hebben, anders worden de velden smaller dan de knoppen */
      #savingPotAddOverlay #catNameInputWrap,
      #savingPotAddOverlay #catNameStatic,
      #savingPotAddOverlay #savStartWrap {
        padding-left: 0 !important;
        padding-right: 0 !important;
        border: none !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }

      /* 3. YEARS SECTION: full width with own padding for alignment */
      #savingPotAddOverlay .ff-section.ff-cat-years {
        width: 100% !important;
        padding-left: 16px !important;
        padding-right: 16px !important;
        box-sizing: border-box !important;
        background: transparent !important;
        /* Het hele blok (teksten + velden + verwijderen) omlaag duwen vanaf de lijn */
        margin-top: 0px !important;
      }

      /* Layout voor de rijen in de zwarte sectie */
      #savingPotAddOverlay .sav-years-columns,
      #savingPotAddOverlay .cat-year-row {
        display: flex !important;
        gap: 14px !important;
        align-items: center !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }

      /* VASTE BREEDTES (ongewijzigd voor stabiliteit) */
      #savingPotAddOverlay .cat-year-input, #savingPotAddOverlay .col-year { width: 65px !important; flex: 0 0 65px !important; }
      #savingPotAddOverlay .cat-budget-input, #savingPotAddOverlay .col-amount { width: 90px !important; flex: 0 0 90px !important; }
      #savingPotAddOverlay .sav-rate-input, #savingPotAddOverlay .col-rate { width: 65px !important; flex: 0 0 65px !important; }
      #savingPotAddOverlay .ff-cat-remove-btn, #savingPotAddOverlay .col-actions { width: 95px !important; flex: 0 0 95px !important; }

      /* 4. Force all inputs to same height; theme-aware colors + focus */
      #savingPotAddOverlay .ff-input {
        height: 44px !important;           /* Geforceerde hoogte voor alle velden */
        padding: 4px 8px !important;       /* Binnenruimte: 4px boven/onder, 8px links/rechts om invoervelden visueel gelijk te trekken */
        box-sizing: border-box !important; /* Zorgt dat padding de totale breedte en hoogte van het veld niet vergroot */
        line-height: 1.2 !important;       /* Bepaalt de teksthoogte voor een consistente verticale uitlijning in het veld */
        /* colors come from global theme (popup.css) */
        border-radius: 8px !important;
      }

      #savingPotAddOverlay .ff-input:focus {
        border-color: var(--apple-blue) !important;  /* Theme-aware focus color */
        outline: none !important;
      }

      /* 5. NAAM EN BEGINSALDO BREEDTE GELIJK MAKEN AAN FOOTER KNOPPEN */
      #savingPotAddOverlay #catName,
      #savingPotAddOverlay #savStartBalance {
        width: 100% !important;            /* Dwingt beide velden naar de volledige beschikbare breedte */
        display: block !important;
      }

      /* TEKST VERSCHUIVING NAAR LINKS (Alleen de labels) */
      #savingPotAddOverlay #catNameStatic .ff-cat-name-row__left { margin-left: -1px !important; }   
      
      /* Alleen de tekst "Beginsaldo" naar links schuiven */
      #savingPotAddOverlay #savStartWrap .cat-year-label { margin-left: -91px !important; }
      
      /* Het hele blok "Beginsaldo" (tekst + veld) omlaag duwen vanaf de lijn */
      #savingPotAddOverlay #savStartWrap { margin-top: 0px !important; }
      
      #savingPotAddOverlay .col-amount .cat-year-label { margin-left: -90px !important; }
      #savingPotAddOverlay .col-rate .cat-year-label { margin-left: -90px !important; }

      /* Algemene label opmaak */
      #savingPotAddOverlay .cat-year-label {
        text-align: left !important;
        display: flex !important;
        width: 100% !important;
        padding: 0 !important;
      }

      /* UITLIJNING SPAREN/OPNEMEN KNOPPEN */
      #savingPotAddOverlay .sav-toggle-row {
        display: flex !important;
        width: 100% !important;      /* Gebruik de volledige beschikbare breedte */
        gap: 8px !important;         /* Zelfde tussenruimte als de footer-knoppen */
        margin-top: 10px !important;  /* Ruimte tussen de invoervelden en de knoppen */
        box-sizing: border-box !important;
      }

      #savingPotAddOverlay .sav-toggle-row button {
        flex: 1 !important;  /* Verdeelt de ruimte exact 50/50 over de knoppen */
      }

      /* FOOTER UITLIJNING */
      #savingPotAddOverlay .ff-popup__footer { 
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

      <div class="ff-section ff-cat-years" style="margin-top:0px; padding-top: 12px; padding-bottom: 12px;">
        <div class="sav-years-columns" aria-hidden="true">
          <div class="col-year"></div>
          <div class="col-amount">
            <div class="cat-year-label" style="margin-bottom: 0;">${t("categories.maand_bedrag")}</div>
          </div>
          <div class="col-rate">
            <div class="cat-year-label" style="margin-bottom: 0;">${t("saving_accounts.interest_label")}</div>
          </div>
          <div class="col-actions"></div>
        </div>
        <div id="savYearsContainer" class="cat-years-container sav-years-container"></div>
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
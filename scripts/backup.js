// scripts/backup.js
import {
  saveCats,
  saveMonthData,
  saveSettings,
  loadCats,
  loadMonthData,
  loadSettings
} from "./core/storage.js";
import { t } from "./i18n.js";
import { openConfirmPopup } from "./ui/popup/confirm-popup.js";

export function initBackupModule(onDataChanged) {
  const attachListeners = () => {
    const exportBtn = document.getElementById("devExportBtn") || document.getElementById("exportDataBtn");
    const importBtn = document.getElementById("devImportBtn") || document.getElementById("importDataBtn");

    if (exportBtn && !exportBtn.dataset.bound) {
      exportBtn.onclick = (e) => { e.preventDefault(); exportData(); };
      exportBtn.dataset.bound = "true";
    }

    if (importBtn && !importBtn.dataset.bound) {
      importBtn.onclick = (e) => { e.preventDefault(); importData(); };
      importBtn.dataset.bound = "true";
    }
  };
  attachListeners();
  setInterval(attachListeners, 2000);
}

// Exported so Settings sheet can reuse the existing Import/Export behavior.
export async function exportData() {
  try {
    const settings = loadSettings() || {};

    // Deactiveer automatische spaarbedragen om dubbele tellingen te voorkomen
    if (settings.yearMonthlySaving) {
      Object.keys(settings.yearMonthlySaving).forEach((year) => {
        if (settings.yearMonthlySaving[year]) {
          settings.yearMonthlySaving[year].amount = 0;
        }
      });
    }

    const payload = {
      version: 1,
      generatedAt: new Date().toISOString(),
      cats: loadCats(),
      month: loadMonthData(),
      settings: settings,
    };

    const json = JSON.stringify(payload, null, 2);
    const filename = `finflow-backup-${new Date().toISOString().slice(0, 10)}.json`;

    const blob = new Blob([json], { type: "application/json" });
    const file = new File([blob], filename, { type: "application/json" });

    // iOS / Safari: probeer eerst de Delen-sheet (Files → iCloud Drive)
    if (navigator && navigator.share && navigator.canShare) {
      try {
        const can = navigator.canShare({ files: [file] });
        if (can) {
          // iOS: stuur uitsluitend het bestand mee (geen title/text), anders kan iOS een extra tekstbestand aanmaken.
          await navigator.share({ files: [file] });
          return;
        }
      } catch (_) {
        // fallback to download below
      }
    }

    // Fallback: download (iOS kan daarna handmatig naar iCloud Drive verplaatst worden)
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try { URL.revokeObjectURL(url); } catch (_) {}
      try { a.remove(); } catch (_) {}
    }, 1500);
  } catch (err) {
    console.error("exportData failed:", err);
  }
}

// Settings: toon eerst de oranje sheet (titel: iCloud-Backup) en start daarna de export.
export function exportDataFromSettings() {
  openConfirmPopup({
    title: t("backup.save_sheet.title"),
    message: `
      <div style="font-weight:700; margin:0 0 8px;">${t("backup.save_sheet.inner_title")}</div>
      <div>${t("backup.save_sheet.body")}</div>
    `,
    confirmLabel: t("backup.save_sheet.btn_continue"),
    cancelLabel: t("backup.save_sheet.btn_cancel"),
    variant: "warning",
    onConfirm: () => { exportData(); },
  });
}


// Exported so Settings sheet can reuse the existing Import/Export behavior.
export function importData() {
  const fileInput = document.getElementById("importFileInput");
  if (!fileInput) return;

  fileInput.onchange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm(t('messages.confirm_import'))) {
      fileInput.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const obj = JSON.parse(ev.target.result);
        
        if (obj.cats) saveCats(obj.cats);

        const rawMonthData = obj.month || obj.months;
        if (rawMonthData) {
          const cleanedData = {};
          for (const [mKey, mVal] of Object.entries(rawMonthData)) {
            cleanedData[mKey] = { ...mVal };

            // Alleen herberekenen als er daadwerkelijk cats aanwezig is
            const hasCats =
              mVal &&
              mVal.cats &&
              typeof mVal.cats === "object" &&
              Object.keys(mVal.cats).length > 0;

            if (hasCats) {
              let totalInc = 0;
              let totalExp = 0;

              cleanedData[mKey].cats = {};
              for (const [cName, cVal] of Object.entries(mVal.cats)) {
                const val = parseFloat(cVal) || 0;
                cleanedData[mKey].cats[cName] = val;

                const lower = String(cName || "").toLowerCase();
                if (lower.includes('salaris') || lower.includes('inkom')) {
                  totalInc += val;
                } else {
                  totalExp += val;
                }
              }

              // Alleen overschrijven als cats de bron is (premium/split)
              cleanedData[mKey]._simpleIncome = totalInc;
              cleanedData[mKey]._simpleExpense = totalExp;
            } else {
              // Geen cats: behoud wat er in de backup staat (geen overschrijven naar 0)
              if (mVal && mVal._simpleIncome !== undefined) cleanedData[mKey]._simpleIncome = mVal._simpleIncome;
              if (mVal && mVal._simpleExpense !== undefined) cleanedData[mKey]._simpleExpense = mVal._simpleExpense;
            }

            // Spaaracties overnemen
            if (mVal && mVal.savings) {
              cleanedData[mKey].savings = Array.isArray(mVal.savings) ? mVal.savings : [];
            }
          }
          saveMonthData(cleanedData);
        }

        if (obj.settings) {
          const settings = obj.settings;

          // MIGRATIE: yearStarting kan legacy spaar-beginsaldo bevatten (geen maand 1-12)
          // -> zet startmaand veilig op 1 en verplaats legacy waarde naar yearSavingStarting (als nog leeg)
          if (settings.yearStarting && typeof settings.yearStarting === "object") {
            if (!settings.yearSavingStarting || typeof settings.yearSavingStarting !== "object") {
              settings.yearSavingStarting = {};
            }

            for (const [yStr, val] of Object.entries(settings.yearStarting)) {
              const n = Number(val);
              if (Number.isFinite(n) && (n < 1 || n > 12)) {
                if (settings.yearSavingStarting[yStr] === undefined) {
                  settings.yearSavingStarting[yStr] = n;
                }
                settings.yearStarting[yStr] = 1;
              }
            }
          }

          // Zorg dat de categorie-configuratie ook wordt bijgewerkt
          if (obj.cats) {
            settings.categories = {};
            obj.cats.forEach(c => {
              if (c.name) settings.categories[c.name] = { label: c.name, type: c.type };
            });
          }

          saveSettings(settings);
        }

        alert(t('messages.import_success'));
        window.location.reload();
      } catch (err) {
        alert(t('messages.import_error'));
      }
    };
    reader.readAsText(file);
  };
  fileInput.click();
}

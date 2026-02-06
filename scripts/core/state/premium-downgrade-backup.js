// scripts/core/state/premium-downgrade-backup.js
const BACKUP_KEY = "finflow_premium_backup_v1";

export function parseYearFromMonthKey(key) {
  const y = Number(String(key || "").split("-")[0]);
  return Number.isFinite(y) ? y : null;
}

export function collectYears({ settings, monthData, cats, savingAccounts }) {
  const years = new Set();
  Object.keys(monthData || {}).forEach((k) => {
    const y = parseYearFromMonthKey(k);
    if (y) years.add(y);
  });
  ["yearStarting", "yearBankStarting", "yearSavingStarting"].forEach((field) => {
    const obj = settings?.[field];
    if (obj && typeof obj === "object") {
      Object.keys(obj).forEach((k) => {
        const y = Number(k);
        if (Number.isFinite(y)) years.add(y);
      });
    }
  });
  (cats || []).forEach((c) => {
    const yObj = c?.years;
    if (yObj && typeof yObj === "object") {
      Object.keys(yObj).forEach((k) => {
        const y = Number(k);
        if (Number.isFinite(y)) years.add(y);
      });
    }
  });
  (savingAccounts || []).forEach((a) => {
    const yObj = a?.years;
    if (yObj && typeof yObj === "object") {
      Object.keys(yObj).forEach((k) => {
        const y = Number(k);
        if (Number.isFinite(y)) years.add(y);
      });
    }
  });
  return Array.from(years).sort((a, b) => a - b);
}

export function extractPremiumBackup({ settings, cats, monthData }) {
  const monthPremium = {};
  Object.entries(monthData || {}).forEach(([k, v]) => {
    if (!v || typeof v !== "object") return;
    const hasCat = !!v._catDisplay;
    const hasSav = !!v.savingAccounts;
    if (!hasCat && !hasSav) return;
    monthPremium[k] = {
      _catDisplay: hasCat ? v._catDisplay : undefined,
      savingAccounts: hasSav ? v.savingAccounts : undefined,
    };
  });
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    settings: {
      premium: settings?.premium,
      isPremium: settings?.isPremium,
      yearSavingStarting: settings?.yearSavingStarting,
      savingAccounts: settings?.savingAccounts,
    },
    cats: cats || [],
    monthPremium,
  };
}

export function writeBackup(payload) {
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn("Premium backup could not be stored:", e);
  }
}

export function readBackup() {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === "object") ? parsed : null;
  } catch (e) {
    console.warn("Premium backup could not be read:", e);
    return null;
  }
}

export function clearBackup() {
  try { localStorage.removeItem(BACKUP_KEY); } catch (_) {}
}

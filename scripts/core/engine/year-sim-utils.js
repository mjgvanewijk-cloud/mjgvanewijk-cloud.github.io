// scripts/core/engine/year-sim-utils.js

export function round2(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

export function isPremiumActiveForEngine(settings) {
  const p = settings?.premium || {};
  if (!p || typeof p !== "object") return false;
  if (!p.active) return false;

  if (p.trialStart) {
    const t0 = new Date(p.trialStart);
    if (!Number.isFinite(t0.getTime())) return false;
    const ms = Date.now() - t0.getTime();
    const days = ms / (1000 * 60 * 60 * 24);
    return days <= 7;
  }
  return true;
}

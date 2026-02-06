// scripts/core/icloud/icloud-sync.js
// NOTE: The previous sync implementation has been removed.
// This module is kept as a minimal no-op surface to avoid stale imports.

export function isNativeIcloudAvailable() {
  return false;
}

export function hasIcloudEncryptionKey() {
  return false;
}

export function scheduleIcloudAutoSync() {
  // no-op (manual backup only)
}

export async function pushSnapshotNow() {
  return { ok: false, code: "removed" };
}

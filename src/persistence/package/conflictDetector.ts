export interface ConflictCheckResult {
  hasConflict: boolean;
  diskLastModifiedMs?: number;
}

/**
 * Compares in-memory lastModified timestamp against current disk/remote mtime.
 */
export function checkFileConflict(
  lastKnownMs: number | undefined,
  currentDiskMs: number | undefined,
): ConflictCheckResult {
  if (!lastKnownMs || !currentDiskMs) {
    return { hasConflict: false };
  }

  // Conflict if disk modification timestamp is newer by > 1000ms
  const hasConflict = currentDiskMs - lastKnownMs > 1000;
  return {
    hasConflict,
    diskLastModifiedMs: currentDiskMs,
  };
}

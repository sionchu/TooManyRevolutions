/**
 * Runtime protection for authoritative object graphs.
 *
 * This helper deliberately owns no canonical marker. Registration remains in
 * the validated persistence and simulation seams; freezing alone never makes
 * an object trusted.
 */
const completedObjects = new WeakSet<object>();
const inProgressObjects = new WeakSet<object>();

export function freezeCanonicalGraph(value: unknown): void {
  if (value === null || typeof value !== "object") {
    return;
  }

  if (completedObjects.has(value)) {
    return;
  }

  // Object.freeze() does not prevent Map.set()/Set.add(). The authoritative
  // runtime graph is intentionally plain records and arrays; fail loudly if
  // a future domain type introduces a mutable collection into this boundary.
  if (value instanceof Map || value instanceof Set) {
    throw new Error(
      "Canonical runtime state cannot contain Map or Set collections.",
    );
  }

  if (inProgressObjects.has(value)) {
    throw new Error("Canonical runtime state cannot contain object cycles.");
  }

  inProgressObjects.add(value);

  try {
    if (Array.isArray(value)) {
      for (const item of value) {
        freezeCanonicalGraph(item);
      }
    } else {
      for (const child of Object.values(value as Record<string, unknown>)) {
        freezeCanonicalGraph(child);
      }
    }

    Object.freeze(value);
    // Completion is recorded only after the whole reachable graph has been
    // protected successfully. A failed traversal can therefore be retried
    // without a stale WeakSet hit bypassing the unsupported-value check.
    completedObjects.add(value);
  } finally {
    inProgressObjects.delete(value);
  }
}

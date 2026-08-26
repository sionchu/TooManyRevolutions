import { describe, expect, it } from "vitest";

import { GAMEBUILDERS_DEMO_SCENARIO } from "../../sim/state/gameBuildersDemoScenario";
import {
  applyContentPatch,
  assertContentRegistry,
  buildContentRegistry,
  contentLengthWarning,
  parseContentPatch,
  validateContentPatch,
} from "./contentRegistry";

describe("stable content registry", () => {
  it("supports deterministic branch/variant patch round trips without runtime writes", () => {
    const records = buildContentRegistry(GAMEBUILDERS_DEMO_SCENARIO);
    assertContentRegistry(records);
    expect(new Set(records.map((record) => record.id)).size).toBe(
      records.length,
    );
    expect(
      records.some((record) => record.branchOrVariantId !== "default"),
    ).toBe(true);
    const first = records[0]!;
    const patch = parseContentPatch(
      JSON.stringify({
        version: 1,
        changes: [{ id: first.id, text: "새 초안" }],
      }),
      records,
    );
    expect(validateContentPatch(patch, records)).toEqual([]);
    expect(
      applyContentPatch(records, patch).find((record) => record.id === first.id)
        ?.text,
    ).toBe("새 초안");
    expect(
      contentLengthWarning(first, "x".repeat(first.maxRecommendedLength + 1)),
    ).not.toBeNull();
    expect(() =>
      parseContentPatch(
        JSON.stringify({ version: 1, changes: [{ id: "unknown", text: "x" }] }),
        records,
      ),
    ).toThrow("알 수 없는 content ID");
  });
});

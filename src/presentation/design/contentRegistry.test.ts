import { describe, expect, it } from "vitest";

import { GAMEBUILDERS_DEMO_SCENARIO } from "../../sim/state/gameBuildersDemoScenario";
import {
  applyContentPatch,
  assertContentRegistry,
  buildContentRegistry,
  contentLengthWarning,
  parseContentPatch,
  resolveOpeningBriefingContent,
  resolveTitleContent,
  validateContentPatch,
} from "./contentRegistry";

describe("stable content registry", () => {
  it("supports deterministic branch/variant patch round trips without runtime writes", () => {
    const records = buildContentRegistry(GAMEBUILDERS_DEMO_SCENARIO);
    assertContentRegistry(records);
    expect(new Set(records.map((record) => record.id)).size).toBe(
      records.length,
    );
    const title = resolveTitleContent(records);
    const briefing = resolveOpeningBriefingContent(records);
    expect(title.koTitle).toBe("내 왕국에 혁명이 너무 많다");
    expect(title.hook.length).toBeGreaterThan(0);
    expect(briefing.beats).toHaveLength(4);
    expect(
      briefing.beats.every((beat) => beat.titleId.includes("briefing")),
    ).toBe(true);
    expect(
      records
        .filter(
          (record) => record.screen === "title" || record.screen === "briefing",
        )
        .every((record) => record.id.startsWith("tmr.copy.")),
    ).toBe(true);
    expect(
      records.some((record) => record.branchOrVariantId !== "default"),
    ).toBe(true);
    for (const category of [
      "event",
      "agenda",
      "project",
      "country",
      "faction",
      "region",
      "outcome",
    ] as const) {
      expect(records.some((record) => record.category === category)).toBe(true);
    }
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

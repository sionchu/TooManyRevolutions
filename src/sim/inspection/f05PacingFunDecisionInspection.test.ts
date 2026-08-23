import { describe, expect, it } from "vitest";

import {
  F05_CONTEXTS,
  F05_HORIZON_YEARS,
  F05_STRATEGY_IDS,
  runF05Inspection,
} from "./f05PacingFunDecision";

describe("F05 headless pacing and fun decision", () => {
  it("measures representative and neighboring contexts without changing balance", () => {
    const report = runF05Inspection();
    console.log(report.output);
    const result = report.result;

    expect(result.horizonYears).toBe(F05_HORIZON_YEARS);
    expect(result.contexts).toHaveLength(F05_CONTEXTS.length);
    expect(
      result.contexts.filter((context) => context.context.primary),
    ).toHaveLength(3);
    expect(result.adjacentTiming).toHaveLength(3);
    expect(result.recommendation).toMatch(/^(PASS|PASS_WITH_NOTES|NOT_READY)$/);
    expect(result.accommodationClassification).toMatch(
      /^(NOT_DOMINANT|CONDITIONALLY_STRONG|DOMINANCE_CANDIDATE|CLEARLY_DOMINANT)$/,
    );

    for (const context of result.contexts) {
      expect(context.branches).toHaveLength(
        Object.keys(F05_STRATEGY_IDS).length,
      );
      expect(context.start.absoluteTick).toBe(context.context.checkpointTick);
      expect(context.waitClassification).toMatch(
        /^(WAIT_WORSE|TRADEOFF|WAIT_WEAKLY_DOMINANT|WAIT_STRONGLY_DOMINANT)$/,
      );
      for (const strategyId of Object.values(F05_STRATEGY_IDS)) {
        const branch = context.branches.find(
          (candidate) => candidate.strategyId === strategyId,
        );
        expect(branch, `${context.context.id}/${strategyId}`).toBeDefined();
        expect(branch!.horizonYears).toBe(F05_HORIZON_YEARS);
        expect(branch!.yearlyArc.length).toBeGreaterThanOrEqual(2);
        expect(branch!.decisionSamples.length).toBeGreaterThanOrEqual(1);
      }
    }

    expect(report.output).toContain("F05 HEADLESS PACING / FUN DECISION");
    expect(report.output).toContain(
      `F05 RECOMMENDATION: ${result.recommendation}`,
    );
  }, 120_000);
});

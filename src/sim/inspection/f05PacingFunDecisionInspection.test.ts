import { describe, expect, it } from "vitest";

import {
  F05_CONTEXTS,
  F05_AGENDA_SAMPLE_DAYS,
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
    expect(result.factionActorLoop).toBe("on");
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
        expect(branch!.agendaSamples.length).toBeGreaterThanOrEqual(
          Math.floor(branch!.executedTicks / F05_AGENDA_SAMPLE_DAYS),
        );
      }
    }

    expect(result.silenceDiagnosis).toBe("MIXED_GAP");
    const actorBranches = result.contexts.flatMap(
      (context) => context.branches,
    );
    expect(
      actorBranches.some((branch) => branch.factionStrategyChanges > 0),
    ).toBe(true);
    expect(
      actorBranches.every((branch) =>
        branch.eventClusters.every(
          (cluster) => !cluster.eventTypes.includes("FACTION_STRATEGY_CHANGED"),
        ),
      ),
    ).toBe(true);
    expect(result.repairedReassessmentSilence.maximumDays).toBeLessThan(
      result.previousMajorEventSilence.maximumDays,
    );

    const recovery = result.contexts.find(
      (context) =>
        context.context.primary &&
        context.context.family === "ACTIVE_CONFLICT_RECOVERY",
    )!;
    const recoveryWait = recovery.branches.find(
      (branch) => branch.strategyId === F05_STRATEGY_IDS.wait,
    )!;
    const recoveryAccommodation = recovery.branches.find(
      (branch) => branch.strategyId === F05_STRATEGY_IDS.politicalAccommodation,
    )!;
    expect(recovery.waitClassification).toBe("TRADEOFF");
    expect(recovery.meaningfulResponseCount).toBeGreaterThanOrEqual(2);
    expect(recoveryAccommodation.actionStrength).toBe("MEANINGFUL_TRADEOFF");
    expect(recoveryAccommodation.benefitsVersusWait).toContain(
      "time before critical rebellion pressure",
    );
    expect(recoveryAccommodation.tradeoffsVersusWait).toContain("treasury");
    expect(
      recoveryAccommodation.firstCriticalRebellionAgendaRelativeTick,
    ).toBeGreaterThan(
      recoveryWait.firstCriticalRebellionAgendaRelativeTick ?? 0,
    );
    expect(recoveryAccommodation.final.controlledLandHexes).toBe(
      recoveryWait.final.controlledLandHexes,
    );
    expect(recoveryAccommodation.final.activeConflicts).toBe(
      recoveryWait.final.activeConflicts,
    );

    expect(report.output).toContain("F05 HEADLESS PACING / FUN DECISION");
    expect(report.output).toContain(
      `F05 RECOMMENDATION: ${result.recommendation}`,
    );
  }, 120_000);
});

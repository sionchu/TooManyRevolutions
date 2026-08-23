import { describe, expect, it } from "vitest";

import { createT023StateDissolutionScenario } from "../state/stateDissolutionFixture";
import { createT021RebellionScenario } from "../state/conflictFixture";
import {
  getF02SurveyDeterministicSignature,
  runF02Survey,
} from "./f02MultiSeedOutcomeSurvey";

describe("F02 multi-seed outcome survey", () => {
  it("produces a deterministic small survey", () => {
    const scenario = createT021RebellionScenario();
    const first = runF02Survey(scenario, [0, 1, 2], 2);
    const second = runF02Survey(scenario, [0, 1, 2], 2);

    expect(getF02SurveyDeterministicSignature(first)).toBe(
      getF02SurveyDeterministicSignature(second),
    );
    expect(first.seedResults.map((result) => result.summary.seed)).toEqual([
      0, 1, 2,
    ]);
    expect(
      first.seedResults.every(
        (result) =>
          result.summary.performance.executedTicks === 720 &&
          result.summary.terminal.outcome === "active",
      ),
    ).toBe(true);
  });

  it("is independent of seed execution order and previous runs", () => {
    const scenario = createT021RebellionScenario();
    const ordered = runF02Survey(scenario, [0, 1, 2], 2);
    const reversed = runF02Survey(scenario, [2, 1, 0], 2);
    const isolated = runF02Survey(scenario, [1], 2);

    expect(getF02SurveyDeterministicSignature(ordered)).toBe(
      getF02SurveyDeterministicSignature(reversed),
    );
    expect(getF02SurveyDeterministicSignature(isolated)).toBe(
      getF02SurveyDeterministicSignature(runF02Survey(scenario, [1], 2)),
    );
    expect(
      ordered.seedResults.find((result) => result.summary.seed === 1)
        ?.exactHistorySignature,
    ).toBe(isolated.seedResults[0]?.exactHistorySignature);
  });

  it("calculates aggregate outcome and activity distributions", () => {
    const result = runF02Survey(createT021RebellionScenario(), [0, 1, 2], 2);
    const outcomeTotal =
      result.outcomes.active +
      result.outcomes.orderConsolidated +
      result.outcomes.stateDissolved;

    expect(outcomeTotal).toBe(3);
    expect(result.outcomes).toEqual({
      active: 3,
      orderConsolidated: 0,
      stateDissolved: 0,
    });
    expect(result.politicalActivity.rebellions.min).toBeLessThanOrEqual(
      result.politicalActivity.rebellions.median,
    );
    expect(result.politicalActivity.rebellions.median).toBeLessThanOrEqual(
      result.politicalActivity.rebellions.max,
    );
    expect(result.history.largestCoarseCluster.count).toBe(3);
  });

  it("does not mutate the scenario or introduce gameplay state", () => {
    const scenario = createT021RebellionScenario();
    const before = JSON.stringify(scenario);

    runF02Survey(scenario, [0], 2);

    expect(JSON.stringify(scenario)).toBe(before);
  });

  it("stops a terminal seed before the requested horizon", () => {
    const base = createT023StateDissolutionScenario();
    const terminalScenario = {
      ...base,
      dissolutionCriteria: {
        ...base.dissolutionCriteria,
        stateContinuityAtOrBelow: 100,
      },
    };
    const result = runF02Survey(terminalScenario, [0], 2);
    const seed = result.seedResults[0];

    expect(seed?.summary.terminal.outcome).toBe("stateDissolved");
    expect(seed?.summary.performance.executedTicks).toBeLessThan(720);
    expect(result.outcomes.stateDissolved).toBe(1);
    expect(result.terminalYears.count).toBe(1);
  });
});

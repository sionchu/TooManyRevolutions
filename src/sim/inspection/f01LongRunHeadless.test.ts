import { describe, expect, it } from "vitest";

import {
  compareF01PersistenceResume,
  F01_DAYS_PER_YEAR,
  F01_SUPPORTED_HORIZONS,
  getLongRunDeterministicSignature,
  runF01LongRun,
} from "./f01LongRunHeadless";
import { createT021RebellionScenario } from "../state/conflictFixture";
import { createT022OrderConsolidationScenario } from "../state/orderConsolidationFixture";

describe("F01 long-run headless harness", () => {
  it("uses the authoritative calendar and produces a deterministic WAIT summary", () => {
    const scenario = createT021RebellionScenario();
    const config = {
      scenario,
      seed: 40101,
      years: 1,
      inputPolicy: "WAIT" as const,
    };
    const first = runF01LongRun(config);
    const second = runF01LongRun(config);

    expect(F01_SUPPORTED_HORIZONS).toEqual([5, 10, 20, 40]);
    expect(F01_DAYS_PER_YEAR).toBe(360);
    expect(first.performance.requestedTicks).toBe(360);
    expect(first.performance.executedTicks).toBe(360);
    expect(getLongRunDeterministicSignature(first)).toBe(
      getLongRunDeterministicSignature(second),
    );
    expect(first.actionRecordCount).toBe(0);
    expect(first.rejectedActionCount).toBe(0);
    expect(first.invariantFailures).toEqual([]);
  });

  it("stops at the terminal outcome without issuing extra ticks", () => {
    const scenario = createT022OrderConsolidationScenario();
    const summary = runF01LongRun({
      scenario,
      seed: 40102,
      years: 5,
      inputPolicy: "WAIT",
    });

    expect(summary.terminal.outcome).toBe("orderConsolidated");
    expect(summary.terminal.tick).toBe(3);
    expect(summary.performance.executedTicks).toBe(3);
    expect(summary.eventStoreSize).toBe(summary.eventCount);
  });

  it("keeps checkpoint telemetry outside the authoritative world", () => {
    const scenario = createT021RebellionScenario();
    const scenarioBefore = JSON.stringify(scenario);
    const summary = runF01LongRun({
      scenario,
      seed: 40103,
      years: 1,
      inputPolicy: "WAIT",
    });

    expect(JSON.stringify(scenario)).toBe(scenarioBefore);
    expect(summary.checkpoints.length).toBeGreaterThan(0);
    expect(summary.checkpoints[0]).not.toHaveProperty("world");
    expect(summary.checkpoints[0]).not.toHaveProperty("landHexStates");
  });

  it("preserves the authoritative result across a JSON save/load midpoint resume", () => {
    const scenario = createT021RebellionScenario();
    const comparison = compareF01PersistenceResume(
      { scenario, seed: 40104, years: 2, inputPolicy: "WAIT" },
      1,
    );

    expect(comparison.midpointTick).toBe(360);
    expect(comparison.continuousFinalTick).toBe(720);
    expect(comparison.resumedFinalTick).toBe(720);
    expect(comparison.equivalent).toBe(true);
  });
});

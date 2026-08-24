import { describe, expect, it } from "vitest";

import {
  F05_FIX6_BRANCHES,
  runF05Fix6PoliticalInteraction,
} from "./f05Fix6PoliticalInteraction";

describe("F05_FIX6 political interaction inspection", () => {
  it("holds the four controlled branches to one seed and reports a meaningful ACCEPT path", () => {
    const result = runF05Fix6PoliticalInteraction();

    expect(result.branches.map((branch) => branch.branch)).toEqual(
      F05_FIX6_BRANCHES,
    );
    expect(result.seed).toBe(56006);
    expect(result.rejectPreservesStatusQuo).toBe(true);
    expect(result.ignorePreservesStatusQuo).toBe(true);
    expect(result.acceptMeaningfulDownstreamChange).toBe(true);
    expect(result.acceptDifferenceUsesExistingIntervention).toBe(true);
    expect(result.persistenceReplayEquivalent).toBe(true);
    expect(result.landHexUnchangedByKernel).toBe(true);
    expect(result.pass).toBe(true);
  });
});

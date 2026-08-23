import { describe, expect, it } from "vitest";

import { runF05Fix2StateContinuityReview } from "./f05Fix2StateContinuityReview";

describe("F05_FIX2_R state continuity architecture probe", () => {
  it("proves the current writer's countdown, ratchet, exclusions, and transition seam", () => {
    const report = runF05Fix2StateContinuityReview();

    console.log(report.output);
    expect(report.allPassed).toBe(true);
    expect(report.countdown.map((entry) => entry.terminalTick)).toEqual([
      700, 350, 70,
    ]);
    expect(report.countdown.every((entry) => entry.politicalPrefixStable)).toBe(
      true,
    );
    expect(report.ratchet).toMatchObject({
      continuityAfterInitialDisplacement: 97,
      recoveredCountryLandHexes: 1,
      continuityAfterLegitimateRecovery: 97,
      continuityAfterSecondDisplacement: 96,
      secondDisplacementOutcome: "active",
      restorationObserved: false,
    });
    expect(report.exclusions).toEqual({
      internalRebellionContinuityAfterBoundary: 99,
      foreignOccupationContinuityAfterBoundary: 100,
      coupOnlyContinuityAfterBoundary: 100,
    });
    expect(report.governmentTransition).toMatchObject({
      countryIdPreserved: true,
      governmentChanged: true,
      landHexStatePreserved: true,
      runOutcomeRemainsActive: true,
      eventType: "GOVERNMENT_TRANSITIONED",
    });
  });
});

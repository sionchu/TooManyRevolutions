import { describe, expect, it } from "vitest";

import {
  F04D_STRATEGY_IDS,
  runF04DInspection,
} from "./f04dInstitutionActionCounterfactuals";

describe("F04D institution/action counterfactual inspection", () => {
  it("proves legal action gating and meaningful downstream political branching", () => {
    const report = runF04DInspection();
    console.log(report.output);
    const result = report.result;
    const institution = result.institutionComparison;
    const response = (strategyId: string) => {
      const branch = result.responses.find(
        (candidate) => candidate.strategyId === strategyId,
      );
      if (branch === undefined) {
        throw new Error(`Missing F04D response ${strategyId}.`);
      }
      return branch;
    };
    const wait = response(F04D_STRATEGY_IDS.wait);
    const material = response(F04D_STRATEGY_IDS.materialRelief);
    const accommodation = response(F04D_STRATEGY_IDS.politicalAccommodation);
    const legalization = response(F04D_STRATEGY_IDS.oppositionLegalization);
    const coercion = response(F04D_STRATEGY_IDS.coerciveRestriction);

    expect(result.responses).toHaveLength(5);
    expect(result.pass).toBe(true);
    expect(institution.actionAvailabilityDiffers).toBe(true);
    expect(institution.downstreamTrajectoryDiffers).toBe(true);
    expect(institution.bannedBargainAvailable).toBe(false);
    expect(institution.pluralBargainAvailable).toBe(true);
    expect(institution.bannedLegalizationFeasible).toBe(true);
    expect(institution.pluralLegalizationFeasible).toBe(false);
    expect(institution.banned.treasuryStart).toBe(
      institution.plural.treasuryStart,
    );
    expect(institution.banned.rebellionStart).toEqual(
      institution.plural.rebellionStart,
    );

    expect(wait.crisisEvents[0]).toContain("REBELLION_STARTED@19");
    expect(material.crisisEvents[0]).toContain("REBELLION_STARTED@20");
    expect(material.industrialScarcityFinal).toBeLessThan(
      wait.industrialScarcityFinal,
    );
    expect(material.rebellionAtCompletion?.organization).toBe(
      material.rebellionStart.organization,
    );

    expect(accommodation.rebellionAtCompletion?.grievance).toBeLessThan(
      accommodation.rebellionStart.grievance,
    );
    expect(accommodation.rebellionAtCompletion?.organization).toBe(
      accommodation.rebellionStart.organization,
    );
    expect(accommodation.finalPoliticalCompetition).toBe("restricted");
    expect(accommodation.crisisEvents[0]).toContain("@300");

    expect(legalization.finalPoliticalCompetition).toBe("plural");
    expect(legalization.ruleChanges).toContain(
      "politicalCompetition:restricted→plural",
    );
    expect(legalization.rebellionAtCompletion?.organization).toBe(
      legalization.rebellionStart.organization,
    );
    expect(legalization.crisisEvents[0]).toContain("COUP_ATTEMPT_STARTED@13");
    expect(legalization.governmentEvents).toEqual([]);

    expect(coercion.finalPoliticalCompetition).toBe("banned");
    expect(coercion.finalPressFreedom).toBe("censored");
    expect(coercion.rebellionAtCompletion?.organization).toBeLessThan(
      coercion.rebellionStart.organization,
    );
    expect(coercion.rebellionFinal.organization).toBeGreaterThan(
      coercion.rebellionAtCompletion!.organization,
    );
    expect(coercion.rebellionFinal.grievance).toBeGreaterThan(
      coercion.rebellionStart.grievance,
    );
    expect(coercion.crisisEvents[0]).toContain("REBELLION_STARTED@120");

    expect(result.meaningfulTrajectoryDivergence).toBe(true);
    expect(result.divergentResponseCount).toBeGreaterThanOrEqual(2);
    expect(result.persistenceReplayEquivalent).toBe(true);
    expect(result.insertionOrderEquivalent).toBe(true);
    expect(result.exploitRecheck).toMatchObject({
      waitDominance: "NOT_OBSERVED",
      cheapPermanentGateShutoff: "NOT_OBSERVED",
      oneWayRatchet: "NOT_OBSERVED",
      timingCliff: "NOT_OBSERVED",
      meaninglessRepeat: "BLOCKED_OR_PAID",
      interventionSpam: "CAPACITY_BOUNDED",
    });
    expect(report.output).toContain("F04D RESULT: PASS");
  }, 30_000);
});

import { describe, expect, it } from "vitest";

import {
  F04D_R1_SELECTED_POLITICAL_ACCOMMODATION_ORGANIZATION_DELTA,
  createF04DValidationScenario,
} from "../state/gate1fValidationFixture";
import { F05_CONTEXTS } from "./f05PacingFunDecision";
import {
  formatGate1FR1Sweep,
  inspectGate1FR1RepeatedAccommodationExploit,
  runGate1FR1CounterfactualSweep,
  verifyGate1FR1CanonicalRecoveryPath,
} from "./gate1fR1RecoveryRepair";
import { runGate1FDiagnosisV2 } from "./gate1fDiagnosisV2";

describe("Gate1F R1 recovery repair", () => {
  it("selects the smallest bounded effect with canonical recovery leverage", () => {
    const sweep = runGate1FR1CounterfactualSweep();
    console.log(formatGate1FR1Sweep(sweep));

    expect(sweep.candidates).toHaveLength(19);
    expect(sweep.selectedOrganizationDelta).toBe(
      F04D_R1_SELECTED_POLITICAL_ACCOMMODATION_ORGANIZATION_DELTA,
    );
    expect(sweep.selectedByRule).toBe("PREFERRED_COUNTRY_RECOVERY");
    expect(
      sweep.candidates.find((candidate) => candidate.organizationDelta === null)
        ?.structuralRecoveryByDay360,
    ).toBe(false);
    expect(
      sweep.candidates.find((candidate) => candidate.organizationDelta === -0.2)
        ?.structuralRecoveryByDay360,
    ).toBe(true);
    expect(
      sweep.candidates.find(
        (candidate) => candidate.organizationDelta === -0.49,
      )?.countryRecoveryEventByDay360,
    ).toBe(false);
    expect(
      sweep.candidates.find((candidate) => candidate.organizationDelta === -0.5)
        ?.countryRecoveryEventByDay360,
    ).toBe(true);

    const canonical = verifyGate1FR1CanonicalRecoveryPath(
      sweep.selectedOrganizationDelta,
    );
    expect(canonical.firstCompletionRelativeTick).toBe(8);
    expect(canonical.firstRecoveryRelativeTick).toBe(9);
    expect(canonical.firstRecoveryIntentReason).toBe("governmentRecovery");
    expect(canonical.firstRecoveryIntentTargetHexId).toBe(
      "ideology-fixture.industrial-hex",
    );
    expect(canonical.firstRecoveryActingStrength).toBeCloseTo(27.5);
    expect(canonical.firstRecoveryOpposingStrength).toBeCloseTo(22);
    expect(canonical.directControllerMutationAtCompletion).toBe(false);

    const scenario = createF04DValidationScenario();
    const accommodation =
      scenario.interventionCatalog[
        "gate1f.f04d.political-accommodation" as keyof typeof scenario.interventionCatalog
      ];
    expect(accommodation?.completionEffects).toEqual([
      {
        kind: "factionGrievanceDelta",
        factionId: "t018.fixture.rebellion-faction",
        delta: -0.25,
      },
      {
        kind: "factionOrganizationDelta",
        factionId: "t018.fixture.rebellion-faction",
        delta: -0.5,
      },
    ]);
  }, 240_000);

  it("remeasures all 36 branches and bounds repeated accommodation", () => {
    const result = runGate1FDiagnosisV2();
    expect(result.branches).toHaveLength(F05_CONTEXTS.length * 6);
    expect(result.baselineReproduced).toBe(true);
    expect(result.baselineComparison.comparedBranchCount).toBe(36);
    expect(result.baselineComparison.trajectorySignatureMismatches).toEqual([]);
    expect(result.baselineComparison.actionCountMismatches).toEqual([]);
    expect(result.baselineComparison.silenceMismatches).toEqual([]);

    const recovery = result.recoveryChoiceMatrix;
    const wait = recovery.find((row) => row.strategyId === "WAIT")!;
    const accommodation = recovery.find(
      (row) => row.strategyId === "POLITICAL_ACCOMMODATION",
    )!;
    expect(accommodation.actions).toEqual({
      attempts: 1,
      starts: 1,
      completions: 1,
      rejections: 0,
    });
    expect(
      accommodation.day360.checkpoint.controller.playerControlledLandHexes,
    ).toBe(3);
    expect(wait.day360.checkpoint.controller.playerControlledLandHexes).toBe(0);
    expect(accommodation.classification).toBe("USEFUL_TRADEOFF");

    const repeated = inspectGate1FR1RepeatedAccommodationExploit(result);
    expect(repeated.repeated).toMatchObject({
      attempts: 20,
      starts: 20,
      completions: 20,
      rejections: 0,
      nominalTreasuryCost: 1400,
      nominalAdministrativeCommitmentDays: 4900,
    });
    expect(repeated.single).toMatchObject({
      attempts: 1,
      starts: 1,
      completions: 1,
      rejections: 0,
      nominalTreasuryCost: 70,
      nominalAdministrativeCommitmentDays: 245,
    });
    expect(repeated.repeatedRecoveryRelativeTicks).toEqual([9, 16, 23]);
    expect(repeated.maximumLandHexChangesAtOneResolutionTick).toBe(1);

    for (const contextId of [
      "ACTIVE_CONFLICT_RECOVERY_T180",
      "ACTIVE_CONFLICT_RECOVERY_T181",
    ]) {
      const branch = result.branches.find(
        (candidate) =>
          candidate.contextId === contextId &&
          candidate.strategyId === "POLITICAL_ACCOMMODATION",
      )!;
      expect(branch.actions.starts).toBe(1);
      expect(branch.actions.completions).toBe(1);
      expect(
        branch.meaningfulEventTrace.some((entry) =>
          entry.includes(":LAND_HEX_CONTROL_CHANGED:"),
        ),
      ).toBe(true);
    }
  }, 240_000);
});

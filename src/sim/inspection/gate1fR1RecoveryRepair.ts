import {
  createF03StartingRecord,
  runF03StrategyFromRecord,
} from "./f03InterventionCounterfactuals";
import type { GameEvent } from "../events/event";
import { deriveConflictIntents } from "../systems/conflictResolution";
import {
  createF04DValidationScenario,
  F04D_R1_SELECTED_POLITICAL_ACCOMMODATION_ORGANIZATION_DELTA,
  F04D_VALIDATION_INTERVENTION_IDS,
} from "../state/gate1fValidationFixture";
import type { F05StrategyId } from "./f05PacingFunDecision";
import {
  GATE1F_RECONVERGENCE_CHECKPOINTS,
  runGate1FDiagnosisV2,
  type Gate1FBranchMeasurement,
  type Gate1FDiagnosisV2Result,
} from "./gate1fDiagnosisV2";

export const R1_COUNTERFACTUAL_ORGANIZATION_DELTAS = [
  null,
  -0.05,
  -0.1,
  -0.15,
  -0.2,
  -0.25,
  -0.3,
  -0.35,
  -0.4,
  -0.41,
  -0.42,
  -0.43,
  -0.44,
  -0.45,
  -0.46,
  -0.47,
  -0.48,
  -0.49,
  -0.5,
] as const satisfies readonly (number | null)[];

export const R1_RECOVERY_CONTEXT_ID = "ACTIVE_CONFLICT_RECOVERY_T180";

export interface Gate1FR1SweepRow {
  readonly organizationDelta: number | null;
  readonly feasibleAtStart: boolean;
  readonly starts: number;
  readonly completions: number;
  readonly day360OrganizationDeltaVersusWait: number;
  readonly day360GrievanceDeltaVersusWait: number;
  readonly day360PlayerLandHexDeltaVersusWait: number;
  readonly day360ActiveConflictDeltaVersusWait: number;
  readonly countryRecoveryEventByDay360: boolean;
  readonly structuralRecoveryByDay360: boolean;
  readonly recoveryIntentCandidate: boolean;
}

export interface Gate1FR1SweepResult {
  readonly seed: number;
  readonly contextId: string;
  readonly candidates: readonly Gate1FR1SweepRow[];
  readonly selectedOrganizationDelta: number;
  readonly selectedByRule: "PREFERRED_COUNTRY_RECOVERY" | "WEAKER_STRUCTURAL";
}

export interface Gate1FR1CanonicalRecoverySummary {
  readonly diagnosis: Gate1FDiagnosisV2Result;
  readonly wait: Gate1FBranchMeasurement;
  readonly accommodation: Gate1FBranchMeasurement;
  readonly accommodationDay360OrganizationDeltaVersusWait: number;
  readonly accommodationDay360GrievanceDeltaVersusWait: number;
  readonly accommodationDay360PlayerLandHexDeltaVersusWait: number;
  readonly accommodationDay360ActiveConflictDeltaVersusWait: number;
  readonly countryRecoveryEventByDay360: boolean;
  readonly directControllerMutationByCompletion: boolean;
}

export interface Gate1FR1CanonicalIntentEvidence {
  readonly startTick: number;
  readonly firstCompletionRelativeTick: number;
  readonly firstRecoveryRelativeTick: number | null;
  readonly firstRecoveryIntentReason: string | null;
  readonly firstRecoveryIntentTargetHexId: string | null;
  readonly firstRecoveryActingStrength: number | null;
  readonly firstRecoveryOpposingStrength: number | null;
  readonly directControllerMutationAtCompletion: boolean;
}

export interface Gate1FR1RepeatedAccommodationExploitCheck {
  readonly single: {
    readonly attempts: number;
    readonly starts: number;
    readonly completions: number;
    readonly rejections: number;
    readonly nominalTreasuryCost: number;
    readonly nominalAdministrativeCommitmentDays: number;
  };
  readonly repeated: {
    readonly attempts: number;
    readonly starts: number;
    readonly completions: number;
    readonly rejections: number;
    readonly nominalTreasuryCost: number;
    readonly nominalAdministrativeCommitmentDays: number;
  };
  readonly singleRecoveryRelativeTicks: readonly number[];
  readonly repeatedRecoveryRelativeTicks: readonly number[];
  readonly repeatedPostCompletionAvailabilityReasons: readonly string[];
  readonly repeatedBlockedByInstitutionalPrerequisite: boolean;
  readonly maximumLandHexChangesAtOneResolutionTick: number;
}

function branchAt(
  diagnosis: Gate1FDiagnosisV2Result,
  strategyId: F05StrategyId,
): Gate1FBranchMeasurement {
  const branch = diagnosis.branches.find(
    (candidate) => candidate.strategyId === strategyId,
  );
  if (branch === undefined) {
    throw new Error(`R1 branch ${strategyId} is missing.`);
  }
  return branch;
}

function checkpointAt(branch: Gate1FBranchMeasurement, relativeTick: number) {
  const checkpoint = branch.checkpoints.find(
    (candidate) => candidate.targetRelativeTick === relativeTick,
  );
  if (checkpoint === undefined) {
    throw new Error(
      `R1 branch ${branch.strategyId} is missing checkpoint ${relativeTick}.`,
    );
  }
  return checkpoint;
}

function countryRecoveryEventByDay(
  branch: Gate1FBranchMeasurement,
  relativeTick: number,
): boolean {
  return branch.meaningfulEventTrace.some((entry) => {
    const [tickText, eventType] = entry.split(":", 2);
    return (
      Number(tickText) > 0 &&
      Number(tickText) <= relativeTick &&
      eventType === "LAND_HEX_CONTROL_CHANGED"
    );
  });
}

function compareRecoveryBranches(
  diagnosis: Gate1FDiagnosisV2Result,
): Omit<
  Gate1FR1SweepRow,
  "organizationDelta" | "feasibleAtStart" | "starts" | "completions"
> {
  const wait = branchAt(diagnosis, "WAIT");
  const accommodation = branchAt(diagnosis, "POLITICAL_ACCOMMODATION");
  const wait360 = checkpointAt(wait, 360).metrics;
  const accommodation360 = checkpointAt(accommodation, 360).metrics;
  const day360OrganizationDeltaVersusWait =
    accommodation360.factionOrganization - wait360.factionOrganization;
  const day360GrievanceDeltaVersusWait =
    accommodation360.factionGrievance - wait360.factionGrievance;
  const day360PlayerLandHexDeltaVersusWait =
    accommodation360.controlledLandHexes - wait360.controlledLandHexes;
  const day360ActiveConflictDeltaVersusWait =
    accommodation360.activeConflicts - wait360.activeConflicts;
  const countryRecoveryEventByDay360 = countryRecoveryEventByDay(
    accommodation,
    360,
  );
  const structuralRecoveryByDay360 =
    countryRecoveryEventByDay360 ||
    day360PlayerLandHexDeltaVersusWait > 0 ||
    day360ActiveConflictDeltaVersusWait < 0 ||
    day360OrganizationDeltaVersusWait < -1e-6;

  return {
    day360OrganizationDeltaVersusWait,
    day360GrievanceDeltaVersusWait,
    day360PlayerLandHexDeltaVersusWait,
    day360ActiveConflictDeltaVersusWait,
    countryRecoveryEventByDay360,
    structuralRecoveryByDay360,
    recoveryIntentCandidate: countryRecoveryEventByDay360,
  };
}

export function runGate1FR1Counterfactual(
  organizationDelta: number | null,
  seed: number = 40103,
): Gate1FR1CanonicalRecoverySummary {
  const scenario = createF04DValidationScenario({
    politicalAccommodationOrganizationDelta: organizationDelta,
  });
  const diagnosis = runGate1FDiagnosisV2(seed, {
    contextIds: [R1_RECOVERY_CONTEXT_ID],
    compareExistingBaseline: false,
    scenario,
  });
  const accommodation = branchAt(diagnosis, "POLITICAL_ACCOMMODATION");
  const wait = branchAt(diagnosis, "WAIT");
  const comparison = compareRecoveryBranches(diagnosis);
  const completionTicks = accommodation.meaningfulEventTrace
    .filter((entry) => entry.split(":", 2)[1] === "INTERVENTION_COMPLETED")
    .map((entry) => Number(entry.split(":", 1)[0]))
    .filter((tick) => tick > 0);
  const completionEvents = completionTicks.length;
  const firstCompletionTick = Math.min(...completionTicks);
  const controllerChangesDuringCompletion =
    accommodation.meaningfulEventTrace.some((entry) => {
      const [tickText, eventType] = entry.split(":", 2);
      return (
        Number(tickText) === firstCompletionTick &&
        eventType === "LAND_HEX_CONTROL_CHANGED"
      );
    });

  if (completionEvents === 0) {
    throw new Error(
      "R1 accommodation did not complete through the canonical path.",
    );
  }

  return {
    diagnosis,
    wait,
    accommodation,
    accommodationDay360OrganizationDeltaVersusWait:
      comparison.day360OrganizationDeltaVersusWait,
    accommodationDay360GrievanceDeltaVersusWait:
      comparison.day360GrievanceDeltaVersusWait,
    accommodationDay360PlayerLandHexDeltaVersusWait:
      comparison.day360PlayerLandHexDeltaVersusWait,
    accommodationDay360ActiveConflictDeltaVersusWait:
      comparison.day360ActiveConflictDeltaVersusWait,
    countryRecoveryEventByDay360: comparison.countryRecoveryEventByDay360,
    directControllerMutationByCompletion: controllerChangesDuringCompletion,
  };
}

export function runGate1FR1CounterfactualSweep(
  seed: number = 40103,
): Gate1FR1SweepResult {
  const candidates = R1_COUNTERFACTUAL_ORGANIZATION_DELTAS.map(
    (organizationDelta) => {
      const summary = runGate1FR1Counterfactual(organizationDelta, seed);
      const row = summary.accommodation;
      const comparison = compareRecoveryBranches(summary.diagnosis);
      return {
        organizationDelta,
        feasibleAtStart: row.feasibleAtStart,
        starts: row.actions.starts,
        completions: row.actions.completions,
        ...comparison,
      } satisfies Gate1FR1SweepRow;
    },
  );

  const preferred = candidates.find(
    (candidate) =>
      candidate.organizationDelta !== null &&
      candidate.feasibleAtStart &&
      candidate.starts === 1 &&
      candidate.completions === 1 &&
      candidate.recoveryIntentCandidate,
  );
  const weaker = candidates.find(
    (candidate) =>
      candidate.organizationDelta !== null &&
      candidate.feasibleAtStart &&
      candidate.starts === 1 &&
      candidate.completions === 1 &&
      candidate.structuralRecoveryByDay360,
  );
  const selected = preferred ?? weaker;
  if (selected === undefined || selected.organizationDelta === null) {
    throw new Error("R1 bounded sweep found no eligible recovery effect.");
  }

  return {
    seed,
    contextId: R1_RECOVERY_CONTEXT_ID,
    candidates,
    selectedOrganizationDelta: selected.organizationDelta,
    selectedByRule:
      preferred === undefined
        ? "WEAKER_STRUCTURAL"
        : "PREFERRED_COUNTRY_RECOVERY",
  };
}

export function runGate1FR1CanonicalRecovery(
  seed: number = 40103,
): Gate1FR1CanonicalRecoverySummary {
  const selected = F04D_R1_SELECTED_POLITICAL_ACCOMMODATION_ORGANIZATION_DELTA;
  if (selected === null) {
    throw new Error("R1 canonical effect has not been selected.");
  }
  const summary = runGate1FR1Counterfactual(selected, seed);
  const sweep = runGate1FR1CounterfactualSweep(seed);
  if (sweep.selectedOrganizationDelta !== selected) {
    throw new Error(
      `R1 selected effect ${selected} does not match sweep selection ${sweep.selectedOrganizationDelta}.`,
    );
  }
  return summary;
}

function eventRelativeTick(event: GameEvent, startTick: number): number {
  return event.tick - startTick;
}

export function verifyGate1FR1CanonicalRecoveryPath(
  organizationDelta: number,
  seed: number = 40103,
): Gate1FR1CanonicalIntentEvidence {
  const scenario = createF04DValidationScenario({
    politicalAccommodationOrganizationDelta: organizationDelta,
  });
  const startingRecord = createF03StartingRecord(scenario, seed, 180);
  const observations: {
    readonly relativeTick: number;
    readonly world: Parameters<typeof deriveConflictIntents>[1];
  }[] = [];
  const run = runF03StrategyFromRecord(
    scenario,
    R1_RECOVERY_CONTEXT_ID,
    "POLITICAL_ACCOMMODATION",
    startingRecord,
    5,
    ({ relativeTick }) =>
      relativeTick === 0
        ? F04D_VALIDATION_INTERVENTION_IDS.politicalAccommodation
        : null,
    {
      checkpointOffsets: [0, 360, 1_800],
      factionActorLoop: "on",
      onObservation: ({ relativeTick, world }) => {
        observations.push({ relativeTick, world });
      },
    },
  );
  const startTick = startingRecord.world.tick;
  const completionEvents = run.stepEvents.filter(
    (event) => event.type === "INTERVENTION_COMPLETED",
  );
  const firstCompletionEvent = completionEvents[0];
  if (firstCompletionEvent === undefined) {
    throw new Error("R1 canonical recovery path did not complete.");
  }
  const recoveryEvent = run.stepEvents.find(
    (event) =>
      event.type === "LAND_HEX_CONTROL_CHANGED" &&
      eventRelativeTick(event, startTick) <= 360,
  );
  let recoveryIntent: ReturnType<typeof deriveConflictIntents>[number] | null =
    null;
  if (recoveryEvent !== undefined) {
    const recoveryRelativeTick = eventRelativeTick(recoveryEvent, startTick);
    const preResolution = observations.find(
      (observation) => observation.relativeTick === recoveryRelativeTick - 1,
    );
    if (preResolution !== undefined) {
      recoveryIntent =
        deriveConflictIntents(scenario, preResolution.world).find(
          (intent) => intent.reason === "governmentRecovery",
        ) ?? null;
    }
  }
  const directControllerMutationAtCompletion = run.stepEvents.some(
    (event) =>
      event.type === "LAND_HEX_CONTROL_CHANGED" &&
      event.tick === firstCompletionEvent.tick,
  );

  return {
    startTick,
    firstCompletionRelativeTick: eventRelativeTick(
      firstCompletionEvent,
      startTick,
    ),
    firstRecoveryRelativeTick:
      recoveryEvent === undefined
        ? null
        : eventRelativeTick(recoveryEvent, startTick),
    firstRecoveryIntentReason: recoveryIntent?.reason ?? null,
    firstRecoveryIntentTargetHexId:
      recoveryIntent === null ? null : String(recoveryIntent.targetHexId),
    firstRecoveryActingStrength:
      recoveryIntent === null ? null : recoveryIntent.actingStrength.strength,
    firstRecoveryOpposingStrength:
      recoveryIntent === null ? null : recoveryIntent.opposingStrength.strength,
    directControllerMutationAtCompletion,
  };
}

function accommodationCostSummary(branch: Gate1FBranchMeasurement) {
  const definition = branch.definition;
  if (definition === null) {
    throw new Error(
      `R1 accommodation branch ${branch.strategyId} has no definition.`,
    );
  }
  return {
    attempts: branch.actions.attempts,
    starts: branch.actions.starts,
    completions: branch.actions.completions,
    rejections: branch.actions.rejections,
    nominalTreasuryCost: branch.actions.starts * definition.treasuryCost,
    nominalAdministrativeCommitmentDays:
      branch.actions.starts *
      definition.administrativeLoad *
      definition.durationDays,
  };
}

export function inspectGate1FR1RepeatedAccommodationExploit(
  diagnosis: Gate1FDiagnosisV2Result,
): Gate1FR1RepeatedAccommodationExploitCheck {
  const recoveryBranches = diagnosis.branches.filter(
    (branch) => branch.contextId === R1_RECOVERY_CONTEXT_ID,
  );
  const single = recoveryBranches.find(
    (branch) => branch.strategyId === "POLITICAL_ACCOMMODATION",
  );
  const repeated = recoveryBranches.find(
    (branch) => branch.strategyId === "REPEATED_POLITICAL_ACCOMMODATION",
  );
  if (single === undefined || repeated === undefined) {
    throw new Error("R1 recovery branches are not from the required context.");
  }

  const changesByTick = new Map<number, number>();
  const recoveryRelativeTicks = (branch: Gate1FBranchMeasurement) =>
    branch.meaningfulEventTrace
      .flatMap((entry) => {
        const [tickText, eventType] = entry.split(":", 2);
        return eventType === "LAND_HEX_CONTROL_CHANGED"
          ? [Number(tickText)]
          : [];
      })
      .filter((tick) => Number.isFinite(tick));
  const singleRecoveryRelativeTicks = recoveryRelativeTicks(single);
  const repeatedRecoveryRelativeTicks = recoveryRelativeTicks(repeated);
  for (const tick of repeatedRecoveryRelativeTicks) {
    changesByTick.set(tick, (changesByTick.get(tick) ?? 0) + 1);
  }
  const firstCompletionRelativeTick = repeated.meaningfulEventTrace
    .filter((entry) => entry.split(":", 2)[1] === "INTERVENTION_COMPLETED")
    .map((entry) => Number(entry.split(":", 1)[0]))
    .find((tick) => tick > 0);
  if (firstCompletionRelativeTick === undefined) {
    throw new Error("R1 repeated accommodation did not complete once.");
  }
  const postCompletionReasons = [
    ...new Set(
      repeated.availabilitySamples
        .filter((sample) => sample.relativeTick > firstCompletionRelativeTick)
        .flatMap((sample) => sample.reasons["POLITICAL_ACCOMMODATION"] ?? []),
    ),
  ];
  const repeatedBlockedByInstitutionalPrerequisite =
    repeated.availabilitySamples.some(
      (sample) =>
        sample.relativeTick > firstCompletionRelativeTick &&
        !sample.feasibleResponses.includes("POLITICAL_ACCOMMODATION") &&
        (sample.reasons["POLITICAL_ACCOMMODATION"] ?? []).includes(
          "PREREQUISITE_NOT_MET",
        ),
    );

  return {
    single: accommodationCostSummary(single),
    repeated: accommodationCostSummary(repeated),
    singleRecoveryRelativeTicks,
    repeatedRecoveryRelativeTicks,
    repeatedPostCompletionAvailabilityReasons: postCompletionReasons,
    repeatedBlockedByInstitutionalPrerequisite,
    maximumLandHexChangesAtOneResolutionTick: Math.max(
      ...changesByTick.values(),
      0,
    ),
  };
}

export function formatGate1FR1Repeatability(
  diagnosis: Gate1FDiagnosisV2Result,
  check: Gate1FR1RepeatedAccommodationExploitCheck = inspectGate1FR1RepeatedAccommodationExploit(
    diagnosis,
  ),
): string {
  const repeated = diagnosis.branches.find(
    (branch) =>
      branch.contextId === R1_RECOVERY_CONTEXT_ID &&
      branch.strategyId === "REPEATED_POLITICAL_ACCOMMODATION",
  );
  if (repeated === undefined) {
    throw new Error("R1 repeated accommodation branch is missing.");
  }
  const checkpointRows = [180, 360, 720, 1_080, 1_800].map((target) => {
    const checkpoint = repeated.checkpoints.find(
      (candidate) => candidate.targetRelativeTick === target,
    );
    if (checkpoint === undefined) {
      throw new Error(`R1 repeated branch is missing checkpoint ${target}.`);
    }
    const metrics = checkpoint.metrics;
    return `${target}:H=${metrics.controlledLandHexes} C=${metrics.activeConflicts} T=${metrics.treasury.toFixed(0)} I=${metrics.instability.toFixed(3)} U=${metrics.maxRegionUnrest.toFixed(3)} S=${metrics.maxRegionScarcity.toFixed(3)} G=${metrics.factionGrievance.toFixed(3)} O=${metrics.factionOrganization.toFixed(3)} labor=${checkpoint.institution.laborOrganization}`;
  });
  return [
    `repeat single=${check.single.attempts}/${check.single.starts}/${check.single.completions}/${check.single.rejections} repeated=${check.repeated.attempts}/${check.repeated.starts}/${check.repeated.completions}/${check.repeated.rejections}`,
    `repeat cost single=${check.single.nominalTreasuryCost}/${check.single.nominalAdministrativeCommitmentDays} repeated=${check.repeated.nominalTreasuryCost}/${check.repeated.nominalAdministrativeCommitmentDays}`,
    `repeat post-completion reasons=${check.repeatedPostCompletionAvailabilityReasons.join(",") || "none"} institutionalPrerequisite=${check.repeatedBlockedByInstitutionalPrerequisite ? "YES" : "NO"}`,
    `recovery ticks single=${check.singleRecoveryRelativeTicks.join(",") || "none"} repeated=${check.repeatedRecoveryRelativeTicks.join(",") || "none"} maxLandHexChangesAtOneResolutionTick=${check.maximumLandHexChangesAtOneResolutionTick}`,
    `repeat checkpoints ${checkpointRows.join(" | ")}`,
  ].join("\n");
}

export function formatGate1FR1Sweep(result: Gate1FR1SweepResult): string {
  const lines = [
    `R1 bounded sweep seed=${result.seed} context=${result.contextId}`,
    "| organization delta | feasible | starts/completions | Δ organization@360 | Δ grievance@360 | Δ player Hex@360 | Δ conflicts@360 | recovery event <=360 | structural recovery |",
    "| ---: | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |",
  ];
  for (const candidate of result.candidates) {
    lines.push(
      `| ${candidate.organizationDelta === null ? "baseline" : candidate.organizationDelta.toFixed(2)} | ${candidate.feasibleAtStart ? "YES" : "NO"} | ${candidate.starts}/${candidate.completions} | ${candidate.day360OrganizationDeltaVersusWait.toFixed(3)} | ${candidate.day360GrievanceDeltaVersusWait.toFixed(3)} | ${candidate.day360PlayerLandHexDeltaVersusWait} | ${candidate.day360ActiveConflictDeltaVersusWait} | ${candidate.countryRecoveryEventByDay360 ? "YES" : "NO"} | ${candidate.structuralRecoveryByDay360 ? "YES" : "NO"} |`,
    );
  }
  lines.push(
    `selected=${result.selectedOrganizationDelta.toFixed(2)} rule=${result.selectedByRule}`,
  );
  return lines.join("\n");
}

export function formatGate1FR1Reconvergence(
  diagnosis: Gate1FDiagnosisV2Result,
): string {
  return diagnosis.reconvergence
    .flatMap((context) =>
      context.checkpoints
        .filter((checkpoint) =>
          GATE1F_RECONVERGENCE_CHECKPOINTS.includes(
            checkpoint.relativeTick as (typeof GATE1F_RECONVERGENCE_CHECKPOINTS)[number],
          ),
        )
        .map((checkpoint) => {
          const accommodation = checkpoint.branches.find(
            (branch) => branch.strategyId === "POLITICAL_ACCOMMODATION",
          );
          return `${context.contextId}@${checkpoint.relativeTick}: ${accommodation?.differingDimensions.join(",") || "none"}`;
        }),
    )
    .join("; ");
}

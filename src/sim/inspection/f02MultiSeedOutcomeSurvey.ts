import { createT021RebellionScenario } from "../state/conflictFixture";
import type { ScenarioDefinition } from "../state/scenario";
import {
  F01_DAYS_PER_YEAR,
  runF01LongRun,
  runF01LongRunAsync,
  type LongRunPoliticalEvent,
  type LongRunSummary,
  type LongRunTerritorialChange,
} from "./f01LongRunHeadless";

export const F02_HORIZON_YEARS = 40 as const;

/** Stable developer sample; includes the original F01 baseline seed. */
export const F02_DEFAULT_SEEDS: readonly number[] = Object.freeze([
  ...Array.from({ length: 23 }, (_, index) => index),
  40101,
]);

export type F02ConcernCode =
  | "NO_OUTCOME_REACHED"
  | "LOW_POLITICAL_ACTIVITY"
  | "LOW_HISTORY_DIVERSITY"
  | "HIGH_ZERO_TERRITORY_PERSISTENCE"
  | "ECONOMIC_STASIS"
  | "GOVERNMENT_STASIS"
  | "TERRITORIAL_PING_PONG"
  | "LONG_SILENT_INTERVALS"
  | "EVENT_SPAM_CANDIDATE"
  | "NO_CONSOLIDATION_REACHED"
  | "DISSOLUTION_NOT_REACHED";

export interface F02NumericDistribution {
  readonly min: number;
  readonly median: number;
  readonly max: number;
  readonly zeroCount: number;
}

export interface F02TerminalYearDistribution {
  readonly count: number;
  readonly min: number | null;
  readonly median: number | null;
  readonly max: number | null;
}

export interface F02SeedSurveyResult {
  readonly summary: LongRunSummary;
  readonly exactHistorySignature: string;
  readonly coarseHistorySignature: string;
  readonly concerns: readonly F02ConcernCode[];
  readonly longestPoliticalSilenceTicks: number;
  readonly territorialPingPongCount: number;
}

export interface F02OutcomeCounts {
  readonly active: number;
  readonly orderConsolidated: number;
  readonly stateDissolved: number;
}

export interface F02PoliticalActivitySummary {
  readonly rebellions: F02NumericDistribution;
  readonly coups: F02NumericDistribution;
  readonly civilWars: F02NumericDistribution;
  readonly governmentTransitions: F02NumericDistribution;
  readonly territorialChanges: F02NumericDistribution;
  readonly consolidationAttempts: F02NumericDistribution;
  readonly stateDissolutions: F02NumericDistribution;
  readonly zeroRebellionSeeds: number;
  readonly zeroCoupSeeds: number;
  readonly zeroCivilWarSeeds: number;
  readonly zeroGovernmentTransitionSeeds: number;
}

export interface F02StateDynamicsSummary {
  readonly treasuryUnchangedSeeds: number;
  readonly stateCapacityUnchangedSeeds: number;
  readonly treasuryRange: readonly [number, number];
  readonly stateCapacityRange: readonly [number, number];
  readonly instabilityPeakRange: readonly [number, number];
  readonly factionOrganizationStartRange: readonly [number, number];
  readonly factionOrganizationPeakRange: readonly [number, number];
  readonly factionOrganizationFinalRange: readonly [number, number];
  readonly crisisParticipatingFactionRange: readonly [number, number];
  readonly stateContinuityMinimum: F02NumericDistribution;
  readonly zeroTerritoryReachedSeeds: number;
  readonly zeroTerritoryRecoveredSeeds: number;
  readonly zeroTerritoryFinalActiveSeeds: number;
  readonly zeroTerritoryDurationTicks: F02NumericDistribution;
  readonly instabilityRecoveredSeeds: number;
}

export interface F02HistoryCluster {
  readonly seeds: readonly number[];
  readonly count: number;
}

export interface F02HistoryDiversitySummary {
  readonly uniqueExactSignatures: number;
  readonly uniqueCoarseSignatures: number;
  readonly largestExactCluster: F02HistoryCluster;
  readonly largestCoarseCluster: F02HistoryCluster;
  readonly exactDuplicateSeedCount: number;
  readonly coarseDuplicateSeedCount: number;
  readonly seedSensitive: boolean;
}

export interface F02ConsolidationSummary {
  readonly everEligibleSeeds: number;
  readonly maximumStreak: F02NumericDistribution;
  readonly reachedVictorySeeds: number;
  readonly dissolutionThreshold: number;
  readonly minimumStateContinuity: F02NumericDistribution;
  readonly reachedDissolutionSeeds: number;
}

export interface F02PacingSummary {
  readonly longestPoliticalSilenceYears: F02NumericDistribution;
  readonly politicallyInactiveSeeds: number;
  readonly eventSpamCandidateSeeds: number;
  readonly territorialPingPongSeeds: number;
}

export interface F02RepresentativeSeeds {
  readonly active: number | null;
  readonly boring: number | null;
  readonly volatile: number | null;
  readonly recovery: number | null;
  readonly terminal: number | null;
  readonly largestCluster: number | null;
}

export interface F02SurveyResult {
  readonly scenarioId: string;
  readonly scenarioVersion: number;
  readonly inputPolicy: "WAIT";
  readonly horizonYears: number;
  readonly seeds: readonly number[];
  readonly totalRequestedTicks: number;
  readonly totalExecutedTicks: number;
  readonly wallClockMilliseconds: number;
  readonly ticksPerSecond: number;
  readonly seedResults: readonly F02SeedSurveyResult[];
  readonly outcomes: F02OutcomeCounts;
  readonly terminalYears: F02TerminalYearDistribution;
  readonly politicalActivity: F02PoliticalActivitySummary;
  readonly history: F02HistoryDiversitySummary;
  readonly state: F02StateDynamicsSummary;
  readonly consolidation: F02ConsolidationSummary;
  readonly pacing: F02PacingSummary;
  readonly concerns: readonly F02ConcernCode[];
  readonly representatives: F02RepresentativeSeeds;
  readonly deterministicSignature: string;
}

export interface F02InspectionReport {
  readonly result: F02SurveyResult;
  readonly allPassed: boolean;
  readonly output: string;
}

const F02_STASIS_YEARS = 20;
const F02_PING_PONG_CANDIDATE_COUNT = 3;

function compareNumbers(first: number, second: number): number {
  return first - second;
}

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function assertF02Config(
  scenario: ScenarioDefinition,
  seeds: readonly number[],
  horizonYears: number,
): void {
  if (scenario.playerCountryId === null) {
    throw new Error("F02 requires a scenario with a player CountryId.");
  }

  if (
    !Number.isInteger(horizonYears) ||
    horizonYears <= 0 ||
    horizonYears > F02_HORIZON_YEARS
  ) {
    throw new Error(
      "F02 supports a positive horizon up to 40 simulated years.",
    );
  }

  if (seeds.length === 0) {
    throw new Error("F02 requires at least one deterministic seed.");
  }

  const seen = new Set<number>();
  for (const seed of seeds) {
    if (!Number.isSafeInteger(seed)) {
      throw new Error("F02 seeds must be safe integers.");
    }

    if (seen.has(seed)) {
      throw new Error(`F02 seed ${seed} is repeated.`);
    }
    seen.add(seed);
  }
}

function sortedUniqueSeeds(seeds: readonly number[]): readonly number[] {
  return [...seeds].sort(compareNumbers);
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort(compareNumbers);
  if (sorted.length === 0) {
    throw new Error("F02 cannot calculate a distribution without values.");
  }

  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1]! + sorted[middle]!) / 2
    : sorted[middle]!;
}

function distribution(values: readonly number[]): F02NumericDistribution {
  if (values.length === 0) {
    throw new Error("F02 cannot calculate a distribution without values.");
  }

  return {
    min: Math.min(...values),
    median: median(values),
    max: Math.max(...values),
    zeroCount: values.filter((value) => value === 0).length,
  };
}

function range(values: readonly number[]): readonly [number, number] {
  if (values.length === 0) {
    throw new Error("F02 cannot calculate a range without values.");
  }

  return [Math.min(...values), Math.max(...values)];
}

function bucket(value: number, width: number): number {
  return Math.round(value / width);
}

function eventKey(event: LongRunPoliticalEvent): string {
  return `${event.type}:${event.targetId ?? "none"}`;
}

function longestPoliticalSilenceTicks(summary: LongRunSummary): number {
  const eventTicks = [
    0,
    ...summary.politicalEvents.map((event) => event.tick),
    summary.performance.executedTicks,
  ].sort(compareNumbers);

  let longest = 0;
  for (let index = 1; index < eventTicks.length; index += 1) {
    longest = Math.max(longest, eventTicks[index]! - eventTicks[index - 1]!);
  }
  return longest;
}

function territorialPingPongCount(summary: LongRunSummary): number {
  const changesByHex = new Map<string, LongRunTerritorialChange[]>();

  for (const change of summary.territorialChanges) {
    const changes = changesByHex.get(change.landHexId) ?? [];
    changes.push(change);
    changesByHex.set(change.landHexId, changes);
  }

  let count = 0;
  for (const changes of changesByHex.values()) {
    for (let index = 1; index < changes.length; index += 1) {
      const previous = changes[index - 1]!;
      const current = changes[index]!;
      if (
        previous.previousController === current.nextController &&
        previous.nextController === current.previousController
      ) {
        count += 1;
      }
    }
  }

  return count;
}

function hasRepeatedPoliticalEvent(summary: LongRunSummary): boolean {
  const counts = new Map<string, number>();
  for (const event of summary.politicalEvents) {
    const key = eventKey(event);
    const next = (counts.get(key) ?? 0) + 1;
    if (next >= 3) {
      return true;
    }
    counts.set(key, next);
  }
  return false;
}

function deriveSeedConcerns(
  summary: LongRunSummary,
  silenceTicks: number,
  pingPongCount: number,
): readonly F02ConcernCode[] {
  const concerns = new Set<F02ConcernCode>();
  const politicalEventCount = summary.politicalEvents.length;
  const politicalStasis =
    summary.performance.requestedYears >= F02_STASIS_YEARS &&
    politicalEventCount <= 1 &&
    summary.events.governmentTransitions === 0;

  if (summary.terminal.outcome === "active") {
    concerns.add("NO_OUTCOME_REACHED");
  }
  if (politicalStasis) {
    concerns.add("LOW_POLITICAL_ACTIVITY");
  }
  if (
    summary.state.startingTreasury === summary.state.minimumTreasury &&
    summary.state.startingTreasury === summary.state.maximumTreasury &&
    summary.state.startingStateCapacity ===
      summary.state.minimumStateCapacity &&
    summary.state.startingStateCapacity === summary.state.maximumStateCapacity
  ) {
    concerns.add("ECONOMIC_STASIS");
  }
  if (
    summary.performance.requestedYears >= F02_STASIS_YEARS &&
    summary.events.governmentTransitions === 0
  ) {
    concerns.add("GOVERNMENT_STASIS");
  }
  if (
    summary.state.zeroControlledLandHexReachedTick !== null &&
    summary.state.zeroControlledLandHexRecoveryTick === null &&
    summary.terminal.outcome === "active"
  ) {
    concerns.add("HIGH_ZERO_TERRITORY_PERSISTENCE");
  }
  if (silenceTicks >= F02_STASIS_YEARS * F01_DAYS_PER_YEAR) {
    concerns.add("LONG_SILENT_INTERVALS");
  }
  if (pingPongCount >= F02_PING_PONG_CANDIDATE_COUNT) {
    concerns.add("TERRITORIAL_PING_PONG");
  }
  if (hasRepeatedPoliticalEvent(summary)) {
    concerns.add("EVENT_SPAM_CANDIDATE");
  }
  if (summary.state.maximumConsolidationStreak === 0) {
    concerns.add("NO_CONSOLIDATION_REACHED");
  }
  if (summary.events.stateDissolutions === 0) {
    concerns.add("DISSOLUTION_NOT_REACHED");
  }

  return [...concerns].sort(compareStableText);
}

function createHistorySignatures(summary: LongRunSummary): {
  readonly exact: string;
  readonly coarse: string;
} {
  const exact = JSON.stringify({
    terminal: summary.terminal,
    events: summary.events,
    politicalEvents: summary.politicalEvents,
    territorialChanges: summary.territorialChanges,
    governmentTransitionSequence: summary.governmentTransitionSequence,
    checkpoints: summary.checkpoints,
    state: summary.state,
  });

  const coarse = JSON.stringify({
    terminal: {
      outcome: summary.terminal.outcome,
      simulatedYear:
        summary.terminal.simulatedYear === null
          ? null
          : bucket(summary.terminal.simulatedYear, 1),
    },
    events: summary.events,
    politicalEvents: summary.politicalEvents.map((event) => ({
      year: Math.floor(event.tick / F01_DAYS_PER_YEAR),
      type: event.type,
      targetId: event.targetId,
    })),
    governmentTransitionSequence: summary.governmentTransitionSequence,
    checkpoints: summary.checkpoints.map((checkpoint) => ({
      year: checkpoint.simulatedYear,
      government: checkpoint.currentGovernmentId,
      controlledLandHexes: checkpoint.controlledLandHexes,
      activeConflicts: checkpoint.activeConflicts,
      activeCivilWars: checkpoint.activeCivilWars,
      instability: bucket(checkpoint.instability, 5),
      treasury: bucket(checkpoint.treasury, 10),
      stateCapacity: bucket(checkpoint.stateCapacity, 5),
      stateContinuity: bucket(checkpoint.stateContinuity, 5),
      consolidationStreak: bucket(checkpoint.consolidationStreak, 30),
    })),
  });

  return { exact, coarse };
}

function createSeedSurveyResult(summary: LongRunSummary): F02SeedSurveyResult {
  const signatures = createHistorySignatures(summary);
  const silenceTicks = longestPoliticalSilenceTicks(summary);
  const pingPongCount = territorialPingPongCount(summary);

  return {
    summary,
    exactHistorySignature: signatures.exact,
    coarseHistorySignature: signatures.coarse,
    concerns: deriveSeedConcerns(summary, silenceTicks, pingPongCount),
    longestPoliticalSilenceTicks: silenceTicks,
    territorialPingPongCount: pingPongCount,
  };
}

function createOutcomeCounts(
  results: readonly F02SeedSurveyResult[],
): F02OutcomeCounts {
  return results.reduce<F02OutcomeCounts>(
    (counts, result) => ({
      ...counts,
      [result.summary.terminal.outcome]:
        counts[result.summary.terminal.outcome] + 1,
    }),
    { active: 0, orderConsolidated: 0, stateDissolved: 0 },
  );
}

function terminalYears(
  results: readonly F02SeedSurveyResult[],
): F02TerminalYearDistribution {
  const years = results
    .map((result) => result.summary.terminal.simulatedYear)
    .filter((year): year is number => year !== null);

  return {
    count: years.length,
    min: years.length === 0 ? null : Math.min(...years),
    median: years.length === 0 ? null : median(years),
    max: years.length === 0 ? null : Math.max(...years),
  };
}

function createPoliticalActivitySummary(
  results: readonly F02SeedSurveyResult[],
): F02PoliticalActivitySummary {
  const values = <T extends keyof LongRunSummary["events"]>(key: T) =>
    results.map((result) => result.summary.events[key]);

  return {
    rebellions: distribution(values("rebellionDetections")),
    coups: distribution(values("coupAttempts")),
    civilWars: distribution(values("civilWarsStarted")),
    governmentTransitions: distribution(values("governmentTransitions")),
    territorialChanges: distribution(values("landHexControlChanges")),
    consolidationAttempts: distribution(values("consolidationAttempts")),
    stateDissolutions: distribution(values("stateDissolutions")),
    zeroRebellionSeeds: values("rebellionDetections").filter(
      (value) => value === 0,
    ).length,
    zeroCoupSeeds: values("coupAttempts").filter((value) => value === 0).length,
    zeroCivilWarSeeds: values("civilWarsStarted").filter((value) => value === 0)
      .length,
    zeroGovernmentTransitionSeeds: values("governmentTransitions").filter(
      (value) => value === 0,
    ).length,
  };
}

function createStateDynamicsSummary(
  results: readonly F02SeedSurveyResult[],
): F02StateDynamicsSummary {
  const summaries = results.map((result) => result.summary);
  const treasuryValues = summaries.map(
    (summary) => summary.state.finalTreasury,
  );
  const stateCapacityValues = summaries.map(
    (summary) => summary.state.finalStateCapacity,
  );
  const peakInstabilityValues = summaries.map(
    (summary) => summary.state.peakInstability,
  );
  const factionOrganizationStartValues = summaries.map(
    (summary) => summary.state.startingFactionOrganizationTotal,
  );
  const factionOrganizationPeakValues = summaries.map(
    (summary) => summary.state.maximumFactionOrganizationTotal,
  );
  const factionOrganizationFinalValues = summaries.map(
    (summary) => summary.state.finalFactionOrganizationTotal,
  );
  const crisisParticipatingFactionValues = summaries.map(
    (summary) => summary.state.crisisParticipatingFactionCount,
  );
  const minimumContinuityValues = summaries.map(
    (summary) => summary.state.minimumStateContinuity,
  );
  const durations = summaries.map(
    (summary) => summary.state.zeroControlledLandHexDurationTicks,
  );

  return {
    treasuryUnchangedSeeds: summaries.filter(
      (summary) =>
        summary.state.startingTreasury === summary.state.minimumTreasury &&
        summary.state.startingTreasury === summary.state.maximumTreasury,
    ).length,
    stateCapacityUnchangedSeeds: summaries.filter(
      (summary) =>
        summary.state.startingStateCapacity ===
          summary.state.minimumStateCapacity &&
        summary.state.startingStateCapacity ===
          summary.state.maximumStateCapacity,
    ).length,
    treasuryRange: range(treasuryValues),
    stateCapacityRange: range(stateCapacityValues),
    instabilityPeakRange: range(peakInstabilityValues),
    factionOrganizationStartRange: range(factionOrganizationStartValues),
    factionOrganizationPeakRange: range(factionOrganizationPeakValues),
    factionOrganizationFinalRange: range(factionOrganizationFinalValues),
    crisisParticipatingFactionRange: range(crisisParticipatingFactionValues),
    stateContinuityMinimum: distribution(minimumContinuityValues),
    zeroTerritoryReachedSeeds: summaries.filter(
      (summary) => summary.state.zeroControlledLandHexReachedTick !== null,
    ).length,
    zeroTerritoryRecoveredSeeds: summaries.filter(
      (summary) => summary.state.zeroControlledLandHexRecoveryTick !== null,
    ).length,
    zeroTerritoryFinalActiveSeeds: summaries.filter(
      (summary) =>
        summary.terminal.outcome === "active" &&
        summary.state.finalControlledLandHexes === 0,
    ).length,
    zeroTerritoryDurationTicks: distribution(durations),
    instabilityRecoveredSeeds: summaries.filter(
      (summary) =>
        summary.state.finalInstability < summary.state.peakInstability,
    ).length,
  };
}

function clusterBy(
  results: readonly F02SeedSurveyResult[],
  key: (result: F02SeedSurveyResult) => string,
): readonly F02HistoryCluster[] {
  const clusters = new Map<string, number[]>();
  for (const result of results) {
    const seeds = clusters.get(key(result)) ?? [];
    seeds.push(result.summary.seed);
    clusters.set(key(result), seeds);
  }

  return [...clusters.values()]
    .map((seeds) => ({
      seeds: [...seeds].sort(compareNumbers),
      count: seeds.length,
    }))
    .sort(
      (first, second) =>
        second.count - first.count ||
        compareNumbers(first.seeds[0]!, second.seeds[0]!),
    );
}

function largestCluster(
  clusters: readonly F02HistoryCluster[],
): F02HistoryCluster {
  return clusters[0] ?? { seeds: [], count: 0 };
}

function createHistorySummary(
  results: readonly F02SeedSurveyResult[],
): F02HistoryDiversitySummary {
  const exactClusters = clusterBy(
    results,
    (result) => result.exactHistorySignature,
  );
  const coarseClusters = clusterBy(
    results,
    (result) => result.coarseHistorySignature,
  );
  const duplicateSeedCount = (clusters: readonly F02HistoryCluster[]) =>
    clusters
      .filter((cluster) => cluster.count > 1)
      .reduce((total, cluster) => total + cluster.count, 0);

  return {
    uniqueExactSignatures: exactClusters.length,
    uniqueCoarseSignatures: coarseClusters.length,
    largestExactCluster: largestCluster(exactClusters),
    largestCoarseCluster: largestCluster(coarseClusters),
    exactDuplicateSeedCount: duplicateSeedCount(exactClusters),
    coarseDuplicateSeedCount: duplicateSeedCount(coarseClusters),
    seedSensitive: exactClusters.length > 1,
  };
}

function createConsolidationSummary(
  scenario: ScenarioDefinition,
  results: readonly F02SeedSurveyResult[],
): F02ConsolidationSummary {
  const summaries = results.map((result) => result.summary);
  return {
    everEligibleSeeds: summaries.filter(
      (summary) => summary.state.consolidationEverEligible,
    ).length,
    maximumStreak: distribution(
      summaries.map((summary) => summary.state.maximumConsolidationStreak),
    ),
    reachedVictorySeeds: summaries.filter(
      (summary) => summary.terminal.outcome === "orderConsolidated",
    ).length,
    dissolutionThreshold: scenario.dissolutionCriteria.stateContinuityAtOrBelow,
    minimumStateContinuity: distribution(
      summaries.map((summary) => summary.state.minimumStateContinuity),
    ),
    reachedDissolutionSeeds: summaries.filter(
      (summary) => summary.events.stateDissolutions > 0,
    ).length,
  };
}

function createPacingSummary(
  results: readonly F02SeedSurveyResult[],
): F02PacingSummary {
  return {
    longestPoliticalSilenceYears: distribution(
      results.map(
        (result) => result.longestPoliticalSilenceTicks / F01_DAYS_PER_YEAR,
      ),
    ),
    politicallyInactiveSeeds: results.filter((result) =>
      result.concerns.includes("LOW_POLITICAL_ACTIVITY"),
    ).length,
    eventSpamCandidateSeeds: results.filter((result) =>
      result.concerns.includes("EVENT_SPAM_CANDIDATE"),
    ).length,
    territorialPingPongSeeds: results.filter(
      (result) =>
        result.territorialPingPongCount >= F02_PING_PONG_CANDIDATE_COUNT,
    ).length,
  };
}

function aggregateConcerns(
  results: readonly F02SeedSurveyResult[],
  history: F02HistoryDiversitySummary,
  state: F02StateDynamicsSummary,
  consolidation: F02ConsolidationSummary,
  pacing: F02PacingSummary,
  outcomes: F02OutcomeCounts,
): readonly F02ConcernCode[] {
  const concerns = new Set<F02ConcernCode>();
  if (outcomes.active === results.length) {
    concerns.add("NO_OUTCOME_REACHED");
  }
  if (history.uniqueCoarseSignatures === 1) {
    concerns.add("LOW_HISTORY_DIVERSITY");
  }
  if (
    state.treasuryUnchangedSeeds === results.length &&
    state.stateCapacityUnchangedSeeds === results.length
  ) {
    concerns.add("ECONOMIC_STASIS");
  }
  if (pacing.politicallyInactiveSeeds > 0) {
    concerns.add("LOW_POLITICAL_ACTIVITY");
  }
  if (state.zeroTerritoryFinalActiveSeeds > 0) {
    concerns.add("HIGH_ZERO_TERRITORY_PERSISTENCE");
  }
  if (pacing.territorialPingPongSeeds > 0) {
    concerns.add("TERRITORIAL_PING_PONG");
  }
  if (pacing.longestPoliticalSilenceYears.max >= F02_STASIS_YEARS) {
    concerns.add("LONG_SILENT_INTERVALS");
  }
  if (pacing.eventSpamCandidateSeeds > 0) {
    concerns.add("EVENT_SPAM_CANDIDATE");
  }
  if (consolidation.everEligibleSeeds === 0) {
    concerns.add("NO_CONSOLIDATION_REACHED");
  }
  if (consolidation.reachedDissolutionSeeds === 0) {
    concerns.add("DISSOLUTION_NOT_REACHED");
  }

  return [...concerns].sort(compareStableText);
}

function pickSeed(
  results: readonly F02SeedSurveyResult[],
  compare: (first: F02SeedSurveyResult, second: F02SeedSurveyResult) => number,
): number | null {
  return [...results].sort(compare)[0]?.summary.seed ?? null;
}

function createRepresentatives(
  results: readonly F02SeedSurveyResult[],
  history: F02HistoryDiversitySummary,
): F02RepresentativeSeeds {
  const bySeed = (first: F02SeedSurveyResult, second: F02SeedSurveyResult) =>
    compareNumbers(first.summary.seed, second.summary.seed);
  const eventCount = (result: F02SeedSurveyResult) =>
    result.summary.politicalEvents.length;

  return {
    active: pickSeed(
      results,
      (first, second) =>
        (first.summary.terminal.outcome === "active" ? 0 : 1) -
          (second.summary.terminal.outcome === "active" ? 0 : 1) ||
        bySeed(first, second),
    ),
    boring: pickSeed(
      results,
      (first, second) =>
        eventCount(first) - eventCount(second) || bySeed(first, second),
    ),
    volatile: pickSeed(
      results,
      (first, second) =>
        eventCount(second) - eventCount(first) || bySeed(first, second),
    ),
    recovery: pickSeed(
      results,
      (first, second) =>
        (first.summary.state.zeroControlledLandHexRecoveryTick === null
          ? 1
          : 0) -
          (second.summary.state.zeroControlledLandHexRecoveryTick === null
            ? 1
            : 0) || bySeed(first, second),
    ),
    terminal: pickSeed(
      results,
      (first, second) =>
        (first.summary.terminal.outcome === "active" ? 1 : 0) -
          (second.summary.terminal.outcome === "active" ? 1 : 0) ||
        (first.summary.terminal.simulatedYear ?? Infinity) -
          (second.summary.terminal.simulatedYear ?? Infinity) ||
        bySeed(first, second),
    ),
    largestCluster: history.largestCoarseCluster.seeds[0] ?? null,
  };
}

function getDeterministicSurveySignature(
  scenario: ScenarioDefinition,
  horizonYears: number,
  seeds: readonly number[],
  results: readonly F02SeedSurveyResult[],
): string {
  return JSON.stringify({
    scenarioId: scenario.id,
    scenarioVersion: scenario.version,
    inputPolicy: "WAIT",
    horizonYears,
    seeds,
    results: results.map((result) => ({
      seed: result.summary.seed,
      exactHistorySignature: result.exactHistorySignature,
      coarseHistorySignature: result.coarseHistorySignature,
      concerns: result.concerns,
      longestPoliticalSilenceTicks: result.longestPoliticalSilenceTicks,
      territorialPingPongCount: result.territorialPingPongCount,
    })),
  });
}

function buildSurveyResult(
  scenario: ScenarioDefinition,
  horizonYears: number,
  results: readonly F02SeedSurveyResult[],
  wallClockMilliseconds: number,
): F02SurveyResult {
  const sortedResults = [...results].sort((first, second) =>
    compareNumbers(first.summary.seed, second.summary.seed),
  );
  const sortedSeeds = sortedResults.map((result) => result.summary.seed);
  const outcomes = createOutcomeCounts(sortedResults);
  const history = createHistorySummary(sortedResults);
  const state = createStateDynamicsSummary(sortedResults);
  const consolidation = createConsolidationSummary(scenario, sortedResults);
  const pacing = createPacingSummary(sortedResults);
  const totalExecutedTicks = sortedResults.reduce(
    (total, result) => total + result.summary.performance.executedTicks,
    0,
  );
  const totalRequestedTicks = sortedResults.reduce(
    (total, result) => total + result.summary.performance.requestedTicks,
    0,
  );

  return {
    scenarioId: scenario.id,
    scenarioVersion: scenario.version,
    inputPolicy: "WAIT",
    horizonYears,
    seeds: sortedSeeds,
    totalRequestedTicks,
    totalExecutedTicks,
    wallClockMilliseconds,
    ticksPerSecond:
      wallClockMilliseconds > 0
        ? (totalExecutedTicks / wallClockMilliseconds) * 1000
        : 0,
    seedResults: sortedResults,
    outcomes,
    terminalYears: terminalYears(sortedResults),
    politicalActivity: createPoliticalActivitySummary(sortedResults),
    history,
    state,
    consolidation,
    pacing,
    concerns: aggregateConcerns(
      sortedResults,
      history,
      state,
      consolidation,
      pacing,
      outcomes,
    ),
    representatives: createRepresentatives(sortedResults, history),
    deterministicSignature: getDeterministicSurveySignature(
      scenario,
      horizonYears,
      sortedSeeds,
      sortedResults,
    ),
  };
}

export function runF02Survey(
  scenario: ScenarioDefinition,
  seeds: readonly number[] = F02_DEFAULT_SEEDS,
  horizonYears: number = F02_HORIZON_YEARS,
): F02SurveyResult {
  assertF02Config(scenario, seeds, horizonYears);
  const sortedSeeds = sortedUniqueSeeds(seeds);
  const start = globalThis.performance?.now() ?? Date.now();
  const results = sortedSeeds.map((seed) =>
    createSeedSurveyResult(
      runF01LongRun({
        scenario,
        seed,
        years: horizonYears,
        inputPolicy: "WAIT",
      }),
    ),
  );
  const elapsed = (globalThis.performance?.now() ?? Date.now()) - start;
  return buildSurveyResult(scenario, horizonYears, results, elapsed);
}

export async function runF02SurveyAsync(
  scenario: ScenarioDefinition,
  seeds: readonly number[] = F02_DEFAULT_SEEDS,
  horizonYears: number = F02_HORIZON_YEARS,
): Promise<F02SurveyResult> {
  assertF02Config(scenario, seeds, horizonYears);
  const sortedSeeds = sortedUniqueSeeds(seeds);
  const start = globalThis.performance?.now() ?? Date.now();
  const results: F02SeedSurveyResult[] = [];

  for (const seed of sortedSeeds) {
    results.push(
      createSeedSurveyResult(
        await runF01LongRunAsync({
          scenario,
          seed,
          years: horizonYears,
          inputPolicy: "WAIT",
        }),
      ),
    );
  }

  const elapsed = (globalThis.performance?.now() ?? Date.now()) - start;
  return buildSurveyResult(scenario, horizonYears, results, elapsed);
}

export function getF02SurveyDeterministicSignature(
  result: F02SurveyResult,
): string {
  return result.deterministicSignature;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatDistribution(distributionValue: F02NumericDistribution): string {
  return `${formatNumber(distributionValue.min)} / ${formatNumber(distributionValue.median)} / ${formatNumber(distributionValue.max)} (zero ${distributionValue.zeroCount})`;
}

function formatRange(value: readonly [number, number]): string {
  return `${formatNumber(value[0])}–${formatNumber(value[1])}`;
}

function formatOutcome(summary: LongRunSummary): string {
  return summary.terminal.outcome === "active"
    ? "active"
    : `${summary.terminal.outcome}@${summary.terminal.simulatedYear?.toFixed(2)}y`;
}

function formatSeedTable(result: F02SurveyResult): string[] {
  return [
    "| seed | outcome | ticks | reb | coup | civilWar | govΔ | HexΔ | minHex | finalHex |",
    "| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...result.seedResults.map(
      (seedResult) =>
        `| ${seedResult.summary.seed} | ${formatOutcome(seedResult.summary)} | ${seedResult.summary.performance.executedTicks} | ${seedResult.summary.events.rebellionDetections} | ${seedResult.summary.events.coupAttempts} | ${seedResult.summary.events.civilWarsStarted} | ${seedResult.summary.events.governmentTransitions} | ${seedResult.summary.events.landHexControlChanges} | ${seedResult.summary.state.minimumControlledLandHexes} | ${seedResult.summary.state.finalControlledLandHexes} |`,
    ),
  ];
}

export function formatF02Survey(result: F02SurveyResult): string {
  const activeSeed = result.representatives.active;
  const concernLines =
    result.concerns.length === 0
      ? ["- none observed"]
      : result.concerns.map((concern) => `- ${concern}`);
  const terminalYears = result.terminalYears;
  const political = result.politicalActivity;
  const state = result.state;
  const consolidation = result.consolidation;
  const pacing = result.pacing;
  const history = result.history;

  return [
    "F02 Multi-seed Outcome Survey",
    "",
    `Scenario: ${result.scenarioId} v${result.scenarioVersion}`,
    "Policy: WAIT (zero accepted ActionRecords)",
    `Seeds: ${result.seeds.length} [${result.seeds.join(", ")}]`,
    `Horizon: ${result.horizonYears} simulated years (${result.horizonYears * F01_DAYS_PER_YEAR} ticks per seed)`,
    "",
    "Performance:",
    `total ticks: ${result.totalExecutedTicks} / requested ${result.totalRequestedTicks}`,
    `runtime: ${result.wallClockMilliseconds.toFixed(2)} ms`,
    `effective ticks/sec: ${result.ticksPerSecond.toFixed(2)}`,
    "",
    "Per-seed:",
    ...formatSeedTable(result),
    "",
    "Outcomes:",
    `active: ${result.outcomes.active} / ${result.seeds.length}`,
    `orderConsolidated: ${result.outcomes.orderConsolidated} / ${result.seeds.length}`,
    `stateDissolved: ${result.outcomes.stateDissolved} / ${result.seeds.length}`,
    `terminal years: ${terminalYears.count === 0 ? "none" : `${formatNumber(terminalYears.min!)} / ${formatNumber(terminalYears.median!)} / ${formatNumber(terminalYears.max!)}`}`,
    "",
    "Political activity (min / median / max; zero seeds):",
    `rebellions: ${formatDistribution(political.rebellions)}`,
    `coups: ${formatDistribution(political.coups)}`,
    `civil wars: ${formatDistribution(political.civilWars)}`,
    `Government transitions: ${formatDistribution(political.governmentTransitions)}`,
    `territorial changes: ${formatDistribution(political.territorialChanges)}`,
    `consolidation attempts: ${formatDistribution(political.consolidationAttempts)}`,
    `state dissolutions: ${formatDistribution(political.stateDissolutions)}`,
    "",
    "History diversity:",
    `unique exact signatures: ${history.uniqueExactSignatures}`,
    `unique coarse signatures: ${history.uniqueCoarseSignatures}`,
    `largest exact cluster: ${history.largestExactCluster.count}/${result.seeds.length} [${history.largestExactCluster.seeds.join(", ")}]`,
    `largest coarse cluster: ${history.largestCoarseCluster.count}/${result.seeds.length} [${history.largestCoarseCluster.seeds.join(", ")}]`,
    `exact duplicate seeds: ${history.exactDuplicateSeedCount}; near-identical coarse duplicate seeds: ${history.coarseDuplicateSeedCount}`,
    `seed sensitivity: ${history.seedSensitive ? "OBSERVED" : "NOT OBSERVED"}`,
    "",
    "State dynamics:",
    `treasury unchanged seeds: ${state.treasuryUnchangedSeeds}/${result.seeds.length}; final range: ${formatRange(state.treasuryRange)}`,
    `stateCapacity unchanged seeds: ${state.stateCapacityUnchangedSeeds}/${result.seeds.length}; final range: ${formatRange(state.stateCapacityRange)}`,
    `instability peak range: ${formatRange(state.instabilityPeakRange)}; recovery seeds: ${state.instabilityRecoveredSeeds}`,
    `faction organization total start/peak/final ranges: ${formatRange(state.factionOrganizationStartRange)} / ${formatRange(state.factionOrganizationPeakRange)} / ${formatRange(state.factionOrganizationFinalRange)}`,
    `crisis-participating faction range: ${formatRange(state.crisisParticipatingFactionRange)}`,
    `stateContinuity minimum distribution: ${formatDistribution(state.stateContinuityMinimum)}`,
    `zero controlled Hex reached: ${state.zeroTerritoryReachedSeeds}; recovered: ${state.zeroTerritoryRecoveredSeeds}; final active at zero: ${state.zeroTerritoryFinalActiveSeeds}`,
    `zero-territory duration ticks (min / median / max): ${formatDistribution(state.zeroTerritoryDurationTicks)}`,
    "",
    "Consolidation / dissolution reachability:",
    `consolidation ever eligible: ${consolidation.everEligibleSeeds}/${result.seeds.length}`,
    `maximum consolidation streak: ${formatDistribution(consolidation.maximumStreak)}`,
    `orderConsolidated outcomes: ${consolidation.reachedVictorySeeds}`,
    `stateContinuity threshold: <= ${formatNumber(consolidation.dissolutionThreshold)}; minimum: ${formatDistribution(consolidation.minimumStateContinuity)}`,
    `stateDissolved outcomes: ${consolidation.reachedDissolutionSeeds}`,
    "",
    "Pacing / repeated patterns:",
    `longest political silence years (min / median / max): ${formatDistribution(pacing.longestPoliticalSilenceYears)}`,
    `politically inactive seeds: ${pacing.politicallyInactiveSeeds}`,
    `event-spam candidates: ${pacing.eventSpamCandidateSeeds}`,
    `territorial ping-pong candidates: ${pacing.territorialPingPongSeeds}`,
    "",
    "Concerns (diagnostic evidence, not automatic balance failures):",
    ...concernLines,
    "",
    "Representative seeds:",
    `active: ${activeSeed ?? "none"}`,
    `boring: ${result.representatives.boring ?? "none"}`,
    `volatile: ${result.representatives.volatile ?? "none"}`,
    `recovery: ${result.representatives.recovery ?? "none"}`,
    `terminal: ${result.representatives.terminal ?? "none"}`,
    `largest cluster: ${result.representatives.largestCluster ?? "none"}`,
    "",
    "Balance changes: NONE",
    "F03 intervention counterfactual: COMPLETE / PLAYER_AGENCY_WEAK (inspect:f03)",
    "F04 exploit analysis: COMPLETE / F05 NOT_READY",
    "F05 pacing/fun decision: BLOCKED BY F04 FINDINGS",
    "V02 renderer: NOT STARTED",
  ].join("\n");
}

export async function runF02SurveyInspectionAsync(): Promise<F02InspectionReport> {
  const scenario = createT021RebellionScenario();
  const result = await runF02SurveyAsync(
    scenario,
    F02_DEFAULT_SEEDS,
    F02_HORIZON_YEARS,
  );
  const allPassed = result.seedResults.every(
    (seedResult) => seedResult.summary.invariantFailures.length === 0,
  );

  return { result, allPassed, output: formatF02Survey(result) };
}

export function runF02SurveyInspection(): F02InspectionReport {
  const scenario = createT021RebellionScenario();
  const result = runF02Survey(scenario, F02_DEFAULT_SEEDS, F02_HORIZON_YEARS);
  const allPassed = result.seedResults.every(
    (seedResult) => seedResult.summary.invariantFailures.length === 0,
  );

  return { result, allPassed, output: formatF02Survey(result) };
}

export function printF02SurveyInspection(): void {
  console.log(runF02SurveyInspection().output);
}

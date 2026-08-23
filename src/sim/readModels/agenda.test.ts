import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createSimDate } from "../core/clock";
import { runSimulationStep } from "../core/tick";
import { acceptActionProposals } from "../state/action";
import {
  CONTACT_FIXTURE_COUNTRY_IDS,
  CONTACT_FIXTURE_REGION_IDS,
} from "../state/contactFixture";
import { IDEOLOGY_FIXTURE_IDS } from "../state/ideologyFixture";
import { asEventId, asFactionId } from "../state/ids";
import type { Country } from "../state/country";
import type { Faction } from "../state/faction";
import type { WorldState } from "../state/world";
import { createInitialWorldState } from "../state/world";
import { getLandHexesForRegion } from "../state/territorialTopology";
import {
  AGENDA_DETECTOR_CONFIG,
  detectFactionPressureAgendas,
  detectFiscalPressureAgenda,
  detectForeignIdeologicalPressureAgendas,
  deriveNationalAgendas,
} from "./agenda";
import {
  createT016AAgendaInspectionScenario,
  runT016AAgendaInspection,
  T016A_INSPECTION_FACTION_ID,
} from "../inspection/t016aAgendaInspection";

function inputFor(
  report: ReturnType<typeof runT016AAgendaInspection>,
  world: WorldState = report.stepResult.nextWorld,
  recentEvents = report.recentEvents,
) {
  return { scenario: report.scenario, world, recentEvents };
}

function withPlayerCountry(
  world: WorldState,
  values: Partial<Country>,
): WorldState {
  const countryId = CONTACT_FIXTURE_COUNTRY_IDS.player;
  return {
    ...world,
    countries: {
      ...world.countries,
      [countryId]: {
        ...world.countries[countryId]!,
        ...values,
      },
    },
  };
}

function withFaction(world: WorldState, values: Partial<Faction>): WorldState {
  return {
    ...world,
    factions: {
      ...world.factions,
      [T016A_INSPECTION_FACTION_ID]: {
        ...world.factions[T016A_INSPECTION_FACTION_ID]!,
        ...values,
      },
    },
  };
}

describe("T016A pressure and agenda read model", () => {
  it("returns the same agendas for the same WorldState and evidence", () => {
    const report = runT016AAgendaInspection();

    expect(deriveNationalAgendas(inputFor(report))).toEqual(
      deriveNationalAgendas(inputFor(report)),
    );
  });

  it("does not depend on collection insertion order", () => {
    const report = runT016AAgendaInspection();
    const world = report.stepResult.nextWorld;
    const reordered: WorldState = {
      ...world,
      countries: Object.fromEntries(
        Object.entries(world.countries).reverse(),
      ) as WorldState["countries"],
      regions: Object.fromEntries(
        Object.entries(world.regions).reverse(),
      ) as WorldState["regions"],
      factions: Object.fromEntries(
        Object.entries(world.factions).reverse(),
      ) as WorldState["factions"],
    };

    expect(
      deriveNationalAgendas(
        inputFor(report, reordered, [...report.recentEvents].reverse()),
      ),
    ).toEqual(deriveNationalAgendas(inputFor(report)));
  });

  it("uses stable faction ID tie-breaking after equal severity", () => {
    const report = runT016AAgendaInspection();
    const original =
      report.stepResult.nextWorld.factions[T016A_INSPECTION_FACTION_ID]!;
    const earlierId = asFactionId("t016a.earlier-faction");
    const world: WorldState = {
      ...report.stepResult.nextWorld,
      factions: {
        ...report.stepResult.nextWorld.factions,
        [earlierId]: { ...original, id: earlierId },
      },
    };
    const agendas = detectFactionPressureAgendas(inputFor(report, world, []));

    expect(agendas.map((agenda) => agenda.involvedFactionIds[0])).toEqual([
      earlierId,
      T016A_INSPECTION_FACTION_ID,
    ]);
  });

  it("never emits more than four primary agendas", () => {
    const report = runT016AAgendaInspection();

    expect(report.agendas.length).toBeLessThanOrEqual(4);
    expect(report.agendas.length).toBeGreaterThan(0);
  });

  it("filters filler candidates below the centralized threshold", () => {
    const report = runT016AAgendaInspection();

    expect(
      report.agendas.every(
        (agenda) =>
          agenda.severity >= AGENDA_DETECTOR_CONFIG.minimumSeverity &&
          agenda.title.length > 0,
      ),
    ).toBe(true);
    expect(report.resolvedAgendas).toEqual([]);
  });

  it("does not create a fiscal agenda for negligible pressure", () => {
    const report = runT016AAgendaInspection();
    const world = withPlayerCountry(report.stepResult.nextWorld, {
      treasury: -0.01,
      dailyIncome: 0,
      dailyExpenditure: 0.01,
    });

    expect(detectFiscalPressureAgenda(inputFor(report, world))).toBeNull();
  });

  it("updates when faction pressure is lowered", () => {
    const report = runT016AAgendaInspection();
    const lowered = withFaction(report.stepResult.nextWorld, {
      grievance: 0.1,
      organization: 0.1,
      influence: 0.1,
      resources: 0.1,
      foreignLinks: {},
    });

    expect(detectFactionPressureAgendas(inputFor(report, lowered))).toEqual([]);
  });

  it("removes the pressure set when the inspection counterexample resolves it", () => {
    const report = runT016AAgendaInspection();

    expect(report.resolvedAgendas).toEqual([]);
  });

  it("creates a fiscal agenda when a healthy treasury becomes deeply negative", () => {
    const report = runT016AAgendaInspection();
    const healthy = withPlayerCountry(report.stepResult.nextWorld, {
      treasury: 100,
      dailyIncome: 10,
      dailyExpenditure: 0,
    });
    const stressed = withPlayerCountry(healthy, {
      treasury: -100,
      dailyIncome: 0,
      dailyExpenditure: 10,
    });

    expect(detectFiscalPressureAgenda(inputFor(report, healthy))).toBeNull();
    expect(
      detectFiscalPressureAgenda(inputFor(report, stressed)),
    ).not.toBeNull();
  });

  it("reports severe fiscal stock or flow pressure without requiring both", () => {
    const report = runT016AAgendaInspection();
    const debtOnly = withPlayerCountry(report.stepResult.nextWorld, {
      treasury: -900,
      dailyIncome: 10,
      dailyExpenditure: 10,
    });
    const deficitOnly = withPlayerCountry(report.stepResult.nextWorld, {
      treasury: 100,
      dailyIncome: 0,
      dailyExpenditure: 90,
    });

    expect(
      detectFiscalPressureAgenda(inputFor(report, debtOnly))?.severityBand,
    ).toBe("critical");
    expect(
      detectFiscalPressureAgenda(inputFor(report, deficitOnly))?.severityBand,
    ).toBe("critical");
  });

  it("does not mutate WorldState", () => {
    const report = runT016AAgendaInspection();
    const before = JSON.stringify(report.stepResult.nextWorld);

    deriveNationalAgendas(inputFor(report));

    expect(JSON.stringify(report.stepResult.nextWorld)).toBe(before);
  });

  it("returns a read model rather than GameEvents", () => {
    const report = runT016AAgendaInspection();
    const agendas = deriveNationalAgendas(inputFor(report));

    expect(agendas.some((agenda) => "type" in agenda)).toBe(false);
    expect(report.recentEvents.length).toBeGreaterThan(0);
  });

  it("does not mutate faction strategy or faction metrics", () => {
    const report = runT016AAgendaInspection();
    const before = JSON.stringify(report.stepResult.nextWorld.factions);

    deriveNationalAgendas(inputFor(report));

    expect(JSON.stringify(report.stepResult.nextWorld.factions)).toBe(before);
  });

  it("keeps Faction.organization distinct from regional ideology organization", () => {
    const report = runT016AAgendaInspection();
    const faction =
      report.stepResult.nextWorld.factions[T016A_INSPECTION_FACTION_ID]!;
    const regionalOrganization =
      report.stepResult.nextWorld.regions[CONTACT_FIXTURE_REGION_IDS.port]!
        .ideology[IDEOLOGY_FIXTURE_IDS.republicanism]!.organization;

    expect(faction.organization).toBe(0.75);
    expect(regionalOrganization).toBe(0.7);
    expect(faction.organization).not.toBe(regionalOrganization);
  });

  it("does not create faction pressure from currentStrategy alone", () => {
    const report = runT016AAgendaInspection();
    const world = withFaction(report.stepResult.nextWorld, {
      grievance: 0.1,
      organization: 0.1,
      influence: 0.1,
      resources: 0.1,
      foreignLinks: {},
      currentStrategy: "fundMovement",
    });

    expect(detectFactionPressureAgendas(inputFor(report, world))).toEqual([]);
  });

  it("does not create a crisis from ideology support alone", () => {
    const report = runT016AAgendaInspection();
    const world = withPlayerCountry(
      withFaction(report.stepResult.nextWorld, {
        grievance: 0.1,
        organization: 0.1,
        influence: 0.1,
        resources: 0.1,
        foreignLinks: {},
      }),
      { treasury: 100, dailyIncome: 10, dailyExpenditure: 0 },
    );

    expect(
      detectForeignIdeologicalPressureAgendas(inputFor(report, world, [])),
    ).toEqual([]);
  });

  it("requires both a foreign directed route and diffusion evidence", () => {
    const report = runT016AAgendaInspection();

    expect(
      detectForeignIdeologicalPressureAgendas(
        inputFor(report, report.stepResult.nextWorld, []),
      ),
    ).toEqual([]);
  });

  it("reports unknown trend when no temporal direction was supplied", () => {
    const report = runT016AAgendaInspection();
    const agenda = detectFactionPressureAgendas(
      inputFor(report, report.stepResult.nextWorld, []),
    )[0];

    expect(agenda?.trend).toBe("unknown");
  });

  it("keeps causeEventIds inside supplied evidence and permits empty causes", () => {
    const report = runT016AAgendaInspection();
    const suppliedIds = new Set(report.recentEvents.map((event) => event.id));

    for (const agenda of report.agendas) {
      expect(
        agenda.causeEventIds.every((eventId) => suppliedIds.has(eventId)),
      ).toBe(true);
    }

    const withoutEvidence = deriveNationalAgendas(
      inputFor(report, report.stepResult.nextWorld, []),
    );
    expect(
      withoutEvidence.every((agenda) => agenda.causeEventIds.length === 0),
    ).toBe(true);
  });

  it("only reports intervention categories that exist in this build", () => {
    const report = runT016AAgendaInspection();
    const categories = new Set(
      report.agendas.flatMap((agenda) => agenda.interventionCategories),
    );

    expect([...categories].sort()).toEqual(["noAction", "policy"]);
    expect(categories.has("treasury")).toBe(false);
    expect(categories.has("diplomacy")).toBe(false);
    expect(categories.has("military")).toBe(false);
    expect(categories.has("repression")).toBe(false);
    expect(categories.has("concession")).toBe(false);
  });

  it("does not add story or quest state to WorldState", () => {
    const report = runT016AAgendaInspection();

    expect("agendas" in report.stepResult.nextWorld).toBe(false);
    expect(
      Object.keys(report.stepResult.nextWorld.run).some((key) =>
        /agenda|quest|story|chapter|progress/i.test(key),
      ),
    ).toBe(false);
  });

  it("contains no LLM or random call in the selector module", () => {
    const source = readFileSync(
      new URL("./agenda.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("llm");
  });

  it("remains a pure selector for a terminal run", () => {
    const report = runT016AAgendaInspection();
    const terminalWorld: WorldState = {
      ...report.stepResult.nextWorld,
      run: {
        ...report.stepResult.nextWorld.run,
        outcome: {
          status: "won",
          kind: "orderConsolidated",
          atTick: report.stepResult.nextWorld.tick,
          causeEventId: asEventId("event:1:0:ORDER_CONSOLIDATED"),
        },
      },
    };
    const before = JSON.stringify(terminalWorld);

    expect(deriveNationalAgendas(inputFor(report, terminalWorld))).toEqual(
      deriveNationalAgendas(inputFor(report, terminalWorld)),
    );
    expect(JSON.stringify(terminalWorld)).toBe(before);
  });

  it("preserves T016 proposal-to-next-tick resolution", () => {
    const scenario = {
      ...createT016AAgendaInspectionScenario(),
      initialDate: createSimDate(1, 1, 30),
    };
    const world = createInitialWorldState(scenario, 20260822);
    const first = runSimulationStep(world, { actions: [] });

    expect(first.nextWorld.tick).toBe(1);
    expect(first.actionProposals).toHaveLength(1);
    expect(first.actionProposals[0]?.tick).toBe(2);
    expect(
      first.nextWorld.factions[T016A_INSPECTION_FACTION_ID]?.currentStrategy,
    ).toBe("wait");

    const actions = acceptActionProposals(
      first.actionProposals,
      first.nextWorld.run.nextActionSequence,
    );
    const second = runSimulationStep(first.nextWorld, { actions });

    expect(
      second.emittedEvents.some(
        (event) => event.type === "FACTION_STRATEGY_CHANGED",
      ),
    ).toBe(true);
  });

  it("drops foreign pressure when the source is no longer a foreign political state", () => {
    const report = runT016AAgendaInspection();
    const sourceRegions = [
      CONTACT_FIXTURE_REGION_IDS.merchantPort,
      CONTACT_FIXTURE_REGION_IDS.monarchyBorder,
    ] as const;
    const landHexStates = { ...report.stepResult.nextWorld.landHexStates };
    for (const sourceRegion of sourceRegions) {
      for (const landHex of getLandHexesForRegion(
        report.scenario,
        sourceRegion,
      )) {
        landHexStates[landHex.id] = { controller: { kind: "uncontrolled" } };
      }
    }
    const uncontrolled: WorldState = {
      ...report.stepResult.nextWorld,
      landHexStates,
    };

    expect(
      detectForeignIdeologicalPressureAgendas(inputFor(report, uncontrolled)),
    ).toEqual([]);
  });

  it("uses actual names in deterministic titles and does not invent military facts", () => {
    const report = runT016AAgendaInspection();
    const titles = report.agendas.map((agenda) => agenda.title).join(" ");

    expect(titles).toContain("항구 상인연합");
    expect(titles).toContain("플레이어 왕국");
    expect(titles).not.toContain("군 급료");
    expect(titles).not.toContain("전쟁");
  });
});

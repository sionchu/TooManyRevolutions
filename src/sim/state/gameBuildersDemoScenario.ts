import {
  F04D_VALIDATION_INTERVENTION_IDS,
  createF04DValidationScenario,
} from "./gate1fValidationFixture";
import { asScenarioId } from "./ids";
import type { ScenarioDefinition } from "./scenario";

/**
 * The GameBuilders slice composes accepted fixture rules into one named demo
 * scenario. It owns initial content only; all runtime behavior remains in the
 * existing simulation pipeline.
 */
export function createGameBuildersDemoScenario(): ScenarioDefinition {
  const base = createF04DValidationScenario();
  const interventionNames: Readonly<Record<string, string>> = {
    [F04D_VALIDATION_INTERVENTION_IDS.materialRelief]: "곡창 긴급 배급 확대",
    [F04D_VALIDATION_INTERVENTION_IDS.politicalAccommodation]:
      "노동자회와 제한적 정치 타협",
    [F04D_VALIDATION_INTERVENTION_IDS.oppositionLegalization]:
      "독립 야권 합법화",
    [F04D_VALIDATION_INTERVENTION_IDS.coerciveRestriction]:
      "야권 집회·언론 활동 제한",
  };

  return {
    ...base,
    id: asScenarioId("gamebuilders.demo"),
    version: 1,
    initialDate: { year: 1897, month: 4, day: 1 },
    initialCountries: base.initialCountries.map((country) => ({
      ...country,
      name: "아르켄 왕국",
    })),
    initialRegions: base.initialRegions.map((region, index) => ({
      ...region,
      name: index === 0 ? "왕도권" : "철산 공업주",
    })),
    initialGovernments: base.initialGovernments.map((government) => ({
      ...government,
      name:
        government.authority === "central"
          ? "아르켄 왕실 내각"
          : "국가 비상 평의회",
    })),
    initialFactions: base.initialFactions.map((faction, index) => ({
      ...faction,
      name: index === 0 ? "국가 수비 평의회" : "철산 노동자회",
    })),
    interventionCatalog: Object.fromEntries(
      Object.entries(base.interventionCatalog).map(([id, definition]) => [
        id,
        {
          ...definition,
          name: interventionNames[id] ?? definition.name,
        },
      ]),
    ) as ScenarioDefinition["interventionCatalog"],
  };
}

export const GAMEBUILDERS_DEMO_SCENARIO = createGameBuildersDemoScenario();

import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { GAMEBUILDERS_DEMO_SCENARIO } from "../sim/state/gameBuildersDemoScenario";
import { createInitialWorldState } from "../sim/state/world";
import { ContextualDock } from "./ContextualDock";
import { deriveInstitutionalRoadmap } from "./institutionalRoadmap";
import { InstitutionalRoadmapPanel } from "./InstitutionalRoadmapPanel";

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function playerCopy(markup: string): string {
  const text = markup.replace(/<[^>]*>/g, " ");
  const accessibilityCopy = [...markup.matchAll(/\baria-label="([^"]*)"/g)]
    .map((match) => match[1])
    .join(" ");
  return `${text} ${accessibilityCopy}`.toLowerCase();
}

describe("PRESENTATION_VISUAL_V2_FIX2 player copy contract", () => {
  it("keeps Institutions player-facing copy free of implementation jargon", () => {
    const scenario = GAMEBUILDERS_DEMO_SCENARIO;
    const countryId = scenario.playerCountryId;
    if (countryId === null) {
      throw new Error("Demo scenario needs a player country.");
    }
    const world = createInitialWorldState(scenario, 1);
    const roadmap = deriveInstitutionalRoadmap(
      world.policies[countryId]!,
      scenario.policyCatalog,
    );
    const markup = renderToStaticMarkup(
      createElement(InstitutionalRoadmapPanel, { roadmap }),
    );
    const copy = playerCopy(markup);

    expect(copy).not.toMatch(
      /\b(depth|inspector|simulation|catalog|fixture)\b/i,
    );
    expect(copy).not.toContain("gamebuilders.");
    expect(markup).not.toContain("선행 depth");
    expect(markup).not.toContain("선택된 제도 inspector");
    expect(markup).not.toContain("지도에서 분리된 전체 화면");
    expect(markup).toContain("선행 1단계");
    expect(markup).toContain("선택한 제도 상세 정보");
  });

  it("keeps the four primary labels and separate Decisions/Institutions surfaces", () => {
    const dockMarkup = renderToStaticMarkup(
      createElement(ContextualDock, {
        activePanel: "map",
        onSelectPanel: () => undefined,
        onClose: () => undefined,
      }),
    );
    for (const label of ["지도", "결정", "제도", "연대기"]) {
      expect(dockMarkup).toContain(`>${label}<`);
    }

    const appSource = source("src/app/App.tsx");
    const decisionSource = source("src/app/DecisionPanel.tsx");
    const dockSource = source("src/app/ContextualDock.tsx");
    expect(appSource).toContain('activePanel === "institutions"');
    expect(dockSource).toContain('activePanel === "institutions"');
    expect(decisionSource).not.toContain("InstitutionalRoadmapPanel");
    expect(decisionSource).not.toContain("roadmap-panel");
    expect(decisionSource).not.toContain("institution-box");
  });
});

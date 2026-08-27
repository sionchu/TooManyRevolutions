import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const appSource = source("src/app/App.tsx");
const dockSource = source("src/app/ContextualDock.tsx");
const decisionSource = source("src/app/DecisionPanel.tsx");
const institutionsSource = source("src/app/InstitutionalRoadmapPanel.tsx");
const chronicleSource = source("src/app/ChroniclePanel.tsx");
const styleSource = source("src/styles/global.css");

describe("PRESENTATION_VISUAL_V2_FIX1 composition", () => {
  it("models the four product surfaces in React state", () => {
    expect(dockSource).toContain('"institutions"');
    expect(dockSource).toContain('{ id: "decisions", label: "결정" }');
    expect(dockSource).toContain('{ id: "institutions", label: "제도" }');
    expect(dockSource).toContain('{ id: "chronicle", label: "연대기" }');
    expect(dockSource).not.toContain('"agenda"');
    expect(dockSource).toContain("deepSurface");
    expect(appSource).toContain("data-active-panel={activePanel}");
    expect(appSource).toContain('activePanel === "institutions"');
    expect(appSource).toContain('activePanel === "chronicle"');
  });

  it("keeps Decisions focused and Institutions fully separate", () => {
    expect(decisionSource).toContain("data-contextual-shortlist-order");
    expect(decisionSource).toContain("지금 필요한 선택");
    expect(decisionSource).not.toContain("InstitutionalRoadmapPanel");
    expect(decisionSource).not.toContain("institution-box");
    expect(decisionSource).not.toContain("지금 결정할 일");
    expect(appSource).not.toContain('activePanel === "agenda"');
    expect(institutionsSource).toContain(
      'data-roadmap-layout="domain-lanes-prerequisite-depth"',
    );
    expect(institutionsSource).toContain("data-selected-policy-id");
    expect(institutionsSource).toContain("정확한 규칙 효과");
  });

  it("uses the dedicated editorial Chronicle structure", () => {
    expect(chronicleSource).toContain(
      'data-chronicle-surface="editorial-history"',
    );
    expect(chronicleSource).toContain("chronicle-lead");
    expect(chronicleSource).toContain("chronicle-timeline");
    expect(chronicleSource).not.toContain("event-row");
    expect(chronicleSource).not.toContain("sourceEventIds.map");
  });

  it("removes superseded graph/drawer CSS while keeping the FIX1 surface layer bounded", () => {
    expect(styleSource).toContain("PRESENTATION_VISUAL_V2_FIX1");
    expect(styleSource).toContain(".deep-surface");
    expect(styleSource).toContain(".roadmap-inspector");
    expect(styleSource).toContain(".chronicle-lead");
    expect(styleSource).not.toContain(
      "The roadmap is an actual dependency graph",
    );
    expect(styleSource).not.toContain(".roadmap-node-head");
    expect(styleSource).not.toContain(
      ".decision-support-content .roadmap-panel",
    );
    expect(styleSource).not.toContain(".contextual-drawer .event-list");
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const appSource = readFileSync(
  resolve(process.cwd(), "src/app/App.tsx"),
  "utf8",
);
const agendaSource = readFileSync(
  resolve(process.cwd(), "src/app/AgendaPanel.tsx"),
  "utf8",
);
const styleSource = readFileSync(
  resolve(process.cwd(), "src/styles/global.css"),
  "utf8",
);
const worldStageSource = readFileSync(
  resolve(process.cwd(), "src/app/PoliticalWorldStage.tsx"),
  "utf8",
);
const roadmapSource = readFileSync(
  resolve(process.cwd(), "src/app/InstitutionalRoadmapPanel.tsx"),
  "utf8",
);

describe("map-first product surface composition", () => {
  it("keeps the political atlas as the persistent main playfield", () => {
    expect(appSource).toContain("ContextualDock");
    expect(appSource).toContain('className="world-stage"');
    expect(appSource).toContain('className="world-map-surface"');
    expect(appSource).not.toContain('className="game-grid"');
    expect(appSource).not.toContain('className="panel map-panel"');
  });

  it("connects agenda and region context back to a spatial map focus", () => {
    expect(appSource).toContain('className="map-issue-chip"');
    expect(appSource).toContain("onSelectRegion={focusRegion}");
    expect(agendaSource).toContain("onFocusRegion");
    expect(agendaSource).toContain("지도에서 보기");
  });

  it("provides desktop edge drawers and mobile bottom-sheet navigation", () => {
    expect(styleSource).toContain(".world-stage");
    expect(styleSource).toContain(".contextual-drawer");
    expect(styleSource).toContain(".context-tabs");
    expect(styleSource).toContain("position: fixed");
    expect(styleSource).toContain("@media (max-width: 760px)");
    expect(styleSource).not.toMatch(/\.game-grid\s*\{/);
  });

  it("uses one production R3F scene and a positioned institutional graph", () => {
    expect(worldStageSource).toContain("@react-three/fiber");
    expect(worldStageSource).toContain('data-map-renderer="r3f"');
    expect(worldStageSource).toContain("deriveWorldSceneModel");
    expect(worldStageSource).toContain("<Canvas");
    expect(worldStageSource).not.toContain("<svg");
    expect(worldStageSource).not.toContain("data-controller-id");
    expect(roadmapSource).toContain("roadmap-edge-layer");
    expect(roadmapSource).toContain("graphPositions");
    expect(roadmapSource).toContain("제도 연결 읽기");
  });
});

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
const dockSource = readFileSync(
  resolve(process.cwd(), "src/app/ContextualDock.tsx"),
  "utf8",
);
const metricSource = readFileSync(
  resolve(process.cwd(), "src/app/MetricStrip.tsx"),
  "utf8",
);
const timeSource = readFileSync(
  resolve(process.cwd(), "src/app/TimeControls.tsx"),
  "utf8",
);
const chronicleSource = readFileSync(
  resolve(process.cwd(), "src/app/ChroniclePanel.tsx"),
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

  it("keeps one compact map issue cue with spatial focus", () => {
    expect(appSource).toContain('className="map-issue-chip"');
    expect(appSource).toContain("onSelectRegion={focusRegion}");
    expect(appSource).toContain("지도에서 보기");
    expect(appSource).not.toContain('className="map-fact-strip"');
    expect(appSource).not.toContain('className="map-fact-details"');
    expect(agendaSource).toContain("onFocusRegion");
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
    expect(roadmapSource).toContain(
      'data-roadmap-layout="domain-lanes-depth-columns"',
    );
    expect(roadmapSource).toContain('data-roadmap-node-overlap="0"');
  });

  it("keeps the default HUD qualitative and promotes utility controls", () => {
    expect(dockSource).toContain('"institutions"');
    expect(dockSource).toContain('"chronicle"');
    expect(dockSource).toContain("surface-mode");
    expect(dockSource).not.toContain('"agenda"');
    expect(metricSource).toContain("state-signal-group");
    expect(timeSource).toContain("time-options");
    expect(timeSource).toContain("auto-slow-toggle");
    expect(chronicleSource).toContain("chronicle-timeline");
  });

  it("uses the contextual selector as the only immediate product decision authority", () => {
    expect(appSource).toContain("deriveContextualDecisionSurface");
    expect(appSource).toContain("decisionSurface.primaryShortlist");
    expect(appSource).toContain("GAMEBUILDERS_PRODUCTION_CONTEXTUAL_CATALOG");
    expect(appSource).not.toContain("POLICY_FIXTURE_IDS");
    expect(appSource).not.toContain("policySurfaceIds");
    expect(appSource).not.toContain(
      "Object.values(GAMEBUILDERS_DEMO_SCENARIO.interventionCatalog)",
    );
  });

  it("connects KayKit GLTF and EventStore presentation to the production surface", () => {
    expect(worldStageSource).toContain("getResolvedWorldAssetEntries");
    expect(worldStageSource).toContain("WorldAssetModel");
    expect(worldStageSource).toContain(
      'data-map-production-assets="kaykit-gltf"',
    );
    expect(worldStageSource).toContain(
      'data-map-port-hero="unresolved-label-and-coast-facts-only"',
    );
    expect(appSource).toContain("deriveEventPresentation");
    expect(appSource).toContain("EventPresentationOverlay");
    expect(appSource).toContain("submitRuntimePoliticalProposalResponse");
  });
});

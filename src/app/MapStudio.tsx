import { useMemo, useState } from "react";

import {
  deriveMapArchitecture,
  deriveMapViewportBounds,
  emptyMapPatchV1,
  parseMapPatchV1,
  validateMapArchitecture,
  type MapPatchV1,
} from "../presentation/mapArchitecture";
import {
  deriveMapVisualSystem,
  MAP_MATERIAL_SYSTEM,
  MAP_VISUAL_ASSET_KIT,
} from "../presentation/mapVisualSystem";
import { derivePresentationState } from "../presentation/presentationState";
import { deriveWorldSceneModel } from "../presentation/worldSceneModel";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../sim/state/gameBuildersDemoScenario";
import { advanceDemoRuntime, createDemoRuntimeState } from "./demoGame";
import { deriveStateProjectPresentations } from "./stateProjects";
import { PoliticalWorldStage } from "./PoliticalWorldStage";

type MapStudioMode =
  | "topology"
  | "geography"
  | "infrastructure"
  | "composition"
  | "labels"
  | "style"
  | "semantic"
  | "political"
  | "camera"
  | "snapshot"
  | "validation";

type SnapshotId = "day0" | "rebellion" | "project" | "late";

const MODES: readonly { readonly id: MapStudioMode; readonly label: string }[] =
  [
    { id: "topology", label: "Topology 읽기" },
    { id: "geography", label: "Geography" },
    { id: "infrastructure", label: "Infrastructure" },
    { id: "composition", label: "Region composition" },
    { id: "labels", label: "Labels / LOD" },
    { id: "style", label: "Style / materials" },
    { id: "semantic", label: "POI / 기관" },
    { id: "political", label: "Political preview" },
    { id: "camera", label: "Camera / occupancy" },
    { id: "snapshot", label: "Snapshot" },
    { id: "validation", label: "Validation / Patch" },
  ];

const SNAPSHOTS: readonly {
  readonly id: SnapshotId;
  readonly label: string;
  readonly days: number;
}[] = [
  { id: "day0", label: "Day 0", days: 0 },
  { id: "rebellion", label: "Rebellion candidate", days: 90 },
  { id: "project", label: "Project horizon", days: 180 },
  { id: "late", label: "Late state", days: 720 },
];

function jsonPatch(patch: MapPatchV1): string {
  return JSON.stringify(patch, null, 2);
}

export function MapStudio() {
  const [mode, setMode] = useState<MapStudioMode>("topology");
  const [snapshotId, setSnapshotId] = useState<SnapshotId>("day0");
  const [patchText, setPatchText] = useState(() =>
    jsonPatch(emptyMapPatchV1(GAMEBUILDERS_DEMO_SCENARIO.id)),
  );
  const [patchNotice, setPatchNotice] = useState(
    "로컬 draft · GitHub에 직접 쓰지 않습니다.",
  );
  const [selectedLandHexId, setSelectedLandHexId] = useState<string | null>(
    null,
  );
  const baseRecord = useMemo(() => createDemoRuntimeState(), []);
  const snapshot = useMemo(() => {
    const days =
      SNAPSHOTS.find((candidate) => candidate.id === snapshotId)?.days ?? 0;
    return days === 0 ? baseRecord : advanceDemoRuntime(baseRecord, days);
  }, [baseRecord, snapshotId]);
  const presentation = useMemo(
    () => derivePresentationState(GAMEBUILDERS_DEMO_SCENARIO, snapshot.world),
    [snapshot.world],
  );
  const projects = useMemo(
    () =>
      deriveStateProjectPresentations(
        GAMEBUILDERS_DEMO_SCENARIO,
        snapshot.world,
        snapshot.eventStore.events,
      ),
    [snapshot.eventStore.events, snapshot.world],
  );
  const sceneModel = useMemo(
    () =>
      deriveWorldSceneModel(
        presentation,
        projects.map((project) => ({
          id: project.id,
          name: project.name,
          anchorRegionId: project.anchorRegionId,
          landmarkKind: project.landmarkKind,
          status: project.status,
          progress: project.progress,
          sourceEventIds: project.sourceEventIds,
        })),
      ),
    [presentation, projects],
  );
  const model = useMemo(() => deriveMapArchitecture(sceneModel), [sceneModel]);
  const visualSystem = useMemo(
    () => deriveMapVisualSystem(sceneModel, model, "medium"),
    [model, sceneModel],
  );
  const validation = useMemo(
    () => validateMapArchitecture(sceneModel, model),
    [model, sceneModel],
  );

  const updatePatch = (mutate: (patch: MapPatchV1) => MapPatchV1) => {
    const parsed = parseMapPatchV1(patchText, GAMEBUILDERS_DEMO_SCENARIO.id);
    const current =
      parsed.patch ?? emptyMapPatchV1(GAMEBUILDERS_DEMO_SCENARIO.id);
    setPatchText(jsonPatch(mutate(current)));
  };

  return (
    <main className="map-studio-shell" data-map-studio="true">
      <header className="map-studio-header">
        <div>
          <span className="eyebrow">DEVELOPER-ONLY MAP AUTHORING</span>
          <h1>Map Studio · {GAMEBUILDERS_DEMO_SCENARIO.id}</h1>
          <p>
            authoritative topology를 읽고 geography·POI·political
            snapshot·camera를 local MapPatch v1 draft로 검토합니다.
          </p>
        </div>
        <a className="quiet-button" href="/">
          게임으로 돌아가기
        </a>
      </header>
      <nav className="map-studio-mode-tabs" aria-label="Map Studio 모드">
        {MODES.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            className={mode === candidate.id ? "active" : ""}
            data-map-studio-mode={candidate.id}
            onClick={() => setMode(candidate.id)}
          >
            {candidate.label}
          </button>
        ))}
      </nav>
      <section className="map-studio-toolbar">
        <label>
          Snapshot
          <select
            value={snapshotId}
            onChange={(event) =>
              setSnapshotId(event.target.value as SnapshotId)
            }
          >
            {SNAPSHOTS.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.label}
              </option>
            ))}
          </select>
        </label>
        <span data-map-studio-snapshot>
          tick {snapshot.world.tick} · LandHex{" "}
          {model.sharedTerrainMesh.logicalLandHexCount}
        </span>
        <span data-map-studio-patch-status>{patchNotice}</span>
      </section>
      <section className="map-studio-layout">
        <aside className="map-studio-inspector">
          {mode === "topology" ? (
            <>
              <h2>Topology · read-only</h2>
              <p>LandHex topology와 수량은 이번 P0에서 변경하지 않습니다.</p>
              <dl>
                <dt>LandHex count</dt>
                <dd>{model.sharedTerrainMesh.logicalLandHexCount}</dd>
                <dt>Shared terrain vertices</dt>
                <dd>{model.sharedTerrainMesh.sharedVertexCount}</dd>
                <dt>Region count</dt>
                <dd>{presentation.regions.length}</dd>
              </dl>
              <div className="map-studio-record-list">
                {presentation.landHexes.map((hex) => (
                  <button
                    key={hex.landHexId}
                    type="button"
                    className={
                      selectedLandHexId === hex.landHexId ? "active" : ""
                    }
                    onClick={() => setSelectedLandHexId(hex.landHexId)}
                  >
                    {hex.landHexId} · {hex.terrain}
                  </button>
                ))}
              </div>
            </>
          ) : null}
          {mode === "geography" ? (
            <>
              <h2>Geography authoring</h2>
              <p>
                shared terrain은 topology에서 파생되고, path/zone은 presentation
                draft입니다.
              </p>
              <ul>
                {model.geography.terrainZones.map((zone) => (
                  <li key={zone.id}>
                    {zone.terrain} · {zone.landHexIds.length} hex
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => {
                  updatePatch((patch) => ({
                    ...patch,
                    geographyChanges: [
                      ...patch.geographyChanges,
                      { kind: "terrain-zone-review", selectedLandHexId },
                    ],
                  }));
                  setPatchNotice(
                    "geography draft를 local patch에 추가했습니다.",
                  );
                }}
              >
                선택 hex geography draft 추가
              </button>
            </>
          ) : null}
          {mode === "infrastructure" ? (
            <>
              <h2>Infrastructure authoring</h2>
              <p>
                실제 route/contact anchor만 corridor로 표현하고, decorative
                path는 gameplay state를 암시하지 않습니다.
              </p>
              <ul>
                {sceneModel.routes.map((route) => (
                  <li key={route.id}>
                    {route.id} · {route.visualKind} ·{" "}
                    {route.active ? "active" : "quiet"}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => {
                  updatePatch((patch) => ({
                    ...patch,
                    visualChanges: [
                      ...patch.visualChanges,
                      { kind: "route-corridor-review", selectedLandHexId },
                    ],
                  }));
                  setPatchNotice(
                    "route corridor visual draft를 local patch에 추가했습니다.",
                  );
                }}
              >
                route corridor draft 추가
              </button>
            </>
          ) : null}
          {mode === "composition" ? (
            <>
              <h2>Region composition</h2>
              <p>
                수도·산업·농업·frontier composition은 기존 Region/POI/project
                evidence에서 파생됩니다.
              </p>
              {visualSystem.compositions.map((composition) => (
                <div
                  key={composition.regionId}
                  className="map-studio-preset-row"
                >
                  <strong>{composition.regionId}</strong>
                  <span>
                    {composition.role} · {composition.density}
                  </span>
                  <em>
                    {composition.assetIds.length} assets ·{" "}
                    {composition.evidenceIds.length} evidence
                  </em>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  updatePatch((patch) => ({
                    ...patch,
                    visualChanges: [
                      ...patch.visualChanges,
                      {
                        kind: "region-composition-review",
                        regionId: selectedLandHexId,
                      },
                    ],
                  }));
                  setPatchNotice(
                    "Region composition visual draft를 local patch에 추가했습니다.",
                  );
                }}
              >
                composition draft 추가
              </button>
            </>
          ) : null}
          {mode === "labels" ? (
            <>
              <h2>Labels / LOD</h2>
              <p>
                country &gt; capital &gt; crisis &gt; Region &gt; project/POI
                우선순위와 collision 회피 결과입니다.
              </p>
              <dl>
                <dt>Visible labels</dt>
                <dd>{visualSystem.labels.length}</dd>
                <dt>Collision gap</dt>
                <dd>{visualSystem.labelPolicy.collisionGap}</dd>
                <dt>Macro hidden</dt>
                <dd>{visualSystem.labelPolicy.hiddenAtMacro.join(", ")}</dd>
              </dl>
              <button
                type="button"
                onClick={() => {
                  updatePatch((patch) => ({
                    ...patch,
                    visualChanges: [
                      ...patch.visualChanges,
                      {
                        kind: "label-layout-review",
                        labelCount: visualSystem.labels.length,
                      },
                    ],
                  }));
                  setPatchNotice(
                    "label layout visual draft를 local patch에 추가했습니다.",
                  );
                }}
              >
                label layout draft 추가
              </button>
            </>
          ) : null}
          {mode === "style" ? (
            <>
              <h2>Style / materials</h2>
              <p>
                프로젝트 authored low-poly kit과 contact grounding preset입니다.
              </p>
              <dl>
                <dt>Asset kit</dt>
                <dd>{MAP_VISUAL_ASSET_KIT.length} · no third-party</dd>
                <dt>Roughness</dt>
                <dd>{MAP_MATERIAL_SYSTEM.roughness}</dd>
                <dt>Contact shadow</dt>
                <dd>{MAP_MATERIAL_SYSTEM.contactShadowOpacity}</dd>
              </dl>
              <button
                type="button"
                onClick={() => {
                  updatePatch((patch) => ({
                    ...patch,
                    styleChanges: [
                      ...patch.styleChanges,
                      {
                        kind: "material-preset-review",
                        preset: "TMR-earth-ochre",
                      },
                    ],
                  }));
                  setPatchNotice(
                    "material preset visual draft를 local patch에 추가했습니다.",
                  );
                }}
              >
                material preset draft 추가
              </button>
            </>
          ) : null}
          {mode === "semantic" ? (
            <>
              <h2>POI / institution authoring</h2>
              <p>stable ID와 기존 LandHex/Region anchor를 사용합니다.</p>
              <ul>
                {model.semanticContent.pois.map((poi) => (
                  <li key={poi.id}>
                    {poi.name} · {poi.anchorLandHexId}
                  </li>
                ))}
                {model.semanticContent.institutions.map((institution) => (
                  <li key={institution.id}>
                    {institution.name} · {institution.anchorLandHexId}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => {
                  updatePatch((patch) => ({
                    ...patch,
                    poiChanges: [
                      ...patch.poiChanges,
                      {
                        kind: "poi-placement-review",
                        anchorLandHexId: selectedLandHexId,
                      },
                    ],
                  }));
                  setPatchNotice(
                    "POI/institution placement draft를 local patch에 추가했습니다.",
                  );
                }}
              >
                선택 anchor POI draft 추가
              </button>
            </>
          ) : null}
          {mode === "political" ? (
            <>
              <h2>Political snapshot</h2>
              <p>
                Legal owner, physical controller, faction perimeter, front만
                derived합니다.
              </p>
              <dl>
                <dt>Legal boundaries</dt>
                <dd>{model.political.legalOwnerBoundarySegments.length}</dd>
                <dt>Controller boundaries</dt>
                <dd>
                  {model.political.physicalControllerBoundarySegments.length}
                </dd>
                <dt>Front segments</dt>
                <dd>{model.political.frontBoundarySegments.length}</dd>
                <dt>Ideology surfaces</dt>
                <dd>{model.political.ideologySurfaces.length}</dd>
              </dl>
            </>
          ) : null}
          {mode === "camera" ? (
            <>
              <h2>Camera / occupancy</h2>
              {model.viewPresets.map((preset) => {
                const bounds = deriveMapViewportBounds(sceneModel, preset);
                return (
                  <div key={preset.id} className="map-studio-preset-row">
                    <strong>{preset.label}</strong>
                    <span>{preset.id}</span>
                    <em>
                      camera bounds {(bounds.maxX - bounds.minX).toFixed(2)} ×{" "}
                      {(bounds.maxZ - bounds.minZ).toFixed(2)} world units
                    </em>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  updatePatch((patch) => ({
                    ...patch,
                    cameraPresetChanges: [
                      ...patch.cameraPresetChanges,
                      {
                        kind: "camera-preset-review",
                        presetId: "mobile.player-theater",
                      },
                    ],
                  }));
                  setPatchNotice(
                    "camera preset draft를 local patch에 추가했습니다.",
                  );
                }}
              >
                모바일 preset draft 추가
              </button>
            </>
          ) : null}
          {mode === "snapshot" ? (
            <>
              <h2>Snapshot preview</h2>
              <p>
                Day 0 / rebellion candidate / project / late를 동일
                projection으로 봅니다.
              </p>
              {SNAPSHOTS.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  className={snapshotId === candidate.id ? "active" : ""}
                  onClick={() => setSnapshotId(candidate.id)}
                >
                  {candidate.label} · {candidate.days}일
                </button>
              ))}
            </>
          ) : null}
          {mode === "validation" ? (
            <>
              <h2>Validation / MapPatch v1</h2>
              <p data-map-studio-validation>
                {validation.length === 0
                  ? "architecture validation PASS"
                  : validation
                      .map((issue) => `${issue.severity}: ${issue.message}`)
                      .join(" · ")}
              </p>
              {validation.map((issue) => (
                <div
                  key={issue.code}
                  className={`map-studio-issue ${issue.severity}`}
                >
                  {issue.code} · {issue.message}
                </div>
              ))}
              <textarea
                value={patchText}
                onChange={(event) => setPatchText(event.target.value)}
                aria-label="MapPatch v1 JSON"
                rows={12}
              />
              <div className="map-studio-patch-actions">
                <button
                  type="button"
                  onClick={() => {
                    const parsed = parseMapPatchV1(
                      patchText,
                      GAMEBUILDERS_DEMO_SCENARIO.id,
                    );
                    setPatchNotice(
                      parsed.issues.length === 0
                        ? "MapPatch v1 local validation PASS"
                        : parsed.issues
                            .map((issue) => issue.message)
                            .join(" · "),
                    );
                  }}
                >
                  patch 검증
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPatchText(
                      jsonPatch(emptyMapPatchV1(GAMEBUILDERS_DEMO_SCENARIO.id)),
                    );
                    setPatchNotice("MapPatch v1 local draft를 초기화했습니다.");
                  }}
                >
                  초기화
                </button>
              </div>
            </>
          ) : null}
        </aside>
        <div className="map-studio-preview">
          <div className="map-studio-preview-header">
            <span>same R3F world projection</span>
            <span>
              {snapshotId} · {model.layerOrder.join(" → ")}
            </span>
          </div>
          <PoliticalWorldStage
            presentation={presentation}
            selectedRegionId={presentation.regions[0]?.regionId ?? null}
            onSelectRegion={(regionId) => {
              const anchor = presentation.landHexes.find(
                (hex) => hex.regionId === regionId,
              );
              setSelectedLandHexId(anchor?.landHexId ?? null);
            }}
            onClearFocus={() => undefined}
            projects={projects}
            visualDeltas={[]}
            focusRegionId={null}
            previewRegionIds={[]}
          />
        </div>
      </section>
    </main>
  );
}

import { useState } from "react";

import {
  COUNTRY_CREST_ASSET_IDS,
  FACTION_EMBLEM_ASSET_IDS,
  getAssetPath,
} from "../presentation/design/assetManifest";
import type {
  PresentationCountry,
  PresentationLandHex,
  PresentationRegion,
  PresentationState,
} from "../presentation/presentationState";
import { TMR_LAYER_REGISTRY } from "../presentation/design/layerRegistry";
import type { CountryId, RegionId } from "../sim/state/ids";
import type { StateProjectPresentation } from "./stateProjects";
import type { WorldVisualDelta } from "./worldVisualDelta";

const HEX_SIZE = 42;
const MAP_CENTER_X = 400;
const MAP_CENTER_Y = 225;
const COUNTRY_TINTS = ["#9e6f45", "#647f83", "#87705e"] as const;
const COUNTRY_ACCENTS = ["#7f332f", "#3e6570", "#5d463c"] as const;
const IDEOLOGY_TINTS = ["#7f332f", "#3e6570", "#9b7022", "#6b4c7b"] as const;

interface Point {
  readonly x: number;
  readonly y: number;
}

interface CountryVisual {
  readonly fill: string;
  readonly accent: string;
  readonly crestAssetId: string;
}

function coordinateKey(q: number, r: number): string {
  return `${q},${r}`;
}

function centerFor(q: number, r: number): Point {
  return {
    x: HEX_SIZE * Math.sqrt(3) * (q + r / 2) + MAP_CENTER_X,
    y: HEX_SIZE * 1.5 * r + MAP_CENTER_Y,
  };
}

function verticesFor(center: Point): readonly Point[] {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index - 30);
    return {
      x: center.x + HEX_SIZE * Math.cos(angle),
      y: center.y + HEX_SIZE * Math.sin(angle),
    };
  });
}

function pointsString(points: readonly Point[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

interface MapBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

function mapBounds(presentation: PresentationState): MapBounds {
  const points = presentation.landHexes.flatMap((hex) =>
    verticesFor(centerFor(hex.coordinate.q, hex.coordinate.r)),
  );
  if (points.length === 0) return { x: 0, y: 0, width: 800, height: 480 };
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const padding = 28;
  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}

function cameraViewBox(
  bounds: MapBounds,
  focus: Point | undefined,
  zoom: number,
): string {
  const safeZoom = Math.max(1, Math.min(2.4, zoom));
  const width = bounds.width / safeZoom;
  const height = bounds.height / safeZoom;
  const target = focus ?? {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
  return `${target.x - width / 2} ${target.y - height / 2} ${width} ${height}`;
}

function averagePoint(points: readonly Point[]): Point {
  if (points.length === 0) return { x: MAP_CENTER_X, y: MAP_CENTER_Y };
  return {
    x: points.reduce((total, point) => total + point.x, 0) / points.length,
    y: points.reduce((total, point) => total + point.y, 0) / points.length,
  };
}

function countryVisual(
  country: PresentationCountry,
  index: number,
): CountryVisual {
  const crestAssetId = country.isPlayer
    ? COUNTRY_CREST_ASSET_IDS.arken
    : country.countryId.includes("veloria")
      ? COUNTRY_CREST_ASSET_IDS.veloria
      : COUNTRY_CREST_ASSET_IDS.karsen;
  return {
    fill: COUNTRY_TINTS[index % COUNTRY_TINTS.length]!,
    accent: COUNTRY_ACCENTS[index % COUNTRY_ACCENTS.length]!,
    crestAssetId,
  };
}

function controllerLabel(hex: PresentationLandHex): string {
  switch (hex.controller.kind) {
    case "country":
      return "국가 통제";
    case "faction":
      return "세력 통제";
    case "uncontrolled":
      return "통제 공백";
  }
}

function controllerId(hex: PresentationLandHex): string {
  switch (hex.controller.kind) {
    case "country":
      return hex.controller.countryId;
    case "faction":
      return hex.controller.factionId;
    case "uncontrolled":
      return "uncontrolled";
  }
}

function ideologyColor(ideologyId: string): string {
  const hash = [...ideologyId].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return IDEOLOGY_TINTS[hash % IDEOLOGY_TINTS.length]!;
}

function strongestIdeology(
  region: PresentationRegion,
): PresentationRegion["politicalInfluence"][number] | null {
  return (
    [...region.politicalInfluence].sort(
      (first, second) =>
        second.support - first.support ||
        first.ideologyId.localeCompare(second.ideologyId),
    )[0] ?? null
  );
}

function terrainLabel(terrain: PresentationLandHex["terrain"]): string {
  switch (terrain) {
    case "plains":
      return "평야";
    case "forest":
      return "삼림";
    case "hills":
      return "구릉";
    case "mountains":
      return "산악";
    case "coast":
      return "해안";
    case "wetlands":
      return "습지";
  }
}

function regionCenters(
  presentation: PresentationState,
): ReadonlyMap<RegionId, Point> {
  const pointsByRegion = new Map<RegionId, Point[]>();
  for (const hex of presentation.landHexes) {
    const points = pointsByRegion.get(hex.regionId) ?? [];
    points.push(centerFor(hex.coordinate.q, hex.coordinate.r));
    pointsByRegion.set(hex.regionId, points);
  }
  return new Map(
    [...pointsByRegion.entries()].map(([regionId, points]) => [
      regionId,
      averagePoint(points),
    ]),
  );
}

function countryCenters(
  presentation: PresentationState,
  centers: ReadonlyMap<RegionId, Point>,
): ReadonlyMap<CountryId, Point> {
  const pointsByCountry = new Map<CountryId, Point[]>();
  for (const region of presentation.regions) {
    const point = centers.get(region.regionId);
    if (point === undefined) continue;
    const points = pointsByCountry.get(region.ownerCountryId) ?? [];
    points.push(point);
    pointsByCountry.set(region.ownerCountryId, points);
  }
  return new Map(
    [...pointsByCountry.entries()].map(([countryId, points]) => [
      countryId,
      averagePoint(points),
    ]),
  );
}

function countryVisuals(
  countries: readonly PresentationCountry[],
): ReadonlyMap<CountryId, CountryVisual> {
  return new Map(
    countries.map((country, index) => [
      country.countryId,
      countryVisual(country, index),
    ]),
  );
}

function regionName(
  regions: ReadonlyMap<RegionId, PresentationRegion>,
  regionId: RegionId,
): string {
  return regions.get(regionId)?.name ?? "지역";
}

function countryName(
  countries: ReadonlyMap<CountryId, PresentationCountry>,
  countryId: CountryId,
): string {
  return countries.get(countryId)?.name ?? "국가";
}

function regionLabelLines(name: string): readonly string[] {
  const words = name.split(" ");
  if (words.length <= 2) return [name];
  return [words.slice(0, -1).join(" "), words.at(-1)!];
}

function channelLabel(
  channel: PresentationState["contactRoutes"][number]["channel"],
): string {
  switch (channel) {
    case "border":
      return "국경";
    case "trade":
      return "무역";
    case "migration":
      return "이주";
    case "information":
      return "정보";
  }
}

export function PoliticalAtlas({
  presentation,
  selectedRegionId,
  onSelectRegion,
  onClearFocus,
  projects,
  visualDeltas,
  focusRegionId,
  previewRegionIds,
}: {
  readonly presentation: PresentationState;
  readonly selectedRegionId: RegionId | null;
  readonly onSelectRegion: (regionId: RegionId) => void;
  readonly onClearFocus: () => void;
  readonly projects: readonly StateProjectPresentation[];
  readonly visualDeltas: readonly WorldVisualDelta[];
  readonly focusRegionId: RegionId | null;
  readonly previewRegionIds: readonly RegionId[];
}) {
  const [zoom, setZoom] = useState(1);
  const regions = new Map(
    presentation.regions.map((region) => [region.regionId, region]),
  );
  const countries = new Map(
    presentation.countries.map((country) => [country.countryId, country]),
  );
  const visuals = countryVisuals(presentation.countries);
  const centers = regionCenters(presentation);
  const bounds = mapBounds(presentation);
  const activeDeltaRegions = new Set(
    visualDeltas.flatMap((delta) => delta.regionIds),
  );
  const previewRegions = new Set(previewRegionIds);
  const focusedCenter =
    focusRegionId === null ? undefined : centers.get(focusRegionId);
  const politicalCenters = countryCenters(presentation, centers);
  const hexesByCoordinate = new Map(
    presentation.landHexes.map((hex) => [
      coordinateKey(hex.coordinate.q, hex.coordinate.r),
      hex,
    ]),
  );
  const neighborOffsets = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 },
  ] as const;
  const debugLayers =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("designDebug") === "1";

  return (
    <div className="atlas-frame">
      <div className="map-wrap">
        <svg
          className="hex-map political-atlas"
          viewBox={cameraViewBox(bounds, focusedCenter, zoom)}
          role="img"
          aria-label="아르켄 왕국과 벨로리아·카르센 접경국의 정치 지도"
          data-camera-focus={focusRegionId ?? "world"}
          data-camera-zoom={zoom.toFixed(2)}
        >
          <defs>
            <pattern
              id="controller-faction-pattern"
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(35)"
            >
              <rect width="8" height="8" fill="#7f332f" />
              <path d="M0 0V8" stroke="#f4d4c2" strokeWidth="2" opacity="0.5" />
            </pattern>
          </defs>
          <rect
            className="map-paper"
            x="0"
            y="0"
            width="800"
            height="480"
            rx="12"
            data-layer-id="tmr.layer.map.atmosphere"
          />
          <g
            data-layer-id="tmr.layer.map.terrain"
            className="atlas-terrain-layer"
          >
            {presentation.landHexes.map((hex) => {
              const center = centerFor(hex.coordinate.q, hex.coordinate.r);
              const vertices = verticesFor(center);
              return (
                <polygon
                  key={`terrain-${hex.landHexId}`}
                  className={`atlas-terrain terrain-${hex.terrain}`}
                  points={pointsString(vertices)}
                  aria-hidden="true"
                />
              );
            })}
          </g>
          <g
            data-layer-id="tmr.layer.map.political"
            className="atlas-political-layer"
          >
            {presentation.landHexes.map((hex) => {
              const owner = regions.get(hex.regionId)?.ownerCountryId;
              const fill =
                owner === undefined
                  ? "#7c8378"
                  : (visuals.get(owner)?.fill ?? "#9a8a72");
              const center = centerFor(hex.coordinate.q, hex.coordinate.r);
              const vertices = verticesFor(center);
              return (
                <polygon
                  key={`political-${hex.landHexId}`}
                  className={`atlas-political-fill${activeDeltaRegions.has(hex.regionId) ? " atlas-delta-focus" : ""}${previewRegions.has(hex.regionId) ? " atlas-preview-focus" : ""}`}
                  points={pointsString(vertices)}
                  fill={fill}
                  aria-hidden="true"
                />
              );
            })}
          </g>
          <g
            data-layer-id="tmr.layer.map.political"
            className="atlas-ideology-layer"
            aria-label="지역별 정치 흐름"
          >
            {presentation.regions.flatMap((region) => {
              const strongest = strongestIdeology(region);
              if (strongest === null || strongest.support <= 0) return [];
              const color = ideologyColor(strongest.ideologyId);
              return presentation.landHexes
                .filter((hex) => hex.regionId === region.regionId)
                .map((hex) => (
                  <polygon
                    key={`ideology-${hex.landHexId}`}
                    className={`atlas-ideology-overlay${activeDeltaRegions.has(region.regionId) ? " atlas-delta-focus" : ""}${previewRegions.has(region.regionId) ? " atlas-preview-focus" : ""}`}
                    points={pointsString(
                      verticesFor(
                        centerFor(hex.coordinate.q, hex.coordinate.r),
                      ),
                    )}
                    fill={color}
                    opacity={0.12 + strongest.support * 0.25}
                    data-ideology-id={strongest.ideologyId}
                    data-support={strongest.support.toFixed(4)}
                    aria-hidden="true"
                  />
                ));
            })}
          </g>
          <g
            data-layer-id="tmr.layer.map.political"
            className="atlas-controller-layer"
            aria-label="현재 물리 통제"
          >
            {presentation.landHexes.map((hex) => {
              const owner = regions.get(hex.regionId)?.ownerCountryId;
              const sameAsOwner =
                hex.controller.kind === "country" &&
                hex.controller.countryId === owner;
              const fill =
                hex.controller.kind === "country"
                  ? (visuals.get(hex.controller.countryId)?.accent ?? "#6d4e3a")
                  : hex.controller.kind === "faction"
                    ? "#7f332f"
                    : "#5d655e";
              const center = centerFor(hex.coordinate.q, hex.coordinate.r);
              return (
                <polygon
                  key={`controller-${hex.landHexId}`}
                  className={`atlas-controller-overlay controller-${hex.controller.kind}${sameAsOwner ? " controller-same" : ""}${activeDeltaRegions.has(hex.regionId) ? " atlas-delta-focus" : ""}${previewRegions.has(hex.regionId) ? " atlas-preview-focus" : ""}`}
                  points={pointsString(verticesFor(center))}
                  fill={sameAsOwner ? "none" : fill}
                  data-controller-kind={hex.controller.kind}
                  data-controller-id={controllerId(hex)}
                  data-owner-id={owner ?? "unknown"}
                  aria-label={`${controllerLabel(hex)} · ${controllerId(hex)}`}
                />
              );
            })}
          </g>
          <g
            data-layer-id="tmr.layer.map.routes"
            className="atlas-routes-layer"
          >
            {presentation.contactRoutes.map((route) => {
              const source = centers.get(route.sourceRegionId);
              const target = centers.get(route.targetRegionId);
              if (source === undefined || target === undefined) return null;
              return (
                <line
                  key={route.routeId}
                  className={`atlas-route ${route.active ? "route-active" : "route-muted"}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  strokeWidth={Math.max(1.5, route.effectiveStrength * 4)}
                  data-route-channel={route.channel}
                  aria-label={`${channelLabel(route.channel)} 경로`}
                />
              );
            })}
          </g>
          <g
            data-layer-id="tmr.layer.map.pressure"
            className="atlas-pressure-layer"
          >
            {presentation.fronts.map((front) => {
              const first = presentation.landHexes.find(
                (hex) => hex.landHexId === front.firstLandHexId,
              );
              const second = presentation.landHexes.find(
                (hex) => hex.landHexId === front.secondLandHexId,
              );
              if (first === undefined || second === undefined) return null;
              const firstCenter = centerFor(
                first.coordinate.q,
                first.coordinate.r,
              );
              const secondCenter = centerFor(
                second.coordinate.q,
                second.coordinate.r,
              );
              return (
                <line
                  key={front.frontId}
                  className="atlas-front"
                  x1={firstCenter.x}
                  y1={firstCenter.y}
                  x2={secondCenter.x}
                  y2={secondCenter.y}
                />
              );
            })}
            {presentation.regions.map((region) => {
              const center = centers.get(region.regionId);
              if (center === undefined) return null;
              const pressure = Math.max(region.unrest, region.scarcity);
              return (
                <circle
                  key={`pressure-${region.regionId}`}
                  className={`atlas-pressure-pulse${activeDeltaRegions.has(region.regionId) ? " atlas-delta-focus" : ""}${previewRegions.has(region.regionId) ? " atlas-preview-focus" : ""}`}
                  cx={center.x}
                  cy={center.y}
                  r={5 + pressure * 18}
                  opacity={0.18 + pressure * 0.5}
                  data-pressure={pressure.toFixed(4)}
                  data-unrest={region.unrest.toFixed(4)}
                  data-scarcity={region.scarcity.toFixed(4)}
                >
                  <title>{`${region.name} 불안 ${Math.round(region.unrest * 100)}% · 희소성 ${Math.round(region.scarcity * 100)}%`}</title>
                </circle>
              );
            })}
            {presentation.organizationTokens.map((token) => {
              const center = centers.get(token.regionId);
              if (center === undefined) return null;
              const emblem = token.factionId.includes("coup")
                ? FACTION_EMBLEM_ASSET_IDS.defenders
                : FACTION_EMBLEM_ASSET_IDS.workers;
              return (
                <g
                  key={token.tokenId}
                  transform={`translate(${center.x + 22} ${center.y - 18})`}
                >
                  <circle className="atlas-token" r="15" />
                  <image
                    href={getAssetPath(emblem)}
                    x="-10"
                    y="-10"
                    width="20"
                    height="20"
                    preserveAspectRatio="xMidYMid meet"
                    data-asset-id={emblem}
                  />
                  <title>{`${token.organization.toFixed(2)} 조직도`}</title>
                </g>
              );
            })}
          </g>
          <g
            data-layer-id="tmr.layer.map.political"
            className="atlas-border-layer"
          >
            {presentation.landHexes.flatMap((hex) => {
              const owner = regions.get(hex.regionId)?.ownerCountryId;
              const center = centerFor(hex.coordinate.q, hex.coordinate.r);
              const vertices = verticesFor(center);
              return neighborOffsets.flatMap((offset, side) => {
                const neighbor = hexesByCoordinate.get(
                  coordinateKey(
                    hex.coordinate.q + offset.q,
                    hex.coordinate.r + offset.r,
                  ),
                );
                const neighborOwner =
                  neighbor === undefined
                    ? undefined
                    : regions.get(neighbor.regionId)?.ownerCountryId;
                if (
                  neighbor !== undefined &&
                  owner === neighborOwner &&
                  neighbor.landHexId < hex.landHexId
                ) {
                  return [];
                }
                if (neighbor !== undefined && owner === neighborOwner) {
                  return [];
                }
                const first = vertices[side]!;
                const second = vertices[(side + 1) % vertices.length]!;
                return [
                  <line
                    key={`${hex.landHexId}-border-${side}`}
                    className={
                      neighbor === undefined
                        ? "atlas-border atlas-border-outside"
                        : "atlas-border"
                    }
                    x1={first.x}
                    y1={first.y}
                    x2={second.x}
                    y2={second.y}
                  />,
                ];
              });
            })}
          </g>
          <g
            data-layer-id="tmr.layer.map.settlements"
            className="atlas-settlements-layer"
          >
            {presentation.countries.map((country) => {
              if (country.capitalRegionId === null) return null;
              const center = centers.get(country.capitalRegionId);
              if (center === undefined) return null;
              return (
                <g
                  key={`capital-${country.countryId}`}
                  transform={`translate(${center.x} ${center.y})`}
                >
                  <circle className="atlas-capital" r="8" />
                  <circle className="atlas-capital-core" r="3" />
                  <title>{`${country.name} 수도`}</title>
                </g>
              );
            })}
            {projects
              .filter((project) => project.status !== "not-started")
              .map((project) => {
                const center = centers.get(project.anchorRegionId);
                if (center === undefined) return null;
                return (
                  <g
                    key={project.id}
                    className={`atlas-project-marker atlas-project-${project.status}`}
                    transform={`translate(${center.x + 28} ${center.y + 20})`}
                    data-project-id={project.id}
                    data-source-intervention-id={project.sourceInterventionId}
                  >
                    <rect x="-13" y="-13" width="26" height="26" rx="6" />
                    <text y="5" textAnchor="middle">
                      {project.landmarkKind === "food"
                        ? "粮"
                        : project.landmarkKind === "industrial"
                          ? "산"
                          : "헌"}
                    </text>
                    <title>{`${project.name} · ${Math.round(project.progress * 100)}%`}</title>
                  </g>
                );
              })}
          </g>
          <g
            data-layer-id="tmr.layer.map.labels"
            className="atlas-labels-layer"
          >
            {presentation.countries.map((country) => {
              const center = politicalCenters.get(country.countryId);
              const visual = visuals.get(country.countryId);
              if (center === undefined || visual === undefined) return null;
              return (
                <g
                  key={`country-label-${country.countryId}`}
                  transform={`translate(${center.x} ${center.y - 55})`}
                >
                  <image
                    className="country-crest"
                    href={getAssetPath(visual.crestAssetId)}
                    x="-18"
                    y="-18"
                    width="36"
                    height="36"
                    preserveAspectRatio="xMidYMid meet"
                    data-asset-id={visual.crestAssetId}
                  />
                  <text className="country-label" y="27">
                    {country.name}
                  </text>
                </g>
              );
            })}
            {presentation.regions.map((region) => {
              const center = centers.get(region.regionId);
              if (center === undefined) return null;
              return (
                <text
                  key={`region-label-${region.regionId}`}
                  className={`region-label${selectedRegionId === region.regionId ? " region-label-selected" : ""}`}
                  x={center.x}
                  y={center.y + 27}
                  textAnchor="middle"
                  aria-label={region.name}
                >
                  {regionLabelLines(region.name).map((line, index) => (
                    <tspan
                      key={`${region.regionId}-label-line-${line}`}
                      x={center.x}
                      dy={index === 0 ? 0 : 12}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              );
            })}
          </g>
          <g
            data-layer-id="tmr.layer.ui.overlay"
            className="atlas-interaction-layer"
          >
            {presentation.landHexes.map((hex) => {
              const center = centerFor(hex.coordinate.q, hex.coordinate.r);
              const owner = regions.get(hex.regionId)?.ownerCountryId;
              return (
                <polygon
                  key={`interactive-${hex.landHexId}`}
                  className={`atlas-hit-area${selectedRegionId === hex.regionId ? " atlas-hit-selected" : ""}${activeDeltaRegions.has(hex.regionId) ? " atlas-delta-hit" : ""}${previewRegions.has(hex.regionId) ? " atlas-preview-hit" : ""}`}
                  points={pointsString(verticesFor(center))}
                  tabIndex={0}
                  role="button"
                  aria-label={`${regionName(regions, hex.regionId)} · ${owner === undefined ? "지역" : countryName(countries, owner)} · ${terrainLabel(hex.terrain)} · ${controllerLabel(hex)}`}
                  onClick={() => onSelectRegion(hex.regionId)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectRegion(hex.regionId);
                    }
                  }}
                />
              );
            })}
            {focusRegionId === null || focusedCenter === undefined ? null : (
              <circle
                className="atlas-focus-ring"
                cx={focusedCenter.x}
                cy={focusedCenter.y}
                r={HEX_SIZE * 1.35}
                data-focus-region-id={focusRegionId}
              />
            )}
          </g>
        </svg>
        <div className="map-camera-controls" aria-label="지도 카메라">
          <span className="eyebrow">지도 시선</span>
          <button
            type="button"
            aria-label="지도 축소"
            data-map-zoom="out"
            onClick={() => setZoom((value) => Math.max(1, value / 1.18))}
          >
            −
          </button>
          <button
            type="button"
            aria-label="지도 확대"
            data-map-zoom="in"
            onClick={() => setZoom((value) => Math.min(2.4, value * 1.18))}
          >
            +
          </button>
          <button
            type="button"
            data-map-focus="world"
            onClick={() => {
              setZoom(1);
              onClearFocus();
            }}
          >
            전체 보기
          </button>
          <span className="map-camera-status">
            {focusRegionId === null
              ? "전체 세계"
              : `${regionName(regions, focusRegionId)} 중심`}
          </span>
        </div>
        <div className="map-legend" aria-label="지도 범례">
          {presentation.countries.map((country, index) => (
            <span key={country.countryId}>
              <i
                className="legend-swatch"
                style={{
                  backgroundColor: COUNTRY_TINTS[index % COUNTRY_TINTS.length],
                }}
              />
              {country.name}
            </span>
          ))}
          <span>
            <i className="legend-line legend-line-route" /> 실제 경로
          </span>
          <span>
            <i className="legend-line legend-line-border" /> 국경
          </span>
          <span>
            <i className="legend-controller" /> 현재 물리 통제
          </span>
          <span>
            <i className="legend-ideology" /> 정치 흐름
          </span>
        </div>
      </div>
      {debugLayers ? (
        <details className="design-debug" open>
          <summary>지도 계층 검사</summary>
          <ul>
            {TMR_LAYER_REGISTRY.map((layer) => (
              <li key={layer.id}>
                <span>{layer.zIndex.toString().padStart(2, "0")}</span>
                {layer.name}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

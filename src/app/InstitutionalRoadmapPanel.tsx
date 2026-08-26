import { useMemo, useRef, useState, type PointerEvent } from "react";

import type {
  PolicyAvailabilityFailure,
  PolicyDomain,
} from "../sim/state/policy";
import { RULE_LABELS, RULE_VALUE_LABELS } from "./gamePresentation";
import {
  roadmapStatusLabel,
  type InstitutionalRoadmap,
  type InstitutionalRoadmapNode,
} from "./institutionalRoadmap";

interface GraphPosition {
  readonly x: number;
  readonly y: number;
  readonly depth: number;
  readonly domain: PolicyDomain;
  readonly track: number;
  readonly row: number;
}

interface DomainLane {
  readonly domain: PolicyDomain;
  readonly label: string;
  readonly top: number;
  readonly height: number;
}

interface GraphLayout {
  readonly positions: ReadonlyMap<string, GraphPosition>;
  readonly lanes: readonly DomainLane[];
  readonly width: number;
  readonly height: number;
  readonly maxDepth: number;
}

const DOMAIN_ORDER: readonly PolicyDomain[] = [
  "authority",
  "property",
  "labor",
  "information",
  "taxation",
  "localGovernment",
];

const DOMAIN_LABELS: Readonly<Record<PolicyDomain, string>> = {
  authority: "권위 · 대표",
  property: "재산 · 토지",
  labor: "노동 조직",
  information: "정보 · 언론",
  taxation: "조세",
  localGovernment: "지방 행정",
};

const NODE_WIDTH = 184;
const NODE_HEIGHT = 106;
const NODE_GAP = 14;
const DEPTH_BAND_GAP = 34;
const DEPTH_TRACKS = 3;
const DOMAIN_GUTTER = 158;
const LANE_PADDING = 28;
const LANE_GAP = 20;

function policyMutationSummary(node: InstitutionalRoadmapNode): string {
  const summary = Object.entries(node.definition.ruleMutations)
    .map(
      ([rule, value]) =>
        `${RULE_LABELS[rule] ?? "제도"} · ${RULE_VALUE_LABELS[String(value)] ?? String(value)}`,
    )
    .join(" · ");
  return summary || node.definition.description;
}

function reasonLabel(reason: PolicyAvailabilityFailure): string {
  switch (reason) {
    case "ALREADY_ACTIVE":
      return "이미 시행 중";
    case "PREREQUISITE_NOT_MET":
      return "선행 제도 필요";
    case "INCOMPATIBLE_POLICY":
      return "다른 제도와 충돌";
  }
}

function graphPositions(roadmap: InstitutionalRoadmap): GraphLayout {
  const nodeIds = new Set(roadmap.nodes.map((node) => node.definition.id));
  const prerequisites = new Map<string, string[]>();
  for (const edge of roadmap.edges) {
    if (edge.kind !== "prerequisite" || !nodeIds.has(edge.fromPolicyId)) {
      continue;
    }
    const current = prerequisites.get(edge.toPolicyId) ?? [];
    current.push(edge.fromPolicyId);
    prerequisites.set(edge.toPolicyId, current);
  }

  const depthCache = new Map<string, number>();
  const depthFor = (id: string, visiting = new Set<string>()): number => {
    const cached = depthCache.get(id);
    if (cached !== undefined) return cached;
    if (visiting.has(id)) return 0;
    const nextVisiting = new Set(visiting).add(id);
    const depth = Math.max(
      0,
      ...(prerequisites.get(id) ?? []).map(
        (parent) => depthFor(parent, nextVisiting) + 1,
      ),
    );
    depthCache.set(id, depth);
    return depth;
  };

  const groups = new Map<PolicyDomain, Map<number, string[]>>();
  for (const node of roadmap.nodes) {
    const domainGroups = groups.get(node.definition.domain) ?? new Map();
    const depth = depthFor(node.definition.id);
    const ids = domainGroups.get(depth) ?? [];
    ids.push(node.definition.id);
    domainGroups.set(depth, ids);
    groups.set(node.definition.domain, domainGroups);
  }

  const domains = DOMAIN_ORDER.filter((domain) => groups.has(domain));
  const depthBandWidth =
    DEPTH_TRACKS * NODE_WIDTH + (DEPTH_TRACKS - 1) * NODE_GAP + DEPTH_BAND_GAP;
  const maxDepth = Math.max(0, ...[...depthCache.values()]);
  const laneHeights = new Map<PolicyDomain, number>();
  for (const domain of domains) {
    const domainGroups = groups.get(domain);
    const maxRows = Math.max(
      1,
      ...(domainGroups === undefined
        ? []
        : [...domainGroups.values()].map((ids) =>
            Math.ceil(ids.length / DEPTH_TRACKS),
          )),
    );
    laneHeights.set(
      domain,
      LANE_PADDING * 2 + maxRows * NODE_HEIGHT + (maxRows - 1) * NODE_GAP,
    );
  }

  const lanes: DomainLane[] = [];
  let laneTop = 0;
  for (const domain of domains) {
    const height = laneHeights.get(domain) ?? 0;
    lanes.push({
      domain,
      label: DOMAIN_LABELS[domain],
      top: laneTop,
      height,
    });
    laneTop += height + LANE_GAP;
  }

  const positions = new Map<string, GraphPosition>();
  for (const lane of lanes) {
    const domainGroups = groups.get(lane.domain);
    if (domainGroups === undefined) continue;
    for (const [depth, ids] of domainGroups) {
      ids.sort();
      ids.forEach((id, index) => {
        const track = index % DEPTH_TRACKS;
        const row = Math.floor(index / DEPTH_TRACKS);
        positions.set(id, {
          x:
            DOMAIN_GUTTER +
            depth * depthBandWidth +
            track * (NODE_WIDTH + NODE_GAP) +
            NODE_WIDTH / 2,
          y:
            lane.top +
            LANE_PADDING +
            row * (NODE_HEIGHT + NODE_GAP) +
            NODE_HEIGHT / 2,
          depth,
          domain: lane.domain,
          track,
          row,
        });
      });
    }
  }

  return {
    positions,
    lanes,
    width: DOMAIN_GUTTER + (maxDepth + 1) * depthBandWidth + DEPTH_BAND_GAP,
    height: Math.max(1, laneTop - LANE_GAP),
    maxDepth,
  };
}

function initialZoom(): number {
  if (typeof window === "undefined") return 0.72;
  return window.innerWidth <= 760 ? 0.56 : 0.72;
}

export function InstitutionalRoadmapPanel({
  roadmap,
}: {
  readonly roadmap: InstitutionalRoadmap;
}) {
  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const pointerRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const layout = useMemo(() => graphPositions(roadmap), [roadmap]);
  const nodesById = useMemo(
    () => new Map(roadmap.nodes.map((node) => [node.definition.id, node])),
    [roadmap.nodes],
  );

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerRef.current;
    if (start === null || start.id !== event.pointerId) return;
    setPan((current) => ({
      x: current.x + event.clientX - start.x,
      y: current.y + event.clientY - start.y,
    }));
    pointerRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerRef.current?.id === event.pointerId) pointerRef.current = null;
  };

  return (
    <section
      className="roadmap-panel institutional-web-panel"
      aria-label="Institutional Web 제도망"
      data-roadmap-layout="domain-lanes-depth-columns"
      data-roadmap-node-count={roadmap.nodes.length}
      data-roadmap-node-overlap="0"
    >
      <div className="roadmap-panel-heading">
        <div>
          <span className="eyebrow">
            Institutional Web · 실제 정책 카탈로그
          </span>
          <h2>제도망</h2>
          <p>
            세로 lane은 제도 영역, 가로 depth는 실제 선행 관계입니다. 정책
            연결과 충돌은 simulation catalog에서 그대로 읽습니다.
          </p>
        </div>
        <div className="roadmap-panel-count">
          <strong>{roadmap.nodes.length}</strong>
          <span>정책</span>
        </div>
      </div>

      <div className="roadmap-toolbar" aria-label="제도 그래프 조작">
        <span className="roadmap-axis-note">왼쪽 · 선행 얕음</span>
        <button
          type="button"
          aria-label="제도망 축소"
          onClick={() => setZoom((value) => Math.max(0.45, value / 1.15))}
        >
          −
        </button>
        <button
          type="button"
          aria-label="제도망 확대"
          onClick={() => setZoom((value) => Math.min(1.2, value * 1.15))}
        >
          +
        </button>
        <button
          type="button"
          onClick={() => {
            setPan({ x: 0, y: 0 });
            setZoom(initialZoom());
          }}
        >
          전체 경로
        </button>
        <span className="roadmap-toolbar-count">
          depth 0–{layout.maxDepth} · {roadmap.edges.length}개 연결
        </span>
      </div>

      <div
        className="roadmap-graph-viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label="제도 영역별 선행 및 충돌 관계 그래프"
      >
        <div
          className="roadmap-graph-canvas"
          style={{
            width: `${layout.width}px`,
            height: `${layout.height}px`,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {layout.lanes.map((lane) => (
            <div
              className="roadmap-domain-lane"
              key={lane.domain}
              data-roadmap-domain={lane.domain}
              style={{
                top: `${lane.top}px`,
                height: `${lane.height}px`,
                width: `${layout.width}px`,
              }}
            >
              <strong>{lane.label}</strong>
              <span />
            </div>
          ))}
          <svg
            className="roadmap-edge-layer"
            width={layout.width}
            height={layout.height}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            aria-hidden="true"
          >
            <defs>
              <marker
                id="roadmap-arrow"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M0,0 L8,4 L0,8 z" fill="#d5a04e" />
              </marker>
            </defs>
            {roadmap.edges.map((edge) => {
              const from = layout.positions.get(edge.fromPolicyId);
              const to = layout.positions.get(edge.toPolicyId);
              if (from === undefined || to === undefined) return null;
              return (
                <line
                  key={edge.id}
                  className={`roadmap-graph-edge roadmap-graph-edge-${edge.kind}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  markerEnd={
                    edge.kind === "prerequisite"
                      ? "url(#roadmap-arrow)"
                      : undefined
                  }
                />
              );
            })}
          </svg>
          {roadmap.nodes.map((node) => {
            const position = layout.positions.get(node.definition.id);
            if (position === undefined) return null;
            return (
              <article
                className={`roadmap-node roadmap-${node.status.toLowerCase()}`}
                key={node.definition.id}
                data-policy-id={node.definition.id}
                data-roadmap-domain={position.domain}
                data-roadmap-depth={position.depth}
                data-roadmap-status={node.status}
                style={{ left: `${position.x}px`, top: `${position.y}px` }}
              >
                <div className="roadmap-node-head">
                  <strong>{node.definition.name}</strong>
                  <span>{roadmapStatusLabel(node.status)}</span>
                </div>
                <small>{policyMutationSummary(node)}</small>
                {node.enactedAtTick === null ? null : (
                  <em>{node.enactedAtTick}일차 시행</em>
                )}
                {node.reasons.length === 0 ? null : (
                  <em>{node.reasons.map(reasonLabel).join(" · ")}</em>
                )}
              </article>
            );
          })}
        </div>
      </div>

      <div className="roadmap-edge-legend" aria-label="제도 연결 범례">
        <span>
          <i className="roadmap-edge-key prerequisite" /> 선행 경로
        </span>
        <span>
          <i className="roadmap-edge-key incompatible" /> 충돌 관계
        </span>
        <span className="roadmap-legend-hint">드래그로 이동 · +/−로 확대</span>
      </div>

      <details className="roadmap-details">
        <summary>제도 연결 읽기</summary>
        <ul>
          {roadmap.edges.map((edge) => (
            <li key={edge.id}>
              {edge.kind === "prerequisite" ? "선행" : "충돌"} ·{" "}
              {nodesById.get(edge.fromPolicyId)?.definition.name ?? "제도"} →{" "}
              {nodesById.get(edge.toPolicyId)?.definition.name ?? "제도"}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

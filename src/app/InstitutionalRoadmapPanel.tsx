import { useMemo, useRef, useState, type PointerEvent } from "react";

import {
  roadmapStatusLabel,
  type InstitutionalRoadmap,
  type InstitutionalRoadmapNode,
} from "./institutionalRoadmap";
import type { PolicyAvailabilityFailure } from "../sim/state/policy";
import { RULE_LABELS, RULE_VALUE_LABELS } from "./gamePresentation";

interface GraphPosition {
  readonly x: number;
  readonly y: number;
}

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

function graphPositions(
  roadmap: InstitutionalRoadmap,
): ReadonlyMap<string, GraphPosition> {
  const nodeIds = new Set(roadmap.nodes.map((node) => node.definition.id));
  const prerequisites = new Map<string, string[]>();
  for (const edge of roadmap.edges) {
    if (edge.kind !== "prerequisite" || !nodeIds.has(edge.fromPolicyId))
      continue;
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
  const columns = new Map<number, string[]>();
  for (const node of roadmap.nodes) {
    const depth = depthFor(node.definition.id);
    const column = columns.get(depth) ?? [];
    column.push(node.definition.id);
    columns.set(depth, column);
  }
  const positions = new Map<string, GraphPosition>();
  for (const [depth, ids] of columns) {
    ids.sort();
    ids.forEach((id, index) => {
      positions.set(id, {
        x: 18 + depth * 31,
        y: 16 + (index + 1) * (68 / (ids.length + 1)),
      });
    });
  }
  return positions;
}

export function InstitutionalRoadmapPanel({
  roadmap,
}: {
  readonly roadmap: InstitutionalRoadmap;
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const pointerRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const positions = useMemo(() => graphPositions(roadmap), [roadmap]);
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
    <section className="roadmap-panel" aria-label="제도 경로">
      <div className="panel-heading compact-heading">
        <div>
          <span className="eyebrow">중기 방향</span>
          <h2>제도 경로</h2>
        </div>
        <span className="derived-label">제도 관계</span>
      </div>
      <p className="panel-intro">
        선행 제도와 충돌 관계를 현재 국가 기록에서 읽습니다. 숫자 점수나 별도
        진행 자원은 없습니다.
      </p>
      <div className="roadmap-toolbar" aria-label="제도 그래프 조작">
        <button
          type="button"
          onClick={() => setZoom((value) => Math.max(0.8, value / 1.15))}
        >
          −
        </button>
        <button
          type="button"
          onClick={() => setZoom((value) => Math.min(1.5, value * 1.15))}
        >
          +
        </button>
        <button
          type="button"
          onClick={() => {
            setPan({ x: 0, y: 0 });
            setZoom(1);
          }}
        >
          전체 경로
        </button>
        <span>
          {roadmap.nodes.length}개 제도 · {roadmap.edges.length}개 연결
        </span>
      </div>
      <div
        className="roadmap-graph-viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label="선행 및 충돌 관계 그래프"
      >
        <div
          className="roadmap-graph-canvas"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <svg
            className="roadmap-edge-layer"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <defs>
              <marker
                id="roadmap-arrow"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L6,3 L0,6 z" fill="#8b5c3b" />
              </marker>
            </defs>
            {roadmap.edges.map((edge) => {
              const from = positions.get(edge.fromPolicyId);
              const to = positions.get(edge.toPolicyId);
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
            const position = positions.get(node.definition.id);
            if (position === undefined) return null;
            return (
              <article
                className={`roadmap-node roadmap-${node.status.toLowerCase()}`}
                key={node.definition.id}
                data-policy-id={node.definition.id}
                data-roadmap-status={node.status}
                style={{ left: `${position.x}%`, top: `${position.y}%` }}
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

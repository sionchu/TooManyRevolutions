import { useMemo, useRef, useState, type PointerEvent } from "react";

import type { PolicyDefinition, PolicyPrerequisite } from "../sim/state/policy";
import type { PolicyId } from "../sim/state/ids";
import { TMR_ICON_IDS } from "../presentation/design/iconRegistry";
import { RULE_LABELS, RULE_VALUE_LABELS } from "./gamePresentation";
import { TmrIcon } from "./icons/TmrIcon";
import {
  deriveInstitutionalGraphLayout,
  INSTITUTIONAL_GRAPH_DEPTH_COLUMN_WIDTH,
  INSTITUTIONAL_GRAPH_NODE_HEIGHT,
  INSTITUTIONAL_GRAPH_NODE_WIDTH,
  INSTITUTIONAL_POLICY_DOMAIN_LABELS,
  roadmapStatusLabel,
  type InstitutionalGraphPosition,
  type InstitutionalRoadmap,
  type InstitutionalRoadmapNode,
} from "./institutionalRoadmap";

export function graphPositions(
  roadmap: InstitutionalRoadmap,
): ReadonlyMap<PolicyId, InstitutionalGraphPosition> {
  return deriveInstitutionalGraphLayout(roadmap).positions;
}

function prerequisiteLabel(
  prerequisite: PolicyPrerequisite,
  nodeById: ReadonlyMap<PolicyId, InstitutionalRoadmapNode>,
): string {
  switch (prerequisite.kind) {
    case "policyActive":
      return `${nodeById.get(prerequisite.policyId)?.definition.name ?? "선행 제도"} 시행`;
    case "policyInactive":
      return `${nodeById.get(prerequisite.policyId)?.definition.name ?? "선행 제도"} 미시행`;
    case "ruleEquals":
      return `${RULE_LABELS[prerequisite.rule] ?? "제도 규칙"} = ${RULE_VALUE_LABELS[String(prerequisite.value)] ?? String(prerequisite.value)}`;
    case "ruleNotEquals":
      return `${RULE_LABELS[prerequisite.rule] ?? "제도 규칙"} ≠ ${RULE_VALUE_LABELS[String(prerequisite.value)] ?? String(prerequisite.value)}`;
  }
}

function reasonLabel(
  reason: InstitutionalRoadmapNode["reasons"][number],
): string {
  switch (reason) {
    case "ALREADY_ACTIVE":
      return "이미 시행 중";
    case "PREREQUISITE_NOT_MET":
      return "선행 조건 미충족";
    case "INCOMPATIBLE_POLICY":
      return "현재 제도와 충돌";
  }
}

function ruleMutationLabels(definition: PolicyDefinition): readonly string[] {
  return Object.entries(definition.ruleMutations).map(
    ([rule, value]) =>
      `${RULE_LABELS[rule] ?? "제도 규칙"} → ${RULE_VALUE_LABELS[String(value)] ?? String(value)}`,
  );
}

function prerequisitePath(
  from: InstitutionalGraphPosition,
  to: InstitutionalGraphPosition,
): string {
  const startX = from.x + INSTITUTIONAL_GRAPH_NODE_WIDTH;
  const startY = from.y + INSTITUTIONAL_GRAPH_NODE_HEIGHT / 2;
  const endX = to.x;
  const endY = to.y + INSTITUTIONAL_GRAPH_NODE_HEIGHT / 2;
  const bend = Math.max(20, (endX - startX) / 2);
  return `M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`;
}

function incompatibilityPath(
  from: InstitutionalGraphPosition,
  to: InstitutionalGraphPosition,
): string {
  const startX = from.x + INSTITUTIONAL_GRAPH_NODE_WIDTH / 2;
  const startY = from.y + INSTITUTIONAL_GRAPH_NODE_HEIGHT / 2;
  const endX = to.x + INSTITUTIONAL_GRAPH_NODE_WIDTH / 2;
  const endY = to.y + INSTITUTIONAL_GRAPH_NODE_HEIGHT / 2;
  return `M ${startX} ${startY} L ${endX} ${endY}`;
}

export function InstitutionalRoadmapPanel({
  roadmap,
  onSubmitPolicy,
}: {
  readonly roadmap: InstitutionalRoadmap;
  readonly onSubmitPolicy?: (policyId: PolicyDefinition["id"]) => void;
}) {
  const layout = useMemo(
    () => deriveInstitutionalGraphLayout(roadmap),
    [roadmap],
  );
  const nodeById = useMemo(
    () =>
      new Map(roadmap.nodes.map((node) => [node.definition.id, node] as const)),
    [roadmap.nodes],
  );
  const [selectedPolicyId, setSelectedPolicyId] = useState<PolicyId | null>(
    () => roadmap.nodes[0]?.definition.id ?? null,
  );
  const [scale, setScale] = useState(0.86);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{
    readonly pointerId: number;
    readonly startX: number;
    readonly startY: number;
    readonly originX: number;
    readonly originY: number;
  } | null>(null);

  const selectedNode =
    (selectedPolicyId === null ? undefined : nodeById.get(selectedPolicyId)) ??
    roadmap.nodes[0] ??
    null;

  const adjustScale = (delta: number) => {
    setScale((current) =>
      Math.min(1.2, Math.max(0.7, Number((current + delta).toFixed(2)))),
    );
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag === null || drag.pointerId !== event.pointerId) return;
    setPan({
      x: drag.originX + event.clientX - drag.startX,
      y: drag.originY + event.clientY - drag.startY,
    });
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <section
      className="roadmap-panel"
      aria-label="제도 경로"
      data-roadmap-layout="domain-lanes-prerequisite-depth"
    >
      <header className="roadmap-panel-heading">
        <div>
          <span className="eyebrow">제도 체계</span>
          <h2>제도 경로</h2>
        </div>
        <span className="roadmap-count">
          {roadmap.nodes.length}개 제도 · {roadmap.edges.length}개 연결
        </span>
      </header>
      <p className="panel-intro">
        세로 분야는 정책 영역, 가로 단계는 실제 선행 제도입니다. 노드를 선택하면
        현재 국가 기록과 시행 조건을 읽을 수 있습니다.
      </p>
      <div className="roadmap-toolbar" aria-label="제도 그래프 조작">
        <span>가로: 선행 단계 {layout.maxDepth + 1}단계 · 세로: 정책 분야</span>
        <div className="roadmap-zoom-controls">
          <button type="button" onClick={() => adjustScale(-0.1)}>
            축소
          </button>
          <output aria-label="그래프 확대 비율">
            {Math.round(scale * 100)}%
          </output>
          <button type="button" onClick={() => adjustScale(0.1)}>
            확대
          </button>
          <button type="button" onClick={() => setPan({ x: 0, y: 0 })}>
            위치 초기화
          </button>
        </div>
      </div>
      <div className="institutions-workspace">
        <div
          className="roadmap-graph-viewport"
          role="application"
          aria-label="정책 분야와 선행 단계로 정렬된 제도 그래프"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div
            className="roadmap-graph-stage"
            style={{
              width: layout.width * scale,
              height: layout.height * scale,
              transform: `translate(${pan.x}px, ${pan.y}px)`,
            }}
          >
            <svg
              className="roadmap-graph-canvas"
              width={layout.width * scale}
              height={layout.height * scale}
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              aria-label="정책 분야별 제도 그래프"
            >
              <defs>
                <marker
                  id="roadmap-prerequisite-arrow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="4"
                  orient="auto"
                >
                  <path d="M 0 0 L 8 4 L 0 8 z" />
                </marker>
              </defs>
              <g className="roadmap-depth-headings" aria-hidden="true">
                {Array.from({ length: layout.maxDepth + 1 }, (_, depth) => (
                  <text
                    key={`depth-${depth}`}
                    x={172 + depth * INSTITUTIONAL_GRAPH_DEPTH_COLUMN_WIDTH}
                    y={12}
                  >
                    선행 depth {depth + 1}
                  </text>
                ))}
              </g>
              <g className="roadmap-lane-layer" aria-hidden="true">
                {layout.lanes.map((lane) => (
                  <g key={lane.domain}>
                    <rect
                      className="roadmap-lane"
                      x="0"
                      y={lane.y}
                      width={layout.width}
                      height={lane.height}
                      rx="12"
                    />
                    <text className="roadmap-lane-label" x="18" y={lane.y + 22}>
                      {lane.label}
                    </text>
                    <text
                      className="roadmap-lane-count"
                      x="112"
                      y={lane.y + 22}
                    >
                      {lane.nodeCount > 0
                        ? `${lane.nodeCount}개 제도`
                        : "연결된 제도 없음"}
                    </text>
                  </g>
                ))}
              </g>
              <g className="roadmap-edge-layer" aria-hidden="true">
                {roadmap.edges.map((edge) => {
                  const from = layout.positions.get(edge.fromPolicyId);
                  const to = layout.positions.get(edge.toPolicyId);
                  if (from === undefined || to === undefined) return null;
                  return (
                    <path
                      key={edge.id}
                      className={`roadmap-graph-edge roadmap-graph-edge-${edge.kind}`}
                      d={
                        edge.kind === "prerequisite"
                          ? prerequisitePath(from, to)
                          : incompatibilityPath(from, to)
                      }
                      markerEnd={
                        edge.kind === "prerequisite"
                          ? "url(#roadmap-prerequisite-arrow)"
                          : undefined
                      }
                    />
                  );
                })}
              </g>
              <g className="roadmap-node-layer">
                {roadmap.nodes.map((node) => {
                  const position = layout.positions.get(node.definition.id);
                  if (position === undefined) return null;
                  const selected =
                    selectedNode?.definition.id === node.definition.id;
                  return (
                    <foreignObject
                      key={node.definition.id}
                      x={position.x}
                      y={position.y}
                      width={INSTITUTIONAL_GRAPH_NODE_WIDTH}
                      height={INSTITUTIONAL_GRAPH_NODE_HEIGHT}
                    >
                      <button
                        className={`roadmap-node roadmap-${node.status.toLowerCase()}${selected ? " selected" : ""}`}
                        type="button"
                        aria-pressed={selected}
                        data-policy-id={node.definition.id}
                        data-roadmap-domain={position.domain}
                        data-roadmap-depth={position.depth}
                        onClick={() => setSelectedPolicyId(node.definition.id)}
                      >
                        <span className="roadmap-node-title">
                          {node.definition.name}
                        </span>
                        <span className="roadmap-node-state">
                          {roadmapStatusLabel(node.status)}
                        </span>
                      </button>
                    </foreignObject>
                  );
                })}
              </g>
            </svg>
          </div>
        </div>
        <aside
          className="roadmap-inspector"
          aria-label="선택된 제도 inspector"
          data-selected-policy-id={selectedNode?.definition.id ?? "none"}
        >
          {selectedNode === null ? (
            <div className="roadmap-inspector-empty">
              <span className="eyebrow">선택된 제도</span>
              <p>그래프에서 제도를 선택하십시오.</p>
            </div>
          ) : (
            <>
              <div className="roadmap-inspector-heading">
                <TmrIcon
                  iconId={TMR_ICON_IDS.ui.governance}
                  size={20}
                  decorative
                  tone="neutral"
                />
                <div>
                  <span className="eyebrow">선택된 제도</span>
                  <h3>{selectedNode.definition.name}</h3>
                </div>
              </div>
              <span
                className={`roadmap-inspector-status roadmap-${selectedNode.status.toLowerCase()}`}
              >
                {roadmapStatusLabel(selectedNode.status)}
              </span>
              <p className="roadmap-inspector-description">
                {selectedNode.definition.description}
              </p>
              <dl className="roadmap-inspector-facts">
                <div>
                  <dt>현재 상태</dt>
                  <dd>
                    {roadmapStatusLabel(selectedNode.status)}
                    {selectedNode.enactedAtTick === null
                      ? ""
                      : ` · ${selectedNode.enactedAtTick}일차 시행`}
                  </dd>
                </div>
                <div>
                  <dt>정책 분야 · 선행 단계</dt>
                  <dd>
                    {
                      INSTITUTIONAL_POLICY_DOMAIN_LABELS[
                        selectedNode.definition.domain
                      ]
                    }{" "}
                    ·{" "}
                    {(layout.positions.get(selectedNode.definition.id)?.depth ??
                      0) + 1}
                    단계
                  </dd>
                </div>
              </dl>
              <section className="roadmap-inspector-section">
                <h4>선행 조건</h4>
                <ul>
                  {(selectedNode.definition.prerequisites ?? []).length ===
                  0 ? (
                    <li>별도 선행 조건 없음</li>
                  ) : (
                    selectedNode.definition.prerequisites?.map(
                      (prerequisite, index) => (
                        <li
                          key={`${selectedNode.definition.id}-prerequisite-${index}`}
                        >
                          {prerequisiteLabel(prerequisite, nodeById)}
                        </li>
                      ),
                    )
                  )}
                </ul>
              </section>
              <section className="roadmap-inspector-section">
                <h4>충돌 관계</h4>
                <ul>
                  {(selectedNode.definition.incompatiblePolicyIds ?? [])
                    .length === 0 ? (
                    <li>선언된 충돌 없음</li>
                  ) : (
                    selectedNode.definition.incompatiblePolicyIds?.map(
                      (policyId) => (
                        <li
                          key={`${selectedNode.definition.id}-incompatible-${policyId}`}
                        >
                          {nodeById.get(policyId)?.definition.name ??
                            "충돌 제도"}
                        </li>
                      ),
                    )
                  )}
                </ul>
              </section>
              <section className="roadmap-inspector-section">
                <h4>정확한 규칙 효과</h4>
                <ul>
                  {ruleMutationLabels(selectedNode.definition).map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
              </section>
              {selectedNode.reasons.length === 0 ? null : (
                <p className="roadmap-inspector-note">
                  {selectedNode.reasons.map(reasonLabel).join(" · ")}
                </p>
              )}
              {selectedNode.status === "AVAILABLE" &&
              onSubmitPolicy !== undefined ? (
                <button
                  className="roadmap-enact-button"
                  type="button"
                  onClick={() => onSubmitPolicy(selectedNode.definition.id)}
                >
                  <TmrIcon
                    iconId={TMR_ICON_IDS.ui.governance}
                    size={16}
                    decorative
                    tone="accent"
                  />
                  <span>이 제도를 시행</span>
                </button>
              ) : null}
            </>
          )}
        </aside>
      </div>
      <details className="roadmap-details">
        <summary>제도 연결 읽기</summary>
        <div className="roadmap-reading-key">
          <span>
            <i className="roadmap-edge-key prerequisite" /> 선행 제도 연결
          </span>
          <span>
            <i className="roadmap-edge-key incompatible" /> 충돌 관계
          </span>
          <p>
            노드 안에는 제도명과 현재 상태만 표시합니다. 상세 설명과 실제 규칙
            효과는 선택된 제도 inspector에서 확인합니다.
          </p>
        </div>
      </details>
    </section>
  );
}

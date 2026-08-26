import type { InstitutionalRoadmap } from "./institutionalRoadmap";
import { roadmapStatusLabel } from "./institutionalRoadmap";
import { RULE_LABELS } from "./gamePresentation";

export function InstitutionalRoadmapPanel({
  roadmap,
}: {
  readonly roadmap: InstitutionalRoadmap;
}) {
  return (
    <section className="roadmap-panel" aria-label="제도 경로">
      <div className="panel-heading compact-heading">
        <div>
          <span className="eyebrow">중기 방향</span>
          <h2>Institutional Roadmap</h2>
        </div>
        <span className="derived-label">실제 정책 그래프</span>
      </div>
      <p className="panel-intro">
        연구 점수 없이, 현재 법과 정책의 선행 조건·충돌만 표시합니다.
      </p>
      <div className="roadmap-graph">
        {roadmap.nodes.map((node) => (
          <article
            className={`roadmap-node roadmap-${node.status.toLowerCase()}`}
            key={node.definition.id}
            data-policy-id={node.definition.id}
            data-roadmap-status={node.status}
          >
            <div className="roadmap-node-head">
              <strong>{node.definition.name}</strong>
              <span>{roadmapStatusLabel(node.status)}</span>
            </div>
            <small>
              {Object.entries(node.definition.ruleMutations)
                .map(
                  ([rule, value]) =>
                    `${RULE_LABELS[rule] ?? "제도"} → ${String(value)}`,
                )
                .join(" · ") || node.definition.description}
            </small>
            {node.enactedAtTick === null ? null : (
              <em>{node.enactedAtTick}일차 시행</em>
            )}
            {node.reasons.length === 0 ? null : (
              <em>{node.reasons.join(" · ")}</em>
            )}
          </article>
        ))}
      </div>
      <div className="roadmap-edges" aria-label="정책 연결">
        {roadmap.edges.map((edge) => (
          <span
            key={edge.id}
            className={`roadmap-edge roadmap-edge-${edge.kind}`}
            data-roadmap-edge={edge.kind}
          >
            {edge.kind === "prerequisite" ? "선행" : "충돌"} ·{" "}
            {edge.fromPolicyId} → {edge.toPolicyId}
          </span>
        ))}
      </div>
    </section>
  );
}

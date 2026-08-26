import type { StateProjectPresentation } from "./stateProjects";

function statusLabel(status: StateProjectPresentation["status"]): string {
  switch (status) {
    case "not-started":
      return "미착수";
    case "implementing":
      return "구현 중";
    case "completed":
      return "완료 흔적";
  }
}

export function StateProjectPanel({
  projects,
  onFocusRegion,
}: {
  readonly projects: readonly StateProjectPresentation[];
  readonly onFocusRegion?: (
    regionId: StateProjectPresentation["anchorRegionId"],
  ) => void;
}) {
  return (
    <section className="state-project-panel" aria-label="국가 사업">
      <div className="panel-heading compact-heading">
        <div>
          <span className="eyebrow">지도에 남는 축적</span>
          <h2>국가 사업</h2>
        </div>
        <span className="derived-label">실제 구현 기록</span>
      </div>
      <p className="panel-intro">
        별도 건설 자원 없이, 기존 개입의 실제 기간과 완료 기록만 투영합니다.
      </p>
      <div className="state-project-list">
        {projects.map((project) => (
          <article
            className={`state-project state-project-${project.status}`}
            key={project.id}
            data-project-id={project.id}
            data-project-status={project.status}
            data-source-intervention-id={project.sourceInterventionId}
          >
            <div className="state-project-head">
              <strong>{project.name}</strong>
              <span>{statusLabel(project.status)}</span>
            </div>
            <p>{project.description}</p>
            <div className="project-progress-track" aria-hidden="true">
              <span
                style={{ width: `${Math.round(project.progress * 100)}%` }}
              />
            </div>
            <small>
              {project.status === "not-started"
                ? "실제 개입을 시작하면 구현 단계가 표시됩니다."
                : project.status === "implementing"
                  ? `실제 ${project.sourceDefinition.durationDays}일 구현 · ${Math.round(project.progress * 100)}%`
                  : `완료 ${project.completionTick ?? "기록"}일차 · 지도 흔적 유지`}
            </small>
            {onFocusRegion === undefined ? null : (
              <button
                className="project-focus-button"
                type="button"
                onClick={() => onFocusRegion(project.anchorRegionId)}
              >
                지도에서 보기
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

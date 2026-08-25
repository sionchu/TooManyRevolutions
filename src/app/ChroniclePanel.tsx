import { PLAYER_COPY } from "../presentation/design/copyRegistry.ko";
import type { GameEvent } from "../sim/events/event";
import type { ScenarioDefinition } from "../sim/state/scenario";
import { eventLabel } from "./gamePresentation";

export function ChroniclePanel({
  events,
  scenario,
}: {
  readonly events: readonly GameEvent[];
  readonly scenario: ScenarioDefinition;
}) {
  return (
    <section className="panel event-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{PLAYER_COPY.main.chronicleEyebrow}</span>
          <h2>{PLAYER_COPY.main.chronicleTitle}</h2>
        </div>
        <span className="panel-count">{events.length}건</span>
      </div>
      <div className="event-list">
        {events.length === 0 ? (
          <p className="empty-state">아직 기록된 사건이 없습니다.</p>
        ) : (
          events.map((event) => {
            const mapped = eventLabel(event, scenario);
            return (
              <article
                className={`event-row${mapped.crisis ? " event-crisis" : ""}`}
                key={event.id}
              >
                <time>{event.tick}일</time>
                <div>
                  <strong>{mapped.title}</strong>
                  <span>{mapped.detail}</span>
                </div>
                <small>
                  {event.visibility === "important" ? "중요" : "일반"}
                </small>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

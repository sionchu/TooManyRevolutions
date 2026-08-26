import { PLAYER_COPY } from "../presentation/design/copyRegistry.ko";
import type { GameEvent } from "../sim/events/event";
import type { ScenarioDefinition } from "../sim/state/scenario";
import {
  deriveChronicleDigest,
  type ChronicleDigestItem,
} from "./chronicleDigest";

export function ChroniclePanel({
  events,
  digest,
  scenario,
}: {
  readonly events?: readonly GameEvent[];
  readonly digest?: readonly ChronicleDigestItem[];
  readonly scenario: ScenarioDefinition;
}) {
  const items = digest ?? deriveChronicleDigest(events ?? [], scenario);
  return (
    <section className="panel event-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{PLAYER_COPY.main.chronicleEyebrow}</span>
          <h2>{PLAYER_COPY.main.chronicleTitle}</h2>
        </div>
        <span className="panel-count">{items.length}묶음</span>
      </div>
      <div className="event-list">
        {items.length === 0 ? (
          <p className="empty-state">아직 기록된 사건이 없습니다.</p>
        ) : (
          items.map((item) => {
            return (
              <article
                className={`event-row chronicle-digest-row${item.crisis ? " event-crisis" : ""}`}
                key={item.id}
                data-chronicle-level={item.level}
                data-source-event-ids={item.sourceEventIds.join(",")}
              >
                <time>{item.tick}일</time>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                  <details className="chronicle-source-details">
                    <summary>원문 기록 {item.sourceEventIds.length}건</summary>
                    <small>{item.sourceEventIds.join(" · ")}</small>
                  </details>
                </div>
                <small>
                  {item.level === 1
                    ? "주요"
                    : item.level === 2
                      ? "전략"
                      : "추세"}
                </small>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

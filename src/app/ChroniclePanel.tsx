import { PLAYER_COPY } from "../presentation/design/copyRegistry.ko";
import {
  TMR_ICON_IDS,
  type TmrIconId,
} from "../presentation/design/iconRegistry";
import type { GameEvent } from "../sim/events/event";
import type { ScenarioDefinition } from "../sim/state/scenario";
import {
  deriveChronicleDigest,
  type ChronicleDigestItem,
} from "./chronicleDigest";
import { crisisIconIdForEvent } from "./crisisIcon";
import { TmrIcon } from "./icons/TmrIcon";

export function chronicleIconId(
  item: ChronicleDigestItem,
  events: readonly GameEvent[],
): TmrIconId {
  if (!item.crisis) return TMR_ICON_IDS.ui.chronicle;
  const sourceEvent = events.find((event) =>
    item.sourceEventIds.includes(event.id),
  );
  return crisisIconIdForEvent(sourceEvent) ?? TMR_ICON_IDS.ui.chronicle;
}

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
  const sourceEvents = events ?? [];
  return (
    <section className="panel event-panel chronicle-surface">
      <div className="chronicle-panel-heading">
        <div>
          <span className="eyebrow">{PLAYER_COPY.main.chronicleEyebrow}</span>
          <h2>{PLAYER_COPY.main.chronicleTitle}</h2>
          <p>정부의 이동과 제도의 변화가 실제 EventStore 순서로 남습니다.</p>
        </div>
        <div className="chronicle-panel-count">
          <strong>{items.length}</strong>
          <span>주요 흐름</span>
        </div>
      </div>
      <div className="chronicle-filter-note">
        <span>최신 기록부터</span>
        <span>주요 전환 · 충돌 · 제도 변화</span>
      </div>
      <ol className="chronicle-timeline">
        {items.length === 0 ? (
          <li className="empty-state">아직 기록된 사건이 없습니다.</li>
        ) : (
          items.map((item) => {
            const iconId = chronicleIconId(item, sourceEvents);
            const isSpecificCrisisIcon = iconId !== TMR_ICON_IDS.ui.chronicle;
            return (
              <li
                className={`chronicle-timeline-item${item.crisis ? " event-crisis" : ""}`}
                key={item.id}
                data-chronicle-level={item.level}
                data-source-event-ids={item.sourceEventIds.join(",")}
              >
                <div className="chronicle-row-meta">
                  <TmrIcon
                    className="chronicle-event-icon"
                    iconId={iconId}
                    size={16}
                    decorative
                    tone={isSpecificCrisisIcon ? "crisis" : "neutral"}
                  />
                  <time>{item.tick}일차</time>
                </div>
                <div className="chronicle-timeline-copy">
                  <div className="chronicle-timeline-title">
                    <strong>{item.title}</strong>
                    <span>
                      {item.level === 1
                        ? "주요 전환"
                        : item.level === 2
                          ? "전략 기록"
                          : "상태 흐름"}
                    </span>
                  </div>
                  <p>{item.detail}</p>
                  <details className="chronicle-source-details">
                    <summary>원문 기록 {item.sourceEventIds.length}건</summary>
                    <small>{item.sourceEventIds.join(" · ")}</small>
                  </details>
                </div>
              </li>
            );
          })
        )}
      </ol>
    </section>
  );
}

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
            const iconId = chronicleIconId(item, sourceEvents);
            const isSpecificCrisisIcon = iconId !== TMR_ICON_IDS.ui.chronicle;
            return (
              <article
                className={`event-row chronicle-digest-row${item.crisis ? " event-crisis" : ""}`}
                key={item.id}
                data-chronicle-level={item.level}
              >
                <div className="chronicle-row-meta">
                  <TmrIcon
                    className="chronicle-event-icon"
                    iconId={iconId}
                    size={16}
                    decorative
                    tone={isSpecificCrisisIcon ? "crisis" : "neutral"}
                  />
                  <time>{item.tick}일</time>
                </div>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
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

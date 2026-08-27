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

function hasInstitutionEvent(
  item: ChronicleDigestItem,
  events: readonly GameEvent[],
): boolean {
  return events.some(
    (event) =>
      item.sourceEventIds.includes(event.id) &&
      (event.type === "POLICY_ENACTED" ||
        event.type === "INSTITUTION_RULE_CHANGED"),
  );
}

function editorialKind(
  item: ChronicleDigestItem,
  events: readonly GameEvent[],
): "crisis" | "institution" | "major" | "trend" {
  if (item.crisis) return "crisis";
  if (hasInstitutionEvent(item, events)) return "institution";
  return item.level === 1 ? "major" : "trend";
}

function editorialLabel(kind: ReturnType<typeof editorialKind>): string {
  switch (kind) {
    case "crisis":
      return "위기 전환";
    case "institution":
      return "제도 기록";
    case "major":
      return "주요 전환";
    case "trend":
      return "추세 기록";
  }
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
  const lead = items.find((item) => item.level === 1) ?? items[0] ?? null;
  const timeline =
    lead === null ? items : items.filter((item) => item !== lead);

  return (
    <section
      className="chronicle-surface"
      aria-label="연대기"
      data-chronicle-surface="editorial-history"
    >
      <header className="chronicle-surface-heading">
        <div>
          <span className="eyebrow">{PLAYER_COPY.main.chronicleEyebrow}</span>
          <h2>{PLAYER_COPY.main.chronicleTitle}</h2>
        </div>
        <span className="chronicle-count">{items.length}개 기록</span>
      </header>
      {lead === null ? (
        <p className="empty-state">아직 기록된 사건이 없습니다.</p>
      ) : (
        <>
          {(() => {
            const kind = editorialKind(lead, sourceEvents);
            const iconId = chronicleIconId(lead, sourceEvents);
            return (
              <article
                className={`chronicle-lead chronicle-lead-${kind}`}
                data-chronicle-level={lead.level}
                data-chronicle-kind={kind}
              >
                <div className="chronicle-lead-meta">
                  <TmrIcon
                    className="chronicle-event-icon"
                    iconId={iconId}
                    size={24}
                    decorative
                    tone={kind === "crisis" ? "crisis" : "accent"}
                  />
                  <span className="eyebrow">{editorialLabel(kind)}</span>
                  <time>{lead.tick}일</time>
                </div>
                <h3>{lead.title}</h3>
                <p>{lead.detail}</p>
              </article>
            );
          })()}
          {timeline.length === 0 ? null : (
            <section
              className="chronicle-timeline-section"
              aria-label="연대기 흐름"
            >
              <div className="chronicle-section-heading">
                <span className="eyebrow">이어진 기록</span>
                <span>최근순</span>
              </div>
              <ol className="chronicle-timeline">
                {timeline.map((item) => {
                  const kind = editorialKind(item, sourceEvents);
                  const iconId = chronicleIconId(item, sourceEvents);
                  return (
                    <li
                      className={`chronicle-timeline-entry chronicle-timeline-entry-${kind}`}
                      key={item.id}
                      data-chronicle-level={item.level}
                      data-chronicle-kind={kind}
                    >
                      <div className="chronicle-timeline-marker">
                        <TmrIcon
                          className="chronicle-event-icon"
                          iconId={iconId}
                          size={16}
                          decorative
                          tone={kind === "crisis" ? "crisis" : "neutral"}
                        />
                        <time>{item.tick}일</time>
                      </div>
                      <div className="chronicle-timeline-copy">
                        <span className="chronicle-entry-label">
                          {editorialLabel(kind)}
                        </span>
                        <strong>{item.title}</strong>
                        <span>{item.detail}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
        </>
      )}
    </section>
  );
}

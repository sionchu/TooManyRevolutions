import type { EventPresentationItem } from "../presentation/eventPresentation";
import type { GameEvent } from "../sim/events/event";
import type { PoliticalProposalResponse } from "../sim/state/action";
import type { PoliticalProposalId } from "../sim/state/ids";
import type { ScenarioDefinition } from "../sim/state/scenario";
import type { WorldState } from "../sim/state/world";
import { eventLabel } from "./gamePresentation";

function latest(
  items: readonly EventPresentationItem[],
  kind: EventPresentationItem["kind"],
): EventPresentationItem | null {
  return [...items].reverse().find((item) => item.kind === kind) ?? null;
}

function presentationCopy(
  item: EventPresentationItem,
  eventsById: ReadonlyMap<string, GameEvent>,
  scenario: ScenarioDefinition,
): { readonly title: string; readonly detail: string } {
  const event = eventsById.get(item.eventId);
  if (event === undefined) {
    return { title: item.eventType, detail: `${item.tick}일차` };
  }
  const mapped = eventLabel(event, scenario);
  return { title: mapped.title, detail: mapped.detail };
}

export function EventPresentationOverlay({
  items,
  dismissedEventIds,
  scenario,
  world,
  events,
  onDismiss,
  onRespond,
}: {
  readonly items: readonly EventPresentationItem[];
  readonly dismissedEventIds: ReadonlySet<string>;
  readonly scenario: ScenarioDefinition;
  readonly world: WorldState;
  readonly events: readonly GameEvent[];
  readonly onDismiss: (eventId: EventPresentationItem["eventId"]) => void;
  readonly onRespond: (
    proposalId: PoliticalProposalId,
    response: PoliticalProposalResponse,
  ) => void;
}) {
  const visible = items.filter(
    (item) =>
      item.kind !== "CHRONICLE_ONLY" && !dismissedEventIds.has(item.eventId),
  );
  const eventsById = new Map(events.map((event) => [event.id, event]));
  const decision = latest(visible, "DECISION_REQUIRED");
  const news = latest(visible, "NEWS");
  const toast = latest(visible, "TOAST");
  const proposal =
    decision?.proposalId === undefined
      ? undefined
      : world.politicalProposals?.[decision.proposalId];
  const proposalIntervention =
    proposal === undefined
      ? undefined
      : scenario.interventionCatalog[proposal.interventionId];
  const proposer =
    proposal === undefined
      ? undefined
      : world.factions[proposal.proposerFactionId];

  if (decision === null && news === null && toast === null) return null;

  return (
    <section
      className="event-presentation-stack"
      aria-label="현재 사건 알림"
      aria-live="polite"
    >
      {news === null ? null : (
        <article
          className={`event-presentation event-news${news.terminal ? " event-terminal" : ""}`}
          data-event-presentation-kind={news.kind}
          data-event-presentation-event-id={news.eventId}
          data-event-presentation-type={news.eventType}
          data-event-presentation-terminal={news.terminal ? "true" : "false"}
          role="status"
        >
          <div>
            <span className="eyebrow">
              {news.terminal ? "역사적 결말" : "주요 속보"}
            </span>
            <strong>
              {presentationCopy(news, eventsById, scenario).title}
            </strong>
            <span>{presentationCopy(news, eventsById, scenario).detail}</span>
          </div>
          {news.terminal ? null : (
            <button type="button" onClick={() => onDismiss(news.eventId)}>
              확인
            </button>
          )}
        </article>
      )}

      {decision === null ||
      proposal === undefined ||
      proposal.status !== "open" ? null : (
        <article
          className="event-presentation event-decision-required"
          data-event-presentation-kind={decision.kind}
          data-event-presentation-event-id={decision.eventId}
          data-political-proposal-id={proposal.id}
          data-political-proposal-status={proposal.status}
        >
          <div>
            <span className="eyebrow">정치 제안 · 응답 필요</span>
            <strong>{proposalIntervention?.name ?? "정치적 개입 요청"}</strong>
            <span>
              {proposer?.name ?? "국내 세력"}이 정부에 실제 개입을 요청했습니다.
            </span>
          </div>
          <div className="event-response-actions">
            <button
              type="button"
              className="event-response-accept"
              onClick={() => onRespond(proposal.id, "accept")}
            >
              수락
            </button>
            <button
              type="button"
              className="event-response-reject"
              onClick={() => onRespond(proposal.id, "reject")}
            >
              거절
            </button>
          </div>
        </article>
      )}

      {toast === null ? null : (
        <article
          className="event-presentation event-toast"
          data-event-presentation-kind={toast.kind}
          data-event-presentation-event-id={toast.eventId}
          data-event-presentation-type={toast.eventType}
          role="status"
        >
          <div>
            <strong>
              {presentationCopy(toast, eventsById, scenario).title}
            </strong>
            <span>{presentationCopy(toast, eventsById, scenario).detail}</span>
          </div>
          <button type="button" onClick={() => onDismiss(toast.eventId)}>
            닫기
          </button>
        </article>
      )}
    </section>
  );
}

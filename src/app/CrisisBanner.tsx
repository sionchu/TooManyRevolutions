import type { GameEvent } from "../sim/events/event";
import type { ScenarioDefinition } from "../sim/state/scenario";
import { eventLabel } from "./gamePresentation";

export function CrisisBanner({
  event,
  scenario,
}: {
  readonly event: GameEvent | undefined;
  readonly scenario: ScenarioDefinition;
}) {
  if (event === undefined) return null;
  const mapped = eventLabel(event, scenario);
  return (
    <section className="crisis-banner" role="status" aria-live="assertive">
      <span className="crisis-stamp">현재 사건</span>
      <div>
        <strong>{mapped.title}</strong>
        <span>{mapped.detail}</span>
      </div>
      <small>정권의 위기와 국가의 존속은 별개의 기록입니다.</small>
    </section>
  );
}

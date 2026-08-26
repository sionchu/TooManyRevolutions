import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { deriveEventPresentation } from "../presentation/eventPresentation";
import { createGameEvent } from "../sim/events/event";
import { createEventStore } from "../sim/events/eventStore";
import { asActionId, asPoliticalProposalId } from "../sim/state/ids";
import type { PoliticalProposal } from "../sim/state/politicalProposal";
import { GAMEBUILDERS_DEMO_SCENARIO } from "../sim/state/gameBuildersDemoScenario";
import { createInitialWorldState } from "../sim/state/world";
import { EventPresentationOverlay } from "./EventPresentationOverlay";

describe("production event presentation overlay", () => {
  it("renders accept/reject only for a real matching open PoliticalProposal", () => {
    const scenario = GAMEBUILDERS_DEMO_SCENARIO;
    const countryId = scenario.playerCountryId;
    if (countryId === null) throw new Error("Demo player country is required.");
    const baseWorld = createInitialWorldState(scenario, 18970401);
    const faction = scenario.initialFactions.find(
      (candidate) => candidate.countryId === countryId,
    );
    const intervention = Object.values(scenario.interventionCatalog)[0];
    const governmentId = baseWorld.countries[countryId]?.currentGovernmentId;
    if (
      faction === undefined ||
      intervention === undefined ||
      governmentId === undefined ||
      governmentId === null
    ) {
      throw new Error("Demo proposal fixtures are required.");
    }
    const opened = createGameEvent({
      tick: 1,
      sequence: 0,
      type: "POLITICAL_PROPOSAL_OPENED",
      causeIds: [],
      payload: {
        countryId,
        proposerFactionId: faction.id,
        targetGovernmentId: governmentId,
        interventionId: intervention.id,
      },
      visibility: "important",
    });
    const proposalId = asPoliticalProposalId(`political-proposal:${opened.id}`);
    const proposal: PoliticalProposal = {
      id: proposalId,
      proposerFactionId: faction.id,
      countryId,
      targetGovernmentId: governmentId,
      subjectKind: "interventionRequest",
      interventionId: intervention.id,
      status: "open",
      createdAtTick: opened.tick,
      openingActionId: asActionId("action:1:0:heuristic:LOBBY"),
      openingEventId: opened.id,
    };
    const world = {
      ...baseWorld,
      politicalProposals: { [proposal.id]: proposal },
    };
    const items = deriveEventPresentation({
      eventStore: createEventStore([opened]),
      politicalProposals: world.politicalProposals,
      playerCountryId: countryId,
      playerGovernmentId: governmentId,
    });
    const markup = renderToStaticMarkup(
      <EventPresentationOverlay
        items={items}
        dismissedEventIds={new Set()}
        scenario={scenario}
        world={world}
        events={[opened]}
        onDismiss={() => undefined}
        onRespond={() => undefined}
      />,
    );

    expect(markup).toContain(
      'data-event-presentation-kind="DECISION_REQUIRED"',
    );
    expect(markup).toContain(`data-political-proposal-id="${proposal.id}"`);
    expect(markup).toContain(">수락<");
    expect(markup).toContain(">거절<");
  });

  it("keeps government transition as non-blocking NEWS without fake choices", () => {
    const scenario = GAMEBUILDERS_DEMO_SCENARIO;
    const world = createInitialWorldState(scenario, 18970401);
    const transitioned = createGameEvent({
      tick: 3,
      sequence: 0,
      type: "GOVERNMENT_TRANSITIONED",
      causeIds: [],
      payload: {},
      visibility: "important",
    });
    const items = deriveEventPresentation({
      eventStore: createEventStore([transitioned]),
      politicalProposals: world.politicalProposals,
    });
    const markup = renderToStaticMarkup(
      <EventPresentationOverlay
        items={items}
        dismissedEventIds={new Set()}
        scenario={scenario}
        world={world}
        events={[transitioned]}
        onDismiss={() => undefined}
        onRespond={() => undefined}
      />,
    );

    expect(markup).toContain('data-event-presentation-kind="NEWS"');
    expect(markup).not.toContain(">수락<");
    expect(markup).not.toContain(">거절<");
    expect(markup).not.toContain("data-political-proposal-id");
  });
});

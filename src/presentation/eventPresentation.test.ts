import { describe, expect, it } from "vitest";

import type { JsonValue } from "../sim/core/serialization";
import { createGameEvent, type GameEvent } from "../sim/events/event";
import { createEventStore, type EventStore } from "../sim/events/eventStore";
import {
  asActionId,
  asCountryId,
  asFactionId,
  asGovernmentId,
  asInterventionId,
  asPoliticalProposalId,
  type CountryId,
  type GovernmentId,
} from "../sim/state/ids";
import type { PoliticalProposal } from "../sim/state/politicalProposal";
import {
  deriveEventPresentation,
  type EventPresentationInput,
} from "./eventPresentation";

const countryId = asCountryId("country:player");
const otherCountryId = asCountryId("country:other");
const factionId = asFactionId("faction:workers");
const governmentId = asGovernmentId("government:player");
const otherGovernmentId = asGovernmentId("government:other");
const interventionId = asInterventionId("intervention:relief");

function event(
  type: GameEvent["type"],
  sequence: number,
  payload: { readonly [key: string]: JsonValue } = {},
  tick = sequence + 1,
): GameEvent {
  return createGameEvent({
    tick,
    sequence,
    type,
    causeIds: [],
    payload,
    visibility: "world",
  });
}

function openProposal(
  openingEvent: GameEvent,
  status: PoliticalProposal["status"] = "open",
  proposalCountryId: CountryId = countryId,
  proposalGovernmentId: GovernmentId = governmentId,
): PoliticalProposal {
  const proposalId = asPoliticalProposalId(
    `political-proposal:${openingEvent.id}`,
  );
  return {
    id: proposalId,
    proposerFactionId: factionId,
    countryId: proposalCountryId,
    targetGovernmentId: proposalGovernmentId,
    subjectKind: "interventionRequest",
    interventionId,
    status,
    createdAtTick: openingEvent.tick,
    openingActionId: asActionId(`action:${openingEvent.tick}:0:heuristic:OPEN`),
    openingEventId: openingEvent.id,
    ...(status === "open"
      ? {}
      : {
          resolvedAtTick: openingEvent.tick + 1,
          responseActionId: asActionId(
            `action:${openingEvent.tick + 1}:0:player:RESPOND_POLITICAL_PROPOSAL`,
          ),
          resolutionReason:
            status === "accepted" ? "accepted" : "explicitReject",
          ...(status === "rejected"
            ? {
                reconsiderationBasis: {
                  targetGovernmentId: proposalGovernmentId,
                  feasible: false,
                  failureClasses: [{ kind: "INSUFFICIENT_TREASURY" }],
                },
              }
            : {}),
        }),
  };
}

function input(
  events: readonly GameEvent[],
  proposals: readonly PoliticalProposal[] = [],
  filters: Pick<
    EventPresentationInput,
    "playerCountryId" | "playerGovernmentId"
  > = {},
): EventPresentationInput {
  return {
    eventStore: createEventStore(events),
    politicalProposals: proposals,
    ...filters,
  };
}

function single(
  events: readonly GameEvent[],
  proposals: readonly PoliticalProposal[] = [],
  filters: Pick<
    EventPresentationInput,
    "playerCountryId" | "playerGovernmentId"
  > = {},
) {
  const result = deriveEventPresentation(input(events, proposals, filters));
  expect(result).toHaveLength(1);
  return result[0]!;
}

describe("fact-backed event presentation read model", () => {
  it("keeps routine ticks in the Chronicle only", () => {
    const item = single([event("TICK_ADVANCED", 0)]);
    expect(item).toMatchObject({
      kind: "CHRONICLE_ONLY",
      eventType: "TICK_ADVANCED",
    });
    expect(item).not.toHaveProperty("requiresResponse");
  });

  it("classifies POLICY_ENACTED as a toast", () => {
    expect(single([event("POLICY_ENACTED", 0)])).toMatchObject({
      kind: "TOAST",
      eventType: "POLICY_ENACTED",
    });
  });

  it.each([
    "REBELLION_STARTED",
    "COUP_ATTEMPT_STARTED",
    "CIVIL_WAR_STARTED",
    "GOVERNMENT_TRANSITIONED",
  ] as const)("classifies %s as news without a response", (type) => {
    const item = single([event(type, 0)]);
    expect(item).toMatchObject({
      kind: "NEWS",
      eventType: type,
    });
    expect(item).not.toHaveProperty("requiresResponse");
  });

  it("classifies STATE_DISSOLVED as terminal news", () => {
    expect(single([event("STATE_DISSOLVED", 0)])).toMatchObject({
      kind: "NEWS",
      terminal: true,
      eventType: "STATE_DISSOLVED",
    });
  });

  it("classifies ORDER_CONSOLIDATED as news without marking it terminal", () => {
    const item = single([event("ORDER_CONSOLIDATED", 0)]);
    expect(item).toMatchObject({
      kind: "NEWS",
    });
    expect(item).not.toHaveProperty("terminal");
  });

  it("creates exactly one decision item for a matching open proposal", () => {
    const opened = event("POLITICAL_PROPOSAL_OPENED", 0, {
      proposalId: "political-proposal:event:1:0:POLITICAL_PROPOSAL_OPENED",
      countryId,
      targetGovernmentId: governmentId,
      proposerFactionId: factionId,
    });
    const proposal = openProposal(opened);

    const item = single([opened], [proposal], {
      playerCountryId: countryId,
      playerGovernmentId: governmentId,
    });

    expect(item).toMatchObject({
      kind: "DECISION_REQUIRED",
      eventId: opened.id,
      sourceEventIds: [opened.id],
      proposalId: proposal.id,
      requiresResponse: true,
      countryIds: [countryId],
      factionIds: [factionId],
      governmentIds: [governmentId],
    });
  });

  it.each(["accepted", "rejected"] as const)(
    "does not prompt when the proposal is already %s",
    (status) => {
      const opened = event("POLITICAL_PROPOSAL_OPENED", 0);
      const item = single([opened], [openProposal(opened, status)]);

      expect(item.kind).not.toBe("DECISION_REQUIRED");
      expect(item.requiresResponse).toBeUndefined();
    },
  );

  it("does not create a fake decision when the proposal is missing", () => {
    const opened = event("POLITICAL_PROPOSAL_OPENED", 0, {
      proposalId: "political-proposal:missing",
    });

    const item = single([opened]);
    expect(item).toMatchObject({
      kind: "CHRONICLE_ONLY",
    });
    expect(item).not.toHaveProperty("proposalId");
    expect(item).not.toHaveProperty("requiresResponse");
  });

  it("does not prompt for an open proposal outside the player country or government", () => {
    const opened = event("POLITICAL_PROPOSAL_OPENED", 0);
    const proposal = openProposal(
      opened,
      "open",
      otherCountryId,
      otherGovernmentId,
    );

    const item = single([opened], [proposal], {
      playerCountryId: countryId,
      playerGovernmentId: governmentId,
    });

    expect(item.kind).toBe("CHRONICLE_ONLY");
    expect(item.proposalId).toBe(proposal.id);
    expect(item.requiresResponse).toBeUndefined();
  });

  it("is insertion-order independent for events and proposals", () => {
    const opened = event("POLITICAL_PROPOSAL_OPENED", 0, {
      proposalId: "political-proposal:event:1:0:POLITICAL_PROPOSAL_OPENED",
    });
    const policy = event("POLICY_ENACTED", 1);
    const proposal = openProposal(opened);
    const canonical = deriveEventPresentation(
      input([opened, policy], [proposal]),
    );
    const reversed: EventPresentationInput = {
      eventStore: { events: [policy, opened] },
      politicalProposals: [proposal].reverse(),
    };

    expect(deriveEventPresentation(reversed)).toEqual(canonical);
  });

  it("preserves one presentation item and explicit precedence per source event", () => {
    const opened = event("POLITICAL_PROPOSAL_OPENED", 0, {
      proposalId: "political-proposal:event:1:0:POLITICAL_PROPOSAL_OPENED",
    });
    const proposal = openProposal(opened);
    const duplicateStore: EventStore = { events: [opened, opened] };
    const result = deriveEventPresentation({
      eventStore: duplicateStore,
      politicalProposals: [proposal],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      kind: "DECISION_REQUIRED",
      priority: 4,
    });
  });

  it("keeps small shortage changes in the Chronicle and meaningful bands as toasts", () => {
    const small = event("RESOURCE_SHORTAGE_CHANGED", 0, {
      regionId: "region:port",
      previousScarcity: 0.1,
      scarcity: 0.12,
    });
    const meaningful = event("RESOURCE_SHORTAGE_CHANGED", 1, {
      regionId: "region:port",
      previousScarcity: 0.1,
      scarcity: 0.72,
    });

    expect(
      deriveEventPresentation(input([small, meaningful])).map(
        (item) => item.kind,
      ),
    ).toEqual(["CHRONICLE_ONLY", "TOAST"]);
  });
});

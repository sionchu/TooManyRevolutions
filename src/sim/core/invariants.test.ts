import { describe, expect, it } from "vitest";

import { assertWorldStateInvariants } from "./invariants";
import { asCountryId, asRegionId } from "../state/ids";
import { FOUNDATION_SCENARIO } from "../state/scenario";
import { createInitialWorldState, type WorldState } from "../state/world";

describe("foundation invariants", () => {
  it("accept an empty serializable world state", () => {
    const state = createInitialWorldState(FOUNDATION_SCENARIO, 1);

    expect(() => assertWorldStateInvariants(state)).not.toThrow();
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });

  it("reject impossible negative population", () => {
    const state = createInitialWorldState(FOUNDATION_SCENARIO, 1);
    const invalidState: WorldState = {
      ...state,
      regions: {
        [asRegionId("capital")]: {
          id: asRegionId("capital"),
          name: "Capital",
          ownerCountryId: asCountryId("player"),
          population: -1,
          urbanization: 0.5,
          accessibility: 0.5,
          resources: {},
          resourceProductionCapacity: {},
          resourceProduction: {},
          resourceDemand: {},
          production: 0,
          stateControl: 0.5,
          infrastructure: 0.5,
          scarcity: 0,
          unrest: 0,
          ideology: {},
        },
      },
    };

    expect(() => assertWorldStateInvariants(invalidState)).toThrow(
      "population cannot be negative",
    );
  });
});

import { describe, expect, it } from "vitest";

import { asConflictId, asFactionId, asRegionId } from "../../sim/state/ids";
import {
  resolveRegionCompositionPlacements,
  type RegionCompositionConflictEvidence,
  type RegionCompositionEvidence,
  type RegionCompositionFactionEvidence,
  type RegionCompositionInstitutionEvidence,
  type RegionCompositionPoiEvidence,
  type RegionCompositionProjectEvidence,
  type RegionCompositionRouteEvidence,
  type RegionCompositionSettlementEvidence,
} from "./index";
import type { RegionCompositionRole } from "./regionComposition";

const REGION_ID = asRegionId("fixture.region");
const ANCHOR = [2.5, -1.25] as const;

function emptyEvidence(): RegionCompositionEvidence {
  return {
    settlements: [],
    pois: [],
    institutions: [],
    projects: [],
    factionPresence: [],
    conflicts: [],
    routes: [],
  };
}

function evidence(
  overrides: Partial<RegionCompositionEvidence> = {},
): RegionCompositionEvidence {
  return { ...emptyEvidence(), ...overrides };
}

function settlement(id: string): RegionCompositionSettlementEvidence {
  return {
    id,
    regionId: REGION_ID,
    kind: "capital",
    truthClass: "AUTHORITATIVE_PROJECTION",
  };
}

function poi(
  id: string,
  kind: RegionCompositionPoiEvidence["kind"],
): RegionCompositionPoiEvidence {
  return {
    id,
    regionId: REGION_ID,
    kind,
    truthClass: "AUTHORITATIVE_PROJECTION",
  };
}

function institution(id: string): RegionCompositionInstitutionEvidence {
  return {
    id,
    regionId: REGION_ID,
    kind: "assembly-hall",
    truthClass: "AUTHORITATIVE_PROJECTION",
  };
}

function project(
  id: string,
  landmarkKind: RegionCompositionProjectEvidence["landmarkKind"],
  status: RegionCompositionProjectEvidence["status"] = "implementing",
): RegionCompositionProjectEvidence {
  return {
    id,
    regionId: REGION_ID,
    landmarkKind,
    status,
    sourceEventIds: [`event:${id}`],
    truthClass: "DERIVED_PRESENTATION",
  };
}

function faction(id: string): RegionCompositionFactionEvidence {
  return {
    id,
    factionId: asFactionId(`faction:${id}`),
    regionId: REGION_ID,
    truthClass: "AUTHORITATIVE_PROJECTION",
  };
}

function conflict(id: string): RegionCompositionConflictEvidence {
  return {
    id,
    conflictId: asConflictId(`conflict:${id}`),
    regionIds: [REGION_ID],
    truthClass: "AUTHORITATIVE_PROJECTION",
  };
}

function route(id: string): RegionCompositionRouteEvidence {
  return {
    id,
    sourceRegionId: REGION_ID,
    targetRegionId: asRegionId("fixture.other-region"),
    active: true,
    truthClass: "AUTHORITATIVE_PROJECTION",
  };
}

function resolve(
  role: RegionCompositionRole,
  currentEvidence: RegionCompositionEvidence = emptyEvidence(),
) {
  return resolveRegionCompositionPlacements({
    regionId: REGION_ID,
    role,
    anchor: ANCHOR,
    evidence: currentEvidence,
  });
}

function families(
  role: RegionCompositionRole,
  currentEvidence?: RegionCompositionEvidence,
) {
  return resolve(role, currentEvidence).map((placement) => placement.family);
}

describe("REGION_COMPOSITION_ADAPTER", () => {
  it("keeps semantic structures hidden when their evidence is absent", () => {
    expect(families("capital")).toEqual(["forest-cluster"]);
    expect(families("industrial")).toEqual(["mountain-cluster"]);
    expect(families("port")).toEqual(["water-shelf", "field-plot"]);
    expect(families("frontier")).toEqual(["mountain-cluster"]);
    expect(families("agrarian-distribution")).toEqual(["field-plot"]);
  });

  it("requires recorded project and institution evidence", () => {
    expect(
      families(
        "agrarian-distribution",
        evidence({
          projects: [],
        }),
      ),
    ).not.toEqual(
      expect.arrayContaining(["granary-storehouse", "distribution-yard"]),
    );
    expect(
      families(
        "capital",
        evidence({
          settlements: [settlement("settlement:capital")],
          institutions: [],
        }),
      ),
    ).not.toContain("assembly-parliament");
  });

  it("requires faction and conflict evidence for activity markers", () => {
    const withFort = evidence({ pois: [poi("poi:fort", "fort")] });
    expect(families("frontier", withFort)).not.toContain("faction-banner");
    expect(families("frontier", withFort)).not.toContain("barricade");

    expect(
      families(
        "frontier",
        evidence({
          pois: [poi("poi:fort", "fort")],
          factionPresence: [faction("f01")],
          conflicts: [conflict("c01")],
        }),
      ),
    ).toEqual(expect.arrayContaining(["faction-banner", "barricade"]));
  });

  it("allows authored mine, port, and fort POIs without inventing them", () => {
    expect(families("port")).toContain("water-shelf");
    expect(
      families("industrial", evidence({ pois: [poi("poi:mine", "mine")] })),
    ).toContain("mine");
    expect(
      families("port", evidence({ pois: [poi("poi:port", "port")] })),
    ).toContain("port-dock");
    expect(
      families("frontier", evidence({ pois: [poi("poi:fort", "fort")] })),
    ).toEqual(expect.arrayContaining(["fort", "checkpoint-gate"]));
  });

  it("requires an active recorded route for road-corridor art", () => {
    expect(families("agrarian-distribution")).not.toContain("road-corridor");
    expect(
      families(
        "agrarian-distribution",
        evidence({ routes: [route("route:active")] }),
      ),
    ).toContain("road-corridor");
    expect(
      families(
        "agrarian-distribution",
        evidence({
          routes: [{ ...route("route:inactive"), active: false }],
        }),
      ),
    ).not.toContain("road-corridor");
  });

  it("resolves project state only when a recorded lifecycle is present", () => {
    expect(
      families(
        "agrarian-distribution",
        evidence({ projects: [project("project:food", "food")] }),
      ),
    ).toEqual(
      expect.arrayContaining(["granary-storehouse", "distribution-yard"]),
    );
    expect(
      families(
        "agrarian-distribution",
        evidence({
          projects: [project("project:food", "food", "not-started")],
        }),
      ),
    ).not.toEqual(
      expect.arrayContaining(["granary-storehouse", "distribution-yard"]),
    );
  });

  it("is deterministic when evidence arrays arrive in different orders", () => {
    const ordered = evidence({
      settlements: [settlement("settlement:b"), settlement("settlement:a")],
      pois: [poi("poi:b", "fort"), poi("poi:a", "fort")],
      institutions: [
        institution("institution:b"),
        institution("institution:a"),
      ],
      projects: [
        project("project:b", "industrial"),
        project("project:a", "industrial"),
      ],
      factionPresence: [faction("b"), faction("a")],
      conflicts: [conflict("b"), conflict("a")],
      routes: [route("b"), route("a")],
    });
    const reversed = {
      settlements: [...ordered.settlements].reverse(),
      pois: [...ordered.pois].reverse(),
      institutions: [...ordered.institutions].reverse(),
      projects: [...ordered.projects].reverse(),
      factionPresence: [...ordered.factionPresence].reverse(),
      conflicts: [...ordered.conflicts].reverse(),
      routes: [...ordered.routes].reverse(),
    } satisfies RegionCompositionEvidence;

    expect(resolve("frontier", ordered)).toEqual(resolve("frontier", reversed));
    expect(resolve("industrial", ordered)).toEqual(
      resolve("industrial", reversed),
    );
  });
});

import {
  getRegionComposition,
  type CompositionObjectRequirement,
  type RegionCompositionEvidence,
  type RegionCompositionObjectPlacement,
  type RegionCompositionRequest,
} from "./regionComposition";
import type { MapObjectFamily } from "../mapVisual/worldArt";

export interface ResolvedRegionCompositionPlacement extends RegionCompositionObjectPlacement {
  readonly compositionId: string;
  readonly regionId: string;
  readonly position: readonly [x: number, z: number];
  readonly matchedEvidenceIds: readonly string[];
}

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function regionMatches(firstRegionId: string, secondRegionId: string): boolean {
  return firstRegionId === secondRegionId;
}

function poiKindsForFamily(
  family: MapObjectFamily,
): readonly RegionCompositionEvidence["pois"][number]["kind"][] {
  switch (family) {
    case "mine":
      return ["mine"];
    case "port-dock":
      return ["port"];
    case "fort":
    case "checkpoint-gate":
      return ["fort"];
    default:
      return [];
  }
}

function projectKindForFamily(
  family: MapObjectFamily,
): RegionCompositionEvidence["projects"][number]["landmarkKind"] | null {
  switch (family) {
    case "factory-iron-works":
      return "industrial";
    case "granary-storehouse":
    case "distribution-yard":
      return "food";
    default:
      return null;
  }
}

function institutionKindForFamily(
  family: MapObjectFamily,
): RegionCompositionEvidence["institutions"][number]["kind"] | null {
  return family === "assembly-parliament" ? "assembly-hall" : null;
}

function evidenceIdsForRequirement(
  regionId: string,
  placement: RegionCompositionObjectPlacement,
  evidence: RegionCompositionEvidence,
): readonly string[] {
  const ids = (() => {
    switch (placement.requirement) {
      case "DECORATIVE_SUBSTRATE":
        return [];
      case "AUTHORED_STATIC_POI": {
        const allowedKinds = poiKindsForFamily(placement.family);
        return evidence.pois
          .filter(
            (poi) =>
              regionMatches(poi.regionId, regionId) &&
              poi.truthClass === "AUTHORITATIVE_PROJECTION" &&
              allowedKinds.includes(poi.kind),
          )
          .map((poi) => poi.id);
      }
      case "AUTHORED_SETTLEMENT":
        return evidence.settlements
          .filter(
            (settlement) =>
              regionMatches(settlement.regionId, regionId) &&
              settlement.kind === "capital" &&
              settlement.truthClass === "AUTHORITATIVE_PROJECTION",
          )
          .map((settlement) => settlement.id);
      case "RECORDED_INSTITUTION": {
        const requiredKind = institutionKindForFamily(placement.family);
        return evidence.institutions
          .filter(
            (institution) =>
              requiredKind !== null &&
              regionMatches(institution.regionId, regionId) &&
              institution.kind === requiredKind &&
              institution.truthClass === "AUTHORITATIVE_PROJECTION",
          )
          .map((institution) => institution.id);
      }
      case "RECORDED_PROJECT": {
        const requiredKind = projectKindForFamily(placement.family);
        return evidence.projects
          .filter(
            (project) =>
              requiredKind !== null &&
              regionMatches(project.regionId, regionId) &&
              project.landmarkKind === requiredKind &&
              project.status !== "not-started" &&
              project.sourceEventIds.length > 0 &&
              project.truthClass === "DERIVED_PRESENTATION",
          )
          .map((project) => project.id);
      }
      case "RECORDED_FACTION":
        return evidence.factionPresence
          .filter(
            (presence) =>
              regionMatches(presence.regionId, regionId) &&
              presence.truthClass === "AUTHORITATIVE_PROJECTION",
          )
          .map((presence) => presence.id);
      case "RECORDED_CONFLICT":
        return evidence.conflicts
          .filter(
            (conflict) =>
              conflict.regionIds.some((candidate) => candidate === regionId) &&
              conflict.truthClass === "AUTHORITATIVE_PROJECTION",
          )
          .map((conflict) => conflict.id);
      case "RECORDED_ROUTE":
        return evidence.routes
          .filter(
            (route) =>
              route.active &&
              (regionMatches(route.sourceRegionId, regionId) ||
                regionMatches(route.targetRegionId, regionId)) &&
              route.truthClass === "AUTHORITATIVE_PROJECTION",
          )
          .map((route) => route.id);
    }
  })();
  return [...new Set(ids)].sort(compareStableText);
}

function requirementHasEvidence(
  requirement: CompositionObjectRequirement,
  evidenceIds: readonly string[],
): boolean {
  return requirement === "DECORATIVE_SUBSTRATE" || evidenceIds.length > 0;
}

/**
 * Resolve only placements backed by the supplied WorldSceneModel evidence.
 * This function is pure: it does not mutate the request, evidence, or any
 * simulation state, and its output ordering is defined by the authored
 * composition order and stable evidence IDs.
 */
export function resolveRegionCompositionPlacements(
  request: RegionCompositionRequest,
): readonly ResolvedRegionCompositionPlacement[] {
  const composition = getRegionComposition(request);
  return composition.objects.flatMap((placement) => {
    const matchedEvidenceIds = evidenceIdsForRequirement(
      request.regionId,
      placement,
      request.evidence,
    );
    if (!requirementHasEvidence(placement.requirement, matchedEvidenceIds)) {
      return [];
    }
    return [
      {
        ...placement,
        compositionId: composition.compositionId,
        regionId: request.regionId,
        position: [
          request.anchor[0] + placement.offset[0],
          request.anchor[1] + placement.offset[1],
        ] as const,
        matchedEvidenceIds,
      },
    ];
  });
}

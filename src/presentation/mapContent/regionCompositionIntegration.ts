import type { MapArchitecture } from "../mapArchitecture";
import {
  regionCompositionEvidenceFromWorldSceneModel,
  type RegionCompositionRole,
} from "./regionComposition";
import {
  resolveRegionCompositionPlacements,
  type ResolvedRegionCompositionPlacement,
} from "./regionCompositionAdapter";
import type { WorldSceneModel, WorldScenePoint } from "../worldSceneModel";

export interface IntegratedRegionArtPlacement extends ResolvedRegionCompositionPlacement {
  readonly role: RegionCompositionRole;
  readonly worldPosition: WorldScenePoint;
}

export interface IntegratedRegionArtPlan {
  readonly placements: readonly IntegratedRegionArtPlacement[];
  readonly coveredEvidenceKeys: readonly string[];
  readonly composedRegionIds: readonly string[];
  readonly omittedRegionIds: readonly string[];
}

function compareStableText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function firstStable<T extends { readonly id: string }>(
  values: readonly T[],
): T | undefined {
  return [...values].sort((first, second) =>
    compareStableText(first.id, second.id),
  )[0];
}

function evidenceKey(regionId: string, evidenceId: string): string {
  return `${regionId}::${evidenceId}`;
}

function regionHasBoundary(
  architecture: MapArchitecture,
  model: WorldSceneModel,
  regionId: string,
): boolean {
  const regionHexIds = new Set<string>(
    model.hexes.filter((hex) => hex.regionId === regionId).map((hex) => hex.id),
  );
  return [
    ...architecture.political.legalOwnerBoundarySegments,
    ...architecture.political.physicalControllerBoundarySegments,
    ...architecture.political.frontBoundarySegments,
  ].some(
    (segment) =>
      regionHexIds.has(segment.firstLandHexId) ||
      (segment.secondLandHexId !== null &&
        regionHexIds.has(segment.secondLandHexId)),
  );
}

function roleForRegion(
  model: WorldSceneModel,
  architecture: MapArchitecture,
  region: WorldSceneModel["regions"][number],
): RegionCompositionRole | null {
  const regionPois = model.pois.filter(
    (poi) => poi.regionId === region.regionId,
  );
  const regionProjects = model.projects.filter(
    (project) => project.regionId === region.regionId,
  );
  const regionInstitutions = model.institutions.filter(
    (institution) => institution.regionId === region.regionId,
  );
  // A factual port must retain its waterside composition even when the same
  // region also serves as a country's capital. The country/capital identity is
  // still carried by the far-LOD label and authored settlement fact.
  if (regionPois.some((poi) => poi.kind === "port")) return "port";
  const isCapital =
    model.settlements.some(
      (settlement) => settlement.regionId === region.regionId,
    ) ||
    regionInstitutions.some(
      (institution) => institution.kind === "capital-seat",
    );
  if (isCapital) return "capital";
  if (
    regionPois.some((poi) => poi.kind === "mine") ||
    regionProjects.some((project) => project.landmarkKind === "industrial")
  )
    return "industrial";
  if (
    regionHasBoundary(architecture, model, region.regionId) ||
    model.conflicts.some((conflict) =>
      conflict.regionIds.includes(region.regionId),
    ) ||
    regionPois.some((poi) => poi.kind === "fort")
  )
    return "frontier";
  if (
    regionPois.some((poi) => poi.kind === "granary") ||
    regionProjects.some((project) => project.landmarkKind === "food")
  )
    return "agrarian-distribution";
  return null;
}

/**
 * Keep authored structures on their factual map anchor. The role template
 * supplies only local composition offsets; it must not silently move a port
 * or a recorded project back to a synthetic region-center anchor.
 */
function anchorForRole(
  model: WorldSceneModel,
  region: WorldSceneModel["regions"][number],
  role: RegionCompositionRole,
): WorldScenePoint {
  if (role === "port") {
    const port = firstStable(
      model.pois.filter(
        (poi) => poi.regionId === region.regionId && poi.kind === "port",
      ),
    );
    if (port !== undefined) return port.position;
  }
  if (role === "agrarian-distribution") {
    const foodProject = firstStable(
      model.projects.filter(
        (project) =>
          project.regionId === region.regionId &&
          project.landmarkKind === "food" &&
          project.status !== "not-started" &&
          project.sourceEventIds.length > 0,
      ),
    );
    if (foodProject !== undefined) return foodProject.position;
    const granary = firstStable(
      model.pois.filter(
        (poi) => poi.regionId === region.regionId && poi.kind === "granary",
      ),
    );
    if (granary !== undefined) return granary.position;
  }
  return region.position;
}

export function deriveIntegratedRegionArtPlan(
  model: WorldSceneModel,
  architecture: MapArchitecture,
): IntegratedRegionArtPlan {
  const evidence = regionCompositionEvidenceFromWorldSceneModel(model);
  const placements: IntegratedRegionArtPlacement[] = [];
  const coveredEvidenceKeys = new Set<string>();
  const composedRegionIds: string[] = [];
  const omittedRegionIds: string[] = [];

  for (const region of [...model.regions].sort((first, second) =>
    compareStableText(first.regionId, second.regionId),
  )) {
    const role = roleForRegion(model, architecture, region);
    if (role === null) {
      omittedRegionIds.push(region.regionId);
      continue;
    }
    const anchor = anchorForRole(model, region, role);
    const resolved = resolveRegionCompositionPlacements({
      regionId: region.regionId,
      role,
      anchor: [anchor[0], anchor[2]],
      evidence,
    });
    if (resolved.length === 0) {
      omittedRegionIds.push(region.regionId);
      continue;
    }
    composedRegionIds.push(region.regionId);
    for (const placement of resolved) {
      for (const matchedEvidenceId of placement.matchedEvidenceIds) {
        coveredEvidenceKeys.add(
          evidenceKey(placement.regionId, matchedEvidenceId),
        );
      }
      placements.push({
        ...placement,
        role,
        worldPosition: [
          placement.position[0],
          anchor[1],
          placement.position[1],
        ],
      });
    }
  }

  return {
    placements,
    coveredEvidenceKeys: [...coveredEvidenceKeys].sort(compareStableText),
    composedRegionIds: composedRegionIds.sort(compareStableText),
    omittedRegionIds: omittedRegionIds.sort(compareStableText),
  };
}

export function isEvidenceCoveredByRegionComposition(
  plan: IntegratedRegionArtPlan,
  regionId: string,
  evidenceId: string,
): boolean {
  return plan.coveredEvidenceKeys.includes(evidenceKey(regionId, evidenceId));
}

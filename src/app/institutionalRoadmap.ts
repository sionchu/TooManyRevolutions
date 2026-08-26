import {
  evaluatePolicyAvailability,
  type PolicyAvailabilityFailure,
  type PolicyDefinition,
  type PolicyState,
} from "../sim/state/policy";
import type { PolicyId } from "../sim/state/ids";

export type InstitutionalRoadmapStatus =
  | "ENACTED"
  | "AVAILABLE"
  | "BLOCKED_BY_PREREQUISITE"
  | "BLOCKED_BY_INCOMPATIBILITY";

export interface InstitutionalRoadmapNode {
  readonly definition: PolicyDefinition;
  readonly status: InstitutionalRoadmapStatus;
  readonly reasons: readonly PolicyAvailabilityFailure[];
  readonly enactedAtTick: number | null;
}

export interface InstitutionalRoadmapEdge {
  readonly id: string;
  readonly fromPolicyId: PolicyId;
  readonly toPolicyId: PolicyId;
  readonly kind: "prerequisite" | "incompatible";
}

export interface InstitutionalRoadmap {
  readonly nodes: readonly InstitutionalRoadmapNode[];
  readonly edges: readonly InstitutionalRoadmapEdge[];
}

function compareId(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}

function deriveStatus(
  availability: ReturnType<typeof evaluatePolicyAvailability>,
  enacted: boolean,
): InstitutionalRoadmapStatus {
  if (enacted) return "ENACTED";
  if (availability.reasons.includes("INCOMPATIBLE_POLICY")) {
    return "BLOCKED_BY_INCOMPATIBILITY";
  }
  if (availability.reasons.includes("PREREQUISITE_NOT_MET")) {
    return "BLOCKED_BY_PREREQUISITE";
  }
  return "AVAILABLE";
}

/** Pure view of the authored policy graph and current PolicyState. */
export function deriveInstitutionalRoadmap(
  policyState: PolicyState,
  catalog: Readonly<Record<PolicyId, PolicyDefinition>>,
): InstitutionalRoadmap {
  const definitions = Object.values(catalog).sort((first, second) =>
    compareId(first.id, second.id),
  );
  const nodes = definitions.map((definition) => {
    const availability = evaluatePolicyAvailability(
      policyState,
      definition,
      catalog,
    );
    return {
      definition,
      status: deriveStatus(
        availability,
        policyState.activePolicyIds.includes(definition.id),
      ),
      reasons: availability.reasons,
      enactedAtTick: policyState.enactedAtTick[definition.id] ?? null,
    };
  });

  const edges: InstitutionalRoadmapEdge[] = [];
  const seen = new Set<string>();
  for (const definition of definitions) {
    for (const prerequisite of definition.prerequisites ?? []) {
      if (prerequisite.kind !== "policyActive") continue;
      const id = `prerequisite:${prerequisite.policyId}->${definition.id}`;
      if (seen.has(id)) continue;
      seen.add(id);
      edges.push({
        id,
        fromPolicyId: prerequisite.policyId,
        toPolicyId: definition.id,
        kind: "prerequisite",
      });
    }
    for (const incompatiblePolicyId of definition.incompatiblePolicyIds ?? []) {
      const pair = [definition.id, incompatiblePolicyId].sort(compareId);
      const id = `incompatible:${pair[0]}<->${pair[1]}`;
      if (seen.has(id)) continue;
      seen.add(id);
      edges.push({
        id,
        fromPolicyId: pair[0] as PolicyId,
        toPolicyId: pair[1] as PolicyId,
        kind: "incompatible",
      });
    }
  }

  return {
    nodes,
    edges: edges.sort((first, second) => compareId(first.id, second.id)),
  };
}

export function roadmapStatusLabel(status: InstitutionalRoadmapStatus): string {
  switch (status) {
    case "ENACTED":
      return "시행 중";
    case "AVAILABLE":
      return "가능";
    case "BLOCKED_BY_PREREQUISITE":
      return "선행 조건";
    case "BLOCKED_BY_INCOMPATIBILITY":
      return "제도 충돌";
  }
}

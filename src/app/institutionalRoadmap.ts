import {
  evaluatePolicyAvailability,
  type PolicyAvailabilityFailure,
  type PolicyDefinition,
  type PolicyDomain,
  type PolicyState,
} from "../sim/state/policy";
import type { PolicyId } from "../sim/state/ids";

export const INSTITUTIONAL_POLICY_DOMAIN_ORDER = [
  "authority",
  "property",
  "labor",
  "information",
  "taxation",
  "localGovernment",
] as const satisfies readonly PolicyDomain[];

export const INSTITUTIONAL_POLICY_DOMAIN_LABELS: Readonly<
  Record<PolicyDomain, string>
> = {
  authority: "권한",
  property: "소유",
  labor: "노동",
  information: "정보",
  taxation: "조세",
  localGovernment: "지방 행정",
};

export const INSTITUTIONAL_GRAPH_NODE_WIDTH = 118;
export const INSTITUTIONAL_GRAPH_NODE_HEIGHT = 50;
export const INSTITUTIONAL_GRAPH_DEPTH_COLUMN_WIDTH = 382;
export const INSTITUTIONAL_GRAPH_TRACK_COLUMNS = 3;

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

export interface InstitutionalGraphPosition {
  readonly x: number;
  readonly y: number;
  readonly depth: number;
  readonly domain: PolicyDomain;
  readonly track: number;
}

export interface InstitutionalGraphLane {
  readonly domain: PolicyDomain;
  readonly label: string;
  readonly y: number;
  readonly height: number;
  readonly nodeCount: number;
}

export interface InstitutionalGraphLayout {
  readonly width: number;
  readonly height: number;
  readonly maxDepth: number;
  readonly lanes: readonly InstitutionalGraphLane[];
  readonly positions: ReadonlyMap<PolicyId, InstitutionalGraphPosition>;
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

/**
 * Stable, renderer-independent placement for the Institutions surface.
 * Domains form the vertical lanes; authored policy prerequisite depth forms
 * the horizontal columns. Nodes sharing both coordinates use deterministic
 * tracks so the graph never relies on an index-only percentage layout.
 */
export function deriveInstitutionalGraphLayout(
  roadmap: InstitutionalRoadmap,
): InstitutionalGraphLayout {
  const nodeById = new Map(
    roadmap.nodes.map((node) => [node.definition.id, node] as const),
  );
  const parentsById = new Map<PolicyId, PolicyId[]>();
  for (const edge of roadmap.edges) {
    if (edge.kind !== "prerequisite" || !nodeById.has(edge.fromPolicyId)) {
      continue;
    }
    const parents = parentsById.get(edge.toPolicyId) ?? [];
    parents.push(edge.fromPolicyId);
    parentsById.set(edge.toPolicyId, parents);
  }

  const depthById = new Map<PolicyId, number>();
  const deriveDepth = (
    policyId: PolicyId,
    visiting: ReadonlySet<PolicyId> = new Set(),
  ): number => {
    const cached = depthById.get(policyId);
    if (cached !== undefined) return cached;
    if (visiting.has(policyId)) return 0;
    const nextVisiting = new Set(visiting);
    nextVisiting.add(policyId);
    const depth = Math.max(
      0,
      ...(parentsById.get(policyId) ?? []).map(
        (parentId) => deriveDepth(parentId, nextVisiting) + 1,
      ),
    );
    depthById.set(policyId, depth);
    return depth;
  };

  const groups = new Map<string, InstitutionalRoadmapNode[]>();
  let maxDepth = 0;
  for (const node of roadmap.nodes) {
    const depth = deriveDepth(node.definition.id);
    maxDepth = Math.max(maxDepth, depth);
    const key = `${node.definition.domain}:${depth}`;
    const group = groups.get(key) ?? [];
    group.push(node);
    groups.set(key, group);
  }

  const positions = new Map<PolicyId, InstitutionalGraphPosition>();
  const lanes: InstitutionalGraphLane[] = [];
  const graphLeft = 172;
  const graphTop = 18;
  const laneGap = 12;
  let cursorY = graphTop;

  for (const domain of INSTITUTIONAL_POLICY_DOMAIN_ORDER) {
    const domainGroups = [...groups.entries()]
      .filter(([key]) => key.startsWith(`${domain}:`))
      .sort(([first], [second]) => {
        const firstDepth = Number(first.slice(domain.length + 1));
        const secondDepth = Number(second.slice(domain.length + 1));
        return firstDepth - secondDepth;
      });
    const maxTracks = domainGroups.reduce(
      (largest, [, nodes]) =>
        Math.max(
          largest,
          Math.ceil(nodes.length / INSTITUTIONAL_GRAPH_TRACK_COLUMNS),
        ),
      0,
    );
    const laneHeight =
      maxTracks === 0
        ? 58
        : 36 + maxTracks * (INSTITUTIONAL_GRAPH_NODE_HEIGHT + 8) + 12;
    const lane: InstitutionalGraphLane = {
      domain,
      label: INSTITUTIONAL_POLICY_DOMAIN_LABELS[domain],
      y: cursorY,
      height: laneHeight,
      nodeCount: domainGroups.reduce(
        (count, [, nodes]) => count + nodes.length,
        0,
      ),
    };
    lanes.push(lane);

    for (const [key, nodes] of domainGroups) {
      const depth = Number(key.slice(domain.length + 1));
      nodes.sort((first, second) =>
        compareId(first.definition.id, second.definition.id),
      );
      nodes.forEach((node, track) => {
        const trackColumn = track % INSTITUTIONAL_GRAPH_TRACK_COLUMNS;
        const trackRow = Math.floor(track / INSTITUTIONAL_GRAPH_TRACK_COLUMNS);
        positions.set(node.definition.id, {
          x:
            graphLeft +
            depth * INSTITUTIONAL_GRAPH_DEPTH_COLUMN_WIDTH +
            trackColumn * (INSTITUTIONAL_GRAPH_NODE_WIDTH + 8),
          y: lane.y + 36 + trackRow * (INSTITUTIONAL_GRAPH_NODE_HEIGHT + 8),
          depth,
          domain,
          track,
        });
      });
    }

    cursorY += lane.height + laneGap;
  }

  return {
    width:
      graphLeft + (maxDepth + 1) * INSTITUTIONAL_GRAPH_DEPTH_COLUMN_WIDTH + 28,
    height: cursorY - laneGap + 18,
    maxDepth,
    lanes,
    positions,
  };
}

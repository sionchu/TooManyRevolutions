# Parallel Task 02 — World Art FIX3 P0 Readability

EXECUTION_AUTHORITY: THIS_FILE_ONLY

## Branch / baseline

- branch: `parallel-p0-world-art-v2`
- start from current accepted FIX2 head: `52e4c14574689ec0c618d9d83a451b46f2302603`
- This is a narrow art follow-up. Do not touch runtime, `PoliticalWorldStage.tsx`, simulation, bridge, audio, icons, or deployment.

## Why this exists

06 exact-browser re-review of FIX2 closed Frontier and Capital, but left:

- Port labels-off recognition: PARTIAL / P0 open
- Agrarian/distribution labels-off recognition: PARTIAL / P0 open
- Industrial richness: PARTIAL / P1
- Primitive/blockout dominance: FAIL / P1

This task targets only the two remaining P0 art-readability items. Do not expand into a wholesale asset-engine rewrite.

## P0-1 Port water identity

Goal: at the same 1440x900 labels-off gallery framing, the Port panel must read as a waterside trade gateway before it reads as a timber yard.

Required direction:

- make the `water-shelf` broad enough to establish a real water body, not a thin band;
- increase water-vs-land value/material separation while staying in the muted TMR palette;
- make shoreline edge/tidal transition spatially obvious;
- keep the pier visibly crossing the shoreline into water;
- keep warehouse/quay relationship readable;
- do not add ships, cargo actors, trade quantities, or fake activity.

Prefer authored geometry/material/composition changes inside the existing world-art contract. Do not fake a runtime coastline fact.

## P0-2 Agrarian / distribution grammar

Goal: the panel must read as open food-production/distribution geography before it reads as a generic pale building cluster.

Required direction:

- increase cultivated field footprint and visible furrow/drainage rhythm;
- use a restrained cultivated-soil/field material distinction from the neutral presentation plate;
- strengthen granary/storehouse + silo profile;
- make the distribution yard read as open loading lanes / yard flow rather than stacked generic blocks;
- preserve horizontal/open composition and lower visual height than capital/industrial;
- no workers, carts, cargo quantities, or implied simulated logistics actors.

## Authority rules

Preserve the strict resolver exactly:

- `water-shelf` may remain `DECORATIVE_SUBSTRATE`;
- `port-dock` still requires authored port POI;
- granary/distribution project art still requires `RECORDED_PROJECT` where the existing contract requires it;
- settlements remain `AUTHORED_SETTLEMENT`;
- no role-only semantic structure creation;
- no WorldState/simulation mutation.

## P1 handling

Do not block this task on solving the entire primitive/blockout language. Small surface-breakup or silhouette improvements are allowed only when directly helping Port or Agrarian P0 readability.

Industrial richness and broad primitive-language replacement remain P1 and may be revisited after integrated production-map QA.

## Tests

At minimum:

- world-art tests
- procedural geometry tests
- reusable renderer tests
- region composition authority tests
- gallery tests
- format
- typecheck
- lint
- build
- `git diff --check`

Add tests that prove the stronger port water extent/shore crossing and agrarian field/material/open-yard cues without weakening truth requirements.

## Result

Append `FIX3_P0_READABILITY` to `docs/parallel/02_WORLD_ART_RESULT.md` with:

- exact changed families/materials
- Port fix
- Agrarian fix
- authority proof
- tests
- known P1 items deliberately deferred

Commit/push and STOP. Do not declare visual PASS; 06 keeps screenshot authority.

# Parallel Task 02 — World Art FIX2 Visual Identity

EXECUTION_AUTHORITY: THIS_FILE_ONLY

## Branch / baseline

- branch: `parallel-p0-world-art-v2`
- start from current branch HEAD `a780e3df108dbdf4490d42859af1d880d4fdd663`
- accepted foundations: 17 procedural Kits, truth-aware resolver, dimension-safe reusable R3F renderer
- visual QA input: `parallel-p0-visual-qa-v2@8e7399e39325965e0e33887f4a126427873ad510`
- QA report: `docs/parallel/06_WORLD_ART_GALLERY_QA.md` on the QA branch

This task fixes visual identity only. It does not authorize runtime integration, simulation changes, deployment, P0 PASS, Gate1F, V02, or persistence work.

## Visual blockers to address

The browser labels-off QA of `fd46de1` found:

- Capital: PASS
- Industrial recognition: PASS, but P1 chimney-box/blockout dominance
- Frontier: PARTIAL / fort-gate immediacy FAIL
- Port: FAIL / no waterside identity
- Agrarian-distribution: FAIL / generic pale cluster
- primitive/blockout treatment: FAIL
- capital strongest-landmark hierarchy: PARTIAL

The renderer FIX1 `a780e3d` improved dimension/grounding correctness but did not add the missing water/agricultural/frontier geography grammar. Do not treat that renderer fix as closing these art blockers.

## Objective

Improve the actual authored procedural art so the five region compositions are visually distinct without labels, while preserving strict truth/evidence requirements.

Priority order:

1. Port identity
2. Agrarian/distribution identity
3. Frontier fort/gate identity
4. Industrial richness
5. Capital dominance / overall hierarchy

## A. Port — P0

The port must read as a waterside trade gateway, not a wooden scaffold on a tan plate.

Required:
- add a clearly authored shoreline/water-edge decorative substrate or equivalent renderer-neutral geometry family
- make pier geometry visibly cross/meet the water edge
- strengthen quay/dock edge relation
- mast/crane may remain, but do not add ships, cargo counts, workers, or trade activity facts not represented by state
- water/shoreline is geography/decorative substrate, not a simulated entity
- keep `port-dock` itself gated by real `AUTHORED_STATIC_POI` evidence in production resolver

A new authored decorative family such as `water-shelf` / `shoreline-edge` is allowed if it has project-authored provenance, stable family/asset/kit IDs, material family, grounding, LOD and replacement seam.

## B. Agrarian / distribution — P0

The composition must read horizontally as open food-production/distribution geography, not a pale civic building cluster.

Required:
- field plane/plots should occupy visibly more horizontal area
- furrows/drainage/berm pattern must survive gallery scale
- granary silhouette should emphasize storehouse + silo/storage profile
- distribution yard should emphasize loading lanes/canopy/yard footprint rather than generic boxes
- `granary-storehouse` and `distribution-yard` remain `RECORDED_PROJECT`; never show them without a recorded project lifecycle in production
- fields/drainage/berms may be `DECORATIVE_SUBSTRATE`
- no fake carts, cargo piles, workers, harvest quantities, or project completion

## C. Frontier — P0

The fort/gate pair must read as a chokepoint/border-defense composition, not an industrial vertical cluster.

Required:
- strengthen wall perimeter
- create an unmistakable gate void/open passage silhouette
- separate checkpoint/gate from industrial chimney language
- use rough ridge/edge/approach geography as decorative substrate where safe
- do not add a road unless `RECORDED_ROUTE` evidence permits it in production
- fort/checkpoint remain gated by authored POI evidence
- barricade remains `RECORDED_CONFLICT`
- faction banner remains `RECORDED_FACTION`

## D. Industrial — P1

Recognition already passes, but avoid “big box + three chimneys” as the whole identity.

Improve:
- works yard footprint
- furnace/ore/headframe relationship
- haul/production axis readability
- material breakup within the existing muted palette

Do not invent production activity or vehicles. `factory-iron-works` remains gated by the approved project evidence contract; mine remains authored POI.

## E. Capital / hierarchy — P1

Capital remains the strongest landmark.

Required:
- palace mass/terrace/public axis should beat industrial chimney vertical attention overall
- do not simply make palace absurdly tall
- maintain `signature-capital > major-project > POI > settlement > decorative-prop`
- assembly still requires recorded institution evidence
- non-capital settlement strict resolver remains unchanged

## F. Reduce primitive/blockout dominance

Do not abandon the low-poly procedural approach, but improve authored profile and secondary shape language.

Allowed:
- more purposeful primitive combinations
- roof/wall setbacks
- terraces, voids, edge bands, berms, water/field planes
- material-family contrast within the restrained palette
- geometry rotation and repeated patterning

Avoid:
- external commercial assets
- copied game assets
- huge polygon/detail cost
- fake simulated actors/vehicles/crowds

Keep each semantic Kit practical for R3F and future GLB replacement.

## Authority rules

Preserve all truth-aware requirements. Do not loosen resolver evidence just to make the gallery or runtime look richer.

In particular:
- no institution -> no assembly
- no project -> no project building
- no faction -> no faction banner
- no conflict -> no barricade
- no active route -> no route corridor
- no authored settlement -> no dense/small settlement

Decorative geography may be authored substrate only when it does not imply a simulated fact.

## Preview / evidence

Update the standalone `WorldArtGallery` to exercise the improved art.

Generate actual local browser evidence if possible without touching production runtime:
- 1440×900 labels-off full gallery
- panel crop

The gallery may show all authored families as an authoring comparison; production runtime still must use `resolveRegionCompositionPlacements`.

## Tests

At minimum:
- all world-art tests
- procedural geometry tests
- reusable renderer tests
- region composition authority tests
- gallery tests
- new decorative family manifest/geometry tests if added
- deterministic output
- positive dimensions / stable IDs / provenance
- format
- typecheck
- lint
- build
- `git diff --check`

## Protected files

Do not modify:
- `src/app/PoliticalWorldStage.tsx`
- `src/presentation/mapRuntime/**`
- `src/presentation/mapArchitecture.ts`
- `src/presentation/mapVisualSystem.ts`
- `src/sim/**`
- shared Bridge docs
- integration branch files
- deployment config

## Result

Append `FIX2_VISUAL_IDENTITY` to `docs/parallel/02_WORLD_ART_RESULT.md` with:
- changed Kit/family list
- QA blocker -> fix mapping
- any new decorative substrate family
- authority proof
- screenshot paths if produced
- test results
- remaining visual limitations

Commit/push and STOP. Do not declare the visual blocker closed yourself; 06 re-review decides that.
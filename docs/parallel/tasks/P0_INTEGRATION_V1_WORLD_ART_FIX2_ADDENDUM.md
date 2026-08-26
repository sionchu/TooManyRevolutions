# P0 Integration V1 — World Art FIX2 Addendum

EXECUTION_AUTHORITY: P0_INTEGRATION_V1_SUPPLEMENT

This addendum supplements `docs/parallel/tasks/P0_INTEGRATION_V1.md`. All existing authority boundaries remain unchanged.

## Accepted code input

The following 02 World Art commit is independently code/QC accepted for integration:

- `52e4c14574689ec0c618d9d83a451b46f2302603` — visual-identity FIX2

It descends from the accepted 02 renderer/authority work and targets the prior 06 gallery failures without loosening truth requirements.

## What FIX2 adds/changes

- new decorative `water-shelf` family/material for actual port/waterside composition
- stronger shoreline-crossing `port-dock`
- wider `field-plot` with furrows/berm/drainage
- stronger granary/storehouse + capped silo silhouette
- stronger distribution-yard canopy/loading-lane/open-yard silhouette
- fort wall split around an explicit gate void/lintel
- checkpoint gate/threshold/booth treatment separated from industrial silhouette
- richer industrial yard/ore/haul/furnace composition with reduced chimney dominance
- stronger capital terrace/plaza/public-axis hierarchy

## Authority preservation

Preserve exactly:

- `water-shelf` is `DECORATIVE_SUBSTRATE`
- `port-dock` still requires `AUTHORED_STATIC_POI`
- assembly still requires `RECORDED_INSTITUTION`
- project structures still require `RECORDED_PROJECT`
- dense/small settlement still require `AUTHORED_SETTLEMENT`
- faction banner still requires `RECORDED_FACTION`
- barricade still requires `RECORDED_CONFLICT`
- road corridor still requires `RECORDED_ROUTE`

Do not weaken these in integration to make art appear.

## Integration handling

Integrate/cherry-pick `52e4c14574689ec0c618d9d83a451b46f2302603` after the previously accepted 02 inputs.

For `PoliticalWorldStage` and runtime composition:

- use the accepted `ProceduralWorldArtKitRenderer`
- use the strict region-composition resolver
- use the new `water-shelf` only as authored decorative geography; do not infer trade/cargo/activity from it
- place port dock relative to actual authored port evidence and the water shelf/shoreline
- use terrain/chokepoint/route relationships from real integration geometry instead of reproducing the flat Gallery plate
- do not reintroduce old generic landmark geometry alongside the FIX2 kit

## Visual status

`52e4c145...` is **CODE_ACCEPTED / VISUAL_PENDING**.

The previous 06 visual FAIL was against pre-FIX1/FIX2 `fd46de1`. 06 must re-render the exact FIX2 target before any Port/Agrarian/Frontier blocker is closed.

Therefore:

- integration may proceed immediately with FIX2
- do not declare Port/Agrarian/Frontier visual PASS solely from source/tests
- record the exact 06 FIX2 re-review disposition when available

## Conflict policy

If integration work has already modified world-art placement:

- preserve integration-owned factual world position/Y and geography composition
- preserve FIX2 family geometry/material/silhouette changes
- preserve 01 terrain/controller/front authority
- do not replace world geography with Gallery flat plates

## Result

`docs/parallel/P0_INTEGRATION_V1_RESULT.md` must record `52e4c14574689ec0c618d9d83a451b46f2302603` if integrated and must distinguish `CODE_ACCEPTED` from pending/received 06 visual disposition.

No production deploy, P0 PASS, Gate1F, V02, or persistence authorization is added.

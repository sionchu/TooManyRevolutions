# P0 Demo Map Simplify V1 — Visual De-bloat / Clean-v0

EXECUTION_AUTHORITY: THIS_FILE_ONLY

## Base

- branch: `parallel-p0-demo-map-simplify-v1`
- exact base: `e521961e25e4b20c70245137216c80a103120420`
- owns the current R3F map presentation simplification only.
- do NOT import external model assets here; `parallel-p0-demo-assets-v1` owns acquisition.
- do NOT touch `global.css`, contextual decisions, simulation, audio, icon registry, Gate1F or deployment.

## Timebox

45 minutes implementation + browser evidence. This is a REMOVE/HIDE/REDUCE pass, not a new visual framework.

## Confirmed problem

Current Day0 integration reports 21 integrated placements and 21 labels, while the scene also renders terrain details, ideology treatment, boundaries, routes, fallback semantic objects and crisis layers. The result reads as a prototype board full of tokens rather than a coherent strategy world.

Clean-v0 question: if the current world-first requirement had been known from day one, the default zoom would not expose every semantic object and label simultaneously.

## Required outcome

Default desktop/medium map should first read as:

1. continuous geography
2. country/controller/front relationships
3. 4–7 dominant semantic landmarks
4. only then text/UI

Target dominant landmarks:
- capital
- industrial
- port
- frontier/fort
- one factual active crisis cue when present
- at most a couple of additional evidence-backed landmarks when necessary

## Simplification rules

### Object density

- Do not render all 21 integrated placements at equal visual priority.
- At `medium` default LOD, suppress micro/minor building families and repetitive settlement/project clutter.
- Keep macro/hero role cues.
- `near` may reveal additional factual objects after user focus/zoom.
- generic dense town / small settlement / repeated granary-yard / routine faction banner should not dominate the default scene.

Do this using the existing placement metadata/LOD/family information. Do not create a second selection framework.

### Terrain primitives

The current per-Hex `TerrainDetail` cone/circle language is visually cheap.

- Disable primitive mountain/forest/coast detail on the normal default map.
- Retain the shared continuous terrain mesh and interaction hit substrate.
- If a selected/near debug affordance requires a terrain marker, keep it minimal and contextual.
- External nature assets will be integrated later by the asset reconciliation pass.

### Political overlays

Preserve truth but reduce noise:
- legal owner: subtle
- physical controller: clearly stronger
- real front: strongest
- ideology region surface: low-opacity substrate, not a big circular/colored visual mass
- remove or strongly suppress `SurfaceDirectionalTreatment` if it adds graph-like lines over geography
- no fake front or fake motion

### Labels

Do not solve density with a more complicated collision algorithm.

Default medium labels should be limited primarily to:
- countries
- capital
- active crisis
- only genuinely major focused POI/Region when necessary

Move routine Region/project/POI labels to `near` or focused context. Target roughly <=8 labels on default desktop instead of 21.

### Legacy migration baggage

`PoliticalWorldStage.tsx` currently retains superseded legacy art functions and then references them with `void Legacy...` / `void UrbanClusterKit...` solely as migration reference.

Verify they have no production call sites. If dead, REMOVE them in this pass. Git history is the reference. Do not leave compatibility wrappers.

Do not remove active fallback consumers such as `ProceduralPoiObject` merely because a region composition can cover some facts; preserve factual fallback behavior where required.

## Allowed source ownership

Primary:
- `src/app/PoliticalWorldStage.tsx`
- `src/presentation/mapVisualSystem.ts`
- tests directly associated with those files

Avoid `mapContent` schema rewrites unless a tiny existing-metadata change is absolutely necessary. Do not introduce a new manager, renderer, model registry, LOD engine or style system.

## Browser acceptance

Capture same camera/framing:
- 1440x900 Day0 labels ON
- 1440x900 Day0 labels OFF
- 1440x900 Day90 rebellion

Record:
- label count
- integrated visible landmark count by LOD
- real front segment count
- whether primitive terrain details are visible by default

Human check:
- three countries/geographic theater first
- capital/industrial/port/frontier distinguishable without label spam
- Day90 rebellion reads from territory/front before banner text

## Verification

Run focused map/visual tests plus:
- typecheck
- lint
- format
- build
- git diff --check

Do not spend the timebox on the known full Vitest worker timeout.

Write `docs/parallel/P0_DEMO_MAP_SIMPLIFY_V1_RESULT.md`, commit/push, STOP. No P0 PASS or deployment.
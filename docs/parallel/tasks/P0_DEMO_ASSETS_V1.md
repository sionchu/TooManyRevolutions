# P0 Demo Assets V1 — Licensed Asset Import

EXECUTION_AUTHORITY: THIS_FILE_ONLY

## Base

- branch: `parallel-p0-demo-assets-v1`
- exact base: `e521961e25e4b20c70245137216c80a103120420`
- purpose: replace the current hand-built primitive art language with a small curated set of real licensed 3D assets.
- this branch does NOT own `PoliticalWorldStage.tsx`, `mapVisualSystem.ts`, `global.css`, simulation, contextual decisions, Gate1F, deployment, or final integration.

## Timebox

45 minutes implementation, then verification and push. Do not browse indefinitely.

## Art direction

Use ONE coherent asset ecosystem first. Do not create an asset-pack collage.

PRIMARY SOURCE — KayKit Medieval Hexagon Pack
- official page: https://kaylousberg.itch.io/kaykit-medieval-hexagon
- license: CC0 1.0 / free commercial use / no attribution required
- formats: FBX, GLTF, OBJ
- free tier: 200+ stylized medieval hex tiles/buildings/props
- explicitly includes roads, rivers, oceans/lakes, coasts, blacksmith, lumbermill, church, tavern, market, windmill, watermill, mine, houses, barracks, trees, rocks, hills and mountains
- single gradient atlas; optimized for mobile

SECONDARY SAME-STYLE SOURCE — KayKit Forest Nature Pack
- official page: https://kaylousberg.itch.io/kaykit-forest
- license: CC0 1.0 / free commercial use / no attribution required
- formats: FBX, GLTF, OBJ
- free tier: 100+ trees, rocks, bushes and grass
- same KayKit gradient-atlas visual language

OPTIONAL FALLBACK ONLY if a required hero slot genuinely cannot be filled from KayKit:
- Kenney Castle Kit: https://kenney.nl/assets/castle-kit — CC0
- Kenney Factory Kit: https://kenney.nl/assets/factory-kit — CC0
- Quaternius Medieval Village MegaKit: https://quaternius.com/packs/medievalvillagemegakit.html — CC0, glTF

Do not mix fallback packs merely for variety. If the KayKit asset is acceptable, use it.

## Acquisition rules

1. Download only from the official pages above.
2. Verify the license from the downloaded pack/readme or official page before committing any asset.
3. Do NOT commit downloaded zip archives or the complete 200+/100+ packs.
4. Curate only assets actually needed for the demo.
5. Keep original filenames where practical and record source mapping.
6. Do not modify or strip license/provenance records.
7. No assets ripped from reference games, no unknown-license Sketchfab models, no AI-generated 3D.

## Required asset slots

Curate the minimum useful set. Target roughly 10–20 model files, not hundreds.

- `capitalHero`: castle/church/civic landmark or a small coherent capital cluster
- `industrialHero`: mine + blacksmith/workshop/lumbermill style early-industry cluster
- `portHero`: waterside structure if one exists in the pack; otherwise leave slot unresolved rather than inventing a fake dock
- `frontierHero`: wall/barracks/castle/gate landmark
- `houseA`, `houseB`: optional minor settlement variants
- `mountainA`, `mountainB`
- `treeClusterA`, `treeClusterB`
- `rockCluster`
- `roadStraight`, `roadCurve` or nearest available equivalents
- `riverStraight`, `riverCurve` or nearest available equivalents
- `coast/water` pieces needed by the chosen port composition

Do not import animated units, characters, carts, boats, soldiers or people for this pass. TMR has no authoritative position/state for them.

## Repository output

Create a small asset root such as:

`public/assets/tmr/models/kaykit/`

Commit only the selected GLTF/GLB assets plus the shared texture(s)/bin files they require.

Create ONE manifest, suggested:

`src/presentation/modelAssets/worldAssetManifest.ts`

The manifest is the SSOT for:
- stable TMR slot ID
- public URL
- source pack
- original source filename
- license (`CC0-1.0`)
- source URL
- scale normalization
- rotation normalization if required
- optional semantic family

Do not create multiple registries/managers/factories.

A minimal renderer/gallery is allowed ONLY to verify that the assets load in R3F. Suggested `WorldAssetGallery.tsx`. It must not become another production map renderer.

## Acceptance

- real external licensed assets exist in repository, not placeholder descriptors
- all committed assets have verified CC0 provenance
- coherent KayKit style is dominant
- selected files load in browser/R3F
- no full raw pack or zip committed
- no production map runtime touched
- no model implies unsupported gameplay actors
- asset manifest has no duplicate truth with another new file

## Verification

At minimum:
- browser asset gallery screenshot at 1440x900
- typecheck
- lint
- format
- build
- git diff --check

Write `docs/parallel/P0_DEMO_ASSETS_V1_RESULT.md` with exact selected filenames, slots, licenses and screenshot path.

Commit/push and STOP. Do not self-authorize runtime integration or P0 PASS.
# P0 Demo Assets V1 — Result

## DELIVERY_SCOPE

- Branch: `parallel-p0-demo-assets-v1`
- Authorized starting HEAD: `f88ff40a45f6fa5f8b25561ff15e2aba8e520206`
- Execution authority: `docs/parallel/tasks/P0_DEMO_ASSETS_V1.md`
- Asset direction: KayKit Medieval Hexagon first, KayKit Forest Nature second
- Delivery state: curated repository assets and standalone browser/R3F load proof completed
- Runtime integration state: not performed; this branch does not own `PoliticalWorldStage`, map runtime, simulation, UI panels, audio, icons, deployment, or the P0 gate decision

## SELECTED_ASSETS

The manifest SSOT is `src/presentation/modelAssets/worldAssetManifest.ts`. It contains 17 model entries from the free tiers of two KayKit packs. Source filenames are retained below; the public URLs preserve each GLTF's adjacent `.bin` and atlas texture references.

| TMR slot | Selected original filename | Source pack | Normalization |
|---|---|---|---|
| `capitalHero` | `Assets/gltf/buildings/blue/building_castle_blue.gltf` | Medieval Hexagon | scale `0.72`, shared Y-up ground origin |
| `industrialHero` | `Assets/gltf/buildings/blue/building_mine_blue.gltf` | Medieval Hexagon | scale `1.0`, shared Y-up ground origin |
| `industrialHero` | `Assets/gltf/buildings/blue/building_blacksmith_blue.gltf` | Medieval Hexagon | scale `1.0`, shared Y-up ground origin |
| `portHero` | unresolved; no dock/port hero imported | — | no substitute model |
| `frontierHero` | `Assets/gltf/buildings/blue/building_barracks_blue.gltf` | Medieval Hexagon | scale `1.0`, shared Y-up ground origin |
| `houseA` | `Assets/gltf/buildings/blue/building_home_A_blue.gltf` | Medieval Hexagon | scale `1.0`, shared Y-up ground origin |
| `houseB` | `Assets/gltf/buildings/blue/building_home_B_blue.gltf` | Medieval Hexagon | scale `1.0`, shared Y-up ground origin |
| `mountainA` | `Assets/gltf/decoration/nature/mountain_A.gltf` | Medieval Hexagon | scale `1.0`, shared Y-up ground origin |
| `mountainB` | `Assets/gltf/decoration/nature/mountain_B.gltf` | Medieval Hexagon | scale `1.0`, shared Y-up ground origin |
| `treeClusterA` | `Assets/gltf/Tree_1_A_Color1.gltf` | Forest Nature | scale `0.5`, shared Y-up ground origin |
| `treeClusterB` | `Assets/gltf/Tree_3_A_Color1.gltf` | Forest Nature | scale `0.56`, shared Y-up ground origin |
| `rockCluster` | `Assets/gltf/Rock_1_A_Color1.gltf` | Forest Nature | scale `1.25`, shared Y-up ground origin |
| `roadStraight` | `Assets/gltf/tiles/roads/hex_road_A.gltf` | Medieval Hexagon | scale `1.0`, tile ground offset `+1Y` |
| `roadCurve` | `Assets/gltf/tiles/roads/hex_road_A_sloped_low.gltf` | Medieval Hexagon | nearest available sloped-road equivalent |
| `riverStraight` | `Assets/gltf/tiles/rivers/hex_river_A.gltf` | Medieval Hexagon | scale `1.0`, tile ground offset `+1Y` |
| `riverCurve` | `Assets/gltf/tiles/rivers/hex_river_A_curvy.gltf` | Medieval Hexagon | scale `1.0`, tile ground offset `+1Y` |
| `coast` | `Assets/gltf/tiles/coast/hex_coast_A.gltf` | Medieval Hexagon | scale `1.0`, tile ground offset `+1Y` |
| `water` | `Assets/gltf/tiles/base/hex_water.gltf` | Medieval Hexagon | scale `1.0`, tile ground offset `+1Y` |

Repository locations:

- Medieval assets: `public/assets/tmr/models/kaykit/medieval/Assets/gltf/`
- Forest assets: `public/assets/tmr/models/kaykit/forest/Assets/gltf/`
- Unmodified pack license records: `public/assets/tmr/models/kaykit/licenses/`
- Dependency inventory: 17 GLTF files, 17 adjacent `.bin` files, and 7 atlas copies required by the original relative URIs (two unique source textures). No ZIP archive or complete pack was committed.

The import contains no animated units, characters, carts, boats, soldiers, people, or other unsupported gameplay actors. One blue Medieval Hexagon palette and the Forest Nature palette keep the demo in one KayKit visual ecosystem.

## PROVENANCE_AND_LICENSE

Both official source pages identify the packs as CC0 / Creative Commons Zero, free for personal and commercial use, with GLTF included:

- KayKit Medieval Hexagon Pack: <https://kaylousberg.itch.io/kaykit-medieval-hexagon>
- KayKit Forest Nature Pack: <https://kaylousberg.itch.io/kaykit-forest>

The downloaded free-tier archives were not committed. Their retrieval hashes are recorded in the manifest for reproducibility:

- Medieval Hexagon free archive SHA-256: `4FBB374C45732C88522BD3439E9415BF568C683236EDE336B4E61D161155BA12`
- Forest Nature free archive SHA-256: `2EE83E63BB7695F2D884EC27DDF6FCE020789A452E7D5C5B0BBDFC4F6EA1FC8C`

The downloaded `License.txt` records are included with their license terms and provenance intact; repository line endings and blank-line indentation were normalized for clean source control diffs:

- `public/assets/tmr/models/kaykit/licenses/KayKit_Medieval_Hexagon_License.txt`
- `public/assets/tmr/models/kaykit/licenses/KayKit_Forest_Nature_License.txt`

## IMPLEMENTATION

- `src/presentation/modelAssets/worldAssetManifest.ts` is the single slot/asset/source/license/normalization manifest. It exposes `getWorldAssetEntry`, `getWorldAssetSlot`, and `getResolvedWorldAssetEntries` for a downstream integrator.
- Resolved slots can contain a small coherent set, so `industrialHero` resolves to mine + blacksmith. `portHero` is explicitly `unresolved` instead of using a non-port building.
- Every entry declares stable asset identity, TMR slot, public URL, source pack, original source filename, `CC0-1.0`, semantic family, uniform scale, rotation, translation, and shared ground-origin convention.
- `src/app/mapVisual/WorldAssetGallery.tsx` is a standalone R3F verifier using Three.js `GLTFLoader`. It clones each loaded scene, enables shadow flags on meshes, exposes asset metadata in `userData`, and never creates production map placements.
- `world-asset-gallery.html` and `src/worldAssetGalleryMain.tsx` provide a separate Vite entry. The existing procedural `WorldArtGallery` remains separate; no production path renders both assets for the same slot.
- `vite.config.ts` includes the standalone entry in the build output. No production layout/LOD or runtime ownership file was changed.

## BROWSER_EVIDENCE

The standalone page was served from the local Vite server at `http://127.0.0.1:4173/world-asset-gallery.html` and opened with Chrome headless at 1440×900.

- DOM marker: `data-expected-assets="17"`
- DOM marker: `data-loaded-assets` contained all 17 stable asset IDs
- R3F marker: Three.js `r185` canvas was present
- Visual evidence: `docs/parallel/evidence/p0-demo-assets-v1-gallery-1440x900.png`
- Screenshot SHA-256: `9A5023F4682D115C7D4D8C609F53EA64A93C8B5828492C30A2968526B66CB0C9`

The screenshot shows the selected capital, industrial, frontier, settlement, terrain, road, river, coast, and water models. The port card is visibly marked `unresolved`; no fake dock is shown.

## VERIFICATION

- `node node_modules/vitest/vitest.mjs run src/presentation/modelAssets/worldAssetManifest.test.ts src/app/mapVisual/worldAssetGallery.test.ts --reporter=verbose --no-file-parallelism` — 2 files / 5 tests passed.
- `node node_modules/typescript/bin/tsc -b --pretty false` — passed.
- `node node_modules/eslint/bin/eslint.js .` — passed.
- `node node_modules/prettier/bin/prettier.cjs --check .` — passed. The repository `.prettierignore` excludes third-party KayKit GLTF JSON so the downloaded source files remain byte-for-byte unchanged.
- `node node_modules/vite/bin/vite.js build` — passed; the existing large-chunk warning remains.
- `node scripts/build-sites-worker.mjs` — passed.
- Browser/R3F load proof — 17/17 selected model entries loaded in the standalone gallery.
 - `git diff --cached --check` — passed after staging.

## KNOWN_LIMITATIONS

- `portHero` remains unresolved because the selected free KayKit source did not provide a dock/port hero that could be truthfully assigned to that slot. Coast, water, and river infrastructure are present.
- The branch prepares a licensed asset-slot manifest and load proof; it does not self-authorize production runtime integration or a P0 gate decision.
- Existing procedural assets remain available for the downstream integration seam. Since no production slot was switched in this branch, there is no simultaneous procedural-plus-GLTF production render to remove here.
- The gallery is a browser load/visual inspection scene, not the final map camera, map LOD policy, or gameplay authority path.

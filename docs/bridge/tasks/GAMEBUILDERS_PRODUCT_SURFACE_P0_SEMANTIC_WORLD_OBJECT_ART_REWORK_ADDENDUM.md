# GAMEBUILDERS_PRODUCT_SURFACE_P0 — Semantic World Object / Art Readability Rework

Date: 2026-08-26
Task: `GAMEBUILDERS_PRODUCT_SURFACE_P0`
Status: AUTHORIZED TARGETED REWORK
Review basis: `docs/P0_WORLD_STAGE_REWORK_CODE_REVIEW_2026-08-26.md`

## Gate position

The R3F engine/world-stage architecture is accepted. Do **not** reopen renderer selection.

```text
R3F_ENGINE_INTEGRATION: PASS
WORLD_SCENE_MODEL: PASS
ROADMAP_GRAPH_KERNEL: PASS
QUALITATIVE_HUD_DIRECTION: PASS
P0_PRODUCT_VISUAL_PASS: NO
TARGETED_REWORK: SEMANTIC_WORLD_OBJECT_AND_ART_READABILITY
```

## Mission

Turn the accepted R3F graybox world stage into a semantically recognisable miniature political world without inventing simulation facts.

The next pass is not another engine migration and not generic decoration. It is the layer that makes the player recognise what the state has become and what is happening **before reading text**.

## 1. Renderer-neutral semantic object model

Extend `WorldSceneModel` or adjacent presentation metadata with explicit render families rather than ad hoc component conditions.

Suggested families:

```text
SettlementVisual
PoiVisual
StateProjectVisual
FactionActivityVisual
ConflictActivityVisual
RouteActivityVisual
InstitutionLandmarkVisual
DecorativeTerrainVisual
```

Every object must retain one truth classification:

```text
AUTHORITATIVE_PROJECTION
DERIVED_PRESENTATION
DECORATIVE_SUBSTRATE
```

## 2. Distinct State Project silhouettes

Current generic `ProjectLandmark` geometry is insufficient.

At minimum, `food | civic | industrial` must produce visually different silhouettes and lifecycle states.

Target examples, adapted to TMR rather than copied from another game:

- **food / distribution:** granary, storehouse, distribution-yard silhouette;
- **civic / institutional:** assembly hall, parliament/constitutional hall silhouette;
- **industrial / public works:** workshop/factory/public-works silhouette.

Requirements:

- `not-started` does not appear as a completed world object;
- `implementing` visibly reads as under construction/implementation without a fake second timer;
- `completed` has a durable, recognisable silhouette;
- project type is recognisable without opening `StateProjectPanel`;
- progress remains existing intervention lifecycle projection only.

Do not create a new construction resource or writer.

## 3. Authored settlement / POI presentation metadata

Where existing scenario/content supports it, create stable presentation metadata for recognisable world places.

Allowed examples:

```text
capital / palace
port / trade town
mine / industrial works
fort / border checkpoint
granary / distribution site
assembly / state institution
```

This metadata is static authored presentation/content, not dynamic simulation authority.

Do not infer a fort, mine, port or city merely from a color or arbitrary renderer choice. Link each POI to a scenario Region/LandHex/content identity with provenance.

## 4. Conflict / uprising game-world language

Keep existing factual controller, faction presence, active Conflict and derived front evidence.

Add stronger **derived** visual language such as:

- faction banner/standard on actually faction-controlled territory;
- barricade/camp/occupied-building silhouette when actual conflict/faction/controller evidence exists;
- smoke/beacon/pulse effect anchored to a real affected/contested Region;
- controller-transition emphasis and derived front treatment;
- capital-threat treatment when actual state supports it.

These are symbolic/derived world cues. They do not represent exact army positions, troop counts, battle formations or casualty numbers.

A player should locate the active rebellion in under 3 seconds without opening Chronicle or a text drawer.

## 5. Route / movement language

Retain current factual route pulse but differentiate channel grammar.

Example presentation families:

```text
trade       -> warm route / commodity-flow glyph or pulse
information -> thin fast signal/scroll/light pulse
migration   -> spaced directional flow marks
border      -> gate/checkpoint line state
```

Do not convert particles into literal cargo/person counts. Route visuals express active channel/type/relative presentation only.

## 6. Terrain and polity identity

The world should stop reading as uniformly colored extruded cylinders.

Required:

- coherent low-poly/isometric terrain family;
- country/legal-owner identity remains readable;
- controller remains distinct from owner;
- terrain/objects do not obscure political truth;
- country/region labels are subordinate to the world objects, not the primary art;
- current neighboring polity identity remains clear.

Use reusable geometry/instancing/LOD where appropriate. Asset provenance must be documented for any third-party or generated asset.

## 7. Institutional Roadmap visual polish

The graph kernel is accepted. Do not return to cards/list.

Improve the tree so it reads as a game progression surface:

- branch/path hierarchy stronger than individual rectangles;
- enacted path visually persistent;
- reachable vs blocked vs incompatible readable at a glance;
- labels concise Korean first;
- long explanation moved to details;
- no raw IDs/enums;
- map of future choices should be understandable without reading every node.

References such as Civilization/HOI4 are for navigation/branch readability only; no research currency or scripted historical authority.

## 8. TMI / HUD ceiling

Default persistent HUD should show only high-value qualitative signals and time controls.

Target default visible status signals: **3–4 maximum**, plus one urgent spatial alert when needed. Secondary/exact metrics stay behind `수치`, `상세`, or WHY/detail surfaces.

Do not let a row of qualitative boxes simply replace a row of numeric boxes if it still dominates the gaze order.

Target gaze order:

```text
WORLD
-> spatial event / project / institution cue
-> player decision opportunity
-> compact qualitative state
-> exact numbers/details
```

## 9. Visual reference enforcement

Update the reference matrix with a **rendered-output acceptance** row for every changed visual family.

At minimum:

- Plague/Rebel Inc: world remains primary while activity visibly moves;
- Civilization/HOI4: institutional branch/path readable without reading all labels;
- Against the Storm: completed development visibly changes the world;
- CK-style geography: neighboring polity identity remains legible;
- prior/current TMR: negative baseline of abstract ring/generic landmark/dashboard grammar.

No commercial art/code/assets copied.

## 10. QC / screenshot gate

Automated tests are necessary but insufficient.

Required fresh evidence from the deployed production commit:

1. **Day 0 world screenshot** — readable terrain, polity, authored places;
2. **first rebellion/territorial-change screenshot** — rebellion location obvious in <3 sec;
3. **project implementing screenshot** — project site visibly under implementation;
4. **project completed screenshot** — food/civic/industrial type visually recognisable;
5. **late-state screenshot** — visibly different built/political world from Day 0;
6. **Institutional Roadmap screenshot** — path/branches readable, no raw IDs;
7. **390×844 mobile screenshot** — map/world dominates, HUD does not become a card wall.

Required recognition questions:

```text
FOOD_CIVIC_INDUSTRIAL_SILHOUETTES_DISTINCT: YES
REBELLION_LOCATABLE_WITHOUT_TEXT_IN_3S: YES
CONTROLLER_CHANGE_VISIBLE_WITHOUT_CHRONICLE: YES
AUTHORED_POI_FAMILIES_RECOGNISABLE: YES
ROUTE_CHANNELS_VISUALLY_DISTINCT: YES
DAY0_LATE_WORLD_VISUALLY_DIFFERENT: YES
ROADMAP_BRANCHES_READABLE_AT_GLANCE: YES
DEFAULT_HUD_DOMINATES_GAZE: NO
RAW_DEBUG_TMI_LEAKAGE: NO
MOBILE_WORLD_FIRST: PASS
```

## 11. Verification

Run at minimum:

```text
pnpm run format
pnpm run typecheck
pnpm run lint
pnpm run build
focused worldScene/renderer/roadmap/project tests
pnpm test
relevant T018/T021/T024/V01 inspections
git diff --check
```

Redeploy the exact pushed production commit and record deployment provenance.

## Hard boundaries

- R3F remains production renderer unless a regression blocker is demonstrated;
- preserve `WorldSceneModel` authority separation;
- no new tactical/unit simulation for decoration;
- no exact army/cargo/person locations absent from state;
- no fake project progress/completion;
- no generic tech/reform/political mana;
- no authored historical focus outcome;
- no direct renderer mutation of WorldState;
- no persistence V9;
- no Gate1F PASS;
- no V02;
- no successor self-authorization.

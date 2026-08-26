# GAMEBUILDERS_PRODUCT_SURFACE_P0 — Map Visual System / Art Direction Addendum

Date: 2026-08-26
Task: `GAMEBUILDERS_PRODUCT_SURFACE_P0`
Status: AUTHORIZED TARGETED MAP VISUAL REWORK

## Why the current map still looks rough

The project now has data/render layers, but it does not yet have a coherent **cartographic visual system**. Layer existence is not the same as visual hierarchy.

Current failure pattern:

```text
terrain layer exists
+ POI layer exists
+ route layer exists
+ conflict layer exists
+ labels exist
!= finished strategy map
```

The current output still reads like editor/blockout geometry because the following systems are missing or insufficient:

1. macro / meso / micro spatial hierarchy;
2. coherent world scale and object scale rules;
3. authored geography composition;
4. terrain material / lighting / atmosphere language;
5. settlement / infrastructure density and clustering;
6. label decluttering and zoom hierarchy;
7. camera presets designed around player tasks rather than bounding-box fit;
8. state-change visual grammar that uses territory/areas before icons;
9. art-asset kit and shared shape language;
10. screenshot-based art acceptance separate from code/data acceptance.

## Product visual target

TMR should read as a **grand-strategy political atlas rendered as a restrained 2.5D miniature world**, not as a hex board and not as a collection of floating 3D icons.

Reference roles:

- Romance of the Three Kingdoms / Civilization: grid/topology is subordinate to continuous geography, cities, chokepoints and infrastructure;
- Hearts of Iron: one geography supports political, supply, front and activity layers at different zoom levels;
- Plague Inc / Rebel Inc: geography remains the persistent playfield and hotspots/routes are immediately readable;
- TMR: politics remains spatial and factual while retaining its own restrained historical-document visual identity.

Do not copy commercial assets, exact UI, map geometry or simulation rules.

## 1. Three-scale map hierarchy

### Macro — world / country scale

Must read first:

```text
landmass / geography silhouette
country / controller territory
mountain ridge / river / coast / major route
capital / major crisis
```

No minor POI, fine labels, or full LandHex grid at this distance.

### Meso — Region scale

Must reveal:

```text
Region identity
settlement cluster
mine / industrial district / port / fort / granary / parliament
roads / trade paths
projects
controller/front detail
```

### Micro — selected LandHex / local detail

Only here reveal:

```text
selected LandHex boundary
minor object detail
fine activity
exact local facts on demand
```

The same objects must not remain the same visual size at all zoom levels.

## 2. Geography must be composed, not tiled

Logical LandHex remains authority, but art is authored through geography features:

```text
terrain height field / control points
biome or land-use masks
mountain ridge splines / polygons
river splines
road / rail / trade-route splines
coast / water polygons
forest / farmland / urban density zones
```

Do not represent geography as repeated identical per-Hex patches.

Adjacent similar LandHexes should visually merge into one landscape region.

## 3. Spatial composition / density

Every important Region needs a recognisable composition rather than one object at its center.

Examples:

### Capital Region

```text
palace / government seat
urban cluster
assembly / institutional building
radial major roads
```

### Industrial Region

```text
mine or works
industrial cluster / stacks
road/rail connection
worker/faction hotspot if factual
```

### Agricultural / distribution Region

```text
field/farmland pattern
village or granary cluster
food/distribution project object
```

### Frontier Region

```text
fort / gate / checkpoint
road chokepoint
border emphasis
```

These are authored presentation compositions tied to actual Scenario/Region/LandHex identities. Do not invent unsupported economic mechanics.

## 4. Object scale hierarchy

Screen importance, not physical realism alone, determines presentation scale.

Relative hierarchy:

```text
capital / major city landmark    1.00
major State Project             0.85
port / mine / fort / institution 0.65-0.75
minor settlement / infrastructure 0.45-0.60
activity marker                  0.35-0.50
terrain props                    0.20-0.45
```

The current failure where trees, mountains, forts, cities and crisis flags compete at similar visual weight must be removed.

## 5. Coherent asset language

Primitive box/cone/cylinder geometry is accepted only as blockout/diagnostic evidence, not as final product-art acceptance.

Create or import a small coherent low-poly 2.5D kit with documented provenance.

Minimum reusable families:

```text
capital / palace
city / town cluster
assembly / parliament
port
mine
industrial works
fort / gate / checkpoint
granary / warehouse / distribution yard
road / bridge / rail-like infrastructure where supported
barricade / faction standard / crisis beacon
forest cluster
mountain ridge pieces
farmland / field patches
```

Preferred pipeline:

```text
Blender or authored procedural source
-> glTF/GLB
-> shared material palette / texture atlas
-> R3F loader
-> instancing for repeated props
-> LOD / visibility policy
```

Third-party/generated assets require provenance records and license review.

## 6. Material / lighting / atmosphere

Current flat primitive colors create an editor-blockout feel.

Target:

- restrained historical palette;
- terrain color variation/noise without destroying political readability;
- directional light + soft ambient fill;
- contact shadow / AO-style grounding so buildings do not float;
- subtle fog/atmospheric depth at far zoom;
- consistent roughness/material family;
- crisis color reserved for meaningful state changes;
- country/controller color is an overlay/tint, not the entire material identity.

Avoid glossy toy-plastic appearance.

## 7. Political overlays must be surfaces, not marker clutter

### Controller / rebellion

Faction-held adjacent cells:

```text
merged occupied area
+ outer perimeter
+ 1-2 strong faction/crisis anchors
+ front boundary where factual
```

Do not place a full red flag and full Hex outline on every controlled cell.

### Ideology

Use Region-scale tint/pattern/decal/gradient/noise treatment.

Do not use large persistent rings as the main ideology representation.

### Crisis

Use area emphasis + grounded symbolic objects + restrained FX.

One strong readable hotspot is better than many equal icons.

## 8. Infrastructure and routes

Routes should visually belong to the geography.

- roads follow terrain and connect actual settlement/POI anchors;
- trade/information/migration/border channels use distinct but restrained grammar;
- route animation intensity depends on zoom/importance;
- do not show every route with the same weight;
- at far zoom show only major active corridors.

## 9. Labels

Implement label priority and collision/visibility policy.

Priority example:

```text
country > capital > crisis > major Region > major POI > minor POI
```

Rules:

- labels fade/appear by LOD;
- no overlapping Korean labels over buildings;
- halo/contrast for readability;
- one Region should not display every POI label simultaneously;
- object silhouette should remain meaningful when its label is hidden.

## 10. Camera composition

Bounding-box fit alone is not a product camera.

Required presets:

```text
desktop-theater
mobile-player-theater
country-focus
region-focus
crisis-focus
project-focus
global-fit (explicit action only on mobile)
```

Default camera acceptance:

- player country/core geography occupies most of the view;
- important neighboring borders remain visible;
- major POIs are recognisable at default zoom;
- empty background does not dominate;
- mobile does not start at global-fit.

## 11. HUD integration

The map must not begin visually underneath a large DOM control board.

Persistent mobile HUD:

```text
country/date
play-pause + speed
<=3 qualitative status cues
one urgent alert when necessary
```

Everything else is contextual.

Map controls become compact overlay controls, not a rectangular toolbar that competes with the world.

## 12. Map Studio visual-authoring extension

The previously authorized Map Studio must also manage visual composition, not only data positions.

Add/edit modes:

```text
Geography
- height control
- biome / land-use mask
- ridge / river / coast

Infrastructure
- road / route spline

Settlement / POI Composition
- cluster anchor
- object type
- scale / rotation / offset
- density preset

Labels
- priority
- LOD range
- offset

Camera
- preset target / zoom / tilt

Style
- palette / material preset
- layer visibility
```

MapPatch v1 (or successor version if justified) should store presentation-authoring changes separately from simulation topology.

## 13. Visual QA separate from technical QA

Do not PASS because an object exists in `WorldSceneModel`.

Required screenshot questions:

```text
Does the map look authored rather than procedurally tiled?
Does the capital read as a capital with labels hidden?
Does the industrial Region read as industrial with labels hidden?
Can the rebellion be located in <=3 seconds?
Does faction territory read as an area, not repeated cells?
Do major roads/routes connect spatial anchors naturally?
Is the default camera dominated by useful world content rather than empty background?
Do Day0 and late-state images show a materially different built/political world?
Does mobile first view look like a strategy game, not a dashboard above a map?
```

Required markers:

```text
MAP_VISUAL_SYSTEM: PASS
MACRO_MESO_MICRO_HIERARCHY: PASS
AUTHORED_GEOGRAPHY_COMPOSITION: PASS
PRIMITIVE_BLOCKOUT_LOOK_DOMINANT: NO
REGION_COMPOSITION_READABLE_WITHOUT_LABELS: YES
OBJECT_SCALE_HIERARCHY: PASS
MATERIAL_LIGHTING_GROUNDING: PASS
LABEL_COLLISION_POLICY: PASS
DEFAULT_CAMERA_EMPTY_SPACE_DOMINANT: NO
REBELLION_REPEATED_CELL_ICON_CLUTTER: NO
MOBILE_GAME_MAP_FIRST_IMPRESSION: PASS
```

## Hard boundaries

- no simulation/topology rewrite for art reasons;
- no LandHex-count increase merely to make the map look richer;
- no exact units/cargo/population visuals that imply unsupported state;
- no copied commercial assets;
- no renderer migration;
- no direct Map Studio -> GitHub writes;
- no Gate1F PASS;
- no V02.

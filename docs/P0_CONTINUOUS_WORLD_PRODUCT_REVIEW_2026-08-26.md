# P0 Continuous World Product Review — 2026-08-26

Status: CHATGPT PRODUCT REVIEW — TARGETED MAP REWORK REQUIRED
Reviewed branch: `gamebuilders-product-surface-p0`
Reviewed branch head: `f6c3c2bbb03a516d081b859c01838a447d3caacc`
Reviewed deployed-source result: `9befdf7aaee6eafe75a4601369a2624691a4a189`
Evidence: user-supplied desktop/mobile gameplay screenshots plus Content Studio screenshots

## Verdict

The latest rework successfully closes the **content-authoring architecture** requirement, but it does **not** yet close the map/world product requirement.

```text
TITLE_BRIEFING_CONTENT_AUTHORING_PIPELINE: PASS
TITLE_BRIEFING_BASELINE_COPY: DRAFT / USER_EDIT_REQUIRED
R3F_ENGINE_AND_WORLD_SCENE_MODEL: PASS / RETAIN
SEMANTIC_OBJECT_KERNEL: PASS / RETAIN
P0_MAP_PRODUCT_PASS: NO
PRIMARY_REMAINING_BLOCKER: WORLD_VISUAL_HIERARCHY_AND_CAMERA
GATE1F: NOT_READY
V02: NOT_STARTED
```

Do not reopen renderer selection, Content Studio architecture, or the simulation core.

## 1. Content Studio — accepted architecture

The title and opening briefing now resolve through stable ContentRegistry records rather than direct `PLAYER_COPY`-only reads. Content Studio can edit the same stable IDs, preview title/briefing drafts, export/import JSON patches, and reset drafts. Runtime remains static/reviewed and does not require an LLM.

This is the intended authoring workflow:

```text
scenario facts
-> authoring-time generated/imported draft copy
-> stable ContentRegistry IDs
-> Content Studio edit / live preview
-> JSON patch handoff
-> repo patch / review / deploy
```

The currently deployed prose is **not approved as final copy**. That is not an engineering blocker anymore; it is user/editorial authoring work.

## 2. Map stage dimensions improved, but the world itself is still visually too small

The CSS/world-stage DOM now spans almost the full viewport width and meets the reported numeric mobile stage size. However, the screenshots show a different product truth:

- the *container* is large;
- the actual political world/object cluster occupies a small central portion of that container;
- large empty olive terrain/backdrop areas dominate;
- on mobile, header + five qualitative metrics + time controls still consume a large fraction of the first viewport before the world is read.

Therefore DOM stage width/height is not sufficient acceptance evidence.

Future QC must measure **world-content occupancy**, not only container dimensions.

## 3. “Continuous terrain” is technically present but not visually convincing

Current `TerrainWorldSurface` constructs one six-triangle fan for every logical LandHex and places it over a large flat `TerrainBackdrop`. Adjacent cells can visually touch, but the visual language is still generated from individual hex fans and broad flat background rather than reading as a geographic landscape.

The screenshots still read as:

```text
flat olive board
+ repeated circles/rings
+ occasional six-sided outlines
+ small primitive landmarks
```

rather than:

```text
continuous terrain / geography
+ cities / works / borders / routes
+ hidden logical hex interaction substrate
```

The next pass must make terrain/geography the first visual channel and hex topology a hidden interaction channel.

## 4. Hex visibility is still too dominant during political change

Day 0 is improved compared with the raised-hex version, but the Day 90 / late screenshots show many complete hex perimeters simultaneously because faction-controlled/front hexes trigger contextual grid rendering.

This technically follows the current rule, but product-wise it recreates the board-game look exactly when the world becomes politically interesting.

New rule:

```text
selected one hex -> full selected-cell outline allowed
movement/targeting lens -> temporary grid allowed
faction control -> merged territory tint/pattern + outer perimeter only
front -> only shared controller-boundary/front segments
normal map -> no repeated individual hex perimeter
```

A rebellion should look like a contiguous occupied political area with a front, not a collection of outlined hex tokens.

## 5. Political influence rings are still board markers

Large circular/torus overlays remain visually prominent. They read as game tokens placed on a board rather than political influence embedded in geography.

Region-level ideology/political influence should instead use a soft terrain tint, pattern, density/noise mask, gradient/decal, or other region-surface treatment. Exact numerical strength remains detail-on-demand.

## 6. Semantic POI/project work is useful but too small at the default camera

The latest source now has authored POIs/institutions and distinct visual families. This kernel should be preserved.

The screenshots still make those objects too small relative to empty world space. The player should first recognize the palace/capital, iron works, port/fort, state works and crisis location, then labels.

This is primarily a framing/scale/hierarchy problem, not a need for another object-system rewrite.

## 7. Mobile camera strategy must differ from desktop

A portrait phone cannot show a wide multi-country world and also make its objects large if it always performs a full-world fit.

Required default behavior:

```text
desktop -> whole authored theater may fit by default
mobile portrait -> player country + immediate border context is the default camera
                 -> neighbor edges remain visible
                 -> pan to explore
                 -> explicit “전체 보기” returns to global fit
```

The current mobile screenshot proves that `100% stage width` alone does not make the world dominant.

## 8. HUD still dominates the first mobile gaze

Current mobile screenshot shows:

- brand/title block;
- five qualitative metric boxes;
- exact-number disclosure;
- playback row;
- auxiliary progress disclosure;
- auto-pause row;
- then the map.

Replacing numbers with qualitative text did not fully solve dashboard dominance.

Target persistent mobile HUD:

```text
small date/country strip
+ play/pause/speed controls
+ max 2–3 high-value status cues
+ one urgent alert if present
```

Everything else moves to `국정`, settings, or an expandable details surface.

`+1일/+7일/+30일`, sound, title return, exact values, auto-pause explanation and secondary status should not occupy prime persistent world space.

## 9. Pressure/crisis should be spatial first

The bottom-left `현재 압력` card is still a major visual rectangle over the world. Pressure should be visibly anchored to the affected region/actor first; a compact label or contextual detail can open on tap.

The existing factual Agenda/Conflict derivation remains authoritative. Only presentation hierarchy changes.

## 10. Revised acceptance tests

Do not accept using `world-stage width = 100%` alone.

Required visual metrics/tests:

```text
WORLD_CONTENT_OCCUPANCY_DESKTOP_WIDTH: >= 75%
WORLD_CONTENT_OCCUPANCY_DESKTOP_HEIGHT: >= 55%
MOBILE_DEFAULT_CAMERA: PLAYER_COUNTRY_AND_BORDER_CONTEXT
WORLD_CONTENT_OCCUPANCY_MOBILE_WIDTH: >= 88%
WORLD_CONTENT_OCCUPANCY_MOBILE_STAGE_HEIGHT: >= 45%
FIRST_MOBILE_VIEWPORT_WORLD_SHARE: >= 60%
PERSISTENT_MOBILE_STATUS_CUES: <= 3
INDIVIDUAL_HEX_OUTLINES_NORMAL: 0
INDIVIDUAL_HEX_OUTLINES_REBELLION: selected/target only
FACTION_CONTROL_MERGED_AREA_OR_OUTER_BOUNDARY: YES
IDEOLOGY_RING_TOKEN_LOOK_DOMINANT: NO
CONTINUOUS_GEOGRAPHY_READS_BEFORE_GRID: YES
POI_OBJECTS_READ_BEFORE_LABELS: YES
```

These are visual/product measurements, not simulation invariants.

## 11. What to preserve

- TypeScript simulation/action/time authority;
- LandHex logical/topological authority;
- R3F production renderer;
- renderer-neutral WorldSceneModel;
- Content Registry / Content Studio / JSON patch flow;
- authored POI/institution metadata;
- semantic project object families;
- real route/contact state;
- Conflict/controller/front truth;
- V8 persistence/replay;
- Roadmap graph kernel.

## 12. Hard boundaries

- no renderer migration;
- no LandHex/topology rewrite solely for visuals;
- no runtime LLM dependency;
- no fake terrain facts that imply gameplay state;
- no invented army/cargo/person positions;
- no fake project lifecycle;
- no generic research/political mana;
- no direct renderer mutation of WorldState;
- no persistence V9;
- no Gate1F PASS;
- no V02.

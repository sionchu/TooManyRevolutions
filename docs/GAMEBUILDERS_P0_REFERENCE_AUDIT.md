# GameBuilders P0 World-Stage Reference Audit

**Date:** 2026-08-26
**Status:** `REFERENCE_TRACEABILITY_MATRIX: PASS`
**Scope:** world-stage rework only. References contribute observable interaction
principles; they do not contribute copied art, code, assets, narrative authority,
or simulation rules.

## Traceability matrix

| Reference principle observed | TMR adaptation | Exact component / layer | Forbidden transfer | Hands-on acceptance |
| --- | --- | --- | --- | --- |
| [Plague Inc. Evolved](https://store.steampowered.com/app/246620/Plague_Inc_Evolved/) keeps the world map as the continuous systemic playfield. | Keep the political world visible while time advances; show only current Country, Region, LandHex, route, pressure, and Conflict projections. | `PoliticalWorldStage` / `tmr.layer.map.terrain`, `.political`, `.routes`, `.pressure` | No copied map art, disease metaphor, event rules, or proprietary assets. | Desktop map occupies the dominant playfield; Day 0→1080 changes remain visible in real projected layers. |
| [Rebel Inc. Escalation](https://store.steampowered.com/app/1088790/Rebel_Inc_Escalation/) uses geography, stability pressure, and time as the primary reading order. | Make legal ownership, physical controller, ideology flow, and crisis activity distinct visual channels; open details contextually. | `PoliticalWorldStage` / route, controller, influence, pressure, conflict objects | No copied terrain, insurgency rules, counter-insurgency authority, or UI. | A user can identify a neighboring polity, a controller difference, an active route, and a crisis without opening a dashboard. |
| [Civilization VI](https://civilization.virginia.edu/game/civilization-vi) presents institutional progression as a connected prerequisite graph. | Render the authored Policy catalog as positioned nodes with prerequisite arrows, incompatibility links, status, and fit/pan/zoom controls. | `InstitutionalRoadmapPanel` / contextual decision drawer | No copied tech-tree art, era rules, research currency, or progression schedule. | Drawer shows named nodes and edges; raw policy IDs and rule enums are absent from visible labels. |
| [Hearts of Iron IV](https://store.steampowered.com/app/394360/Hearts_of_Iron_IV/) makes branch choices and locked paths spatially legible. | Show enacted, available, prerequisite-blocked, and incompatible Policy nodes as stateful graph styling backed by current `PolicyState`. | `InstitutionalRoadmapPanel` / `institutionalRoadmap.ts` | No copied focus-tree content, national goals, scripted branch outcomes, or time gates. | Changing a real policy updates the existing policy state and graph status; no second progression writer exists. |
| [Against the Storm](https://store.steampowered.com/app/1336490/Against_the_Storm/) communicates accumulated settlement progress through recognizable world objects. | Represent existing intervention commitments/completions as distinct in-world landmarks, with state and source event details on demand. | `PoliticalWorldStage` / `tmr.layer.map.settlements`; `StateProjectPanel` | No copied settlement art, resource economy, construction queue, or invented project completion. | Starting a real intervention creates an implementing landmark; only the existing completion event changes it to completed. |
| [Crusader Kings III](https://store.steampowered.com/app/1158310/Crusader_Kings_III/) uses neighboring political geography and heraldic grouping for readable context. | Give authored neighboring Countries distinct map tints, labels, capitals, and legal ownership boundaries. | `PoliticalWorldStage` / labels, settlements, political substrate | No copied heraldry, map geometry, dynasty systems, or commercial UI. | Arken, Veloria, and Karsen are simultaneously identifiable in the world stage and in the contextual region view. |
| Current TMR screenshot baseline showed a flat SVG hex strip, list-like roadmap, tiny project glyphs, and raw debug vocabulary. | Replace the production SVG path with the selected R3F scene; promote roadmap to a node graph; give projects 2.5D landmarks; keep detail vocabulary on demand. | `WorldSceneModel` → `PoliticalWorldStage`; `InstitutionalRoadmapPanel`; compact HUD | No invented tactical fronts, armies, cargo, score, or fake map activity. | Production DOM has `data-map-renderer="r3f"`, no player-facing `fixture.*`/`PREREQUISITE_NOT_MET`, and the map remains visible under contextual surfaces. |

## Renderer and repository license audit

The benchmark used the same frozen `WorldSceneModel` for both candidates. The
installed package metadata was checked locally on 2026-08-26:

| Package | Version | License | Decision |
| --- | ---: | --- | --- |
| `@react-three/fiber` | 9.7.0 | MIT | Adopted for production R3F world stage; React 19 integration and real orthographic depth match the product requirement. |
| `three` | 0.185.1 | MIT | Adopted as R3F's scene/runtime dependency; only project-authored procedural geometry is used. |
| `pixi.js` | 8.20.0 | MIT | Kept as isolated comparison spike; not used by the production app path. |
| `Azgaar/Fantasy-Map-Generator` | public repository | MIT | Principle reference only: separate political geography and labels; no code/assets copied. |
| `Hellenic/react-hexgrid` | public repository | MIT | Principle reference only; not adopted because the selected scene needs 2.5D depth. |
| `freeciv/freeciv-web` | public repository | AGPL | UX principle reference only; no code/assets copied and no AGPL dependency introduced. |

The repository links above were checked for their published license statements;
commercial game pages were used only for interaction and presentation principles.
No third-party art, screenshot, shader, map data, or code is in the TMR bundle.

## Enforced boundaries

- `WorldState` and `EventStore` remain the only simulation authority.
- `PresentationState` is the read model; `WorldSceneModel` adds renderer-neutral
  positions and truth classes without creating stored state.
- `PoliticalWorldStage` owns only camera/focus/hover presentation state and
  never calls a simulation writer.
- Project landmarks are projections of existing intervention commitments and
  completion events; there is no construction timer, resource, or new writer.
- The renderer does not create army/front/cargo facts. Conflict geometry comes
  from the existing active Conflict/front projection only.
- Save/load remains `SerializedSimulationSnapshotV8`; no persistence V9 work is
  part of this checkpoint.

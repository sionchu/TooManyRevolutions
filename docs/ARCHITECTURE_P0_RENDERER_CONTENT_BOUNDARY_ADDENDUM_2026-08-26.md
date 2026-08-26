# Architecture Amendment — P0 Renderer, Presentation Delta, Chronicle, Content Studio

Date: 2026-08-26
Status: ACTIVE ARCHITECTURE AMENDMENT FOR P0
Parent: `docs/ARCHITECTURE.md`

> This amendment must be folded into the relevant canonical `docs/ARCHITECTURE.md` sections during the next P0 documentation-alignment checkpoint. It does not weaken any existing simulation-authority invariant.

## 1. Authority layers

```text
Authoritative simulation state / time / actions
= existing TMR TypeScript simulation core

Application UI / menus / drawers / authoring tools
= React DOM

Persistent world rendering candidate
= PixiJS v8 (bounded P0 spike) OR one documented SVG fallback

Presentation deltas
= derived from authoritative state/events only
```

The renderer is a projection consumer, not a simulation owner.

## 2. No second clock

PixiJS, Phaser, requestAnimationFrame, React effects, CSS animation, or any presentation loop must not create or own a second authoritative simulation clock.

Visual animation time may interpolate already-known presentation states but may not advance political/economic/conflict simulation independently.

## 3. No renderer mutation of WorldState

Renderer/UI code must not directly mutate:

- `WorldState`;
- `PolicyState`;
- `Faction` authoritative fields;
- `Conflict` authoritative fields;
- `LandHex.controller`;
- EventStore;
- ActionRecord history.

Player actions continue through the existing proposal/action/simulation boundary.

## 4. WorldVisualDelta boundary

`WorldVisualDelta` or equivalent is presentation-only derived data.

Possible sources:

- committed GameEvent/EventStore changes;
- before/after authoritative world projection;
- current active Conflict state;
- current Policy/Institutional state;
- current LandHex controller state;
- current Region ideology state;
- existing Intervention commitment/completion state.

It may drive camera focus, tint/pattern interpolation, route pulses, controller transitions, HUD alerts and approved project visual states.

It may not generate or imply a simulation fact that does not exist.

## 5. ChronicleDigest boundary

`EventStore` remains append-only authoritative history.

`ChronicleDigest` is a deterministic/presentation grouping and prioritization layer.

Requirements:

- preserve source EventId(s) or equivalent provenance;
- no rewriting/deleting source events;
- no new causal claim without source data;
- no new outcome;
- grouping/order must be deterministic for the same recorded history where deterministic presentation is required.

## 6. Institutional Roadmap boundary

The Roadmap reads existing `PolicyDefinition`, prerequisites/incompatibilities, current PolicyState and real feasibility information.

It does not own unlock state independently.

There is no Roadmap XP, research point, reform point, chapter, hidden timer or story-node state.

## 7. State Project presentation boundary

A State Project presentation must point to an existing authoritative action/lifecycle.

```text
project presentation ID
-> stable mapping to approved Policy/Intervention/action identity
-> existing commitment/duration/completion
-> presentation state
```

No separate project completion timer or fake completion event.

Persistent landmark visibility after completion is presentation state derived from actual completed history/current approved projection.

## 8. Content Studio boundary

Content Studio is development-only authoring UI.

It may edit/export content-layer records such as:

- stable player-facing copy IDs;
- screen/entity/event/policy/intervention/project labels/descriptions;
- branch/variant presentation copy;
- template metadata where allowed.

It must not edit authoritative runtime save/world values, fabricate EventStore history, bypass ActionProposal/ActionRecord paths, or act as an admin cheat panel for simulation state.

Static deployment does not directly write GitHub. JSON patch export/import is content transport, not runtime authority.

## 9. Renderer adoption rule

PixiJS adoption requires an explicit decision entry covering:

- problem solved;
- integration boundary;
- dependency/version;
- camera/input strategy;
- fallback/rollback;
- responsive/touch behavior;
- build/performance impact;
- proof that simulation/replay/persistence boundaries remain unchanged.

If the spike fails those criteria, one SVG renderer remains production authority for the P0 world surface.

Do not leave two competing production map authorities.

## 10. Persistence

These presentation/content changes do not by themselves authorize persistence V9.

A persistence version change requires a separate task/decision when authoritative persisted simulation shape actually changes.

## 11. Gate boundary

P0 renderer/content/game-feel work does not authorize:

- Gate 1F PASS;
- V02;
- F05 successor runtime work;
- whole-engine migration;
- solver/universal utility state;
- generic tech/political currency.

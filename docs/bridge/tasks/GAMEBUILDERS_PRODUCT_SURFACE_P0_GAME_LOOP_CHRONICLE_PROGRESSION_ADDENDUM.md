# GAMEBUILDERS_PRODUCT_SURFACE_P0 — Game Loop / Chronicle / Progression Correction

TASK_ID: GAMEBUILDERS_PRODUCT_SURFACE_P0
STATUS: AUTHORIZED ADDENDUM
PRECEDENCE: after Gameplay Reality repair; strengthens Game Feel / Renderer / Visual UX requirements
WORK_BRANCH: gamebuilders-product-surface-p0

## 0. Hands-on blocker

Current hands-on play now produces real rebellion, coup, ideology and territorial changes, but the player still experiences the loop primarily as:

```text
time passes
-> crisis banner / counters
-> text decision
-> repetitive chronicle rows
```

The world is changing, but the game is not communicating accumulated history, spatial causality or construction/progression strongly enough. P0 remains open until this is repaired.

## 1. Chronicle is not the primary game output

Do not expose high-frequency low-level simulation events as repeated rows by default.

Examples of current failure:

```text
same tick: republican support changed
same tick: monarchist support changed
same tick: democratic support changed
same tick: communist support changed
...
```

These are valid EventStore facts but poor player-facing history.

Create a presentation-only `ChronicleDigest` / significant-history projection that groups related factual events by tick / Region / causal family without mutating or deleting EventStore history.

Required hierarchy:

```text
LEVEL 1 — major history
rebellion / coup / government transition / territorial loss / project completion / institution change

LEVEL 2 — strategic change
border action / faction strategy shift / major Agenda band change / project start

LEVEL 3 — background trend digest
ideology support deltas / resource changes / routine faction actions, grouped into compact summaries
```

Examples of acceptable digest presentation:

```text
1320일 · 철산 공업주의 정치 지형 급변
공산주의 ↑ / 왕정주의 ↓ / 민주주의 혼조
[지도에서 보기]
```

Do not invent a narrative event. Every digest must retain drill-down links to the exact source EventIds.

## 2. Every important history beat must be spatial first

A major event should first change/focus the world, and only secondarily produce text.

Required mapping:

```text
REBELLION_STARTED
-> camera focus to affected factual Region
-> persistent rebellion territory/control treatment
-> faction emblem / crisis marker where grounded
-> short banner

LAND_HEX_CONTROL_CHANGED
-> visible animated controller sweep
-> front/border change
-> old vs new controller tooltip

IDEOLOGY_SUPPORT_CHANGED
-> Region ideology overlay interpolation
-> directional pulse on factual contact route when source contribution exists
-> compact trend indicator, not one full chronicle row per ideology

BORDER_CLOSED / REOPENED
-> route visibly closes/opens

INSTITUTION_RULE_CHANGED
-> Institutional Roadmap node transition
-> capital/institution visual trace if semantically supported

INTERVENTION_STARTED / COMPLETED
-> project/implementation landmark state where catalogued
```

## 3. Progression fantasy: Institutional Roadmap + National Works

The player needs visible accumulation and ownership over the country they build.

### 3.1 Institutional Roadmap

Render existing PolicyDefinition prerequisites/incompatibilities as a visual node graph.

It may look and feel like a technology/policy tree, but its semantics must remain the real policy graph:

- no research points;
- no reform mana;
- no arbitrary era unlock;
- no hidden story progression;
- availability derives from actual PolicyDefinition and current InstitutionalRuleState.

The enacted path remains visually persistent so a player can see how their state constitution evolved.

### 3.2 National Works / memorable project landmarks

Use 2–4 P0 actions backed by real existing Intervention/Policy facts as memorable map-linked projects.

A completed project must leave a persistent visual trace on the map. It should give the `wonder / I built this` feeling without becoming a Civ-style abstract Wonder score.

Examples only when supported by existing real effects:
- royal granary / distribution network;
- industrial/public works site;
- constitutional assembly/parliament marker after a real institutional change;
- another existing action with a defensible Region/capital presentation anchor.

Required visible lifecycle:

```text
not started -> preparing/implementing -> completed landmark
```

Progress is only a projection of the real Intervention duration. No second construction timer.

## 4. Renderer decision

### P0 preferred architecture

```text
Simulation / Action / EventStore / time:
existing TMR TypeScript core

DOM application / title / drawers / roadmap / Content Studio:
React

Persistent world map / terrain / overlays / landmarks / camera / factual animation:
PixiJS v8 (+ React integration if stable)
```

Why Pixi first:
- keep existing authoritative simulation untouched;
- GPU-accelerated sprite/graphics/filter rendering;
- scene graph maps to TMR Layer Registry;
- easier to add terrain textures, masks, ideology patterns, landmarks, route effects and map tweens;
- less game-loop ownership than a full Phaser migration.

Phaser 4 remains a strong P1/full-client candidate because it provides cameras, tweens, particles, asset loading, filters, input and React integration, but do not move authoritative simulation/time into Phaser during P0.

Do not leave SVG and Pixi as two divergent production renderers. Spike -> decide -> one production renderer.

## 5. Game-art density requirement

The map must contain a coherent small asset set that makes the world feel authored, not a diagram:

- continuous land/terrain texture;
- mountains / forest / field / coast / industrial marks;
- capital/city/port/mine/industrial POI markers when actual Scenario data/presentation metadata supports them;
- country crests;
- faction emblems;
- National Work/project landmark states;
- controller/faction patterns;
- ideology patterns;
- route/front effects;
- one coherent icon family for HUD/actions.

Do not fill empty space with fake simulation entities. Decorative geography may exist only as clearly non-authoritative art substrate.

## 6. Main-game UI compression

Persistent screen target:

```text
MAP ~75%+
+ compact status rail
+ 1 current urgent alert
+ 1 objective/progression cue
+ edge/bottom controls
```

Everything else opens contextually.

Remove raw counters that do not help decision-making (`세력 행동 88건` by itself is not useful). Replace with qualitative/factual current actor state or trend summaries that link to map entities.

Do not show paragraphs on the default map surface.

## 7. Content Studio / user-editable branch text

The Content Studio requirement is mandatory and must cover branch/variant text, not just generic labels.

Use stable Content IDs with metadata at minimum:

```text
id
locale
category
screen
entityType / entityId
branchOrVariantId
conditionLabel (presentation metadata only)
text/template
allowedVariables
maxRecommendedLength
notes
tags
baselineRevision
```

Required UI:
- search by text/ID;
- filter by title/briefing/HUD/event/Agenda/policy/intervention/project/country/faction/region/outcome;
- filter by branchOrVariantId / condition label;
- inline edit;
- live preview;
- baseline vs edited diff;
- variable validation;
- local draft persistence;
- reset entry / reset all;
- import JSON patch;
- export JSON patch;
- copy JSON patch;
- show exact source stable ID so edits can be applied back to repository safely.

This editor is for player-facing presentation content. It must not mutate WorldState rules, crisis thresholds, LandHex controllers, Policy prerequisites or authoritative simulation state.

Static Sites cannot truthfully commit edits to GitHub without authenticated backend. P0 workflow remains:

```text
edit/preview in Content Studio
-> export patch JSON
-> apply patch through Codex/ChatGPT/repo tooling
-> rebuild/redeploy
```

## 8. Hands-on acceptance

P0 cannot be considered product-passed from automated state-change tests alone.

Required human-visible checks:

```text
DAY 0 -> visually sparse starting history but authored world
DAY ~90 -> map visibly shows first political/territorial trend without opening Chronicle
DAY ~360 -> crisis location/control/front identifiable from map in <3 seconds
AFTER POLICY -> enacted institutional path visibly persists
AFTER PROJECT -> persistent landmark visible on map
CHRONICLE -> no wall of duplicate low-level support-change rows by default
CONTENT STUDIO -> user can find one branch/variant text, edit, preview and export patch
```

Binary questions:
- Can the player tell what changed without reading the Chronicle? YES
- Can the player tell where the rebellion is and what territory changed? YES
- Does the country visually accumulate player decisions/projects? YES
- Could the default gameplay screenshot be mistaken for an admin dashboard? NO
- Does the history digest preserve exact factual provenance? YES

## 9. Preserved boundaries

- EventStore remains append-only; digest is presentation only;
- no fake event or fake narrative branch;
- no generic policy/research currency;
- no new focus-tree authority;
- no direct renderer/UI WorldState mutation;
- no second authoritative game clock;
- no project completion without existing authoritative lifecycle evidence;
- no invented army/crowd/front;
- no Gate1F PASS;
- no V02;
- no persistence V9 in this P0.

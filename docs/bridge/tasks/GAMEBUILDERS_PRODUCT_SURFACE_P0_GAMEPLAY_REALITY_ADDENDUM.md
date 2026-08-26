# GAMEBUILDERS_PRODUCT_SURFACE_P0 — Mandatory Gameplay Reality / Observable Dynamics Addendum

STATUS: REQUIRED
APPLIES_TO: `GAMEBUILDERS_PRODUCT_SURFACE_P0`
PRIORITY: P0 / BLOCKING
TRIGGER: user hands-on review at ~Day 1528 reported that the world appears unchanged and the UI feels like fictitious text rather than a game.

## 0. Why this addendum exists

The P0 branch improved map-first composition, neighboring-country authoring, branding, registries, and responsive presentation. That work is useful, but current hands-on play exposed a more fundamental issue: the playable client does not yet make the implemented systemic world behave or read like a living game.

Do NOT spend the next checkpoint primarily on more art polish, copy decoration, or additional static assets until the runtime/presentation gaps below are repaired and measured.

The player must be able to run history and visibly observe state-changing dynamics on the persistent map. Text is supporting explanation, not the proof that something happened.

## 1. Confirmed current defects to repair

Audit the current P0 branch before changing code and verify each claim from source/tests.

### 1.1 Generated autonomous ActionProposals are currently dropped

`runSimulationStep()` can emit next-tick `actionProposals` from implemented systems such as faction pressure and diplomacy. Current `src/app/demoGame.ts` commits the step but does not carry `SimulationStepResult.actionProposals` into the next tick.

Consequences:

- monthly faction decisions may be generated but never become accepted ActionRecords;
- faction strategy changes / proposal opening / FUND_MOVEMENT behavior that requires accepted faction actions can disappear from actual player runtime;
- foreign countries may generate border/diplomatic proposals but never execute them;
- authored neighboring countries therefore risk being mostly static presentation objects.

This is an orchestration/integration defect, not permission to add a new AI system.

### 1.2 Existing ideology diffusion is not wired into the demo runtime

`src/sim/systems/ideologyDiffusion.ts` already owns the accepted monthly contact-driven ideology diffusion phase and exposes `createIdeologyDiffusionPhaseHook()`.

Current demo hooks are built only through `createInterventionPhaseHooks()`; the default tick hooks do not install the ideology-diffusion hook. Therefore the central product promise that political ideas visibly cross borders is absent from the actual GameBuilders play path.

### 1.3 Political map paints legal owner, not current territorial controller

Current atlas political fill is derived from `PresentationRegion.ownerCountryId`. That is legal/historical ownership, not the authoritative physical territorial state.

If a rebellion/faction captures `WorldState.landHexStates[*].controller`, the base map can continue looking like the same country. This is a direct violation of the product-reading goal even though the simulation authority itself remains correct.

The map must visually distinguish:

```text
legal/historical ownership
vs
current physical controller
```

without replacing either concept or conflating Region.stateControl with territory.

### 1.4 Current crisis visibility depends on last-ten raw events

Current `App.tsx` finds coup/rebellion presentation from the latest ten raw EventStore events. Routine daily events can push the crisis-start event out quickly, making an unresolved active rebellion/coup invisible to the user.

A current active crisis must be derived from current `world.conflicts`, not from whether its start event is still in a tiny recent-event window.

### 1.5 Chronicle is dominated by routine state churn

Raw event feed is not equivalent to player-facing history. `TICK_ADVANCED` / routine economy/resource events can bury meaningful political events. The player needs a sparse, factual significant-event timeline while the full EventStore remains authoritative underneath.

### 1.6 Player action surface is narrower than the implemented game fantasy

The demo currently exposes four Intervention actions but not the already implemented `policyCatalog` / `ENACT_POLICY` path. The GDD product fantasy is institution-first: changing actual rules is central to play.

The accepted policy catalog contains real rule mutations and prerequisite/incompatibility semantics. A curated safe subset should be exposed through the normal common action pipeline rather than adding fake UI choices.

### 1.7 Current game-theory UI is too textual

The current DecisionCard explains strategy with repeated blocks such as cost/change/observation/uncertain response/opportunity cost/waiting cost. This is useful information architecture but currently reads like an analysis report.

Game theory must shape choices, not become long explanatory prose.

### 1.8 Current player territorial substrate is too small for readable spatial play

The P0 world now has real neighboring countries, but the player's original authoritative territorial substrate remains very small. A rebellion can take the few player LandHexes quickly, after which there may be no active front edge and no subsequent visible territorial motion even while conflicts remain active.

This must be measured and, if necessary, repaired through safe demo-only ScenarioDefinition authoring rather than a fake conflict writer.

## 2. Runtime integration — mandatory

### 2.1 Create a real demo orchestration boundary

Replace the bare `RunRecord` demo runtime model with a small explicit client orchestration state, e.g. conceptually:

```text
DemoRuntimeState {
  record: RunRecord
  pendingSystemProposals: ActionProposal[]
}
```

Exact naming may differ.

After each canonical `runSimulationStep`:

1. commit the step normally;
2. retain only valid next-tick system proposals emitted by the canonical phase pipeline;
3. on the following tick, convert them through the existing common validation/intake into accepted ActionRecords;
4. execute them in the canonical simulation step;
5. retain the newly emitted next-tick proposals again.

Use existing inspection actor-loop code only as a reference for validation/carry semantics. Do not import developer inspection code into the production game client if a clean product helper is more appropriate.

No proposal may directly mutate WorldState.

### 2.2 Same-tick ordering must be explicit and deterministic

When a player submits an action on a tick that also has carried system proposals, define and test one stable ordering contract.

Preferred emergency contract unless architecture evidence requires otherwise:

```text
player proposal(s) first
-> carried system proposals in canonical emitted order
```

The purpose is deterministic global ActionRecord ordering, not hidden gameplay priority. Record the order in docs/tests.

WAIT proposals may be accepted or safely elided only according to existing semantic contracts; do not fabricate activity merely to create events.

### 2.3 Wire ideology diffusion using the existing accepted hook

Compose `createIdeologyDiffusionPhaseHook(GAMEBUILDERS_DEMO_SCENARIO)` into the demo's hook set without replacing the existing intervention completion/action/economy hooks or the default faction/instability/resources/diplomacy/conflict/outcome phases.

Do not create a second ideology system.

### 2.4 Author actual ideological contrast in neighbor regions

Current neighboring Regions were cloned from a common base profile. Author distinct but schema-valid initial ideology states so the existing contact-driven diffusion system has real gradients to operate on.

Example directional intent only, not a bonus rule:

- Veloria: stronger republican/democratic support in its own authored Regions;
- Karsen: stronger monarchist/authoritarian-aligned support where represented by the existing ideology catalog;
- Arken remains politically mixed.

Use existing ideology IDs/catalog and bounded state. Do not infer regime bonuses from country names, and do not schedule outcomes.

The result should allow actual `IDEOLOGY_DIFFUSED` / `IDEOLOGY_SUPPORT_CHANGED` events to occur through real ContactGraph routes when gradients exist.

## 3. Expose actual policy/institution play

Add a curated player-facing policy surface using existing `ScenarioDefinition.policyCatalog` and `ENACT_POLICY` common action semantics.

Minimum P0 target: expose at least 2–4 meaningful existing policy choices, chosen for current demo relevance and legibility. Candidates may include existing definitions such as royal-veto reform, suffrage, or productive-property rules only if their current prerequisites/incompatibilities are honestly represented.

Do not add new policy mana or shortcut rule mutations.

Player should understand that:

```text
Intervention = bounded current-state program/action
Policy = actual institutional rule change
```

Do not present inactive/illegal policy transitions as clickable success paths; show prerequisite state compactly.

## 4. Map must show truth, not legal wallpaper

### 4.1 Separate ownership and control layers

Political atlas should visually layer:

```text
legal owner wash / country identity
+ current LandHex controller overlay
+ faction/uncontrolled controller treatment
+ derived front edge when it exists
```

Country/legal ownership remains useful for historical geography, but current control must dominate tactical/political crisis reading.

When a LandHex controller changes, a human should notice the map change without opening a detail panel.

### 4.2 Add Region ideology overlay / map mode

Provide a lightweight map mode or overlay driven only by actual Region ideology state.

Minimum:

- selected ideology color/pattern overlay at Region scale;
- support intensity from current `Region.ideology[ideologyId].support`;
- no per-Hex ideology invention;
- no organization marker unless an actual Faction/organization presentation token exists.

This implements the GDD principle: ideology spreads as Region color/pattern.

### 4.3 Add pressure/readability overlay

Allow current Region pressure to be read spatially through actual values such as unrest/scarcity or Agenda affected-region emphasis. Do not merge them into a new authoritative pressure score.

### 4.4 Fit the world to the viewport

Remove large dead map space. Compute or author map fit so the political world fills the available map viewport on desktop and mobile.

On mobile, the map should occupy the first meaningful viewport under a compact top strip. Current long HUD/time-control stack should not push the actual playfield far below the fold.

Manual `+1/+7/+30` controls are capture/debug convenience and should be hidden behind an overflow/debug affordance in normal mobile play, not consume primary UI space.

## 5. Persistent current-state crisis/read model

Add a renderer-neutral/presentation-only current conflict projection sourced from `world.conflicts`.

It may expose only existing facts such as:

```text
conflictId
kind
status
country/faction participants where existing
contestedRegionIds
startedAtTick
```

Do not invent fronts or persistence evidence.

Use this projection for:

- persistent active-crisis marker/banner;
- active conflict count;
- map focus;
- region/current-country context.

A rebellion/coup must remain visible while the Conflict is active even if its start event is thousands of events old or there is no current front edge.

## 6. Player-facing HUD must reflect the actual situation

Add compact derived facts such as:

```text
current player-controlled LandHex count / legal player LandHex count
active conflict count / kinds
capital control state
```

Do not create a generic stability score.

Be careful with `Country.instability`: the accepted formula may read only fully country-controlled Regions, so `불안 0` can coexist with severe territorial loss. Do not present this number as an all-purpose safety indicator. Add contextual labeling/tooltip or reduce its visual dominance when territorial control/conflicts tell a different story.

## 7. Chronicle / feedback redesign

Keep EventStore unchanged, but create a player-facing significant-event projection/filter.

Prioritize events such as:

- policy/institution changes;
- intervention start/completion/rejection;
- meaningful scarcity/unrest band change;
- ideology diffusion/support changes at a readable cadence;
- faction strategy/action/proposal transitions;
- foreign border action;
- coup/rebellion start;
- LandHex control change;
- conflict outcome;
- Government transition;
- consolidation/dissolution.

Do not let routine daily tick/economy spam push all political history out of view.

Use small map pulses/toasts/badges tied to actual newly committed meaningful events so the player sees that something changed without reading a log.

## 8. Make decisions game-like, not report-like

Collapse each action/policy card to an immediately scannable 2–3-line structure:

```text
name
cost / duration
known key change(s) / affected actor
```

Use small badges/icons for `확정`, `현재`, `미확정` rather than repeating paragraphs.

Put full observations, opportunity-cost explanation, and uncertainty detail behind expandable detail/help.

The test is: can a player compare 3–4 options in under ten seconds?

## 9. Give the player an actual objective/readable blockers

Expose a pure derived “새 질서 정착 조건” checklist based on the existing Order Consolidation criteria/current state.

Show existing facts only, e.g. where configured:

- capital control;
- required stable regions/unrest condition;
- required core control;
- state capacity / treasury minimum;
- no active civil war;
- current eligible streak if already available.

Do not turn the checklist into a universal progress score or quest chain.

Also show current blockers. The player should know why they are still playing and what the current crisis prevents.

## 10. Territorial pacing / demo content repair

Measure current player LandHex count and crisis capture sequence under the corrected runtime.

If the rebellion can consume essentially all player territory too quickly for meaningful spatial play, safely expand the GameBuilders-only player territorial substrate using valid ScenarioDefinition content.

Target enough player LandHexes/Regions to show multiple visible territorial transitions rather than one instant full flip. Do not inflate cardinality arbitrarily if it destabilizes the simulation.

Do not solve the known late conflict stall by:

- free territory restoration;
- automatic peace;
- timer-driven conflict deletion;
- fake foreign rescue;
- direct State Dissolution.

The purpose is readable demo geography, not hiding Gate 1F.

## 11. Short-horizon authoring target

After runtime integration, tune only GameBuilders scenario initial conditions/content if needed so the first few simulated years have a readable state-grounded arc:

```text
political/material pressure is visible
-> player can make institutional/program decisions
-> ideology/faction/foreign state changes are observable
-> crisis may emerge from actual conditions
-> territorial change is visible if crisis becomes armed
```

Do not schedule the crisis at a day number.

A no-action trajectory should still change visibly. Player action trajectories should create observable differences.

## 12. New Player-Observable Dynamics Audit — mandatory

The old horizon audit's `interactive alive` classification is not sufficient because “an action is technically available” does not prove the player sees a changing world.

Add a focused deterministic audit for the ACTUAL corrected demo runtime at at least:

```text
Day 0
Day 30
Day 90
Day 180
Day 360
Day 720
Day 1080
```

Track/report between checkpoints:

```text
meaningful player-facing event count
Agenda signature changes
policy/institution changes
faction strategy/action changes
foreign action/contact-edge changes
ideology support/diffusion changes
active conflict start/end/current count
LandHex controller changes
player controlled LandHex count
map-visible state signature
available player decision signature
run outcome
```

The audit must distinguish:

```text
INTERNAL_CHANGE_NOT_PRESENTED
PRESENTATION_ONLY_CHANGE
PLAYER_OBSERVABLE_SYSTEM_CHANGE
STRUCTURAL_STALL
```

Do not force a specific event just to satisfy the test. If a category does not occur, report it honestly and tune only legitimate scenario/runtime integration.

P0 target: during the early demo horizon, the map/current-state surface should receive meaningful observable changes on a cadence a human can notice; a thousand-day run must not look materially identical to Day 0.

## 13. Manual QA — mandatory before P0 completion

On the deployed Site, manually test both desktop and mobile:

1. Start from a fresh deterministic run.
2. Observe Day 0 map/control/ideology/current crisis/objective state.
3. Let no-action run through Day 30/90/180/360.
4. Confirm actual map-visible differences and persistent current-state crisis visibility.
5. Start another run and enact at least one real policy + one intervention.
6. Confirm different downstream visible history where the simulation produces it.
7. Continue beyond Day 1000 and confirm the UI honestly shows the resulting active conflicts/control/stall rather than appearing unchanged or falsely safe.
8. Verify no fake event, fake unit, invented front, or hidden timer was introduced.

Capture review screenshots at representative early/mid/late checkpoints if Codex/Sites tooling supports it.

## 14. Acceptance criteria added to P0

P0 must now additionally report:

```text
SYSTEM_PROPOSAL_CARRY_LOOP: IMPLEMENTED_AND_TESTED
FACTION_AUTONOMOUS_ACTIONS_VISIBLE: YES_OR_HONEST_NO_ACTION_STATE
FOREIGN_AUTONOMOUS_ACTIONS_VISIBLE: YES_OR_HONEST_NO_ACTION_STATE
IDEOLOGY_DIFFUSION_IN_DEMO_RUNTIME: ENABLED
IDEOLOGY_MAP_OVERLAY: YES
CURRENT_CONTROLLER_VISUALLY_DISTINCT_FROM_OWNER: YES
ACTIVE_CONFLICT_PERSISTENT_PRESENTATION: YES
SIGNIFICANT_EVENT_FEED: YES
PLAYER_POLICY_ACTIONS: YES
CONSOLIDATION_OBJECTIVE_BLOCKERS_VISIBLE: YES
DECISION_UI_TEXT_WALL: NO
PLAYER_OBSERVABLE_DYNAMICS_AUDIT: PASS_OR_BLOCKER_DOCUMENTED
DAY_1000_LOOKS_IDENTICAL_TO_DAY_0: NO
MOBILE_MAP_FIRST_VIEWPORT: PASS
```

If these fail, do not mark the product-surface P0 complete merely because static visual polish or responsive CSS passes.

## 15. Preserved hard boundaries

This addendum does NOT authorize deeper F05 domains.

Preserve:

- accepted FIX23 core semantics;
- player = Country historical continuity;
- no Government-change auto defeat;
- LandHex controller remains sole physical territorial authority;
- Region.stateControl remains separate;
- fronts remain derived;
- no invented armies/crowds/fronts;
- no scripted/scheduled coup/rebellion;
- no hidden pacing timer/RNG cheat;
- no direct UI WorldState mutation;
- no new rebellion operational-evidence writer;
- no settlement implementation;
- no persistence V9;
- no Gate1F PASS claim;
- no V02;
- no solver/universal utility score;
- no LLM direct mutation.

Use already implemented systems and the common ActionRecord boundary first. Any remaining core blocker must be documented rather than disguised with presentation text.

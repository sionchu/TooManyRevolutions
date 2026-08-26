# P0 Contextual Decisions V1 — Reference-Grounded Production Decision Surface

EXECUTION_AUTHORITY: THIS_FILE_ONLY

## Branch / baseline

- branch: `parallel-p0-contextual-decisions-v1`
- exact base: `f6c12f267c52b289331748e8da6815eec8f93a81`
- this branch is a P0 gameplay/content/read-model track that runs in parallel with `parallel-p0-integration-v1`.
- it does **not** authorize Gate1F PASS, Gate1F R2, V02, persistence schema changes, production deployment, or a new simulation domain.

## Why this task exists

The current GameBuilders decision surface is still using validation/fixture content as if it were production gameplay:

- `src/app/App.tsx` hardcodes three policy IDs for the visible policy surface.
- the intervention UI enumerates the entire GameBuilders `interventionCatalog` and only applies feasibility afterward.
- `createGameBuildersDemoScenario()` inherits from `createF04DValidationScenario()` and therefore exposes the narrow F04D validation responses as the product intervention catalog.
- `POLICY_FIXTURE_CATALOG` is a T012/headless fixture catalog, not a complete production policy catalog.
- `docs/F04D_INSTITUTION_ACTION_IMPLEMENTATION.md` explicitly states that its four responses are validation definitions and **not a production content catalog**.

This produces the observed failure: different crises, institutions, and trajectories repeatedly present essentially the same law/policy/action cards.

The missing production layer is:

```text
reference-grounded production catalog
        ↓
current Institutional Rules + actual WorldState + actual recent evidence
        ↓
context/relevance derivation
        ↓
normal feasibility/availability
        ↓
small contextual shortlist for the player
```

Feasibility answers “can this be executed?”. Contextual selection answers a separate question: “why should this be offered now?”. Do not conflate the two.

## Governing design authority

Read and preserve before implementation:

1. `docs/GDD.md`
2. `docs/F04C_INSTITUTION_MEDIATED_STABILIZATION_DESIGN.md`
3. `docs/F04C_R_POLITICAL_HISTORICAL_REFERENCE_GROUNDING.md`
4. `docs/F04D_INSTITUTION_ACTION_IMPLEMENTATION.md`
5. `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`
6. `docs/F05_FIX15_WAR_AS_POLITICS_GROUNDING.md` when a candidate crosses into war/military politics
7. `docs/F05_FIX16_COUP_COORDINATION_DOMAIN_CLOSURE.md` when a candidate claims to resolve a coup through military/state coordination
8. `docs/F05_FIX11_FUND_MOVEMENT_GROUNDING.md` when a candidate implies a new targeted faction commitment

The F04C-R research method is mandatory:

```text
source-supported historical case
→ observed mechanism
→ conditions / counterexamples / failure modes
→ trade-off
→ exact TMR state + writer + consumer mapping
→ IMPLEMENT / DEFER / NEW_DOMAIN
```

Do not translate a historical event into a scripted TMR event. Extract mechanisms only.

## Reference standard

Existing F04C-R grounding is valid evidence and should be reused rather than repeated from scratch. Its grounded portfolio includes, among others:

- Bismarck-era Germany: coercion + social provision without automatic organization deletion
- New Deal: relief/public works as materially and administratively distributed intervention
- Spain 1976–1978: amnesty, legalization, franchise/competition separation
- South Africa 1990s: conditional amnesty/unbanning/negotiated inclusion boundaries
- Sweden 1938 onward: organized labor/employer bargaining without organization erasure
- Britain: staged franchise / representation distinctions
- GDR: censorship vs underground organization/visibility
- Poland 1989: legalization + negotiated partial competition

For any new P0 content that is **not** adequately grounded in the existing repository references, add only the minimum additional reference research required. Prefer primary law/government/archive/international-organization material and academic research; use high-quality synthesis only as support. Do not use Wikipedia, SEO history pages, unsourced summaries, or AI-generated summaries as causal authority.

Create:

`docs/parallel/P0_CONTEXTUAL_DECISION_REFERENCE_MATRIX.md`

Each implemented or deferred action/policy row must include:

- stable TMR ID
- Korean player-facing name
- kind: Policy or Intervention
- historical/reference cases and source IDs
- narrow mechanism
- conditions / failure modes / counterexamples
- trade-off
- exact current TMR authoritative fields
- exact writer
- exact downstream consumer(s)
- contextual relevance conditions
- normal prerequisite/feasibility conditions
- `IMPLEMENT_NOW | DEFER | NEW_DOMAIN`
- reason if deferred

## No regime-unlock shortcut

Do **not** add `Country.regime` or branch content from a derived label such as monarchy/republic/democracy/communism.

The product contract is:

```text
Institutional Rules + Current Intervention Capabilities + Actual WorldState
```

A derived regime label may explain the current country to the player but is not authoritative selection state.

The same labor crisis may therefore produce a different shortlist under:

- labor organization illegal vs restricted vs legal
- political competition banned vs restricted vs plural
- press censored vs restricted vs free
- legislature required vs not required
- different current property/land rules
- different actual faction/Region/conflict state

## Supported P0 context families

Implement contextual coverage only where current authoritative state and writers can honestly support it.

Required supported families:

### MATERIAL_SCARCITY

Use actual Region resource/scarcity/unrest/material-pressure evidence. Grounded families may include targeted emergency relief/distribution and other actions whose existing completion writers can honestly change current material state.

Do not invent price, wage, ration-card coverage, insurance-fund, or logistics state if no authoritative field/writer exists.

### LABOR_ORGANIZATION_PRESSURE

Use actual Faction grievance/organization/resources, Region pressure, and labor institutional rules.

Grounded responses may include bounded accommodation, labor-organization institutional changes, or coercive restrictions only where their current writers/consumers exist.

Do not invent a full collective-bargaining, strike, employer-association, wage contract, or union-election lifecycle. F04C-R explicitly identified full bargaining as deferred without those consumers.

### POLITICAL_OPPOSITION / REPRESENTATION PRESSURE

Use actual faction pressure plus suffrage, legislature, press freedom and politicalCompetition.

Preserve the distinction between amnesty/accommodation, legalization, suffrage, press freedom, and competition. Do not collapse them into a democracy/stability score.

### ACTIVE_REBELLION / RECOVERY

A current active rebellion may make already-grounded material, accommodation, legalization, or coercive responses contextually relevant.

Do not create a fake peace/settlement action, no-front peace rule, generic war exhaustion, or direct controller recovery. Physical recovery remains existing conflict-resolution authority.

### INSTITUTIONAL_REFORM

The full Policy catalog may represent actual rule changes. The primary contextual shortlist should elevate reforms that connect to current pressure/institutional contradictions; the Institutional Roadmap remains the secondary place to inspect broader structural options.

### PROPERTY / LAND ORDER

Use existing `productiveProperty` and `landOwnership` axes only where the policy mutation itself is honest and its current downstream meaning is not overstated.

Do not claim a land reform automatically redistributes represented farms/landlords if those actors/assets are not authoritative state.

### COERCIVE / INFORMATION RESPONSE

Use pressFreedom, politicalCompetition, laborOrganization, faction organization/grievance and current administrative constraints where grounded.

Coercion may reduce visible/operational organization in the bounded existing model but must not delete factions or promise permanent peace.

## Explicit P0 deferrals

Do not fake content simply because it would make a good-looking card.

The following remain deferred unless the repository already contains a separately accepted authoritative implementation:

- coup resolution via military pay, officer purge, loyalty, command, garrison, or “army support”; `F05_FIX15/16` says coup coordination requires a new authoritative domain
- war settlement, war goals, mobilization, conscription, occupation government, demobilization or peace terms
- full elections, parties, seats, electoral government turnover
- full labor bargaining/strike/employer lifecycle
- transitional justice / victim-process state beyond currently represented grievance/rules
- local autonomy if no institutional rule/writer exists
- religious/sacred/arcane privilege without its required grounding/domain
- generic propaganda, secret-police, emergency-power or martial-law buttons if they cannot be mapped faithfully to existing rules/writers
- new political mana, reform points, focus-tree unlocks, hidden cooldowns, story stages, universal utility scores

Document these in the reference matrix as `DEFER` or `NEW_DOMAIN`; do not silently omit them and do not fake them.

## Phase A — Production policy catalog

Create an explicit GameBuilders production policy catalog with stable non-fixture IDs. Suggested namespace is `gamebuilders.policy.*` or another clearly product-owned namespace.

Do not expose `fixture.*` IDs as the production decision identity.

Use the existing `PolicyDefinition` / institutional-rule architecture. Content breadth must be based on grounded current schema, not an arbitrary count target.

At minimum audit and, where reference-grounded, provide coherent paths across current rule axes:

- ruler veto / legislature relation
- staged suffrage where current values permit a truthful policy definition
- productive-property ownership: private / mixed / public where grounded
- land ownership: feudal / private / communal / state where grounded
- labor organization: illegal / restricted / legal where grounded
- press freedom: censored / restricted / free where grounded
- political competition: banned / restricted / plural where grounded

Do not assume every possible enum transition should become a player policy. Each definition needs an actual institutional meaning and prerequisite/incompatibility path.

The full catalog is structural content; the primary decision shortlist is contextual and smaller.

## Phase B — Production intervention catalog

Create an explicit GameBuilders production intervention catalog with stable non-fixture IDs and Korean names.

It must no longer be the F04D validation catalog with renamed labels.

Reuse existing Intervention effect kinds and lifecycle where they honestly fit. Do not broaden the generic effect language just to reach a desired card count.

A useful minimum content portfolio should cover several distinct supported mechanisms such as:

- targeted material relief / distribution
- bounded political accommodation/amnesty-like relief where current faction grievance is the honest proxy
- opposition legalization / incorporation where politicalCompetition is the real institutional writer
- labor organization opening/restriction where the existing rule and faction consumers support it
- bounded coercive restriction with real political costs
- other administrative/material actions only when an existing authoritative writer and consumer exist

If the current effect vocabulary cannot honestly implement a grounded archetype, defer it in the matrix rather than inventing a scalar effect.

Costs, admin load, duration and deltas must be scenario/content-authored, bounded, and justified relative to existing validated ranges. Do not derive universal numbers from historical source values.

## Phase C — Contextual selector

Add a pure deterministic read model, suggested seam:

`src/sim/readModels/contextualDecisions.ts`

Suggested public API shape may vary, but it must derive a `ContextualDecisionSurface` from actual authoritative/read-model inputs.

Required inputs/evidence should include only existing factual state such as:

- ScenarioDefinition
- WorldState
- player CountryId
- institutional PolicyState
- current Faction state
- Region scarcity/unrest/resource state
- active Conflict state
- derived current agendas/pressure
- recent recorded GameEvents where useful

Required output should separate **relevance** from **feasibility**.

For each surfaced candidate include at minimum:

- policy/intervention identity
- candidate kind
- `relevanceReasons` as stable typed reasons/evidence, not marketing prose
- affected Region/Faction IDs when factually supported
- source Event IDs when recent event evidence is used
- normal feasibility/availability result
- whether the card is `AVAILABLE` or `BLOCKED_BUT_RELEVANT`

Do not write WorldState. Do not create events. Do not schedule outcomes.

## Selector ordering rules

Do not build a generic weighted utility solver.

Use deterministic explicit product tiers:

1. **Active crisis/conflict factual responses** that are honestly supported by current mechanisms.
2. **Primary current agenda/pressure responses** tied to actual affected Regions/Factions.
3. **Institutional reforms connected to the current pressure or contradiction.**
4. **Limited background structural reform choices** only when acute context does not fill the surface.

Within a tier use stable, authored priority and deterministic ID ordering; priority is presentation/content metadata, not an outcome utility score.

Primary player-facing target: normally **2–5 meaningful choices**, with a hard upper bound of 6 unless a test demonstrates why more are required.

Relevant but infeasible actions may appear as blocked with a concrete reason. Irrelevant catalog entries must not occupy the primary Decision Table.

The full policy roadmap remains separately inspectable.

## Required canonical state tests

Build deterministic selector tests/snapshots for at least:

1. Day-0/default institutional state.
2. High regional material scarcity.
3. High labor-faction grievance/organization pressure.
4. Active rebellion/recovery state.
5. Political competition/labor/press rules after opening reforms.
6. Coercive/restricted institutional state.
7. A coup-active state proving the selector **does not invent coup-coordination/military-loyalty actions** when that domain is absent.

Acceptance:

- the shortlists must materially differ between these states;
- do not pass by returning the same list with different enabled/disabled flags;
- use expected stable IDs/relevance reasons in tests;
- insertion order must not change output;
- irrelevant actions must be demonstrably absent;
- no hidden RNG/time gate.

## Phase D — Remove decision-fixture leakage from the GameBuilders scenario

Update GameBuilders scenario content composition so the **decision catalogs** are explicit production content.

The scenario may continue to reuse accepted fixture topology/state where replacement is outside this task, but it must not inherit F04D/T012 decision content as product catalog authority.

Specifically:

- do not use the four F04D validation definitions as the GameBuilders production intervention catalog;
- do not treat `POLICY_FIXTURE_CATALOG` as the finished GameBuilders production policy catalog;
- preserve F04D validation scenario and historical Gate1F/F05 fixture behavior unchanged;
- do not modify historical inspection baselines to accommodate product content.

Add tests that distinguish validation IDs from GameBuilders production IDs.

## UI / integration ownership

Do **not** modify these hotspots in this branch:

- `src/app/App.tsx`
- `src/app/DecisionPanel.tsx`
- `src/app/PolicyCard.tsx`
- `src/app/DecisionCard.tsx`
- `src/app/PoliticalWorldStage.tsx`
- `src/styles/global.css`
- icon/audio/map/world-art modules

This track produces the content and selector API. `parallel-p0-integration-v1` owns the final player-facing hookup after this result is independently QC-accepted.

The integration handoff must explicitly replace both current defects:

```text
hardcoded policySurfaceIds
full interventionCatalog enumeration
```

with the accepted contextual selector output.

## Protected authority / forbidden shortcuts

- no direct UI/renderer WorldState mutation
- no generic `regime -> card list` authoritative switch
- no democracy/stability/reform score
- no generic policy/intervention mana
- no scripted crisis result or fake event
- no direct LandHex controller change from a decision
- no synthetic coup/military response
- no hidden timer/cooldown/story progression
- no automatic best-choice solver
- no persistence version change
- no modification of Gate1F R1/F05 repair branch

## Verification

Run at minimum:

- new production decision-content tests
- contextual selector tests for every canonical state above
- policy tests
- intervention tests
- relevant agenda/read-model tests
- F04D validation tests proving validation content remains unchanged
- `inspect:f04d`
- `inspect:t018`
- `inspect:t021`
- `inspect:t024`
- `inspect:v01`
- typecheck
- lint
- format
- build
- `git diff --check`

Run the full suite and report real assertion failures separately from the known Vitest `onTaskUpdate` runner issue. Do not update unrelated golden expectations merely to make the suite green.

## Required result

Create:

`docs/parallel/P0_CONTEXTUAL_DECISIONS_V1_RESULT.md`

It must include:

- base/head SHA
- exact changed files
- reference matrix path
- implemented production policy IDs and mechanisms
- implemented production intervention IDs and mechanisms
- explicit deferred/new-domain catalog with reasons
- evidence that GameBuilders product decision IDs are no longer fixture IDs
- selector API
- canonical state → surfaced shortlist table
- proof that lists materially vary by actual WorldState/institutions
- proof relevance and feasibility are separate
- proof coup state does not invent military coordination responses
- regression/test results
- exact integration instructions for replacing `policySurfaceIds` and full catalog enumeration
- known limitations

## STOP

Commit and push implementation + result to `parallel-p0-contextual-decisions-v1`, verify clean remote state, then STOP.

Do not modify the integration branch, deploy, merge, declare P0 PASS, declare Gate1F PASS, or self-authorize a successor task.
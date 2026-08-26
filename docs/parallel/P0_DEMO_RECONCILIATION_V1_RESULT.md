# P0 Demo Reconciliation V1 Result

BRANCH: `parallel-p0-demo-reconciliation-v1`

EXACT_BASE: `e521961e25e4b20c70245137216c80a103120420`

AUTHORIZED_HEAD_AT_START: `96b489f0d23accac89c939af2871fe007fcd9a09`

NO_DEPLOY

## Integrated reviewed inputs

The reviewed implementation inputs were integrated in the task-prescribed
semantic order:

1. Map Simplify: `27794f093d3c1989548197091f0d6be867715b12`
2. UI Polish: `aaf7929975b4135c0d8d04a715fd7a040d987277`
3. Real KayKit Assets: `0c5dc55b951b93bff3304076ddf87ae2dc862d66`
4. Game Flow / Auto-Slow: `caca4d0797239b82b679e0a8143a91be5a9b99ad`
5. Contextual Decisions: `ee11f4029f190366974e9d8ff808e196cb44d684`
6. Event Presentation: `cad87fc3dda69e61e7d2ed465fd99bb3e18f444b`
7. Terminal correctness: `d406dd47a55fd22a048094b3feaffc6ab83f0e5d`

All seven cherry-picks applied without a textual conflict. The integration
diff was then reconciled semantically in the shared App, DecisionPanel,
PoliticalWorldStage, GLTF loader, and CSS paths. The docs-only contextual
decision follow-up and World Art FIX3 were not cherry-picked.

## Production reconciliation

### Map and real assets

- `WorldAssetModel` is the single reusable GLTF loading and normalization seam
  shared by the production map and the standalone gallery.
- `PoliticalWorldStage` resolves production models from
  `worldAssetManifest.ts`. It renders one representative dominant landmark per
  capital, industrial, and frontier role to retain the Map Simplify de-bloat
  and negative space.
- The production hero slots load KayKit assets as follows:
  - `capitalHero`: `tmr.demo.asset.kaykit.castle.blue`
  - `industrialHero`: `tmr.demo.asset.kaykit.mine.blue` and
    `tmr.demo.asset.kaykit.blacksmith.blue`
  - `frontierHero`: `tmr.demo.asset.kaykit.barracks.blue`
- Near/focus factual terrain uses the resolved `mountainA`, `mountainB`,
  `treeClusterA`, `treeClusterB`, and `rockCluster` assets. The production
  mobile inspection loaded all nine hero/terrain asset identities.
- The corresponding procedural palace, industrial, mine, defensive, mountain,
  tree, and rock forms are suppressed whenever their resolved GLTF slot is
  active. A resolved slot does not render procedural and GLTF representations
  together.
- `portHero` remains unresolved. The production map uses the factual port
  label, POI, and coast facts without a fabricated or visually dominant dock.
- Decorative road/river GLTF assets are not placed. The accepted legal-owner,
  controller, and front hierarchy and Map Simplify label/LOD behavior remain
  intact.

### Contextual decisions

- The App creates one memoized surface with
  `deriveContextualDecisionSurface()` over the production catalog, current
  world, agendas, and canonical EventStore.
- Product composition no longer uses `POLICY_FIXTURE_IDS`, hard-coded
  `policySurfaceIds`, or a full immediate enumeration of the demo intervention
  catalog.
- `DecisionPanel` maps `primaryShortlist` once, in selector order. Policy and
  intervention cards stay mixed instead of being regrouped by kind.
- The inspected Day 0 order was:
  1. `intervention:emergency-food`
  2. `intervention:political-accommodation`
  3. `intervention:opposition-legalization`
  4. `intervention:labor-organization-opening`
  5. `policy:legislative-oversight`

### Game flow and event presentation

- Rebellion, coup, and civil war continue to use `SLOW`: 2x/3x become 1x
  while `isPlaying` remains true. Terminal `ORDER_CONSOLIDATED` and
  `STATE_DISSOLVED` retain `STOP` semantics.
- `deriveEventPresentation()` is connected to the current record's EventStore
  and actual world `politicalProposals`.
- TOAST and NEWS render as compact, non-blocking map overlays. A rebellion NEWS
  item does not stop time.
- DECISION_REQUIRED is rendered only for a matching `PoliticalProposal` whose
  status is `open` for the player country/current government. Accept/reject
  calls the common runtime through
  `createRespondPoliticalProposalActionProposal`; the authoritative transition
  then drives prompt removal/update.
- `GOVERNMENT_TRANSITIONED` is NEWS only and is not converted into a choice.
  No rebellion/coup response choice is synthesized without a real proposal.

## Browser QA

QA was run against the exact local reconciliation source. The browser window
targets were desktop 1440×900 and mobile 390×844; captured content images are
1425×891 and 375×812 after the in-app browser chrome/scrollbar area.

### Desktop

- Day 0 default is map-first and shows recognizable KayKit capital,
  industrial, and frontier models. Loaded production hero asset identities:
  castle, mine, blacksmith, and barracks; loaded slot identities:
  `capitalHero`, `industrialHero`, `frontierHero`.
- The decisions drawer measured about 346×672px and displayed the exact mixed
  five-item shortlist above.
- Starting at 3x produced an actual `REBELLION_STARTED` at tick 19. The DOM
  state after the reaction was `speed=1` and `playing=true`.
- The crisis state showed `NEWS:REBELLION_STARTED` while the map remained the
  main surface. The compact NEWS card measured about 496×77px.
- With `?mapLabels=0`, the label count was zero while all three production hero
  slots remained loaded and visible.

### Mobile

- The bounded bottom sheet measured about 357×432px, remained fixed above the
  map, and left about 254px of the map visible above it.
- The Day 0 bottom sheet preserved the same mixed shortlist order.
- All inspected drawer/playback/primary controls met or exceeded 44×44px after
  the final CSS reconciliation.
- Starting at 3x and reaching rebellion resulted in `speed=1` and
  `playing=true`.
- The crisis stack measured about 374×135px, below its 34svh bound, and left
  the map visible instead of becoming a full-screen obstruction.
- No browser console errors were observed. Three.js emitted its existing
  `Clock` deprecation warning.

### Proposal response coverage

The production demo scenario has no faction proposal templates, so a natural
browser path did not produce an open PoliticalProposal during this run. No
production-only fixture or fake button was added. The integration test instead
constructs an authoritative open `PoliticalProposal`, proves that only that
proposal produces accept/reject UI, and verifies government-transition NEWS
does not produce fake choices. The production response adapter uses the
existing `RESPOND_POLITICAL_PROPOSAL` action pipeline.

## Screenshot evidence

- `docs/parallel/evidence/p0-demo-reconciliation-v1-desktop-default.png`
- `docs/parallel/evidence/p0-demo-reconciliation-v1-desktop-decisions.png`
- `docs/parallel/evidence/p0-demo-reconciliation-v1-desktop-crisis-news.png`
- `docs/parallel/evidence/p0-demo-reconciliation-v1-desktop-labels-off-kaykit.png`
- `docs/parallel/evidence/p0-demo-reconciliation-v1-mobile-default.png`
- `docs/parallel/evidence/p0-demo-reconciliation-v1-mobile-decisions.png`
- `docs/parallel/evidence/p0-demo-reconciliation-v1-mobile-crisis-news.png`

All seven images were opened and visually inspected for model presence,
composition, drawer/sheet bounds, crisis obstruction, and map visibility.

## Automated verification

- Focused reconciliation suite: 8 files, 49 tests; exit 0.
- `pnpm run typecheck`: exit 0.
- `pnpm run lint`: exit 0.
- `pnpm run format`: exit 0.
- `pnpm run build`: exit 0; Vite transformed 176 modules. The generated
  WorldAssetModel chunk produced a large-chunk warning (1,161.58 kB,
  324.06 kB gzip).
- Full `pnpm test`: 102 test files and 705 tests executed successfully. The
  runner exited 1 because Vitest reported four unhandled
  `[vitest-worker]: Timeout calling "onTaskUpdate"` RPC errors. No assertion
  failure was reported.
- `git diff --check`: run again immediately before commit.

## Scope and limitations

- No difficulty/history/web/Gate1F R2, persistence, balance, renderer
  architecture, generic manager/service, or unrelated asset-pack scope was
  added.
- The natural browser PoliticalProposal response path was not reached for the
  scenario reason documented above; authoritative integration-test coverage is
  included instead.
- Full-suite runner reliability is still affected by the four Vitest worker
  RPC timeouts even though all 705 assertions completed.
- No deployment was performed.

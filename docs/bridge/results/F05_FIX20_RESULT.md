# F05_FIX20 Result

TASK_ID: F05_FIX20
STATUS: COMPLETE / AWAITING_CHATGPT_REVIEW
BASE_IMPLEMENTATION_HEAD: e300fb2e51435e0f1eeedc1c2dd3db006ac0c08e
BASE_IMPLEMENTATION_BRANCH: f05-fix19-review
REVIEW_BRANCH: f05-fix20-review

PRIMARY_CLASSIFICATION: REBELLION_PERSISTENCE_AND_SETTLEMENT_REQUIRE_SEPARATE_DOMAINS
NEXT_IMPLEMENTATION_READINESS: REBELLION_DOMAIN_SPLIT_REQUIRED

EXISTING_WORLDSTATE_PERSISTENCE_SUFFICIENT: NO
EXISTING_WORLDSTATE_TERMINATION_SUFFICIENT: NO
NO_FRONT_MEANS_PEACE: NO
ZERO_LANDHEX_MEANS_DEFEAT: NO
RANDOM_OR_TIMER_ALLOWED: NO
DIRECT_CONFLICT_DELETE_ALLOWED: NO
FREE_LANDHEX_WRITER_ALLOWED: NO
LLM_DIRECT_MUTATION_ALLOWED: NO
PERSISTENCE_FORMAT: V7_UNCHANGED
GATE1F: NOT_READY
V02: NOT_STARTED

## Scope and decision

F05_FIX20 was completed as a research and architecture-grounding task only.
The current WorldState and Conflict model provide identity, political
eligibility inputs, and derived territorial projections, but do not provide
conflict-scoped operational persistence or settlement, implementation,
guarantee, demobilization, and loss-of-capacity state.

The existing behavior is classified as
PARTIAL_BUT_INCOMPLETE. An eligible rebellion can remain active without a
front or faction-controlled LandHex, and the narrow
suppressIneligibleRebellions() case can resolve an ineligible rebellion with
no faction LandHex. That behavior is not a complete persistence or settlement
model. Persistence and settlement therefore require separate future domains.

## Research basis

The grounding document records and links:

- Kalyvas, *The Logic of Violence in Civil War*, for local and fragmented
  control that must not be collapsed into a conventional front.
- Fearon and Laitin, “Ethnicity, Insurgency, and Civil War,” for insurgency
  viability that is not identical to current territorial control.
- Walter, *Committing to Peace*, for the distinction between negotiation,
  agreement, implementation, credible guarantees, and demobilization.
- Matanock-related implementation literature for compliance mechanisms that
  are distinct from initial cessation.

The architecture decision is:

    rebellion identity and operational persistence
      != territorial front projection
      != negotiated settlement and demobilization

No timer, cooldown, countdown, RNG, generic score, no-front peace shortcut,
zero-LandHex defeat shortcut, free LandHex writer, direct Conflict deletion,
or LLM direct mutation was introduced.

## Files changed

- docs/F05_FIX20_REBELLION_PERSISTENCE_SETTLEMENT_GROUNDING.md
- docs/bridge/results/F05_FIX20_RESULT.md

No production source, simulation test, Conflict/Faction/Country/Government/
Region runtime schema, T018/T021/T022/T023 path, or persistence file was
changed. SerializedSimulationSnapshotV7 remains unchanged.

## Verification

- pnpm run inspect:f05fix9: PASS, exit 0. The historical F05 baseline remained
  unchanged; the audit reported the late steady-state mixed-cause condition,
  active conflicts with no derived front in the representative freeze, no
  implementation, and Gate 1F NOT_READY.
- pnpm run inspect:t021: PASS, exit 0, 1 file and 1 test. The inspection
  confirmed current-controller front derivation, the LandHex controller
  writer boundary, no same-phase rebellion seizure, and no automatic coup
  territorial mutation.
- pnpm run inspect:f04b: PASS, exit 0. The inspection confirmed current
  organization/resource reads, occupied-rebellion survival after grievance
  reduction, zero-territory recovery/stalemate behavior, insertion-order
  independence, and save/load recovery equivalence.
- pnpm exec vitest run src/sim/systems/conflict.test.ts --reporter=verbose
  --silent=false: PASS, 21 tests. Existing conflict tests covered
  no-front/zero-territory behavior, suppression boundaries, replay
  equivalence, insertion-order determinism, and the absence of a timer-based
  weekly outcome.
- documentation formatting: PASS; pnpm exec prettier --check passed for both
  FIX20 document paths.
- git diff --check: PASS.
- changed-file scope: PASS before staging; only the two FIX20 documentation
  paths are authorized.
- production typecheck, lint, build, and full test suite: NOT RUN for this
  docs-only task; no production behavior was changed.
- F05_FIX21, Gate 1F PASS, and V02: NOT STARTED.

## Completion markers

F05_FIX20: COMPLETE / AWAITING_CHATGPT_REVIEW
NEXT_AUTHORIZED_TASK_ID: NONE
GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT_STARTED

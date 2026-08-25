# F05_FIX21 Result

TASK_ID: F05_FIX21
STATUS: COMPLETE / AWAITING_CHATGPT_REVIEW
BASE_IMPLEMENTATION_HEAD: 510e971f38b52343055285a585d851a5baae283f
BASE_IMPLEMENTATION_BRANCH: f05-fix20-review
REVIEW_BRANCH: f05-fix21-review

PRIMARY_CLASSIFICATION: REBELLION_SPLIT_MINIMAL_DOMAINS_DESIGNABLE
NEXT_IMPLEMENTATION_READINESS: REBELLION_PERSISTENCE_AUTHORING_SEAM
FIRST_IMPLEMENTATION_DIRECTION: PERSISTENCE_AUTHORING_FIRST

PERSISTENCE_DOMAIN_SEPARATE: YES
SETTLEMENT_DOMAIN_SEPARATE: YES
NO_FRONT_MEANS_PEACE: NO
ZERO_LANDHEX_MEANS_DEFEAT: NO
GENERIC_SCORE_ALLOWED: NO
RANDOM_OR_TIMER_ALLOWED: NO
DIRECT_CONFLICT_DELETE_ALLOWED: NO
FREE_LANDHEX_WRITER_ALLOWED: NO
LLM_DIRECT_MUTATION_ALLOWED: NO
PERSISTENCE_FORMAT: V7_UNCHANGED
GATE1F: NOT_READY
V02: NOT_STARTED

## Scope and decision

F05_FIX21 was completed as docs-only Rebellion Domain Split Design.

The two minimum domains are:

- rebellion operational persistence: a Conflict-scoped identity plus
  explicit typed operational evidence;
- settlement / demobilization / suppression closure: typed parties and
  terms plus explicit implementation, compliance, demobilization, or
  suppression evidence.

They remain separate from T018 eligibility, T021 territory/front projection,
T022 Order Consolidation, T023 State Dissolution, generic faction/country
scalars, and Agenda/read models.

Both domains are designable. The first implementation direction is
PERSISTENCE_AUTHORING_FIRST: a later task may add only optional static
scenario-owned operational channel/profile authoring and validation. It must
not add runtime mutation or persistence V8. Settlement package authoring is
specified as a separate later seam and acceptance is not completed peace.

## Design decisions recorded

- Persistence authoring uses typed categorical operational channels and a
  Country/Faction-scoped profile. Channels are allow-listed evidence
  contracts, not evidence, weights, quorum, scores, thresholds, or final
  outcomes.
- A future persistence runtime episode is bootstrapped by the T018 rebellion
  creation identity but needs a later typed evidence event to represent
  continued operational capacity.
- A future settlement runtime episode distinguishes open, negotiating,
  accepted, implementing, compliant, breached, demobilization/suppression
  evidence, and closed states. Acceptance alone cannot close Conflict.
- Closure reaches the existing typed applyConflictOutcome() sink only after
  evidence validation. No direct Conflict delete, State Dissolution writer,
  or free LandHex writer is introduced.
- Same-conflict coexistence is explicit: persistence, territory/fronts, and
  an open settlement process may exist simultaneously.
- ActionRecord and GameEvent provenance, idempotence, canonical ordering, and
  future save/load replay are required before runtime implementation. V7 is
  unchanged.

## Files changed

- docs/F05_FIX21_REBELLION_DOMAIN_SPLIT_DESIGN.md
- docs/bridge/results/F05_FIX21_RESULT.md

No production source, simulation test, Conflict/Faction/Country/Government/
Region runtime schema, T018/T021/T022/T023 path, or persistence implementation
was changed. SerializedSimulationSnapshotV7 remains unchanged.

## Verification

- GitHub CURRENT_TASK and docs/bridge/tasks/F05_FIX21.md: READ from
  origin/master; task status AUTHORIZED and base matched local HEAD
  510e971f38b52343055285a585d851a5baae283f.
- working tree/base check: PASS before authoring; f05-fix20-review was clean
  and origin/f05-fix21-review existed at the accepted F05_FIX20 head.
- documentation formatting: PASS; pnpm exec prettier --check passed for both
  FIX21 document paths.
- git diff --check: PASS.
- changed-file scope: PASS before staging; only the two FIX21 documentation
  paths are authorized.
- production typecheck, lint, build, and test suite: NOT RUN; this task is
  docs-only and no production behavior changed.
- F05_FIX22, Gate 1F PASS, and V02: NOT STARTED.

## Completion markers

F05_FIX21: COMPLETE / AWAITING_CHATGPT_REVIEW
NEXT_AUTHORIZED_TASK_ID: NONE
GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT_STARTED

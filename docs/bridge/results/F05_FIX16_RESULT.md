# F05_FIX16 Result

```text
TASK_ID: F05_FIX16
STATUS: COMPLETE / AWAITING_CHATGPT_REVIEW
START_BRANCH: master
START_COMMIT: dd515c5425d9d42e1f5491ea9082627076382e8c
BASE_TASK_COMMIT: 7a75116f74fadeb1fa4cc98f91591b1607999ead
COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS
COMMIT_CREATED: YES
PUSHED: YES
```

## Closure

F05_FIX16 selected exactly one allowed classification:

```text
PRIMARY_CLASSIFICATION: COUP_COORDINATION_MINIMAL_DOMAIN_DESIGNABLE
NEXT_IMPLEMENTATION_READINESS: COUP_COORDINATION_AUTHORING_SEAM
```

The bounded design is a static scenario-authored set of required
`CoupCoordinationNode` identities for each supported coup profile. A node is a
named Country-owned state-apparatus grouping for this attempt only. Runtime
alignment is the categorical observable state `incumbent | coup | uncommitted`;
it is not a loyalty, belief, coordination, or progress meter.

The future finite writer is an accepted typed response action from a required
node. It records the source ActionRecord and deterministic event provenance.
All authored required nodes aligning `coup` produces the existing nonterminal
`governmentTransition` sink; any explicit required-node `incumbent` response
produces `statusQuo`; remaining `uncommitted` nodes keep the Conflict active.
No majority, score, random roll, timer, or territorial coup mechanic is used.

```text
ACTOR_MODEL: STATIC_SCENARIO_AUTHORED_COUP_COORDINATION_NODES_WITH_AUTHORED_REQUIRED_SET
ALIGNMENT_MODEL: incumbent | coup | uncommitted
TRANSITION_PROVENANCE: ACCEPTED_TYPED_COUP_COORDINATION_RESPONSE_BY_REQUIRED_NODE_WITH_ACTION_AND_EVENT_PROVENANCE
OUTCOME_RULE: ALL_AUTHORED_REQUIRED_NODES_COUP => governmentTransition; ANY_EXPLICIT_REQUIRED_NODE_INCUMBENT => statusQuo; OTHERWISE ACTIVE
CURRENT_FACTION_REUSE: NO
CURRENT_GOVERNMENT_REUSE: NO
NEW_STATIC_AUTHORING_REQUIRED: YES
NEW_RUNTIME_STATE_REQUIRED: YES
PERSISTENCE_IMPLICATION: FUTURE_VERSION_REQUIRED
```

The current `SerializedSimulationSnapshotV6` contract is unchanged. The
future runtime state is not added by this task; if implemented, it requires a
versioned persistence/decoder/replay contract. The existing `Faction` remains
the coup initiator and the existing `Government` remains the incumbent/result
identity, but neither is reused as the coordination actor set.

## Required audits

### Actor granularity

- Current `Faction`: rejected as a substitute for multiple decisive actors;
  its values and `currentStrategy` remain eligibility/observation inputs.
- Current `Government`: rejected as a substitute for separate responses; it is
  the authority target and existing successor sink.
- Narrow coup-only nodes: selected because stable Country-owned IDs and an
  authored required set are enough for an observable coordination slice without
  tactical units, hierarchy, communications, or manpower.
- Broader state-apparatus domain: not required for the selected slice. A future
  case that requires private beliefs, command relationships, or communications
  remains unresolved rather than expanding the domain silently.

### Alignment, writer, and outcome

`uncommitted` is the initial/current absence of an accepted decisive response,
not elapsed progress. Only an explicit typed response may record `incumbent` or
`coup`. Existing Faction/Country/Government scalars, Agenda, strategy, and
LandHex state are not alignment writers. Duplicate node responses are rejected;
stable node/action/event ordering is required for replay equality.

The existing typed `ConflictOutcome` sinks are reused only after the future
coordination producer has explicit evidence. `stateDissolved` remains T023
owned, and CountryId continuity remains intact.

### Existing future evidence

T018's `militarySympathy`, `leadership`, `foreignSupport`, and `weapons`
remain `notImplemented`. `militarySympathy` is not converted into a scalar
shortcut; the future coordination alignment state is the proposed replacement
for the missing observable response seam, without changing T018 in F05_FIX16.

### Late-state relevance

The representative F05_FIX9 replay was inspected at the required long horizon.
The profile would exist at coup creation, not be invented at the late freeze.
With future explicit node responses it could resolve only the coup while
leaving the rebellion for a separate persistence/settlement domain. With no
responses, the coup remains active. F05_FIX16 therefore makes no claim of
current late-state improvement or Gate 1F readiness.

## Verification

| command | result |
|---|---|
| `git status` / `git rev-parse HEAD` / `git rev-parse master` / `git rev-parse origin/master` | clean; all three refs at `dd515c5425d9d42e1f5491ea9082627076382e8c` before work |
| `pnpm run inspect:t018` | exit `0`; 1 file / 1 test passed; eligibility/action distinction, future-evidence honesty, duplicate detection, stable ordering, and no territorial mutation passed |
| `pnpm run inspect:f05fix9` | exit `0`; historical baseline unchanged, `1110/1200` silence, `LATE_STEADY_STATE_MIXED_CAUSE`, active-conflict equilibrium, outcome gap, non-accept divergences `0`, reopen churn `0`, legitimate reopens `2` |
| `pnpm install --frozen-lockfile` | exit `0`; already up to date with pnpm `11.19.0` |
| `pnpm run format` | exit `0`; all files matched Prettier style |
| `pnpm run typecheck` | exit `0` |
| `pnpm run lint` | exit `0` |
| `pnpm run build` | exit `0`; Vite production build completed |
| `pnpm run inspect:t024` | exit `0`; snapshot V6, roundtrip, save/load replay, derived-state, terminal no-op, corruption, and ordering checks passed |
| `pnpm run inspect:f05` | exit `0`; `MIXED_GAP`, F05 recommendation `NOT_READY` |
| `pnpm run inspect:f05fix14` | exit `0`; no-response `1200d` with no resolution, existing response resolution `tick 60 / actorIntentCeased`, available resources `0.5 -> 0.8`, duplicate/churn `0`, timer/cooldown/countdown `false`, forbidden writers `none`, historical F05/FIX9/FIX13 unchanged |
| `pnpm test` | assertion result `59 files / 477 tests passed`; process exit `1` from 3 existing Vitest worker `Timeout calling "onTaskUpdate"` unhandled errors |
| `git diff --check` | exit `0` on the pre-commit worktree; staged-file check repeated before commit |

No focused F05_FIX16 inspection code was added, so no new inspection command
was introduced. The known Vitest
`[vitest-worker]: Timeout calling "onTaskUpdate"` process-level issue
reproduced after all 477 assertions passed and is reported separately above.

## Scope boundary

F05_FIX16 did not implement production conflict gameplay. It did not alter
FUND_MOVEMENT, T018/T021/T022/T023, persistence, UI, V02, or Gate 1F. It does
not authorize F05_FIX17, Gate 1F PASS, or V02.

Detailed mechanism, source, provenance, alignment, discrete-rule, and
late-state audit: `docs/F05_FIX16_COUP_COORDINATION_DOMAIN_CLOSURE.md`.

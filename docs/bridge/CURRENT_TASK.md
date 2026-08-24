# TMR Current Bridge Task

TASK_ID: F05_FIX6

STATUS: AUTHORIZED

BASE_BRANCH: master

BASE_COMMIT: 4399a7b661075266f6d6d64adc3fdc3b74b3e506

BASE_COMMIT_NOTE: This commit added the immutable `docs/bridge/tasks/F05_FIX6.md` task. A newer HEAD is allowed only when commits after this base are ChatGPT-authored Bridge authorization updates under `docs/bridge/STATE.md` and/or this `CURRENT_TASK.md`. Before execution, run `git fetch origin`, verify post-base changes are Bridge authorization-only, and then `git pull --ff-only`.

TASK_FILE: docs/bridge/tasks/F05_FIX6.md

COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS

COMMIT_POLICY_NOTE: PASS means the Political Interaction Kernel design is explicit, any vertical-slice implementation stays within the immutable task, persistence/replay remains correct, controlled ACCEPT/REJECT/IGNORE counterfactuals are truthful, and all verification passes. It does NOT mean Gate 1F passed. A truthful `KERNEL_BLOCKED_BY_MODEL_OR_PERSISTENCE_CONTRACT / NOT_READY` is acceptable.

AUTHORIZED_SCOPE:

- accept F05_FIX5's grounding boundary and do not invent scalar faction effects
- create `docs/POLITICAL_INTERACTION_KERNEL.md` before implementation
- verify proposal/status-quo, veto-player, veto-bargaining, and minimal offer/accept-reject references using the F04C-R grounding method
- define proposer Faction, target current Government, player/state response authority, proposal subject, lifecycle, events, action authority, persistence, and causal boundaries
- prefer one v1 proposal subject: existing `InterventionId` request
- add the smallest optional scenario-authored proposal-template mapping needed to specify exactly which Faction/action may request which existing intervention
- do not infer demands from faction interests or ideology
- if implementation passes design checks, allow an accepted `LOBBY` to open one proposal only when an explicit authored template exists
- add authoritative open proposal state if necessary; if added, version persistence explicitly and test it
- add minimum typed player `ACCEPT | REJECT` proposal response action
- on REJECT preserve status quo except proposal lifecycle state/event
- on ACCEPT reuse/refactor the existing intervention resolver so normal feasibility, treasury cost, administrative load, duration, commitment, completion effects, and events remain authoritative
- do not create a hidden synthetic START_INTERVENTION ActionRecord
- run NO_PROPOSAL / IGNORE / REJECT / ACCEPT controlled counterfactuals from the same state/seed
- prefer a developer fixture mapping to an already-existing F04D intervention such as `coerciveRestriction` if it can be reused without duplicating effects
- run existing F05 only as regression baseline unless its six strategies explicitly gain proposal-response behavior in a separately justified way; do not silently change matrix semantics
- create `docs/F05_GATE1F_REPAIR6_POLITICAL_INTERACTION.md`
- write `docs/bridge/results/F05_FIX6_RESULT.md`
- update Bridge completion state

FORBIDDEN_SCOPE:

- direct faction resource/organization/grievance bonus from LOBBY or proposal opening
- inferred faction demand from interest/ideology labels
- automatic policy/intervention success
- automatic counteroffer / multi-round bargaining
- generic utility/political-power/stability score
- probabilistic acceptance, Nash/CFR/MCTS/RL/QRE, runtime LLM/MCP NPC decisions
- continuity decay/restoration, sovereignty meter, T023 threshold changes
- automatic successor/revolutionary Government creation
- direct crisis deletion/conflict resolution/free LandHex/hidden comeback
- elections/parties/coalitions/full labor bargaining/transitional justice/military factions/local autonomy
- War as Politics, fantasy, V02, renderer/UI
- story nodes/countdowns/filler events
- self-authorizing Gate 1F PASS or another follow-up task

EXPECTED_OUTPUT:

- `docs/POLITICAL_INTERACTION_KERNEL.md`
- explicit proposal state/lifecycle and Government/player authority contract
- one vertical slice or a truthful architecture block
- proposal persistence/version result
- NO_PROPOSAL / IGNORE / REJECT / ACCEPT counterfactual
- evidence that only ACCEPT reaches existing intervention effects
- downstream Agenda/action/crisis/conflict/territory/reassessment comparison
- exact primary classification:
  - `KERNEL_IMPLEMENTED_VERTICAL_SLICE_MEANINGFUL`
  - `KERNEL_IMPLEMENTED_BUT_NO_MEANINGFUL_DOWNSTREAM_CHANGE`
  - `KERNEL_BLOCKED_BY_MODEL_OR_PERSISTENCE_CONTRACT`
  - `KERNEL_DESIGN_ONLY_INSUFFICIENT_GROUNDING`
- `PROPOSAL_SUBJECT_KIND`, `TRIGGER_ACTION`, `PLAYER_RESPONSE`, `PERSISTENCE_FORMAT`, `TARGETED_COUNTERFACTUAL`, `OFFICIAL_F05_PACING`, `GATE1F_RECOMMENDATION`, `V02`

STARTUP / FRESHNESS CHECK:

```bash
git status
git fetch origin
git rev-parse HEAD
git rev-parse origin/master
git pull --ff-only
```

Do not treat an unfetched local `origin/master` as current GitHub state.

VERIFICATION:

- preferred Node 24.19.0 / pnpm 11.19.0; if unavailable record exact runtime
- `pnpm install --frozen-lockfile`
- `pnpm run format`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run build`
- `pnpm run inspect:t024`
- `pnpm run inspect:f01`
- `pnpm run inspect:f04b`
- `pnpm run inspect:f04d`
- targeted political-interaction inspection/test
- `pnpm run inspect:f05` baseline regression
- focused persistence tests if schema changes
- `pnpm test`
- `git diff --check`

RESULT_PATH: docs/bridge/results/F05_FIX6_RESULT.md

ON_COMPLETION:

- set `F05_FIX6: COMPLETE / AWAITING_CHATGPT_REVIEW` or truthful blocked state
- set `NEXT_AUTHORIZED_TASK_ID: NONE`
- set `NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW`
- set `CURRENT_TASK_FILE: NONE`
- keep `V02: NOT STARTED`
- do not implement the next integration step
- do not declare Gate 1F passed

Execute only the immutable task file referenced above.

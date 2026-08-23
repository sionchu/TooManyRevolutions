# TMR Current Bridge Task

TASK_ID: F05_FIX2_R

STATUS: AUTHORIZED

BASE_BRANCH: master

BASE_COMMIT: 8054e99ae12385bb43cd7e30bf480ff9ee930c5c

BASE_COMMIT_NOTE: This commit added the immutable `docs/bridge/tasks/F05_FIX2_R.md` review task. A newer HEAD is allowed only when commits after this base are ChatGPT-authored Bridge authorization updates to `docs/bridge/STATE.md` and/or this `CURRENT_TASK.md`. Before execution, verify the diff contains no gameplay/source changes.

TASK_FILE: docs/bridge/tasks/F05_FIX2_R.md

COMMIT_POLICY: COMMIT_AND_PUSH_ON_PASS

COMMIT_POLICY_NOTE: PASS means the targeted architecture review completed truthfully and verification passed. It does NOT mean the F05_FIX2 continuity writer passed review, Gate 1F passed, or V02 may start. A verdict rejecting the writer is a valid PASS result when evidence is sound.

AUTHORIZED_SCOPE:

- review the existing F05_FIX2 continuity writer without changing its gameplay behavior
- determine whether `stateContinuity -= 1` per qualifying weekly boundary is functionally a countdown/permanence timer
- test whether continuity damage forms an irreversible ratchet across legitimate recovery and later redisplacement
- distinguish incumbent-government defeat/displacement from extinction of the state as an independent political community
- review whether existing `governmentTransition` architecture can represent non-terminal revolutionary succession and whether current evidence is sufficient to select a successor
- define the precise semantics of `Country.stateContinuity` from existing GDD/Architecture contracts and audit the writer against them
- use controlled developer-only tests/inspection only when needed to prove current runtime behavior
- recommend the smallest follow-up if the writer is rejected; do not implement it
- create `docs/F05_FIX2_STATE_CONTINUITY_ARCHITECTURE_REVIEW.md`
- write `docs/bridge/results/F05_FIX2_R_RESULT.md`
- update `docs/bridge/LAST_RESULT.md` and completion state

EXTERNAL_REFERENCE_GUARDRAIL:

- REQUIRED: read `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`
- REQUIRED: use repository contracts and the F04C-R mechanism-first method first
- research is demand-driven
- narrow external research is allowed only if repository grounding is insufficient for the specific state-continuity / government-succession / state-extinction distinction
- if new research is used, separate `SOURCE-SUPPORTED FACT`, `INTERPRETATION`, and `TMR DESIGN INFERENCE`
- if grounding remains insufficient, report `INSUFFICIENT_REFERENCE_GROUNDING` rather than inventing a continuity rule
- War as Politics, Fantasy institutional politics, and Gate 1V visual reference work remain out of scope

FORBIDDEN_SCOPE:

- changing the continuity decrement amount, cadence, activation conditions, or threshold
- adding continuity restoration
- removing/disabling the F05_FIX2 writer
- implementing revolutionary succession or creating new Governments
- changing LandHex control
- intervention rebalance
- crisis/conflict strength rebalance
- changing F05 readable-arc criteria
- new permanence timers/countdowns
- direct crisis deletion / free territory / hidden comeback state / direct outcome scripting
- V02 / renderer / UI
- War as Politics
- fantasy / arcane institutions
- elections / parties / coalitions
- full labor bargaining
- transitional justice
- military factions
- local autonomy
- strategic AI / MCTS / runtime LLM
- generic political / sovereignty meters
- filler events or scheduled story content
- RNG merely to manufacture diversity
- self-authorizing Gate 1F PASS or any follow-up task

EXPECTED_OUTPUT:

- countdown classification with runtime proof
- ratchet classification with recovery/redisplacement probe
- State Dissolution evidence sufficiency classification
- revolutionary succession architecture classification
- precise `stateContinuity` semantic definition and writer semantic verdict
- external/reference-grounding statement
- explicit implication for the historical F05_FIX2 pacing result
- exactly one architecture verdict:
  `ACCEPT_WRITER | ACCEPT_WITH_REQUIRED_SEMANTIC_FIX | REJECT_WRITER_REQUIRES_NARROW_FIX | REJECT_WRITER_REQUIRES_NEW_CONTINUITY_EVIDENCE`
- smallest follow-up recommendation without implementation
- `GATE1F_RECOMMENDATION: PASS | PASS_WITH_NOTES | NOT_READY`

VERIFICATION:

- `pnpm install --frozen-lockfile`
- `pnpm run format`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run build`
- `pnpm run inspect:t024`
- `pnpm run inspect:f01`
- `pnpm run inspect:f04b`
- `pnpm run inspect:f04d`
- `pnpm run inspect:f05`
- focused developer-only probes/tests if added
- `pnpm test`
- `git diff --check`

RESULT_PATH: docs/bridge/results/F05_FIX2_R_RESULT.md

ON_COMPLETION:

- update Bridge to `F05_FIX2_R: REVIEW_COMPLETE / AWAITING_CHATGPT_REVIEW` or truthful blocked state
- set `NEXT_AUTHORIZED_TASK_ID: NONE`
- set `NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW`
- set `CURRENT_TASK_FILE: NONE`
- keep `V02: NOT STARTED`
- commit/push the review artifacts if the review is coherent and verification passes
- do not change Gate 1F to PASS
- do not start or implement the recommended follow-up

Execute only the immutable task file referenced above.

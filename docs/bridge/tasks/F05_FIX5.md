# TMR — F05_FIX5 Faction Action Consequence / Payoff Grounding

TASK_ID: F05_FIX5

Date: 2026-08-24

Task type: Gate 1F targeted grounding + at most one narrow faction-action consequence

## 0. Mission

F05_FIX4 closed the `FACTION_PROPOSAL_INTAKE_GAP`: deterministic T016 faction proposals now enter the common next-tick ActionRecord intake and visibly change `Faction.currentStrategy`.

It also proved the remaining blocker:

```text
ACTOR_ACTION_CONSUMER_GAP
```

In the active-conflict path, `LOBBY / BARGAIN / ORGANIZE / FUND_MOVEMENT / ACCEPT` currently change strategy labels/events but do not change grievance, organization, resources, Agenda timing, crisis timing, conflict strength/intent/recovery, territory, player response feasibility, or terminal state.

This task must determine the smallest historically/politically grounded **non-terminal authoritative consequence** for one existing faction action, then implement **at most one** consequence only if the evidence-to-consumer chain is strong enough.

The goal is not to manufacture event density. The goal is:

```text
current WorldState
-> legal faction action
-> explicit cost / commitment
-> bounded authoritative state consequence
-> existing consumer
-> changed political incentives / player reassessment
```

A truthful grounding-only result is valid if no safe consequence can be justified.

---

## 1. Authorized base

BASE_BRANCH: `master`

BASE_COMMIT: `a2fce02f7beac233b7338ce4f2d9ae7523534b9f`

A newer HEAD is acceptable only if every commit after this base is a ChatGPT-authored Bridge authorization update under `docs/bridge/**`. Before execution, explicitly fetch and verify origin.

---

## 2. Required reading

Read at minimum:

- `AGENTS.md`
- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/QA_PLAYTEST.md`
- `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`
- `docs/F04C_R_POLITICAL_HISTORICAL_REFERENCE_GROUNDING.md`
- `docs/F04C_INSTITUTION_MEDIATED_STABILIZATION_DESIGN.md`
- `docs/F04D_INSTITUTION_MEDIATED_STABILIZATION_IMPLEMENTATION.md` if present
- `docs/F04B_ACTIVE_CONFLICT_RECOVERY_AGENCY.md`
- `docs/T016_FACTION_PRESSURE_CHECK.md`
- `docs/T018_POLITICAL_CRISIS_CHECK.md`
- `docs/T021_SIMPLIFIED_CONFLICT_WAR_CHECK.md`
- `docs/F05_GATE1F_REPAIR1.md`
- `docs/F05_GATE1F_REPAIR3_REMOVE_CONTINUITY_WRITER.md`
- `docs/F05_FIX4_ACTOR_ADAPTATION_REFERENCE_GROUNDING.md`
- `docs/F05_GATE1F_REPAIR4_ACTOR_LOOP.md`
- `docs/bridge/results/F05_FIX4_RESULT.md`
- `src/sim/state/faction.ts`
- `src/sim/state/action.ts`
- `src/sim/systems/factionPressure.ts`
- `src/sim/systems/politicalCrisis.ts`
- `src/sim/systems/conflict.ts`
- `src/sim/systems/conflictResolution.ts`
- `src/sim/readModels/agenda.ts`
- relevant intervention and F05 inspection code/tests

Repository source/tests/diffs remain higher authority than Bridge prose.

---

## 3. Fixed architecture contracts

Preserve all of the following:

- player = historical continuity of `CountryId`, not incumbent government/faction/ideology;
- internal rebellion displacement alone is non-terminal;
- physical territory authority remains only `WorldState.landHexStates[*].controller`;
- `Region.stateControl` is administrative/security penetration, not physical ownership;
- faction proposals remain transient/non-authoritative; accepted ActionRecords are authoritative input;
- actor selection remains deterministic and schema-valid;
- no runtime LLM/MCP/equilibrium solver dependency;
- no generic political/sovereignty/utility meter;
- no story nodes, countdowns, periodic filler, or RNG added merely for diversity;
- no direct crisis deletion, free Hex, hidden comeback, direct terminal scripting, or automatic revolutionary succession.

---

## 4. Required external/reference grounding

Use the F04C-R mechanism-first method:

```text
SOURCE-SUPPORTED FACT
-> observed mechanism
-> conditions / counterexamples / failure modes
-> trade-off
-> TMR state + existing consumer mapping
-> IMPLEMENT / DEFER / REJECT
```

Start with these reference families and verify the actual sources before relying on them:

### Resource mobilization / organization

- McCarthy & Zald, `Resource Mobilization and Social Movements: A Partial Theory`, American Journal of Sociology 82(6), 1977.
- Jenkins, `Resource Mobilization Theory and the Study of Social Movements`, Annual Review of Sociology 9, 1983.
- later resource-mobilization reviews may be used to distinguish material, human, social-organizational, cultural, and moral resources.

Mechanism to test, not assume:

- grievance alone does not mechanically determine movement activity;
- resources and organization condition mobilization capacity;
- organization can be a major determinant of mobilization potential;
- resource access and organizational effort can affect movement capability.

### Advocacy / lobbying

- Andrews & Edwards, `Advocacy Organizations in the U.S. Political Process`, Annual Review of Sociology 30, 2004.
- Garlick, Junk & Brown, `How Lobbying Matters`, Annual Review of Political Science 28, 2025.
- relevant work on interest-group access / access barriers may be used.

Mechanism to test, not assume:

- lobbying commonly acts through access, information, coalitions, or transactional relationships;
- institutional access conditions tactic viability;
- lobbying is not a universal scalar `influence +X` mechanic.

### Existing F05_FIX4 game-AI grounding

Reuse the accepted conclusion:

- current-state legal response / best-response is a useful conceptual frame;
- do not introduce Nash/CFR/PSRO/MCTS/RL/QRE/hidden utility weights here;
- payoff selection comes **after** explicit action consequences exist.

Do not broaden into general War as Politics research or a new state-extinction/succession domain.

---

## 5. Action-by-action consequence audit

Audit all five currently active T016 action types:

```text
FUND_MOVEMENT
ORGANIZE
LOBBY
BARGAIN
ACCEPT
```

For each action, produce a table with:

1. political meaning in the current TMR vocabulary;
2. explicit actor-side cost / commitment if any;
3. candidate authoritative state fields already present in the repository;
4. existing downstream consumers of those fields;
5. active-conflict relevance;
6. player reassessment pathway;
7. evidence strength;
8. failure modes / counterexamples;
9. implementation verdict: `IMPLEMENT_CANDIDATE | DEFER | REJECT`.

### Important semantic constraints

`LOBBY`:
- do not model it as automatic policy success or generic influence gain;
- if there is no represented demand/recipient/access outcome, defer it.

`BARGAIN`:
- politicalCompetition=`plural` only makes the action legal; it does not define an offer, counterpart, acceptance, or settlement;
- do not magically reduce grievance or resolve conflict without a represented bargaining object/response.

`ACCEPT`:
- do not reduce grievance merely because the strategy name is `accept` unless the accepted object/status quo/concession is represented.

`ORGANIZE` / `FUND_MOVEMENT`:
- these are the leading candidates only because current TMR already has `Faction.resources`, `Faction.organization`, regional ideology organization/radicalism, T018 mobilization gates, and T021 operational-strength consumers;
- do not assume a particular numeric conversion before grounding it.

---

## 6. Candidate selection gate

Implement **at most one** action consequence.

A candidate is implementable only if all are true:

1. uses existing authoritative state fields or one narrowly typed scenario-owned parameter, not a new generic meter;
2. has an explicit, explainable cost/commitment or limiting condition;
3. has an existing consumer that matters in the active-conflict/pre-crisis path;
4. does not directly transfer territory, create/delete a crisis, resolve a conflict, alter state continuity, or set a terminal result;
5. effect is bounded and does not create a permanent one-way ratchet merely from monthly execution;
6. repeated execution is naturally self-limiting through current state/cost/legality, not an arbitrary action-ID cooldown;
7. numeric magnitude is grounded by an existing semantic scale/config/scenario parameter or explicitly justified scenario-owned action parameter — not chosen merely to improve F05;
8. there is a measurable counterfactual state difference beyond `currentStrategy` and `FACTION_STRATEGY_CHANGED`.

If none qualifies, stop with:

```text
INSUFFICIENT_ACTION_CONSEQUENCE_GROUNDING
```

and do not implement a consequence.

### Selection preference

Prefer the shortest grounded chain among `ORGANIZE` and `FUND_MOVEMENT` because current T018/T021 already consume organization/resources/local mobilization.

This is a preference, not an instruction to force either one.

---

## 7. Implementation rules if a candidate passes

If exactly one candidate passes:

- keep existing action vocabulary and actor-loop intake;
- resolve its consequence only from an accepted ActionRecord through the normal authoritative phase path;
- produce clear causal evidence; add a typed event only if needed to represent a real state consequence, never as pacing filler;
- preserve deterministic FactionId/action ordering;
- preserve insertion-order independence;
- preserve save/load and replay determinism;
- do not add a second action consequence in the same task;
- do not retune the chooser solely to make the new consequence fire more/less often;
- do not rebalance player interventions in the same task.

No `currentStrategy => direct combat bonus` shortcut. The accepted action must change a real authoritative input that an existing consumer already reads.

---

## 8. Required counterfactuals

Before the full F05 rerun, run controlled comparisons:

### A. Accepted action vs same state without consequence

Same scenario/state/seed/action sequence, differing only in whether the selected accepted faction action consequence is applied.

Report:

- actor cost/commitment;
- authoritative state delta;
- next relevant T017/T018/T021/Agenda consumer delta;
- player response-feasibility delta if any;
- conflict/territorial intent delta if any;
- no direct terminal/continuity mutation.

### B. Repeated-action behavior

Run enough monthly actor decisions to show whether repeated use:

- self-limits;
- saturates safely;
- cycles because state changes;
- or forms an exploit/ratchet.

Reject the implementation if it creates a cheap monotonic permanent ratchet.

### C. Player interaction

Show at least one branch where a player intervention changes the state used by the faction consequence or its downstream consumer, so the actor/player loop is genuinely interactive rather than two independent scripts.

If no such existing interaction exists, classify it explicitly.

---

## 9. F05 rerun

If a consequence is implemented, rerun the exact unchanged F05 matrix:

- seed `40103`;
- 1,800 days / five years;
- contexts `0/1`, `18/19`, `180/181`;
- same six strategies;
- faction actor loop ON.

Report at minimum:

- WAIT classification for early / near / recovery;
- accommodation classification;
- meaningful response counts;
- action proposal / accepted / consequence-applied counts;
- trajectory signatures;
- causal readability;
- longest major-event silence;
- longest genuine reassessment silence;
- readable arc by representative context;
- active conflict / territory / outcome clusters;
- whether recovery remains `TRADEOFF`;
- whether repeated accommodation retains a real downside;
- whether the selected faction action becomes universally dominant or creates a new ratchet.

Do **not** count the new action event itself as meaningful reassessment unless an authoritative downstream state/decision consequence changes.

If no consequence is implemented, do not pretend the F05 matrix changed; report the grounding blocker instead.

---

## 10. Expected classification

End with exactly one consequence result:

```text
CONSEQUENCE_IMPLEMENTED_MEANINGFUL
CONSEQUENCE_IMPLEMENTED_BUT_PACING_INSUFFICIENT
CONSEQUENCE_REJECTED_RATCHET_OR_DOMINANCE
INSUFFICIENT_ACTION_CONSEQUENCE_GROUNDING
```

Also report:

```text
SELECTED_ACTION: <action | NONE>
ACTIVE_CONFLICT_CONSUMER: <consumer | NONE>
GATE1F_RECOMMENDATION: PASS | PASS_WITH_NOTES | NOT_READY
```

Gate 1F remains ChatGPT/user authority.

---

## 11. Forbidden scope

This task MUST NOT add:

- continuity decay/restoration or sovereignty meter;
- T023 threshold changes;
- automatic revolutionary succession / Government creation;
- direct conflict resolution or crisis deletion;
- free LandHex transfer;
- hidden comeback state;
- generic utility/political-power/stability meter;
- arbitrary strategy-specific combat multiplier;
- arbitrary `grievance +/- X` merely from action names;
- Nash/CFR/fictitious-play/PSRO/MCTS/RL runtime systems;
- QRE/logit randomness;
- MCP/LLM runtime NPC decisions;
- elections/parties/coalitions;
- full labor bargaining system;
- transitional justice;
- military factions;
- local autonomy;
- War as Politics;
- fantasy institutions;
- V02 / renderer / UI;
- story nodes/countdowns/filler events;
- self-authorized Gate 1F PASS or another follow-up task.

---

## 12. Required artifacts

Create:

```text
docs/F05_FIX5_FACTION_ACTION_CONSEQUENCE_GROUNDING.md
```

If an implementation is justified, also create:

```text
docs/F05_GATE1F_REPAIR5_FACTION_CONSEQUENCE.md
```

Always write:

```text
docs/bridge/results/F05_FIX5_RESULT.md
```

Update on completion:

```text
docs/bridge/LAST_RESULT.md
docs/bridge/STATE.md
```

Preserve all historical F05/FIX1/FIX2/FIX2_R/FIX3/FIX4 result artifacts.

---

## 13. Startup / freshness check

```bash
git status
git fetch origin
git rev-parse HEAD
git rev-parse origin/master
git pull --ff-only
```

Do not rely on a stale local `origin/master`.

---

## 14. Verification

Preferred Node `24.19.0`, pnpm `11.19.0`; if unavailable, record exact runtime and still run full verification.

At minimum:

```bash
pnpm install --frozen-lockfile
pnpm run format
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm run inspect:t024
pnpm run inspect:f01
pnpm run inspect:f04b
pnpm run inspect:f04d
pnpm run inspect:f05
pnpm test
git diff --check
```

Add focused tests for:

- selected action consequence or grounding-only classification;
- exact accepted-action authority path;
- deterministic ordering;
- repeated-action boundedness / no ratchet;
- relevant T018/T021/Agenda consumer;
- persistence/replay if authoritative state behavior changes.

---

## 15. Commit policy

COMMIT_POLICY: `COMMIT_AND_PUSH_ON_PASS`

PASS means the grounding is complete, the candidate selection is evidence-based, any implementation stays within scope, verification passes, and the F05 report is truthful. PASS does not mean Gate 1F passes.

A grounding-only `INSUFFICIENT_ACTION_CONSEQUENCE_GROUNDING / NOT_READY` result is a valid successful task outcome.

Preferred implementation commit if used:

```text
fix: ground one faction action consequence
```

Preferred docs/result commit:

```text
docs: record F05_FIX5 faction consequence result
```

---

## 16. On completion

- set `F05_FIX5: COMPLETE / AWAITING_CHATGPT_REVIEW` or truthful blocked state;
- set `NEXT_AUTHORIZED_TASK_ID: NONE`;
- set `NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW`;
- set `CURRENT_TASK_FILE: NONE`;
- keep `V02: NOT STARTED`;
- do not start a second consequence or follow-up task;
- do not declare Gate 1F passed.

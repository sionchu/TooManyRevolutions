# TMR — F05_FIX2_R State Continuity / Dissolution Targeted Architecture Review

TASK_ID: F05_FIX2_R

Date: 2026-08-24

Task type: Gate 1F targeted architecture review / no gameplay implementation

## 0. Mission

F05_FIX2 successfully diagnosed the late steady state and produced readable five-year F05 arcs, but its selected repair introduced a new writer:

```text
weekly conflict boundary
+ player Country controls zero LandHexes
+ active internal rebellion exists
+ participant Faction physically controls territory
+ no real government recovery restored a Country Hex
→ Country.stateContinuity -= 1
→ existing T023 threshold eventually emits STATE_DISSOLVED
```

ChatGPT review did **not** accept Gate 1F after F05_FIX2 because this writer may conflict with TMR's core state-continuity contract.

This task has exactly one purpose:

```text
Determine whether the F05_FIX2 continuity writer is a legitimate state-continuity consequence
or an implicit permanence/countdown/ratchet that turns internal government defeat into automatic State Dissolution.
```

This is a review task first. **Do not repair or replace the writer in this task.**

Codex may recommend the exact smallest follow-up, but must not implement it, pass Gate 1F, or authorize V02.

---

## 1. Authorized base

BASE_BRANCH: `master`

BASE_COMMIT: `cc51ad77d9ffa27afc49f21fe92dc0992e6ac846`

A newer HEAD is acceptable only if every commit after this base is a ChatGPT-authored Bridge authorization update under `docs/bridge/**`. Before execution, verify the diff contains no gameplay/source change.

---

## 2. Required reading

Follow `AGENTS.md` and the Bridge protocol.

Read at minimum:

- `docs/GDD.md`
- `docs/ARCHITECTURE.md`
- `docs/QA_PLAYTEST.md`
- `docs/bridge/STATE.md`
- `docs/bridge/CURRENT_TASK.md`
- `docs/bridge/LAST_RESULT.md`
- `docs/bridge/results/F05_RESULT.md`
- `docs/bridge/results/F05_FIX1_RESULT.md`
- `docs/bridge/results/F05_FIX2_RESULT.md`
- `docs/F05_PACING_FUN_DECISION.md`
- `docs/F05_GATE1F_REPAIR1.md`
- `docs/F05_GATE1F_REPAIR2.md`
- `docs/F04B_ACTIVE_CONFLICT_RECOVERY_AGENCY.md`
- `docs/F04C_INSTITUTION_MEDIATED_STABILIZATION_DESIGN.md`
- `docs/F04C_R_POLITICAL_HISTORICAL_REFERENCE_GROUNDING.md`
- `docs/F04_TARGETED_ARCHITECTURE_GATE_REVIEW.md`
- `docs/T021_SIMPLIFIED_CONFLICT_WAR_CHECK.md`
- `docs/T023_STATE_DISSOLUTION_CHECK.md`
- `docs/T024_PERSISTENCE_REPLAY_CHECK.md`
- `docs/FUTURE_REFERENCE_GROUNDING_GATES.md`
- `src/sim/systems/conflict.ts`
- `src/sim/systems/conflictResolution.ts`
- `src/sim/systems/stateDissolution.ts`
- relevant conflict/dissolution/F05 tests and inspection code

Repository source/tests/diffs remain higher authority than Bridge prose.

---

## 3. Fixed project contracts to test against

Do not silently redefine these contracts merely to justify the F05_FIX2 writer.

### Player identity

The player is the historical continuity of a state (`CountryId`), not the incumbent ruler, government, dynasty, party, faction, or ideology.

### Non-terminal political defeat

The following are not automatic terminal defeat by themselves:

- revolution;
- coup;
- monarchy collapse;
- government turnover;
- election loss;
- a particular government losing a civil war;
- temporary capital loss;
- total occupation alone;
- zero Country-controlled LandHexes alone.

A revolutionary or successor government may continue the same `CountryId` if the state remains an independent political community.

### Only terminal defeat

`State Dissolution` is the only terminal defeat.

The product meaning is disappearance of the state as an independent political community, such as supported evidence of:

- full annexation;
- permanent fragmentation beyond recovery;
- loss of sovereign state functions;
- another explicitly grounded terminal dissolution condition.

Do not equate incumbent-government displacement with disappearance of the state.

### Territory authority

Physical territorial authority remains only:

```text
WorldState.landHexStates[*].controller
```

`Region.stateControl` remains administrative/security/state penetration, not physical ownership.

### No hidden political countdowns

TMR does not use chapters, revolution phases, hidden comeback scores, permanence countdowns, or story timers to schedule political outcomes.

An endogenous state consequence may use cadence, but a fixed repeated decrement that functionally becomes `N boundaries until defeat` must be identified as such if that is its actual behavior.

---

## 4. Review question A — Is the writer functionally a countdown?

Inspect the current implementation of:

```text
applyUnresolvedInternalRebellionContinuityPressure()
CONFLICT_RESOLUTION_CONFIG.unresolvedInternalRebellionContinuityLoss
```

Prove the functional behavior from actual code and tests.

At minimum answer:

1. Under a persistent qualifying state, is the decrement exactly one per political week?
2. With `stateContinuity=100` and a scenario threshold of `0`, does unchanged qualifying state imply a deterministic terminal boundary after approximately 100 weekly decrements?
3. Does the writer depend on any changing sovereign-function evidence beyond the same repeated Boolean qualification?
4. Does the terminal date therefore become approximately:

```text
first qualifying full-displacement weekly boundary
+ fixed number of weekly boundaries determined by continuity value / decrement / threshold
```

5. Does changing the initial continuity value or per-boundary decrement linearly shift the terminal date without changing political history?

Classify:

```text
NOT_A_COUNTDOWN
STATE_CONDITIONED_COUNTDOWN
EFFECTIVE_PERMANENCE_TIMER
OTHER_WITH_EVIDENCE
```

Do not rely on naming or comments. Judge runtime behavior.

---

## 5. Review question B — Is there a ratchet?

Explicitly test or inspect this sequence without changing gameplay logic:

```text
A. Country loses all physical LandHexes under internal rebellion
B. continuity declines for several eligible boundaries
C. Country legitimately recovers at least one LandHex through the existing F04B/T021 recovery path
D. later Country again loses all LandHexes under qualifying internal rebellion
```

Answer:

- Does continuity recover after real territorial/government recovery?
- If not, does the second displacement resume from the previously damaged continuity value?
- Can repeated recoverable political crises therefore accumulate irreversible damage toward State Dissolution even when the state repeatedly re-establishes physical authority?
- Is there an existing grounded restoration consumer, or is the writer one-way?

Classify:

```text
NO_RATCHET
BOUNDED_RATCHET
ONE_WAY_CONTINUITY_RATCHET
OTHER_WITH_EVIDENCE
```

This review must not invent a restoration rule merely to obtain a favorable classification.

---

## 6. Review question C — Government defeat vs State Dissolution

Inspect the actual F05_FIX2 terminal branches.

For representative early/near/recovery branches that now dissolve, identify what the simulation has actually proven at the dissolution boundary.

Separate these propositions:

```text
1. incumbent/current government controls no LandHexes
2. an internal rebellion faction controls LandHexes
3. the same CountryId still exists
4. a valid Government object / possible successor Government exists or does not exist
5. sovereign state functions are proven lost or not represented
6. permanent fragmentation is proven or not represented
7. annexation is proven or not represented
8. independent political community is proven extinct or not represented
```

Then answer:

> Does the current evidence prove disappearance of the state, or only defeat/displacement of the current government?

Required classification:

```text
STATE_DISSOLUTION_EVIDENCE_SUFFICIENT
GOVERNMENT_DEFEAT_ONLY
AMBIGUOUS_CONTINUITY_EVIDENCE
INSUFFICIENT_CONTINUITY_EVIDENCE
```

Do not infer state extinction from the fact that the F05 harness needs a later consequence.

---

## 7. Review question D — Revolutionary succession seam

TMR explicitly allows revolution and civil-war government defeat without automatic game over.

Inspect current Government / ConflictOutcome / Country continuity architecture and determine whether a non-terminal revolutionary succession path is already representable.

At minimum answer:

- Can `ConflictOutcome.governmentTransition` switch `Country.currentGovernmentId` while preserving the same `CountryId`?
- Does current runtime have enough evidence to automatically choose a particular revolutionary successor government in F05_FIX2 branches?
- Would doing so now require inventing Governments, elections, party systems, coalition logic, military factions, or unsupported successor-state rules?
- Is the correct architecture currently:
  - existing representable non-terminal government transition;
  - missing narrow successor-resolution evidence;
  - or no justified transition at all?

Classification:

```text
NONTERMINAL_SUCCESSION_ALREADY_REPRESENTABLE
SUCCESSION_SEAM_EXISTS_BUT_EVIDENCE_MISSING
NEW_DOMAIN_REQUIRED
NOT_APPLICABLE_WITH_EVIDENCE
```

Do not implement succession in this review.

---

## 8. Review question E — What should `stateContinuity` mean?

Review GDD/Architecture/current consumers and give one precise semantic definition for `Country.stateContinuity`.

It must distinguish at least:

- incumbent-government territorial control;
- administrative penetration;
- temporary displacement;
- sovereign continuity of the state;
- permanent fragmentation / annexation / extinction evidence.

Then audit whether the F05_FIX2 writer matches that meaning.

Required verdict:

```text
WRITER_MATCHES_CONTINUITY_SEMANTICS
WRITER_TRACKS_GOVERNMENT_CONTROL_NOT_STATE_CONTINUITY
CONTINUITY_SEMANTICS_UNDERSPECIFIED
OTHER_WITH_EVIDENCE
```

If semantics are underspecified, say so. Do not patch the definition merely to preserve the writer.

---

## 9. Counterfactual probes

Use existing code/tests or developer-only inspection. No gameplay mutation.

Run controlled probes where possible:

### Probe 1 — Same political state, different continuity start

Compare otherwise-identical qualifying states with e.g. continuity 100 / 50 / 10.

Report whether terminal timing changes almost mechanically with initial continuity.

### Probe 2 — Same political state, temporary recovery

Create or reuse a test path where a real Country Hex is recovered, then later lost again.

Report continuity before displacement, after recovery, and after second displacement.

### Probe 3 — Internal rebellion vs foreign occupation

Verify the writer distinguishes internal rebellion physical control from foreign occupation and coup-only states exactly as claimed.

### Probe 4 — Government transition without dissolution

Where existing fixtures permit, verify a government transition preserves `CountryId` and is non-terminal.

### Probe 5 — F05 pacing without accepting architecture

Keep the F05_FIX2 measurement result as historical evidence, but explicitly state whether its improved pacing is causally acceptable if the terminal writer itself fails the architecture review.

Do not treat `readableArc=YES` as proof that the writer is valid.

---

## 10. External reference / grounding rule

This task MUST read `docs/FUTURE_REFERENCE_GROUNDING_GATES.md` and use the F04C-R mechanism-first method.

Start with repository contracts and existing political/historical grounding.

Only if those sources are insufficient to answer the narrow question may you perform targeted external research on topics such as:

- state continuity through revolution or regime replacement;
- distinction between government succession and extinction of the state;
- civil war / revolutionary victory without disappearance of international or legal state continuity;
- conditions commonly associated with state extinction, annexation, permanent partition, or sovereign-function loss.

If new research is used, the result MUST separate:

```text
SOURCE-SUPPORTED FACT
INTERPRETATION
TMR DESIGN INFERENCE
```

and record why repository grounding was insufficient.

Do not broaden into general War as Politics research, fantasy research, party/election systems, international-law simulation, or a new sovereignty subsystem.

If sufficient support cannot be established, return:

```text
INSUFFICIENT_REFERENCE_GROUNDING
```

instead of inventing a rule.

---

## 11. Decision matrix

End with exactly one architecture verdict for the current F05_FIX2 continuity writer:

```text
ACCEPT_WRITER
ACCEPT_WITH_REQUIRED_SEMANTIC_FIX
REJECT_WRITER_REQUIRES_NARROW_FIX
REJECT_WRITER_REQUIRES_NEW_CONTINUITY_EVIDENCE
```

### ACCEPT_WRITER requires all of:

- not functionally a prohibited countdown/permanence timer;
- no problematic one-way ratchet;
- runtime evidence genuinely supports State Dissolution rather than current-government defeat;
- writer matches the semantic meaning of state continuity;
- zero territory alone is not sufficient;
- revolution/government defeat non-terminal contract remains intact.

If any of those cannot be demonstrated, do not choose `ACCEPT_WRITER` merely because F05 pacing improved.

---

## 12. Follow-up recommendation

If writer is rejected, recommend the **smallest next task**, without implementing it.

Possible categories include:

```text
REMOVE_OR_DISABLE_CONTINUITY_WRITER
MAKE_INTERNAL_REBELLION_VICTORY_NONTERMINAL
ADD_NARROW_SUCCESSOR_RESOLUTION_EVIDENCE
DEFINE_GROUNDED_SOVEREIGN_CONTINUITY_EVIDENCE
RETURN_TO_PACING_WITHOUT_TERMINAL_SHORTCUT
OTHER_WITH_EVIDENCE
```

You may recommend a sequence of at most two narrowly scoped tasks if one task cannot safely resolve both correctness and pacing.

Do not authorize them.

---

## 13. Explicit forbidden scope

This task MUST NOT:

- change `stateContinuity` formulas or cadence;
- add restoration rules;
- remove the F05_FIX2 writer;
- add new Government creation;
- implement revolutionary succession;
- change LandHex controllers;
- rebalance interventions;
- change crisis/conflict strength formulas;
- alter T023 threshold values;
- change F05 readable-arc thresholds;
- add filler events;
- add permanence timers/countdowns;
- add elections/parties/coalitions;
- add full labor bargaining;
- add transitional justice;
- add military factions;
- add local autonomy;
- add War as Politics;
- add fantasy institutions;
- start V02 / renderer / UI;
- add strategic AI / runtime LLM;
- add generic political/sovereignty meters;
- self-authorize Gate 1F PASS or any follow-up task.

Allowed source changes are limited to developer-only inspection/tests necessary to prove current behavior. Prefer no production source changes.

---

## 14. Expected artifacts

Create:

```text
docs/F05_FIX2_STATE_CONTINUITY_ARCHITECTURE_REVIEW.md
```

If developer-only probes are required, keep them narrowly under existing inspection/test structure and do not alter authoritative runtime behavior.

Write immutable Bridge result:

```text
docs/bridge/results/F05_FIX2_R_RESULT.md
```

Update on completion:

```text
docs/bridge/LAST_RESULT.md
docs/bridge/STATE.md
```

Do not overwrite F05, F05_FIX1, or F05_FIX2 historical result files.

---

## 15. Verification

At minimum run:

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

If you add focused developer-only tests/probes, run them explicitly and report them.

The current F05_FIX2 behavior should remain unchanged by this review.

---

## 16. Commit policy

COMMIT_POLICY: `COMMIT_AND_PUSH_ON_PASS`

Here PASS means the architecture review is complete, truthful, scoped correctly, and verification passes. It does **not** mean the continuity writer passed review and does not mean Gate 1F passed.

A review verdict rejecting the writer is a valid PASS result if the evidence is sound.

Preferred commit:

```text
chore: review F05_FIX2 state continuity architecture
```

---

## 17. Required result schema

Write the Bridge result with at least:

```text
TASK_ID: F05_FIX2_R
STATUS: REVIEW_COMPLETE / BLOCKED
START_COMMIT:
END_COMMIT:
COMMIT_CREATED:
PUSHED:

COUNTDOWN_REVIEW:
- classification:
- runtime proof:
- initial-continuity sensitivity:
- fixed-boundary timing relationship:

RATCHET_REVIEW:
- classification:
- recovery probe:
- second-displacement behavior:
- restoration consumer present: YES / NO

DISSOLUTION_EVIDENCE_REVIEW:
- classification:
- what is actually proven:
- government defeat vs state extinction:
- annexation evidence:
- fragmentation evidence:
- sovereign-function evidence:

REVOLUTIONARY_SUCCESSION_REVIEW:
- classification:
- existing governmentTransition seam:
- evidence sufficient to choose successor: YES / NO
- new domain required: YES / NO

STATE_CONTINUITY_SEMANTICS:
- semantic definition:
- writer semantic verdict:

REFERENCE_GROUNDING:
- repository grounding sufficient: YES / NO
- new external research: YES / NO
- if new: source-supported fact / interpretation / TMR inference

F05_IMPLICATION:
- F05_FIX2 pacing result remains reproducible: YES / NO
- pacing result architecture-acceptable: YES / NO / CONDITIONAL

ARCHITECTURE_VERDICT:
ACCEPT_WRITER / ACCEPT_WITH_REQUIRED_SEMANTIC_FIX / REJECT_WRITER_REQUIRES_NARROW_FIX / REJECT_WRITER_REQUIRES_NEW_CONTINUITY_EVIDENCE

FOLLOW_UP_RECOMMENDATION:
- category:
- exact smallest next task:
- optional second task only if necessary:

GATE1F_RECOMMENDATION:
PASS / PASS_WITH_NOTES / NOT_READY

VERIFICATION:
- install:
- format:
- typecheck:
- lint:
- build:
- inspect:t024:
- inspect:f01:
- inspect:f04b:
- inspect:f04d:
- inspect:f05:
- focused probes/tests:
- full tests:
- git diff --check:

NEXT_AUTHORIZED_TASK_ID: NONE
V02: NOT STARTED
```

---

## 18. Completion discipline

On completion:

- `F05_FIX2_R: REVIEW_COMPLETE / AWAITING_CHATGPT_REVIEW` or truthful blocked state;
- `NEXT_AUTHORIZED_TASK_ID: NONE`;
- `NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW`;
- `CURRENT_TASK_FILE: NONE`;
- `V02: NOT STARTED`;
- do not modify Gate 1F to PASS;
- do not start the recommended fix.

ChatGPT/user remains the Gate 1F authority.

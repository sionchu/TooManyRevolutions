# P0 Integration V1 — Contextual Decisions Blocker Addendum

EXECUTION_AUTHORITY: P0_INTEGRATION_V1_SUPPLEMENT

This supplement records a newly confirmed P0 gameplay-surface defect while `parallel-p0-contextual-decisions-v1` is developed independently.

## Confirmed repository defect

The current player-facing Decision surface is not the intended production decision system:

- `App.tsx` currently hardcodes a small `policySurfaceIds` set.
- intervention candidates currently enumerate the entire GameBuilders intervention catalog before normal feasibility.
- GameBuilders currently inherits F04D validation decision content.
- the visible policy source is still based on T012 fixture content.
- F04D documentation explicitly states the four validation responses are not a production catalog.

This means different WorldStates and institutional states can show effectively the same decision menu with only feasibility/status changing.

## Product contract

The primary decision surface must eventually consume:

```text
reference-grounded production catalog
+ current Institutional Rules
+ actual WorldState / current pressure / conflicts / recent evidence
→ contextual relevance selector
→ feasibility/availability
→ small player-facing shortlist
```

Do not replace this with a derived-regime switch, generic score, focus tree, hidden timer, RNG, or utility optimizer.

## Parallel owner

A dedicated branch is authorized:

- branch: `parallel-p0-contextual-decisions-v1`
- task: `docs/parallel/tasks/P0_CONTEXTUAL_DECISIONS_V1.md`
- authorization commit at task creation: `7ab69a9309c9e6a2f7c6a1c1068d65cf95042df2`

That track owns production Policy/Intervention content and a pure contextual decision read model. It does **not** own `App.tsx` or player-facing integration UI.

## Integration behavior now

Do not wait idly for the contextual-decisions branch. Continue the already-authorized P0 Integration V1 map/art/icon/audio/world-first work.

However:

- do not add more hardcoded policy IDs as a product solution;
- do not add new UI-only filtering heuristics that duplicate the future selector;
- do not declare the Decision surface product-complete while it still uses the fixed list/full-catalog pattern;
- if `App.tsx` is touched for other integration work, keep the decision data seam easy to replace and preserve existing factual feasibility behavior.

If the contextual-decisions implementation is QC-accepted before Integration V1 final result is committed, integrate its accepted content/selector and replace:

1. hardcoded `policySurfaceIds`;
2. full `interventionCatalog` enumeration for the primary Decision Table.

If Integration V1 implementation reaches STOP first, record `CONTEXTUAL_DECISION_SURFACE: P0_OPEN` in the result and do not claim P0 PASS. The accepted contextual decision branch will then be brought in as the immediate Integration V1 follow-up.

## UI acceptance after handoff

The final integrated primary Decision Table should normally contain 2–5 meaningful current choices, with a hard upper bound of 6 absent explicit QA justification.

It may contain:

- currently available relevant choices;
- directly relevant but blocked choices, with a concrete reason.

It should not contain unrelated catalog entries merely because they exist.

The full structural policy catalog remains inspectable through the Institutional Roadmap/secondary surface rather than crowding the immediate decision shortlist.

Required browser QA after integration must demonstrate at least three materially different factual states whose primary decision shortlists differ in identity, not only enabled/disabled styling.

## Gate boundary

No P0 PASS, Gate1F PASS, V02, persistence change, deployment or successor self-authorization is granted by this supplement.
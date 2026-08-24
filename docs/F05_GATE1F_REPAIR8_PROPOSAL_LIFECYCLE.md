# F05 Gate 1F Repair 8 — Proposal Lifecycle

## Decision

F05_FIX8 is complete for the authorized developer validation slice. Phase A
found and repaired a developer measurement artifact, then Phase B implemented a
state-grounded explicit-rejection reconsideration contract. Gate 1F remains
`NOT_READY`; this document does not promote the gate or start V02.

## Implemented contract

- stable demand identity:
  `proposerFactionId + countryId + subjectKind + interventionId`;
- one open proposal episode per stable demand;
- explicit REJECT stores captured Government, feasibility boolean, and sorted
  discrete failure classes;
- unchanged basis does not reopen; a Government or requested-intervention
  feasibility-basis transition can open a new episode;
- ACCEPT continues through the existing intervention commitment/effect path;
- proposal lifecycle events remain outside `F05_PACING_EVENT_TYPES`;
- authoritative snapshot format is V4, and V3 is rejected without migration.

## Evidence

The eight non-accept branches are documented in
`docs/F05_FIX8_NON_ACCEPT_DIVERGENCE_AUDIT.md`. The post-fix audit reports zero
IGNORE/REJECT non-accept divergences and preserves the 36-branch historical
baseline. The focused lifecycle inspection passes unchanged-basis,
Government-change, feasibility-change, unrelated-scalar-drift, IGNORE,
ACCEPT, insertion-order, V4 save/load, and V3 rejection checks.

The F05_FIX7 long-horizon matrix remains complete at 36 historical plus 108
proposal branches (`144/144`). It reports:

```text
historical baseline: UNCHANGED / NOT_READY
state-grounded max reassessment silence: 1200d
post-intervention late state-grounded silence: 1110d
proposal-decision max silence: 1800d
IGNORE non-accept effects: 0
REJECT non-accept effects: 0
ACCEPT state-grounded effects: 18
identical-basis reopen churn: 0 (CLOSED)
legitimate reopens: 2
```

The two legitimate transitions are both in the repeated-accommodation probe:
the same Government changes from `feasible` to
`INSUFFICIENT_ADMINISTRATIVE_HEADROOM`, then returns from that discrete blocked
class to `feasible`. They are state transitions, not cooldown expiry or raw
scalar hash changes. Response dominance remains `MIXED`, so the long-horizon
interaction remains outside Gate 1F promotion criteria.


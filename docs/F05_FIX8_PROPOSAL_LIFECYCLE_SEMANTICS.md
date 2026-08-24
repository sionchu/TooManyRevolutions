# F05_FIX8 Proposal Lifecycle Semantics

## Stable demand and proposal episode

The stable demand identity is exactly:

```text
proposerFactionId + countryId + subjectKind + interventionId
```

`targetGovernmentId`, opening and response ActionRecord IDs, opening and
response Event IDs, and ticks belong to an individual proposal episode. A
`LOBBY` ActionRecord opens an episode against the Government captured at that
tick. The episode retains its opening provenance and, once resolved, its
response provenance.

`IGNORE` leaves the episode open. There is at most one open episode for a
stable demand, independent of the Government currently in office.

`ACCEPT` keeps the existing F05_FIX6 path: the response event closes the
episode and the existing intervention commitment is started with the response
event as its cause. No new proposal-specific effect is introduced.

## Explicit rejection and reconsideration

An explicit `REJECT` closes the episode and persists a reconsideration basis:

1. the episode's captured `targetGovernmentId`;
2. the current requested-intervention feasibility boolean; and
3. a sorted, unique list of discrete feasibility failure classes.

The failure classes preserve only stable categorical information. Treasury and
administrative-load numbers are not persisted. A failed prerequisite records
its index and typed prerequisite identity (`policyActive`/`policyInactive` plus
`policyId`, or `ruleEquals`/`ruleNotEquals` plus `rule`), without copying its
continuously varying scalar values.

The latest explicit rejection for a stable demand is compared with the
current Government and current requested-intervention feasibility basis at a
new authored `LOBBY` opportunity:

- unchanged Government, feasibility boolean, and failure classes: do not open
  another episode;
- a changed Government: a new episode may open against the new Government;
- a changed feasibility boolean or discrete failure-class set: a new episode
  may open;
- unrelated scalar drift, new ActionRecord IDs, repeated monthly LOBBY, and
  passage of time alone: do not open another episode.

This is a field-by-field comparison, not a raw scalar hash. Agenda and other
read-model output are not authoritative eligibility inputs.

Stale-Government rejection remains a separate response outcome and does not
create an explicit-rejection reconsideration basis. Accepted and open episodes
also never carry that basis.

## Persistence and determinism

The reconsideration basis is authoritative proposal state, so the snapshot
contract is explicitly versioned to `SerializedSimulationSnapshotV4` / format
version `4`. Version 3 is rejected; there is no hidden migration or default
basis. Decoding rejects unknown fields, invalid failure classes, non-canonical
ordering, duplicate classes, mismatched Government provenance, and a feasible
basis that still contains failure classes.

The basis is cloned by save/load, included in explicit-rejection event
provenance, and validated by runtime closure. Proposal maps and failure classes
are sorted or compared deterministically where lifecycle eligibility depends on
them. Same-tick action order remains the existing accepted ActionRecord order.


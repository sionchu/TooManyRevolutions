# TMR Current Bridge Task

TASK_ID: NONE
STATUS: WAITING_FOR_USER_NEXT
BASE_BRANCH: master

## Last reviewed task

```text
F05_FIX21: COMPLETE / REVIEWED / PASS / ACCEPTED
REVIEW_BRANCH: f05-fix21-review
REVIEW_BASE: 510e971f38b52343055285a585d851a5baae283f
REVIEWED_HEAD: 79046aa292e22ff7afb0289f8d7895ba38d8a8ab
PRIMARY_CLASSIFICATION: REBELLION_SPLIT_MINIMAL_DOMAINS_DESIGNABLE
FIRST_IMPLEMENTATION_DIRECTION: PERSISTENCE_AUTHORING_FIRST
NEXT_IMPLEMENTATION_READINESS: REBELLION_PERSISTENCE_AUTHORING_SEAM
PERSISTENCE_FORMAT: V7_UNCHANGED
```

ChatGPT independently reviewed the GitHub FIX21 diff and result. The task remained docs-only: exactly the rebellion domain-split design document and result document changed.

The accepted design keeps rebellion operational persistence separate from settlement/demobilization/suppression closure. Persistence uses scenario-owned typed operational channel/profile authoring as a future evidence allow-list, not as current evidence, a score, threshold, territorial writer, or pre-authored outcome. Settlement acceptance remains distinct from implementation/compliance/demobilization and cannot directly close a Conflict.

The accepted first implementation direction is `PERSISTENCE_AUTHORING_FIRST`: a successor task may add only the static scenario-owned rebellion persistence authoring seam and validation before any runtime episode, ActionRecord/GameEvent writer, Conflict mutation, or persistence version bump.

## Current gate

```text
GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT_STARTED
PERSISTENCE_ACCEPTED: SerializedSimulationSnapshotV7 / format version 7
F05_FIX22: NOT_AUTHORIZED
NEXT_AUTHORIZED_TASK_ID: NONE
```

No successor task is authorized until the user requests the next progression.

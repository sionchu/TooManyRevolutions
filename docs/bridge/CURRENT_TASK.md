# TMR Current Bridge Task

TASK_ID: NONE
STATUS: WAITING_FOR_USER_NEXT
BASE_BRANCH: master

## Last reviewed task

```text
F05_FIX20: COMPLETE / REVIEWED / PASS / ACCEPTED
REVIEW_BRANCH: f05-fix20-review
REVIEW_BASE: e300fb2e51435e0f1eeedc1c2dd3db006ac0c08e
REVIEWED_HEAD: 510e971f38b52343055285a585d851a5baae283f
PRIMARY_CLASSIFICATION: REBELLION_PERSISTENCE_AND_SETTLEMENT_REQUIRE_SEPARATE_DOMAINS
EXISTING_BEHAVIOR_CLASSIFICATION: PARTIAL_BUT_INCOMPLETE
NEXT_IMPLEMENTATION_READINESS: REBELLION_DOMAIN_SPLIT_REQUIRED
```

ChatGPT independently reviewed the GitHub FIX20 diff and result. The task remained docs-only: only the rebellion grounding document and result document changed. No production source/test/runtime schema or persistence implementation changed.

The accepted grounding separates political eligibility, non-territorial operational persistence, territorial projection/fronts, suppression/defeat, negotiated settlement, demobilization/loss of capacity, and temporary front absence. `NO_ACTIVE_FRONT_EDGE` is not peace and zero faction LandHex is not defeat. Current WorldState is insufficient to prove either operational persistence or durable termination.

## Current gate

```text
GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT_STARTED
PERSISTENCE_ACCEPTED: SerializedSimulationSnapshotV7 / format version 7
F05_FIX21: NOT_AUTHORIZED
NEXT_AUTHORIZED_TASK_ID: NONE
```

No successor task is authorized until the user requests the next progression.

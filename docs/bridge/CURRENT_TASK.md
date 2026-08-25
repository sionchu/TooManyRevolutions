# TMR Current Bridge Task

TASK_ID: F05_FIX23
STATUS: AUTHORIZED
BASE_IMPLEMENTATION_HEAD: e6912f2ac643079ed8347fb496b7d1d10033aa41
BASE_IMPLEMENTATION_BRANCH: f05-fix22-review
REVIEW_BRANCH: f05-fix23-review
TASK_FILE: docs/bridge/tasks/F05_FIX23.md
RESULT_PATH: docs/bridge/results/F05_FIX23_RESULT.md

## Accepted predecessor

```text
F05_FIX22: COMPLETE / REVIEWED / PASS / ACCEPTED
PRIMARY_CLASSIFICATION: REBELLION_PERSISTENCE_AUTHORING_SEAM_IMPLEMENTED
AUTHORING_SCOPE: STATIC_SCENARIO_ONLY
NEXT_IMPLEMENTATION_READINESS: REBELLION_PERSISTENCE_RUNTIME_VERTICAL_SLICE
PERSISTENCE_FORMAT: V7_UNCHANGED
```

## Mission

Implement only the minimal Rebellion Persistence runtime bootstrap slice:

```text
new T018 rebellion Conflict
+ exact authored RebellionPersistenceProfile
+ existing REBELLION_STARTED GameEvent
-> Conflict-scoped bootstrap episode identity/provenance
-> strict V8 persistence/replay
```

The episode is identity/provenance only. It does NOT prove continued operational capacity.

No operational evidence writer, collapse writer, settlement runtime, LandHex mutation, Conflict outcome writer, autonomous producer, Gate 1F PASS, or V02 is authorized.

## Execution

Codex Desktop should read `docs/bridge/tasks/F05_FIX23.md` from GitHub and continue from accepted FIX22 head `e6912f2ac643079ed8347fb496b7d1d10033aa41`.

The review branch `f05-fix23-review` already exists at that exact head.

Publish the completed implementation/result to `f05-fix23-review` and stop for ChatGPT review.

## Hard boundaries

- bootstrap only from a newly created T018 rebellion and its existing REBELLION_STARTED event;
- no auto-bootstrap from authored initial active rebellions;
- no operational evidence/collapse ActionRecord or GameEvent;
- no scalar/Region/LandHex/front/time/RNG inference;
- no `NO_ACTIVE_FRONT_EDGE -> peace`;
- no `0 faction LandHex -> defeat`;
- no settlement/demobilization runtime;
- no direct Conflict/T022/T023 writer;
- persistence advances only as required for the new authoritative bootstrap state: V8;
- no F05_FIX24 self-authorization.

Execute only `docs/bridge/tasks/F05_FIX23.md`.

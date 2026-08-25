# TMR Current Bridge Task

TASK_ID: F05_FIX22
STATUS: AUTHORIZED
BASE_IMPLEMENTATION_HEAD: 79046aa292e22ff7afb0289f8d7895ba38d8a8ab
BASE_IMPLEMENTATION_BRANCH: f05-fix21-review
REVIEW_BRANCH: f05-fix22-review
TASK_FILE: docs/bridge/tasks/F05_FIX22.md
RESULT_PATH: docs/bridge/results/F05_FIX22_RESULT.md

## Accepted predecessor

```text
F05_FIX21: COMPLETE / REVIEWED / PASS / ACCEPTED
PRIMARY_CLASSIFICATION: REBELLION_SPLIT_MINIMAL_DOMAINS_DESIGNABLE
FIRST_IMPLEMENTATION_DIRECTION: PERSISTENCE_AUTHORING_FIRST
NEXT_IMPLEMENTATION_READINESS: REBELLION_PERSISTENCE_AUTHORING_SEAM
PERSISTENCE_FORMAT: V7_UNCHANGED
```

## Mission

Implement only the static scenario-owned Rebellion Persistence authoring seam:

```text
RebellionOperationalChannelDefinition
+ RebellionPersistenceProfile
+ strict ScenarioDefinition validation
-> future evidence allow-list only
```

No runtime persistence episode/evidence, ActionRecord/GameEvent writer, Conflict outcome writer, settlement runtime, territorial writer, or persistence V8 is authorized.

## Execution

Codex Desktop should read `docs/bridge/tasks/F05_FIX22.md` from GitHub and continue from accepted FIX21 head `79046aa292e22ff7afb0289f8d7895ba38d8a8ab`.

The GitHub review branch `f05-fix22-review` already exists at that exact accepted head.

Publish the completed implementation/result to `f05-fix22-review` and stop for ChatGPT review.

## Hard boundaries

- static ScenarioDefinition authoring + validation only;
- channels are future evidence allow-lists, not current evidence;
- no score/threshold/quorum/weight/timer/random/decay;
- no Faction/Region/LandHex/front scalar inference;
- no `NO_ACTIVE_FRONT_EDGE -> peace`;
- no `0 faction LandHex -> defeat`;
- no runtime WorldState persistence field;
- no ActionRecord/GameEvent persistence writer;
- no settlement implementation;
- no LandHex/Conflict/T023 writer;
- persistence stays V7;
- no Gate 1F PASS;
- no V02;
- no F05_FIX23 self-authorization.

Execute only `docs/bridge/tasks/F05_FIX22.md`.

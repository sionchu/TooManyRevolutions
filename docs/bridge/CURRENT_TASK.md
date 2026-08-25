# TMR Current Bridge Task

TASK_ID: F05_FIX17
STATUS: AUTHORIZED
BASE_BRANCH: master
TASK_COMMIT: f4a1483802879331a81f9f4c040fa75b511dfc8f
TASK_FILE: docs/bridge/tasks/F05_FIX17.md
HANDOFF_POLICY: REMOTE_HANDOFF_ON_PASS
RESULT_PATH: docs/bridge/results/F05_FIX17_RESULT.md

## Mission summary

F05_FIX16 is reviewed/accepted as:

```text
COUP_COORDINATION_MINIMAL_DOMAIN_DESIGNABLE
NEXT_IMPLEMENTATION_READINESS: COUP_COORDINATION_AUTHORING_SEAM
```

F05_FIX17 implements **only** the static scenario-owned Coup Coordination authoring contract and deterministic validation.

Required semantic shape:

```text
CoupCoordinationNodeDefinition
  id
  countryId
  name

CoupCoordinationProfile
  countryId
  coupFactionId
  requiredNodeIds (non-empty explicit necessary-set)
  successorGovernmentId (existing same-Country Government)
```

The required-node set is authored content, not a majority/quorum/weighted score. Node names are authoring/presentation labels only.

## Preservation

- no runtime alignment state;
- no `COUP_COORDINATION_RESPONSE` action/event;
- no autonomous node-response producer;
- no coup outcome/Government-transition producer;
- no T018/T021/T022/T023 behavior change;
- no Conflict/Government/Faction runtime schema change;
- no persistence change; remain strict V6;
- no production Gate 1F coup-node content merely to manufacture reachability;
- Gate 1F remains NOT_READY; V02 remains NOT_STARTED;
- F05_FIX18 is not authorized.

## Required outcome

Exactly one:

```text
COUP_COORDINATION_AUTHORING_SEAM_IMPLEMENTED
COUP_COORDINATION_AUTHORING_SEAM_REJECTED_FOR_GATE1F
```

If implemented:

```text
NEXT_IMPLEMENTATION_READINESS: COUP_COORDINATION_RUNTIME_VERTICAL_SLICE
```

If rejected:

```text
NEXT_IMPLEMENTATION_READINESS: PIVOT_TO_REBELLION_PERSISTENCE_GROUNDING
```

## Remote Codex execution

**Do not use shell `git fetch`, `git pull`, `git push`, or GitHub CLI authentication as a prerequisite.** The repository snapshot supplied by Codex remote/cloud is the execution input.

If this `CURRENT_TASK.md` and `docs/bridge/tasks/F05_FIX17.md` are present in the supplied snapshot, execute F05_FIX17 directly. If they are absent, the remote task was started from a stale snapshot: stop that task and launch a new remote task against the current repository/branch rather than trying to repair the sandbox through direct GitHub network access.

Run the required tests/inspections from the task. After successful work, expose the result using the Codex product's normal review/handoff path available in that environment. Shell-level GitHub network access is not an acceptance criterion.

## Completion

```text
F05_FIX17: COMPLETE / AWAITING_CHATGPT_REVIEW
LAST_COMPLETED_TASK_ID: F05_FIX17
NEXT_AUTHORIZED_TASK_ID: NONE
NEXT_TASK_STATUS: WAITING_FOR_CHATGPT_REVIEW
CURRENT_TASK_FILE: NONE
GATE1F_CHATGPT_DECISION: NOT_READY
V02: NOT_STARTED
F05_FIX18: NOT_AUTHORIZED
```

Execute only `docs/bridge/tasks/F05_FIX17.md`.

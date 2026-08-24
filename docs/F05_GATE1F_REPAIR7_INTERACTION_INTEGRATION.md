# F05 Gate 1F Repair 7 — Political Interaction Long-Horizon Integration

**Date:** 2026-08-24
**Seed:** `40103`
**Horizon:** `1,800` days / five simulated years
**Scope:** developer-only integration measurement; official F05 semantics are unchanged

## 판정 요약

```text
PRIMARY CLASSIFICATION: PROPOSAL_RESPONSE_DOMINANCE_OR_CHURN
HISTORICAL_F05_BASELINE: UNCHANGED
V1_TRIGGER_CONTRACT: CLOSED
REOPEN_CHURN: PRESENT
RESPONSE_DOMINANCE: MIXED
READY_FOR_F05_PROMOTION: NO
GATE1F_RECOMMENDATION: NOT_READY
V02: NOT STARTED
```

F05_FIX7은 성공적으로 측정되었지만 Gate 1F를 통과시키지 않는다. 명시적
`REJECT`는 같은 template key를 상태 변화 없이 다시 열었고, `ACCEPT`가
일부 branch에서 실제 intervention consequence를 만들었음에도 공식
F05의 state-grounded 최대 재평가 침묵은 1,200일로 남았다.

## 계약 정리

v1 `FactionProposalTemplate.triggerAction`은 타입과 scenario validation 모두
`LOBBY`만 허용한다. 개발 fixture에는 다음 mapping 하나만 있다.

```text
t018.fixture.coup-faction + LOBBY
  -> gate1f.f04d.coercive-restriction
```

새 proposal subject, faction scalar effect, cooldown, expiry, rejection memory,
또는 production player AI는 추가하지 않았다.

같은 tick에 player intervention 전략과 proposal response가 함께 입력되면
ActionRecord 순서는 다음과 같다.

```text
START_INTERVENTION -> RESPOND_POLITICAL_PROPOSAL -> carried faction records
```

이는 input/log ordering이며 gameplay priority phase가 아니다. 이 순서는
`f05Fix7InteractionIntegration.test.ts`에서 실제 action log로 확인했다.

## Population

| Population | 조합 | Branch 수 |
|---|---|---:|
| Historical control | 6 contexts × 6 existing F05 strategies × `NO_TEMPLATE` | 36 |
| Proposal-enabled | 6 contexts × 6 existing F05 strategies × 3 response modes | 108 |
| Total | 중복 없는 전체 비교 | **144** |

Response modes는 다음처럼 deterministic developer seam으로 정의했다.

- `PROPOSAL_IGNORE`: open proposal에 response ActionProposal을 제출하지 않는다.
- `PROPOSAL_REJECT`: 새 open proposal을 다음 eligible tick에 stable
  `PoliticalProposalId` 순서로 reject한다.
- `PROPOSAL_ACCEPT_IF_FEASIBLE`: 기존 intervention feasibility를 읽고
  feasible할 때만 accept한다. infeasible하면 action을 만들지 않고 proposal을
  open 상태로 둔다.

`ACCEPT_IF_FEASIBLE` branch의 proposal response rejection은 0건이었다. 즉,
infeasible accept를 반복 제출해 `RESPONSE_REJECTED`를 만드는 방식은 사용하지
않았다.

## Historical F05 regression

공식 `pnpm run inspect:f05` 결과의 36 branch 구조를 그대로 재실행했다.

| 지표 | 결과 |
|---|---:|
| Branch 수 | 36 |
| Previous major-event silence 최대 | 1,787일 |
| State-grounded reassessment silence 최대 | 1,200일 |
| F05 recommendation | `NOT_READY` |
| Neighbor timing | 기존 EARLY/NEAR `MEANINGFUL_TIMING`, RECOVERY `STABLE` |

기준 branch는 proposal template가 없고 proposal lifecycle event가 없으며,
F05 `PACING_EVENT_TYPES` 정의도 proposal event를 포함하지 않는다.

## Proposal matrix telemetry

| Mode | Branch | Opened | Accepted | Explicit reject | Response actions | Feasibility changes | Requested start/complete | Reopen |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `PROPOSAL_IGNORE` | 36 | 18 | 0 | 0 | 0 | 181 | 0 / 0 | 0 |
| `PROPOSAL_REJECT` | 36 | 66 | 0 | 66 | 66 | 132 | 0 / 0 | **48** |
| `PROPOSAL_ACCEPT_IF_FEASIBLE` | 36 | 18 | 18 | 0 | 18 | 37 | 18 / 18 | 0 |

동일 template key가 동시에 open인 최대 수는 1이었다. `staleTargetGovernment`
reject와 proposal-response를 통한 intervention rejection은 0건이었다.

### Representative primary contexts (`WAIT` strategy)

`WAIT`는 authored `LOBBY` template를 미리 닫지 않으므로 response-mode 차이를
가장 직접적으로 보여준다. `NO_TEMPLATE`은 동일 context/strategy의 공식
F05 control이다.

| Context | Mode | Open / decision | Requested start / complete | State silence | Decision-load silence | Post-complete silence | Final treasury | Reopen |
|---|---|---|---|---:|---:|---:|---:|---:|
| `T0` | NO_TEMPLATE | - / - | - / - | 510d | - | - | -957 | 0 |
| `T0` | IGNORE | 31 / 31 | - / - | 510d | 1,031d | - | -957 | 0 |
| `T0` | REJECT | 31 / 122 | - / - | 510d | 1,678d | - | -957 | 3 |
| `T0` | ACCEPT_IF_FEASIBLE | 31 / 32 | 32 / 37 | 330d | 1,768d | 330d | -696 | 0 |
| `T18` | NO_TEMPLATE | - / - | - / - | 510d | - | - | -975 | 0 |
| `T18` | IGNORE | 13 / 13 | - / - | 510d | 1,049d | - | -975 | 0 |
| `T18` | REJECT | 13 / 104 | - / - | 510d | 1,696d | - | -975 | 3 |
| `T18` | ACCEPT_IF_FEASIBLE | 13 / 14 | 14 / 19 | 330d | 1,786d | 330d | -714 | 0 |
| `T180` | NO_TEMPLATE | - / - | - / - | 510d | - | - | -1,137 | 0 |
| `T180` | IGNORE | no proposal | - / - | 510d | 1,800d | - | -1,137 | 0 |
| `T180` | REJECT | no proposal | - / - | 510d | 1,800d | - | -1,137 | 0 |
| `T180` | ACCEPT_IF_FEASIBLE | no proposal | - / - | 510d | 1,800d | - | -1,137 | 0 |

T0 `REJECT` response ActionRecords occurred at relative ticks 32, 62, 92,
and 122; each later opening reused the same authored proposal shape. T0
`ACCEPT_IF_FEASIBLE` submitted one response at tick 32, started the existing
coercive restriction at tick 32, and completed it at tick 37. T18 has the same
sequence shifted to ticks 14 and 19.

## State-grounded versus proposal decision load

- `F05_PACING_EVENT_TYPES` remains unchanged. Proposal open/accept/reject and
  response-rejected events are not pacing events.
- Proposal-enabled maximum state-grounded reassessment silence: **1,200 days**.
- Maximum proposal-decision-load silence: **1,800 days** when a context has no
  matching open proposal; this is reported separately from state-grounded
  pacing and is not treated as a pacing repair.
- Maximum late state-grounded silence after a requested intervention completes:
  **1,110 days** across proposal-enabled branches. The requested consequence
  therefore does not establish a durable five-year reassessment cadence.

## Churn, dominance, and downstream effect

- `PROPOSAL_REJECT` reopened the identical authored key 48 times across the
  matrix after explicit rejection, without a new suppression memory. This is
  `REOPEN_CHURN: PRESENT`.
- State-grounded differences against the matching `NO_TEMPLATE` control were
  observed in 4 `IGNORE`, 4 `REJECT`, and 18 `ACCEPT_IF_FEASIBLE` branches.
  This produces `RESPONSE_DOMINANCE: MIXED`, not a universal best response.
- `ACCEPT_IF_FEASIBLE` reaches the existing intervention cost, administrative
  commitment, completion, and typed institution/faction effects. It does not
  write crisis, conflict, Government, LandHex, continuity, or terminal state
  directly.
- `IGNORE` and `REJECT` preserve the requested-intervention status quo in the
  representative WAIT branches; `REJECT` adds repeated lifecycle prompts but no
  intervention consequence.
- The interaction is meaningful in the accepted branches, but the long-horizon
  Gate-relevant silence remains, and rejection churn is observable. Therefore
  the primary classification is `PROPOSAL_RESPONSE_DOMINANCE_OR_CHURN` and
  `READY_FOR_F05_PROMOTION` is `NO`.

## Verification evidence

Commands run for this slice:

```text
pnpm exec prettier --write <touched files>
pnpm run typecheck
pnpm run inspect:f05fix7
pnpm exec vitest run src/sim/inspection/f05Fix7InteractionIntegration.test.ts --reporter=dot --silent
```

Observed results:

- typecheck: PASS;
- focused F05_FIX7 inspection: PASS, `144/144` branches;
- focused tests: PASS, 2 tests;
- historical F05 regression inside the inspection: PASS / `UNCHANGED`;
- proposal lifecycle events remain absent from the official F05 pacing set.

This document records measurement only. It does not pass Gate 1F, promote a
response policy into official F05, start V02, or authorize another task.

# P0 Event Presentation V1 결과

## 분류 규칙

분류 함수는 `EventStore.events`를 읽고 각 `GameEvent`를 하나의
`EventPresentationItem`으로 투영한다. 분류는 아래의 명시적 규칙으로만
결정하며, `priority`는 분류 이후 UI 정렬을 위한 고정 메타데이터다.

| kind | 정확한 규칙 | priority |
| --- | --- | ---: |
| `DECISION_REQUIRED` | `POLITICAL_PROPOSAL_OPENED`이고 `openingEventId`와 이벤트의 `proposalId`가 실제 `PoliticalProposal`에 일치하며, proposal `status`가 `open`이고 player country/government filter와 일치할 때만 | 4 |
| `NEWS` | `REBELLION_STARTED`, `COUP_ATTEMPT_STARTED`, `CIVIL_WAR_STARTED`, `GOVERNMENT_TRANSITIONED`, `ORDER_CONSOLIDATED`, `STATE_DISSOLVED` | 3 |
| `TOAST` | `POLICY_ENACTED`, `POLICY_REJECTED`, `INSTITUTION_RULE_CHANGED`, `INTERVENTION_STARTED`, `INTERVENTION_REJECTED`, `INTERVENTION_COMPLETED`, proposal resolution 3종, unrest/instability band 변경, `LAND_HEX_CONTROL_CHANGED`, `BORDER_CLOSED`, `BORDER_REOPENED` | 2 |
| `TOAST` | `RESOURCE_SHORTAGE_CHANGED` 중 scarcity band가 바뀌거나 절대 변화량이 `0.08` 이상인 경우 | 2 |
| `CHRONICLE_ONLY` | 위 규칙에 해당하지 않는 모든 `GameEvent`; proposal이 없거나 이미 resolved 되었거나 player filter와 맞지 않는 `POLITICAL_PROPOSAL_OPENED`도 포함 | 1 |

`ORDER_CONSOLIDATED`와 `STATE_DISSOLVED`는 각각 `NEWS` item 하나에만
`terminal: true`를 붙인다.
반란·쿠데타·정부 전환·국경·물자 부족에는 `requiresResponse`나
`proposalId`를 만들지 않는다. `requiresResponse: true`와 `proposalId`는
실제 open `PoliticalProposal`이 연결된 경우에만 출력된다.

## 구현 범위

변경 파일:

- `src/presentation/eventPresentation.ts`
- `src/presentation/eventPresentation.test.ts`
- `docs/parallel/P0_EVENT_PRESENTATION_V1_RESULT.md`

read-model은 이벤트 payload에 이미 기록된 `regionId`, `factionId`,
`countryId`, `governmentId` 계열 필드와 실제 proposal 필드만 ID 배열로
투영한다. 이벤트와 proposal은 tick/sequence/id 및 proposal id로 정렬하므로
입력 배열 순서와 무관하며, 동일 `eventId`는 한 번만 출력한다.

## canonical test 결과

`src/presentation/eventPresentation.test.ts`에서 다음 16개 assertion을
통과했다.

- routine tick → `CHRONICLE_ONLY`
- `POLICY_ENACTED` → `TOAST`
- `REBELLION_STARTED`, `COUP_ATTEMPT_STARTED`, `CIVIL_WAR_STARTED`, `GOVERNMENT_TRANSITIONED` → `NEWS`
- `STATE_DISSOLVED` → `NEWS` + `terminal: true`
- `ORDER_CONSOLIDATED` → `NEWS` + `terminal: true`
- matching open proposal → 정확히 하나의 `DECISION_REQUIRED`
- accepted/rejected proposal → decision prompt 없음
- authoritative proposal 없음 → fake decision 없음
- player country/government와 다른 open proposal → decision prompt 없음
- event/proposal insertion order 불변
- 동일 source event 중복 입력 → 하나의 item과 명시적 precedence 유지
- 작은 shortage 변화 → Chronicle-only, meaningful shortage 변화 → Toast

## 보류한 event types

- `CONFLICT_RESOLVED`는 현재 구현의 대표 payload가 `statusQuo`인 factual
  resolution이다. 정부 전환과 국가 해체에는 별도의
  `GOVERNMENT_TRANSITIONED`/`STATE_DISSOLVED` event가 있으므로, 모든 conflict
  resolution을 NEWS로 올리지 않고 Chronicle-only로 남겼다.
- `ORDER_CONSOLIDATION_STARTED`는 조건 충족 시작 기록이므로 완료 사실인
  `ORDER_CONSOLIDATED`와 구분해 Chronicle-only로 남겼다.
- `POLITICAL_PROPOSAL_OPENED`의 open authoritative match가 없는 경우,
  작은 shortage 변화, routine ideology/faction/resource/treasury/production
  변화는 notification spam을 만들지 않도록 Chronicle-only로 남겼다.

## 권위 및 integration API

production module은 `GameEvent`, `EventStore`, `PoliticalProposal`을
읽기만 하며 `EventManager`, `NotificationService`, 별도 event bus, persisted
queue, synthetic event/proposal state를 추가하지 않았다. `eventLabel()`의
한국어 copy switch도 복제하지 않았고, App playback state나 simulation
production behavior를 import하거나 수정하지 않았다.

후속 UI track은 기존 `RunRecord`에서 다음처럼 연결할 수 있다.

```ts
const items = deriveEventPresentation({
  eventStore: record.eventStore,
  politicalProposals: Object.values(record.world.politicalProposals ?? {}),
  playerCountryId: scenario.playerCountryId,
  playerGovernmentId:
    scenario.playerCountryId === null
      ? null
      : (record.world.countries[scenario.playerCountryId]
          ?.currentGovernmentId ?? null),
});
```

이 API는 presentation data만 반환한다. time pause/slow와 실제
`RESPOND_POLITICAL_PROPOSAL` action 제출은 후속 Game Flow/UI track의
책임이다.

## 검증

- `pnpm exec vitest run src/presentation/eventPresentation.test.ts --reporter=verbose` — PASS, 1 file / 16 tests
- `pnpm typecheck` — PASS
- `pnpm lint` — PASS
- `pnpm format` — PASS
- `pnpm build` — PASS
- `git diff --check` — PASS

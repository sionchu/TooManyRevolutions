# TMR Icon System 결과

## 작업 식별자

- `BASE_BRANCH`: `gamebuilders-product-surface-p0`
- `WORK_BRANCH`: `parallel-p0-icon-system`
- `BASE_SHA`: `16b3ad5b2b255e41a9b4adb73b184f8b15684939`
- `HEAD_SHA`: `fef02f01eee007bd79254d41a39a736c5c3bc595` (아이콘 구현 commit)
- `FROZEN_PRODUCTION_CODE`: `271eb18b9d713c3d639091b35aa65c2c0d780b69`

## ICON_COUNT

`42`

## ICON_IDS

### MAP / PLACE

- `tmr.icon.map.capital`
- `tmr.icon.map.city`
- `tmr.icon.map.port`
- `tmr.icon.map.mine`
- `tmr.icon.map.factory`
- `tmr.icon.map.fort`
- `tmr.icon.map.checkpoint`
- `tmr.icon.map.granary`
- `tmr.icon.map.assembly`
- `tmr.icon.map.road`
- `tmr.icon.map.trade-route`

### POLITICS

- `tmr.icon.politics.monarchy`
- `tmr.icon.politics.parliament`
- `tmr.icon.politics.election`
- `tmr.icon.politics.suffrage`
- `tmr.icon.politics.veto`
- `tmr.icon.politics.press`
- `tmr.icon.politics.censorship`
- `tmr.icon.politics.labor-organization`
- `tmr.icon.politics.property`
- `tmr.icon.politics.land-reform`

### CRISIS

- `tmr.icon.crisis.rebellion`
- `tmr.icon.crisis.coup`
- `tmr.icon.crisis.civil-conflict`
- `tmr.icon.crisis.territory-lost`
- `tmr.icon.crisis.capital-threatened`
- `tmr.icon.crisis.state-dissolution-warning`

### ACTIVITY

- `tmr.icon.activity.trade`
- `tmr.icon.activity.information`
- `tmr.icon.activity.migration`
- `tmr.icon.activity.border-closed`
- `tmr.icon.activity.border-reopened`
- `tmr.icon.activity.project-start`
- `tmr.icon.activity.project-complete`

### UI

- `tmr.icon.ui.map`
- `tmr.icon.ui.governance`
- `tmr.icon.ui.decision`
- `tmr.icon.ui.chronicle`
- `tmr.icon.ui.details`
- `tmr.icon.ui.why`
- `tmr.icon.ui.settings`
- `tmr.icon.ui.audio`

## CHANGED_FILES

- `src/presentation/design/iconRegistry.ts`
- `src/presentation/design/iconRegistry.test.ts`
- `src/presentation/design/index.ts`
- `src/app/icons/TmrIcon.tsx`
- `src/app/icons/IconGallery.tsx`
- `public/assets/tmr/icons/assembly.svg`
- `public/assets/tmr/icons/audio.svg`
- `public/assets/tmr/icons/border-closed.svg`
- `public/assets/tmr/icons/border-reopened.svg`
- `public/assets/tmr/icons/capital-threatened.svg`
- `public/assets/tmr/icons/capital.svg`
- `public/assets/tmr/icons/censorship.svg`
- `public/assets/tmr/icons/checkpoint.svg`
- `public/assets/tmr/icons/chronicle.svg`
- `public/assets/tmr/icons/city.svg`
- `public/assets/tmr/icons/civil-conflict.svg`
- `public/assets/tmr/icons/coup.svg`
- `public/assets/tmr/icons/decision.svg`
- `public/assets/tmr/icons/details.svg`
- `public/assets/tmr/icons/election.svg`
- `public/assets/tmr/icons/factory.svg`
- `public/assets/tmr/icons/fort.svg`
- `public/assets/tmr/icons/governance.svg`
- `public/assets/tmr/icons/granary.svg`
- `public/assets/tmr/icons/information.svg`
- `public/assets/tmr/icons/labor-organization.svg`
- `public/assets/tmr/icons/land-reform.svg`
- `public/assets/tmr/icons/map.svg`
- `public/assets/tmr/icons/migration.svg`
- `public/assets/tmr/icons/mine.svg`
- `public/assets/tmr/icons/monarchy.svg`
- `public/assets/tmr/icons/parliament.svg`
- `public/assets/tmr/icons/port.svg`
- `public/assets/tmr/icons/press.svg`
- `public/assets/tmr/icons/project-complete.svg`
- `public/assets/tmr/icons/project-start.svg`
- `public/assets/tmr/icons/property.svg`
- `public/assets/tmr/icons/rebellion.svg`
- `public/assets/tmr/icons/road.svg`
- `public/assets/tmr/icons/settings.svg`
- `public/assets/tmr/icons/state-dissolution-warning.svg`
- `public/assets/tmr/icons/suffrage.svg`
- `public/assets/tmr/icons/territory-lost.svg`
- `public/assets/tmr/icons/trade-route.svg`
- `public/assets/tmr/icons/trade.svg`
- `public/assets/tmr/icons/veto.svg`
- `public/assets/tmr/icons/why.svg`
- `docs/parallel/03_ICON_SYSTEM_RESULT.md`

## PROVENANCE

- 42개 모두 프로젝트 자체 작성 SVG vector이며 `CUSTOM_SVG`로 registry에 기록했다.
- 외부 asset download, commercial game icon tracing/copy, emoji, text glyph를 사용하지 않았다.
- 모든 asset은 `viewBox="0 0 24 24"` 기반의 단색 선형 silhouette이며, SVG 내부에 `<text>`, `<script>`, `<foreignObject>`, 외부 href를 포함하지 않는다.
- 공통 ink는 `#27211d`이고 색상 없이도 구별되도록 건물·경로·문서·인물·경고·방패 등의 형태와 구조를 분리했다.
- 각 definition은 stable `id`, semantic role, asset path, 기본 크기, map/UI 사용 가능 여부, LOD, 한국어 `ariaLabel`, tags, provenance를 가진다.

## 구현 요약

- `src/presentation/design/iconRegistry.ts`가 stable ID와 asset path의 단일 lookup 지점을 제공한다.
- `TmrIcon`은 stable `iconId`만 받아 registry를 통해 SVG를 표시하며 UI 코드에서 raw path를 직접 작성하지 않는다.
- `IconGallery`는 별도 route나 `App.tsx` 연결 없이 16/20/24/32/48px 샘플을 category별로 표시하는 standalone preview component다.
- map/place, politics, crisis, activity, UI를 하나의 시각 가족으로 구성하고 `mapAllowed`·`uiAllowed` metadata로 재사용 범위를 표현했다.
- 공용 bridge 문서, `App.tsx`, `PoliticalWorldStage.tsx`, `src/sim/**`, production deploy는 변경하지 않았다.

## TEST_RESULTS

실행한 명령과 결과:

- `pnpm install --frozen-lockfile` — PASS
- `pnpm exec vitest run src/presentation/design/iconRegistry.test.ts --no-file-parallelism --reporter=verbose` — PASS, 1 file / 4 tests
  - core set 및 provenance 검증
  - duplicate semantic ID / duplicate asset path 검증
  - missing asset 및 42개 SVG parse/path 존재 검증
  - malformed 또는 text-dependent SVG 거부 검증
- `pnpm exec vitest run src/presentation/design/designRegistry.test.ts src/presentation/design/contentRegistry.test.ts src/presentation/design/iconRegistry.test.ts src/presentation/mapArchitecture.test.ts src/presentation/mapVisualSystem.test.ts src/presentation/worldSceneModel.test.ts --no-file-parallelism --reporter=verbose` — PASS, 6 files / 23 tests
- `pnpm run format` — PASS
- `pnpm run typecheck` — PASS
- `pnpm run lint` — PASS
- `pnpm run build` — PASS, Vite build 완료. 기존 large-chunk warning만 출력됨.
- `git diff --check` — 결과 문서 commit 전에 최종 실행한다.

전체 `pnpm test -- --reporter=dot`는 개별 suite가 통과한 뒤 Vitest runner가 종료되지 않아 정상 완료되지 않았다. 남은 runner process는 중지했으며, 전체 suite 결과는 `NOT_COMPLETED / RUNNER_HANG`으로 기록한다. 따라서 전체 suite에 대한 PASS 판정은 하지 않는다.

## INTEGRATION_EXAMPLES

```tsx
import { TMR_ICON_IDS } from "../../presentation/design/iconRegistry";
import { TmrIcon } from "./TmrIcon";

<TmrIcon iconId={TMR_ICON_IDS.map.capital} size={32} />
<TmrIcon iconId={TMR_ICON_IDS.crisis.rebellion} size={24} decorative />
```

```tsx
import { IconGallery } from "./IconGallery";

<IconGallery />
```

실제 map/UI surface에 연결할 때는 `TMR_ICON_IDS`의 stable ID만 사용하고 `assetPath`는 registry에 위임한다. Gallery는 preview/test harness로 제공했으며 main routing은 의도적으로 건드리지 않았다.

## KNOWN_LIMITATIONS

- `App.tsx`와 `PoliticalWorldStage.tsx`가 작업 범위에서 제외되어 실제 product surface에 대한 연결은 후속 통합 작업이 필요하다.
- `IconGallery`는 standalone component이며 현재 main route에 노출하지 않았다.
- SVG는 고정 단색 ink를 사용한다. 후속 테마에서 CSS 색상 상속이 필요하면 SVG를 `currentColor` 기반으로 전환하되, 형태 기반 의미 구분은 유지해야 한다.
- registry의 `mapAllowed`·`uiAllowed`는 현재 metadata이며 컴파일 타임 surface 사용 제한은 제공하지 않는다.
- 16/20/24/32/48px의 구조적 asset 검사는 실행했지만, gallery를 브라우저 route에 연결한 새 스크린샷 기반 visual review는 이번 작업에서 실행하지 않았다.
- 전체 Vitest runner hang의 원인은 이 작업에서 변경하지 않은 기존 test runner 환경 범위로 남아 있다.
- 현재 42개는 요청된 core semantic coverage를 모두 포함한다. 실제 사용량이 축적되면 20~30개 subset으로 축소할 수 있다.

## 작업 경계

- Gate1F PASS를 선언하지 않았다.
- V02를 시작하지 않았다.
- persistence V9를 실행하지 않았다.
- production deploy를 실행하지 않았다.

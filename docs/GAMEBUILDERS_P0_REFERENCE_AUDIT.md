# GameBuilders P0 Reference Audit

**Date:** 2026-08-26  
**Purpose:** 외부 표현 원리를 검토하되 상용 게임의 art/code를 복제하지 않고,
필요한 GitHub 구현 참고는 license를 확인한 뒤 채택 여부를 결정한다.

## Commercial references — principle only

| Source | Observed principle | P0 decision |
| --- | --- | --- |
| [Suzerain official site](https://www.suzeraingame.com/) | 가상의 국가를 짧은 hook으로 제시하고, cabinet/decision framing으로 책임과 결과를 읽게 한다. | 원칙 채택: 첫 15초에 국가·문제·권한을 명시한다. art, copy, screenshot은 재사용하지 않는다. |
| [Papers, Please official site](https://papersplea.se/) | 직업/역할을 즉시 부여하고, 서류와 제한된 시각 어휘로 diegetic pressure를 만든다. | 원칙 채택: 왕실 서류 브리핑과 짧은 결정 카드. art/assets/code는 재사용하지 않는다. |
| [Crusader Kings III on Steam](https://store.steampowered.com/app/1158310/Crusader_Kings_III/) | 이웃 정치체와 heraldry가 읽히는 지도 계층, geography-first political context. | 원칙 채택: 실제 Country/Region/LandHex와 문장으로 이웃을 표시한다. 상용 이미지·문장·UI는 복사하지 않는다. |
| [Frostpunk 2 on Steam](https://store.steampowered.com/app/1601580/Frostpunk_2/) | faction pressure와 council politics를 핵심 선택 hierarchy로 만든다. | 원칙 채택: 현재 관측과 확정 효과를 decision card에서 분리한다. 상용 이미지·문장·UI는 복사하지 않는다. |

## GitHub implementation references

검토일 기준 공개 repository의 README와 license entry를 확인했다. 이번 P0에
외부 코드를 복사하거나 새 dependency로 추가하지 않았으며, 적용한 것은
구조적 원칙뿐이다.

| Repository | License evidence | Useful pattern | Adoption decision and reason |
| --- | --- | --- | --- |
| [Azgaar/Fantasy-Map-Generator](https://github.com/Azgaar/Fantasy-Map-Generator) | [MIT license](https://github.com/Azgaar/Fantasy-Map-Generator/blob/master/LICENSE) | world data, generation/editor, renderer를 분리하고 정치 경계·지명·terrain을 별도 표현한다. | **Principle adopted, code not copied.** TMR의 ScenarioDefinition/WorldState와 presentation layer를 분리하는 근거로 삼았다. |
| [Hellenic/react-hexgrid](https://github.com/Hellenic/react-hexgrid) | [MIT license](https://github.com/Hellenic/react-hexgrid/blob/master/LICENSE) | SVG 기반 coordinate/component를 독립적으로 구성한다. | **Not adopted as dependency.** 현재 authoritative axial topology에 필요한 renderer가 이미 있어, 새 dependency가 P0에 주는 이익보다 bundle/API risk가 크다. |
| [freeciv/freeciv-web](https://github.com/freeciv/freeciv-web) | [README license statement](https://github.com/freeciv/freeciv-web#the-freeciv-web-project): web client AGPL | strategy map, polity context, city/territory hierarchy. | **UX reference only.** AGPL code/assets는 import하지 않는다. 별도 AGPL 수용 결정 없이는 복사하지 않는다. |
| [pmndrs/react-three-fiber](https://github.com/pmndrs/react-three-fiber) | [MIT license](https://github.com/pmndrs/react-three-fiber/blob/master/LICENSE) | reusable renderer components and React integration. | **Audited, not adopted.** P0 surface는 stable DOM/SVG fallback이면 충분하고, 3D renderer를 추가하면 map readability와 bundle cost가 커지므로 현재 scope에 넣지 않는다. |

## Skills and package provenance

- 이 작업은 설치된 `sites-building`/`sites-hosting` skill의 운영 지침을
  사용해 기존 ChatGPT Sites를 갱신한다. 이는 repository source code나 art를
  import하는 dependency가 아니므로, 해당 skill의 license를 제품 license로
  재배포하지 않는다.
- `@openai/sites-vite-plugin`은 기존 lockfile의 build dependency이며, 이번
  P0에서 새 package를 추가하지 않는다. 실제 package metadata의 license는
  최종 dependency audit command 결과에 기록한다.
- 모든 P0 crest/faction mark는 TMR repository에서 직접 작성한 SVG다. title
  hero 하나는 2026-08-26 Codex built-in image generation으로 생성했고,
  `tmr-royal-revolution-v1` recipe와 provenance를 manifest에 기록했다. 외부
  이미지 검색 결과나 상용 게임 asset은 production bundle에 넣지 않는다.

## Adoption guardrail

외부 reference는 문제를 보는 렌즈일 뿐 TMR의 authority가 아니다. 실제
Country/Region/LandHex, ContactGraph, faction pressure, Intervention effect와
EventStore에 없는 시각 요소를 보충해 그리지 않는다. 새 외부 asset이나
dependency를 채택할 경우 manifest/lockfile/문서에 URL, exact license,
provenance, 채택 이유를 함께 추가한다.

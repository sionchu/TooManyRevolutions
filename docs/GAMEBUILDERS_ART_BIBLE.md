# TMR Visual Bible

**Product:** `내 왕국에 혁명이 너무 많다` / `TOO MANY REVOLUTIONS`  
**Style family:** `tmr-royal-revolution`  
**Status:** P0 locked visual direction

## Art direction

아르켄은 19세기 말에서 20세기 초의 산업화 초입, 헌정 위기에 놓인
판타지 왕국이다. 화면은 화려한 중세 판타지 일러스트가 아니라 왕실 문서,
정치 지도, 석판 인쇄 신문이 한 책상 위에 놓인 것처럼 보여야 한다.

- **시각 문법:** 새긴 정치 지도 + 석판 인쇄 신문/왕실 서류 + 절제된 구아슈
- **색:** 낡은 양피지, 목탄 잉크, 소박한 황동, 황토빛 들판, 산화된 남색,
  옥스블러드
- **선과 실루엣:** 멀리서도 읽히는 문장·방패·국경선. 얇은 내부선과 강한
  국가 외곽선으로 정치 지리를 먼저 읽는다.
- **빛:** 평평한 편집·지도 조명. 광택과 영화식 림 라이트를 사용하지 않는다.
- **재질:** 종이 섬유, 잉크 번짐, 작은 판화 해칭, 제한된 사용감.
- **활자:** 타이틀과 표제는 serif, 플레이어-facing Korean UI는 읽기 쉬운
  sans-serif. 생성 이미지 안에 필수 UI 문장을 넣지 않는다.

## Token palette

| Token | Value | Use |
| --- | --- | --- |
| `ink` | `#27211d` | 본문, 지도 외곽선 |
| `parchment` | `#eee2cb` | 세계 배경 |
| `paper` | `#fbf5e8` | 서류와 카드 |
| `oxblood` | `#873d38` | 아르켄, 위기, 반응 |
| `crimson` | `#b34b43` | 경보와 선택 강조 |
| `indigo` | `#405879` | 벨로리아, 수비, 정보 |
| `brass` | `#b58b3f` | 국고, 문장, 핵심 포커스 |
| `moss` | `#65745d` | 카르센, 산림/완충지 |
| `water` | `#b8c6c4` | 실제 coast 지형 |

## Composition rules

1. 지도는 화면의 가장 큰 단일 표면이다. 국가·지역·지형·수도·압력은
   서로 다른 layer로 그린다.
2. 국가는 잉크 외곽선과 옅은 tint wash로 구분한다. LandHex 격자는
   선택·hover·tactical substrate일 때만 강해진다.
3. 문장, 지명, 사건 문구, 결정 버튼은 DOM/SVG 텍스트로 둔다. 이미지에
   텍스트를 구워 넣어 수정 불가능하게 만들지 않는다.
4. 나라 문장과 세력 표식은 투명 배경의 작은 모듈이다. title hero를
   교체해도 지도나 HUD를 교체할 필요가 없어야 한다.
5. 한 화면에서 잉크 선, 양피지, 황동, 옥스블러드, 남색의 재질 어휘를
   반복한다. 새 에셋은 style family와 layer registry에 먼저 등록한다.
6. 실제 simulation이 제공하지 않는 군대, 군중, 난민, 전선, 외국 개입은
   그림으로 보충하지 않는다.

## Forbidden visual shortcuts

보라색 판타지 광택, glossy mobile-game 카드, 무작위 steampunk 기어,
anime/photorealistic medieval portrait, neon cyberpunk, glassmorphism, 가짜
3D UI, 서로 다른 생성 모델 스타일의 혼합을 사용하지 않는다. 전체 UI나
정치 지도를 한 장의 AI 배경으로 합성하지 않는다.

## Asset acceptance and replacement

모든 non-trivial production asset은
`src/presentation/design/assetManifest.ts`의 stable ID를 가진다. manifest는
파일명과 identity를 분리하고 `source`, provenance/license, version, layer,
crop policy, responsive usage, `replaceable: true`를 기록한다.

AI raster를 추가할 때 사용할 공통 recipe prefix는
`tmr-royal-revolution-v1`이다. 생성 결과에 글자 오류나 문장 흔적이 있으면
폐기하고 DOM/SVG copy를 유지한다. `v1`을 조용히 덮어쓰지 않고 새 variant
ID를 발급한다. 현재 crest와 faction mark는 프로젝트가 직접 만든 벡터이며,
`tmr.asset.title.hero.arken-crisis.v1`은 같은 palette/material/layer 계약으로
생성한 무문자 title vignette다. 생성 recipe ID와 provenance는 manifest에
고정하고, hero를 바꿔도 title copy·map·HUD는 바꾸지 않는다.

Hero recipe의 공통 지시는 다음과 같다: `tmr-royal-revolution-v1`, late
19th-century/early-industrial constitutional crisis, engraved political atlas,
lithographic newspaper plate, restrained gouache, aged parchment/charcoal/
oxblood/desaturated indigo/muted brass/moss palette, right-weighted 16:9
composition with calm left copy space, no text/letters/numbers/logos/watermark,
no purple glow/glossy UI/anime/photorealistic portrait/neon cyberpunk. 이
recipe는 이미지의 분위기만 담당하고 필수 UI 문장은 DOM/SVG가 담당한다.

## Layer contract

| z | Stable layer | Meaning |
| ---: | --- | --- |
| 00 | `tmr.layer.map.atmosphere` | 종이 대기와 배경 |
| 10 | `tmr.layer.map.terrain` | 실제 terrain별 wash/mark |
| 20 | `tmr.layer.map.political` | Country tint와 외곽 국경 |
| 30 | `tmr.layer.map.settlements` | 수도·정착지·랜드마크 |
| 40 | `tmr.layer.map.routes` | 실제 ContactGraph 경로 |
| 50 | `tmr.layer.map.pressure` | 실제 faction/territory/crisis |
| 60 | `tmr.layer.map.labels` | Country·Region 이름과 문장 |
| 70 | `tmr.layer.ui.chrome` | 국정 UI와 state strip |
| 80 | `tmr.layer.ui.overlay` | 브리핑·drawer·서류 |
| 90 | `tmr.layer.ui.fx` | 접근성·피드백·위기 stamp |

개발 중 `?designDebug=1`은 각 layer를 독립적으로 숨기거나 표시할 수 있는
구성 지점이다. 일반 플레이어 흐름에는 layer ID나 debug 용어를 노출하지
않는다.

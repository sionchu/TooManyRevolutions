# V00 Visual System & Asset Quality Check

**Status:** COMPLETE / PASS — 2026-08-22  
**Project:** TooManyRevolutions / 《내 왕국에 혁명이 너무 많다》  
**Scope:** docs / catalog / process contract only

## Result

V00은 Gate 1V 이후의 시각 결과물을 위한 공통 visual grammar와 asset/reference
quality gate를 고정했다. renderer, presentation selector, UI system, production
asset은 구현하지 않았다.

## Acceptance evidence

- [x] Core thesis: `Miniature Political World + Restrained Administrative Cartography`
- [x] Operational UI / Map Notation / Historical Artifact 분리
- [x] CountryId continuity와 regime-change visual continuity
- [x] territorial control / political influence / organization / ContactGraph / front channel
- [x] semantic channel collision rule와 color-independent political influence signal
- [x] L1/L2/L3 information hierarchy
- [x] anti-card-soup와 decoration test
- [x] explicit anti-AI-slop negative rules
- [x] simulation-fiction consistency와 presentation authority boundary
- [x] External Reference Pipeline과 traceability template
- [x] historical map/admin/military/press/economic/propaganda/UI reference categories
- [x] reference rights classification과 item-level verification rule
- [x] reference catalog와 official source seeds
- [x] asset catalog와 reference/asset 분리
- [x] downloaded/purchased/generated/custom과 accepted production의 분리
- [x] external/custom/kitbash 공통 normalization/acceptance gate
- [x] asset origin cohesion rule와 custom signature normalization
- [x] provenance manifest와 lifecycle status
- [x] AI visual direct-to-production 금지
- [x] generic donor / signature asset / primary geometry language 방향
- [x] Visual Benchmark Scene 규격과 variant 비교 원칙
- [x] Gate 1V debug-first rule
- [x] semantic zoom, orthographic/near-orthographic camera 방향
- [x] world proportion/material/palette/typography/motion 방향
- [x] responsive composition과 canonical screenshot 후보
- [x] external human critique와 optional blind comparison 방향
- [x] T024 long-run performance debt was measured by F01 and resolved for
  canonical continuation by F01A; Gate 1V benchmark remains required
- [x] Gate 1V entry checklist와 V01 이후 후보 sequence

상세 근거:

- `docs/GDD.md`의 Visual Direction cross-reference
- `docs/VISUAL_BIBLE.md`
- `docs/VISUAL_REFERENCE_CATALOG.md`
- `docs/ASSET_SOURCE_CATALOG.md`
- `docs/VISUAL_QA.md`

## Repository-grounded boundary

현재 실제 frontend는 `src/main.tsx`, `src/app/App.tsx`,
`src/styles/global.css`의 Gate 0 React status shell이다. `src/sim/`은
renderer-independent simulation source이며 현재 repository에는 Three.js/R3F,
`src/presentation/`, `derivePresentationState`, LandHex renderer가 없다.

이번 V00에서 다음을 하지 않았다.

- production renderer/R3F scene
- `derivePresentationState` 또는 presentation selector
- final UI/primitives/design token implementation
- 3D pack/texture/font download 및 import
- model conversion 또는 production asset acceptance
- Gate 1V V01 시작

## Official source seed check

2026-08-22에 다음 공식 source/license pages를 직접 확인했다.

- Library of Congress map collections
- Chronicling America
- NYPL Digital Collections rights guidance
- David Rumsey copyright/permissions
- Europeana rights statements
- KayKit Medieval Hexagon Pack
- Kenney asset/license guidance
- Quaternius FAQ/license guidance

각 entry는 source 확인과 production 사용 권리를 구분하며, external asset
후보는 모두 `CANDIDATE / NOT ACCEPTED`다. V00에서 다운로드하지 않았다.

## ADR decision

새 ADR은 만들지 않았다. presentation authority/data flow는 기존
`docs/ARCHITECTURE.md`와 기존 T017B/T024 authority/replay 계약으로 충분하다.
Visual Bible/catalog/QA는 art direction, source provenance, acceptance process를
담고 있으며, 후보 asset pack이나 색상/폰트 선택은 expensive architecture ADR이
아니다.

## Gate 1V readiness

T024 FINAL PASS, Visual Bible, semantic channel, anti-slop, reference/asset
catalog, acceptance/provenance, benchmark spec, debug-first, long-run benchmark
계획이 모두 문서화됐다. Gate 1V V01은 별도 작업으로 남겨 둔다.

## Verification

- `pnpm run format` — PASS
- `pnpm test` — PASS (41 files, 351 tests)
- `pnpm run typecheck` — PASS
- `pnpm run lint` — PASS
- production renderer/assets/UI — not implemented

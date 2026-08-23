# TMR Visual Reference Catalog — V00

**상태:** V00 catalog contract — source seed 일부 검증 완료  
**목적:** 외부 시각자료에서 원칙을 추출하고 TMR rule로 변환하기 위한 기록  
**금지:** 이 문서는 asset download 목록이나 production art authority가 아니다.

## 1. Reference와 asset의 구분

Visual reference는 “무엇을 배울 것인가”를 기록한다. External asset은
“어떤 source material을 production에 사용할 수 있는가”를 기록하며
`docs/ASSET_SOURCE_CATALOG.md`에서 별도로 관리한다.

외부 reference image 자체는 TMR design authority가 아니다. 모든 reference는
hierarchy, notation, typography principle, line grammar, composition, visual
coding 중 관찰 가능한 원칙으로 변환한 뒤 TMR rule에 연결한다.

## 2. Reference entry schema

새 항목은 최소 다음 필드를 채운다.

| Field | 기록 규칙 |
|---|---|
| Reference ID | stable ID, 예: `VR-MAP-001` |
| Source | 기관/저자/collection 이름 |
| Source Type | archive, library, museum, university, commercial game, talk 등 |
| Era | 자료가 다루는 시대 또는 `N/A` |
| Category | 아래 `VR-*` category 중 하나 이상 |
| Usage Rights | `REFERENCE_ONLY`, `DERIVATIVE_ALLOWED`, `DIRECT_ASSET_ALLOWED`, `UNKNOWN / DO NOT USE DIRECTLY` |
| Direct Production Use | V00에서는 원칙적으로 `NO`; item-level clearance가 있을 때만 후속 검토 |
| Reference Use | 어떤 연구/비교에 허용되는지 |
| What We Learn | source에서 관찰한 구체 원칙 |
| Apply to TMR | stable TMR rule 또는 future rule 후보 |
| Do Not Copy | distinctive composition, icon, wording, skin 등 |
| Verification Status | `VERIFIED_SOURCE`, `NEEDS_VERIFICATION`, `REJECTED` |
| Source URL / citation | 실제 source/rights page URL |

`VERIFIED_SOURCE`는 source와 rights 안내 페이지를 확인했다는 뜻이지,
모든 item의 production 재사용 권리를 뜻하지 않는다. item-level rights가
불명확하면 직접 사용하지 않는다.

## 3. Rights classification

### `REFERENCE_ONLY`

구성, hierarchy, notation, 정보설계, 시대적 인쇄 원칙 연구만 허용한다.
원본 image/scan/texture를 production asset으로 복사하거나 직접 삽입하지 않는다.

### `DERIVATIVE_ALLOWED`

해당 license와 attribution/조건에 따라 변형 가능하다. source, author,
license, attribution, modification history를 asset manifest에 남긴다.

### `DIRECT_ASSET_ALLOWED`

item 또는 source가 production 사용을 명확히 허용하는 경우다. 그래도 TMR
normalization과 universal acceptance gate를 통과해야 한다.

### `UNKNOWN / DO NOT USE DIRECTLY`

rights가 불명확하거나 source를 확인하지 못한 경우다. reference로만 볼 수
있으며 production에 직접 사용하지 않는다. license를 추측하지 않는다.

## 4. Supported categories

- `VR-MAP` — political, administrative, cadastral, historical city maps
- `VR-MIL` — operational maps, military situation maps, front notation
- `VR-ADMIN` — government forms, permits, administrative publications, bureaucracy
- `VR-PRESS` — newspapers, gazettes, headlines, printed hierarchy
- `VR-PROP` — political posters, propaganda, labor movement, electoral communication
- `VR-ECON` — ration cards, price notices, coupons, scarcity communication
- `VR-ARCH` — architecture proportion, civic buildings, industrial buildings
- `VR-GAME` — commercial game references; always `REFERENCE_ONLY`
- `VR-UI` — information design and interactive UI references

## 5. Preferred source classes

초기 조사 우선순위는 다음과 같다.

- Library of Congress
- NYPL Digital Collections
- Europeana
- David Rumsey Map Collection
- national archives
- museum digital collections
- university digital collections
- Wikimedia Commons, 단 item rights가 확인된 경우
- commercial games, 항상 `REFERENCE_ONLY`
- official game-development/art talks, 원칙 연구용

이 목록은 source가 자동으로 VERIFIED라는 뜻이 아니다. 실제 URL과 rights
페이지를 확인하지 못하면 `NEEDS_VERIFICATION`으로 남긴다.

## 6. Verified source seeds

아래 항목은 2026-08-22에 공식 source page를 직접 확인해 seed했다. 이미지
파일을 다운로드하거나 repository에 import하지 않았다.

### VR-MAP-001 — Library of Congress Maps Collections

| Field | Value |
|---|---|
| Source | Library of Congress, Geography and Map collections |
| Source Type | national library / digital collection |
| Era | 14th century–present, collection scope |
| Category | `VR-MAP`, `VR-ARCH`, `VR-UI` |
| Usage Rights | item-specific; collection page alone is not a production license |
| Direct Production Use | `NO` — reference use only in V00 |
| Reference Use | administrative boundaries, city plans, transportation, map printing and symbol hierarchy |
| What We Learn | map collections separate scale, place, theme, and cartographic purpose; standardized symbols can carry administrative meaning |
| Apply to TMR | `TMR-MAP-001`: front > country boundary > Region boundary > LandHex boundary; map labels follow semantic zoom |
| Do Not Copy | any specific map composition, crest, label, border ornament, or scanned texture |
| Verification Status | `VERIFIED_SOURCE` — collection page checked; item-level rights still required |
| Source URL / citation | [Library of Congress — Collections with Maps](https://www.loc.gov/maps/collections/) |

### VR-MIL-001 — Library of Congress Military Situation Maps

| Field | Value |
|---|---|
| Source | Library of Congress, World War II Military Situation Maps collection |
| Source Type | national library / military map collection |
| Era | 1944–1945 collection example |
| Category | `VR-MIL`, `VR-MAP` |
| Usage Rights | item-specific; collection access is not blanket commercial clearance |
| Direct Production Use | `NO` — study only |
| Reference Use | front hierarchy, operational annotation, movement direction, situation-map density |
| What We Learn | active operational boundaries can dominate secondary administrative lines; movement and control are distinct marks |
| Apply to TMR | `TMR-MAP-002`: active armed front uses a strong linear boundary and is derived from active Conflict plus LandHex controller differences |
| Do Not Copy | military symbols, unit notation, historical map marks, exact arrows or labels |
| Verification Status | `VERIFIED_SOURCE` — official collection index checked; individual item license remains open |
| Source URL / citation | [Library of Congress — Collections with Maps](https://www.loc.gov/maps/collections/) |

### VR-PRESS-001 — Chronicling America

| Field | Value |
|---|---|
| Source | Library of Congress / National Endowment for the Humanities, Chronicling America |
| Source Type | historical newspaper digital collection |
| Era | 1756–1963 newspaper coverage |
| Category | `VR-PRESS`, `VR-PROP`, `VR-ECON` |
| Usage Rights | item/provider-specific; inspect the item record before any reuse |
| Direct Production Use | `NO` — reference only in V00 |
| Reference Use | masthead, headline hierarchy, notices, political framing, commercial/price information |
| What We Learn | a publication gives different visual weight to headline, dispatch, notice, advertisement, and editorial perspective |
| Apply to TMR | `TMR-ARTIFACT-001`: Historical Artifact may use masthead/headline/body hierarchy, but facts and causes must come from EventStore |
| Do Not Copy | newspaper name, masthead art, article wording, scan, political slogan, or distinctive layout |
| Verification Status | `VERIFIED_SOURCE` — official collection page checked; item-level rights still required |
| Source URL / citation | [Chronicling America — Library of Congress](https://chroniclingamerica.loc.gov/institutions/dlc/titles/53/) |

### VR-ADMIN-001 — NYPL Digital Collections rights and item labeling

| Field | Value |
|---|---|
| Source | The New York Public Library, Digital Collections |
| Source Type | public library / digital collection and rights guidance |
| Era | collection-dependent |
| Category | `VR-ADMIN`, `VR-PRESS`, `VR-ARCH`, `VR-UI` |
| Usage Rights | item label governs; NYPL distinguishes “no known U.S. copyright restrictions” from other cases |
| Direct Production Use | `NO` unless a specific item is separately cleared and recorded |
| Reference Use | document metadata, item labeling, public-domain workflow, administrative artifact research |
| What We Learn | rights status should be visible as metadata and should not be inferred from mere online access |
| Apply to TMR | `TMR-PROCESS-001`: every candidate reference/asset stores source and rights status; unknown status blocks direct use |
| Do Not Copy | NYPL interface, collection branding, scans, catalog wording, or item-specific design |
| Verification Status | `VERIFIED_SOURCE` — official rights guidance checked; item-level review required |
| Source URL / citation | [NYPL Digital Collections — About](https://digitalcollections.nypl.org/about) |

### VR-MAP-002 — David Rumsey Historical Map Collection

| Field | Value |
|---|---|
| Source | David Rumsey Map Collection / David Rumsey Map Center, Stanford Libraries |
| Source Type | historical map collection / digital map viewer |
| Era | 16th–21st century collection scope |
| Category | `VR-MAP`, `VR-UI`, `VR-ARCH` |
| Usage Rights | collection and item rights vary; post-1929 material may remain copyrighted; permission may be required |
| Direct Production Use | `NO` — reference only in V00 |
| Reference Use | visual comparison, map metadata, layered/side-by-side reading, cartographic detail density |
| What We Learn | high-detail sources benefit from zoom and comparison without requiring the game map to reproduce every detail |
| Apply to TMR | `TMR-MAP-003`: semantic zoom reveals detail by meaning, not by duplicating source resolution; map notation remains restrained |
| Do Not Copy | map scans, viewer chrome, catalog layout, individual cartographer’s marks, or facsimile reproduction |
| Verification Status | `VERIFIED_SOURCE` — collection and copyright/permissions pages checked |
| Source URL / citation | [David Rumsey — Copyright and Permissions](https://www.davidrumsey.com/about/copyright-and-permissions) |

### VR-UI-001 — Europeana rights statements as information design

| Field | Value |
|---|---|
| Source | Europeana PRO, available rights statements |
| Source Type | cultural heritage aggregation / rights metadata guidance |
| Era | contemporary rights metadata standard |
| Category | `VR-UI`, `VR-ADMIN` |
| Usage Rights | rights statements describe reuse conditions; they are not a blanket license for every object |
| Direct Production Use | `NO` — process reference only |
| Reference Use | explicit rights labels, machine-readable metadata, conservative reuse workflow |
| What We Learn | “available online” and “allowed to reuse” are separate states that should remain visible |
| Apply to TMR | `TMR-PROCESS-002`: catalog status is explicit; `UNKNOWN / DO NOT USE DIRECTLY` is a valid result |
| Do Not Copy | Europeana UI, labels, branding, or object previews |
| Verification Status | `VERIFIED_SOURCE` — official guidance checked |
| Source URL / citation | [Europeana PRO — Available Rights Statements](https://pro.europeana.eu/page/available-rights-statements) |

## 7. Traceability record template

새 원칙은 다음처럼 reference observation과 TMR rule을 함께 기록한다.

```text
Reference ID: VR-MIL-001
Observation: active front has stronger visual hierarchy than a secondary boundary.
TMR Rule ID: TMR-MAP-002
Rule: front stroke > country boundary > Region boundary > LandHex boundary.
Implementation target: Gate 1V debug map / later production map.
Canonical review: pending until the benchmark scene exists.
```

## 8. Unseeded categories and future review

`VR-PROP`, `VR-ECON`, `VR-ARCH`, `VR-GAME`는 category contract를 먼저
지원한다. 개별 source를 추가할 때도 동일한 schema와 rights verification을
사용한다. Commercial game reference는 항상 `REFERENCE_ONLY`이며 distinctive
style copy를 승인하지 않는다.

외부 human critique는 Visual Benchmark Scene 이후와 Gate 5/6 polish 전에
수행한다. 질문은 “무엇이 generic AI game처럼 보이는가?”, “어떤 asset origin이
튀는가?”, “무엇을 gameplay signal로 이해했는가?”처럼 관찰 가능한 failure를
묻는다.

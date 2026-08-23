# TMR Asset Source Catalog — V00

**상태:** V00 source catalog contract — 후보 source만 기록  
**범위:** external donor와 source/license provenance 관리  
**금지:** V00에서 다운로드, import, texture/font 도입, primary pack lock, production acceptance

## 1. Asset source entry schema

| Field | 기록 규칙 |
|---|---|
| Asset Source ID | stable source ID |
| Source / Pack | 공식 pack/source 이름 |
| Author | author/studio |
| Category | environment, building, prop, character, UI 등 |
| License | 실제 official license wording/URL |
| Commercial Use | 명시된 경우만 `YES`; 불명확하면 `UNKNOWN` |
| Attribution | required/optional/not required를 source대로 기록 |
| Source URL | pack page와 license page |
| Candidate Role | `PRIMARY`, `SECONDARY`, `SIGNATURE` 후보 중 하나; 선택 확정 아님 |
| Direct Production Status | `CANDIDATE`, `VERIFIED_SOURCE`, `ACCEPTED`, `REJECTED`, `REPLACED` |
| Normalization Required | 기본값 `YES` |
| Visual Compatibility | geometry/material/proportion 검수 결과 또는 `PENDING` |
| Technical Format | source가 실제로 제공하는 format; final glTF/GLB 검증 여부 포함 |
| Verification Status | source/license 확인 상태 |

`VERIFIED_SOURCE`는 source와 license를 확인했다는 뜻이다. acceptance gate를
통과했다는 뜻이 아니다. `Downloaded`, `Purchased`, `Generated`, `Custom-made`
는 `ACCEPTED`와 동의어가 아니다.

## 2. Universal asset lifecycle

모든 external, custom, kitbash asset은 같은 절차를 거친다.

```text
CANDIDATE
  → VERIFIED_SOURCE
  → NORMALIZING
  → QA
  → ACCEPTED
```

실패하거나 교체된 source는 `REJECTED` 또는 `REPLACED`로 남긴다. 기본
normalization은 scale, proportion, geometry language, material, palette,
saturation, bevel/detail density, pivot, naming, technical format까지 포함한다.

최종 composition에서 “저건 KayKit/저건 Kenney”처럼 출처가 튀면 visual
cohesion 실패 후보다. legal provenance는 별도 manifest에서 계속 보존한다.

## 3. Candidate source entries

### ASSET-KAYKIT-MEDIEVAL-001

| Field | Value |
|---|---|
| Source / Pack | KayKit — Medieval Hexagon Pack |
| Author | Kay Lousberg |
| Category | environment, medieval buildings, hexagon map, props |
| License | Creative Commons Zero v1.0 Universal (official pack page) |
| Commercial Use | `YES` — official page states free for personal and commercial use |
| Attribution | not required by the official page; provenance record remains required |
| Source URL | [KayKit Medieval Hexagon Pack](https://kaylousberg.itch.io/kaykit-medieval-hexagon) |
| Candidate Role | `PRIMARY` candidate for Visual Benchmark comparison only |
| Direct Production Status | `CANDIDATE / NOT ACCEPTED` |
| Normalization Required | `YES` |
| Visual Compatibility | `PENDING` — low-poly/hexagon fit must be tested against TMR map notation and signature assets |
| Technical Format | official page lists FBX, GLTF, OBJ; final glTF 2/GLB validation is pending |
| Verification Status | `VERIFIED_SOURCE` — official pack/license page checked 2026-08-22 |

### ASSET-KENNEY-001

| Field | Value |
|---|---|
| Source / Pack | Kenney Game Assets / relevant environment or castle-town packs |
| Author | Kenney |
| Category | environment, buildings, props, generic system icons |
| License | Creative Commons Zero / public domain for game assets on official support page; verify the exact pack page |
| Commercial Use | `YES` for assets covered by the stated CC0 terms |
| Attribution | not required; optional credit is allowed; do not use Kenney logo as TMR branding |
| Source URL | [Kenney Game Assets All-in-1](https://kenney.itch.io/kenney-game-assets), [Kenney Support](https://kenney.nl/support) |
| Candidate Role | `SECONDARY` donor candidate; generic environment or system icon study |
| Direct Production Status | `CANDIDATE / NOT ACCEPTED` |
| Normalization Required | `YES` |
| Visual Compatibility | `PENDING` — pack-to-pack geometry and material consistency must be tested |
| Technical Format | pack-specific; final glTF 2/GLB scale, pivot, bounds, material, and budget validation pending |
| Verification Status | `VERIFIED_SOURCE` — official pack and support/license pages checked 2026-08-22 |

### ASSET-QUATERNIUS-001

| Field | Value |
|---|---|
| Source / Pack | Quaternius free medieval/environment packs |
| Author | Quaternius |
| Category | environment, buildings, props, characters |
| License | CC0 for the models according to the official FAQ |
| Commercial Use | `YES` under the stated CC0 terms |
| Attribution | not required under the official FAQ; provenance remains required |
| Source URL | [Quaternius](https://quaternius.com/), [Quaternius FAQ](https://quaternius.com/faq.html) |
| Candidate Role | `SECONDARY` donor candidate; alternate benchmark variant |
| Direct Production Status | `CANDIDATE / NOT ACCEPTED` |
| Normalization Required | `YES` |
| Visual Compatibility | `PENDING` — proportion, bevel, material density, and origin cohesion must be tested |
| Technical Format | pack-specific; final glTF 2/GLB validation pending |
| Verification Status | `VERIFIED_SOURCE` — official catalog/FAQ checked 2026-08-22 |

## 4. Candidate selection rule

V00은 위 source 중 어느 것도 final primary geometry language로 선택하지 않는다.
선택 시점은 Gate 1V Visual Benchmark Scene evaluation 이후다.

- `PRIMARY GEOMETRY LANGUAGE`: 하나의 chosen source/style grammar
- `SECONDARY DONOR`: 필요한 geometry만 보조
- `SIGNATURE`: custom 또는 강한 kitbash/normalization

Palace, parliament, revolutionary headquarters, signature harbor, major mine,
government administration building, faction token, banner, seal, barricade,
checkpoint, protest/strike/ration signal은 custom 우선 검토 대상이다.

## 5. Universal acceptance gate

어떤 source든 다음을 통과하기 전에는 production에 넣지 않는다.

### Visual

- game-scale silhouette와 proportion
- geometry language, bevel/roundness, detail density
- material language, roughness/metalness, saturation, value range
- TMR palette fit과 shadow behavior

### World proportion

human, tree, ordinary house, civic building, palace/parliament, wall,
fortification, cart, ship의 상대 비율이 같은 세계처럼 보이는가.

### Gameplay

- gameplay role, landmark role, decoration role
- 어떤 semantic channel을 표현하는지
- simulation에 없는 signal/entity를 암시하지 않는지

### Technical

- glTF 2 validity
- scale, pivot, bounds, node/name hygiene
- stray camera/light/node 여부
- triangle/material/texture budget

정확한 숫자 budget과 Khronos glTF Validator/glTF Transform 도입 여부는
Gate 4에서 결정한다.

### Legal

- source, author, license, commercial use, attribution
- source URL, original file reference
- modification history와 normalized by

`UNKNOWN` license는 직접 ship하지 않는다.

## 6. Provenance manifest

production 후보마다 다음을 기록한다.

```text
Asset ID
Name
Source Type: CUSTOM | KITBASH | EXTERNAL | AI_CONCEPT_DERIVED
Source
Author
License
Commercial use
Attribution
Source URL
Original file reference
Modifications
Normalized by
Acceptance status
```

AI concept는 `AI_CONCEPT_DERIVED`로 provenance를 남기며, human selection,
rebuild/normalization, universal acceptance를 거치지 않은 AI output은
production asset이 될 수 없다.

## 7. V00 acquisition boundary

이번 task에서는 다음을 하지 않았다.

- 3D pack download
- repo asset import
- texture/font import
- production model conversion
- primary source/winner selection
- asset acceptance

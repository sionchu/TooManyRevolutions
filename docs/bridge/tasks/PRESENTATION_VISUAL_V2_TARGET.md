# PRESENTATION VISUAL V2 — TARGET COMPOSITION

Status: ACTIVE VISUAL TARGET

This is the single visual composition target for the V2 implementation. It is intentionally more specific than generic style words.

## Desktop Day 0 target — 1440x900

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ crest  아르켄 왕국                     1897.04.01             ⏸ ▶ 1x 2x 3x │
│        정권은 바뀌어도 국가는 계속된다                  국고 여유 · 불안 낮음 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                           mountain / upland relief                            │
│                    ╱╲                                                        │
│             forest mass                    FRONTIER                           │
│                                                                              │
│                      CAPITAL                                                 │
│                 town footprint                                               │
│                          ╲ actual route                                       │
│                           ╲                                                   │
│                            INDUSTRIAL                                         │
│                                                                              │
│      water / coast                                                            │
│                                                                              │
│  current pressure: 철산 노동자회의 정치 압력               factual map alert │
│                                                                              │
│              지도        결정 3        제도        연대기                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

Required visual impression:

- the land has height, slope and material; it is not a translucent colored blob;
- water/coast provides a geographic edge;
- three hero places feel embedded in terrain;
- labels are few and readable;
- the UI is quiet enough that the map is the first read;
- gold is an accent, not the outline of every object;
- borders/corners are restrained, not a universal rounded-card language.

## Desktop Decision target

```text
┌────────────────────────────── MAP ~65–72% ───────────────┬──────────────────┐
│                                                          │ 결정              │
│                                                          │                  │
│                         WORLD                            │ 식량 생산능력 보강 │
│                                                          │ 물자 부족 대응     │
│                                                          │ 결과: 공급 완화    │
│                                                          │ [실행]            │
│                                                          │ ────────────────  │
│                                                          │ 정치적 타협        │
│                                                          │ 긴장 완화          │
│                                                          │ [실행]            │
│                                                          │                  │
├──────────────────────────────────────────────────────────┴──────────────────┤
│             지도        결정        제도        연대기       ▶ 1x 2x 3x      │
└──────────────────────────────────────────────────────────────────────────────┘
```

Decision rows are not generic cards. Use separators, typography, state accents and whitespace.

## Rebellion target

A factual rebellion should first change the **world**:

- crisis territory/front is clearly visible near its actual location;
- red is concentrated there;
- one major news treatment appears, not a pile of toasts;
- playback visibly slows but keeps running;
- the rest of the map dims slightly rather than receiving more overlays.

## Institutions target

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ 제도                                                          [지도 돌아가기] │
│                                                                              │
│ 권력       ●──────●────────────●                                              │
│                     ╲                                                        │
│ 대표       ●─────────●────────●                                               │
│                                                                              │
│ 재산       ●──────●──────●                           ┌─────────────────────┐ │
│                                                     │ selected institution │ │
│ 노동       ●──────●──────────●                      │ title               │ │
│                                                     │ effect              │ │
│ 정보       ●─────────●──────●                       │ prerequisite        │ │
│                                                     │ [enact if allowed]  │ │
│                                                     └─────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

Node default content: title + short state. Detail moves to inspector. The graph itself is the dominant structure.

## Chronicle target

Use an editorial historical timeline, not equal cards:

```text
1897.05.01  ━━━ 반란 발생 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              철산에서 조직된 봉기가 시작됨

1897.04.27      국가 불안 단계 변화
1897.04.19      노동 조직 관련 제도 변화
1897.04.01  ━━━ 새 정부 출범 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Major events receive typographic weight. Minor events are rows on one continuous timeline.

## Mobile Map target — 390x844

```text
┌─────────────────────┐
│ crest 아르켄 왕국    │
│ 1897.04.01     ▶ 1x │
├─────────────────────┤
│                     │
│                     │
│        WORLD        │
│                     │
│  capital  industry  │
│                     │
│  current pressure   │
│                     │
├─────────────────────┤
│ 지도  결정  제도 기록│
│      ▶ 1x 2x 3x     │
└─────────────────────┘
```

No separate stacked camera bar + pressure bar + nav + metrics + playback bar.

## Mobile Decisions target

Decision sheet replaces the lower HUD region while open. It does not stack on top of playback controls.

```text
┌─────────────────────┐
│ compact world context│
│                     │
├─────────────────────┤
│ 지금 결정할 일   [×] │
│                     │
│ 식량 생산능력 보강   │
│ 공급 압력 대응       │
│ [실행]              │
│ ─────────────────── │
│ 정치적 타협          │
│ [실행]              │
└─────────────────────┘
```

## Palette direction

World substrate:

- deep water: `#263b3c`
- shallow/coast: `#426568`
- plains: `#72765b`
- forest mass: `#485c46`
- hills: `#756b52`
- mountain rock: `#666761`
- ground/road accent: `#a18a61`

UI:

- transparent charcoal: `rgba(18,20,18,0.86)`
- primary text: warm ivory `#f0e7d4`
- secondary text: `#b8b09f`
- selection/authority accent: muted gold `#c99a4c`
- crisis only: `#b84f45`

These are direction tokens, not mandatory literal constants. Maintain restrained saturation and coherent contrast.

## Shape language

- main world frame may have one subtle boundary;
- buttons: small radius, no inflated pill styling;
- lists use dividers before boxes;
- only overlays/sheets need a strong surface background;
- no border around every metric, label, event and row;
- no glassmorphism stacks.

## Visual success question

Before moving on from any phase, open the screenshot and answer:

> If all text were removed, would this still look like a political strategy game world rather than a web dashboard with 3D models pasted onto it?

If the answer is no, the phase is not complete.
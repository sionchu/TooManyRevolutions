import type { InterventionId } from "../../sim/state/ids";

export const PRODUCT_IDENTITY = {
  koTitle: "내 왕국에 혁명이 너무 많다",
  enTitle: "TOO MANY REVOLUTIONS",
  tagline: "정권은 무너져도, 국가는 계속된다.",
} as const;

export const PLAYER_COPY = {
  title: {
    eyebrow: "아르켄 왕국 · 헌정 위기 기록",
    hook: "국가의 연속성을 맡아, 흔들리는 질서의 다음 수를 결정하십시오.",
    action: "새 게임",
    secondary: "이 세계는?",
    worldNoteTitle: "연속성의 무대",
    worldNote:
      "아르켄 왕국과 두 접경국의 국경, 도시, 생산 경로가 하나의 정치 지도로 이어집니다. 보이는 변화는 현재 국가 기록에서 읽어냅니다.",
    footer: "법을 바꾸면 이해관계가 움직입니다. 기다림도 하나의 선택입니다.",
  },
  briefing: {
    label: "왕실 서류 · 1897년 4월",
    skip: "브리핑 건너뛰기",
    next: "다음 서류",
    finish: "국정 시작",
    remember: "다시 보지 않기",
    beats: [
      {
        eyebrow: "01 · 국가",
        title: "아르켄 왕국은 살아남았지만 질서는 흔들리고 있다.",
        body: "왕실의 명령은 수도를 떠나면 늦어집니다. 이 국가는 한 사람의 운명이 아니라, 계속 이어지는 제도와 생활의 기록입니다.",
      },
      {
        eyebrow: "02 · 물자",
        title: "철산 공업주의 생산은 국고보다 빨리 무너진다.",
        body: "곡물 수요와 산업 생산의 간극이 커졌습니다. 긴급 배급은 생산능력을 살릴 수 있지만, 국고와 행정 여력을 먼저 묶습니다.",
      },
      {
        eyebrow: "03 · 세력",
        title: "국가 수비 평의회와 철산 노동자회가 서로 다른 출구를 요구한다.",
        body: "한쪽의 양보가 다른 쪽의 불안을 키울 수 있습니다. 표시되는 효과는 확정되지만, 다음 반응은 현재 상태에서 다시 발생합니다.",
      },
      {
        eyebrow: "04 · 국경",
        title: "벨로리아와 카르센은 국경 너머에서 아르켄을 지켜본다.",
        body: "무역과 정보의 경로는 지도 위에 남습니다. 당신의 권한은 제도를 바꾸고, 시간을 조절하고, 그 결과를 읽는 데 있습니다.",
      },
    ],
  },
  main: {
    continuity: "국가 연속성 기록",
    mapEyebrow: "정치 지도",
    mapTitle: "아르켄과 접경국",
    actionsEyebrow: "결정 서류",
    actionsTitle: "결정",
    agendasEyebrow: "현재 압력",
    agendasTitle: "국가 의제",
    chronicleEyebrow: "오늘의 기록",
    chronicleTitle: "연대기",
    certainty: "확정",
    observation: "현재 관측",
    uncertain: "반응은 미확정",
    opportunityCost: "기회비용",
    waitingCost: "기다림의 비용",
    affected: "영향을 받는 곳",
    noPrediction: "미래 반응을 확률로 약속하지 않습니다.",
  },
  metrics: {
    treasury: "국고",
    legitimacy: "정통성",
    stateCapacity: "국가역량",
    instability: "불안",
    stateContinuity: "국가 존속",
  },
  navigation: {
    map: "지도",
    decisions: "결정",
    institutions: "제도",
    chronicle: "연대기",
  },
} as const;

export const PROHIBITED_PLAYER_COPY = [
  "Renderer-neutral",
  "LandHex projection",
  "ActionRecord",
  "authoritative history",
  "T018",
  "RunOutcome",
  "fixture.",
] as const;

export const INTERVENTION_COPY: Readonly<
  Record<
    InterventionId,
    { readonly short: string; readonly stakeholder: string }
  >
> = {};
